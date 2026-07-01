import { useEffect, useState } from 'react'
import { getBradleyMilestoneStatus, type BradleyMilestoneStatus } from '../lib/data'

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? 'checklist-pass' : 'checklist-fail'}>
      {ok ? '✓' : '○'} {label}
    </li>
  )
}

export default function BradleyMilestoneChecklist() {
  const [status, setStatus] = useState<BradleyMilestoneStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        setStatus(await getBradleyMilestoneStatus())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <p className="muted">Checking Bradley milestone…</p>
  }

  if (!status) return null

  return (
    <section className="card checklist-card">
      <h2>Bradley Milestone Checklist</h2>
      <ul className="checklist">
        <CheckItem ok={status.projectExists} label="Bradley Pricing project exists" />
        <CheckItem ok={status.vendorExists} label="Bradley Company, LLC vendor exists" />
        <CheckItem ok={status.quoteExists} label="Quote Q-234-5017-01 exists" />
        <CheckItem ok={status.lineCount === 65} label={`65 quote lines imported (${status.lineCount})`} />
        <CheckItem
          ok={status.materialMatches}
          label={`Material total $${status.materialTotal.toFixed(2)} (expected $${status.expectedMaterialTotal.toFixed(2)})`}
        />
      </ul>
      {status.materialMatches && status.lineCount === 65 && (
        <p className="muted">Ready to build estimate with labor rate $85/hr.</p>
      )}
    </section>
  )
}
