from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.user import UserResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
