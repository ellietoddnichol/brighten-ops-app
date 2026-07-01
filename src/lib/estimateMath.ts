import type { EstimateLine, LaborRule, QuoteItem, QuoteItemLaborModifier } from '../types/database'

export interface LineLaborInput {
  quantity: number
  hoursPerUnit: number
  difficultyMultiplier: number
  minimumHours: number
  laborRate: number
  modifierFactor?: number
}

export interface LineLaborResult {
  totalLaborHours: number
  laborCost: number
}

export interface EstimateTotalsInput {
  materialTotal: number
  laborCostTotal: number
  materialMarkupPercent: number
  laborMarkupPercent: number
}

export interface EstimateTotalsResult {
  materialTotal: number
  laborHoursTotal: number
  laborCostTotal: number
  markupTotal: number
  estimateTotal: number
}

export function calcExtendedCost(quantity: number, unitCost: number | null): number {
  if (unitCost == null) return 0
  return roundCurrency(quantity * unitCost)
}

export function calcModifierFactor(
  itemModifiers: Pick<QuoteItemLaborModifier, 'factor_override' | 'labor_modifiers'>[] = [],
  projectModifiers: Pick<QuoteItemLaborModifier, 'factor_override' | 'labor_modifiers'>[] = [],
): number {
  const all = [...itemModifiers, ...projectModifiers]
  if (all.length === 0) return 1

  return roundFactor(
    all.reduce((product, row) => {
      const factor = row.factor_override ?? row.labor_modifiers?.labor_factor ?? 1
      return product * factor
    }, 1),
  )
}

export function calcLineLaborHours(input: LineLaborInput): number {
  const modifierFactor = input.modifierFactor ?? 1
  const rawHours =
    input.quantity * input.hoursPerUnit * input.difficultyMultiplier * modifierFactor
  return roundHours(Math.max(rawHours, input.minimumHours))
}

export function calcLineLabor(input: LineLaborInput): LineLaborResult {
  const totalLaborHours = calcLineLaborHours(input)
  const laborCost = roundCurrency(totalLaborHours * input.laborRate)
  return { totalLaborHours, laborCost }
}

export function sumMaterialCost(items: Pick<QuoteItem, 'extended_cost'>[]): number {
  return roundCurrency(items.reduce((sum, item) => sum + (item.extended_cost ?? 0), 0))
}

export function buildEstimateLine(
  quoteItem: QuoteItem,
  laborRule: LaborRule | null,
  laborRate: number,
  markupPercent: number,
  modifierFactor = 1,
): Omit<EstimateLine, 'id' | 'estimate_version_id' | 'created_at'> {
  const materialCost = quoteItem.extended_cost ?? calcExtendedCost(quoteItem.quantity, quoteItem.unit_cost)
  const hoursPerUnit = laborRule?.hours_per_unit ?? 0
  const minimumHours = laborRule?.minimum_hours ?? 0
  const difficultyMultiplier = laborRule?.difficulty_multiplier ?? 1

  const { totalLaborHours, laborCost } = calcLineLabor({
    quantity: quoteItem.quantity,
    hoursPerUnit,
    difficultyMultiplier,
    minimumHours,
    laborRate,
    modifierFactor,
  })

  const lineSubtotal = materialCost + laborCost
  const markupAmount = lineSubtotal * (markupPercent / 100)
  const totalPrice = roundCurrency(lineSubtotal + markupAmount)

  return {
    quote_item_id: quoteItem.id,
    labor_category_id: quoteItem.labor_category_id,
    labor_rule_id: quoteItem.labor_rule_id,
    quantity: quoteItem.quantity,
    material_cost: materialCost,
    hours_per_unit: hoursPerUnit,
    total_labor_hours: totalLaborHours,
    labor_rate: laborRate,
    labor_cost: laborCost,
    markup_percent: markupPercent,
    modifier_factor: modifierFactor,
    labor_family_code: quoteItem.labor_family_code,
    total_price: totalPrice,
  }
}

export function calcEstimateTotals(
  lines: Pick<EstimateLine, 'material_cost' | 'total_labor_hours' | 'labor_cost'>[],
  input: EstimateTotalsInput,
): EstimateTotalsResult {
  const materialTotal = roundCurrency(
    lines.length > 0 ? lines.reduce((sum, line) => sum + line.material_cost, 0) : input.materialTotal,
  )
  const laborHoursTotal = roundHours(lines.reduce((sum, line) => sum + line.total_labor_hours, 0))
  const laborCostTotal = roundCurrency(
    lines.length > 0 ? lines.reduce((sum, line) => sum + line.labor_cost, 0) : input.laborCostTotal,
  )

  const materialMarkup = materialTotal * (input.materialMarkupPercent / 100)
  const laborMarkup = laborCostTotal * (input.laborMarkupPercent / 100)
  const markupTotal = roundCurrency(materialMarkup + laborMarkup)
  const estimateTotal = roundCurrency(materialTotal + laborCostTotal + markupTotal)

  return {
    materialTotal,
    laborHoursTotal,
    laborCostTotal,
    markupTotal,
    estimateTotal,
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function roundHours(value: number): number {
  return Math.round(value * 1000) / 1000
}

function roundFactor(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function formatModifierList(
  modifiers: Pick<QuoteItemLaborModifier, 'labor_modifiers'>[] = [],
): string {
  return modifiers
    .map((row) => row.labor_modifiers?.modifier_code)
    .filter(Boolean)
    .join(', ')
}
