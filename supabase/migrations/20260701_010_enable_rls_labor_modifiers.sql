-- RLS for labor modifier tables.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'labor_modifiers',
    'quote_item_labor_modifiers',
    'project_labor_modifiers'
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
