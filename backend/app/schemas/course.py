from pydantic import BaseModel


class CourseCreate(BaseModel):
    course_name: str
    course_code: str
    user_id: int


class CourseResponse(BaseModel):
    id: int
    course_name: str
    course_code: str
    user_id: int

    class Config:
        from_attributes = True