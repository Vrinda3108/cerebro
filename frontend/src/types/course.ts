export interface Course {
  id: string; // UUID
  user_id: string;
  course_name: string;
  course_code: string;
  instructor: string | null;
  term: string | null;
  created_at: string;
}
