import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import EstimateTotalsCard from '../components/EstimateTotalsCard'
import {
  buildEstimateFromQuote,
  getEstimateLines,
  getEstimateVersionsByProject,
  getProject,
  getVendorQuotesByProject,
} from '../lib/data'
import type { EstimateLine, EstimateVersion, Project, VendorQuote } from '../types/database'

export default function EstimateReviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [project, setProject] = useState<Project | null>(null)
  const [quotes, setQuotes] = useState<VendorQuote[]>([])
  const [estimates, setEstimates] = useState<EstimateVersion[]>([])
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>('')
  const [lines, setLines] = useState<EstimateLine[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState(searchParams.get('quoteId') ?? '')
  const [laborRate, setLaborRate] = useState('85')
  const [materialMarkup, setMaterialMarkup] = useState('0')
  const [laborMarkup, setLaborMarkup] = useState('0')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadProjectData() {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [projectData, quoteData, estimateData] = await Promise.all([
        getProject(projectId),
        getVendorQuotesByProject(projectId),
        getEstimateVersionsByProject(projectId),
      ])
      setProject(projectData)
      setQuotes(quoteData)
      setEstimates(estimateData)
      if (estimateData.length > 0) {
        setSelectedEstimateId(estimateData[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load estimate data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjectData()
  }, [projectId])

  useEffect(() => {
    async function loadLines() {
      if (!selectedEstimateId) {
        setLines([])
        return
      }
      try {
        setLines(await getEstimateLines(selectedEstimateId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load estimate lines')
      }
    }

    void loadLines()
  }, [selectedEstimateId])

  async function handleBuildEstimate(event: FormEvent) {
    event.preventDefault()
    if (!projectId || !selectedQuoteId) return

    setBuilding(true)
    setError(null)
    try {
      const result = await buildEstimateFromQuote(
        projectId,
        selectedQuoteId,
        Number(laborRate),
        Number(materialMarkup),
        Number(laborMarkup),
      )
      setEstimates((current) => [result.estimate, ...current])
      setSelectedEstimateId(result.estimate.id)
      setLines(result.lines)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build estimate')
    } finally {
      setBuilding(false)
    }
  }

  const selectedEstimate = estimates.find((estimate) => estimate.id === selectedEstimateId) ?? null

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading estimate review…</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="page">
        <div className="alert alert-error">Project not found.</div>
        <Link to="/">Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/projects/${project.id}`}>{project.project_name}</Link> / Estimate Review
          </p>
          <h1>Estimate Review</h1>
          <p className="muted">Build material + labor totals from reviewed quote line items.</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Build Estimate</h2>
        <form className="form-grid" onSubmit={handleBuildEstimate}>
          <label>
            Vendor Quote
            <select
              value={selectedQuoteId}
              onChange={(event) => setSelectedQuoteId(event.target.value)}
              required
            >
              <option value="">Select quote</option>
              {quotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.vendors?.vendor_name ?? 'Vendor'} · {quote.quote_number ?? quote.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Labor Rate ($/hr)
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborRate}
              onChange={(event) => setLaborRate(event.target.value)}
            />
          </label>
          <label>
            Material Markup (%)
            <input
              type="number"
              min="0"
              step="0.001"
              value={materialMarkup}
              onChange={(event) => setMaterialMarkup(event.target.value)}
            />
          </label>
          <label>
            Labor Markup (%)
            <input
              type="number"
              min="0"
              step="0.001"
              value={laborMarkup}
              onChange={(event) => setLaborMarkup(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={building || !selectedQuoteId}>
              {building ? 'Building…' : 'Build Estimate'}
            </button>
          </div>
        </form>
      </section>

      {estimates.length > 0 && (
        <section className="card">
          <label>
            Saved Estimate Version
            <select
              value={selectedEstimateId}
              onChange={(event) => setSelectedEstimateId(event.target.value)}
            >
              {estimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.version_name} · {new Date(estimate.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {selectedEstimate && <EstimateTotalsCard estimate={selectedEstimate} />}

      {lines.length > 0 && (
        <section className="card">
          <h2>Estimate Lines</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Material</th>
                  <th>Labor Hrs</th>
                  <th>Labor Cost</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.quote_items?.description ?? line.quote_item_id}</td>
                    <td>{line.quantity}</td>
                    <td>${line.material_cost.toFixed(2)}</td>
                    <td>{line.total_labor_hours.toFixed(3)}</td>
                    <td>${line.labor_cost.toFixed(2)}</td>
                    <td>${line.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
