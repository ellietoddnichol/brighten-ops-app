-- RLS for shared product catalog tables.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'catalog_labor_families',
    'catalog_items',
    'catalog_item_modifiers'
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
