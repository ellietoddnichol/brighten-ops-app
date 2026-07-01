-- Authenticated-only RLS for Div 10 estimator.
-- Run after enabling Supabase Auth. Sign in via the app before using database features.
-- Safe to re-run: drops any prior dev/anon policies first.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'projects',
    'vendors',
    'vendor_quotes',
    'quote_items',
    'labor_categories',
    'labor_rules',
    'estimate_versions',
    'estimate_lines'
  ]
  loop
    execute format('drop policy if exists div10_anon_all on public.%I', tbl);
    execute format('drop policy if exists div10_authenticated_all on public.%I', tbl);
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy div10_authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;
