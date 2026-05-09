import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False
    )

    title = Column(String, nullable=False)

    estimated_hours = Column(Integer)

    priority = Column(Integer)

    completed = Column(Boolean, default=False)

    due_date = Column(DateTime)