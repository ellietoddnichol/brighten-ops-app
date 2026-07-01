insert into public.labor_categories (category_name, description)
values
  ('Grab Bars', 'Restroom grab bars and similar mounted safety accessories'),
  ('Mirrors', 'Framed, frameless, and channel frame mirrors'),
  ('Toilet Tissue Dispensers', 'Single and dual toilet tissue dispensers'),
  ('Napkin Disposals', 'Napkin disposal units and covers'),
  ('Towel Dispensers', 'Paper towel dispensers'),
  ('Towel/Waste Units', 'Combination towel and waste units'),
  ('Soap Dispensers', 'Manual and automatic soap dispensers'),
  ('Seat Cover Dispensers', 'Surface-mounted seat cover dispensers'),
  ('Baby Changing Stations', 'Surface-mounted and recessed baby changing stations'),
  ('Shower Seats', 'Wall-mounted shower seats'),
  ('Shower Accessories', 'Shower curtains, rods, hooks, and related accessories'),
  ('Robe Hooks', 'Single, double, and bumper hooks'),
  ('Mop & Broom Holders', 'Mop holders, broom holders, and utility shelves'),
  ('Hat & Coat Racks', 'Wall-mounted hat and coat racks'),
  ('Specimen Pass-Thru', 'Specimen pass-through cabinets'),
  ('Medicine Cabinets', 'Surface, recessed, and semi-recessed medicine cabinets'),
  ('General Toilet Accessories', 'Miscellaneous restroom accessories')
on conflict (category_name) do nothing;

insert into public.labor_rules (
  labor_category_id,
  rule_name,
  hours_per_unit,
  minimum_hours,
  difficulty_multiplier,
  notes
)
select
  id,
  category_name || ' - Standard Install',
  0.250,
  1.000,
  1.000,
  'Starter rule. Replace with Brighten actual labor assumptions.'
from public.labor_categories
where active = true;
