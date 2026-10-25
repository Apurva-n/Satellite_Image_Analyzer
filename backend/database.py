"""
Database module for Terrascope Geospatial Platform.
Supports:
- Cloud PostgreSQL (Supabase, Neon, AWS RDS, Render, Railway, etc.) via DATABASE_URL
- Seamless persistent local fallback (SQLite) if no cloud connection string is provided
"""

import os
import time
from datetime import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    Text,
    JSON,
    ForeignKey,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

Base = declarative_base()

# Determine database URL from environment
RAW_DB_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("SUPABASE_DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    or ""
).strip()

# Normalize postgres:// to postgresql:// for modern SQLAlchemy
if RAW_DB_URL.startswith("postgres://"):
    DB_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)
elif RAW_DB_URL:
    DB_URL = RAW_DB_URL
else:
    # Reliable local fallback
    fallback_path = os.path.join(os.path.dirname(__file__), "terrascope_cloud.db")
    DB_URL = f"sqlite:///{fallback_path}"

# Identify provider for telemetry
if "supabase.co" in DB_URL:
    DB_PROVIDER = "Cloud PostgreSQL (Supabase)"
elif "neon.tech" in DB_URL:
    DB_PROVIDER = "Cloud PostgreSQL (Neon Serverless)"
elif "amazonaws.com" in DB_URL:
    DB_PROVIDER = "Cloud PostgreSQL (AWS RDS)"
elif "render.com" in DB_URL:
    DB_PROVIDER = "Cloud PostgreSQL (Render)"
elif "cockroachlabs.cloud" in DB_URL:
    DB_PROVIDER = "Cloud Distributed DB (CockroachDB)"
elif DB_URL.startswith("postgresql://"):
    DB_PROVIDER = "Cloud PostgreSQL Database"
else:
    DB_PROVIDER = "Terrascope Cloud-Ready Database (Persistent SQLite)"

# Engine configuration
connect_args = {}
if DB_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        DB_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
except Exception as e:
    print(f"[DB Warning] Could not connect to configured DB ({e}). Falling back to local SQLite.")
    fallback_path = os.path.join(os.path.dirname(__file__), "terrascope_cloud.db")
    DB_URL = f"sqlite:///{fallback_path}"
    DB_PROVIDER = "Terrascope Cloud-Ready Database (Fallback SQLite)"
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==========================================
# MODELS
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255), default="Terrascope Environmental Observatory")
    role = Column(String(50), default="analyst", nullable=False)  # admin, analyst, researcher, viewer
    avatar_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    saved_reports = relationship("SavedReport", back_populates="user", cascade="all, delete-orphan")
    saved_aois = relationship("SavedAOI", back_populates="user", cascade="all, delete-orphan")


class SavedReport(Base):
    __tablename__ = "saved_reports"

    id = Column(String(64), primary_key=True, index=True)  # e.g. REP-1606
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    bbox = Column(JSON, nullable=False)
    scene_id = Column(String(255), nullable=True)
    scene_date = Column(String(50), nullable=True)
    cloud_pct = Column(Float, nullable=True)
    active_layer = Column(String(50), default="TRUE_COLOR")
    spectral_data = Column(JSON, nullable=True)
    change_results = Column(JSON, nullable=True)
    landcover_results = Column(JSON, nullable=True)
    timeseries_results = Column(JSON, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    ai_report = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="saved_reports")


class SavedAOI(Base):
    __tablename__ = "saved_aois"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    bbox = Column(JSON, nullable=False)
    layer_type = Column(String(50), default="TRUE_COLOR")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_aois")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    ip_address = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# INITIALIZATION & SEEDING
# ==========================================

def init_db():
    """Create all tables and seed initial default demo accounts if not present."""
    import bcrypt

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("[Database] Seeding initial default accounts for demonstration...")

            def hash_pw(pw: str) -> str:
                return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # 1. Administrator
            admin_user = User(
                email="admin@terrascope.earth",
                hashed_password=hash_pw("TerrascopeAdmin2026!"),
                full_name="Dr. Elena Vance",
                organization="Terrascope Planetary Mission Control",
                role="admin",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                is_active=True,
                created_at=datetime.utcnow(),
            )

            # 2. Senior Analyst
            analyst_user = User(
                email="analyst@terrascope.earth",
                hashed_password=hash_pw("TerrascopeAnalyst2026!"),
                full_name="Marcus Thorne",
                organization="Geospatial Intelligence Division",
                role="analyst",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
                is_active=True,
                created_at=datetime.utcnow(),
            )

            # 3. Field Researcher
            researcher_user = User(
                email="researcher@terrascope.earth",
                hashed_password=hash_pw("TerrascopeResearch2026!"),
                full_name="Dr. Maya Lin",
                organization="Institute for Earth Observation",
                role="researcher",
                avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
                is_active=True,
                created_at=datetime.utcnow(),
            )

            db.add_all([admin_user, analyst_user, researcher_user])
            db.commit()

            # Seed a default sample saved report for Marcus Thorne
            db.refresh(analyst_user)
            sample_report = SavedReport(
                id="REP-2026-6841",
                user_id=analyst_user.id,
                title="Pune Agricultural & Watershed Observatory",
                bbox=[73.7148, 18.4602, 73.8809, 18.5692],
                scene_id="COPERNICUS/S2_SR_HARMONIZED/S2B_MSIL2A_20260103",
                scene_date="2026-01-03",
                cloud_pct=8.5,
                active_layer="NDVI",
                spectral_data={"stats": {"mean_val": 0.48, "min_val": 0.12, "max_val": 0.79}},
                change_results={"change_type": "VEGETATION", "impacted_area_km2": 14.8, "percent_impacted": 3.9},
                landcover_results={"dominant_class": "Cropland & Agriculture"},
                created_at=datetime.utcnow(),
            )

            # Seed sample bookmarks
            sample_aoi_1 = SavedAOI(
                user_id=analyst_user.id,
                name="Pune Metropolitan Basin",
                description="Core urban-rural transition zone under quarterly monitoring.",
                bbox=[73.75, 18.45, 73.95, 18.60],
                layer_type="NDVI",
            )
            sample_aoi_2 = SavedAOI(
                user_id=analyst_user.id,
                name="Mulshi Reservoir & Forest Catchment",
                description="Hydro-ecological watershed tracking buffer retention.",
                bbox=[73.45, 18.48, 73.55, 18.58],
                layer_type="NDWI",
            )

            db.add_all([sample_report, sample_aoi_1, sample_aoi_2])
            db.commit()
            print("[Database] Seeded 3 default users, 1 benchmark report, and 2 AOI bookmarks.")

    except Exception as err:
        db.rollback()
        print(f"[Database Seed Error] {err}")
    finally:
        db.close()


def get_db():
    """FastAPI dependency for yielding database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_status():
    """Ping database and return health metrics and table telemetry."""
    t0 = time.time()
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.time() - t0) * 1000, 2)
        user_count = db.query(User).count()
        report_count = db.query(SavedReport).count()
        aoi_count = db.query(SavedAOI).count()

        return {
            "status": "connected",
            "provider": DB_PROVIDER,
            "latency_ms": latency_ms,
            "counts": {
                "users": user_count,
                "saved_reports": report_count,
                "saved_aois": aoi_count,
            },
            "cloud_enabled": "sqlite" not in DB_URL.lower(),
        }
    except Exception as e:
        return {
            "status": "error",
            "provider": DB_PROVIDER,
            "error": str(e),
            "cloud_enabled": False,
        }
    finally:
        db.close()
