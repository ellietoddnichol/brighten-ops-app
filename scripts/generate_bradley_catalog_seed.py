"""Generate compact Supabase seed migrations for the Bradley product catalog."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ITEMS_CSV = ROOT / "data" / "imports" / "bradley" / "Bradley_Items_Database_Import.csv"
MODS_CSV = ROOT / "data" / "imports" / "bradley" / "Bradley_Item_Modifiers.csv"
OUT_DIR = ROOT / "supabase" / "migrations"

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

LABOR_FAMILIES = [
    ("DIV10_GRAB_BAR", "Grab Bar", "Base family for grab bars", "concealed/peened/OD/length/design change", "Verify blocking, substrate, and ADA height/clearance before install.", "Vendor quote does not include labor."),
    ("DIV10_MIRROR", "Mirror", "Base family for restroom mirrors", "frame type/size", "Verify backing, mounting hardware, and mounting height.", "Vendor quote does not include labor."),
    ("DIV10_DISPENSER", "Dispenser", "General restroom dispenser install", "surface/recessed/sensor/automatic/capacity", "Use for toilet tissue, towel, soap, seat cover, napkin disposal, and similar dispensers.", "Vendor quote does not include labor."),
    ("DIV10_RECESSED_DISPENSER", "Recessed Dispenser / Vendor", "Recessed specialty dispenser install", "recessed/coin vendor/rough opening", "Requires rough opening/wall-depth check.", "Vendor quote does not include labor."),
    ("DIV10_TOWEL_WASTE", "Towel/Waste Combination Unit", "Combination towel and waste unit", "surface/recessed/semi-recessed/12 gal", "Recessed units need rough opening check; surface units use wall accessory install.", "Vendor quote does not include labor."),
    ("DIV10_BABY_CHANGER", "Baby Changing Station", "Baby changing station install", "surface/recessed/material/color/heavy anchoring", "Use heavier labor/anchoring modifier; verify blocking and ADA clearances.", "Vendor quote does not include labor."),
    ("DIV10_SHOWER_SEAT", "Shower Seat", "Shower safety seat install", "structural anchoring/material/reversible", "Safety/structural anchorage item; verify backing.", "Vendor quote does not include labor."),
    ("DIV10_SHOWER_CURTAIN", "Shower Curtain / Rod / Hook", "Shower curtain, rod, and hook work", "rod length/OD/hook type/curtain size", "Bundle small curtain/hook items with rod installation if estimating labor.", "Vendor quote does not include labor."),
    ("DIV10_WALL_ACCESSORY", "Wall Accessory", "General wall accessory install", "surface mount/finish/hook type", "Towel bars, robe hooks, coat racks.", "Vendor quote does not include labor."),
    ("DIV10_CUSTODIAL_ACCESSORY", "Custodial Accessory", "Mop/broom and utility shelf install", "utility shelf/mop broom holder", "Verify blocking due to shelf/holder loading.", "Vendor quote does not include labor."),
    ("DIV10_MEDICAL_SPECIALTY", "Medical Specialty", "Medical specialty install", "pass-thru/stainless/rough opening", "Likely rough opening/coordination required.", "Vendor quote does not include labor."),
    ("DIV10_MEDICINE_CABINET", "Medicine Cabinet", "Medicine cabinet install", "recessed/semi-recessed/surface/finish", "Recessed/semi-recessed requires rough opening check.", "Vendor quote does not include labor."),
]


def esc(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def num(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "null"
    return str(value)


def bool_sql(value) -> str:
    if isinstance(value, str):
        return "true" if value.strip().lower() in ("yes", "true", "1") else "false"
    return "false"


def write_families_migration() -> None:
    lines = [
        "-- Bradley catalog: labor families (part 1 of 3). Run after 005.",
        "-- Regenerate: python scripts/generate_bradley_catalog_seed.py",
        "",
        "insert into public.catalog_labor_families (",
        "  labor_family_code, family_name, description, supported_modifiers, estimating_notes, labor_source_note",
        ")",
        "values",
    ]
    family_rows = ["  (" + ", ".join(esc(v) for v in row) + ")" for row in LABOR_FAMILIES]
    lines.append(",\n".join(family_rows))
    lines.extend(
        [
            "on conflict (labor_family_code) do update set",
            "  family_name = excluded.family_name,",
            "  description = excluded.description,",
            "  supported_modifiers = excluded.supported_modifiers,",
            "  estimating_notes = excluded.estimating_notes,",
            "  labor_source_note = excluded.labor_source_note;",
            "",
        ]
    )
    path = OUT_DIR / "20260701_006_seed_bradley_catalog_families.sql"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path}")


def write_items_migration(items: pd.DataFrame) -> None:
    lines = [
        "-- Bradley catalog: items (part 2 of 3). Run after 006 families.",
        "-- IMPORTANT: select all (Ctrl+A) before Run — do not run a partial selection.",
        "",
        "insert into public.catalog_items (",
        "  vendor_name, part_number, description, product_family, labor_family_code, labor_category_id,",
        "  default_unit, default_lead_time_days, list_unit_price, labor_modifiers, mount_type, finish_material,",
        "  frame_type, diameter_od_in, length_in, width_in, height_in, size_text, color, capacity,",
        "  operation_type, design_change, database_notes, source_part_note",
        ")",
        "values",
    ]

    value_rows = []
    for _, row in items.iterrows():
        category = PRODUCT_TO_CATEGORY.get(row["product_family"], "General Toilet Accessories")
        value_rows.append(
            "  ("
            + ", ".join(
                [
                    "'Bradley Company, LLC'",
                    esc(row["part_number"]),
                    esc(row["description"]),
                    esc(row["product_family"]),
                    esc(row["labor_family"]),
                    f"(select id from public.labor_categories where category_name = {esc(category)})",
                    esc(row["uom"]),
                    num(row["lead_time_days"]),
                    num(row["unit_price"]),
                    esc(row["labor_modifiers"]),
                    esc(row["mount_type"]),
                    esc(row["finish_material"]),
                    esc(row["frame_type"]),
                    num(row["diameter_od_in"]),
                    num(row["length_in"]),
                    num(row["width_in"]),
                    num(row["height_in"]),
                    esc(row["size_text"]),
                    esc(row["color"]),
                    esc(row["capacity"]),
                    esc(row["operation_type"]),
                    bool_sql(row["design_change"]),
                    esc(row["database_notes"]),
                    esc(row["source_part_note"]),
                ]
            )
            + ")"
        )

    lines.append(",\n".join(value_rows))
    lines.extend(
        [
            "on conflict (vendor_name, part_number) do update set",
            "  description = excluded.description,",
            "  product_family = excluded.product_family,",
            "  labor_family_code = excluded.labor_family_code,",
            "  labor_category_id = excluded.labor_category_id,",
            "  default_unit = excluded.default_unit,",
            "  default_lead_time_days = excluded.default_lead_time_days,",
            "  list_unit_price = excluded.list_unit_price,",
            "  labor_modifiers = excluded.labor_modifiers,",
            "  mount_type = excluded.mount_type,",
            "  finish_material = excluded.finish_material,",
            "  frame_type = excluded.frame_type,",
            "  diameter_od_in = excluded.diameter_od_in,",
            "  length_in = excluded.length_in,",
            "  width_in = excluded.width_in,",
            "  height_in = excluded.height_in,",
            "  size_text = excluded.size_text,",
            "  color = excluded.color,",
            "  capacity = excluded.capacity,",
            "  operation_type = excluded.operation_type,",
            "  design_change = excluded.design_change,",
            "  database_notes = excluded.database_notes,",
            "  source_part_note = excluded.source_part_note,",
            "  updated_at = now();",
            "",
        ]
    )

    path = OUT_DIR / "20260701_006_seed_bradley_catalog_items.sql"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path} ({len(value_rows)} items)")


def write_modifiers_migration(mods: pd.DataFrame) -> None:
    lines = [
        "-- Bradley catalog: item modifiers (part 3 of 3). Run after 006 items.",
        "-- IMPORTANT: select all (Ctrl+A) before Run — do not run a partial selection.",
        "",
        "delete from public.catalog_item_modifiers",
        "where part_number in (",
        "  select part_number from public.catalog_items where vendor_name = 'Bradley Company, LLC'",
        ");",
        "",
        "insert into public.catalog_item_modifiers (",
        "  catalog_item_id, part_number, modifier_sequence, modifier_code, modifier_type, app_use",
        ")",
        "select",
        "  ci.id,",
        "  src.part_number,",
        "  src.modifier_sequence,",
        "  src.modifier_code,",
        "  src.modifier_type,",
        "  src.app_use",
        "from (",
        "  values",
    ]

    mod_rows = []
    for _, row in mods.iterrows():
        mod_rows.append(
            "    ("
            + ", ".join(
                [
                    esc(row["part_number"]),
                    str(int(row["modifier_sequence"])),
                    esc(row["modifier_code"]),
                    esc(row["modifier_type"]),
                    esc(row["app_use"]),
                ]
            )
            + ")"
        )

    lines.append(",\n".join(mod_rows))
    lines.extend(
        [
            ") as src(part_number, modifier_sequence, modifier_code, modifier_type, app_use)",
            "join public.catalog_items ci",
            "  on ci.vendor_name = 'Bradley Company, LLC'",
            " and ci.part_number = src.part_number;",
            "",
        ]
    )

    path = OUT_DIR / "20260701_006_seed_bradley_catalog_modifiers.sql"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path} ({len(mod_rows)} modifiers)")


def main() -> None:
    items = pd.read_csv(ITEMS_CSV)
    mods = pd.read_csv(MODS_CSV)

    write_families_migration()
    write_items_migration(items)
    write_modifiers_migration(mods)

    legacy = OUT_DIR / "20260701_006_seed_bradley_catalog.sql"
    if legacy.exists():
        legacy.unlink()
        print(f"Removed legacy monolithic file {legacy}")


if __name__ == "__main__":
    main()
