export interface CatalogLaborFamily {
  id: string
  labor_family_code: string
  family_name: string
  description: string | null
  supported_modifiers: string | null
  estimating_notes: string | null
  labor_source_note: string | null
  created_at: string
}

export interface CatalogItem {
  id: string
  vendor_name: string
  part_number: string
  description: string
  product_family: string
  labor_family_code: string | null
  labor_category_id: string | null
  default_unit: string
  default_lead_time_days: number | null
  list_unit_price: number | null
  labor_modifiers: string | null
  mount_type: string | null
  finish_material: string | null
  frame_type: string | null
  diameter_od_in: number | null
  length_in: number | null
  width_in: number | null
  height_in: number | null
  size_text: string | null
  color: string | null
  capacity: string | null
  operation_type: string | null
  design_change: boolean
  database_notes: string | null
  source_part_note: string | null
  active: boolean
  created_at: string
  updated_at: string
  labor_categories?: { category_name: string } | null
}

export interface CatalogItemModifier {
  id: string
  catalog_item_id: string
  part_number: string
  modifier_sequence: number
  modifier_code: string
  modifier_type: string | null
  app_use: string | null
  created_at: string
}
