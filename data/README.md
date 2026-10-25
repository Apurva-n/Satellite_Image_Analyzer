# Satellite Image Analyzer — Data Directory (Phase 4)

This directory is designated for offline datasets, training patches, and exported GeoTIFFs used by the Machine Learning & Computer Vision pipeline.

---

## 1. Supported Datasets

### A. EuroSAT Benchmark Dataset
* **Type**: 27,000 labeled 64x64 pixel image patches across 10 Land Use/Land Cover classes.
* **Source**: Sentinel-2 optical surface reflectance (13 multispectral bands).
* **Classes**:
  1. `AnnualCrop`
  2. `Forest`
  3. `HerbaceousWetland`
  4. `Highway`
  5. `Industrial`
  6. `Pasture`
  7. `PermanentCrop`
  8. `Residential`
  9. `River`
  10. `SeaLake`

#### Download Instructions:
```python
# Automatic download via torchvision:
import torchvision
dataset = torchvision.datasets.EuroSAT(root='./data/eurosat', download=True)
```

---

## 2. Direct Earth Engine GeoTIFF Export

You can export multi-band Sentinel-2 GeoTIFF patches directly into this folder:

```python
import ee, urllib.request
ee.Initialize(project='apps-459204')

region = ee.Geometry.Rectangle([73.75, 18.45, 73.95, 18.60])
img = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(region).sort('CLOUDY_PIXEL_PERCENTAGE').first()

url = img.getDownloadURL({
    'scale': 20,
    'crs': 'EPSG:4326',
    'region': region,
    'bands': ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'],
    'format': 'GEO_TIFF'
})
urllib.request.urlretrieve(url, './data/pune_multispectral.tif')
```
