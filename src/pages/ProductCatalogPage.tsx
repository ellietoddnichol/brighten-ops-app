import { useEffect, useMemo, useState } from 'react'
import { getCatalogItems } from '../lib/catalogData'
import {
  EMPTY_FACETS,
  filterCatalogItems,
  getFacetOptions,
  groupCatalogItems,
  type CatalogFacetState,
} from '../lib/catalogOrganize'
import CatalogFilters from '../components/CatalogFilters'
import CatalogItemRows from '../components/CatalogItemRows'
import type { CatalogItem } from '../types/catalog'

export default function ProductCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [query, setQuery] = useState('')
  const [facets, setFacets] = useState<CatalogFacetState>(EMPTY_FACETS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setItems(await getCatalogItems())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product catalog')
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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p className="muted">
            Browse Bradley items by family, mounting, dimensions, and finish. Shared across all
            projects.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <div className="section-header">
          <h2>Browse &amp; filter</h2>
          <span className="muted">
            {filtered.length} of {items.length} items · {groups.length} groups
          </span>
        </div>
        <label>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Part #, description, size, mount, finish…"
          />
        </label>
        <CatalogFilters
          facets={facets}
          options={facetOptions}
          onChange={setFacets}
          onClear={() => setFacets(EMPTY_FACETS)}
        />
      </section>

      {loading ? (
        <section className="card">
          <p className="muted">Loading catalog…</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="card">
          <p className="muted">No items match your filters.</p>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="card catalog-group-card">
            <header className="catalog-group-header">
              <div>
                <h2>{group.title}</h2>
                {group.subtitle && <p className="catalog-group-subtitle">{group.subtitle}</p>}
              </div>
              <span className="muted">{group.items.length} items</span>
            </header>
            <div className="table-wrap">
              <CatalogItemRows items={group.items} />
            </div>
          </section>
        ))
      )}
    </div>
  )
}
