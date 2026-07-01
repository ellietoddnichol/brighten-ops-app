# Vendor quote imports

Prepare vendor quote lines in CSV format, import into Supabase, then review and estimate in the app.

## CSV template

Use the standard template:

`data/imports/templates/vendor_quote_import_template.csv`

### Required columns

| Column | Description |
|--------|-------------|
| `project_name` | Project in the app (created if missing) |
| `vendor_name` | Vendor (created if missing) |
| `quote_number` | Unique per project |
| `quote_date` | `YYYY-MM-DD` |
| `quote_expiration_date` | `YYYY-MM-DD` (optional) |
| `part_number` | Unique per quote line |
| `description` | Line description |
| `quantity` | Numeric quantity |
| `unit` | e.g. `EA` |
| `unit_price` | Material unit cost |
| `extended_price` | Line material total (qty × unit price) |
| `lead_time_days` | Optional lead time in days |
| `product_family` | Product grouping for filters |
| `labor_family` | Labor family code, e.g. `DIV10_GRAB_BAR` |
| `mounting` | Mount type (optional) |
| `size` | Size text (optional) |
| `finish` | Finish material (optional) |
| `color` | Color (optional) |
| `modifiers` | Semicolon-separated modifier codes, e.g. `MOUNT_RECESSED;FRAME_ANGLE` |
| `notes` | Line notes / raw import text |

Repeat project, vendor, and quote fields on every row (same values for the whole file).

### Bradley example data

Bradley seed files remain in `data/imports/bradley/` and are imported via the Bradley SQL migration generator:

```bash
npm run import:bradley
```

That path is unchanged. Use the generic importer for **new** vendor quotes.

## Import a quote

1. Copy the template and fill in your quote lines.
2. Set Supabase credentials in `.env.local`:
   - `VITE_SUPABASE_URL` (or `SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` (recommended for CLI import; bypasses RLS)
   - Or `VITE_SUPABASE_PUBLISHABLE_KEY` if service role is not available
3. Run the importer:

```bash
npm run import:quote -- --file data/imports/your-vendor/your-quote.csv
```

Optional overrides (use when CSV header row should not drive project/vendor/quote):

```bash
npm run import:quote -- --file path/to/quote.csv --project "Job Name" --vendor "Vendor LLC" --quote "Q-123-01"
```

The script prints a validation summary:

- project / vendor / quote created or found
- line count and material total
- counts of missing labor family, product family, unit price, extended price
- modifier links attached

## Verify in the app

1. Sign in at `/login`
2. Open **Projects** → your project
3. **Review Lines** on the imported quote
4. Confirm **Material total** on the quote summary
5. Tune **Labor Rules** if needed (`/labor-rules`)
6. **Rebuild Estimate** at your labor rate

## SQL validation

Edit the quote number at the top of:

`supabase/validation/validate_vendor_quote.sql`

Run in Supabase SQL Editor (Ctrl+A) for:

- Quote summary and material total
- Missing labor family / labor rule counts
- Modifiers missing factor
- Grouped totals by product family and labor family

Bradley-specific validation remains in `supabase/validation/validate_bradley_estimate.sql`.

## Notes

- `part_number` must be unique within a quote (database constraint).
- Unknown modifier codes are created with labor factor `1.00` so lines can be linked.
- Labor category is resolved from catalog match, labor family, or product family mapping.
- Material pricing always comes from `unit_price` / `extended_price` on quote lines, not catalog list price.
