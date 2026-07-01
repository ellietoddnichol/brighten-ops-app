import { useState } from 'react'
import { calcExtendedCost } from '../lib/estimateMath'
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

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Unit</th>
              <th>Part #</th>
              <th>Description</th>
              <th>Lead Time</th>
              <th>Unit Cost</th>
              <th>Ext Cost</th>
              <th>Labor Category</th>
              <th>Labor Rule</th>
              <th>Needs Review</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-cell">
                  No line items yet. Add your first Bradley quote line manually.
                </td>
              </tr>
            ) : (
              items.map((item) => (
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
                  <td>
                    <input
                      type="text"
                      value={item.unit}
                      disabled={savingId === item.id}
                      onChange={(event) => void handleFieldChange(item, 'unit', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.part_number ?? ''}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'part_number', event.target.value)
                      }
                    />
                  </td>
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
                      type="text"
                      value={item.lead_time ?? ''}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'lead_time', event.target.value)
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
                  <td colSpan={2}>
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
                  <td>
                    <input
                      type="checkbox"
                      checked={item.needs_review}
                      disabled={savingId === item.id}
                      onChange={(event) =>
                        void handleFieldChange(item, 'needs_review', event.target.checked)
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
