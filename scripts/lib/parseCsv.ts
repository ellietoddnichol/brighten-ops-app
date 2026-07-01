export function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || (char === '\r' && next === '\n')) {
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row)
      }
      row = []
      if (char === '\r') i += 1
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) {
      rows.push(row)
    }
  }

  if (rows.length === 0) return []

  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim()
    })
    return record
  })
}

export function parseModifierList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(';')
    .map((code) => code.trim())
    .filter(Boolean)
}

export function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const parsed = Number(value.replace(/[$,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseOptionalDate(value: string | undefined): string | null {
  if (!value?.trim()) return null
  return value.trim()
}
