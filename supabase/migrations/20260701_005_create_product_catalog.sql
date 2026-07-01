-- Shared product catalog (Bradley and future vendors). Used across all projects.

create table if not exists public.catalog_labor_families (
  id uuid primary key default gen_random_uuid(),
  labor_family_code text not null unique,
  family_name text not null,
  description text,
  supported_modifiers text,
  estimating_notes text,
  labor_source_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null,
  part_number text not null,
  description text not null,
  product_family text not null,
  labor_family_code text references public.catalog_labor_families (labor_family_code),
  labor_category_id uuid references public.labor_categories (id),
  default_unit text not null default 'EA',
  default_lead_time_days integer,
  list_unit_price numeric(12,2),
  labor_modifiers text,
  mount_type text,
  finish_material text,
  frame_type text,
  diameter_od_in numeric(10,3),
  length_in numeric(10,3),
  width_in numeric(10,3),
  height_in numeric(10,3),
  size_text text,
  color text,
  capacity text,
  operation_type text,
  design_change boolean not null default false,
  database_notes text,
  source_part_note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_name, part_number)
);

create index if not exists catalog_items_part_number_idx on public.catalog_items (part_number);
create index if not exists catalog_items_product_family_idx on public.catalog_items (product_family);
create index if not exists catalog_items_vendor_idx on public.catalog_items (vendor_name);

create table if not exists public.catalog_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null references public.catalog_items (id) on delete cascade,
  part_number text not null,
  modifier_sequence integer not null,
  modifier_code text not null,
  modifier_type text,
  app_use text,
  created_at timestamptz not null default now(),
  unique (catalog_item_id, modifier_sequence)
);

create index if not exists catalog_item_modifiers_part_number_idx
  on public.catalog_item_modifiers (part_number);

alter table public.quote_items
  add column if not exists catalog_item_id uuid references public.catalog_items (id);

create index if not exists quote_items_catalog_item_id_idx on public.quote_items (catalog_item_id);
