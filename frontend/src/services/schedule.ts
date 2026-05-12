import API from "./api";
import { StudySession, WeekSchedule, BurnoutReport } from "@/src/types/schedule";

export const generateSchedule = async (
  assignmentId: string,
  options: { max_hours_per_day?: number; blocked_days?: string[] } = {}
): Promise<StudySession[]> => {
  const response = await API.post(
    `/schedule/assignments/${assignmentId}/generate`,
    {
      max_hours_per_day: options.max_hours_per_day ?? 3.0,
      blocked_days: options.blocked_days ?? [],
    }
  );
  return response.data;
};

export const completeSession = async (sessionId: string): Promise<StudySession> => {
  const response = await API.patch(`/schedule/sessions/${sessionId}/complete`);
  return response.data;
};

export const missSession = async (
  sessionId: string,
  completedHours: number = 0
): Promise<StudySession[]> => {
  const response = await API.post(`/schedule/sessions/${sessionId}/miss`, {
    completed_hours: completedHours,
  });
  return response.data;
};

export const getWeekSchedule = async (weekStart?: string): Promise<WeekSchedule> => {
  const params = weekStart ? { week_start: weekStart } : {};
  const response = await API.get("/schedule/week", { params });
  return response.data;
};

export const getWorkloadSummary = async (): Promise<BurnoutReport> => {
  const response = await API.get("/schedule/workload");
  return response.data;
};
