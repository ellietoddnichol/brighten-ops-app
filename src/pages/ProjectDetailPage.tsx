import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProjectWorkflowStepper from '../components/ProjectWorkflowStepper'
import WorkflowPhaseNav from '../components/WorkflowPhaseNav'
import {
  createVendor,
  createVendorQuote,
  getProject,
  getProjectWorkflowStatus,
  getVendorQuotesByProject,
  getVendors,
} from '../lib/data'
import type { Project, Vendor, VendorQuote } from '../types/database'
import type { ProjectWorkflowStatus } from '../lib/workflow'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [quotes, setQuotes] = useState<VendorQuote[]>([])
  const [workflow, setWorkflow] = useState<ProjectWorkflowStatus | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteDate, setQuoteDate] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [projectData, quoteData, vendorData, workflowData] = await Promise.all([
        getProject(projectId),
        getVendorQuotesByProject(projectId),
        getVendors(),
        getProjectWorkflowStatus(projectId),
      ])
      setProject(projectData)
      setQuotes(quoteData)
      setVendors(vendorData)
      setWorkflow(workflowData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [projectId])

  async function handleCreateVendor(event: FormEvent) {
    event.preventDefault()
    if (!newVendorName.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const vendor = await createVendor({ vendor_name: newVendorName.trim(), contact_name: null, email: null, phone: null })
      setVendors((current) => [...current, vendor].sort((a, b) => a.vendor_name.localeCompare(b.vendor_name)))
      setVendorId(vendor.id)
      setNewVendorName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateQuote(event: FormEvent) {
    event.preventDefault()
    if (!projectId) return

    setSubmitting(true)
    setError(null)
    try {
      const quote = await createVendorQuote({
        project_id: projectId,
        vendor_id: vendorId || null,
        quote_number: quoteNumber.trim() || null,
        quote_date: quoteDate || null,
        notes: null,
      })
      setQuoteNumber('')
      setQuoteDate('')
      await loadData()
      navigate(`/quotes/${quote.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading project…</p>
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

  const primaryQuote = quotes[0] ?? null

  return (
    <div className="page">
      <ProjectWorkflowStepper
        projectId={project.id}
        quoteId={workflow.quoteId}
        currentPhase="setup"
        status={workflow}
      />

      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/">Projects</Link> / {project.project_name}
          </p>
          <h1>Phase 1 — Setup</h1>
          <p className="muted">
            {project.customer_name ?? 'No customer'} · {project.location ?? 'No location'}
          </p>
        </div>
        {primaryQuote && (
          <Link className="button-link" to={`/quotes/${primaryQuote.id}`}>
            Continue to Review Lines →
          </Link>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Vendor Quotes</h2>
        {quotes.length === 0 ? (
          <p className="muted">
            No quotes yet. Add a vendor below, create a quote, then review lines in phase 2.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Quote #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>{quote.vendors?.vendor_name ?? '—'}</td>
                    <td>{quote.quote_number ?? '—'}</td>
                    <td>{quote.quote_date ?? '—'}</td>
                    <td>{quote.review_status}</td>
                    <td>
                      <Link to={`/quotes/${quote.id}`}>Review Lines →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>New Vendor Quote</h2>
        <p className="muted">
          After creating a quote you will go straight to Review Lines. Add catalog items there — the
          shared <Link to="/catalog">Product Catalog</Link> is for browsing reference data.
        </p>
        <form className="form-grid" onSubmit={handleCreateQuote}>
          <label>
            Vendor
            <select value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
              <option value="">Select vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quote Number
            <input value={quoteNumber} onChange={(event) => setQuoteNumber(event.target.value)} />
          </label>
          <label>
            Quote Date
            <input type="date" value={quoteDate} onChange={(event) => setQuoteDate(event.target.value)} />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Quote & Review Lines'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Add Vendor</h2>
        <form className="form-inline" onSubmit={handleCreateVendor}>
          <input
            placeholder="Vendor name (e.g. Bradley Company, LLC)"
            value={newVendorName}
            onChange={(event) => setNewVendorName(event.target.value)}
          />
          <button type="submit" disabled={submitting}>
            Add Vendor
          </button>
        </form>
      </section>

      {primaryQuote && (
        <WorkflowPhaseNav
          projectId={project.id}
          quoteId={primaryQuote.id}
          currentPhase="setup"
          nextLabel="Review Lines →"
        />
      )}
    </div>
  )
}
