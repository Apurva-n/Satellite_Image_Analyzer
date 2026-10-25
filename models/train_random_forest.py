"""
Satellite Image Analyzer — Lightweight Multispectral Classifier Training (Phase 4)

Trains a supervised classifier on multispectral Sentinel-2 features:
- Optical Reflectance: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR-1), B12 (SWIR-2)
- Biophysical Indices: NDVI, NDWI, NDBI
- Classes: Water Bodies, Trees/Forest, Cropland, Urban/Built-up, Barren Soil

Executes in < 3 seconds on any CPU without external GPU or C++ DLL dependencies.
"""

import os
import sys
import json
import time
import io
import math
import random

# Ensure clean UTF-8 console output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CLASSES = [
    {"id": 0, "name": "Water Bodies", "color": "#419bdf"},
    {"id": 1, "name": "Trees & Dense Forest", "color": "#2d6a4f"},
    {"id": 2, "name": "Cropland & Agriculture", "color": "#70e000"},
    {"id": 3, "name": "Urban & Built-up", "color": "#d90429"},
    {"id": 4, "name": "Barren Soil & Rock", "color": "#ddb892"},
]


def generate_sentinel_spectral_dataset(num_samples=2500):
    """
    Synthesizes calibrated Sentinel-2 surface reflectance observations
    across all 5 Land Use / Land Cover categories.
    """
    random.seed(42)
    X = []
    y = []

    # Mean reflectance signatures: [B2, B3, B4, B8, B11, B12]
    base_signatures = {
        0: [0.08, 0.05, 0.03, 0.01, 0.005, 0.002],  # Water: absorbed NIR/SWIR
        1: [0.02, 0.04, 0.03, 0.45, 0.12, 0.05],    # Forest: High NIR, low red
        2: [0.04, 0.09, 0.06, 0.32, 0.18, 0.10],    # Cropland: Moderate NIR, low red
        3: [0.15, 0.18, 0.22, 0.20, 0.28, 0.24],    # Urban: Concrete high SWIR & Visible
        4: [0.12, 0.16, 0.24, 0.22, 0.34, 0.30],    # Barren Soil: High Red & SWIR
    }

    for _ in range(num_samples):
        cls_id = random.randint(0, 4)
        base = base_signatures[cls_id]
        
        # Add realistic sensor noise (+- 5%)
        b2 = max(0.001, base[0] + random.gauss(0, 0.012))
        b3 = max(0.001, base[1] + random.gauss(0, 0.014))
        b4 = max(0.001, base[2] + random.gauss(0, 0.015))
        b8 = max(0.001, base[3] + random.gauss(0, 0.035))
        b11 = max(0.001, base[4] + random.gauss(0, 0.025))
        b12 = max(0.001, base[5] + random.gauss(0, 0.020))

        # Engineered remote sensing indices
        ndvi = (b8 - b4) / (b8 + b4 + 1e-6)
        ndwi = (b3 - b8) / (b3 + b8 + 1e-6)
        ndbi = (b11 - b8) / (b11 + b8 + 1e-6)

        features = [b2, b3, b4, b8, b11, b12, ndvi, ndwi, ndbi]
        X.append(features)
        y.append(cls_id)

    return X, y


class SpectralDecisionTree:
    """
    Fast decision tree classifier trained on multispectral feature vectors.
    """
    def __init__(self, max_depth=5):
        self.max_depth = max_depth
        self.tree = None

    def _gini(self, y):
        counts = {}
        for item in y:
            counts[item] = counts.get(item, 0) + 1
        n = len(y)
        return 1.0 - sum((cnt / n) ** 2 for cnt in counts.values())

    def _best_split(self, X, y):
        best_gain = 0.0
        best_feat = None
        best_thresh = None
        n = len(y)
        current_gini = self._gini(y)

        # Sample feature candidates
        n_features = len(X[0])
        for feat in range(n_features):
            values = sorted(set(X[i][feat] for i in range(n)))
            # Sample thresholds
            step = max(1, len(values) // 15)
            for val in values[::step]:
                y_left = [y[i] for i in range(n) if X[i][feat] <= val]
                y_right = [y[i] for i in range(n) if X[i][feat] > val]

                if not y_left or not y_right:
                    continue

                p_left = len(y_left) / n
                gain = current_gini - (p_left * self._gini(y_left) + (1 - p_left) * self._gini(y_right))
                if gain > best_gain:
                    best_gain = gain
                    best_feat = feat
                    best_thresh = val

        return best_feat, best_thresh

    def _build_tree(self, X, y, depth=0):
        # Majority class
        counts = {}
        for item in y:
            counts[item] = counts.get(item, 0) + 1
        majority = max(counts.items(), key=lambda k: k[1])[0]

        if depth >= self.max_depth or len(set(y)) == 1 or len(y) < 10:
            return {"leaf": True, "class": majority}

        feat, thresh = self._best_split(X, y)
        if feat is None:
            return {"leaf": True, "class": majority}

        left_idx = [i for i in range(len(y)) if X[i][feat] <= thresh]
        right_idx = [i for i in range(len(y)) if X[i][feat] > thresh]

        X_left, y_left = [X[i] for i in left_idx], [y[i] for i in left_idx]
        X_right, y_right = [X[i] for i in right_idx], [y[i] for i in right_idx]

        return {
            "leaf": False,
            "feature": feat,
            "threshold": thresh,
            "left": self._build_tree(X_left, y_left, depth + 1),
            "right": self._build_tree(X_right, y_right, depth + 1)
        }

    def fit(self, X, y):
        self.tree = self._build_tree(X, y)

    def _predict_one(self, node, x):
        if node["leaf"]:
            return node["class"]
        if x[node["feature"]] <= node["threshold"]:
            return self._predict_one(node["left"], x)
        return self._predict_one(node["right"], x)

    def predict(self, X):
        return [self._predict_one(self.tree, x) for x in X]


def train_and_evaluate():
    print("=" * 65)
    print("[*] SATELLITE IMAGE ANALYZER — MULTISPECTRAL MODEL TRAINING")
    print("=" * 65)

    print("\n[Step 1] Synthesizing Calibrated Sentinel-2 Multi-Band Observations...")
    X, y = generate_sentinel_spectral_dataset(num_samples=2500)
    
    # 80/20 Train/Test Split
    split = int(0.8 * len(X))
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]

    print(f"    Total Samples: {len(X)} | Training: {len(X_train)} | Testing: {len(X_test)}")
    print(f"    Features: 6 Spectral Bands (B2, B3, B4, B8, B11, B12) + 3 Indices (NDVI, NDWI, NDBI)")

    print("\n[Step 2] Training Decision Tree Classifier...")
    t0 = time.time()
    model = SpectralDecisionTree(max_depth=6)
    model.fit(X_train, y_train)
    elapsed = time.time() - t0
    print(f"    Training completed in {elapsed:.3f} seconds!")

    print("\n[Step 3] Model Evaluation on Unseen Validation Data:")
    predictions = model.predict(X_test)
    correct = sum(1 for p, actual in zip(predictions, y_test) if p == actual)
    accuracy = (correct / len(y_test)) * 100.0

    print(f"    Overall Test Accuracy: {accuracy:.2f}%")

    print("\n    Class-by-Class Performance Breakdown:")
    for cls in CLASSES:
        c_id = cls["id"]
        true_pos = sum(1 for p, a in zip(predictions, y_test) if p == c_id and a == c_id)
        total_actual = sum(1 for a in y_test if a == c_id)
        total_pred = sum(1 for p in predictions if p == c_id)

        precision = (true_pos / total_pred * 100) if total_pred > 0 else 0
        recall = (true_pos / total_actual * 100) if total_actual > 0 else 0

        print(f"    [{c_id}] {cls['name']:<24}: Precision: {precision:>5.1f}% | Recall: {recall:>5.1f}% | Support: {total_actual}")

    # Save model artifact
    output_path = "models/landcover_decision_tree.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model.tree, f, indent=2)
    print(f"\n[+] Trained model saved to: {output_path}")

    print("\n" + "=" * 65)
    print("[SUCCESS] MODEL TRAINING & VALIDATION PIPELINE COMPLETE!")
    print("=" * 65)


if __name__ == "__main__":
    train_and_evaluate()
