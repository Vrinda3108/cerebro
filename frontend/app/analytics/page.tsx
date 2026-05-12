"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWeekSchedule, getWorkloadSummary } from "@/src/services/schedule";
import { getAssignments } from "@/src/services/assignments";
import { getToken } from "@/src/services/auth";
import { WeekSchedule, BurnoutReport } from "@/src/types/schedule";
import { Assignment } from "@/src/types/assignment";

const RISK_COLORS = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

const RISK_BG = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const router = useRouter();
  const [week, setWeek] = useState<WeekSchedule | null>(null);
  const [burnout, setBurnout] = useState<BurnoutReport | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [weekData, burnoutData, assignmentData] = await Promise.all([
        getWeekSchedule(),
        getWorkloadSummary(),
        getAssignments(),
      ]);
      setWeek(weekData);
      setBurnout(burnoutData);
      setAssignments(assignmentData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const totalWeekHours = week?.workload.reduce((sum, d) => sum + d.total_hours, 0) ?? 0;
  const pending = assignments.filter((a) => !a.completed);

  // Find course with highest workload this week
  const courseHours: Record<string, number> = {};
  week?.sessions.forEach((s) => {
    if (s.course_code) {
      courseHours[s.course_code] = (courseHours[s.course_code] ?? 0) + s.scheduled_hours;
    }
  });
  const topCourse = Object.entries(courseHours).sort((a, b) => b[1] - a[1])[0];

  // Heatmap data (7 days)
  const heatmapDays = week?.workload.slice(0, 7) ?? [];
  const maxHours = Math.max(...heatmapDays.map((d) => d.total_hours), 1);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-2">Analytics</h1>
          <p className="text-zinc-400">Workload trends and productivity insights.</p>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Weekly Study Hours</h2>
            <p className="text-4xl font-bold">{totalWeekHours.toFixed(1)}h</p>
            <p className="text-zinc-400 mt-2">
              {week?.workload.length ?? 0} days scheduled
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Highest Workload</h2>
            {topCourse ? (
              <>
                <p className="text-2xl font-bold">{topCourse[0]}</p>
                <p className="text-zinc-400 mt-2">{topCourse[1].toFixed(1)}h planned</p>
              </>
            ) : (
              <p className="text-zinc-400 mt-2">No sessions scheduled</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Burnout Risk</h2>
            <p className={`text-4xl font-bold capitalize ${burnout ? RISK_COLORS[burnout.overall_risk] : "text-zinc-400"}`}>
              {burnout?.overall_risk ?? "—"}
            </p>
            <p className="text-zinc-400 mt-2 text-sm">
              {burnout?.peak_day
                ? `peak ${burnout.peak_hours}h on ${new Date(burnout.peak_day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "no sessions scheduled"}
            </p>
          </div>

        </div>

        {/* Weekly Workload Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Weekly Workload Heatmap</h2>

          {heatmapDays.length === 0 ? (
            <p className="text-zinc-400">No workload data for this week.</p>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {heatmapDays.map((day, i) => {
                const dayDate = new Date(day.day + "T00:00:00");
                const heightPercent = (day.total_hours / maxHours) * 100;
                return (
                  <div key={day.day} className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-sm text-zinc-400 mb-2">{DAY_LABELS[i]}</p>
                    <div className="h-20 flex items-end justify-center">
                      <div
                        className={`w-full rounded-lg ${RISK_BG[day.risk]}`}
                        style={{ height: `${Math.max(heightPercent, 5)}%`, opacity: 0.7 }}
                      />
                    </div>
                    <p className={`text-xs mt-2 font-semibold ${RISK_COLORS[day.risk]}`}>
                      {day.total_hours}h
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Adaptive Insights */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Adaptive Insights</h2>

          {burnout && burnout.overall_risk !== "low" ? (
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-zinc-300">{burnout.message}</p>
              </div>

              {burnout.at_risk_days.length > 0 && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-300">
                    {burnout.at_risk_days.length} day(s) exceed recommended workload thresholds:{" "}
                    {burnout.at_risk_days.map((d) =>
                      new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    ).join(", ")}
                  </p>
                </div>
              )}

              {burnout.consecutive_heavy_days >= 3 && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-300">
                    You have {burnout.consecutive_heavy_days} consecutive heavy days scheduled. Consider adding a rest day to avoid burnout.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-300">
                Your workload looks manageable this week. No burnout risk detected.
              </p>
            </div>
          )}
        </div>

        {/* Pending Assignments Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Pending Assignments</h2>

          {pending.length === 0 ? (
            <p className="text-zinc-400">No pending assignments.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((a) => {
                const daysLeft = Math.ceil(
                  (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysLeft <= 0;
                const isUrgent = daysLeft <= 2 && !isOverdue;

                return (
                  <div key={a.id} className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        {a.estimated_hours}h estimated ·{" "}
                        <span className={
                          isOverdue ? "text-red-400" :
                          isUrgent ? "text-yellow-400" :
                          "text-zinc-400"
                        }>
                          {isOverdue ? "overdue" : `${daysLeft}d left`}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
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

      </div>
    </main>
  );
}
