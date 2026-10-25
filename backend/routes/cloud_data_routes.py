"""
Cloud Data Persistence Endpoints (Saved Reports & Bookmarked AOIs).
Scoped to authorized users with role-based permissions.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, SavedReport, SavedAOI, User
from backend.auth import (
    SavedReportCreateRequest,
    SavedAOICreateRequest,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/api/cloud", tags=["Cloud Persistence & Data Storage"])


# ==========================================
# SAVED REPORTS (CLOUD DB)
# ==========================================

@router.get("/reports")
def list_saved_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve saved reports. Admins can view all; other users view their own."""
    if current_user.role == "admin":
        reports = db.query(SavedReport).order_by(SavedReport.created_at.desc()).all()
    else:
        reports = (
            db.query(SavedReport)
            .filter(SavedReport.user_id == current_user.id)
            .order_by(SavedReport.created_at.desc())
            .all()
        )

    return [
        {
            "id": r.id,
            "title": r.title,
            "bbox": r.bbox,
            "scene_id": r.scene_id,
            "scene_date": r.scene_date,
            "cloud_pct": r.cloud_pct,
            "active_layer": r.active_layer,
            "thumbnail_url": r.thumbnail_url,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "owner": {
                "id": r.user.id,
                "email": r.user.email,
                "full_name": r.user.full_name,
            } if r.user else None,
        }
        for r in reports
    ]


@router.post("/reports")
def save_report_to_cloud(
    req: SavedReportCreateRequest,
    current_user: User = Depends(require_roles(["admin", "analyst", "researcher"])),
    db: Session = Depends(get_db),
):
    """Save an analysis report to the Cloud Database."""
    report_id = req.id or f"REP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')[-6:]}"

    # Check if report already exists; update if owner or admin
    existing = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if existing:
        if existing.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this report.",
            )
        existing.title = req.title
        existing.bbox = req.bbox
        existing.scene_id = req.scene_id
        existing.scene_date = req.scene_date
        existing.cloud_pct = req.cloud_pct
        existing.active_layer = req.active_layer
        existing.spectral_data = req.spectral_data
        existing.change_results = req.change_results
        existing.landcover_results = req.landcover_results
        existing.timeseries_results = req.timeseries_results
        existing.thumbnail_url = req.thumbnail_url
        existing.ai_report = req.ai_report
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "id": existing.id, "message": "Report updated in Cloud Database."}

    new_report = SavedReport(
        id=report_id,
        user_id=current_user.id,
        title=req.title,
        bbox=req.bbox,
        scene_id=req.scene_id,
        scene_date=req.scene_date,
        cloud_pct=req.cloud_pct,
        active_layer=req.active_layer,
        spectral_data=req.spectral_data,
        change_results=req.change_results,
        landcover_results=req.landcover_results,
        timeseries_results=req.timeseries_results,
        thumbnail_url=req.thumbnail_url,
        ai_report=req.ai_report,
        created_at=datetime.utcnow(),
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {"status": "created", "id": new_report.id, "message": "Report saved to Cloud Database."}


@router.get("/reports/{report_id}")
def get_report_from_cloud(
    report_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve full report data by ID."""
    report = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found in Cloud Database.")

    return {
        "id": report.id,
        "title": report.title,
        "bbox": report.bbox,
        "scene_id": report.scene_id,
        "scene_date": report.scene_date,
        "cloud_pct": report.cloud_pct,
        "active_layer": report.active_layer,
        "spectral_data": report.spectral_data,
        "change_results": report.change_results,
        "landcover_results": report.landcover_results,
        "timeseries_results": report.timeseries_results,
        "thumbnail_url": report.thumbnail_url,
        "ai_report": report.ai_report,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "owner": {
            "id": report.user.id,
            "email": report.user.email,
            "full_name": report.user.full_name,
        } if report.user else None,
    }


@router.delete("/reports/{report_id}")
def delete_report_from_cloud(
    report_id: str,
    current_user: User = Depends(require_roles(["admin", "analyst"])),
    db: Session = Depends(get_db),
):
    """Delete report from Cloud Database with ownership validation."""
    report = db.query(SavedReport).filter(SavedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if report.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied to delete this report.")

    db.delete(report)
    db.commit()
    return {"status": "success", "message": f"Report {report_id} permanently deleted from Cloud Database."}


# ==========================================
# SAVED AOI BOOKMARKS (CLOUD DB)
# ==========================================

@router.get("/bookmarks")
def list_aoi_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve bookmarked geographic Areas of Interest."""
    bookmarks = (
        db.query(SavedAOI)
        .filter(SavedAOI.user_id == current_user.id)
        .order_by(SavedAOI.created_at.desc())
        .all()
    )
    return [
        {
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "bbox": b.bbox,
            "layer_type": b.layer_type,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in bookmarks
    ]


@router.post("/bookmarks")
def create_aoi_bookmark(
    req: SavedAOICreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bookmark an AOI to the user's cloud account."""
    bookmark = SavedAOI(
        user_id=current_user.id,
        name=req.name.strip(),
        description=req.description.strip() if req.description else "",
        bbox=req.bbox,
        layer_type=req.layer_type or "TRUE_COLOR",
        created_at=datetime.utcnow(),
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return {"status": "success", "id": bookmark.id, "message": "AOI bookmarked to Cloud Database."}


@router.delete("/bookmarks/{bookmark_id}")
def delete_aoi_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an AOI bookmark."""
    bookmark = db.query(SavedAOI).filter(SavedAOI.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found.")

    if bookmark.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied to delete this bookmark.")

    db.delete(bookmark)
    db.commit()
    return {"status": "success", "message": "Bookmark removed from Cloud Database."}
