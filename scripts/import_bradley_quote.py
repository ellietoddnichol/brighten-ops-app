"""Generate labor modifier seed + compact Bradley Pricing quote import SQL."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ITEMS_CSV = ROOT / "data" / "imports" / "bradley" / "Bradley_Items_Database_Import.csv"
MODS_CSV = ROOT / "data" / "imports" / "bradley" / "Bradley_Item_Modifiers.csv"
OUT_MODIFIERS = ROOT / "supabase" / "migrations" / "20260701_009_seed_labor_modifiers.sql"
OUT_IMPORT_A = ROOT / "supabase" / "migrations" / "20260701_011a_import_bradley_project_quote.sql"
OUT_IMPORT_B = ROOT / "supabase" / "migrations" / "20260701_011b_import_bradley_quote_items.sql"
OUT_IMPORT_C = ROOT / "supabase" / "migrations" / "20260701_011c_import_bradley_quote_modifiers.sql"
LEGACY_IMPORT = ROOT / "supabase" / "migrations" / "20260701_011_import_bradley_pricing_quote.sql"

PRODUCT_TO_CATEGORY = {
    "Grab Bar": "Grab Bars",
    "Mirror": "Mirrors",
    "Toilet Tissue Dispenser": "Toilet Tissue Dispensers",
    "Feminine Hygiene Disposal": "Napkin Disposals",
    "Towel Dispenser": "Towel Dispensers",
    "Towel/Waste Combination Unit": "Towel/Waste Units",
    "Soap / Sanitizer Dispenser": "Soap Dispensers",
    "Seat Cover Dispenser": "Seat Cover Dispensers",
    "Napkin/Tampon Vendor": "General Toilet Accessories",
    "Baby Changing Station": "Baby Changing Stations",
    "Shower Seat": "Shower Seats",
    "Shower Curtain": "Shower Accessories",
    "Shower Rod": "Shower Accessories",
    "Shower Curtain Hook": "Shower Accessories",
    "Towel Bar": "General Toilet Accessories",
    "Robe Hook / Door Hook": "Robe Hooks",
    "Hat & Coat Rack": "Hat & Coat Racks",
    "Utility Shelf with Mop/Broom Holder": "Mop & Broom Holders",
    "Mop & Broom Holder": "Mop & Broom Holders",
    "Specimen Pass-Thru": "Specimen Pass-Thru",
    "Medicine Cabinet": "Medicine Cabinets",
}

PROJECT_NAME = "Bradley Pricing"
VENDOR_NAME = "Bradley Company, LLC"
QUOTE_NUMBER = "Q-234-5017-01"
QUOTE_DATE = "2026-06-24"
QUOTE_EXPIRATION = "2026-09-22"
CUSTOMER_NAME = "CWA Specialties Inc"
CONTACT_NOTE = "Contact: Latina Randolph"
MATERIAL_TOTAL = 9246.80


def esc(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def num(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "null"
    return str(value)


def humanize_modifier(code: str) -> str:
    return code.replace("_", " ").title()


def format_size(row) -> str | None:
    if isinstance(row.get("size_text"), str) and str(row["size_text"]).strip():
        return str(row["size_text"])
    parts = []
    if pd.notna(row.get("diameter_od_in")):
        parts.append(f'{row["diameter_od_in"]}" OD')
    if pd.notna(row.get("length_in")) and pd.notna(row.get("width_in")):
        parts.append(f'{row["length_in"]}x{row["width_in"]}')
    elif pd.notna(row.get("length_in")):
        parts.append(f'{row["length_in"]}" L')
    return " · ".join(parts) if parts else None


def write_modifier_seed(mods: pd.DataFrame) -> None:
    unique = (
        mods[["modifier_code", "modifier_type"]]
        .drop_duplicates(subset=["modifier_code"])
        .sort_values("modifier_code")
    )

    lines = [
        "-- Starter labor modifier catalog (factor 1.00 until tuned).",
        "-- Regenerate: npm run import:bradley",
        "",
        "insert into public.labor_modifiers (modifier_code, modifier_name, modifier_type, labor_factor, description)",
        "values",
    ]

    rows = []
    for _, row in unique.iterrows():
        code = row["modifier_code"]
        rows.append(
            f"  ({esc(code)}, {esc(humanize_modifier(code))}, {esc(row['modifier_type'])}, 1.000, "
            f"'Starter factor 1.00 — tune in Labor Rules later.')"
        )

    lines.append(",\n".join(rows))
    lines.extend(
        [
            "on conflict (modifier_code) do update set",
            "  modifier_name = excluded.modifier_name,",
            "  modifier_type = excluded.modifier_type,",
            "  description = excluded.description;",
            "",
        ]
    )
    OUT_MODIFIERS.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_MODIFIERS} ({len(rows)} modifiers)")


def write_project_quote_import() -> None:
    lines = [
        "-- Bradley import part A: project, vendor, quote.",
        "-- IMPORTANT: Ctrl+A to select ALL, then Run.",
        "-- Run after 008, 009, 010, 012.",
        "",
        "insert into public.projects (project_name, customer_name, status, notes)",
        f"select {esc(PROJECT_NAME)}, {esc(CUSTOMER_NAME)}, 'active', {esc(CONTACT_NOTE)}",
        f"where not exists (select 1 from public.projects where project_name = {esc(PROJECT_NAME)});",
        "",
        "update public.projects",
        f"set customer_name = {esc(CUSTOMER_NAME)}, status = 'active', notes = {esc(CONTACT_NOTE)}, updated_at = now()",
        f"where project_name = {esc(PROJECT_NAME)};",
        "",
        "insert into public.vendors (vendor_name)",
        f"values ({esc(VENDOR_NAME)})",
        "on conflict (vendor_name) do nothing;",
        "",
        "insert into public.vendor_quotes (",
        "  project_id, vendor_id, quote_number, quote_date, expiration_date,",
        "  shipping_total, material_total, grand_total, review_status, notes",
        ")",
        "select",
        "  p.id,",
        "  v.id,",
        f"  {esc(QUOTE_NUMBER)},",
        f"  {esc(QUOTE_DATE)}::date,",
        f"  {esc(QUOTE_EXPIRATION)}::date,",
        "  0,",
        f"  {MATERIAL_TOTAL},",
        f"  {MATERIAL_TOTAL},",
        "  'imported',",
        f"  'Imported from Bradley_Items_Database_Import.csv'",
        "from public.projects p",
        "cross join public.vendors v",
        f"where p.project_name = {esc(PROJECT_NAME)}",
        f"  and v.vendor_name = {esc(VENDOR_NAME)}",
        "on conflict (project_id, quote_number) do update set",
        "  quote_date = excluded.quote_date,",
        "  expiration_date = excluded.expiration_date,",
        "  shipping_total = excluded.shipping_total,",
        "  material_total = excluded.material_total,",
        "  grand_total = excluded.grand_total,",
        "  review_status = excluded.review_status,",
        "  notes = excluded.notes,",
        "  updated_at = now();",
        "",
    ]
    OUT_IMPORT_A.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_IMPORT_A}")


def write_quote_items_import(items: pd.DataFrame) -> None:
    value_rows = []
    for _, row in items.iterrows():
        category = PRODUCT_TO_CATEGORY.get(row["product_family"], "General Toilet Accessories")
        size_text = format_size(row)
        lead_time = f'{int(row["lead_time_days"])} days' if pd.notna(row["lead_time_days"]) else None
        value_rows.append(
            "  ("
            + ", ".join(
                [
                    str(int(row["quote_line_no"])),
                    num(row["source_page"]),
                    num(row["quantity"]),
                    esc(row["uom"]),
                    esc(row["part_number"]),
                    esc(row["description"]),
                    esc(lead_time),
                    num(row["unit_price"]),
                    num(row["ext_price"]),
                    esc(row["product_family"]),
                    esc(row["labor_family"]),
                    esc(row["mount_type"]),
                    esc(row["finish_material"]),
                    esc(size_text),
                    esc(row["color"]),
                    esc(category),
                    esc(row["database_notes"]),
                ]
            )
            + ")"
        )

    lines = [
        "-- Bradley import part B: all 65 quote line items (one statement).",
        "-- IMPORTANT: Ctrl+A to select ALL, then Run.",
        "-- Run part A first.",
        "",
        "with src as (",
        "  select * from (values",
        ",".join(value_rows),
        "  ) as t(",
        "    line_number, source_page, quantity, unit, part_number, description, lead_time,",
        "    unit_cost, extended_cost, product_family, labor_family_code, mount_type,",
        "    finish_material, size_text, color, labor_category_name, raw_text",
        "  )",
        ")",
        "insert into public.quote_items (",
        "  vendor_quote_id, catalog_item_id, line_number, source_page, quantity, unit, part_number,",
        "  description, lead_time, unit_cost, extended_cost, product_family, labor_family_code,",
        "  mount_type, finish_material, size_text, color, labor_category_id, labor_rule_id,",
        "  catalog_match_status, needs_review, raw_text",
        ")",
        "select",
        "  vq.id,",
        "  ci.id,",
        "  src.line_number,",
        "  src.source_page,",
        "  src.quantity,",
        "  src.unit,",
        "  src.part_number,",
        "  src.description,",
        "  src.lead_time,",
        "  src.unit_cost,",
        "  src.extended_cost,",
        "  src.product_family,",
        "  src.labor_family_code,",
        "  src.mount_type,",
        "  src.finish_material,",
        "  src.size_text,",
        "  src.color,",
        "  lc.id,",
        "  (",
        "    select lr.id",
        "    from public.labor_rules lr",
        "    where lr.labor_category_id = lc.id",
        "    order by lr.created_at asc",
        "    limit 1",
        "  ),",
        "  case when ci.id is not null then 'matched' else 'unmatched' end,",
        "  false,",
        "  src.raw_text",
        "from src",
        "join public.vendor_quotes vq on vq.quote_number = " + esc(QUOTE_NUMBER),
        "join public.projects p on p.id = vq.project_id and p.project_name = " + esc(PROJECT_NAME),
        f"left join public.catalog_items ci on ci.vendor_name = {esc(VENDOR_NAME)} and ci.part_number = src.part_number",
        "left join public.labor_categories lc on lc.category_name = src.labor_category_name",
        "on conflict (vendor_quote_id, part_number) do update set",
        "  catalog_item_id = excluded.catalog_item_id,",
        "  line_number = excluded.line_number,",
        "  source_page = excluded.source_page,",
        "  quantity = excluded.quantity,",
        "  unit = excluded.unit,",
        "  description = excluded.description,",
        "  lead_time = excluded.lead_time,",
        "  unit_cost = excluded.unit_cost,",
        "  extended_cost = excluded.extended_cost,",
        "  product_family = excluded.product_family,",
        "  labor_family_code = excluded.labor_family_code,",
        "  mount_type = excluded.mount_type,",
        "  finish_material = excluded.finish_material,",
        "  size_text = excluded.size_text,",
        "  color = excluded.color,",
        "  labor_category_id = excluded.labor_category_id,",
        "  labor_rule_id = excluded.labor_rule_id,",
        "  catalog_match_status = excluded.catalog_match_status,",
        "  needs_review = excluded.needs_review,",
        "  raw_text = excluded.raw_text,",
        "  updated_at = now();",
        "",
    ]
    OUT_IMPORT_B.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_IMPORT_B} ({len(value_rows)} items)")


def write_quote_modifiers_import(mods: pd.DataFrame) -> None:
    value_rows = []
    for _, row in mods.iterrows():
        value_rows.append(f"  ({esc(row['part_number'])}, {esc(row['modifier_code'])})")

    lines = [
        "-- Bradley import part C: quote line labor modifiers (one statement).",
        "-- IMPORTANT: Ctrl+A to select ALL, then Run.",
        "-- Run parts A and B first.",
        "",
        "delete from public.quote_item_labor_modifiers qim",
        "using public.quote_items qi, public.vendor_quotes vq, public.projects p",
        "where qim.quote_item_id = qi.id",
        "  and qi.vendor_quote_id = vq.id",
        "  and vq.project_id = p.id",
        f"  and p.project_name = {esc(PROJECT_NAME)}",
        f"  and vq.quote_number = {esc(QUOTE_NUMBER)};",
        "",
        "with src as (",
        "  select * from (values",
        ",\n".join(value_rows),
        "  ) as t(part_number, modifier_code)",
        ")",
        "insert into public.quote_item_labor_modifiers (quote_item_id, labor_modifier_id)",
        "select qi.id, lm.id",
        "from src",
        "join public.quote_items qi on qi.part_number = src.part_number",
        "join public.vendor_quotes vq on vq.id = qi.vendor_quote_id",
        "join public.projects p on p.id = vq.project_id",
        "join public.labor_modifiers lm on lm.modifier_code = src.modifier_code",
        f"where p.project_name = {esc(PROJECT_NAME)}",
        f"  and vq.quote_number = {esc(QUOTE_NUMBER)}",
        "on conflict (quote_item_id, labor_modifier_id) do nothing;",
        "",
        "-- Validation",
        "select",
        "  (select count(*) from public.quote_items qi",
        "     join public.vendor_quotes vq on vq.id = qi.vendor_quote_id",
        "     join public.projects p on p.id = vq.project_id",
        f"    where p.project_name = {esc(PROJECT_NAME)} and vq.quote_number = {esc(QUOTE_NUMBER)}) as quote_items,",
        "  (select coalesce(sum(qi.extended_cost), 0) from public.quote_items qi",
        "     join public.vendor_quotes vq on vq.id = qi.vendor_quote_id",
        "     join public.projects p on p.id = vq.project_id",
        f"    where p.project_name = {esc(PROJECT_NAME)} and vq.quote_number = {esc(QUOTE_NUMBER)}) as material_total;",
        "",
    ]
    OUT_IMPORT_C.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_IMPORT_C} ({len(value_rows)} modifier links)")


def main() -> None:
    items = pd.read_csv(ITEMS_CSV)
    mods = pd.read_csv(MODS_CSV)
    write_modifier_seed(mods)
    write_project_quote_import()
    write_quote_items_import(items)
    write_quote_modifiers_import(mods)
    if LEGACY_IMPORT.exists():
        LEGACY_IMPORT.unlink()
        print(f"Removed legacy {LEGACY_IMPORT.name}")


if __name__ == "__main__":
    main()
