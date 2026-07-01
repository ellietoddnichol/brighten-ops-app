import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createProject, getProjects, getProjectsWorkflowSummaries } from '../lib/data'
import { formatSupabaseError } from '../lib/formatSupabaseError'
import { summaryPhaseLabel, workflowPhasePath } from '../lib/workflow'
import type { ProjectWorkflowSummary } from '../lib/workflow'
import type { Project } from '../types/database'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [summaries, setSummaries] = useState<Map<string, ProjectWorkflowSummary>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      const projectData = await getProjects()
      setProjects(projectData)
      setSummaries(await getProjectsWorkflowSummaries(projectData.map((project) => project.id)))
    } catch (err) {
      setError(formatSupabaseError(err, 'Failed to load projects'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!projectName.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const project = await createProject({
        project_name: projectName.trim(),
        customer_name: customerName.trim() || null,
        location: location.trim() || null,
        bid_date: null,
        notes: null,
      })
      setProjectName('')
      setCustomerName('')
      setLocation('')
      await loadProjects()
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(formatSupabaseError(err, 'Failed to create project'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">
            Start a project, then follow the four-phase workflow: Setup → Review Lines → Labor Rules
            → Estimate.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>New Project</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Project Name
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              required
            />
          </label>
          <label>
            Customer
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </label>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>All Projects</h2>
        {loading ? (
          <p className="muted">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="muted">No projects yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>Workflow</th>
                  <th>Next step</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const summary = summaries.get(project.id)
                  const nextHref = summary?.quoteId
                    ? workflowPhasePath(summary.suggestedPhase, project.id, summary.quoteId)
                    : `/projects/${project.id}`

                  return (
                    <tr key={project.id}>
                      <td>
                        <Link to={`/projects/${project.id}`}>{project.project_name}</Link>
                      </td>
                      <td>{project.customer_name ?? '—'}</td>
                      <td>
                        {summary ? (
                          <span
                            className={
                              summary.hasEstimate
                                ? 'workflow-badge workflow-badge-complete'
                                : 'workflow-badge'
                            }
                          >
                            {summary.phaseLabel}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {summary ? (
                          <Link to={nextHref}>{summaryPhaseLabel(summary)} →</Link>
                        ) : (
                          <Link to={`/projects/${project.id}`}>Open setup →</Link>
                        )}
                      </td>
                      <td>{new Date(project.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
