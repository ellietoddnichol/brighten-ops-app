# Brighten Ops App – Data Model

## Entity–Relationship Summary

```
Employee ──< LabourEntry >── Job
Employee ──< JobAssignment >── Job
Job ──< CalculatorRun
Rate ── (referenced by LabourEntry)
```

---

## Entities

### Employee

Represents a Brighten Solar staff member who can be assigned to jobs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `employeeNumber` | `String` | Unique, human-readable ID (e.g. `EMP-001`) |
| `firstName` | `String` | |
| `lastName` | `String` | |
| `email` | `String` | Unique |
| `role` | `EmployeeRole` | Enum: `ADMIN`, `DISPATCHER`, `FIELD_TECH` |
| `certifications` | `String[]` | e.g. `["NABCEP", "OSHA10"]` |
| `active` | `Boolean` | Default `true` |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

---

### Job

Represents a single solar installation job at a customer site.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `jobNumber` | `String` | Unique, e.g. `JOB-2024-001` |
| `customerName` | `String` | |
| `siteAddress` | `String` | Full street address |
| `city` | `String` | |
| `state` | `String` | Two-letter abbreviation |
| `zip` | `String` | |
| `status` | `JobStatus` | Enum: `SCHEDULED`, `IN_PROGRESS`, `COMPLETE`, `CANCELLED` |
| `systemSizeKw` | `Float` | Installed system size in kilowatts |
| `panelCount` | `Int` | Number of solar panels |
| `inverterType` | `String` | e.g. `string`, `micro`, `hybrid` |
| `roofType` | `String` | e.g. `composition`, `tile`, `metal`, `flat` |
| `hasBattery` | `Boolean` | Battery storage add-on |
| `hasEvCharger` | `Boolean` | EV charger add-on |
| `hasMonitoring` | `Boolean` | Monitoring system add-on |
| `scheduledDate` | `DateTime?` | Planned install date |
| `completedDate` | `DateTime?` | Actual completion date |
| `budgetedHours` | `Float?` | Labour hours estimated at job creation |
| `notes` | `String?` | Free-form field notes |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

---

### JobAssignment

Join table linking employees to jobs (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `jobId` | `String` | FK → Job |
| `employeeId` | `String` | FK → Employee |
| `role` | `String?` | Role on this job, e.g. `lead`, `helper` |
| `assignedAt` | `DateTime` | |

---

### LabourEntry

Records a single time-log entry (clock-in / clock-out) for an employee on a job.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `jobId` | `String` | FK → Job |
| `employeeId` | `String` | FK → Employee |
| `clockIn` | `DateTime` | Start of work period |
| `clockOut` | `DateTime?` | End of work period (`null` if still clocked in) |
| `hoursWorked` | `Float?` | Computed: `(clockOut - clockIn) / 3600` |
| `rateId` | `String` | FK → Rate (locked at time of entry) |
| `notes` | `String?` | |
| `createdAt` | `DateTime` | |

---

### Rate

Stores hourly labour rates by role and effective date range.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `role` | `String` | Employee role this rate applies to |
| `ratePerHour` | `Float` | USD per hour |
| `overtimeMultiplier` | `Float` | Default `1.5` |
| `effectiveFrom` | `DateTime` | Start of rate validity |
| `effectiveTo` | `DateTime?` | End of rate validity (`null` = currently active) |
| `createdAt` | `DateTime` | |

---

### CalculatorRun

Persists an install-cost estimate linked to (optionally) a job.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `jobId` | `String?` | FK → Job (nullable – can run calculator standalone) |
| `systemSizeKw` | `Float` | |
| `panelCount` | `Int` | |
| `roofType` | `String` | |
| `hasBattery` | `Boolean` | |
| `hasEvCharger` | `Boolean` | |
| `hasMonitoring` | `Boolean` | |
| `estimatedLaborHours` | `Float` | Output |
| `estimatedMaterialCost` | `Float` | Output – USD |
| `estimatedLaborCost` | `Float` | Output – USD |
| `estimatedTotalCost` | `Float` | Output – USD |
| `createdAt` | `DateTime` | |

---

## Enums

```prisma
enum EmployeeRole {
  ADMIN
  DISPATCHER
  FIELD_TECH
}

enum JobStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETE
  CANCELLED
}
```

---

## Indexes

- `Job.jobNumber` – unique
- `Employee.email` – unique
- `Employee.employeeNumber` – unique
- `LabourEntry.(jobId, employeeId)` – composite index for fast job labour queries
- `Rate.(role, effectiveFrom)` – for rate-lookup queries
