"use client";

import { useEffect, useState } from "react";
import { getCourses, createCourse, deleteCourse } from "@/src/services/courses";
import { Course } from "@/src/types/course";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [term, setTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await createCourse(courseName, courseCode, instructor, term);
      setCourses((prev) => [...prev, created]);
      setCourseName("");
      setCourseCode("");
      setInstructor("");
      setTerm("");
      setShowForm(false);
    } catch {
      setError("Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete course");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-2">Courses</h1>
            <p className="text-zinc-400">Manage your enrolled courses.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-white text-black font-semibold px-5 py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            {showForm ? "Cancel" : "+ Add Course"}
          </button>
        </div>

        {/* Add Course Form */}
        {showForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-5">New Course</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Course Name *</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Course Code *</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CMPUT 301"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Instructor</label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Dr. Smith"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Term</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Fall 2025"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm col-span-2">{error}</p>
              )}

              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Course"}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Course List */}
        {loading ? (
          <div className="text-zinc-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-400 text-lg">No courses yet.</p>
            <p className="text-zinc-500 text-sm mt-2">Add your first course to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-zinc-700 text-zinc-300 text-xs font-mono px-2 py-1 rounded-lg">
                      {course.course_code}
                    </span>
                    {course.term && (
                      <span className="text-zinc-500 text-xs">{course.term}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{course.course_name}</h3>
                  {course.instructor && (
                    <p className="text-zinc-400 text-sm mt-1">{course.instructor}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(course.id)}
                  className="text-zinc-500 hover:text-red-400 transition text-sm px-3 py-2 rounded-lg hover:bg-zinc-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
