"""
Satellite Image Analyzer — FastAPI backend
Phase 1: /search-scenes endpoint (Earth Engine version)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import ee

# ---- Earth Engine init ----
# Replace 'apps-459204' with your own project ID if this changes later.
ee.Initialize(project='apps-459204')

app = FastAPI(title="Satellite Image Analyzer API")

# Allow the React dev server (Vite default port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchScenesRequest(BaseModel):
    # bbox = [lon_min, lat_min, lon_max, lat_max], drawn by the user on the map
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    start_date: str  # 'YYYY-MM-DD'
    end_date: str    # 'YYYY-MM-DD'
    max_cloud_pct: float = 20.0


class Scene(BaseModel):
    id: str
    date: str
    cloud_pct: float


@app.post("/search-scenes", response_model=list[Scene])
def search_scenes(req: SearchScenesRequest):
    try:
        region = ee.Geometry.Rectangle(req.bbox, proj='EPSG:4326', geodesic=False)

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(req.start_date, req.end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", req.max_cloud_pct))
            .sort("system:time_start")
        )

        # High-performance server-side mapping (1 round-trip instead of 40)
        def extract_meta(img):
            return ee.Feature(
                None,
                {
                    "id": img.getString("system:index"),
                    "date": ee.Date(img.get("system:time_start")).format("YYYY-MM-dd"),
                    "cloud_pct": img.getNumber("CLOUDY_PIXEL_PERCENTAGE"),
                },
            )

        features = collection.map(extract_meta).getInfo().get("features", [])
        scenes = [
            Scene(
                id=f["properties"]["id"],
                date=f["properties"]["date"],
                cloud_pct=round(float(f["properties"]["cloud_pct"]), 1),
            )
            for f in features
        ]
        return scenes

    except ee.EEException as e:
        raise HTTPException(status_code=400, detail=f"Earth Engine error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ThumbnailRequest(BaseModel):
    scene_id: str          # e.g. "20260821T052641_20260821T053605_T43QCA"
    bbox: list[float] = Field(..., min_length=4, max_length=4)


class ThumbnailResponse(BaseModel):
    thumbnail_url: str


@app.post("/get-thumbnail", response_model=ThumbnailResponse)
def get_thumbnail(req: ThumbnailRequest):
    try:
        # Use planar non-geodesic rectangle with explicit projection to avoid zero error margin reprojection bug
        region = ee.Geometry.Rectangle(req.bbox, proj='EPSG:4326', geodesic=False)
        
        asset_id = req.scene_id if req.scene_id.startswith("COPERNICUS/") else f"COPERNICUS/S2_SR_HARMONIZED/{req.scene_id}"
        image = ee.Image(asset_id)

        # True-color RGB visualization (B4=red, B3=green, B2=blue)
        vis_params = {
            "bands": ["B4", "B3", "B2"],
            "min": 0,
            "max": 3000,  # typical reflectance range for Sentinel-2 SR
            "region": region,
            "dimensions": 512,
            "crs": "EPSG:4326",
            "format": "png",
        }

        url = image.getThumbURL(vis_params)
        return ThumbnailResponse(thumbnail_url=url)

    except ee.EEException as e:
        raise HTTPException(status_code=400, detail=f"Earth Engine error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok", "earth_engine": "initialized"}
