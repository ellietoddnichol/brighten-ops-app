-- Fix upsert targets for Bradley import (migration 011).
-- Partial unique indexes cannot be used by ON CONFLICT without a matching WHERE clause.
-- Run this BEFORE 011 if you already ran 008.

drop index if exists public.vendor_quotes_project_quote_number_idx;
drop index if exists public.quote_items_quote_part_number_idx;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vendor_quotes_project_id_quote_number_key'
  ) then
    alter table public.vendor_quotes
      add constraint vendor_quotes_project_id_quote_number_key
      unique (project_id, quote_number);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quote_items_vendor_quote_id_part_number_key'
  ) then
    alter table public.quote_items
      add constraint quote_items_vendor_quote_id_part_number_key
      unique (vendor_quote_id, part_number);
  end if;
end $$;
