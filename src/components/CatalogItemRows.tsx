import type { CatalogItem } from '../types/catalog'
import { formatFinish, formatMount, formatSize } from '../lib/catalogOrganize'

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface CatalogItemRowsProps {
  items: CatalogItem[]
  showAdd?: boolean
  addingId?: string | null
  onAdd?: (item: CatalogItem) => void
}

export default function CatalogItemRows({
  items,
  showAdd = false,
  addingId = null,
  onAdd,
}: CatalogItemRowsProps) {
  return (
    <table className="data-table catalog-items-table">
      <thead>
        <tr>
          <th>Part #</th>
          <th>Description</th>
          <th>Mounting</th>
          <th>Dimensions</th>
          <th>Finish / color</th>
          <th>Labor</th>
          <th>List price</th>
          {showAdd && <th />}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="part-cell">{item.part_number}</td>
            <td>{item.description}</td>
            <td>{formatMount(item)}</td>
            <td>{formatSize(item) ?? '—'}</td>
            <td>{formatFinish(item)}</td>
            <td>{item.labor_categories?.category_name ?? '—'}</td>
            <td>{formatCurrency(item.list_unit_price)}</td>
            {showAdd && onAdd && (
              <td>
                <button
                  type="button"
                  disabled={addingId === item.id}
                  onClick={() => onAdd(item)}
                >
                  {addingId === item.id ? 'Adding…' : 'Add Line'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
