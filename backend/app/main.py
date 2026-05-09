from fastapi import FastAPI

from app.db.database import engine, Base

from app.models.user import User
from app.models.course import Course
from app.models.assignment import Assignment
from app.models.study_session import StudySession

from app.api.course_routes import router as course_router
from app.api.assignment_routes import router as assignment_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cerebro API",
    version="1.0.0"
)

app.include_router(course_router)
app.include_router(assignment_router)

@app.get("/")
def root():
    return {
        "message": "Cerebro backend running"
    }