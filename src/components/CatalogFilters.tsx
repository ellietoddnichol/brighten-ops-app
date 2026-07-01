import type { CatalogFacetState, CatalogFacetOption } from '../lib/catalogOrganize'
import { CATALOG_FACETS } from '../lib/catalogOrganize'

interface CatalogFiltersProps {
  facets: CatalogFacetState
  options: Record<keyof CatalogFacetState, string[]>
  onChange: (next: CatalogFacetState) => void
  onClear: () => void
}

export default function CatalogFilters({ facets, options, onChange, onClear }: CatalogFiltersProps) {
  const hasActive = Object.values(facets).some(Boolean)

  function update(key: keyof CatalogFacetState, value: string) {
    onChange({ ...facets, [key]: value })
  }

  return (
    <div className="catalog-filters">
      <div className="catalog-filters-grid">
        {CATALOG_FACETS.map((facet: CatalogFacetOption) => (
          <label key={facet.key}>
            {facet.label}
            <select
              value={facets[facet.key]}
              onChange={(event) => update(facet.key, event.target.value)}
            >
              <option value="">All</option>
              {options[facet.key].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {hasActive && (
        <button type="button" className="link-button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}
