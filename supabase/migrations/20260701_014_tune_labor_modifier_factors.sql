-- Tune starter labor modifier factors (item-level). Safe to re-run.

update public.labor_modifiers set labor_factor = 1.350, description = 'Recessed items — more layout/cutting/coordination.' where modifier_code = 'MOUNT_RECESSED';
update public.labor_modifiers set labor_factor = 1.200, description = 'Semi-recessed — more than surface, less than fully recessed.' where modifier_code = 'MOUNT_SEMI_RECESSED';
update public.labor_modifiers set labor_factor = 1.000, description = 'Surface mount — no labor increase.' where modifier_code = 'MOUNT_SURFACE';
update public.labor_modifiers set labor_factor = 1.100, description = 'Concealed fasteners/design-change grab bars take slightly longer.' where modifier_code = 'MOUNT_CONCEALED';
update public.labor_modifiers set labor_factor = 1.050, description = 'Peened grab bars — small handling/layout bump.' where modifier_code = 'TEXTURE_PEENED';
update public.labor_modifiers set labor_factor = 1.150, description = 'Frameless mirrors — careful handling/alignment.' where modifier_code = 'FRAME_FRAMELESS';
update public.labor_modifiers set labor_factor = 1.250, description = 'Heavier/larger items — more handling/anchoring.' where modifier_code = 'HEAVY_OR_STRUCTURAL_ANCHORING';
update public.labor_modifiers set labor_factor = 1.000, description = 'Stainless finish captured; no default labor increase.' where modifier_code = 'FINISH_STAINLESS';

insert into public.labor_modifiers (modifier_code, modifier_name, modifier_type, labor_factor, description)
values
  ('CONCEALED', 'Concealed', 'mount', 1.100, 'Alias for concealed mount modifier.'),
  ('PEENED', 'Peened', 'general', 1.050, 'Alias for peened texture modifier.'),
  ('FRAMELESS', 'Frameless', 'frame', 1.150, 'Alias for frameless mirror modifier.'),
  ('LARGE_OR_HEAVY', 'Large Or Heavy', 'general', 1.250, 'Alias for heavy/structural anchoring modifier.')
on conflict (modifier_code) do update set
  labor_factor = excluded.labor_factor,
  description = excluded.description;
