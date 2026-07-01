import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QuoteItemsTable from '../components/QuoteItemsTable'
import {
  createQuoteItem,
  getLaborCategories,
  getLaborRules,
  getQuoteItemsByQuote,
  getVendorQuote,
  updateQuoteItem,
} from '../lib/data'
import type { LaborCategory, LaborRule, QuoteItem, UpdateQuoteItemInput, VendorQuote } from '../types/database'

export default function QuoteReviewPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const [quote, setQuote] = useState<VendorQuote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [categories, setCategories] = useState<LaborCategory[]>([])
  const [rules, setRules] = useState<LaborRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    if (!quoteId) return
    setLoading(true)
    setError(null)
    try {
      const [quoteData, itemData, categoryData, ruleData] = await Promise.all([
        getVendorQuote(quoteId),
        getQuoteItemsByQuote(quoteId),
        getLaborCategories(),
        getLaborRules(),
      ])
      setQuote(quoteData)
      setItems(itemData)
      setCategories(categoryData)
      setRules(ruleData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [quoteId])

  async function handleUpdateItem(id: string, input: UpdateQuoteItemInput) {
    const updated = await updateQuoteItem(id, input)
    setItems((current) => current.map((item) => (item.id === id ? updated : item)))
  }

  async function handleAddItem() {
    if (!quoteId) return
    const created = await createQuoteItem({
      vendor_quote_id: quoteId,
      quantity: 1,
      unit: 'EA',
      part_number: null,
      description: 'New line item',
      lead_time: null,
      unit_cost: null,
      extended_cost: null,
      labor_category_id: null,
      labor_rule_id: null,
      needs_review: true,
    })
    setItems((current) => [...current, created])
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading quote…</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="page">
        <div className="alert alert-error">Quote not found.</div>
        <Link to="/">Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/projects/${quote.project_id}`}>Project</Link> / Quote Review
          </p>
          <h1>Quote Review</h1>
          <p className="muted">
            {quote.vendors?.vendor_name ?? 'Unknown vendor'} · Quote #{quote.quote_number ?? '—'}
          </p>
        </div>
        <Link className="button-link" to={`/projects/${quote.project_id}/estimate?quoteId=${quote.id}`}>
          Build Estimate
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <QuoteItemsTable
        items={items}
        categories={categories}
        rules={rules}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
      />
    </div>
  )
}
