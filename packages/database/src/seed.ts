/**
 * Database seed script.
 *
 * Reads the sample CSV files from `imports/` and upserts records into the
 * database so the app starts with realistic demo data.
 *
 * Usage:
 *   pnpm --filter @brighten/database db:seed
 *   # or from the repo root:
 *   pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const prisma = new PrismaClient();

// ─── CSV helpers ──────────────────────────────────────────────────────────────

async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });

  let headers: string[] = [];
  let first = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (first) {
      headers = cols;
      first = false;
    } else {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] ?? '';
      });
      rows.push(row);
    }
  }

  return rows;
}

/** Minimal CSV line parser – handles quoted fields. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function bool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function optionalDate(value: string): Date | null {
  if (!value || value.trim() === '') return null;
  return new Date(value);
}

function optionalFloat(value: string): number | null {
  if (!value || value.trim() === '') return null;
  return parseFloat(value);
}

// ─── Seed functions ───────────────────────────────────────────────────────────

const IMPORTS_DIR = resolve(process.cwd(), '..', '..', 'imports');

async function seedRates(): Promise<void> {
  console.log('Seeding rates…');
  const rows = await readCsv(resolve(IMPORTS_DIR, 'sample-rates.csv'));

  for (const row of rows) {
    await prisma.rate.create({
      data: {
        role: row['role']!,
        ratePerHour: parseFloat(row['ratePerHour']!),
        overtimeMultiplier: parseFloat(row['overtimeMultiplier']!),
        effectiveFrom: new Date(row['effectiveFrom']!),
        effectiveTo: optionalDate(row['effectiveTo']!),
      },
    });
  }

  console.log(`  ✓ ${rows.length} rates seeded`);
}

async function seedEmployees(): Promise<void> {
  console.log('Seeding employees…');
  const rows = await readCsv(resolve(IMPORTS_DIR, 'sample-employees.csv'));

  for (const row of rows) {
    const certifications = row['certifications']
      ? row['certifications'].split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    await prisma.employee.upsert({
      where: { employeeNumber: row['employeeNumber']! },
      update: {},
      create: {
        employeeNumber: row['employeeNumber']!,
        firstName: row['firstName']!,
        lastName: row['lastName']!,
        email: row['email']!,
        role: row['role']!,
        certifications: JSON.stringify(certifications),
        active: bool(row['active']!),
      },
    });
  }

  console.log(`  ✓ ${rows.length} employees seeded`);
}

async function seedJobs(): Promise<void> {
  console.log('Seeding jobs…');
  const rows = await readCsv(resolve(IMPORTS_DIR, 'sample-jobs.csv'));

  for (const row of rows) {
    await prisma.job.upsert({
      where: { jobNumber: row['jobNumber']! },
      update: {},
      create: {
        jobNumber: row['jobNumber']!,
        customerName: row['customerName']!,
        siteAddress: row['siteAddress']!,
        city: row['city']!,
        state: row['state']!,
        zip: row['zip']!,
        status: row['status']!,
        systemSizeKw: parseFloat(row['systemSizeKw']!),
        panelCount: parseInt(row['panelCount']!, 10),
        inverterType: row['inverterType']!,
        roofType: row['roofType']!,
        hasBattery: bool(row['hasBattery']!),
        hasEvCharger: bool(row['hasEvCharger']!),
        hasMonitoring: bool(row['hasMonitoring']!),
        scheduledDate: optionalDate(row['scheduledDate']!),
        completedDate: optionalDate(row['completedDate']!),
        budgetedHours: optionalFloat(row['budgetedHours']!),
        notes: row['notes'] || null,
      },
    });
  }

  console.log(`  ✓ ${rows.length} jobs seeded`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱  Starting database seed…\n');
  await seedRates();
  await seedEmployees();
  await seedJobs();
  console.log('\n✅  Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
