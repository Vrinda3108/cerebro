from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)

    course_name = Column(String, nullable=False)

    course_code = Column(String, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User")