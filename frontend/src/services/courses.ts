import API from "./api";
import { Course } from "@/src/types/course";

export const getCourses = async (): Promise<Course[]> => {
  const response = await API.get("/courses/");
  return response.data;
};

export const createCourse = async (
  course_name: string,
  course_code: string,
  instructor?: string,
  term?: string
): Promise<Course> => {
  const response = await API.post("/courses/", {
    course_name,
    course_code,
    instructor: instructor ?? null,
    term: term ?? null,
  });
  return response.data;
};

export const deleteCourse = async (course_id: string): Promise<void> => {
  await API.delete(`/courses/${course_id}`);
};
