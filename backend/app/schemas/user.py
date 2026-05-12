from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    name: str | None = None
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    name: str | None
    email: str
    created_at: datetime

    class Config:
        from_attributes = True
