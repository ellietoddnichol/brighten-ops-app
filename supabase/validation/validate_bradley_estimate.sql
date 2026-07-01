-- Bradley estimate validation (Q-234-5017-01)
-- Run in Supabase SQL Editor (Ctrl+A). Read-only checks for the estimating loop.

-- ---------------------------------------------------------------------------
-- 1. Summary metrics
-- ---------------------------------------------------------------------------
with target_quote as (
  select vq.id as vendor_quote_id, vq.quote_number, p.project_name, v.vendor_name
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
  count(qi.id) as quote_item_count,
  round(coalesce(sum(qi.extended_cost), 0)::numeric, 2) as material_total,
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
group by tq.project_name, tq.vendor_name, tq.quote_number;

-- ---------------------------------------------------------------------------
-- 2. Labor family counts
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

-- ---------------------------------------------------------------------------
-- 3. Material total by product family
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
-- 4. Spot-check sample lines (labor family + linked rule hours)
-- ---------------------------------------------------------------------------
with target_quote as (
  select vq.id as vendor_quote_id
  from public.vendor_quotes vq
  join public.projects p on p.id = vq.project_id
  where p.project_name = 'Bradley Pricing'
    and vq.quote_number = 'Q-234-5017-01'
)
select
  qi.part_number,
  qi.product_family,
  qi.labor_family_code,
  qi.quantity,
  round(coalesce(qi.extended_cost, 0)::numeric, 2) as material_total,
  lr.hours_per_unit as base_hours_per_unit,
  lr.rule_name,
  lr.active as rule_active
from target_quote tq
join public.quote_items qi on qi.vendor_quote_id = tq.vendor_quote_id
left join public.labor_rules lr on lr.id = qi.labor_rule_id
where qi.part_number in (
  '8120-001180',
  '780-024360',
  '962-00000',
  '234-11000',
  '175-00000'
)
order by qi.part_number;

-- ---------------------------------------------------------------------------
-- 5. Latest estimate version totals (after rebuild at $85/hr)
-- ---------------------------------------------------------------------------
with target_project as (
  select p.id as project_id
  from public.projects p
  where p.project_name = 'Bradley Pricing'
)
select
  ev.version_name,
  ev.labor_rate,
  round(ev.material_total::numeric, 2) as material_total,
  round(ev.labor_cost_total::numeric, 2) as labor_total,
  round(ev.estimate_total::numeric, 2) as estimate_total,
  ev.labor_hours_total,
  ev.created_at
from target_project tp
join public.estimate_versions ev on ev.project_id = tp.project_id
order by ev.created_at desc
limit 5;
