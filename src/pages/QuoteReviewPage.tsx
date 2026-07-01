import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BradleyMilestoneChecklist from '../components/BradleyMilestoneChecklist'
import CatalogItemPicker from '../components/CatalogItemPicker'
import ProjectWorkflowStepper from '../components/ProjectWorkflowStepper'
import QuoteItemsTable from '../components/QuoteItemsTable'
import QuoteReadinessCard from '../components/QuoteReadinessCard'
import WorkflowPhaseNav from '../components/WorkflowPhaseNav'
import {
  createQuoteItem,
  getLaborCategories,
  getLaborRules,
  getProjectWorkflowStatus,
  getQuoteItemsByQuote,
  getVendorQuote,
  updateQuoteItem,
} from '../lib/data'
import { sumMaterialCost } from '../lib/estimateMath'
import type { ProjectWorkflowStatus } from '../lib/workflow'
import type { LaborCategory, LaborRule, QuoteItem, UpdateQuoteItemInput, VendorQuote } from '../types/database'

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function QuoteReviewPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const [quote, setQuote] = useState<VendorQuote | null>(null)
  const [workflow, setWorkflow] = useState<ProjectWorkflowStatus | null>(null)
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
      const quoteData = await getVendorQuote(quoteId)
      const [itemData, categoryData, ruleData, workflowData] = await Promise.all([
        getQuoteItemsByQuote(quoteId),
        getLaborCategories(),
        getLaborRules(),
        quoteData ? getProjectWorkflowStatus(quoteData.project_id, quoteId) : Promise.resolve(null),
      ])
      setQuote(quoteData)
      setItems(itemData)
      setCategories(categoryData)
      setRules(ruleData)
      setWorkflow(workflowData)
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
    await loadData()
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

  if (!quote || !workflow) {
    return (
      <div className="page">
        <div className="alert alert-error">Quote not found.</div>
        <Link to="/">Back to projects</Link>
      </div>
    )
  }

  const materialTotal = sumMaterialCost(items)
  const isBradleyQuote = quote.quote_number === 'Q-234-5017-01'
  const reviewReady = workflow.phases.review.complete

  return (
    <div className="page">
      <ProjectWorkflowStepper
        projectId={quote.project_id}
        quoteId={quote.id}
        currentPhase="review"
        status={workflow}
      />

      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/projects/${quote.project_id}`}>{workflow.projectName}</Link> / Review Lines
          </p>
          <h1>Phase 2 — Review Lines</h1>
          <p className="muted">
            {quote.vendors?.vendor_name ?? 'Unknown vendor'} · Quote #{quote.quote_number ?? '—'} ·{' '}
            {quote.quote_date ?? 'No date'}
          </p>
        </div>
        {reviewReady && (
          <Link
            className="button-link"
            to={`/projects/${quote.project_id}/estimate?quoteId=${quote.id}`}
          >
            Rebuild Estimate →
          </Link>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card quote-summary-card">
        <dl className="totals-grid">
          <div>
            <dt>Material total</dt>
            <dd>{formatCurrency(materialTotal)}</dd>
          </div>
          <div>
            <dt>Line count</dt>
            <dd>{items.length}</dd>
          </div>
          <div>
            <dt>Quote status</dt>
            <dd>{quote.review_status}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{formatCurrency(quote.shipping_total)}</dd>
          </div>
        </dl>
      </section>

      <QuoteReadinessCard items={items} quoteNumber={quote.quote_number} />

      {isBradleyQuote && <BradleyMilestoneChecklist />}

      {quoteId && <CatalogItemPicker quoteId={quoteId} rules={rules} onItemAdded={loadData} />}

      <QuoteItemsTable
        items={items}
        categories={categories}
        rules={rules}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
      />

      <WorkflowPhaseNav
        projectId={quote.project_id}
        quoteId={quote.id}
        currentPhase="review"
        nextLabel={reviewReady ? 'Labor Rules →' : 'Finish review first'}
        nextDisabled={!reviewReady}
      />
    </div>
  )
}
