export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
