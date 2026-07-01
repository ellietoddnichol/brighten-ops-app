import type { EstimateLine } from '../types/database'

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface EstimateLinesTableProps {
  lines: EstimateLine[]
  highlightPartNumbers?: Set<string>
}

export default function EstimateLinesTable({
  lines,
  highlightPartNumbers,
}: EstimateLinesTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table estimate-lines-table">
        <thead>
          <tr>
            <th>Part #</th>
            <th>Description</th>
            <th>Product family</th>
            <th>Labor family</th>
            <th>Qty</th>
            <th>Material</th>
            <th>Base hr/unit</th>
            <th>Mod factor</th>
            <th>Labor hrs</th>
            <th>Labor $</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const partNumber = line.quote_items?.part_number ?? '—'
            const isSpotCheck =
              partNumber !== '—' && highlightPartNumbers?.has(partNumber)

            return (
              <tr
                key={line.id}
                className={isSpotCheck ? 'estimate-line-spotcheck' : undefined}
              >
                <td className="part-cell">{partNumber}</td>
                <td>{line.quote_items?.description ?? line.quote_item_id}</td>
                <td>{line.quote_items?.product_family ?? '—'}</td>
                <td>{line.labor_family_code ?? '—'}</td>
                <td>{line.quantity}</td>
                <td>{formatCurrency(line.material_cost)}</td>
                <td>{line.hours_per_unit.toFixed(3)}</td>
                <td>{line.modifier_factor.toFixed(3)}</td>
                <td>{line.total_labor_hours.toFixed(3)}</td>
                <td>{formatCurrency(line.labor_cost)}</td>
                <td>{formatCurrency(line.total_price)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
