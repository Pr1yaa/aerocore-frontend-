/**
 * ConnectionBadge
 * ───────────────
 * Shows whether the app is running on live Supabase data
 * or mock fallback. Useful for POC demo mode.
 *
 * Renders a small dot in the NavRail footer.
 */
import { isSupabaseReady } from '@/lib/supabase'

export function ConnectionBadge() {
  const live = isSupabaseReady()

  return (
    <div
      title={live ? 'Connected to Supabase' : 'Demo mode — using mock data'}
      aria-label={live ? 'Live data' : 'Demo mode'}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-subtle border border-surface-border"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-status-ok animate-pulse' : 'bg-ink-muted'}`}
        aria-hidden="true"
      />
      <span className="text-[8px] font-mono font-bold text-ink-muted uppercase tracking-wider">
        {live ? 'LIVE' : 'DEMO'}
      </span>
    </div>
  )
}
