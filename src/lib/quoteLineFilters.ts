import type { QuoteItem } from '../types/database'

export interface QuoteLineFacetState {
  productFamily: string
  laborFamily: string
  mountType: string
  sizeText: string
  finishMaterial: string
  color: string
  matchStatus: string
}

export const EMPTY_QUOTE_LINE_FACETS: QuoteLineFacetState = {
  productFamily: '',
  laborFamily: '',
  mountType: '',
  sizeText: '',
  finishMaterial: '',
  color: '',
  matchStatus: '',
}

export function filterQuoteLines(
  items: QuoteItem[],
  query: string,
  facets: QuoteLineFacetState,
): QuoteItem[] {
  const normalized = query.trim().toLowerCase()

  return items.filter((item) => {
    if (facets.productFamily && item.product_family !== facets.productFamily) return false
    if (facets.laborFamily && item.labor_family_code !== facets.laborFamily) return false
    if (facets.mountType && (item.mount_type ?? '') !== facets.mountType) return false
    if (facets.sizeText && (item.size_text ?? '') !== facets.sizeText) return false
    if (facets.finishMaterial && (item.finish_material ?? '') !== facets.finishMaterial) return false
    if (facets.color && (item.color ?? '') !== facets.color) return false
    if (facets.matchStatus && (item.catalog_match_status ?? '') !== facets.matchStatus) return false

    if (!normalized) return true

    const haystack = [
      item.part_number,
      item.description,
      item.product_family,
      item.labor_family_code,
      item.mount_type,
      item.size_text,
      item.finish_material,
      item.color,
      item.raw_text,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}

export function getQuoteLineFacetOptions(
  items: QuoteItem[],
): Record<keyof QuoteLineFacetState, string[]> {
  const unique = (values: Array<string | null | undefined>) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
      a.localeCompare(b),
    )

  return {
    productFamily: unique(items.map((item) => item.product_family)),
    laborFamily: unique(items.map((item) => item.labor_family_code)),
    mountType: unique(items.map((item) => item.mount_type)),
    sizeText: unique(items.map((item) => item.size_text)),
    finishMaterial: unique(items.map((item) => item.finish_material)),
    color: unique(items.map((item) => item.color)),
    matchStatus: unique(items.map((item) => item.catalog_match_status)),
  }
}
