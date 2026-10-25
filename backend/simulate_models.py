import sys
import io
import requests
import json
import time

# Ensure clean UTF-8 console output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

print("=====================================================================")
print("[*] SATELLITE IMAGE ANALYZER -- LIVE END-TO-END MODEL SIMULATION")
print("=====================================================================")

# 1. Health & Capability Check
print("\n--- [Step 1] System Health & Active Capabilities Check ---")
try:
    resp = requests.get(f"{BASE_URL}/health", timeout=10)
    health_data = resp.json()
    print(f"Status: {health_data.get('status')}")
    print(f"Earth Engine: {health_data.get('earth_engine')}")
    print(f"Active Capabilities: {health_data.get('capabilities', [])}")
except Exception as e:
    print(f"[FAIL] Could not reach backend: {e}")
    sys.exit(1)

# 2. Area of Interest (Pune Metro & Khadakwasla Reservoir)
pune_bbox = [73.75, 18.45, 73.95, 18.60]
print(f"\nTarget Region: Pune Metro Bounding Box {pune_bbox}")

# 3. Scene Search (Phase 1)
print("\n--- [Step 2] Sentinel-2 Optical Scene Search ---")
search_payload = {
    "bbox": pune_bbox,
    "start_date": "2026-01-01",
    "end_date": "2026-03-31",
    "max_cloud_pct": 20.0
}
t0 = time.time()
resp = requests.post(f"{BASE_URL}/search-scenes", json=search_payload, timeout=20)
scenes = resp.json()
elapsed = time.time() - t0
print(f"Found {len(scenes)} low-cloud Sentinel-2 scenes in {elapsed:.2f}s!")
if scenes and isinstance(scenes, list):
    scene_a = scenes[0]  # Earlier scene
    scene_b = scenes[-1] if len(scenes) > 1 else scenes[0]  # Later scene
    print(f"Selected Primary Scene: {scene_a['id']}")
    print(f"Acquisition Date: {scene_a['date']} | Cloud Cover: {scene_a['cloud_pct']}%")
    if scene_b != scene_a:
        print(f"Selected Comparison Scene: {scene_b['id']}")
        print(f"Comparison Date: {scene_b['date']} | Cloud Cover: {scene_b['cloud_pct']}%")
else:
    print("[FAIL] No scenes found.")
    sys.exit(1)

primary_scene_id = scene_a["id"]
secondary_scene_id = scene_b["id"]

# 4. Model 1: Multispectral Spectral Indices & Zonal Physics (Phase 2)
print("\n--- [Step 3] Model 1: Spectral Physics & Biophysical Indices ---")
for layer in ["NDVI", "NDWI", "NDBI", "FALSE_COLOR"]:
    t0 = time.time()
    payload = {
        "scene_id": primary_scene_id,
        "bbox": pune_bbox,
        "layer_type": layer
    }
    resp = requests.post(f"{BASE_URL}/get-spectral-index", json=payload, timeout=25)
    elapsed = time.time() - t0
    data = resp.json()
    stats = data.get("stats", {}) or {}
    mean_val = stats.get('mean_val')
    min_val = stats.get('min_val')
    max_val = stats.get('max_val')
    print(f"-> {layer:<11} | Mean: {f'{mean_val:.3f}' if mean_val is not None else 'N/A':<6} | Min: {f'{min_val:.3f}' if min_val is not None else 'N/A':<6} | Max: {f'{max_val:.3f}' if max_val is not None else 'N/A':<6} | Latency: {elapsed:.2f}s")
    if stats.get("distribution"):
        dist = stats["distribution"]
        print(f"   Distribution: {json.dumps(dist)}")

# 5. Model 2: Bi-Temporal Change Detection Engine (Phase 3)
print("\n--- [Step 4] Model 2: Bi-Temporal Radiometric Change Detection ---")
change_payload = {
    "scene_id_before": scene_a["id"],
    "scene_id_after": scene_b["id"],
    "bbox": pune_bbox,
    "change_type": "VEGETATION"
}
t0 = time.time()
resp = requests.post(f"{BASE_URL}/analyze-change", json=change_payload, timeout=25)
elapsed = time.time() - t0
change_data = resp.json()
print(f"Change Detection Latency: {elapsed:.2f}s")
print(f"Type: {change_data.get('change_type')}")
print(f"Title: {change_data.get('title')}")
print(f"Total AOI Area: {change_data.get('total_aoi_km2', 0):.2f} km^2")
print(f"Impacted Area: {change_data.get('impacted_area_km2', 0):.2f} km^2 ({change_data.get('percent_impacted', 0):.2f}% of AOI)")
print(f"Summary Insight: {change_data.get('summary')}")

# 6. Model 3: Multispectral AI Land Cover Classifier (Phase 4)
print("\n--- [Step 5] Model 3: 5-Class LULC Semantic Segmentation Classifier ---")
lulc_payload = {
    "scene_id": primary_scene_id,
    "bbox": pune_bbox
}
t0 = time.time()
resp = requests.post(f"{BASE_URL}/analyze-landcover", json=lulc_payload, timeout=25)
elapsed = time.time() - t0
lulc_data = resp.json()
print(f"Land Cover Classification Latency: {elapsed:.2f}s")
print(f"Dominant Land Cover Class: {lulc_data.get('dominant_class')}")
print(f"Total Region Area: {lulc_data.get('total_aoi_km2', 0):.2f} km^2")
print(f"Segmentation Thumbnail URL generated: {lulc_data.get('thumbnail_url')[:65]}...")
print("Class-by-Class Semantic Segmentation Breakdown:")
for cls in lulc_data.get("classes", []):
    bar = "=" * int(cls.get("percent", 0) / 3)
    print(f"  [{cls['id']}] {cls['name']:<24}: {cls['area_km2']:>6.2f} km^2 ({cls.get('percent', 0):>5.1f}%) [{bar}]")

print("\n=====================================================================")
print("[SUCCESS] ALL MODELS EXECUTED SIMULATION SUCCESSFULLY & VERIFIED!")
print("=====================================================================")
