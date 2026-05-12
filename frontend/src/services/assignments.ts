import API from "./api";
import { Assignment } from "@/src/types/assignment";

export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await API.get("/assignments/");
  return response.data;
};

export const createAssignment = async (data: {
  title: string;
  due_date: string;
  estimated_hours: number;
  priority: number;
  course_id: string;
}): Promise<Assignment> => {
  const response = await API.post("/assignments/", data);
  return response.data;
};

export const markAssignmentComplete = async (id: string): Promise<Assignment> => {
  const response = await API.patch(`/assignments/${id}/complete`);
  return response.data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await API.delete(`/assignments/${id}`);
};
