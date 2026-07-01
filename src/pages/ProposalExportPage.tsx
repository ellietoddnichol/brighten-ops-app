import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ProposalDocument from '../components/ProposalDocument'
import {
  getEstimateLines,
  getEstimateVersionsByProject,
  getProject,
  getVendorQuote,
} from '../lib/data'
import { formatDate } from '../lib/formatCurrency'
import { buildProposalDocument, DEFAULT_PROPOSAL_TERMS } from '../lib/proposalDocument'
import type { EstimateLine, EstimateVersion, Project } from '../types/database'

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export default function ProposalExportPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [project, setProject] = useState<Project | null>(null)
  const [estimates, setEstimates] = useState<EstimateVersion[]>([])
  const [lines, setLines] = useState<EstimateLine[]>([])
  const [selectedEstimateId, setSelectedEstimateId] = useState(searchParams.get('estimateId') ?? '')
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [validDays, setValidDays] = useState('30')
  const [showPartNumbers, setShowPartNumbers] = useState(true)
  const [scopeNotes, setScopeNotes] = useState(DEFAULT_PROPOSAL_TERMS)

  const preparedDate = useMemo(() => new Date(), [])
  const validThroughDate = useMemo(
    () => addDays(preparedDate, Number(validDays) || 30),
    [preparedDate, validDays],
  )

  useEffect(() => {
    if (!projectId) return
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const [projectData, estimateData] = await Promise.all([
          getProject(projectId),
          getEstimateVersionsByProject(projectId),
        ])
        setProject(projectData)
        setEstimates(estimateData)
        if (!selectedEstimateId && estimateData.length > 0) {
          setSelectedEstimateId(estimateData[0].id)
        }
        if (projectData) {
          setTitle(`${projectData.project_name} — Division 10 Proposal`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load proposal data')
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId])

  useEffect(() => {
    if (!selectedEstimateId) {
      setLines([])
      return
    }

    void (async () => {
      try {
        const lineData = await getEstimateLines(selectedEstimateId)
        setLines(lineData)

        const quoteId = lineData[0]?.quote_items?.vendor_quote_id
        if (quoteId) {
          const quote = await getVendorQuote(quoteId)
          setQuoteNumber(quote?.quote_number ?? null)
          setVendorName(quote?.vendors?.vendor_name ?? null)
        } else {
          setQuoteNumber(null)
          setVendorName(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load estimate lines')
      }
    })()
  }, [selectedEstimateId])

  const selectedEstimate = estimates.find((estimate) => estimate.id === selectedEstimateId) ?? null

  const proposalData = useMemo(() => {
    if (!project || !selectedEstimate || lines.length === 0) return null
    return buildProposalDocument({
      projectName: project.project_name,
      customerName: project.customer_name,
      location: project.location,
      quoteNumber,
      vendorName,
      estimate: selectedEstimate,
      lines,
      title: title.trim() || `${project.project_name} — Division 10 Proposal`,
      preparedDate: preparedDate.toISOString(),
      validThroughDate: validThroughDate.toISOString(),
      showPartNumbers,
      scopeNotes,
    })
  }, [
    project,
    selectedEstimate,
    lines,
    quoteNumber,
    vendorName,
    title,
    preparedDate,
    validThroughDate,
    showPartNumbers,
    scopeNotes,
  ])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading proposal…</p>
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
    <div className="page proposal-export-page">
      <header className="page-header no-print">
        <div>
          <p className="breadcrumb">
            <Link to={`/projects/${project.id}`}>{project.project_name}</Link> / Proposal
          </p>
          <h1>Client Proposal</h1>
          <p className="muted">
            Preview the client-facing proposal, then print or save as PDF from your browser.
          </p>
        </div>
        <div className="proposal-header-actions">
          <Link
            className="button-link proposal-back-link"
            to={`/projects/${project.id}/estimate${searchParams.get('quoteId') ? `?quoteId=${searchParams.get('quoteId')}` : ''}`}
          >
            ← Back to Estimate
          </Link>
          <button type="button" onClick={handlePrint} disabled={!proposalData}>
            Print / Save PDF
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error no-print">{error}</div>}

      <section className="card proposal-controls no-print">
        <h2>Proposal settings</h2>
        {estimates.length === 0 ? (
          <p className="muted">
            No saved estimate yet.{' '}
            <Link to={`/projects/${project.id}/estimate`}>Rebuild estimate</Link> first.
          </p>
        ) : (
          <div className="form-grid">
            <label>
              Estimate version
              <select
                value={selectedEstimateId}
                onChange={(event) => setSelectedEstimateId(event.target.value)}
              >
                {estimates.map((estimate) => (
                  <option key={estimate.id} value={estimate.id}>
                    {estimate.version_name} · {formatDate(estimate.created_at)} ·{' '}
                    {estimate.estimate_total.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Proposal title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Valid for (days)
              <input
                type="number"
                min="1"
                value={validDays}
                onChange={(event) => setValidDays(event.target.value)}
              />
            </label>
            <label className="proposal-checkbox-label">
              <input
                type="checkbox"
                checked={showPartNumbers}
                onChange={(event) => setShowPartNumbers(event.target.checked)}
              />
              Show part numbers on proposal
            </label>
            <label className="proposal-notes-field">
              Notes &amp; terms
              <textarea
                rows={4}
                value={scopeNotes}
                onChange={(event) => setScopeNotes(event.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {proposalData ? (
        <div className="proposal-preview card">
          <ProposalDocument data={proposalData} />
        </div>
      ) : (
        <section className="card no-print">
          <p className="muted">Select an estimate version with lines to preview the proposal.</p>
        </section>
      )}
    </div>
  )
}
