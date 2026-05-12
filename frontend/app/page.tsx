"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWeekSchedule, completeSession, missSession } from "@/src/services/schedule";
import { getAssignments } from "@/src/services/assignments";
import { getToken } from "@/src/services/auth";
import { WeekSchedule, StudySession } from "@/src/types/schedule";
import { Assignment } from "@/src/types/assignment";

const RISK_COLORS = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

const RISK_BG = {
  low: "bg-green-500/10 border-green-500",
  medium: "bg-yellow-500/10 border-yellow-500",
  high: "bg-red-500/10 border-red-500",
};

export default function Dashboard() {
  const router = useRouter();
  const [week, setWeek] = useState<WeekSchedule | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [weekData, assignmentData] = await Promise.all([
        getWeekSchedule(),
        getAssignments(),
      ]);
      setWeek(weekData);
      setAssignments(assignmentData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (session: StudySession) => {
    setActionLoading(session.id);
    try {
      await completeSession(session.id);
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleMiss = async (session: StudySession) => {
    setActionLoading(session.id);
    try {
      await missSession(session.id, 0);
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = week?.sessions.filter((s) => s.scheduled_date === today) ?? [];
  const upcomingAssignments = assignments
    .filter((a) => !a.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const totalWeekHours = week?.workload.reduce((sum, d) => sum + d.total_hours, 0) ?? 0;
  const burnout = week?.burnout;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Adaptive workload overview for this week.</p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Upcoming Deadlines</h2>
            <p className="text-4xl font-bold">{upcomingAssignments.length}</p>
            <p className="text-zinc-400 mt-2">assignments pending</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Burnout Risk</h2>
            <p className={`text-4xl font-bold capitalize ${burnout ? RISK_COLORS[burnout.overall_risk] : "text-zinc-400"}`}>
              {burnout?.overall_risk ?? "—"}
            </p>
            <p className="text-zinc-400 mt-2 text-sm">
              {burnout?.peak_day
                ? `peak on ${burnout.peak_day} (${burnout.peak_hours}h)`
                : "no sessions scheduled"}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Planned Study Hours</h2>
            <p className="text-4xl font-bold">{totalWeekHours.toFixed(1)}h</p>
            <p className="text-zinc-400 mt-2">
              across {week?.workload.length ?? 0} days this week
            </p>
          </div>

        </div>

        {/* Today's Schedule */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Today&apos;s Schedule</h2>

          {todaySessions.length === 0 ? (
            <p className="text-zinc-400">No sessions scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className={`bg-zinc-800 rounded-xl p-4 flex justify-between items-center ${
                    session.completed ? "opacity-50" : ""
                  }`}
                >
                  <div>
                    <h3 className="font-semibold">
                      {session.assignment_title ?? "Study Session"}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {session.course_code && (
                        <span className="font-mono text-xs bg-zinc-700 px-2 py-0.5 rounded mr-2">
                          {session.course_code}
                        </span>
                      )}
                      {session.scheduled_hours}h planned
                    </p>
                  </div>

                  {!session.completed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(session)}
                        disabled={actionLoading === session.id}
                        className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition disabled:opacity-50"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleMiss(session)}
                        disabled={actionLoading === session.id}
                        className="bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-600 transition disabled:opacity-50"
                      >
                        Missed
                      </button>
                    </div>
                  )}

                  {session.completed && (
                    <span className="text-green-400 text-sm font-medium">✓ Done</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Upcoming Assignments</h2>

          {upcomingAssignments.length === 0 ? (
            <p className="text-zinc-400">No pending assignments.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((a) => {
                const dueDate = new Date(a.due_date);
                const daysLeft = Math.ceil(
                  (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={a.id} className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        {a.estimated_hours}h estimated ·{" "}
                        <span className={daysLeft <= 2 ? "text-red-400" : "text-zinc-400"}>
                          {daysLeft <= 0 ? "overdue" : `${daysLeft}d left`}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((p) => (
                        <div
                          key={p}
                          className={`w-2 h-2 rounded-full ${
                            p <= a.priority ? "bg-white" : "bg-zinc-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Adaptive Warning */}
        {burnout && burnout.overall_risk !== "low" && (
          <div className={`border rounded-2xl p-6 ${RISK_BG[burnout.overall_risk]}`}>
            <h2 className={`text-xl font-semibold mb-2 ${RISK_COLORS[burnout.overall_risk]}`}>
              ⚠ Adaptive Warning
            </h2>
            <p className="text-zinc-300">{burnout.message}</p>
          </div>
        )}

      </div>
    </main>
  );
}
