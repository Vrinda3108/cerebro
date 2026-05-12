import uuid
from sqlalchemy import Column, Float, Boolean, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    scheduled_hours = Column(Float, nullable=False)
    completed = Column(Boolean, default=False)

    assignment = relationship("Assignment", back_populates="study_sessions")
