export interface Project {
  id: string
  project_name: string
  customer_name: string | null
  location: string | null
  bid_date: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  vendor_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface VendorQuote {
  id: string
  project_id: string
  vendor_id: string | null
  quote_number: string | null
  quote_date: string | null
  expiration_date: string | null
  file_path: string | null
  material_total: number | null
  shipping_total: number
  grand_total: number | null
  review_status: string
  notes: string | null
  created_at: string
  updated_at: string
  vendors?: Vendor | null
}

export interface LaborCategory {
  id: string
  category_name: string
  description: string | null
  active: boolean
  created_at: string
}

export interface LaborRule {
  id: string
  labor_category_id: string
  rule_name: string
  hours_per_unit: number
  minimum_hours: number
  difficulty_multiplier: number
  notes: string | null
  active: boolean
  created_at: string
}

export interface QuoteItem {
  id: string
  vendor_quote_id: string
  source_page: number | null
  line_number: number | null
  quantity: number
  unit: string
  part_number: string | null
  description: string
  manufacturer: string | null
  model_number: string | null
  lead_time: string | null
  unit_cost: number | null
  extended_cost: number | null
  labor_category_id: string | null
  labor_rule_id: string | null
  needs_review: boolean
  raw_text: string | null
  created_at: string
  updated_at: string
}

export interface EstimateVersion {
  id: string
  project_id: string
  version_name: string
  labor_rate: number
  material_markup_percent: number
  labor_markup_percent: number
  material_total: number
  labor_hours_total: number
  labor_cost_total: number
  markup_total: number
  estimate_total: number
  status: string
  created_at: string
}

export interface EstimateLine {
  id: string
  estimate_version_id: string
  quote_item_id: string
  labor_category_id: string | null
  labor_rule_id: string | null
  quantity: number
  material_cost: number
  hours_per_unit: number
  total_labor_hours: number
  labor_rate: number
  labor_cost: number
  markup_percent: number
  total_price: number
  created_at: string
  quote_items?: QuoteItem | null
}

export type CreateProjectInput = Pick<
  Project,
  'project_name' | 'customer_name' | 'location' | 'bid_date' | 'notes'
>

export type CreateVendorInput = Pick<
  Vendor,
  'vendor_name' | 'contact_name' | 'email' | 'phone'
>

export type CreateVendorQuoteInput = Pick<
  VendorQuote,
  'project_id' | 'vendor_id' | 'quote_number' | 'quote_date' | 'notes'
>

export type CreateQuoteItemInput = Pick<
  QuoteItem,
  | 'vendor_quote_id'
  | 'quantity'
  | 'unit'
  | 'part_number'
  | 'description'
  | 'lead_time'
  | 'unit_cost'
  | 'extended_cost'
  | 'labor_category_id'
  | 'labor_rule_id'
  | 'needs_review'
>

export type UpdateQuoteItemInput = Partial<
  Pick<
    QuoteItem,
    | 'quantity'
    | 'unit'
    | 'part_number'
    | 'description'
    | 'lead_time'
    | 'unit_cost'
    | 'extended_cost'
    | 'labor_category_id'
    | 'labor_rule_id'
    | 'needs_review'
  >
>
