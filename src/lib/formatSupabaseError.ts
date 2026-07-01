export function formatSupabaseError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: string }).message)
    if (message.includes('row-level security')) {
      return 'Database blocked the request (RLS). Sign in at /login, then run migration 20260701_003 in Supabase SQL Editor.'
    }
    return message
  }
  return fallback
}
