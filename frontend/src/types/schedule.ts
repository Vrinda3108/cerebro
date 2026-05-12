export interface StudySession {
  id: string;
  assignment_id: string;
  scheduled_date: string; // ISO date string "YYYY-MM-DD"
  scheduled_hours: number;
  completed: boolean;
  assignment_title: string | null;
  course_code: string | null;
}

export interface WorkloadDay {
  day: string; // ISO date string
  total_hours: number;
  risk: "low" | "medium" | "high";
}

export interface BurnoutReport {
  overall_risk: "low" | "medium" | "high";
  peak_day: string | null;
  peak_hours: number;
  at_risk_days: string[];
  consecutive_heavy_days: number;
  message: string;
}

export interface WeekSchedule {
  week_start: string;
  week_end: string;
  sessions: StudySession[];
  workload: WorkloadDay[];
  burnout: BurnoutReport;
}
