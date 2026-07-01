import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getSupabaseImportConfig } from './loadEnv.ts'
import { parseCsv, parseModifierList, parseNumber, parseOptionalDate } from './parseCsv.ts'
import {
  DEFAULT_LABOR_CATEGORY,
  PRODUCT_TO_LABOR_CATEGORY,
} from './productCategoryMap.ts'

export interface ImportVendorQuoteOptions {
  filePath: string
  projectNameOverride?: string
  vendorNameOverride?: string
  quoteNumberOverride?: string
}

export interface ImportVendorQuoteSummary {
  project: { id: string; name: string; created: boolean }
  vendor: { id: string; name: string; created: boolean }
  quote: { id: string; number: string; created: boolean }
  quoteItemCount: number
  materialTotal: number
  missingLaborFamily: number
  missingProductFamily: number
  missingUnitPrice: number
  missingExtendedPrice: number
  modifiersAttached: number
}

interface ImportRow {
  project_name: string
  vendor_name: string
  quote_number: string
  quote_date: string
  quote_expiration_date: string
  part_number: string
  description: string
  quantity: string
  unit: string
  unit_price: string
  extended_price: string
  lead_time_days: string
  product_family: string
  labor_family: string
  mounting: string
  size: string
  finish: string
  color: string
  modifiers: string
  notes: string
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function humanizeModifier(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

async function findOrCreateProject(
  supabase: SupabaseClient,
  projectName: string,
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: findError } = await supabase
    .from('projects')
    .select('id')
    .eq('project_name', projectName)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return { id: existing.id, created: false }

  const { data, error } = await supabase
    .from('projects')
    .insert({ project_name: projectName, status: 'active' })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id, created: true }
}

async function findOrCreateVendor(
  supabase: SupabaseClient,
  vendorName: string,
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: findError } = await supabase
    .from('vendors')
    .select('id')
    .eq('vendor_name', vendorName)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return { id: existing.id, created: false }

  const { data, error } = await supabase
    .from('vendors')
    .insert({ vendor_name: vendorName })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id, created: true }
}

async function findOrCreateQuote(
  supabase: SupabaseClient,
  input: {
    projectId: string
    vendorId: string
    quoteNumber: string
    quoteDate: string | null
    quoteExpiration: string | null
    materialTotal: number
  },
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: findError } = await supabase
    .from('vendor_quotes')
    .select('id')
    .eq('project_id', input.projectId)
    .eq('quote_number', input.quoteNumber)
    .maybeSingle()

  if (findError) throw findError

  const payload = {
    project_id: input.projectId,
    vendor_id: input.vendorId,
    quote_number: input.quoteNumber,
    quote_date: input.quoteDate,
    expiration_date: input.quoteExpiration,
    shipping_total: 0,
    material_total: input.materialTotal,
    grand_total: input.materialTotal,
    review_status: 'imported',
    notes: `Imported from vendor quote CSV`,
  }

  if (existing) {
    const { error } = await supabase.from('vendor_quotes').update(payload).eq('id', existing.id)
    if (error) throw error
    return { id: existing.id, created: false }
  }

  const { data, error } = await supabase.from('vendor_quotes').insert(payload).select('id').single()
  if (error) throw error
  return { id: data.id, created: true }
}

async function loadCategoryMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('labor_categories').select('id, category_name')
  if (error) throw error
  return new Map((data ?? []).map((row) => [row.category_name, row.id]))
}

async function loadRulesByCategory(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('labor_rules')
    .select('id, labor_category_id')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw error

  const map = new Map<string, string>()
  for (const rule of data ?? []) {
    if (!map.has(rule.labor_category_id)) {
      map.set(rule.labor_category_id, rule.id)
    }
  }
  return map
}

async function resolveLaborCategoryId(
  supabase: SupabaseClient,
  categoryByName: Map<string, string>,
  input: {
    vendorName: string
    partNumber: string
    laborFamilyCode: string | null
    productFamily: string | null
  },
): Promise<string | null> {
  if (input.partNumber) {
    const { data: catalogByPart } = await supabase
      .from('catalog_items')
      .select('labor_category_id')
      .eq('vendor_name', input.vendorName)
      .eq('part_number', input.partNumber)
      .maybeSingle()

    if (catalogByPart?.labor_category_id) {
      return catalogByPart.labor_category_id
    }
  }

  if (input.laborFamilyCode) {
    const { data: catalogByFamily } = await supabase
      .from('catalog_items')
      .select('labor_category_id')
      .eq('labor_family_code', input.laborFamilyCode)
      .not('labor_category_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (catalogByFamily?.labor_category_id) {
      return catalogByFamily.labor_category_id
    }
  }

  const categoryName =
    (input.productFamily ? PRODUCT_TO_LABOR_CATEGORY[input.productFamily] : null) ??
    DEFAULT_LABOR_CATEGORY

  return categoryByName.get(categoryName) ?? categoryByName.get(DEFAULT_LABOR_CATEGORY) ?? null
}

async function ensureLaborModifier(
  supabase: SupabaseClient,
  modifierCode: string,
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('labor_modifiers')
    .select('id')
    .eq('modifier_code', modifierCode)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('labor_modifiers')
    .insert({
      modifier_code: modifierCode,
      modifier_name: humanizeModifier(modifierCode),
      modifier_type: 'general',
      labor_factor: 1,
      description: 'Auto-created during vendor quote import.',
      active: true,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function upsertQuoteItem(
  supabase: SupabaseClient,
  input: {
    vendorQuoteId: string
    vendorName: string
    lineNumber: number
    row: ImportRow
    categoryByName: Map<string, string>
    rulesByCategory: Map<string, string>
  },
): Promise<string> {
  const partNumber = input.row.part_number.trim()
  const description = input.row.description.trim()
  const quantity = parseNumber(input.row.quantity) ?? 1
  const unitCost = parseNumber(input.row.unit_price)
  const extendedCost =
    parseNumber(input.row.extended_price) ??
    (unitCost != null ? roundCurrency(quantity * unitCost) : null)
  const laborFamilyCode = input.row.labor_family.trim() || null
  const productFamily = input.row.product_family.trim() || null
  const leadTimeDays = parseNumber(input.row.lead_time_days)
  const leadTime = leadTimeDays != null ? `${leadTimeDays} days` : null

  const laborCategoryId = await resolveLaborCategoryId(supabase, input.categoryByName, {
    vendorName: input.vendorName,
    partNumber,
    laborFamilyCode,
    productFamily,
  })
  const laborRuleId = laborCategoryId ? (input.rulesByCategory.get(laborCategoryId) ?? null) : null

  const { data: catalogItem } = await supabase
    .from('catalog_items')
    .select('id')
    .eq('vendor_name', input.vendorName)
    .eq('part_number', partNumber)
    .maybeSingle()

  const payload = {
    vendor_quote_id: input.vendorQuoteId,
    catalog_item_id: catalogItem?.id ?? null,
    line_number: input.lineNumber,
    quantity,
    unit: input.row.unit.trim() || 'EA',
    part_number: partNumber,
    description,
    lead_time: leadTime,
    unit_cost: unitCost,
    extended_cost: extendedCost,
    product_family: productFamily,
    labor_family_code: laborFamilyCode,
    mount_type: input.row.mounting.trim() || null,
    finish_material: input.row.finish.trim() || null,
    size_text: input.row.size.trim() || null,
    color: input.row.color.trim() || null,
    labor_category_id: laborCategoryId,
    labor_rule_id: laborRuleId,
    catalog_match_status: catalogItem?.id ? 'matched' : 'unmatched',
    needs_review: !laborCategoryId || !laborRuleId,
    raw_text: input.row.notes.trim() || null,
  }

  const { data: existing } = await supabase
    .from('quote_items')
    .select('id')
    .eq('vendor_quote_id', input.vendorQuoteId)
    .eq('part_number', partNumber)
    .eq('description', description)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('quote_items')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const { data: byPartOnly } = await supabase
    .from('quote_items')
    .select('id')
    .eq('vendor_quote_id', input.vendorQuoteId)
    .eq('part_number', partNumber)
    .maybeSingle()

  if (byPartOnly) {
    const { data, error } = await supabase
      .from('quote_items')
      .update(payload)
      .eq('id', byPartOnly.id)
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const { data, error } = await supabase.from('quote_items').insert(payload).select('id').single()
  if (error) throw error
  return data.id
}

async function replaceItemModifiers(
  supabase: SupabaseClient,
  quoteItemId: string,
  modifierCodes: string[],
): Promise<number> {
  const { error: deleteError } = await supabase
    .from('quote_item_labor_modifiers')
    .delete()
    .eq('quote_item_id', quoteItemId)

  if (deleteError) throw deleteError
  if (modifierCodes.length === 0) return 0

  let attached = 0
  for (const code of modifierCodes) {
    const laborModifierId = await ensureLaborModifier(supabase, code)
    const { error } = await supabase.from('quote_item_labor_modifiers').upsert(
      {
        quote_item_id: quoteItemId,
        labor_modifier_id: laborModifierId,
      },
      { onConflict: 'quote_item_id,labor_modifier_id', ignoreDuplicates: true },
    )
    if (error) throw error
    attached += 1
  }

  return attached
}

export async function importVendorQuoteFromCsv(
  options: ImportVendorQuoteOptions,
): Promise<ImportVendorQuoteSummary> {
  const absolutePath = resolve(options.filePath)
  const content = readFileSync(absolutePath, 'utf8')
  const records = parseCsv(content) as unknown as ImportRow[]

  if (records.length === 0) {
    throw new Error(`No data rows found in ${absolutePath}`)
  }

  const first = records[0]
  const projectName = options.projectNameOverride ?? first.project_name.trim()
  const vendorName = options.vendorNameOverride ?? first.vendor_name.trim()
  const quoteNumber = options.quoteNumberOverride ?? first.quote_number.trim()

  if (!projectName || !vendorName || !quoteNumber) {
    throw new Error('project_name, vendor_name, and quote_number are required')
  }

  const quoteDate = parseOptionalDate(first.quote_date)
  const quoteExpiration = parseOptionalDate(first.quote_expiration_date)

  const materialTotal = roundCurrency(
    records.reduce((sum, row) => sum + (parseNumber(row.extended_price) ?? 0), 0),
  )

  const { url, key, usesServiceRole } = getSupabaseImportConfig()
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (!usesServiceRole) {
    console.warn(
      'Warning: using publishable key — import may fail if RLS blocks writes. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.',
    )
  }

  const project = await findOrCreateProject(supabase, projectName)
  const vendor = await findOrCreateVendor(supabase, vendorName)
  const quote = await findOrCreateQuote(supabase, {
    projectId: project.id,
    vendorId: vendor.id,
    quoteNumber,
    quoteDate,
    quoteExpiration,
    materialTotal,
  })

  const categoryByName = await loadCategoryMap(supabase)
  const rulesByCategory = await loadRulesByCategory(supabase)

  let modifiersAttached = 0
  let lineNumber = 0

  for (const row of records) {
    if (!row.part_number?.trim()) continue
    lineNumber += 1

    const quoteItemId = await upsertQuoteItem(supabase, {
      vendorQuoteId: quote.id,
      vendorName,
      lineNumber,
      row,
      categoryByName,
      rulesByCategory,
    })

    modifiersAttached += await replaceItemModifiers(
      supabase,
      quoteItemId,
      parseModifierList(row.modifiers),
    )
  }

  const { data: importedItems, error: itemsError } = await supabase
    .from('quote_items')
    .select('extended_cost, unit_cost, product_family, labor_family_code')
    .eq('vendor_quote_id', quote.id)

  if (itemsError) throw itemsError

  const items = importedItems ?? []
  const computedMaterial = roundCurrency(
    items.reduce((sum, item) => sum + (item.extended_cost ?? 0), 0),
  )

  await supabase
    .from('vendor_quotes')
    .update({ material_total: computedMaterial, grand_total: computedMaterial })
    .eq('id', quote.id)

  return {
    project: { id: project.id, name: projectName, created: project.created },
    vendor: { id: vendor.id, name: vendorName, created: vendor.created },
    quote: { id: quote.id, number: quoteNumber, created: quote.created },
    quoteItemCount: items.length,
    materialTotal: computedMaterial,
    missingLaborFamily: items.filter((item) => !item.labor_family_code).length,
    missingProductFamily: items.filter((item) => !item.product_family).length,
    missingUnitPrice: items.filter((item) => item.unit_cost == null).length,
    missingExtendedPrice: items.filter((item) => item.extended_cost == null).length,
    modifiersAttached,
  }
}

export function printImportSummary(summary: ImportVendorQuoteSummary) {
  console.log('\n=== Vendor quote import summary ===')
  console.log(
    `Project: ${summary.project.name} (${summary.project.created ? 'created' : 'found'})`,
  )
  console.log(`Vendor: ${summary.vendor.name} (${summary.vendor.created ? 'created' : 'found'})`)
  console.log(`Quote: ${summary.quote.number} (${summary.quote.created ? 'created' : 'found'})`)
  console.log(`Quote item count: ${summary.quoteItemCount}`)
  console.log(`Material total: $${summary.materialTotal.toFixed(2)}`)
  console.log(`Missing labor_family: ${summary.missingLaborFamily}`)
  console.log(`Missing product_family: ${summary.missingProductFamily}`)
  console.log(`Missing unit_price: ${summary.missingUnitPrice}`)
  console.log(`Missing extended_price: ${summary.missingExtendedPrice}`)
  console.log(`Modifiers attached: ${summary.modifiersAttached}`)
  console.log('\nNext: open the project in the app → Review Lines → Rebuild Estimate')
}
