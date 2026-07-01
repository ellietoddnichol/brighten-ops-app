import type { LaborCategory, LaborRule } from '../types/database'

interface LaborCategorySelectProps {
  categories: LaborCategory[]
  rules: LaborRule[]
  categoryId: string | null
  ruleId: string | null
  onCategoryChange: (categoryId: string | null, ruleId: string | null) => void
  disabled?: boolean
}

export default function LaborCategorySelect({
  categories,
  rules,
  categoryId,
  ruleId,
  onCategoryChange,
  disabled = false,
}: LaborCategorySelectProps) {
  const filteredRules = categoryId
    ? rules.filter((rule) => rule.labor_category_id === categoryId)
    : []

  return (
    <div className="labor-select-group">
      <select
        value={categoryId ?? ''}
        disabled={disabled}
        onChange={(event) => {
          const nextCategoryId = event.target.value || null
          const defaultRule = nextCategoryId
            ? rules.find((rule) => rule.labor_category_id === nextCategoryId) ?? null
            : null
          onCategoryChange(nextCategoryId, defaultRule?.id ?? null)
        }}
      >
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.category_name}
          </option>
        ))}
      </select>
      <select
        value={ruleId ?? ''}
        disabled={disabled || !categoryId}
        onChange={(event) => onCategoryChange(categoryId, event.target.value || null)}
      >
        <option value="">Select rule</option>
        {filteredRules.map((rule) => (
          <option key={rule.id} value={rule.id}>
            {rule.rule_name}
          </option>
        ))}
      </select>
    </div>
  )
}
