"""
Authentication and Authorization (RBAC) Module for Terrascope.
Handles:
- Bcrypt password hashing & verification
- PyJWT token generation and validation
- Role-based access control (Admin, Analyst, Researcher, Viewer)
- Current user FastAPI dependency injection
"""

import os
from datetime import datetime, timedelta
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.database import get_db, User, AuditLog

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "terrascope-planetary-geospatial-jwt-key-2026-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    organization: str | None = "Terrascope Research Observatory"
    role: str | None = "analyst"  # admin, analyst, researcher, viewer


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    organization: str | None = None
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    organization: str | None
    role: str
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_days: int = ACCESS_TOKEN_EXPIRE_DAYS
    user: UserResponse


class SavedReportCreateRequest(BaseModel):
    id: str | None = None
    title: str = "Geospatial Analysis Report"
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    scene_id: str | None = None
    scene_date: str | None = None
    cloud_pct: float | None = None
    active_layer: str | None = "TRUE_COLOR"
    spectral_data: dict | None = None
    change_results: dict | None = None
    landcover_results: dict | None = None
    timeseries_results: dict | None = None
    thumbnail_url: str | None = None
    ai_report: dict | None = None


class SavedAOICreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    layer_type: str | None = "TRUE_COLOR"


# ==========================================
# CRYPTOGRAPHIC HELPERS
# ==========================================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ==========================================
# FASTAPI DEPENDENCIES (AUTH & RBAC)
# ==========================================

def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")

    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User | None:
    """Returns current User if valid token is provided, or None if guest."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id), User.is_active == True).first()


def require_roles(allowed_roles: list[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Example: Depends(require_roles(["admin", "analyst"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of the following roles: {', '.join(allowed_roles)}. Your current role is '{current_user.role}'.",
            )
        return current_user
    return role_checker
