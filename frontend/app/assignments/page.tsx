"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssignments, createAssignment, deleteAssignment } from "@/src/services/assignments";
import { generateSchedule } from "@/src/services/schedule";
import { getCourses } from "@/src/services/courses";
import { getToken } from "@/src/services/auth";
import { Assignment } from "@/src/types/assignment";
import { Course } from "@/src/types/course";

const PRIORITY_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };
const PRIORITY_COLOR: Record<number, string> = {
  1: "text-zinc-400 bg-zinc-700",
  2: "text-yellow-400 bg-yellow-500/10",
  3: "text-red-400 bg-red-500/10",
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [priority, setPriority] = useState(1);
  const [courseId, setCourseId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [a, c] = await Promise.all([getAssignments(), getCourses()]);
      setAssignments(a);
      setCourses(c);
      if (c.length > 0 && !courseId) setCourseId(c[0].id);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !courseId) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await createAssignment({
        title,
        due_date: new Date(dueDate).toISOString(),
        estimated_hours: estimatedHours,
        priority,
        course_id: courseId,
      });
      setAssignments((prev) => [created, ...prev]);
      // Auto-generate schedule
      setSchedulingId(created.id);
      try {
        await generateSchedule(created.id);
        setSuccessMsg(`Schedule generated for "${created.title}"`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } catch {
        setSuccessMsg(`"${created.title}" created — generate schedule manually`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } finally {
        setSchedulingId(null);
      }
      // Reset form
      setTitle(""); setDueDate(""); setEstimatedHours(4); setPriority(1);
      setShowForm(false);
    } catch {
      setError("Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Failed to delete assignment");
    }
  };

  const handleGenerateSchedule = async (id: string) => {
    setSchedulingId(id);
    setError("");
    try {
      await generateSchedule(id);
      const a = assignments.find((a) => a.id === id);
      setSuccessMsg(`Schedule generated for "${a?.title}"`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to generate schedule");
    } finally {
      setSchedulingId(null);
    }
  };

  const pending = assignments.filter((a) => !a.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const completed = assignments.filter((a) => a.completed);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-2">Assignments</h1>
            <p className="text-zinc-400">Track work and auto-generate study schedules.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-white text-black font-semibold px-5 py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            {showForm ? "Cancel" : "+ Add Assignment"}
          </button>
        </div>

        {/* Success / Error banners */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500 rounded-xl px-5 py-3 mb-6 text-green-300 text-sm">
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl px-5 py-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Add Assignment Form */}
        {showForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-5">New Assignment</h2>

            {courses.length === 0 ? (
              <p className="text-zinc-400 text-sm">
                You need to{" "}
                <a href="/courses" className="text-white underline">add a course</a>{" "}
                before creating assignments.
              </p>
            ) : (
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Assignment 2 — Linked Lists"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} — {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due date */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Estimated hours */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Estimated Hours: <span className="text-white font-semibold">{estimatedHours}h</span>
                  </label>
                  <input
                    type="range"
                    min={1} max={40} step={1}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>1h</span><span>20h</span><span>40h</span>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Priority</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition ${
                          priority === p
                            ? "bg-white text-black border-white"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        {PRIORITY_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create & Generate Schedule"}
                  </button>
                </div>

              </form>
            )}
          </div>
        )}

        {/* Pending assignments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300">
            Pending <span className="text-zinc-500 font-normal text-base ml-1">({pending.length})</span>
          </h2>

          {pending.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
              <p className="text-zinc-400">No pending assignments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => {
                const course = courseMap[a.course_id];
                const daysLeft = Math.ceil(
                  (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysLeft <= 0;
                const isUrgent = daysLeft <= 2 && !isOverdue;

                return (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-lg">{a.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${PRIORITY_COLOR[a.priority]}`}>
                            {PRIORITY_LABEL[a.priority]}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 flex-wrap text-sm">
                          {course && (
                            <span className="font-mono text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg">
                              {course.course_code}
                            </span>
                          )}
                          <span className="text-zinc-400">{a.estimated_hours}h estimated</span>
                          <span className={
                            isOverdue ? "text-red-400 font-medium" :
                            isUrgent ? "text-yellow-400 font-medium" :
                            "text-zinc-400"
                          }>
                            {isOverdue ? "Overdue" : `${daysLeft}d left`}
                          </span>
                          <span className="text-zinc-500 text-xs">
                            Due {new Date(a.due_date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleGenerateSchedule(a.id)}
                          disabled={schedulingId === a.id}
                          title="Regenerate study schedule"
                          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          {schedulingId === a.id ? "Scheduling..." : "↻ Schedule"}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-zinc-500 hover:text-red-400 transition text-sm px-3 py-2 rounded-lg hover:bg-zinc-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed assignments */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-500">
              Completed <span className="font-normal text-base ml-1">({completed.length})</span>
            </h2>
            <div className="space-y-3">
              {completed.map((a) => {
                const course = courseMap[a.course_id];
                return (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 opacity-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-sm">✓</span>
                          <h3 className="font-medium line-through text-zinc-400">{a.title}</h3>
                        </div>
                        {course && (
                          <span className="font-mono text-xs text-zinc-500 mt-1 block">
                            {course.course_code}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-zinc-600 hover:text-red-400 transition text-sm px-3 py-2 rounded-lg hover:bg-zinc-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
