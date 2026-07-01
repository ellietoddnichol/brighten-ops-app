-- Bradley catalog: labor families (part 1 of 3). Run after 005.
-- Regenerate: python scripts/generate_bradley_catalog_seed.py

insert into public.catalog_labor_families (
  labor_family_code, family_name, description, supported_modifiers, estimating_notes, labor_source_note
)
values
  ('DIV10_GRAB_BAR', 'Grab Bar', 'Base family for grab bars', 'concealed/peened/OD/length/design change', 'Verify blocking, substrate, and ADA height/clearance before install.', 'Vendor quote does not include labor.'),
  ('DIV10_MIRROR', 'Mirror', 'Base family for restroom mirrors', 'frame type/size', 'Verify backing, mounting hardware, and mounting height.', 'Vendor quote does not include labor.'),
  ('DIV10_DISPENSER', 'Dispenser', 'General restroom dispenser install', 'surface/recessed/sensor/automatic/capacity', 'Use for toilet tissue, towel, soap, seat cover, napkin disposal, and similar dispensers.', 'Vendor quote does not include labor.'),
  ('DIV10_RECESSED_DISPENSER', 'Recessed Dispenser / Vendor', 'Recessed specialty dispenser install', 'recessed/coin vendor/rough opening', 'Requires rough opening/wall-depth check.', 'Vendor quote does not include labor.'),
  ('DIV10_TOWEL_WASTE', 'Towel/Waste Combination Unit', 'Combination towel and waste unit', 'surface/recessed/semi-recessed/12 gal', 'Recessed units need rough opening check; surface units use wall accessory install.', 'Vendor quote does not include labor.'),
  ('DIV10_BABY_CHANGER', 'Baby Changing Station', 'Baby changing station install', 'surface/recessed/material/color/heavy anchoring', 'Use heavier labor/anchoring modifier; verify blocking and ADA clearances.', 'Vendor quote does not include labor.'),
  ('DIV10_SHOWER_SEAT', 'Shower Seat', 'Shower safety seat install', 'structural anchoring/material/reversible', 'Safety/structural anchorage item; verify backing.', 'Vendor quote does not include labor.'),
  ('DIV10_SHOWER_CURTAIN', 'Shower Curtain / Rod / Hook', 'Shower curtain, rod, and hook work', 'rod length/OD/hook type/curtain size', 'Bundle small curtain/hook items with rod installation if estimating labor.', 'Vendor quote does not include labor.'),
  ('DIV10_WALL_ACCESSORY', 'Wall Accessory', 'General wall accessory install', 'surface mount/finish/hook type', 'Towel bars, robe hooks, coat racks.', 'Vendor quote does not include labor.'),
  ('DIV10_CUSTODIAL_ACCESSORY', 'Custodial Accessory', 'Mop/broom and utility shelf install', 'utility shelf/mop broom holder', 'Verify blocking due to shelf/holder loading.', 'Vendor quote does not include labor.'),
  ('DIV10_MEDICAL_SPECIALTY', 'Medical Specialty', 'Medical specialty install', 'pass-thru/stainless/rough opening', 'Likely rough opening/coordination required.', 'Vendor quote does not include labor.'),
  ('DIV10_MEDICINE_CABINET', 'Medicine Cabinet', 'Medicine cabinet install', 'recessed/semi-recessed/surface/finish', 'Recessed/semi-recessed requires rough opening check.', 'Vendor quote does not include labor.')
on conflict (labor_family_code) do update set
  family_name = excluded.family_name,
  description = excluded.description,
  supported_modifiers = excluded.supported_modifiers,
  estimating_notes = excluded.estimating_notes,
  labor_source_note = excluded.labor_source_note;
