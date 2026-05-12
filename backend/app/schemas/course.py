from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CourseCreate(BaseModel):
    course_name: str
    course_code: str
    instructor: str | None = None
    term: str | None = None


class CourseResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_name: str
    course_code: str
    instructor: str | None
    term: str | None
    created_at: datetime

    class Config:
        from_attributes = True
