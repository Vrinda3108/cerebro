from pydantic import BaseModel
from datetime import date, datetime
from uuid import UUID


class StudySessionResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    scheduled_date: date
    scheduled_hours: float
    completed: bool

    # Denormalised fields for convenience (populated via join)
    assignment_title: str | None = None
    course_code: str | None = None

    class Config:
        from_attributes = True


class GenerateScheduleRequest(BaseModel):
    max_hours_per_day: float = 3.0
    blocked_days: list[date] = []


class MissSessionRequest(BaseModel):
    completed_hours: float = 0.0   # how many hours were actually done before missing


class WorkloadDaySummary(BaseModel):
    day: date
    total_hours: float
    risk: str  # "low" | "medium" | "high"


class BurnoutReportResponse(BaseModel):
    overall_risk: str
    peak_day: date | None
    peak_hours: float
    at_risk_days: list[date]
    consecutive_heavy_days: int
    message: str


class WeekScheduleResponse(BaseModel):
    week_start: date
    week_end: date
    sessions: list[StudySessionResponse]
    workload: list[WorkloadDaySummary]
    burnout: BurnoutReportResponse
