-- Quote line classification fields + labor modifier tables.

alter table public.quote_items
  add column if not exists product_family text,
  add column if not exists labor_family_code text,
  add column if not exists mount_type text,
  add column if not exists finish_material text,
  add column if not exists size_text text,
  add column if not exists color text,
  add column if not exists catalog_match_status text;

alter table public.estimate_lines
  add column if not exists modifier_factor numeric(10,3) not null default 1.000,
  add column if not exists labor_family_code text;

create table if not exists public.labor_modifiers (
  id uuid primary key default gen_random_uuid(),
  modifier_code text not null unique,
  modifier_name text not null,
  modifier_type text,
  labor_factor numeric(10,3) not null default 1.000,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_item_labor_modifiers (
  id uuid primary key default gen_random_uuid(),
  quote_item_id uuid not null references public.quote_items (id) on delete cascade,
  labor_modifier_id uuid not null references public.labor_modifiers (id) on delete cascade,
  factor_override numeric(10,3),
  created_at timestamptz not null default now(),
  unique (quote_item_id, labor_modifier_id)
);

create table if not exists public.project_labor_modifiers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  labor_modifier_id uuid not null references public.labor_modifiers (id) on delete cascade,
  factor_override numeric(10,3),
  notes text,
  created_at timestamptz not null default now(),
  unique (project_id, labor_modifier_id)
);

-- Full unique constraints required for ON CONFLICT upserts in migration 011.
alter table public.vendor_quotes
  drop constraint if exists vendor_quotes_project_id_quote_number_key;
alter table public.vendor_quotes
  add constraint vendor_quotes_project_id_quote_number_key unique (project_id, quote_number);

alter table public.quote_items
  drop constraint if exists quote_items_vendor_quote_id_part_number_key;
alter table public.quote_items
  add constraint quote_items_vendor_quote_id_part_number_key unique (vendor_quote_id, part_number);

drop index if exists public.vendor_quotes_project_quote_number_idx;
drop index if exists public.quote_items_quote_part_number_idx;

create index if not exists quote_items_labor_family_idx on public.quote_items (labor_family_code);
create index if not exists quote_items_product_family_idx on public.quote_items (product_family);
