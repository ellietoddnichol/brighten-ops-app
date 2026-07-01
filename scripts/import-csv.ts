#!/usr/bin/env tsx
/**
 * import-csv.ts
 *
 * Convenience wrapper that runs the database seed script to import the CSV
 * files from `imports/` into the local SQLite database.
 *
 * Usage (from repo root):
 *   pnpm db:seed
 *
 * Or directly:
 *   cd packages/database && pnpm db:seed
 */

import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPkg = resolve(__dirname, '..', 'packages', 'database');

console.log('Running database seed from:', dbPkg);
execSync('pnpm db:seed', { cwd: dbPkg, stdio: 'inherit' });
