import ee
ee.Initialize(project='apps-459204')
print('Success! Earth Engine is ready.')

# Define a small area (Pune, since that's roughly your location)
point = ee.Geometry.Point([73.8567, 18.5204])

# Search Sentinel-2 imagery over that point for August 2026,
# filtering out cloudy scenes
s2 = (
    ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(point)
    .filterDate('2026-08-01', '2026-08-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80))
)

count = s2.size().getInfo()
print(f"Number of Sentinel-2 images found: {count}")

if count > 0:
    first_image = s2.first()
    date = ee.Date(first_image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
    cloud_pct = first_image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()
    print(f"First image date: {date}, cloud cover: {cloud_pct:.1f}%")

print("SUCCESS: Local Python can talk to Earth Engine!")