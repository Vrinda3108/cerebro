from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.db.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    due_date = Column(DateTime)

    estimated_hours = Column(Integer)

    completed = Column(Boolean, default=False)

    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course")