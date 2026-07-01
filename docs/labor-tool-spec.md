# Labour Tool – Functional Specification

## Purpose

The Labour Tool allows field technicians to clock in and out of jobs and allows dispatchers and admins to review, edit, and report on labour hours. It computes regular and overtime hours, applies the correct pay rate, and compares actual hours to budgeted hours per job.

---

## Features

### 1. Clock-In / Clock-Out

- A field tech selects an active job they are assigned to and records a clock-in timestamp.
- When work ends, the tech records a clock-out timestamp.
- `hoursWorked` is computed automatically: `(clockOut - clockIn) / 3600` seconds.
- An entry with `clockOut = null` represents an active (open) shift.
- Only one open shift per employee per day is allowed.

### 2. Rate Application

- On clock-out, the system looks up the applicable `Rate` for the employee's role on the `clockIn` date.
- The matched rate is stored on `LabourEntry.rateId` so historical entries are not affected by future rate changes.
- If no matching rate exists, the entry is saved but `rateId` is left null and a warning is returned.

### 3. Overtime Calculation

Overtime is computed at two levels:

| Rule | Threshold | Multiplier |
|------|-----------|-----------|
| Daily overtime | > 8 hours in a single day | 1.5× |
| Weekly overtime | > 40 hours in a calendar week (Mon–Sun) | 1.5× |

When computing cost for a labour entry:

```
regularHours = min(hoursWorked, 8)
overtimeHours = max(hoursWorked - 8, 0)
entryCost = (regularHours × ratePerHour) + (overtimeHours × ratePerHour × overtimeMultiplier)
```

Weekly overtime is detected in summary reports and highlighted but not stored on individual entries.

### 4. Job Labour Summary

For a given job, the tool computes:

| Metric | Calculation |
|--------|------------|
| `totalHours` | Sum of all `hoursWorked` for entries on this job |
| `budgetedHours` | `Job.budgetedHours` |
| `varianceHours` | `totalHours - budgetedHours` |
| `totalLaborCost` | Sum of per-entry cost (with overtime logic) |
| `budgetedLaborCost` | `budgetedHours × activeFieldTechRate` |
| `varianceCost` | `totalLaborCost - budgetedLaborCost` |

### 5. Employee Utilisation Report

Aggregates labour across all jobs for a date range per employee:

| Field | Notes |
|-------|-------|
| `employeeId` | |
| `employeeName` | |
| `totalHours` | Regular + overtime |
| `regularHours` | |
| `overtimeHours` | |
| `totalCost` | Computed with overtime multiplier |
| `jobCount` | Number of distinct jobs worked |

---

## API Endpoints

### Clock In

```
POST /api/labour/clock-in
```

**Body:**

```json
{
  "employeeId": "clempxyz",
  "jobId": "cljobxyz",
  "clockIn": "2024-06-10T07:45:00Z",
  "notes": "Started roof mount"
}
```

### Clock Out

```
PATCH /api/labour/:entryId/clock-out
```

**Body:**

```json
{
  "clockOut": "2024-06-10T16:30:00Z"
}
```

**Response includes computed `hoursWorked` and `entryCost`.**

### List Entries for a Job

```
GET /api/labour?jobId=cljobxyz
```

### Job Labour Summary

```
GET /api/labour/summary/job/:jobId
```

### Employee Utilisation Report

```
GET /api/labour/summary/employee?employeeId=clempxyz&from=2024-06-01&to=2024-06-30
```

---

## Validation Rules

- `clockIn` must be in the past or present (no future clock-ins)
- `clockOut` must be ≥ `clockIn`
- `clockOut` must be within 24 hours of `clockIn` (flag for review if exceeded)
- Employee must be active and assigned to the job at time of clock-in
- Only one open (`clockOut = null`) entry allowed per employee at a time

---

## Error Codes

| HTTP Code | Scenario |
|-----------|---------|
| 400 | Missing required fields |
| 409 | Employee already has an open shift |
| 422 | `clockOut` before `clockIn`; employee not assigned to job |
| 404 | `entryId`, `jobId`, or `employeeId` not found |
