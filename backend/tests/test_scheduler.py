"""
Tests for the Cerebro scheduling engine.
Run with: pytest tests/test_scheduler.py -v
"""

import pytest
from datetime import date, timedelta

from app.services.scheduler import (
    generate_sessions,
    recover_sessions,
    compute_daily_workload,
    detect_burnout,
    DAILY_WORKLOAD_SOFT_LIMIT,
    DAILY_WORKLOAD_HARD_LIMIT,
)


# ─── generate_sessions ───────────────────────────────────────────────────────

class TestGenerateSessions:

    def test_total_hours_matches_estimate(self):
        """Sessions should sum to the estimated hours."""
        sessions = generate_sessions(
            estimated_hours=10,
            due_date=date.today() + timedelta(days=7),
        )
        total = sum(s.scheduled_hours for s in sessions)
        assert abs(total - 10) < 0.6  # allow small rounding tolerance

    def test_no_session_exceeds_daily_cap(self):
        """No single session should exceed max_hours_per_day."""
        sessions = generate_sessions(
            estimated_hours=12,
            due_date=date.today() + timedelta(days=5),
            max_hours_per_day=3.0,
        )
        for s in sessions:
            assert s.scheduled_hours <= 3.0 + 0.01

    def test_sessions_are_before_due_date(self):
        """All sessions must be scheduled before the due date."""
        due = date.today() + timedelta(days=10)
        sessions = generate_sessions(estimated_hours=8, due_date=due)
        for s in sessions:
            assert s.scheduled_date < due

    def test_sessions_sorted_by_date(self):
        """Sessions should be in chronological order."""
        sessions = generate_sessions(
            estimated_hours=6,
            due_date=date.today() + timedelta(days=8),
        )
        dates = [s.scheduled_date for s in sessions]
        assert dates == sorted(dates)

    def test_blocked_days_excluded(self):
        """Blocked days should not appear in the schedule."""
        today = date.today()
        blocked = [today, today + timedelta(days=1)]
        sessions = generate_sessions(
            estimated_hours=4,
            due_date=today + timedelta(days=6),
            blocked_days=blocked,
        )
        session_dates = {s.scheduled_date for s in sessions}
        for b in blocked:
            assert b not in session_dates

    def test_raises_when_no_available_days(self):
        """Should raise ValueError if due date is today or in the past."""
        with pytest.raises(ValueError):
            generate_sessions(
                estimated_hours=5,
                due_date=date.today(),  # no days available
            )

    def test_front_loading(self):
        """Earlier sessions should generally have >= hours than later ones."""
        sessions = generate_sessions(
            estimated_hours=9,
            due_date=date.today() + timedelta(days=6),
        )
        if len(sessions) >= 4:
            first_half = sum(s.scheduled_hours for s in sessions[: len(sessions) // 2])
            second_half = sum(s.scheduled_hours for s in sessions[len(sessions) // 2 :])
            assert first_half >= second_half

    def test_small_assignment_single_session(self):
        """A 1-hour assignment with many days should still produce at least 1 session."""
        sessions = generate_sessions(
            estimated_hours=1,
            due_date=date.today() + timedelta(days=14),
        )
        assert len(sessions) >= 1
        assert sum(s.scheduled_hours for s in sessions) >= 0.9

    def test_custom_start_date(self):
        """Sessions should start from the provided start_date."""
        start = date.today() + timedelta(days=2)
        sessions = generate_sessions(
            estimated_hours=4,
            due_date=date.today() + timedelta(days=8),
            start_date=start,
        )
        for s in sessions:
            assert s.scheduled_date >= start


# ─── recover_sessions ────────────────────────────────────────────────────────

class TestRecoverSessions:

    def test_recovery_uses_remaining_hours(self):
        """Recovery should only schedule the remaining (unfinished) hours."""
        sessions = recover_sessions(
            estimated_hours=10,
            due_date=date.today() + timedelta(days=7),
            completed_hours=4,
        )
        total = sum(s.scheduled_hours for s in sessions)
        assert abs(total - 6) < 0.6

    def test_fully_completed_returns_empty(self):
        """If all hours are done, recovery should return no sessions."""
        sessions = recover_sessions(
            estimated_hours=8,
            due_date=date.today() + timedelta(days=5),
            completed_hours=8,
        )
        assert sessions == []

    def test_over_completed_returns_empty(self):
        """If completed > estimated, return empty (no negative sessions)."""
        sessions = recover_sessions(
            estimated_hours=5,
            due_date=date.today() + timedelta(days=5),
            completed_hours=6,
        )
        assert sessions == []

    def test_recovery_respects_resume_date(self):
        """Recovered sessions should start from resume_date."""
        resume = date.today() + timedelta(days=1)
        sessions = recover_sessions(
            estimated_hours=6,
            due_date=date.today() + timedelta(days=7),
            completed_hours=2,
            resume_date=resume,
        )
        for s in sessions:
            assert s.scheduled_date >= resume

    def test_recovery_raises_when_no_time_left(self):
        """Should raise ValueError if deadline has passed."""
        with pytest.raises(ValueError):
            recover_sessions(
                estimated_hours=10,
                due_date=date.today(),  # already due
                completed_hours=2,
            )


# ─── compute_daily_workload ──────────────────────────────────────────────────

class TestComputeDailyWorkload:

    def test_aggregates_multiple_assignments(self):
        """Hours from different assignments on the same day should be summed."""
        today = date.today()
        sessions = [
            (today, 2.0),
            (today, 3.0),
            (today + timedelta(days=1), 1.5),
        ]
        workload = compute_daily_workload(sessions)
        day_map = {w.day: w.total_hours for w in workload}
        assert day_map[today] == 5.0
        assert day_map[today + timedelta(days=1)] == 1.5

    def test_risk_levels_assigned_correctly(self):
        """Risk levels should match the defined thresholds."""
        today = date.today()
        sessions = [
            (today, DAILY_WORKLOAD_SOFT_LIMIT - 1),           # low
            (today + timedelta(days=1), DAILY_WORKLOAD_SOFT_LIMIT + 0.5),  # medium
            (today + timedelta(days=2), DAILY_WORKLOAD_HARD_LIMIT + 1),    # high
        ]
        workload = compute_daily_workload(sessions)
        risks = {w.day: w.risk for w in workload}
        assert risks[today] == "low"
        assert risks[today + timedelta(days=1)] == "medium"
        assert risks[today + timedelta(days=2)] == "high"

    def test_sorted_by_date(self):
        """Output should be sorted chronologically."""
        today = date.today()
        sessions = [
            (today + timedelta(days=3), 2.0),
            (today, 1.0),
            (today + timedelta(days=1), 3.0),
        ]
        workload = compute_daily_workload(sessions)
        dates = [w.day for w in workload]
        assert dates == sorted(dates)

    def test_empty_input(self):
        """Empty session list should return empty workload."""
        assert compute_daily_workload([]) == []


# ─── detect_burnout ──────────────────────────────────────────────────────────

class TestDetectBurnout:

    def _make_workload(self, hours_per_day: list[float]) -> list:
        from app.services.scheduler import WorkloadDay
        today = date.today()
        days = []
        for i, h in enumerate(hours_per_day):
            day = today + timedelta(days=i)
            if h >= DAILY_WORKLOAD_HARD_LIMIT:
                risk = "high"
            elif h >= DAILY_WORKLOAD_SOFT_LIMIT:
                risk = "medium"
            else:
                risk = "low"
            days.append(WorkloadDay(day=day, total_hours=h, risk=risk))
        return days

    def test_low_risk_schedule(self):
        workload = self._make_workload([2.0, 3.0, 1.5, 2.5])
        report = detect_burnout(workload)
        assert report.overall_risk == "low"

    def test_high_risk_from_single_heavy_day(self):
        workload = self._make_workload([2.0, DAILY_WORKLOAD_HARD_LIMIT + 1, 2.0])
        report = detect_burnout(workload)
        assert report.overall_risk == "high"

    def test_medium_risk_from_consecutive_days(self):
        # 3 consecutive days at soft limit → medium
        h = DAILY_WORKLOAD_SOFT_LIMIT + 0.5
        workload = self._make_workload([h, h, h, 2.0])
        report = detect_burnout(workload)
        assert report.overall_risk == "medium"
        assert report.consecutive_heavy_days >= 3

    def test_peak_day_identified(self):
        workload = self._make_workload([2.0, 8.0, 3.0, 5.0])
        report = detect_burnout(workload)
        assert report.peak_hours == 8.0

    def test_empty_workload(self):
        report = detect_burnout([])
        assert report.overall_risk == "low"
        assert report.peak_day is None

    def test_at_risk_days_populated(self):
        h_med = DAILY_WORKLOAD_SOFT_LIMIT + 1
        workload = self._make_workload([2.0, h_med, 2.0, h_med])
        report = detect_burnout(workload)
        assert len(report.at_risk_days) == 2

    def test_message_is_non_empty(self):
        workload = self._make_workload([3.0, 4.0])
        report = detect_burnout(workload)
        assert len(report.message) > 0
