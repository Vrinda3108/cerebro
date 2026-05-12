export interface Assignment {
  id: string;
  title: string;
  due_date: string; // ISO datetime string
  estimated_hours: number;
  priority: number; // 1=low, 2=medium, 3=high
  completed: boolean;
  course_id: string;
  created_at: string;
}
