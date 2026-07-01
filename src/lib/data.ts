import { supabase } from './supabaseClient'
import { buildEstimateLine, calcEstimateTotals, calcModifierFactor, sumMaterialCost } from './estimateMath'
import type {
  CreateProjectInput,
  CreateQuoteItemInput,
  CreateVendorInput,
  CreateVendorQuoteInput,
  EstimateLine,
  EstimateVersion,
  LaborCategory,
  LaborRule,
  Project,
  QuoteItem,
  UpdateQuoteItemInput,
  Vendor,
  VendorQuote,
} from '../types/database'
import type { ProjectWorkflowStatus, ProjectWorkflowSummary, WorkflowPhaseId } from './workflow'
import { workflowPhaseLabel } from './workflow'

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      project_name: input.project_name,
      customer_name: input.customer_name ?? null,
      location: input.location ?? null,
      bid_date: input.bid_date ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('vendor_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      vendor_name: input.vendor_name,
      contact_name: input.contact_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVendorQuotesByProject(projectId: string): Promise<VendorQuote[]> {
  const { data, error } = await supabase
    .from('vendor_quotes')
    .select('*, vendors(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getVendorQuote(id: string): Promise<VendorQuote | null> {
  const { data, error } = await supabase
    .from('vendor_quotes')
    .select('*, vendors(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createVendorQuote(input: CreateVendorQuoteInput): Promise<VendorQuote> {
  const { data, error } = await supabase
    .from('vendor_quotes')
    .insert({
      project_id: input.project_id,
      vendor_id: input.vendor_id ?? null,
      quote_number: input.quote_number ?? null,
      quote_date: input.quote_date ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getQuoteItemsByQuote(quoteId: string): Promise<QuoteItem[]> {
  const { data, error } = await supabase
    .from('quote_items')
    .select('*, labor_categories(category_name), quote_item_labor_modifiers(labor_modifiers(*))')
    .eq('vendor_quote_id', quoteId)
    .order('line_number', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data ?? []
}

export async function getProjectLaborModifiers(projectId: string) {
  const { data, error } = await supabase
    .from('project_labor_modifiers')
    .select('*, labor_modifiers(*)')
    .eq('project_id', projectId)

  if (error) throw error
  return data ?? []
}

export async function createQuoteItem(input: CreateQuoteItemInput): Promise<QuoteItem> {
  const { data, error } = await supabase
    .from('quote_items')
    .insert({
      vendor_quote_id: input.vendor_quote_id,
      quantity: input.quantity,
      unit: input.unit,
      part_number: input.part_number ?? null,
      description: input.description,
      lead_time: input.lead_time ?? null,
      unit_cost: input.unit_cost ?? null,
      extended_cost: input.extended_cost ?? null,
      labor_category_id: input.labor_category_id ?? null,
      labor_rule_id: input.labor_rule_id ?? null,
      needs_review: input.needs_review ?? true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuoteItem(id: string, input: UpdateQuoteItemInput): Promise<QuoteItem> {
  const { data, error } = await supabase
    .from('quote_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLaborCategories(): Promise<LaborCategory[]> {
  const { data, error } = await supabase
    .from('labor_categories')
    .select('*')
    .eq('active', true)
    .order('category_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getLaborRules(): Promise<LaborRule[]> {
  const { data, error } = await supabase
    .from('labor_rules')
    .select('*')
    .eq('active', true)
    .order('rule_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function updateLaborRule(
  id: string,
  input: Partial<Pick<LaborRule, 'hours_per_unit' | 'minimum_hours' | 'difficulty_multiplier' | 'notes' | 'active'>>,
): Promise<LaborRule> {
  const { data, error } = await supabase.from('labor_rules').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getLaborModifiers() {
  const { data, error } = await supabase
    .from('labor_modifiers')
    .select('*')
    .eq('active', true)
    .order('modifier_code', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function updateLaborModifier(
  id: string,
  input: Partial<{ labor_factor: number; description: string | null; active: boolean }>,
) {
  const { data, error } = await supabase.from('labor_modifiers').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getEstimateVersionsByProject(projectId: string): Promise<EstimateVersion[]> {
  const { data, error } = await supabase
    .from('estimate_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getEstimateLines(estimateVersionId: string): Promise<EstimateLine[]> {
  const { data, error } = await supabase
    .from('estimate_lines')
    .select('*, quote_items(*)')
    .eq('estimate_version_id', estimateVersionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function buildEstimateFromQuote(
  projectId: string,
  quoteId: string,
  laborRate = 85,
  materialMarkupPercent = 0,
  laborMarkupPercent = 0,
): Promise<{ estimate: EstimateVersion; lines: EstimateLine[] }> {
  const [quoteItems, laborRules, projectModifiers] = await Promise.all([
    getQuoteItemsByQuote(quoteId),
    getLaborRules(),
    getProjectLaborModifiers(projectId),
  ])

  const rulesById = new Map(laborRules.map((rule) => [rule.id, rule]))
  const lineDrafts = quoteItems.map((item) => {
    const rule = item.labor_rule_id ? rulesById.get(item.labor_rule_id) ?? null : null
    const modifierFactor = calcModifierFactor(
      item.quote_item_labor_modifiers ?? [],
      projectModifiers,
    )
    return buildEstimateLine(item, rule, laborRate, materialMarkupPercent, modifierFactor)
  })

  const totals = calcEstimateTotals(lineDrafts, {
    materialTotal: 0,
    laborCostTotal: 0,
    materialMarkupPercent,
    laborMarkupPercent,
  })

  const { data: estimate, error: estimateError } = await supabase
    .from('estimate_versions')
    .insert({
      project_id: projectId,
      labor_rate: laborRate,
      material_markup_percent: materialMarkupPercent,
      labor_markup_percent: laborMarkupPercent,
      material_total: totals.materialTotal,
      labor_hours_total: totals.laborHoursTotal,
      labor_cost_total: totals.laborCostTotal,
      markup_total: totals.markupTotal,
      estimate_total: totals.estimateTotal,
    })
    .select()
    .single()

  if (estimateError) throw estimateError

  const rows = lineDrafts.map((line) => ({
    ...line,
    estimate_version_id: estimate.id,
  }))

  const { data: lines, error: linesError } = await supabase
    .from('estimate_lines')
    .insert(rows)
    .select('*, quote_items(*)')

  if (linesError) throw linesError

  return { estimate, lines: lines ?? [] }
}

function resolveSuggestedPhase(input: {
  hasQuote: boolean
  reviewComplete: boolean
  hasEstimate: boolean
}): WorkflowPhaseId {
  if (!input.hasQuote) return 'setup'
  if (!input.reviewComplete) return 'review'
  if (!input.hasEstimate) return 'labor'
  return 'estimate'
}

export async function getProjectWorkflowStatus(
  projectId: string,
  preferredQuoteId?: string | null,
): Promise<ProjectWorkflowStatus | null> {
  const [project, quotes, estimates] = await Promise.all([
    getProject(projectId),
    getVendorQuotesByProject(projectId),
    getEstimateVersionsByProject(projectId),
  ])

  if (!project) return null

  const activeQuote =
    (preferredQuoteId ? quotes.find((quote) => quote.id === preferredQuoteId) : null) ??
    quotes[0] ??
    null

  let reviewComplete = false
  let reviewDetail = 'Create a vendor quote first'

  if (activeQuote) {
    const items = await getQuoteItemsByQuote(activeQuote.id)
    const lineCount = items.length
    const needsReviewCount = items.filter((item) => item.needs_review).length
    const missingLaborCount = items.filter((item) => !item.labor_category_id).length
    const materialTotal = sumMaterialCost(items)

    if (lineCount === 0) {
      reviewDetail = 'Add lines from catalog or import'
    } else if (needsReviewCount > 0 || missingLaborCount > 0) {
      reviewDetail = `${needsReviewCount + missingLaborCount} line(s) need review`
    } else {
      reviewDetail = `${lineCount} lines · $${materialTotal.toFixed(2)} material`
      reviewComplete = true
    }
  }

  const hasQuote = quotes.length > 0
  const hasEstimate = estimates.length > 0
  const suggestedPhase = resolveSuggestedPhase({ hasQuote, reviewComplete, hasEstimate })

  return {
    projectId: project.id,
    projectName: project.project_name,
    quoteId: activeQuote?.id ?? null,
    quoteNumber: activeQuote?.quote_number ?? null,
    phases: {
      setup: {
        complete: hasQuote,
        detail: hasQuote
          ? `${quotes.length} quote${quotes.length === 1 ? '' : 's'}`
          : 'Add vendor and create quote',
      },
      review: {
        complete: reviewComplete,
        detail: activeQuote ? reviewDetail : 'Waiting on quote',
      },
      labor: {
        complete: true,
        detail: 'Tune base hours & item modifiers',
      },
      estimate: {
        complete: hasEstimate,
        detail: hasEstimate
          ? `${estimates.length} saved version${estimates.length === 1 ? '' : 's'}`
          : 'Not built yet',
      },
    },
    suggestedPhase,
  }
}

export async function getProjectsWorkflowSummaries(
  projectIds: string[],
): Promise<Map<string, ProjectWorkflowSummary>> {
  const summaries = new Map<string, ProjectWorkflowSummary>()
  if (projectIds.length === 0) return summaries

  const [{ data: quotes, error: quotesError }, { data: estimates, error: estimatesError }] =
    await Promise.all([
      supabase
        .from('vendor_quotes')
        .select('id, project_id, quote_number, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false }),
      supabase.from('estimate_versions').select('project_id').in('project_id', projectIds),
    ])

  if (quotesError) throw quotesError
  if (estimatesError) throw estimatesError

  const quoteByProject = new Map<string, (typeof quotes)[number]>()
  for (const quote of quotes ?? []) {
    if (!quoteByProject.has(quote.project_id)) {
      quoteByProject.set(quote.project_id, quote)
    }
  }

  const quoteIds = [...quoteByProject.values()].map((quote) => quote.id)
  const lineCountByQuote = new Map<string, number>()

  if (quoteIds.length > 0) {
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('vendor_quote_id')
      .in('vendor_quote_id', quoteIds)

    if (itemsError) throw itemsError

    for (const item of quoteItems ?? []) {
      lineCountByQuote.set(
        item.vendor_quote_id,
        (lineCountByQuote.get(item.vendor_quote_id) ?? 0) + 1,
      )
    }
  }

  const estimateProjects = new Set((estimates ?? []).map((row) => row.project_id))

  for (const projectId of projectIds) {
    const quote = quoteByProject.get(projectId) ?? null
    const hasEstimate = estimateProjects.has(projectId)
    const lineCount = quote ? (lineCountByQuote.get(quote.id) ?? 0) : 0

    const hasQuote = Boolean(quote)
    const reviewComplete = hasQuote && lineCount > 0
    const suggestedPhase = resolveSuggestedPhase({ hasQuote, reviewComplete, hasEstimate })

    summaries.set(projectId, {
      projectId,
      quoteId: quote?.id ?? null,
      quoteNumber: quote?.quote_number ?? null,
      lineCount,
      hasEstimate,
      suggestedPhase,
      phaseLabel: workflowPhaseLabel(suggestedPhase),
    })
  }

  return summaries
}

export interface BradleyMilestoneStatus {
  projectExists: boolean
  vendorExists: boolean
  quoteExists: boolean
  lineCount: number
  materialTotal: number
  expectedMaterialTotal: number
  materialMatches: boolean
}

export async function getBradleyMilestoneStatus(
  projectName = 'Bradley Pricing',
  quoteNumber = 'Q-234-5017-01',
  expectedTotal = 9246.8,
): Promise<BradleyMilestoneStatus> {
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('project_name', projectName)
    .maybeSingle()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('vendor_name', 'Bradley Company, LLC')
    .maybeSingle()

  let quoteExists = false
  let lineCount = 0
  let materialTotal = 0

  if (project) {
    const { data: quote } = await supabase
      .from('vendor_quotes')
      .select('id')
      .eq('project_id', project.id)
      .eq('quote_number', quoteNumber)
      .maybeSingle()

    quoteExists = Boolean(quote)

    if (quote) {
      const items = await getQuoteItemsByQuote(quote.id)
      lineCount = items.length
      materialTotal = items.reduce((sum, item) => sum + (item.extended_cost ?? 0), 0)
    }
  }

  return {
    projectExists: Boolean(project),
    vendorExists: Boolean(vendor),
    quoteExists,
    lineCount,
    materialTotal: Math.round(materialTotal * 100) / 100,
    expectedMaterialTotal: expectedTotal,
    materialMatches: Math.abs(materialTotal - expectedTotal) < 0.01,
  }
}
