import { useEffect, useState } from 'react'
import { getLaborCategories, getLaborRules } from '../lib/data'
import type { LaborCategory, LaborRule } from '../types/database'

export default function LaborRulesPage() {
  const [categories, setCategories] = useState<LaborCategory[]>([])
  const [rules, setRules] = useState<LaborRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [categoryData, ruleData] = await Promise.all([getLaborCategories(), getLaborRules()])
        setCategories(categoryData)
        setRules(ruleData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load labor rules')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const rulesByCategory = new Map<string, LaborRule[]>()
  for (const rule of rules) {
    const list = rulesByCategory.get(rule.labor_category_id) ?? []
    list.push(rule)
    rulesByCategory.set(rule.labor_category_id, list)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Labor Rules</h1>
          <p className="muted">
            Div 10 labor categories and install assumptions. Update values in Supabase once Brighten
            standards are finalized.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading labor rules…</p>
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Rule</th>
                  <th>Hours / Unit</th>
                  <th>Minimum Hours</th>
                  <th>Difficulty</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {categories.flatMap((category) => {
                  const categoryRules = rulesByCategory.get(category.id) ?? []
                  if (categoryRules.length === 0) {
                    return (
                      <tr key={category.id}>
                        <td>{category.category_name}</td>
                        <td colSpan={5} className="muted">
                          No rules
                        </td>
                      </tr>
                    )
                  }

                  return categoryRules.map((rule, index) => (
                    <tr key={rule.id}>
                      {index === 0 ? (
                        <td rowSpan={categoryRules.length}>{category.category_name}</td>
                      ) : null}
                      <td>{rule.rule_name}</td>
                      <td>{rule.hours_per_unit.toFixed(3)}</td>
                      <td>{rule.minimum_hours.toFixed(3)}</td>
                      <td>{rule.difficulty_multiplier.toFixed(3)}</td>
                      <td>{rule.notes ?? '—'}</td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
