import type { EstimateAuditResult, BradleySpotCheck } from '../lib/estimateAudit'

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface BradleyEstimateValidationProps {
  audit: EstimateAuditResult
  spotChecks: BradleySpotCheck[]
}

function AuditRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={warn ? 'audit-row audit-row-warn' : 'audit-row'}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function BradleyEstimateValidation({
  audit,
  spotChecks,
}: BradleyEstimateValidationProps) {
  const spotChecksPassed = spotChecks.every((check) => check.passed)
  const allClear = audit.warnings.length === 0 && spotChecksPassed

  return (
    <section className="card estimate-validation-card">
      <h2>Bradley Estimate Validation</h2>
      <p className="muted">
        Audit check for quote Q-234-5017-01 — confirms the full estimating loop without changing
        estimate math.
      </p>

      <dl className="audit-grid">
        <AuditRow label="Quote number" value={audit.quoteNumber ?? '—'} />
        <AuditRow
          label="Quote item count"
          value={String(audit.quoteItemCount)}
          warn={audit.warnings.some((warning) => warning.includes('Quote item count'))}
        />
        <AuditRow
          label="Material total"
          value={formatCurrency(audit.materialTotal)}
          warn={audit.warnings.some((warning) => warning.includes('Material total'))}
        />
        <AuditRow label="Labor total" value={formatCurrency(audit.laborTotal)} />
        <AuditRow label="Labor hours" value={audit.laborHoursTotal.toFixed(3)} />
        <AuditRow label="Estimate total" value={formatCurrency(audit.estimateTotal)} />
        <AuditRow label="Labor rate used" value={`${formatCurrency(audit.laborRate)}/hr`} />
      </dl>

      {audit.warnings.length > 0 && (
        <div className="alert alert-error audit-warnings">
          <strong>Warnings</strong>
          <ul>
            {audit.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {allClear && (
        <div className="alert alert-info">Bradley audit passed — estimating loop looks correct.</div>
      )}

      <h3>Spot checks</h3>
      <p className="muted">Highlighted rows in the estimate table below match these samples.</p>
      <ul className="checklist spot-check-list">
        {spotChecks.map((check) => (
          <li key={check.partNumber} className={check.passed ? 'checklist-pass' : 'checklist-fail'}>
            <strong>{check.label}</strong> ({check.partNumber}): {check.detail}
          </li>
        ))}
      </ul>

      {audit.laborTotal === 0 && audit.quoteItemCount > 0 && (
        <p className="muted">Rebuild estimate to populate labor totals for this audit.</p>
      )}
    </section>
  )
}
