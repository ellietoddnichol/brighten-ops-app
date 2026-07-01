# Brighten Ops App – Product Plan

## Overview

Brighten Ops is an internal operations platform for Brighten Solar, a residential and light-commercial solar installation company. The platform centralises job management, employee scheduling, installation cost estimation, and field labour tracking so that operations staff can run day-to-day workflows from a single tool instead of spreadsheets and disconnected apps.

---

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Replace manual CSV-based job tracking with a structured database | High |
| 2 | Provide a real-time dashboard showing active, scheduled, and completed jobs | High |
| 3 | Automate install-cost estimation via a configurable calculator | High |
| 4 | Track field-labour hours and compare actual vs. budgeted labour | High |
| 5 | Import legacy data (jobs, employees, rates) from existing CSV exports | Medium |
| 6 | Role-based access control for admin, dispatcher, and field-tech roles | Medium |
| 7 | Mobile-responsive UI for field use | Low |

---

## User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access – manage employees, rates, system settings |
| **Dispatcher** | Create and assign jobs; run install calculator; view labour reports |
| **Field Tech** | View assigned jobs; log labour hours |

---

## Core Features

### 1. Job Management
- Create, read, update, and delete (CRUD) jobs with status tracking (`SCHEDULED`, `IN_PROGRESS`, `COMPLETE`, `CANCELLED`)
- Attach one or more employees to a job
- Store site address, system size (kW), panel count, and inverter type
- Link estimated vs. actual labour hours per job

### 2. Install Calculator
- Input: system size (kW), panel count, roof type, add-ons (battery, EV charger, monitoring)
- Output: labour-hour estimate, material-cost estimate, total-cost estimate
- Save calculator runs linked to a job record

### 3. Labour Tool
- Record daily clock-in / clock-out events per employee per job
- Compute total hours, overtime (> 8 h/day or > 40 h/week), and cost at applicable rate
- Compare actual vs. budgeted hours per job

### 4. Employee Management
- Employee profiles with name, role, hourly rate, and certifications
- Active/inactive status toggle

### 5. Rates Management
- Configure labour rates by role and date range (handles rate changes over time)
- Material price list with unit costs

### 6. Reporting
- Job summary report (status, estimated/actual hours, margin)
- Employee utilisation report (hours worked per period)
- Cost-variance report per job

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| API | Hono (Node.js), TypeScript |
| Database | SQLite (development), PostgreSQL (production) |
| ORM | Prisma |
| Monorepo | pnpm workspaces |
| Testing | Vitest |

---

## Milestones

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| M1 | Monorepo scaffold, data model, sample data import | Week 1 |
| M2 | Job CRUD API + basic web dashboard | Week 2 |
| M3 | Install calculator API + UI | Week 3 |
| M4 | Labour tool API + UI | Week 4 |
| M5 | Auth, roles, and production hardening | Week 5 |
