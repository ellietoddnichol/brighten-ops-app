import type { QuoteItem } from '../types/database'
import { sumMaterialCost } from '../lib/estimateMath'

interface QuoteReadinessCardProps {
  items: QuoteItem[]
  quoteNumber?: string | null
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? 'checklist-pass' : 'checklist-fail'}>
      {ok ? '✓' : '○'} {label}
    </li>
  )
}

export default function QuoteReadinessCard({ items, quoteNumber }: QuoteReadinessCardProps) {
  const lineCount = items.length
  const needsReviewCount = items.filter((item) => item.needs_review).length
  const missingLaborCount = items.filter((item) => !item.labor_category_id).length
  const materialTotal = sumMaterialCost(items)
  const ready = lineCount > 0 && needsReviewCount === 0 && missingLaborCount === 0

  return (
    <section className="card checklist-card">
      <h2>Quote readiness</h2>
      <p className="muted">
        {quoteNumber ? `Quote #${quoteNumber} · ` : ''}
        Complete these checks before building the estimate.
      </p>
      <ul className="checklist">
        <CheckItem ok={lineCount > 0} label={`Quote has lines (${lineCount})`} />
        <CheckItem
          ok={missingLaborCount === 0}
          label={
            missingLaborCount === 0
              ? 'Labor category assigned on all lines'
              : `${missingLaborCount} line(s) missing labor category`
          }
        />
        <CheckItem
          ok={needsReviewCount === 0}
          label={
            needsReviewCount === 0
              ? 'No lines flagged for review'
              : `${needsReviewCount} line(s) still need review`
          }
        />
        <CheckItem
          ok={materialTotal > 0}
          label={`Material total $${materialTotal.toFixed(2)}`}
        />
      </ul>
      {ready ? (
        <p className="checklist-ready">Ready for labor rules and estimate build.</p>
      ) : (
        <p className="muted">Finish line review, then continue to Labor Rules or Estimate.</p>
      )}
    </section>
  )
}
