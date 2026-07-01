import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProjectWorkflowStepper from '../components/ProjectWorkflowStepper'
import WorkflowPhaseNav from '../components/WorkflowPhaseNav'
import {
  getLaborCategories,
  getLaborModifiers,
  getLaborRules,
  getProjectWorkflowStatus,
  updateLaborModifier,
  updateLaborRule,
} from '../lib/data'
import type { ProjectWorkflowStatus } from '../lib/workflow'
import type { LaborCategory, LaborRule } from '../types/database'

interface LaborModifierRow {
  id: string
  modifier_code: string
  modifier_name: string
  modifier_type: string | null
  labor_factor: number
  description: string | null
  active: boolean
}

export default function LaborRulesPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')
  const quoteId = searchParams.get('quoteId')
  const [workflow, setWorkflow] = useState<ProjectWorkflowStatus | null>(null)
  const [categories, setCategories] = useState<LaborCategory[]>([])
  const [rules, setRules] = useState<LaborRule[]>([])
  const [draftRules, setDraftRules] = useState<Record<string, Partial<LaborRule>>>({})
  const [modifiers, setModifiers] = useState<LaborModifierRow[]>([])
  const [draftModifiers, setDraftModifiers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savingModifierId, setSavingModifierId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [categoryData, ruleData, modifierData] = await Promise.all([
        getLaborCategories(),
        getLaborRules(),
        getLaborModifiers(),
      ])
      setCategories(categoryData)
      setRules(ruleData)
      setModifiers(modifierData as LaborModifierRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labor rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!projectId) {
      setWorkflow(null)
      return
    }
    void (async () => {
      setWorkflow(await getProjectWorkflowStatus(projectId, quoteId))
    })()
  }, [projectId, quoteId])

  const categoryById = new Map(categories.map((category) => [category.id, category]))

  async function handleRuleBlur(
    rule: LaborRule,
    field: 'hours_per_unit' | 'minimum_hours' | 'notes',
    rawValue: string,
  ) {
    const nextValue = field === 'notes' ? rawValue : Number(rawValue)
    const currentValue = rule[field]
    if (nextValue === currentValue) return

    setSavingId(rule.id)
    setError(null)
    try {
      const patch =
        field === 'notes'
          ? { notes: rawValue }
          : { [field]: Number(rawValue) }
      const updated = await updateLaborRule(rule.id, patch)
      setRules((current) => current.map((row) => (row.id === rule.id ? updated : row)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save labor rule')
    } finally {
      setSavingId(null)
    }
  }

  async function handleModifierBlur(modifier: LaborModifierRow, rawValue: string) {
    const nextFactor = Number(rawValue)
    if (nextFactor === modifier.labor_factor) return

    setSavingModifierId(modifier.id)
    setError(null)
    try {
      const updated = await updateLaborModifier(modifier.id, {
        labor_factor: nextFactor,
      })
      setModifiers((current) =>
        current.map((row) => (row.id === modifier.id ? (updated as LaborModifierRow) : row)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save modifier')
    } finally {
      setSavingModifierId(null)
    }
  }

  const tunedModifiers = modifiers.filter((modifier) =>
    [
      'MOUNT_RECESSED',
      'MOUNT_SEMI_RECESSED',
      'MOUNT_SURFACE',
      'MOUNT_CONCEALED',
      'TEXTURE_PEENED',
      'FRAME_FRAMELESS',
      'HEAVY_OR_STRUCTURAL_ANCHORING',
      'FINISH_STAINLESS',
    ].includes(modifier.modifier_code),
  )

  return (
    <div className="page">
      {workflow && projectId && (
        <ProjectWorkflowStepper
          projectId={projectId}
          quoteId={quoteId}
          currentPhase="labor"
          status={workflow}
        />
      )}

      <header className="page-header">
        <div>
          {workflow ? (
            <p className="breadcrumb">
              <Link to={`/projects/${projectId}`}>{workflow.projectName}</Link> / Labor Rules
            </p>
          ) : null}
          <h1>{workflow ? 'Phase 3 — Labor Rules' : 'Labor Rules'}</h1>
          <p className="muted">
            Base hours per labor category. Item modifiers adjust special install conditions on each
            quote line. Rebuild estimate after changes.
          </p>
        </div>
        {projectId && quoteId && (
          <Link
            className="button-link"
            to={`/projects/${projectId}/estimate?quoteId=${quoteId}`}
          >
            Rebuild Estimate →
          </Link>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading labor rules…</p>
      ) : (
        <>
          <section className="card">
            <h2>Category base rules</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Labor category</th>
                    <th>Rule</th>
                    <th>Hours / unit</th>
                    <th>Min hours</th>
                    <th>Active</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{categoryById.get(rule.labor_category_id)?.category_name ?? '—'}</td>
                      <td>{rule.rule_name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={draftRules[rule.id]?.hours_per_unit ?? rule.hours_per_unit}
                          disabled={savingId === rule.id}
                          onChange={(event) =>
                            setDraftRules((current) => ({
                              ...current,
                              [rule.id]: { ...current[rule.id], hours_per_unit: Number(event.target.value) },
                            }))
                          }
                          onBlur={(event) =>
                            void handleRuleBlur(rule, 'hours_per_unit', event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={draftRules[rule.id]?.minimum_hours ?? rule.minimum_hours}
                          disabled={savingId === rule.id}
                          onChange={(event) =>
                            setDraftRules((current) => ({
                              ...current,
                              [rule.id]: { ...current[rule.id], minimum_hours: Number(event.target.value) },
                            }))
                          }
                          onBlur={(event) =>
                            void handleRuleBlur(rule, 'minimum_hours', event.target.value)
                          }
                        />
                      </td>
                      <td>{rule.active ? 'Yes' : 'No'}</td>
                      <td>
                        <input
                          type="text"
                          value={draftRules[rule.id]?.notes ?? rule.notes ?? ''}
                          disabled={savingId === rule.id}
                          onChange={(event) =>
                            setDraftRules((current) => ({
                              ...current,
                              [rule.id]: { ...current[rule.id], notes: event.target.value },
                            }))
                          }
                          onBlur={(event) => void handleRuleBlur(rule, 'notes', event.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Key item modifiers</h2>
            <p className="muted">
              Factors multiply together per quote line. Material is never affected — labor only.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Labor factor</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tunedModifiers.map((modifier) => (
                    <tr key={modifier.id}>
                      <td className="part-cell">{modifier.modifier_code}</td>
                      <td>{modifier.modifier_name}</td>
                      <td>{modifier.modifier_type ?? '—'}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draftModifiers[modifier.id] ?? modifier.labor_factor}
                          disabled={savingModifierId === modifier.id}
                          onChange={(event) =>
                            setDraftModifiers((current) => ({
                              ...current,
                              [modifier.id]: event.target.value,
                            }))
                          }
                          onBlur={(event) => void handleModifierBlur(modifier, event.target.value)}
                        />
                      </td>
                      <td>{modifier.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {projectId && (
            <WorkflowPhaseNav
              projectId={projectId}
              quoteId={quoteId}
              currentPhase="labor"
              nextLabel="Rebuild Estimate →"
            />
          )}
        </>
      )}
    </div>
  )
}
