# Database Schema

## Overview

Atlas uses a relational PostgreSQL database to manage users, courses, assignments, schedules, and workload analytics.

---

# Core Tables

## users

Stores user account information.

| Field         | Type      | Description                |
| ------------- | --------- | -------------------------- |
| id            | UUID      | Primary key                |
| name          | VARCHAR   | User full name             |
| email         | VARCHAR   | Unique email               |
| password_hash | VARCHAR   | Encrypted password         |
| created_at    | TIMESTAMP | Account creation timestamp |

---

## courses

Stores academic course information.

| Field       | Type      | Description        |
| ----------- | --------- | ------------------ |
| id          | UUID      | Primary key        |
| user_id     | UUID      | Owner reference    |
| course_name | VARCHAR   | Course title       |
| instructor  | VARCHAR   | Instructor name    |
| term        | VARCHAR   | Academic term      |
| created_at  | TIMESTAMP | Creation timestamp |

---

## assignments

Stores assignment and exam data.

| Field           | Type      | Description        |
| --------------- | --------- | ------------------ |
| id              | UUID      | Primary key        |
| course_id       | UUID      | Associated course  |
| title           | VARCHAR   | Assignment title   |
| due_date        | TIMESTAMP | Deadline           |
| estimated_hours | INTEGER   | Estimated workload |
| priority        | INTEGER   | Priority level     |
| completed       | BOOLEAN   | Completion status  |
| created_at      | TIMESTAMP | Creation timestamp |

---

## schedules

Stores generated study sessions and workload distribution.

| Field           | Type    | Description               |
| --------------- | ------- | ------------------------- |
| id              | UUID    | Primary key               |
| user_id         | UUID    | Associated user           |
| assignment_id   | UUID    | Linked assignment         |
| scheduled_date  | DATE    | Planned work date         |
| scheduled_hours | FLOAT   | Planned study duration    |
| completed       | BOOLEAN | Session completion status |

---

## workload_logs

Stores workload analytics and scheduling history.

| Field          | Type      | Description               |
| -------------- | --------- | ------------------------- |
| id             | UUID      | Primary key               |
| user_id        | UUID      | Associated user           |
| workload_score | FLOAT     | Calculated workload level |
| burnout_risk   | FLOAT     | Burnout estimation score  |
| generated_at   | TIMESTAMP | Calculation timestamp     |

---

# Relationships

```text
users
  |
  +---- courses
            |
            +---- assignments
                        |
                        +---- schedules

users
  |
  +---- workload_logs
```

---

# Planned Future Tables

## syllabus_uploads

Stores uploaded syllabus metadata and extracted content.

## notifications

Stores overload warnings and scheduling alerts.

## productivity_metrics

Stores long-term study and scheduling analytics.

## calendar_integrations

Stores external calendar synchronization data.

---

# Design Considerations

## UUID Primary Keys

Used for scalable and globally unique identifiers.

## Normalized Relationships

Prevents duplicate data and improves query consistency.

## Schedule History Retention

Allows future analytics and workload trend visualization.

## Extensibility

Schema is designed to support future AI recommendation systems and advanced analytics features.
