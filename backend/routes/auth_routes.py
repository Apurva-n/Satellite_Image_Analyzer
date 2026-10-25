"""
Authentication and User Profile Endpoints for Terrascope.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.database import get_db, get_db_status, User, AuditLog
from backend.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    ProfileUpdateRequest,
    ChangePasswordRequest,
    UserResponse,
    TokenResponse,
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])


@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new user account and return JWT access token."""
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Restrict admin self-registration; default to analyst
    assigned_role = req.role if req.role in ["analyst", "researcher", "viewer"] else "analyst"

    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
        organization=req.organization.strip() if req.organization else "Terrascope Observatory",
        role=assigned_role,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={req.full_name}&backgroundColor=103B32,22C55E",
        is_active=True,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="USER_REGISTRATION",
        ip_address=request.client.host if request.client else "unknown",
        details=f"Registered with role: {new_user.role}",
    )
    db.add(audit)
    db.commit()

    # Generate JWT
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(new_user),
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated. Contact your platform administrator.",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        ip_address=request.client.host if request.client else "unknown",
        details=f"Authenticated as {user.role}",
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return profile information for currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile information."""
    if req.full_name is not None and len(req.full_name.strip()) > 0:
        current_user.full_name = req.full_name.strip()
    if req.organization is not None:
        current_user.organization = req.organization.strip()
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url.strip()

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change current user password."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed.",
        )

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}


@router.get("/users", response_model=list[UserResponse])
def list_all_users(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Admin-only: list all platform users and roles."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/database-status")
def database_status():
    """Report live cloud database connectivity status."""
    return get_db_status()
