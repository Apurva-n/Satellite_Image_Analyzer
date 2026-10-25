import ee
import time

ee.Initialize(project='apps-459204')

bbox = [73.75, 18.45, 73.95, 18.60]
region = ee.Geometry.Rectangle(bbox, proj='EPSG:4326', geodesic=False)
months = 12

t0 = time.time()
end_date = ee.Date('2026-04-01')
start_date = end_date.advance(-months, 'month')
month_sequence = ee.List.sequence(0, months - 1)

dummy = ee.Image.constant([0, 0, 0, 0, 0]).rename(['B3', 'B4', 'B8', 'B11', 'B12'])

def process_month(offset):
    m_start = start_date.advance(ee.Number(offset), 'month')
    m_end = m_start.advance(1, 'month')
    
    col = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate(m_start, m_end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 60))
    )
    
    has_images = col.size().gt(0)
    composite = ee.Image(ee.Algorithms.If(has_images, col.median(), dummy))
    idx = composite.normalizedDifference(['B8', 'B4']).rename('index')
    
    stats = idx.reduceRegion(
        reducer=ee.Reducer.mean().combine(
            reducer2=ee.Reducer.minMax(),
            sharedInputs=True
        ),
        geometry=region,
        scale=120,
        maxPixels=1e8
    )
    
    return ee.Feature(None, {
        'date': m_start.format('YYYY-MM'),
        'label': m_start.format('MMM yyyy'),
        'scene_count': col.size(),
        'has_data': has_images,
        'mean': stats.get('index_mean'),
        'min': stats.get('index_min'),
        'max': stats.get('index_max'),
    })

fc = ee.FeatureCollection(month_sequence.map(process_month))
result = fc.getInfo()
t1 = time.time()

print(f"Time taken: {t1 - t0:.2f} seconds")
for feat in result['features']:
    props = feat['properties']
    print(f"{props['label']} ({props['date']}): scenes={props['scene_count']}, mean={props.get('mean')}, min={props.get('min')}, max={props.get('max')}")
