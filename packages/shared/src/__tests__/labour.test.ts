import { describe, it, expect } from 'vitest';
import { computeLabourEntryCost, computeJobLabourSummary } from '../labour.js';

describe('computeLabourEntryCost', () => {
  const RATE = { ratePerHour: 30, overtimeMultiplier: 1.5 };

  it('computes regular-only cost for ≤ 8 hours', () => {
    const result = computeLabourEntryCost({ hoursWorked: 8, ...RATE });
    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(0);
    expect(result.totalCost).toBe(240);
  });

  it('computes overtime cost for > 8 hours', () => {
    // 8 regular + 2 overtime
    const result = computeLabourEntryCost({ hoursWorked: 10, ...RATE });
    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(2);
    // 8×30 + 2×30×1.5 = 240 + 90 = 330
    expect(result.totalCost).toBe(330);
  });

  it('handles exactly 8 hours with no overtime', () => {
    const result = computeLabourEntryCost({ hoursWorked: 8, ...RATE });
    expect(result.overtimeHours).toBe(0);
  });

  it('handles fractional hours', () => {
    const result = computeLabourEntryCost({ hoursWorked: 9.5, ...RATE });
    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(1.5);
    // 8×30 + 1.5×30×1.5 = 240 + 67.5 = 307.5
    expect(result.totalCost).toBe(307.5);
  });
});

describe('computeJobLabourSummary', () => {
  it('aggregates multiple entries', () => {
    const result = computeJobLabourSummary({
      entries: [
        { hoursWorked: 8, ratePerHour: 30, overtimeMultiplier: 1.5 },
        { hoursWorked: 6, ratePerHour: 30, overtimeMultiplier: 1.5 },
      ],
      budgetedHours: 12,
      budgetedRatePerHour: 30,
    });

    expect(result.totalHours).toBe(14);
    expect(result.budgetedHours).toBe(12);
    expect(result.varianceHours).toBe(2);
    // entry 1: 8×30 = 240, entry 2: 6×30 = 180 → total = 420
    expect(result.totalLaborCost).toBe(420);
    expect(result.budgetedLaborCost).toBe(360);
    expect(result.varianceCost).toBe(60);
  });

  it('returns zero variance when actual equals budgeted', () => {
    const result = computeJobLabourSummary({
      entries: [{ hoursWorked: 10, ratePerHour: 30, overtimeMultiplier: 1.5 }],
      budgetedHours: 10,
      budgetedRatePerHour: 30,
    });

    expect(result.varianceHours).toBe(0);
    // budgetedLaborCost = 10×30 = 300; actualCost = 8×30 + 2×30×1.5 = 240+90 = 330
    expect(result.varianceCost).toBe(30); // overtime makes actual > budgeted
  });
});
