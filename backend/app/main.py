from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, courses, assignments, users, schedule

app = FastAPI(
    title="Cerebro API",
    description="Adaptive academic workload management system",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Cerebro API Running"}


app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(users.router)
app.include_router(schedule.router)
