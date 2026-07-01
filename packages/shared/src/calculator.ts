import type { RoofType } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Hours-per-kW tiers used in labour estimation */
const HOURS_PER_KW_TIERS: Array<{ maxKw: number; rate: number }> = [
  { maxKw: 5, rate: 4.5 },
  { maxKw: 10, rate: 4.0 },
  { maxKw: Infinity, rate: 3.5 },
];

const ROOF_MULTIPLIERS: Record<RoofType, number> = {
  composition: 1.0,
  metal: 1.1,
  tile: 1.3,
  flat: 1.2,
};

const ADD_ON_HOURS = {
  battery: 8,
  evCharger: 4,
  monitoring: 2,
} as const;

const MATERIAL_COST_PER_KW = 350;
const MATERIAL_COST_PER_PANEL = 45;
const ADD_ON_MATERIAL_COSTS = {
  battery: 8500,
  evCharger: 1200,
  monitoring: 350,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalculatorInput {
  systemSizeKw: number;
  panelCount: number;
  roofType: RoofType;
  hasBattery: boolean;
  hasEvCharger: boolean;
  hasMonitoring: boolean;
  /** Active FIELD_TECH hourly rate (USD) */
  fieldTechRatePerHour: number;
}

export interface CalculatorOutput {
  estimatedLaborHours: number;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotalCost: number;
}

// ─── Pure calculation function ─────────────────────────────────────────────────

/**
 * Estimates solar installation cost based on job parameters.
 *
 * @see docs/install-calculator-spec.md for full specification.
 */
export function calculateInstallEstimate(input: CalculatorInput): CalculatorOutput {
  const { systemSizeKw, panelCount, roofType, hasBattery, hasEvCharger, hasMonitoring, fieldTechRatePerHour } = input;

  // 1. Base labour hours (tiered by system size)
  const tier = HOURS_PER_KW_TIERS.find((t) => systemSizeKw <= t.maxKw);
  const hoursPerKw = tier?.rate ?? 3.5;
  const baseHours = systemSizeKw * hoursPerKw;

  // 2. Roof-type adjustment
  const roofMultiplier = ROOF_MULTIPLIERS[roofType] ?? 1.0;
  const adjustedHours = baseHours * roofMultiplier;

  // 3. Add-on labour hours
  const addOnHours =
    (hasBattery ? ADD_ON_HOURS.battery : 0) +
    (hasEvCharger ? ADD_ON_HOURS.evCharger : 0) +
    (hasMonitoring ? ADD_ON_HOURS.monitoring : 0);

  const estimatedLaborHours = round2(adjustedHours + addOnHours);

  // 4. Material cost
  const estimatedMaterialCost = round2(
    systemSizeKw * MATERIAL_COST_PER_KW +
      panelCount * MATERIAL_COST_PER_PANEL +
      (hasBattery ? ADD_ON_MATERIAL_COSTS.battery : 0) +
      (hasEvCharger ? ADD_ON_MATERIAL_COSTS.evCharger : 0) +
      (hasMonitoring ? ADD_ON_MATERIAL_COSTS.monitoring : 0),
  );

  // 5. Labour cost
  const estimatedLaborCost = round2(estimatedLaborHours * fieldTechRatePerHour);

  // 6. Total
  const estimatedTotalCost = round2(estimatedMaterialCost + estimatedLaborCost);

  return {
    estimatedLaborHours,
    estimatedMaterialCost,
    estimatedLaborCost,
    estimatedTotalCost,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
