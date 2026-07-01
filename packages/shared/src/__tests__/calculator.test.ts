import { describe, it, expect } from 'vitest';
import { calculateInstallEstimate } from '../calculator.js';

const BASE_INPUT = {
  systemSizeKw: 5,
  panelCount: 13,
  roofType: 'composition' as const,
  hasBattery: false,
  hasEvCharger: false,
  hasMonitoring: false,
  fieldTechRatePerHour: 30,
};

describe('calculateInstallEstimate', () => {
  it('calculates base estimate for a 5 kW composition roof system', () => {
    const result = calculateInstallEstimate(BASE_INPUT);
    // baseHours = 5 × 4.5 = 22.5, roofMultiplier = 1.0, no add-ons
    expect(result.estimatedLaborHours).toBe(22.5);
    // materialCost = 5×350 + 13×45 = 1750 + 585 = 2335
    expect(result.estimatedMaterialCost).toBe(2335);
    // laborCost = 22.5 × 30 = 675
    expect(result.estimatedLaborCost).toBe(675);
    expect(result.estimatedTotalCost).toBe(3010);
  });

  it('uses 4.0 h/kW tier for systems between 5.01 and 10 kW', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, systemSizeKw: 7.5, panelCount: 20 });
    // baseHours = 7.5 × 4.0 = 30
    expect(result.estimatedLaborHours).toBe(30);
  });

  it('uses 3.5 h/kW tier for systems above 10 kW', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, systemSizeKw: 12, panelCount: 30 });
    // baseHours = 12 × 3.5 = 42
    expect(result.estimatedLaborHours).toBe(42);
  });

  it('applies tile roof multiplier (1.3×)', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, roofType: 'tile' });
    // 22.5 × 1.3 = 29.25
    expect(result.estimatedLaborHours).toBe(29.25);
  });

  it('applies flat roof multiplier (1.2×)', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, roofType: 'flat' });
    expect(result.estimatedLaborHours).toBe(27);
  });

  it('adds battery add-on hours and material cost', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, hasBattery: true });
    expect(result.estimatedLaborHours).toBe(30.5); // 22.5 + 8
    expect(result.estimatedMaterialCost).toBe(2335 + 8500);
  });

  it('adds EV charger and monitoring add-ons', () => {
    const result = calculateInstallEstimate({ ...BASE_INPUT, hasEvCharger: true, hasMonitoring: true });
    expect(result.estimatedLaborHours).toBe(28.5); // 22.5 + 4 + 2
    expect(result.estimatedMaterialCost).toBe(2335 + 1200 + 350);
  });

  it('adds all add-ons together', () => {
    const result = calculateInstallEstimate({
      ...BASE_INPUT,
      hasBattery: true,
      hasEvCharger: true,
      hasMonitoring: true,
    });
    expect(result.estimatedLaborHours).toBe(36.5); // 22.5 + 8 + 4 + 2
    expect(result.estimatedMaterialCost).toBe(2335 + 8500 + 1200 + 350);
  });
});
