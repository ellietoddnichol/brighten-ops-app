import type { CatalogItem } from '../types/catalog'

export interface CatalogFacetState {
  productFamily: string
  mountType: string
  frameType: string
  sizeText: string
  finishMaterial: string
  color: string
  operationType: string
}

export const EMPTY_FACETS: CatalogFacetState = {
  productFamily: '',
  mountType: '',
  frameType: '',
  sizeText: '',
  finishMaterial: '',
  color: '',
  operationType: '',
}

export interface CatalogFacetOption {
  key: keyof CatalogFacetState
  label: string
  getValue: (item: CatalogItem) => string | null
}

export const CATALOG_FACETS: CatalogFacetOption[] = [
  { key: 'productFamily', label: 'Product family', getValue: (item) => item.product_family },
  { key: 'mountType', label: 'Mounting', getValue: (item) => item.mount_type },
  { key: 'frameType', label: 'Frame', getValue: (item) => item.frame_type },
  { key: 'sizeText', label: 'Size', getValue: (item) => formatSize(item) },
  { key: 'finishMaterial', label: 'Finish / material', getValue: (item) => item.finish_material },
  { key: 'color', label: 'Color', getValue: (item) => item.color },
  { key: 'operationType', label: 'Operation', getValue: (item) => item.operation_type },
]

export interface CatalogGroup {
  id: string
  title: string
  subtitle: string | null
  items: CatalogItem[]
}

export function formatSize(item: CatalogItem): string | null {
  if (item.size_text) return item.size_text
  const parts: string[] = []
  if (item.diameter_od_in != null) parts.push(`${item.diameter_od_in}" OD`)
  if (item.length_in != null && item.width_in != null) {
    parts.push(`${item.length_in}x${item.width_in}`)
  } else if (item.length_in != null) {
    parts.push(`${item.length_in}" L`)
  }
  if (item.height_in != null) parts.push(`${item.height_in}" H`)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatMount(item: CatalogItem): string {
  return item.mount_type ?? '—'
}

export function formatFinish(item: CatalogItem): string {
  const parts = [item.finish_material, item.color, item.frame_type].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export function getFacetOptions(
  items: CatalogItem[],
  activeFacets: CatalogFacetState,
): Record<keyof CatalogFacetState, string[]> {
  const options = {} as Record<keyof CatalogFacetState, string[]>

  for (const facet of CATALOG_FACETS) {
    const pool = items.filter((item) => matchesFacets(item, activeFacets, facet.key))
    const values = new Set<string>()
    for (const item of pool) {
      const value = facet.getValue(item)
      if (value) values.add(value)
    }
    options[facet.key] = [...values].sort((a, b) => a.localeCompare(b))
  }

  return options
}

export function matchesFacets(
  item: CatalogItem,
  facets: CatalogFacetState,
  skipKey?: keyof CatalogFacetState,
): boolean {
  for (const facet of CATALOG_FACETS) {
    if (facet.key === skipKey) continue
    const selected = facets[facet.key]
    if (!selected) continue
    const value = facet.getValue(item)
    if (value !== selected) return false
  }
  return true
}

export function matchesSearch(item: CatalogItem, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = [
    item.part_number,
    item.description,
    item.product_family,
    item.mount_type,
    item.frame_type,
    item.finish_material,
    item.color,
    item.operation_type,
    item.capacity,
    formatSize(item),
    item.labor_categories?.category_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export function filterCatalogItems(
  items: CatalogItem[],
  query: string,
  facets: CatalogFacetState,
): CatalogItem[] {
  return items.filter((item) => matchesSearch(item, query) && matchesFacets(item, facets))
}

function subgroupLabel(item: CatalogItem): string {
  const parts = [
    item.mount_type ? `Mount: ${item.mount_type}` : null,
    item.frame_type ? `Frame: ${item.frame_type}` : null,
    formatSize(item) ? `Size: ${formatSize(item)}` : null,
    item.finish_material ? `Finish: ${item.finish_material}` : null,
    item.color ? `Color: ${item.color}` : null,
    item.operation_type ? `Op: ${item.operation_type}` : null,
    item.capacity ? `Cap: ${item.capacity}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'General'
}

export function groupCatalogItems(items: CatalogItem[]): CatalogGroup[] {
  const byFamily = new Map<string, CatalogItem[]>()

  for (const item of items) {
    const family = item.product_family
    const list = byFamily.get(family) ?? []
    list.push(item)
    byFamily.set(family, list)
  }

  const groups: CatalogGroup[] = []

  for (const [family, familyItems] of [...byFamily.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const bySubgroup = new Map<string, CatalogItem[]>()

    for (const item of familyItems) {
      const key = subgroupLabel(item)
      const list = bySubgroup.get(key) ?? []
      list.push(item)
      bySubgroup.set(key, list)
    }

    for (const [subtitle, subgroupItems] of [...bySubgroup.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      subgroupItems.sort((a, b) => a.part_number.localeCompare(b.part_number))
      groups.push({
        id: `${family}::${subtitle}`,
        title: family,
        subtitle,
        items: subgroupItems,
      })
    }
  }

  return groups
}
