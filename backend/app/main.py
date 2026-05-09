from fastapi import FastAPI

from app.db.database import engine, Base

from app.models.user import User
from app.models.course import Course
from app.models.assignment import Assignment
from app.models.study_session import StudySession

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cerebro API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Cerebro backend running"
    }