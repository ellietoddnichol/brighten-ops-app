import { supabase } from './supabaseClient'
import { calcExtendedCost } from './estimateMath'
import type { CatalogItem, CatalogItemModifier, CatalogLaborFamily } from '../types/catalog'
import type { QuoteItem } from '../types/database'

export async function getCatalogLaborFamilies(): Promise<CatalogLaborFamily[]> {
  const { data, error } = await supabase
    .from('catalog_labor_families')
    .select('*')
    .order('family_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function searchCatalogItems(
  query: string,
  vendorName = 'Bradley Company, LLC',
  limit = 50,
): Promise<CatalogItem[]> {
  const trimmed = query.trim()
  let request = supabase
    .from('catalog_items')
    .select('*, labor_categories(category_name)')
    .eq('active', true)
    .eq('vendor_name', vendorName)
    .order('part_number', { ascending: true })
    .limit(limit)

  if (trimmed) {
    const pattern = `%${trimmed.replaceAll('%', '\\%')}%`
    request = request.or(
      `part_number.ilike.${pattern},description.ilike.${pattern},product_family.ilike.${pattern}`,
    )
  }

  const { data, error } = await request
  if (error) throw error
  return data ?? []
}

export async function getCatalogItems(vendorName = 'Bradley Company, LLC'): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*, labor_categories(category_name)')
    .eq('active', true)
    .eq('vendor_name', vendorName)
    .order('product_family', { ascending: true })
    .order('mount_type', { ascending: true, nullsFirst: false })
    .order('size_text', { ascending: true, nullsFirst: false })
    .order('part_number', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getCatalogItemModifiers(catalogItemId: string): Promise<CatalogItemModifier[]> {
  const { data, error } = await supabase
    .from('catalog_item_modifiers')
    .select('*')
    .eq('catalog_item_id', catalogItemId)
    .order('modifier_sequence', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createQuoteItemFromCatalog(
  vendorQuoteId: string,
  catalogItem: CatalogItem,
  laborRuleId: string | null,
  quantity = 1,
): Promise<QuoteItem> {
  const unitCost = catalogItem.list_unit_price
  const extendedCost = calcExtendedCost(quantity, unitCost)

  const { data, error } = await supabase
    .from('quote_items')
    .insert({
      vendor_quote_id: vendorQuoteId,
      catalog_item_id: catalogItem.id,
      quantity,
      unit: catalogItem.default_unit,
      part_number: catalogItem.part_number,
      description: catalogItem.description,
      lead_time: catalogItem.default_lead_time_days
        ? `${catalogItem.default_lead_time_days} days`
        : null,
      unit_cost: unitCost,
      extended_cost: extendedCost,
      product_family: catalogItem.product_family,
      labor_family_code: catalogItem.labor_family_code,
      mount_type: catalogItem.mount_type,
      finish_material: catalogItem.finish_material,
      size_text: catalogItem.size_text,
      color: catalogItem.color,
      catalog_match_status: 'matched',
      labor_category_id: catalogItem.labor_category_id,
      labor_rule_id: laborRuleId,
      needs_review: !catalogItem.labor_category_id || !laborRuleId,
      raw_text: catalogItem.database_notes,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
