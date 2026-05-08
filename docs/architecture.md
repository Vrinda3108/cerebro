# Architecture

## System Overview

Atlas follows a modern full-stack architecture consisting of:

- frontend client
- backend API service
- relational database
- scheduling engine
- analytics layer

---

# High-Level Architecture

```text
+-------------------+
|   Frontend (UI)   |
| Next.js + Tailwind|
+---------+---------+
          |
          | REST API Requests
          v
+-------------------+
|   Backend API     |
|      FastAPI      |
+---------+---------+
          |
          |
+---------+---------+
| Scheduling Engine |
| Workload Logic    |
| Adaptive Recalc   |
+---------+---------+
          |
          v
+-------------------+
|   PostgreSQL DB   |
+-------------------+
```

---

# Frontend

## Responsibilities

- Dashboard rendering
- Schedule visualization
- Analytics display
- Assignment management
- User interactions
- Workload heatmaps
- Notification display

## Technologies

- Next.js
- TypeScript
- Tailwind CSS
- React

---

# Backend API

## Responsibilities

- Authentication
- Data validation
- REST API endpoints
- Schedule generation requests
- Database interaction
- Syllabus processing

## Technologies

- FastAPI
- Python
- SQLAlchemy

---

# Scheduling Engine

## Responsibilities

- Task prioritization
- Workload balancing
- Deadline optimization
- Adaptive rescheduling
- Burnout detection
- Conflict handling

## Core Logic

The scheduling engine dynamically redistributes workload based on:

- assignment deadlines
- estimated effort
- available study hours
- missed tasks
- overload thresholds

---

# Database Layer

## Responsibilities

- Persistent storage
- User/course management
- Assignment tracking
- Schedule history
- Analytics storage

## Technologies

- PostgreSQL

---

# Future Architecture Enhancements

- Background task processing
- AI recommendation service
- Calendar synchronization service
- Real-time notifications
- Mobile application support
- Distributed scheduling workers
