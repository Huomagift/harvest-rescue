from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas
from app.services.auth_service import hash_password, verify_password, generate_auth_token

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(require_api_key)])


def get_current_user_from_header(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """
    Extracts and validates Bearer token from Authorization header.
    Returns User if valid, None otherwise.
    """
    if not authorization or not isinstance(authorization, str):
        return None
    
    parts = authorization.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    elif len(parts) == 1:
        token = parts[0]
    else:
        return None

    return db.query(models.User).filter(models.User.auth_token == token).first()


@router.post("/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    norm_email = payload.email.strip().lower()
    
    # Check if email is already taken
    existing = db.query(models.User).filter(models.User.email == norm_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    hashed_pw = hash_password(payload.password)
    token = generate_auth_token()

    user = models.User(
        name=payload.name.strip(),
        email=norm_email,
        hashed_password=hashed_pw,
        auth_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.AuthResponse(token=token, user=user)


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    norm_email = payload.email.strip().lower()
    
    user = db.query(models.User).filter(models.User.email == norm_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Generate fresh session token
    token = generate_auth_token()
    user.auth_token = token
    db.commit()
    db.refresh(user)

    return schemas.AuthResponse(token=token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def get_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_current_user_from_header(authorization=authorization, db=db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or session expired.")
    return user


@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_current_user_from_header(authorization=authorization, db=db)
    if user:
        user.auth_token = None
        db.commit()
    return {"status": "logged_out"}
