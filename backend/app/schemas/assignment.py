from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class AssignmentCreate(BaseModel):
    title: str
    due_date: datetime
    estimated_hours: int
    priority: int = 1
    course_id: UUID


class AssignmentResponse(BaseModel):
    id: UUID
    title: str
    due_date: datetime
    estimated_hours: int
    priority: int
    completed: bool
    course_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
