"""
Core scheduling engine for Cerebro.

Responsibilities:
- Distribute assignment work across available days
- Recalculate sessions after a missed task (recovery)
- Compute daily/weekly workload totals
- Detect burnout risk
"""

from datetime import date, timedelta
from dataclasses import dataclass


# ─── Config ──────────────────────────────────────────────────────────────────

MAX_HOURS_PER_DAY_PER_ASSIGNMENT = 3.0   # max a single assignment takes per day
DAILY_WORKLOAD_SOFT_LIMIT = 6.0          # hours/day before "medium" risk
DAILY_WORKLOAD_HARD_LIMIT = 9.0          # hours/day before "high" risk
CONSECUTIVE_HEAVY_DAYS_THRESHOLD = 3     # days in a row above soft limit → warning


# ─── Data classes ────────────────────────────────────────────────────────────

@dataclass
class ScheduledSession:
    scheduled_date: date
    scheduled_hours: float


@dataclass
class WorkloadDay:
    day: date
    total_hours: float
    risk: str  # "low" | "medium" | "high"


@dataclass
class BurnoutReport:
    overall_risk: str          # "low" | "medium" | "high"
    peak_day: date | None
    peak_hours: float
    at_risk_days: list[date]
    consecutive_heavy_days: int
    message: str


# ─── Scheduler ───────────────────────────────────────────────────────────────

def generate_sessions(
    estimated_hours: float,
    due_date: date,
    start_date: date | None = None,
    max_hours_per_day: float = MAX_HOURS_PER_DAY_PER_ASSIGNMENT,
    blocked_days: list[date] | None = None,
) -> list[ScheduledSession]:
    """
    Distribute `estimated_hours` of work across available days before `due_date`.

    Args:
        estimated_hours: Total hours needed for the assignment.
        due_date: The assignment deadline (work scheduled up to day before).
        start_date: First day to schedule work (defaults to today).
        max_hours_per_day: Cap per session so work is spread out.
        blocked_days: Days the user is unavailable (e.g. no-work days).

    Returns:
        List of ScheduledSession objects sorted by date.

    Raises:
        ValueError: If there are no available days before the deadline.
    """
    today = start_date or date.today()
    blocked = set(blocked_days or [])

    # Collect available days: today up to (but not including) due_date
    available_days = [
        today + timedelta(days=i)
        for i in range((due_date.date() if hasattr(due_date, "date") else due_date - today).days
                       if not hasattr(due_date, "date")
                       else (due_date.date() - today).days)
        if (today + timedelta(days=i)) not in blocked
    ]

    # Normalise due_date to a date object
    due = due_date.date() if hasattr(due_date, "date") else due_date
    available_days = [
        today + timedelta(days=i)
        for i in range((due - today).days)
        if (today + timedelta(days=i)) not in blocked
    ]

    if not available_days:
        raise ValueError(
            f"No available days between {today} and {due_date} to schedule work."
        )

    sessions: list[ScheduledSession] = []
    remaining = float(estimated_hours)

    # Front-load slightly: give earlier days a weight of 1.2 vs later days 0.8
    # This creates a gentle taper so there's buffer near the deadline.
    n = len(available_days)
    weights = [1.2 if i < n // 2 else 0.8 for i in range(n)]
    total_weight = sum(weights)

    for i, day in enumerate(available_days):
        if remaining <= 0:
            break

        # Proportional share of remaining work, capped at max_hours_per_day
        proportional = (weights[i] / total_weight) * float(estimated_hours)
        hours = min(proportional, max_hours_per_day, remaining)
        hours = round(hours * 2) / 2  # round to nearest 0.5h

        # Ensure we always schedule at least 0.5h if there's still work remaining
        # (prevents small assignments from being rounded away entirely)
        if hours == 0 and remaining > 0:
            hours = min(0.5, remaining)

        if hours > 0:
            sessions.append(ScheduledSession(scheduled_date=day, scheduled_hours=hours))
            remaining -= hours

    # If rounding left a remainder, add it to the last session (up to cap)
    if remaining > 0.01 and sessions:
        last = sessions[-1]
        extra = min(remaining, max_hours_per_day - last.scheduled_hours)
        sessions[-1] = ScheduledSession(
            scheduled_date=last.scheduled_date,
            scheduled_hours=round((last.scheduled_hours + extra) * 2) / 2,
        )

    return sessions


def recover_sessions(
    estimated_hours: float,
    due_date: date,
    completed_hours: float,
    resume_date: date | None = None,
    max_hours_per_day: float = MAX_HOURS_PER_DAY_PER_ASSIGNMENT,
    blocked_days: list[date] | None = None,
) -> list[ScheduledSession]:
    """
    Recalculate sessions after a missed task.

    Takes the remaining hours (estimated - completed) and redistributes
    them across the days still available before the deadline.

    Args:
        estimated_hours: Original total hours for the assignment.
        due_date: The assignment deadline.
        completed_hours: Hours already completed before the miss.
        resume_date: First day to reschedule from (defaults to today).
        max_hours_per_day: Cap per session.
        blocked_days: Days the user is unavailable.

    Returns:
        New list of ScheduledSession objects for the remaining work.

    Raises:
        ValueError: If there are no days left or work is already complete.
    """
    remaining = estimated_hours - completed_hours
    if remaining <= 0:
        return []

    return generate_sessions(
        estimated_hours=remaining,
        due_date=due_date,
        start_date=resume_date or date.today(),
        max_hours_per_day=max_hours_per_day,
        blocked_days=blocked_days,
    )


# ─── Workload calculator ─────────────────────────────────────────────────────

def compute_daily_workload(
    sessions: list[tuple[date, float]],  # (date, hours) pairs from all assignments
) -> list[WorkloadDay]:
    """
    Aggregate total hours per day across all assignments and assign risk levels.

    Args:
        sessions: List of (date, hours) tuples from all scheduled sessions.

    Returns:
        List of WorkloadDay objects sorted by date.
    """
    totals: dict[date, float] = {}
    for day, hours in sessions:
        totals[day] = totals.get(day, 0.0) + hours

    result = []
    for day in sorted(totals):
        total = round(totals[day], 2)
        if total >= DAILY_WORKLOAD_HARD_LIMIT:
            risk = "high"
        elif total >= DAILY_WORKLOAD_SOFT_LIMIT:
            risk = "medium"
        else:
            risk = "low"
        result.append(WorkloadDay(day=day, total_hours=total, risk=risk))

    return result


# ─── Burnout detection ───────────────────────────────────────────────────────

def detect_burnout(workload_days: list[WorkloadDay]) -> BurnoutReport:
    """
    Analyse a workload schedule and return a burnout risk report.

    Rules:
    - Any day >= HARD_LIMIT → high risk
    - 3+ consecutive days >= SOFT_LIMIT → medium risk minimum
    - Overall risk = worst single-day risk, elevated by consecutive streaks

    Args:
        workload_days: Output from compute_daily_workload().

    Returns:
        BurnoutReport with risk level, peak day, and at-risk dates.
    """
    if not workload_days:
        return BurnoutReport(
            overall_risk="low",
            peak_day=None,
            peak_hours=0.0,
            at_risk_days=[],
            consecutive_heavy_days=0,
            message="No scheduled work found.",
        )

    at_risk_days = [w.day for w in workload_days if w.risk in ("medium", "high")]
    high_days = [w.day for w in workload_days if w.risk == "high"]

    peak = max(workload_days, key=lambda w: w.total_hours)

    # Count max consecutive days above soft limit
    max_streak = 0
    current_streak = 0
    for w in workload_days:
        if w.total_hours >= DAILY_WORKLOAD_SOFT_LIMIT:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0

    # Determine overall risk
    if high_days:
        overall_risk = "high"
    elif max_streak >= CONSECUTIVE_HEAVY_DAYS_THRESHOLD:
        overall_risk = "medium"
    elif at_risk_days:
        overall_risk = "medium"
    else:
        overall_risk = "low"

    # Build human-readable message
    if overall_risk == "high":
        message = (
            f"High overload risk detected. "
            f"{len(high_days)} day(s) exceed {DAILY_WORKLOAD_HARD_LIMIT}h. "
            f"Consider reducing scope or extending deadlines."
        )
    elif overall_risk == "medium":
        if max_streak >= CONSECUTIVE_HEAVY_DAYS_THRESHOLD:
            message = (
                f"{max_streak} consecutive heavy days detected. "
                f"Schedule a rest day to avoid burnout."
            )
        else:
            message = (
                f"Moderate workload detected on {len(at_risk_days)} day(s). "
                f"Monitor your schedule closely."
            )
    else:
        message = "Workload looks manageable. No burnout risk detected."

    return BurnoutReport(
        overall_risk=overall_risk,
        peak_day=peak.day,
        peak_hours=peak.total_hours,
        at_risk_days=at_risk_days,
        consecutive_heavy_days=max_streak,
        message=message,
    )
