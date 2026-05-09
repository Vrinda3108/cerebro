import uuid
from sqlalchemy import Column, Float, Boolean, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    assignment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id"),
        nullable=False
    )

    scheduled_date = Column(Date)

    scheduled_hours = Column(Float)

    completed = Column(Boolean, default=False)