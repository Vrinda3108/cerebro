from pydantic import BaseModel
from datetime import datetime


class AssignmentCreate(BaseModel):
    title: str
    due_date: datetime
    estimated_hours: int
    course_id: int


class AssignmentResponse(BaseModel):
    id: int
    title: str
    due_date: datetime
    estimated_hours: int
    completed: bool
    course_id: int

    class Config:
        from_attributes = True