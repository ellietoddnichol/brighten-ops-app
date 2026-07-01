import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function parseEnvFile(path: string) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function loadLocalEnv() {
  parseEnvFile(resolve(process.cwd(), '.env.local'))
  parseEnvFile(resolve(process.cwd(), '.env'))
}

export function getSupabaseImportConfig() {
  loadLocalEnv()
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url) {
    throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL in .env.local')
  }

  const key = serviceKey ?? publishableKey
  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY (recommended) or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
    )
  }

  return { url, key, usesServiceRole: Boolean(serviceKey) }
}
