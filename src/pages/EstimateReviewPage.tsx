import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import BradleyEstimateValidation from '../components/BradleyEstimateValidation'
import EstimateLinesTable from '../components/EstimateLinesTable'
import EstimateTotalsCard from '../components/EstimateTotalsCard'
import ProjectWorkflowStepper from '../components/ProjectWorkflowStepper'
import WorkflowPhaseNav from '../components/WorkflowPhaseNav'
import {
  buildEstimateFromQuote,
  getEstimateLines,
  getEstimateVersionsByProject,
  getProject,
  getProjectWorkflowStatus,
  getQuoteItemsByQuote,
  getVendorQuotesByProject,
} from '../lib/data'
import {
  BRADLEY_SPOT_CHECKS,
  buildEstimateAudit,
  isBradleyMilestoneQuote,
  runBradleySpotChecks,
} from '../lib/estimateAudit'
import type { ProjectWorkflowStatus } from '../lib/workflow'
import type { EstimateLine, EstimateVersion, Project, QuoteItem, VendorQuote } from '../types/database'

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function EstimateReviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [project, setProject] = useState<Project | null>(null)
  const [workflow, setWorkflow] = useState<ProjectWorkflowStatus | null>(null)
  const [quotes, setQuotes] = useState<VendorQuote[]>([])
  const [estimates, setEstimates] = useState<EstimateVersion[]>([])
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>('')
  const [lines, setLines] = useState<EstimateLine[]>([])
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState(searchParams.get('quoteId') ?? '')
  const [laborRate, setLaborRate] = useState('85')
  const [materialMarkup, setMaterialMarkup] = useState('0')
  const [laborMarkup, setLaborMarkup] = useState('0')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId) ?? null

  const quoteIdFromUrl = searchParams.get('quoteId')

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
      const initialQuoteId = quoteIdFromUrl ?? quoteData[0]?.id ?? ''
      const workflowData = await getProjectWorkflowStatus(projectId, initialQuoteId || null)

      setProject(projectData)
      setQuotes(quoteData)
      setEstimates(estimateData)
      setWorkflow(workflowData)
      setSelectedQuoteId((current) => current || initialQuoteId)
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
  }, [projectId, quoteIdFromUrl])

  useEffect(() => {
    if (!projectId) return
    void (async () => {
      setWorkflow(await getProjectWorkflowStatus(projectId, selectedQuoteId || null))
    })()
  }, [projectId, selectedQuoteId])

  useEffect(() => {
    async function loadQuoteItems() {
      if (!selectedQuoteId) {
        setQuoteItems([])
        return
      }
      try {
        setQuoteItems(await getQuoteItemsByQuote(selectedQuoteId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quote items for audit')
      }
    }

    void loadQuoteItems()
  }, [selectedQuoteId])

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
      setQuoteItems(await getQuoteItemsByQuote(selectedQuoteId))
      setWorkflow(await getProjectWorkflowStatus(projectId, selectedQuoteId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build estimate')
    } finally {
      setBuilding(false)
    }
  }

  const selectedEstimate = estimates.find((estimate) => estimate.id === selectedEstimateId) ?? null
  const showBradleyValidation = isBradleyMilestoneQuote(project?.project_name, selectedQuote)
  const bradleyAudit = useMemo(
    () =>
      showBradleyValidation
        ? buildEstimateAudit({
            quote: selectedQuote,
            quoteItems,
            estimate: selectedEstimate,
            lines,
            bradleyExpected: true,
          })
        : null,
    [showBradleyValidation, selectedQuote, quoteItems, selectedEstimate, lines],
  )
  const bradleySpotChecks = useMemo(
    () => (showBradleyValidation ? runBradleySpotChecks(lines) : []),
    [showBradleyValidation, lines],
  )
  const spotCheckPartNumbers = useMemo(
    () => new Set(BRADLEY_SPOT_CHECKS.map((check) => check.partNumber)),
    [],
  )

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading estimate review…</p>
      </div>
    )
  }

  if (!project || !workflow) {
    return (
      <div className="page">
        <div className="alert alert-error">Project not found.</div>
        <Link to="/">Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <ProjectWorkflowStepper
        projectId={project.id}
        quoteId={selectedQuoteId || workflow.quoteId}
        currentPhase="estimate"
        status={workflow}
      />

      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/projects/${project.id}`}>{project.project_name}</Link> / Estimate
          </p>
          <h1>Phase 4 — Estimate</h1>
          <p className="muted">
            Material from vendor quote · labor from rules + modifiers · markup on dollars only.
          </p>
        </div>
        <div className="proposal-header-actions">
          {selectedQuoteId && (
            <Link className="button-link proposal-back-link" to={`/quotes/${selectedQuoteId}`}>
              ← Back to Review Lines
            </Link>
          )}
          {selectedEstimateId && (
            <Link
              className="button-link"
              to={`/projects/${project.id}/proposal?estimateId=${selectedEstimateId}${selectedQuoteId ? `&quoteId=${selectedQuoteId}` : ''}`}
            >
              Export Proposal →
            </Link>
          )}
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Rebuild Estimate</h2>
        <p className="muted">
          Creates a new estimate version from the current quote lines and latest labor rules.
          Material comes from vendor quote pricing only.
        </p>
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
              {building ? 'Rebuilding…' : 'Rebuild Estimate'}
            </button>
          </div>
        </form>
        {selectedQuote && (
          <p className="muted">
            Source: {selectedQuote.vendors?.vendor_name ?? 'Vendor'} · Quote #
            {selectedQuote.quote_number ?? '—'} · Quote material{' '}
            {formatCurrency(selectedQuote.material_total ?? 0)}
          </p>
        )}
        <p className="muted">
          Changed labor rules?{' '}
          <Link
            to={`/labor-rules?projectId=${project.id}&quoteId=${selectedQuoteId || workflow.quoteId || ''}`}
          >
            Review labor rules
          </Link>{' '}
          then rebuild here.
        </p>
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

      {selectedEstimate && lines.length > 0 && (
        <section className="card no-print">
          <h2>Client proposal</h2>
          <p className="muted">
            Generate a printable proposal for your customer with materials, installation, and total
            pricing. Internal labor hours and modifiers stay on the estimate page.
          </p>
          <Link
            className="button-link"
            to={`/projects/${project.id}/proposal?estimateId=${selectedEstimate.id}${selectedQuoteId ? `&quoteId=${selectedQuoteId}` : ''}`}
          >
            Open Proposal Export →
          </Link>
        </section>
      )}

      {bradleyAudit && (
        <BradleyEstimateValidation audit={bradleyAudit} spotChecks={bradleySpotChecks} />
      )}

      {lines.length > 0 && (
        <section className="card">
          <h2>Estimate Lines</h2>
          {showBradleyValidation && (
            <p className="muted">
              Spot-check sample parts are highlighted. Confirm labor family and base hours/unit per
              line.
            </p>
          )}
          <EstimateLinesTable
            lines={lines}
            highlightPartNumbers={showBradleyValidation ? spotCheckPartNumbers : undefined}
          />
        </section>
      )}

      <WorkflowPhaseNav
        projectId={project.id}
        quoteId={selectedQuoteId || workflow.quoteId}
        currentPhase="estimate"
      />
    </div>
  )
}
