"""
Schedule routes — generate, retrieve, complete, and recover study sessions.
"""

from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.schedule import (
    BurnoutReportResponse,
    GenerateScheduleRequest,
    MissSessionRequest,
    StudySessionResponse,
    WeekScheduleResponse,
    WorkloadDaySummary,
)
from app.services.scheduler import (
    compute_daily_workload,
    detect_burnout,
    generate_sessions,
    recover_sessions,
)

router = APIRouter(prefix="/schedule", tags=["Schedule"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_assignment_for_user(
    assignment_id: UUID, user_id: UUID, db: Session
) -> Assignment:
    assignment = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Assignment.id == assignment_id, Course.user_id == user_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


def _enrich_session(session: StudySession, db: Session) -> StudySessionResponse:
    """Add assignment title and course code to a session response."""
    assignment = db.query(Assignment).filter(
        Assignment.id == session.assignment_id
    ).first()
    course = db.query(Course).filter(
        Course.id == assignment.course_id
    ).first() if assignment else None

    return StudySessionResponse(
        id=session.id,
        assignment_id=session.assignment_id,
        scheduled_date=session.scheduled_date,
        scheduled_hours=session.scheduled_hours,
        completed=session.completed,
        assignment_title=assignment.title if assignment else None,
        course_code=course.course_code if course else None,
    )


# ─── Generate schedule for an assignment ─────────────────────────────────────

@router.post(
    "/assignments/{assignment_id}/generate",
    response_model=list[StudySessionResponse],
    status_code=201,
)
def generate_schedule(
    assignment_id: UUID,
    body: GenerateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate study sessions for an assignment.
    Deletes any existing incomplete sessions first, then creates new ones.
    """
    assignment = _get_assignment_for_user(assignment_id, current_user.id, db)

    if assignment.completed:
        raise HTTPException(
            status_code=400, detail="Assignment is already completed"
        )

    # Delete existing incomplete sessions for this assignment
    db.query(StudySession).filter(
        StudySession.assignment_id == assignment_id,
        StudySession.completed == False,  # noqa: E712
    ).delete()
    db.commit()

    try:
        planned = generate_sessions(
            estimated_hours=assignment.estimated_hours,
            due_date=assignment.due_date,
            max_hours_per_day=body.max_hours_per_day,
            blocked_days=body.blocked_days or [],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    created = []
    for s in planned:
        session = StudySession(
            assignment_id=assignment_id,
            scheduled_date=s.scheduled_date,
            scheduled_hours=s.scheduled_hours,
            completed=False,
        )
        db.add(session)
        created.append(session)

    db.commit()
    for s in created:
        db.refresh(s)

    return [_enrich_session(s, db) for s in created]


# ─── Mark a session complete ──────────────────────────────────────────────────

@router.patch(
    "/sessions/{session_id}/complete",
    response_model=StudySessionResponse,
)
def complete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a study session as completed."""
    session = (
        db.query(StudySession)
        .join(Assignment, StudySession.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .filter(StudySession.id == session_id, Course.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.completed = True
    db.commit()
    db.refresh(session)
    return _enrich_session(session, db)


# ─── Miss a session → trigger recovery ───────────────────────────────────────

@router.post(
    "/sessions/{session_id}/miss",
    response_model=list[StudySessionResponse],
)
def miss_session(
    session_id: UUID,
    body: MissSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a session as missed and recalculate the remaining schedule.

    - Marks the session completed (with partial hours if provided)
    - Deletes all future incomplete sessions for this assignment
    - Regenerates sessions for the remaining hours
    - Returns the new sessions with a warning if overload is detected
    """
    session = (
        db.query(StudySession)
        .join(Assignment, StudySession.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .filter(StudySession.id == session_id, Course.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    assignment = db.query(Assignment).filter(
        Assignment.id == session.assignment_id
    ).first()

    # Count hours already completed across all sessions for this assignment
    completed_sessions = db.query(StudySession).filter(
        StudySession.assignment_id == assignment.id,
        StudySession.completed == True,  # noqa: E712
    ).all()
    already_done = sum(s.scheduled_hours for s in completed_sessions)
    already_done += body.completed_hours  # partial credit for this session

    # Mark this session as completed (with whatever partial hours were done)
    session.completed = True
    db.commit()

    # Delete all remaining incomplete sessions for this assignment
    db.query(StudySession).filter(
        StudySession.assignment_id == assignment.id,
        StudySession.completed == False,  # noqa: E712
    ).delete()
    db.commit()

    # Regenerate from today
    try:
        new_planned = recover_sessions(
            estimated_hours=assignment.estimated_hours,
            due_date=assignment.due_date,
            completed_hours=already_done,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    created = []
    for s in new_planned:
        new_session = StudySession(
            assignment_id=assignment.id,
            scheduled_date=s.scheduled_date,
            scheduled_hours=s.scheduled_hours,
            completed=False,
        )
        db.add(new_session)
        created.append(new_session)

    db.commit()
    for s in created:
        db.refresh(s)

    return [_enrich_session(s, db) for s in created]


# ─── Weekly schedule view ─────────────────────────────────────────────────────

@router.get("/week", response_model=WeekScheduleResponse)
def get_week_schedule(
    week_start: date = Query(default=None, description="ISO date, defaults to this Monday"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all study sessions for a given week, plus workload summary and burnout report.
    """
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday

    week_end = week_start + timedelta(days=6)

    # Fetch all sessions in the week belonging to this user
    sessions = (
        db.query(StudySession)
        .join(Assignment, StudySession.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .filter(
            Course.user_id == current_user.id,
            StudySession.scheduled_date >= week_start,
            StudySession.scheduled_date <= week_end,
        )
        .order_by(StudySession.scheduled_date)
        .all()
    )

    enriched = [_enrich_session(s, db) for s in sessions]

    # Compute workload and burnout for the week
    pairs = [(s.scheduled_date, s.scheduled_hours) for s in sessions]
    workload_days = compute_daily_workload(pairs)
    burnout = detect_burnout(workload_days)

    return WeekScheduleResponse(
        week_start=week_start,
        week_end=week_end,
        sessions=enriched,
        workload=[
            WorkloadDaySummary(day=w.day, total_hours=w.total_hours, risk=w.risk)
            for w in workload_days
        ],
        burnout=BurnoutReportResponse(
            overall_risk=burnout.overall_risk,
            peak_day=burnout.peak_day,
            peak_hours=burnout.peak_hours,
            at_risk_days=burnout.at_risk_days,
            consecutive_heavy_days=burnout.consecutive_heavy_days,
            message=burnout.message,
        ),
    )


# ─── Workload summary (all future sessions) ───────────────────────────────────

@router.get("/workload", response_model=BurnoutReportResponse)
def get_workload_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a burnout risk report across all upcoming incomplete sessions.
    """
    today = date.today()
    sessions = (
        db.query(StudySession)
        .join(Assignment, StudySession.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .filter(
            Course.user_id == current_user.id,
            StudySession.completed == False,  # noqa: E712
            StudySession.scheduled_date >= today,
        )
        .all()
    )

    pairs = [(s.scheduled_date, s.scheduled_hours) for s in sessions]
    workload_days = compute_daily_workload(pairs)
    burnout = detect_burnout(workload_days)

    return BurnoutReportResponse(
        overall_risk=burnout.overall_risk,
        peak_day=burnout.peak_day,
        peak_hours=burnout.peak_hours,
        at_risk_days=burnout.at_risk_days,
        consecutive_heavy_days=burnout.consecutive_heavy_days,
        message=burnout.message,
    )
