import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createProject, getProjects } from '../lib/data'
import type { Project } from '../types/database'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
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
      setProjects(await getProjects())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
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
      await createProject({
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">Create a project and attach vendor quotes for Div 10 estimating.</p>
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
                  <th>Location</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/projects/${project.id}`}>{project.project_name}</Link>
                    </td>
                    <td>{project.customer_name ?? '—'}</td>
                    <td>{project.location ?? '—'}</td>
                    <td>{project.status}</td>
                    <td>{new Date(project.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
