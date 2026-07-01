# Bradley Pricing milestone

## 1. Run new Supabase migrations (SQL Editor, Ctrl+A each file)

In order, after migrations 005–007:

1. `supabase/migrations/20260701_008_quote_labor_modifiers.sql`
2. `supabase/migrations/20260701_009_seed_labor_modifiers.sql`
3. `supabase/migrations/20260701_010_enable_rls_labor_modifiers.sql`
4. `supabase/migrations/20260701_012_fix_upsert_constraints.sql` — **required before import**
5. `supabase/migrations/20260701_011a_import_bradley_project_quote.sql`
6. `supabase/migrations/20260701_011b_import_bradley_quote_items.sql`
7. `supabase/migrations/20260701_011c_import_bradley_quote_modifiers.sql`
8. `supabase/migrations/20260701_013_tune_labor_rules.sql`
9. `supabase/migrations/20260701_014_tune_labor_modifier_factors.sql`

Each file is short — still use **Ctrl+A** before Run. Do not run partial selections.

After tuning labor, use **Rebuild Estimate** on Bradley Pricing to refresh labor totals.

Run `supabase/validation/validate_bradley_estimate.sql` in the SQL Editor to audit quote data and latest estimate totals.

## 5. Bradley estimate validation (app)

On **Bradley Pricing → Phase 4 Estimate** with quote `Q-234-5017-01`:

1. Rebuild at labor rate **$85/hr**
2. Review the **Bradley Estimate Validation** card (quote count, material, labor, warnings)
3. Confirm spot checks pass for grab bar, mirror, baby changer, towel/waste, medicine cabinet
4. Highlighted rows in **Estimate Lines** show part #, product family, labor math per line

To regenerate 009 + 011 from CSVs:

```bash
npm run import:bradley
```

## 2. Verify in Supabase

The last lines of migration 011 print counts. Expect:

- `quote_items`: 65
- `material_total`: 9246.8

## 3. Test in the app

1. Sign in at http://localhost:5173/login
2. Open **Projects** → **Bradley Pricing**
3. Click **Review Lines** on quote `Q-234-5017-01`
4. Confirm checklist shows all green checks
5. Confirm **Material total: $9,246.80**
6. Click **Build Estimate** → labor rate `85` → **Build Estimate**

## 4. Tune labor next

- **Labor Rules** (`/labor-rules`) — adjust hours/unit per category
- **labor_modifiers** table — adjust `labor_factor` per modifier code (Supabase table editor for now)

Material always comes from quote line `unit_cost` / `extended_cost`, not catalog list price.
