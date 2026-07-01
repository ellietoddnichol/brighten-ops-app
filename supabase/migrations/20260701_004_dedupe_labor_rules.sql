-- Remove duplicate labor_rules from repeated seed runs (keeps earliest row per category + rule_name).
-- Safe to re-run: unique index prevents future duplicates.

with ranked_rules as (
  select
    id,
    row_number() over (
      partition by labor_category_id, rule_name
      order by created_at asc, id asc
    ) as rn
  from public.labor_rules
)
delete from public.labor_rules
where id in (
  select id
  from ranked_rules
  where rn > 1
);

create unique index if not exists labor_rules_unique_category_rule_name
on public.labor_rules (labor_category_id, rule_name);
