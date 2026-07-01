import { formatCurrency, formatDate } from '../lib/formatCurrency'
import type { ProposalDocumentData } from '../lib/proposalDocument'

interface ProposalDocumentProps {
  data: ProposalDocumentData
}

export default function ProposalDocument({ data }: ProposalDocumentProps) {
  return (
    <article className="proposal-document">
      <header className="proposal-doc-header">
        <div>
          <p className="proposal-company">Brighten Builders</p>
          <h1>{data.title}</h1>
          <p className="proposal-subtitle">Division 10 — Toilet Accessories Proposal</p>
        </div>
        <div className="proposal-doc-meta">
          <p>
            <strong>Prepared:</strong> {formatDate(data.preparedDate)}
          </p>
          <p>
            <strong>Valid through:</strong> {formatDate(data.validThroughDate)}
          </p>
          {data.quoteNumber && (
            <p>
              <strong>Reference:</strong> {data.quoteNumber}
            </p>
          )}
        </div>
      </header>

      <section className="proposal-doc-section">
        <h2>Project</h2>
        <dl className="proposal-info-grid">
          <div>
            <dt>Customer</dt>
            <dd>{data.customerName ?? '—'}</dd>
          </div>
          <div>
            <dt>Project</dt>
            <dd>{data.projectName}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{data.location ?? '—'}</dd>
          </div>
          {data.vendorName && (
            <div>
              <dt>Vendor quote</dt>
              <dd>{data.vendorName}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="proposal-doc-section">
        <h2>Scope &amp; pricing</h2>
        <div className="table-wrap">
          <table className="proposal-table">
            <thead>
              <tr>
                <th>#</th>
                {data.showPartNumbers && <th>Part #</th>}
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Material</th>
                <th>Installation</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line.lineNumber}>
                  <td>{line.lineNumber}</td>
                  {data.showPartNumbers && <td className="part-cell">{line.partNumber ?? '—'}</td>}
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>{formatCurrency(line.materialAmount)}</td>
                  <td>{formatCurrency(line.installationAmount)}</td>
                  <td>{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="proposal-doc-section proposal-summary-section">
        <h2>Proposal summary</h2>
        <dl className="proposal-summary">
          <div>
            <dt>Materials</dt>
            <dd>{formatCurrency(data.materialTotal)}</dd>
          </div>
          <div>
            <dt>Installation</dt>
            <dd>{formatCurrency(data.installationTotal)}</dd>
          </div>
          {data.markupTotal > 0 && (
            <div>
              <dt>Markup</dt>
              <dd>{formatCurrency(data.markupTotal)}</dd>
            </div>
          )}
          <div className="proposal-summary-total">
            <dt>Proposal total</dt>
            <dd>{formatCurrency(data.proposalTotal)}</dd>
          </div>
        </dl>
      </section>

      {data.scopeNotes.trim() && (
        <section className="proposal-doc-section">
          <h2>Notes</h2>
          <p className="proposal-notes">{data.scopeNotes}</p>
        </section>
      )}

      <footer className="proposal-doc-footer">
        <p>Thank you for the opportunity to bid this work.</p>
        <p className="muted">Brighten Builders · Division 10 estimating</p>
      </footer>
    </article>
  )
}
