// ─── Labour computation helpers ───────────────────────────────────────────────

export interface LabourEntryCostInput {
  hoursWorked: number;
  ratePerHour: number;
  overtimeMultiplier: number;
}

export interface LabourEntryCostOutput {
  regularHours: number;
  overtimeHours: number;
  totalCost: number;
}

/**
 * Computes the cost of a single labour entry applying daily overtime (> 8 h).
 *
 * @see docs/labor-tool-spec.md for full specification.
 */
export function computeLabourEntryCost(input: LabourEntryCostInput): LabourEntryCostOutput {
  const { hoursWorked, ratePerHour, overtimeMultiplier } = input;

  const regularHours = Math.min(hoursWorked, 8);
  const overtimeHours = Math.max(hoursWorked - 8, 0);
  const totalCost = round2(
    regularHours * ratePerHour + overtimeHours * ratePerHour * overtimeMultiplier,
  );

  return {
    regularHours: round2(regularHours),
    overtimeHours: round2(overtimeHours),
    totalCost,
  };
}

export interface LabourSummaryInput {
  entries: Array<{
    hoursWorked: number;
    ratePerHour: number;
    overtimeMultiplier: number;
  }>;
  budgetedHours: number;
  budgetedRatePerHour: number;
}

export interface LabourSummaryOutput {
  totalHours: number;
  budgetedHours: number;
  varianceHours: number;
  totalLaborCost: number;
  budgetedLaborCost: number;
  varianceCost: number;
}

/**
 * Aggregates labour entries into a job-level summary.
 */
export function computeJobLabourSummary(input: LabourSummaryInput): LabourSummaryOutput {
  const { entries, budgetedHours, budgetedRatePerHour } = input;

  const totalHours = round2(entries.reduce((sum, e) => sum + e.hoursWorked, 0));
  const totalLaborCost = round2(
    entries.reduce((sum, e) => sum + computeLabourEntryCost(e).totalCost, 0),
  );
  const budgetedLaborCost = round2(budgetedHours * budgetedRatePerHour);

  return {
    totalHours,
    budgetedHours: round2(budgetedHours),
    varianceHours: round2(totalHours - budgetedHours),
    totalLaborCost,
    budgetedLaborCost,
    varianceCost: round2(totalLaborCost - budgetedLaborCost),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
