import type { EstimateLine, EstimateVersion, QuoteItem, VendorQuote } from '../types/database'
import { sumMaterialCost } from './estimateMath'

export const BRADLEY_EXPECTED = {
  projectName: 'Bradley Pricing',
  vendorName: 'Bradley Company, LLC',
  quoteNumber: 'Q-234-5017-01',
  quoteItemCount: 65,
  materialTotal: 9246.8,
  testLaborRate: 85,
} as const

export interface QuoteAuditResult {
  quoteItemCount: number
  materialTotal: number
  missingLaborFamilyCount: number
  missingLaborRuleCount: number
  modifiersMissingFactorCount: number
}

export interface EstimateAuditResult extends QuoteAuditResult {
  quoteNumber: string | null
  laborTotal: number
  laborHoursTotal: number
  estimateTotal: number
  laborRate: number
  warnings: string[]
}

export interface BradleySpotCheck {
  label: string
  partNumber: string
  expectedLaborFamily: string
  expectedBaseHours: number
  line: EstimateLine | null
  passed: boolean
  detail: string
}

export const BRADLEY_SPOT_CHECKS = [
  {
    label: 'Grab bar',
    partNumber: '8120-001180',
    expectedLaborFamily: 'DIV10_GRAB_BAR',
    expectedBaseHours: 0.3,
  },
  {
    label: 'Mirror',
    partNumber: '780-024360',
    expectedLaborFamily: 'DIV10_MIRROR',
    expectedBaseHours: 0.6,
  },
  {
    label: 'Baby changing station',
    partNumber: '962-00000',
    expectedLaborFamily: 'DIV10_BABY_CHANGER',
    expectedBaseHours: 2.5,
  },
  {
    label: 'Towel/waste unit',
    partNumber: '234-11000',
    expectedLaborFamily: 'DIV10_TOWEL_WASTE',
    expectedBaseHours: 1.1,
  },
  {
    label: 'Medicine cabinet',
    partNumber: '175-00000',
    expectedLaborFamily: 'DIV10_MEDICINE_CABINET',
    expectedBaseHours: 1.5,
  },
] as const

export function isBradleyMilestoneQuote(
  projectName: string | undefined,
  quote: Pick<VendorQuote, 'quote_number'> | null,
): boolean {
  return projectName === BRADLEY_EXPECTED.projectName && quote?.quote_number === BRADLEY_EXPECTED.quoteNumber
}

export function auditQuoteItems(items: QuoteItem[]): QuoteAuditResult {
  let modifiersMissingFactorCount = 0

  for (const item of items) {
    for (const row of item.quote_item_labor_modifiers ?? []) {
      const factor = row.factor_override ?? row.labor_modifiers?.labor_factor
      if (factor == null) {
        modifiersMissingFactorCount += 1
      }
    }
  }

  return {
    quoteItemCount: items.length,
    materialTotal: roundCurrency(sumMaterialCost(items)),
    missingLaborFamilyCount: items.filter((item) => !item.labor_family_code).length,
    missingLaborRuleCount: items.filter((item) => !item.labor_rule_id).length,
    modifiersMissingFactorCount,
  }
}

export function buildEstimateAudit(input: {
  quote: Pick<VendorQuote, 'quote_number'> | null
  quoteItems: QuoteItem[]
  estimate: EstimateVersion | null
  lines: EstimateLine[]
  bradleyExpected?: boolean
}): EstimateAuditResult {
  const quoteAudit = auditQuoteItems(input.quoteItems)
  const warnings: string[] = []

  if (input.bradleyExpected) {
    if (quoteAudit.quoteItemCount !== BRADLEY_EXPECTED.quoteItemCount) {
      warnings.push(
        `Quote item count is ${quoteAudit.quoteItemCount}; expected ${BRADLEY_EXPECTED.quoteItemCount}.`,
      )
    }
    if (Math.abs(quoteAudit.materialTotal - BRADLEY_EXPECTED.materialTotal) > 0.01) {
      warnings.push(
        `Material total is $${quoteAudit.materialTotal.toFixed(2)}; expected $${BRADLEY_EXPECTED.materialTotal.toFixed(2)}.`,
      )
    }
  }

  if (quoteAudit.missingLaborFamilyCount > 0) {
    warnings.push(`${quoteAudit.missingLaborFamilyCount} quote line(s) missing labor family.`)
  }
  if (quoteAudit.missingLaborRuleCount > 0) {
    warnings.push(`${quoteAudit.missingLaborRuleCount} quote line(s) missing base labor rule.`)
  }
  if (quoteAudit.modifiersMissingFactorCount > 0) {
    warnings.push(
      `${quoteAudit.modifiersMissingFactorCount} attached modifier(s) missing labor factor.`,
    )
  }

  if (input.estimate && input.bradleyExpected) {
    if (Math.abs(input.estimate.labor_rate - BRADLEY_EXPECTED.testLaborRate) > 0.01) {
      warnings.push(
        `Labor rate is $${input.estimate.labor_rate.toFixed(2)}/hr; Bradley test uses $${BRADLEY_EXPECTED.testLaborRate}/hr.`,
      )
    }
  }

  const materialFromLines = roundCurrency(input.lines.reduce((sum, line) => sum + line.material_cost, 0))
  if (input.estimate && input.lines.length > 0 && Math.abs(materialFromLines - input.estimate.material_total) > 0.01) {
    warnings.push('Estimate material total does not match sum of estimate lines.')
  }

  return {
    quoteNumber: input.quote?.quote_number ?? null,
    ...quoteAudit,
    laborTotal: input.estimate?.labor_cost_total ?? 0,
    laborHoursTotal: input.estimate?.labor_hours_total ?? 0,
    estimateTotal: input.estimate?.estimate_total ?? 0,
    laborRate: input.estimate?.labor_rate ?? 0,
    warnings,
  }
}

export function runBradleySpotChecks(lines: EstimateLine[]): BradleySpotCheck[] {
  return BRADLEY_SPOT_CHECKS.map((check) => {
    const line =
      lines.find((row) => row.quote_items?.part_number === check.partNumber) ?? null

    if (!line) {
      return {
        ...check,
        line: null,
        passed: false,
        detail: `Part ${check.partNumber} not found in estimate lines.`,
      }
    }

    const familyOk = line.labor_family_code === check.expectedLaborFamily
    const hoursOk = Math.abs(line.hours_per_unit - check.expectedBaseHours) < 0.001
    const passed = familyOk && hoursOk

    const issues: string[] = []
    if (!familyOk) {
      issues.push(`labor family ${line.labor_family_code ?? '—'} (expected ${check.expectedLaborFamily})`)
    }
    if (!hoursOk) {
      issues.push(`base hr/unit ${line.hours_per_unit.toFixed(3)} (expected ${check.expectedBaseHours.toFixed(3)})`)
    }

    return {
      ...check,
      line,
      passed,
      detail: passed
        ? `${check.partNumber} · qty ${line.quantity} · mod ${line.modifier_factor.toFixed(3)} · labor $${line.labor_cost.toFixed(2)}`
        : issues.join('; '),
    }
  })
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
