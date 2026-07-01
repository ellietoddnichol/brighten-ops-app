-- Generic vendor quote validation
-- Edit project_name and quote_number in each query below, then run in Supabase SQL Editor (Ctrl+A).

-- ---------------------------------------------------------------------------
-- 1. Quote summary
-- ---------------------------------------------------------------------------
with target_quote as (
  select
    vq.id as vendor_quote_id,
    p.project_name,
    v.vendor_name,
    vq.quote_number,
    vq.quote_date,
    vq.expiration_date,
    vq.material_total as quote_material_total
  from public.vendor_quotes vq
  join public.projects p on p.id = vq.project_id
  left join public.vendors v on v.id = vq.vendor_id
  where p.project_name = 'Bradley Pricing'
    and vq.quote_number = 'Q-234-5017-01'
)
select
  tq.project_name,
  tq.vendor_name,
  tq.quote_number,
  tq.quote_date,
  tq.expiration_date,
  count(qi.id) as quote_item_count,
  round(coalesce(sum(qi.extended_cost), 0)::numeric, 2) as material_total_from_lines,
  round(coalesce(tq.quote_material_total, 0)::numeric, 2) as material_total_on_quote,
  count(*) filter (where qi.labor_family_code is null) as lines_missing_labor_family,
  count(*) filter (where qi.labor_rule_id is null) as lines_missing_labor_rule,
  count(qilm.id) filter (
    where qilm.id is not null
      and coalesce(qilm.factor_override, lm.labor_factor) is null
  ) as attached_modifiers_missing_factor
from target_quote tq
left join public.quote_items qi on qi.vendor_quote_id = tq.vendor_quote_id
left join public.quote_item_labor_modifiers qilm on qilm.quote_item_id = qi.id
left join public.labor_modifiers lm on lm.id = qilm.labor_modifier_id
group by
  tq.project_name,
  tq.vendor_name,
  tq.quote_number,
  tq.quote_date,
  tq.expiration_date,
  tq.quote_material_total;

-- ---------------------------------------------------------------------------
-- 2. Product family totals
-- ---------------------------------------------------------------------------
with target_quote as (
  select vq.id as vendor_quote_id
  from public.vendor_quotes vq
  join public.projects p on p.id = vq.project_id
  where p.project_name = 'Bradley Pricing'
    and vq.quote_number = 'Q-234-5017-01'
)
select
  coalesce(qi.product_family, '(missing)') as product_family,
  count(*) as line_count,
  round(coalesce(sum(qi.extended_cost), 0)::numeric, 2) as material_total
from target_quote tq
join public.quote_items qi on qi.vendor_quote_id = tq.vendor_quote_id
group by coalesce(qi.product_family, '(missing)')
order by material_total desc, product_family;

-- ---------------------------------------------------------------------------
-- 3. Labor family totals
-- ---------------------------------------------------------------------------
with target_quote as (
  select vq.id as vendor_quote_id
  from public.vendor_quotes vq
  join public.projects p on p.id = vq.project_id
  where p.project_name = 'Bradley Pricing'
    and vq.quote_number = 'Q-234-5017-01'
)
select
  coalesce(qi.labor_family_code, '(missing)') as labor_family_code,
  count(*) as line_count,
  round(coalesce(sum(qi.extended_cost), 0)::numeric, 2) as material_total
from target_quote tq
join public.quote_items qi on qi.vendor_quote_id = tq.vendor_quote_id
group by coalesce(qi.labor_family_code, '(missing)')
order by line_count desc, labor_family_code;
