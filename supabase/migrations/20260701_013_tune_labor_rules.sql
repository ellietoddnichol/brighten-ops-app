-- Realistic Div 10 starter labor hours by category (replaces 0.25 placeholder).
-- minimum_hours set to 0 so per-unit math is not overridden by 1.0 hr floor.

update public.labor_rules lr
set
  hours_per_unit = case lc.category_name
    when 'Grab Bars' then 0.300
    when 'Mirrors' then 0.600
    when 'Toilet Tissue Dispensers' then 0.350
    when 'Napkin Disposals' then 0.350
    when 'Towel Dispensers' then 0.350
    when 'Soap Dispensers' then 0.350
    when 'Seat Cover Dispensers' then 0.350
    when 'Towel/Waste Units' then 1.100
    when 'Baby Changing Stations' then 2.500
    when 'Shower Accessories' then 0.200
    when 'Shower Seats' then 0.350
    when 'Robe Hooks' then 0.350
    when 'Mop & Broom Holders' then 0.350
    when 'Hat & Coat Racks' then 0.350
    when 'Medicine Cabinets' then 1.500
    when 'Specimen Pass-Thru' then 1.500
    when 'General Toilet Accessories' then 0.350
    else lr.hours_per_unit
  end,
  minimum_hours = 0.000,
  notes = case lc.category_name
    when 'Grab Bars' then 'DIV10_GRAB_BAR — standard grab bar install. Use modifiers for concealed/peened/anchoring.'
    when 'Mirrors' then 'DIV10_MIRROR — standard framed mirror. Larger/frameless mirrors use modifiers.'
    when 'Toilet Tissue Dispensers' then 'DIV10_DISPENSER — surface-mounted toilet tissue dispenser.'
    when 'Napkin Disposals' then 'DIV10_DISPENSER — napkin/feminine hygiene disposal accessory.'
    when 'Towel Dispensers' then 'DIV10_DISPENSER — paper towel dispenser.'
    when 'Soap Dispensers' then 'DIV10_DISPENSER — soap/sanitizer dispenser.'
    when 'Seat Cover Dispensers' then 'DIV10_DISPENSER — seat cover dispenser.'
    when 'Towel/Waste Units' then 'DIV10_WASTE_RECEPTACLE — towel/waste combo; layout and anchoring.'
    when 'Baby Changing Stations' then 'DIV10_BABY_CHANGER — heavier unit; careful anchoring required.'
    when 'Shower Accessories' then 'DIV10_SHOWER_ACCESSORY — hooks, curtains, rods; rods may use modifiers.'
    when 'Shower Seats' then 'DIV10_SHOWER_SEAT — structural wall-mount seat.'
    when 'Robe Hooks' then 'DIV10_HOOK_SHELF — robe/door hooks.'
    when 'Mop & Broom Holders' then 'DIV10_HOOK_SHELF — mop/broom holders and utility shelves.'
    when 'Hat & Coat Racks' then 'DIV10_HOOK_SHELF — hat and coat racks.'
    when 'Medicine Cabinets' then 'DIV10_MEDICINE_CABINET — standard medicine cabinet; recessed uses modifiers.'
    when 'Specimen Pass-Thru' then 'DIV10_MEDICAL_SPECIALTY — pass-thru; rough opening coordination.'
    when 'General Toilet Accessories' then 'DIV10_GENERAL_ACCESSORY — catch-all basic Div 10 accessories.'
    else lr.notes
  end,
  active = true
from public.labor_categories lc
where lr.labor_category_id = lc.id
  and lr.rule_name like '%Standard Install%';
