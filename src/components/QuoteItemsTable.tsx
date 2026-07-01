import { useMemo, useState } from 'react'
import { calcExtendedCost, formatModifierList, sumMaterialCost } from '../lib/estimateMath'
import {
  EMPTY_QUOTE_LINE_FACETS,
  filterQuoteLines,
  getQuoteLineFacetOptions,
  type QuoteLineFacetState,
} from '../lib/quoteLineFilters'
import LaborCategorySelect from './LaborCategorySelect'
import type { LaborCategory, LaborRule, QuoteItem, UpdateQuoteItemInput } from '../types/database'

interface QuoteItemsTableProps {
  items: QuoteItem[]
  categories: LaborCategory[]
  rules: LaborRule[]
  onUpdateItem: (id: string, input: UpdateQuoteItemInput) => Promise<void>
  onAddItem: () => Promise<void>
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function QuoteItemsTable({
  items,
  categories,
  rules,
  onUpdateItem,
  onAddItem,
}: QuoteItemsTableProps) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [facets, setFacets] = useState<QuoteLineFacetState>(EMPTY_QUOTE_LINE_FACETS)

  const facetOptions = useMemo(() => getQuoteLineFacetOptions(items), [items])
  const filtered = useMemo(() => filterQuoteLines(items, query, facets), [items, query, facets])
  const materialTotal = useMemo(() => sumMaterialCost(items), [items])

  async function handleFieldChange(
    item: QuoteItem,
    field: keyof UpdateQuoteItemInput,
    rawValue: string | boolean,
  ) {
    setSavingId(item.id)
    try {
      let patch: UpdateQuoteItemInput = { [field]: rawValue } as UpdateQuoteItemInput

      if (field === 'quantity' || field === 'unit_cost') {
        const quantity = field === 'quantity' ? Number(rawValue) : item.quantity
        const unitCost = field === 'unit_cost' ? Number(rawValue) : item.unit_cost
        patch = {
          ...patch,
          extended_cost: calcExtendedCost(quantity, unitCost || null),
        }
      }

      if (field === 'labor_category_id' || field === 'labor_rule_id') {
        patch.needs_review = false
      }

      await onUpdateItem(item.id, patch)
    } finally {
      setSavingId(null)
    }
  }

  async function handleLaborChange(
    item: QuoteItem,
    categoryId: string | null,
    ruleId: string | null,
  ) {
    setSavingId(item.id)
    try {
      await onUpdateItem(item.id, {
        labor_category_id: categoryId,
        labor_rule_id: ruleId,
        needs_review: !categoryId || !ruleId,
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="card">
      <div className="section-header">
        <h2>Quote Line Items</h2>
        <button
          type="button"
          disabled={adding}
          onClick={async () => {
            setAdding(true)
            try {
              await onAddItem()
            } finally {
              setAdding(false)
            }
          }}
        >
          {adding ? 'Adding…' : 'Add Line Item'}
        </button>
      </div>

      <label>
        Filter lines
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Part #, description, family, mount, size…"
        />
      </label>

      <div className="catalog-filters-grid quote-line-filters">
        {(
          [
            ['productFamily', 'Product family', facetOptions.productFamily],
            ['laborFamily', 'Labor family', facetOptions.laborFamily],
            ['mountType', 'Mounting', facetOptions.mountType],
            ['sizeText', 'Size', facetOptions.sizeText],
            ['finishMaterial', 'Finish', facetOptions.finishMaterial],
            ['color', 'Color', facetOptions.color],
            ['matchStatus', 'Match', facetOptions.matchStatus],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key}>
            {label}
            <select
              value={facets[key]}
              onChange={(event) => setFacets((current) => ({ ...current, [key]: event.target.value }))}
            >
              <option value="">All</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table quote-lines-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Part #</th>
              <th>Description</th>
              <th>Unit $</th>
              <th>Ext $</th>
              <th>Family</th>
              <th>Labor family</th>
              <th>Mount</th>
              <th>Size</th>
              <th>Finish</th>
              <th>Modifiers</th>
              <th>Lead</th>
              <th>Match</th>
              <th>Labor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className="empty-cell">
                  No line items match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className={item.needs_review ? 'needs-review' : ''}>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.quantity}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'quantity', event.target.value)
                      }
                    />
                  </td>
                  <td className="part-cell">{item.part_number ?? '—'}</td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'description', event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost ?? ''}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'unit_cost', event.target.value)
                      }
                    />
                  </td>
                  <td>{formatCurrency(item.extended_cost)}</td>
                  <td>{item.product_family ?? '—'}</td>
                  <td>{item.labor_family_code ?? '—'}</td>
                  <td>{item.mount_type ?? '—'}</td>
                  <td>{item.size_text ?? '—'}</td>
                  <td>{item.finish_material ?? '—'}</td>
                  <td className="modifier-cell">
                    {formatModifierList(item.quote_item_labor_modifiers) || '—'}
                  </td>
                  <td>{item.lead_time ?? '—'}</td>
                  <td>{item.catalog_match_status ?? '—'}</td>
                  <td>
                    <LaborCategorySelect
                      categories={categories}
                      rules={rules}
                      categoryId={item.labor_category_id}
                      ruleId={item.labor_rule_id}
                      disabled={savingId === item.id}
                      onCategoryChange={(categoryId, ruleId) =>
                        void handleLaborChange(item, categoryId, ruleId)
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="quote-material-total">
        <strong>Material total:</strong> {formatCurrency(materialTotal)}
        <span className="muted"> · {items.length} lines · showing {filtered.length}</span>
      </footer>
    </section>
  )
}
