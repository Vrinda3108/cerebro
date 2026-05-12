from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/assignments", tags=["Assignments"])


def _get_assignment_for_user(
    assignment_id: UUID, user_id: UUID, db: Session
) -> Assignment:
    """Fetch an assignment that belongs to the current user (via course ownership)."""
    assignment = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Assignment.id == assignment_id, Course.user_id == user_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Course.user_id == current_user.id)
        .all()
    )


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_assignment_for_user(assignment_id, current_user.id, db)


@router.post("/", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify the course belongs to the current user
    course = db.query(Course).filter(
        Course.id == assignment_in.course_id,
        Course.user_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assignment = Assignment(
        title=assignment_in.title,
        due_date=assignment_in.due_date,
        estimated_hours=assignment_in.estimated_hours,
        priority=assignment_in.priority,
        course_id=assignment_in.course_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.patch("/{assignment_id}/complete", response_model=AssignmentResponse)
def mark_complete(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = _get_assignment_for_user(assignment_id, current_user.id, db)
    assignment.completed = True
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = _get_assignment_for_user(assignment_id, current_user.id, db)
    db.delete(assignment)
    db.commit()
