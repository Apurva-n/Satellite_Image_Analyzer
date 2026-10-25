"""
Satellite Image Analyzer — Local PyTorch Model Training Pipeline (Phase 4)

Trains a Convolutional Neural Network (CNN) on multispectral Sentinel-2 patches
for Land Use / Land Cover (LULC) classification.

Usage:
    python models/train_local_model.py --epochs 5 --batch-size 32
"""

import os
import sys
import argparse
import time
import numpy as np

# Ensure clean UTF-8 console output on Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 5 Core LULC Classes
CLASSES = [
    "Water Bodies",
    "Trees & Dense Forest",
    "Cropland & Agriculture",
    "Urban & Built-up",
    "Barren Soil & Rock"
]
NUM_CLASSES = len(CLASSES)


# =====================================================================
# 1. Convolutional Neural Network Architecture
# =====================================================================
class LandCoverCNN(nn.Module):
    """
    Multispectral Convolutional Neural Network with Batch Normalization
    and Dropout for robust land cover classification from Sentinel-2 patches.
    """
    def __init__(self, in_channels: int = 4, num_classes: int = 5):
        super(LandCoverCNN, self).__init__()
        
        # Block 1: Low-level edges & spectral feature extraction
        self.conv_block1 = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)  # 64x64 -> 32x32
        )
        
        # Block 2: Textures & spatial patterns
        self.conv_block2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)  # 32x32 -> 16x16
        )
        
        # Block 3: High-level semantic features
        self.conv_block3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((4, 4))            # Invariant pooling -> 4x4
        )
        
        # Classification Head
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.35),
            nn.Linear(128, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv_block1(x)
        x = self.conv_block2(x)
        x = self.conv_block3(x)
        logits = self.classifier(x)
        return logits


# =====================================================================
# 2. Dataset Loader (Sentinel-2 Patches & Benchmarks)
# =====================================================================
class SyntheticSentinelDataset(Dataset):
    """
    Generates realistic Sentinel-2 multispectral patches (B4 Red, B3 Green, B2 Blue, B8 NIR)
    based on true physical reflectance profiles for each land cover category.
    """
    def __init__(self, num_samples: int = 1000, patch_size: int = 64):
        self.num_samples = num_samples
        self.patch_size = patch_size
        self.samples = []
        self.labels = []
        
        rng = np.random.RandomState(42)
        
        # Base spectral reflectance signatures [Red, Green, Blue, NIR]
        signatures = {
            0: [0.03, 0.05, 0.08, 0.02],  # Water: High Blue, very low NIR
            1: [0.04, 0.08, 0.03, 0.45],  # Forest: Very high NIR (chlorophyll)
            2: [0.07, 0.12, 0.05, 0.35],  # Cropland: Moderate Red, high NIR
            3: [0.22, 0.20, 0.18, 0.20],  # Urban: High Red/Green/Blue concrete
            4: [0.25, 0.22, 0.19, 0.24]   # Barren Soil: High overall reflectance
        }
        
        for i in range(num_samples):
            cls_id = rng.randint(0, NUM_CLASSES)
            base = np.array(signatures[cls_id])
            
            # Add spatial texture and noise
            noise = rng.normal(0, 0.03, (4, patch_size, patch_size))
            patch = base[:, None, None] + noise
            patch = np.clip(patch, 0.0, 1.0).astype(np.float32)
            
            self.samples.append(patch)
            self.labels.append(cls_id)
            
        self.samples = np.array(self.samples)
        self.labels = np.array(self.labels, dtype=np.int64)

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        return torch.tensor(self.samples[idx]), torch.tensor(self.labels[idx])


# =====================================================================
# 3. Training & Evaluation Pipeline
# =====================================================================
def train_model(epochs: int = 5, batch_size: int = 32, lr: float = 0.001, output_path: str = "models/landcover_cnn.pth"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Device: {device}")
    if device.type == "cuda":
        print(f"    GPU: {torch.cuda.get_device_name(0)}")

    print(f"[*] Initializing Dataset (1,200 Sentinel-2 patches, 64x64, 4-bands: R, G, B, NIR)...")
    dataset = SyntheticSentinelDataset(num_samples=1200, patch_size=64)
    
    # 80/20 Train/Validation Split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
    print(f"    Train Samples: {train_size} | Validation Samples: {val_size}")
    print(f"    Classes: {', '.join(CLASSES)}")

    # Initialize Model, Loss, Optimizer
    model = LandCoverCNN(in_channels=4, num_classes=NUM_CLASSES).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    print("\n[*] Starting Training Loop:")
    start_time = time.time()
    best_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            total_train += labels.size(0)
            correct_train += (predicted == labels).sum().item()

        scheduler.step()
        train_loss = running_loss / total_train
        train_acc = (correct_train / total_train) * 100.0

        # Validation Loop
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                total_val += labels.size(0)
                correct_val += (predicted == labels).sum().item()

        val_loss = val_loss / total_val
        val_acc = (correct_val / total_val) * 100.0

        if val_acc > best_acc:
            best_acc = val_acc
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            torch.save(model.state_dict(), output_path)

        print(f"Epoch [{epoch:>2}/{epochs:>2}] | "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:>5.1f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:>5.1f}% | "
              f"LR: {scheduler.get_last_lr()[0]:.5f}")

    total_time = time.time() - start_time
    print(f"\n[+] Training Complete in {total_time:.1f}s!")
    print(f"    Best Validation Accuracy: {best_acc:.2f}%")
    print(f"    Saved Model Weights to: {output_path}")

    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Land Cover CNN Model")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs to train")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output", type=str, default="models/landcover_cnn.pth", help="Checkpoint output path")
    args = parser.parse_args()

    train_model(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, output_path=args.output)
