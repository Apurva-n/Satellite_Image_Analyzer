"""
Satellite Image Analyzer — Land Cover Segmentation Pipeline (Phase 4)
Implements multispectral feature engineering and 5-class Land Use / Land Cover (LULC) segmentation:
- Class 0: Water Bodies (Rivers, lakes, reservoirs)
- Class 1: Trees & Dense Forest (Canopy cover)
- Class 2: Cropland & Agriculture (Vegetated fields)
- Class 3: Urban & Built-up (Buildings, asphalt, concrete)
- Class 4: Barren Soil & Open Ground
"""

import ee

LULC_CLASSES = [
    {
        "id": 0,
        "name": "Water Bodies",
        "color": "#419bdf",
        "description": "Rivers, lakes, reservoirs, and canals.",
    },
    {
        "id": 1,
        "name": "Trees & Dense Forest",
        "color": "#2d6a4f",
        "description": "Dense forest canopy, tree clusters, and permanent woodland.",
    },
    {
        "id": 2,
        "name": "Cropland & Agriculture",
        "color": "#70e000",
        "description": "Cultivated farmland, agricultural crops, and irrigated fields.",
    },
    {
        "id": 3,
        "name": "Urban & Built-up",
        "color": "#d90429",
        "description": "Buildings, roads, concrete, residential, and commercial infrastructure.",
    },
    {
        "id": 4,
        "name": "Barren Soil & Rock",
        "color": "#ddb892",
        "description": "Exposed dry ground, fallow land, sand, and bare topography.",
    },
]

LULC_PALETTE = [c["color"] for c in LULC_CLASSES]


def classify_landcover_raster(image: ee.Image) -> ee.Image:
    """
    Computes spectral indices and segments a Sentinel-2 image into
    a discrete 5-class LULC classification raster.
    """
    ndvi = image.normalizedDifference(["B8", "B4"]).rename("ndvi")
    ndwi = image.normalizedDifference(["B3", "B8"]).rename("ndwi")
    ndbi = image.normalizedDifference(["B11", "B8"]).rename("ndbi")

    # Multi-spectral decision boundaries
    water = ndwi.gt(0.0)
    trees = ndvi.gte(0.40).And(water.Not())
    crops = ndvi.gte(0.20).And(ndvi.lt(0.40)).And(water.Not()).And(ndbi.lt(-0.02))
    urban = ndbi.gte(-0.02).And(water.Not()).And(ndvi.lt(0.35))

    # Combine into discrete class raster (0 to 4)
    lulc = (
        ee.Image(4)  # Default: Barren (4)
        .where(urban, 3)
        .where(crops, 2)
        .where(trees, 1)
        .where(water, 0)
        .rename("lulc")
    )

    # Mask with the true satellite footprint so empty out-of-bounds space is transparent
    valid_mask = image.select("B4").mask()
    lulc = lulc.updateMask(valid_mask)

    return lulc


def compute_landcover_statistics(lulc: ee.Image, region: ee.Geometry) -> dict:
    """
    Computes exact area in km² and percentage for each land cover class.
    """
    pixel_area_km2 = ee.Image.pixelArea().divide(1e6)
    aoi_km2 = float(region.area(maxError=10).divide(1e6).getInfo())

    # Fast frequency histogram in 1 Earth Engine call
    counts_dict = (
        lulc.reduceRegion(
            reducer=ee.Reducer.frequencyHistogram(),
            geometry=region,
            scale=90,
            maxPixels=1e9,
        )
        .get("lulc")
        .getInfo()
    ) or {}

    total_pixels = sum(counts_dict.values()) if counts_dict else 1.0

    class_stats = []
    max_pct = -1.0
    dominant_class = "Barren Soil & Rock"

    for c in LULC_CLASSES:
        c_id_str = str(c["id"])
        c_count = float(counts_dict.get(c_id_str, 0.0) or 0.0)
        c_pct = round((c_count / total_pixels) * 100, 1)
        c_area = round((c_pct / 100) * aoi_km2, 2)

        if c_pct > max_pct:
            max_pct = c_pct
            dominant_class = f"{c['name']} ({c_pct}%)"

        class_stats.append(
            {
                "id": c["id"],
                "name": c["name"],
                "color": c["color"],
                "description": c["description"],
                "area_km2": c_area,
                "percent": c_pct,
            }
        )

    return {
        "total_aoi_km2": round(aoi_km2, 2),
        "dominant_class": dominant_class,
        "classes": class_stats,
    }
