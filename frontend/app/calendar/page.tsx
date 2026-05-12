"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getWeekSchedule, completeSession, missSession } from "@/src/services/schedule";
import { getToken } from "@/src/services/auth";
import { WeekSchedule, StudySession, WorkloadDay } from "@/src/types/schedule";

const RISK_BAR_COLOR: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const RISK_TEXT: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function CalendarPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchWeek = useCallback(async (start: Date) => {
    setLoading(true);
    setError("");
    try {
      const data = await getWeekSchedule(toISODate(start));
      setWeekData(data);
    } catch {
      setError("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

  const handleComplete = async (session: StudySession) => {
    setActionLoading(session.id);
    try {
      await completeSession(session.id);
      await fetchWeek(weekStart);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMiss = async (session: StudySession) => {
    setActionLoading(session.id);
    try {
      await missSession(session.id, 0);
      await fetchWeek(weekStart);
    } finally {
      setActionLoading(null);
    }
  };

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  // Build a map of date → sessions and workload
  const sessionsByDay: Record<string, StudySession[]> = {};
  const workloadByDay: Record<string, WorkloadDay> = {};

  weekData?.sessions.forEach((s) => {
    if (!sessionsByDay[s.scheduled_date]) sessionsByDay[s.scheduled_date] = [];
    sessionsByDay[s.scheduled_date].push(s);
  });
  weekData?.workload.forEach((w) => {
    workloadByDay[w.day] = w;
  });

  const today = toISODate(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-2">Calendar</h1>
            <p className="text-zinc-400">Weekly study schedule view.</p>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevWeek}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-lg"
            >
              ←
            </button>
            <button
              onClick={goToday}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={nextWeek}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-lg"
            >
              →
            </button>
          </div>
        </div>

        {/* Week label */}
        <p className="text-zinc-400 text-sm mb-6">{weekLabel}</p>

        {/* Burnout banner */}
        {weekData?.burnout && weekData.burnout.overall_risk !== "low" && (
          <div className={`border rounded-2xl px-5 py-4 mb-6 flex items-start gap-3 ${
            weekData.burnout.overall_risk === "high"
              ? "bg-red-500/10 border-red-500"
              : "bg-yellow-500/10 border-yellow-500"
          }`}>
            <span className="text-xl">⚠</span>
            <div>
              <p className={`font-semibold capitalize ${RISK_TEXT[weekData.burnout.overall_risk]}`}>
                {weekData.burnout.overall_risk} burnout risk this week
              </p>
              <p className="text-zinc-300 text-sm mt-1">{weekData.burnout.message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl px-5 py-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 7-day grid */}
        <div className="grid grid-cols-7 gap-3 mb-8">
          {weekDays.map((day, i) => {
            const dateStr = toISODate(day);
            const isToday = dateStr === today;
            const workload = workloadByDay[dateStr];
            const sessions = sessionsByDay[dateStr] ?? [];
            const totalHours = workload?.total_hours ?? 0;
            const risk = workload?.risk ?? "low";

            return (
              <div
                key={dateStr}
                className={`bg-zinc-900 border rounded-2xl p-3 flex flex-col min-h-[160px] ${
                  isToday ? "border-white" : "border-zinc-800"
                }`}
              >
                {/* Day header */}
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-0.5 ${isToday ? "text-white" : "text-zinc-500"}`}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? "text-white" : "text-zinc-300"}`}>
                    {day.getDate()}
                  </p>
                </div>

                {/* Workload bar */}
                {totalHours > 0 && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${RISK_BAR_COLOR[risk]}`}
                        style={{ width: `${Math.min((totalHours / 9) * 100, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${RISK_TEXT[risk]}`}>{totalHours}h</p>
                  </div>
                )}

                {/* Sessions */}
                <div className="flex flex-col gap-1.5 flex-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`text-xs rounded-lg px-2 py-1.5 ${
                        s.completed
                          ? "bg-zinc-700 text-zinc-500 line-through"
                          : "bg-zinc-800 text-zinc-200"
                      }`}
                    >
                      <p className="font-medium truncate">{s.assignment_title ?? "Session"}</p>
                      <p className="text-zinc-500">{s.scheduled_hours}h</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Session detail list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-5">
            This Week&apos;s Sessions
          </h2>

          {loading ? (
            <p className="text-zinc-400">Loading...</p>
          ) : !weekData || weekData.sessions.length === 0 ? (
            <p className="text-zinc-400">
              No sessions scheduled this week.{" "}
              <a href="/assignments" className="text-white underline">
                Add assignments
              </a>{" "}
              to generate a schedule.
            </p>
          ) : (
            <div className="space-y-3">
              {weekData.sessions.map((session) => {
                const sessionDate = new Date(session.scheduled_date + "T00:00:00");
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between bg-zinc-800 rounded-xl p-4 ${
                      session.completed ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Date pill */}
                      <div className="text-center bg-zinc-700 rounded-xl px-3 py-2 min-w-[52px]">
                        <p className="text-xs text-zinc-400">
                          {sessionDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold leading-none">{sessionDate.getDate()}</p>
                      </div>

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
                    </div>

                    {session.completed ? (
                      <span className="text-green-400 text-sm font-medium">✓ Done</span>
                    ) : (
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
