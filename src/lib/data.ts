import { supabase } from './supabaseClient'
import { buildEstimateLine, calcEstimateTotals } from './estimateMath'
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
    .select('*')
    .eq('vendor_quote_id', quoteId)
    .order('line_number', { ascending: true, nullsFirst: false })

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
  const [quoteItems, laborRules] = await Promise.all([
    getQuoteItemsByQuote(quoteId),
    getLaborRules(),
  ])

  const rulesById = new Map(laborRules.map((rule) => [rule.id, rule]))
  const lineDrafts = quoteItems.map((item) => {
    const rule = item.labor_rule_id ? rulesById.get(item.labor_rule_id) ?? null : null
    const markupPercent = materialMarkupPercent
    return buildEstimateLine(item, rule, laborRate, markupPercent)
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
