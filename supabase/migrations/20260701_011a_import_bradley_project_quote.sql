-- Bradley import part A: project, vendor, quote.
-- IMPORTANT: Ctrl+A to select ALL, then Run.
-- Run after 008, 009, 010, 012.

insert into public.projects (project_name, customer_name, status, notes)
select 'Bradley Pricing', 'CWA Specialties Inc', 'active', 'Contact: Latina Randolph'
where not exists (select 1 from public.projects where project_name = 'Bradley Pricing');

update public.projects
set customer_name = 'CWA Specialties Inc', status = 'active', notes = 'Contact: Latina Randolph', updated_at = now()
where project_name = 'Bradley Pricing';

insert into public.vendors (vendor_name)
values ('Bradley Company, LLC')
on conflict (vendor_name) do nothing;

insert into public.vendor_quotes (
  project_id, vendor_id, quote_number, quote_date, expiration_date,
  shipping_total, material_total, grand_total, review_status, notes
)
select
  p.id,
  v.id,
  'Q-234-5017-01',
  '2026-06-24'::date,
  '2026-09-22'::date,
  0,
  9246.8,
  9246.8,
  'imported',
  'Imported from Bradley_Items_Database_Import.csv'
from public.projects p
cross join public.vendors v
where p.project_name = 'Bradley Pricing'
  and v.vendor_name = 'Bradley Company, LLC'
on conflict (project_id, quote_number) do update set
  quote_date = excluded.quote_date,
  expiration_date = excluded.expiration_date,
  shipping_total = excluded.shipping_total,
  material_total = excluded.material_total,
  grand_total = excluded.grand_total,
  review_status = excluded.review_status,
  notes = excluded.notes,
  updated_at = now();
