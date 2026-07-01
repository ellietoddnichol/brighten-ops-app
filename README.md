# Brighten Div 10 Estimator

React + TypeScript + Supabase app for Div 10 vendor quote review, labor category assignment, and estimate totals.

## Stack

- Vite + React
- Supabase (Postgres, Auth, REST)
- React Router

## Local setup

```bash
npm install
cp .env.example .env.local   # or create .env.local manually
npm run dev
```

Required env vars in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_or_publishable_key
```

## Supabase migrations

Run in order in Supabase SQL Editor:

1. `supabase/migrations/20260701_001_create_div10_schema.sql`
2. `supabase/migrations/20260701_002_seed_div10_categories.sql`
3. `supabase/migrations/20260701_003_enable_rls_dev_policies.sql`

Enable Email auth in Supabase Dashboard, create a user, then sign in via the app.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview production build
