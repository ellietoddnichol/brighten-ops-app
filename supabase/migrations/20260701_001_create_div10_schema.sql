create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  customer_name text,
  location text,
  bid_date date,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id),
  quote_number text,
  quote_date date,
  expiration_date date,
  file_path text,
  material_total numeric(12,2),
  shipping_total numeric(12,2) not null default 0,
  grand_total numeric(12,2),
  review_status text not null default 'needs_review',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labor_categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.labor_rules (
  id uuid primary key default gen_random_uuid(),
  labor_category_id uuid not null references public.labor_categories(id) on delete cascade,
  rule_name text not null,
  hours_per_unit numeric(10,3) not null default 0,
  minimum_hours numeric(10,3) not null default 0,
  difficulty_multiplier numeric(10,3) not null default 1,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  vendor_quote_id uuid not null references public.vendor_quotes(id) on delete cascade,
  source_page integer,
  line_number integer,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'EA',
  part_number text,
  description text not null,
  manufacturer text,
  model_number text,
  lead_time text,
  unit_cost numeric(12,2),
  extended_cost numeric(12,2),
  labor_category_id uuid references public.labor_categories(id),
  labor_rule_id uuid references public.labor_rules(id),
  needs_review boolean not null default true,
  raw_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estimate_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_name text not null default 'Version 1',
  labor_rate numeric(12,2) not null default 85.00,
  material_markup_percent numeric(10,3) not null default 0,
  labor_markup_percent numeric(10,3) not null default 0,
  material_total numeric(12,2) not null default 0,
  labor_hours_total numeric(12,3) not null default 0,
  labor_cost_total numeric(12,2) not null default 0,
  markup_total numeric(12,2) not null default 0,
  estimate_total numeric(12,2) not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.estimate_lines (
  id uuid primary key default gen_random_uuid(),
  estimate_version_id uuid not null references public.estimate_versions(id) on delete cascade,
  quote_item_id uuid not null references public.quote_items(id) on delete cascade,
  labor_category_id uuid references public.labor_categories(id),
  labor_rule_id uuid references public.labor_rules(id),
  quantity numeric(12,3) not null default 1,
  material_cost numeric(12,2) not null default 0,
  hours_per_unit numeric(10,3) not null default 0,
  total_labor_hours numeric(12,3) not null default 0,
  labor_rate numeric(12,2) not null default 85.00,
  labor_cost numeric(12,2) not null default 0,
  markup_percent numeric(10,3) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
