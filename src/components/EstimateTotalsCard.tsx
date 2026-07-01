import type { EstimateVersion } from '../types/database'

interface EstimateTotalsCardProps {
  estimate: Pick<
    EstimateVersion,
    | 'material_total'
    | 'labor_hours_total'
    | 'labor_cost_total'
    | 'markup_total'
    | 'estimate_total'
    | 'labor_rate'
    | 'material_markup_percent'
    | 'labor_markup_percent'
  >
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function EstimateTotalsCard({ estimate }: EstimateTotalsCardProps) {
  return (
    <section className="card estimate-totals-card">
      <h2>Estimate Totals</h2>
      <dl className="totals-grid">
        <div>
          <dt>Material</dt>
          <dd>{formatCurrency(estimate.material_total)}</dd>
        </div>
        <div>
          <dt>Labor Hours</dt>
          <dd>{estimate.labor_hours_total.toFixed(3)}</dd>
        </div>
        <div>
          <dt>Labor Cost</dt>
          <dd>{formatCurrency(estimate.labor_cost_total)}</dd>
        </div>
        <div>
          <dt>Markup</dt>
          <dd>{formatCurrency(estimate.markup_total)}</dd>
        </div>
        <div className="totals-grand">
          <dt>Total Estimate</dt>
          <dd>{formatCurrency(estimate.estimate_total)}</dd>
        </div>
      </dl>
      <p className="muted">
        Labor rate: {formatCurrency(estimate.labor_rate)}/hr · Material markup:{' '}
        {estimate.material_markup_percent}% · Labor markup: {estimate.labor_markup_percent}%
      </p>
    </section>
  )
}
