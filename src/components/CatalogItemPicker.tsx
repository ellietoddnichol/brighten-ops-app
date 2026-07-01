import { useEffect, useMemo, useState } from 'react'
import { createQuoteItemFromCatalog, getCatalogItems } from '../lib/catalogData'
import {
  EMPTY_FACETS,
  filterCatalogItems,
  getFacetOptions,
  groupCatalogItems,
  type CatalogFacetState,
} from '../lib/catalogOrganize'
import CatalogFilters from './CatalogFilters'
import CatalogItemRows from './CatalogItemRows'
import type { CatalogItem } from '../types/catalog'
import type { LaborRule } from '../types/database'

interface CatalogItemPickerProps {
  quoteId: string
  rules: LaborRule[]
  onItemAdded: () => Promise<void>
}

export default function CatalogItemPicker({ quoteId, rules, onItemAdded }: CatalogItemPickerProps) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [query, setQuery] = useState('')
  const [facets, setFacets] = useState<CatalogFacetState>(EMPTY_FACETS)
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setItems(await getCatalogItems())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const facetOptions = useMemo(() => getFacetOptions(items, facets), [items, facets])
  const filtered = useMemo(
    () => filterCatalogItems(items, query, facets),
    [items, query, facets],
  )
  const groups = useMemo(() => groupCatalogItems(filtered), [filtered])

  function resolveRuleId(categoryId: string | null): string | null {
    if (!categoryId) return null
    return rules.find((rule) => rule.labor_category_id === categoryId)?.id ?? null
  }

  async function handleAdd(item: CatalogItem) {
    setAddingId(item.id)
    setError(null)
    try {
      await createQuoteItemFromCatalog(quoteId, item, resolveRuleId(item.labor_category_id))
      await onItemAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add catalog item')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <section className="card">
      <div className="section-header">
        <h2>Add from Product Catalog</h2>
        <span className="muted">{filtered.length} matches</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <label>
        Search catalog
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Part #, family, mount, size, finish…"
        />
      </label>

      <CatalogFilters
        facets={facets}
        options={facetOptions}
        onChange={setFacets}
        onClear={() => setFacets(EMPTY_FACETS)}
      />

      {loading ? (
        <p className="muted">Loading catalog…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">No catalog matches. Adjust filters or search.</p>
      ) : (
        <div className="catalog-picker-groups">
          {groups.map((group) => {
            const isOpen = expandedGroupId === group.id
            return (
              <div key={group.id} className="catalog-picker-group">
                <button
                  type="button"
                  className="catalog-group-toggle"
                  onClick={() => setExpandedGroupId(isOpen ? null : group.id)}
                >
                  <span>
                    <strong>{group.title}</strong>
                    {group.subtitle && <span className="catalog-group-subtitle"> · {group.subtitle}</span>}
                  </span>
                  <span className="muted">
                    {group.items.length} items {isOpen ? '▾' : '▸'}
                  </span>
                </button>
                {isOpen && (
                  <div className="table-wrap catalog-picker-table">
                    <CatalogItemRows
                      items={group.items}
                      showAdd
                      addingId={addingId}
                      onAdd={(item) => void handleAdd(item)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
