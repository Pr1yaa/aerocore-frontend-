/**
 * Supabase client + realtime helpers
 *
 * ⚠️  BACKEND DEPENDENCY:
 *   Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.
 *   Until those are set the app falls back to mock data (see data-access.ts).
 *
 * Tables expected (backend must create):
 *   - messages        (id, flight_id, sender_id, sender_name, sender_role, category, content, timestamp, is_ai)
 *   - flights         (id, label, route, status, unread)
 *   - tasks           (id, title, flight_id, status, priority, category, assignee, due_date, created_at)
 *   - leave_requests  (id, name, role, flight, type, from_date, to_date, days, reason, priority, status)
 */

import { createClient } from '@supabase/supabase-js'

let _supabase: SupabaseClientLike | null = null

export interface SupabaseClientLike {
  from: (table: string) => QueryBuilder
  channel: (name: string) => RealtimeChannel
  removeChannel: (channel: RealtimeChannel) => void
}

// Minimal type stubs so we can reference them without importing the package at build time
export interface QueryBuilder {
  select: (cols?: string) => QueryBuilder
  eq: (col: string, val: unknown) => QueryBuilder
  order: (col: string, opts?: { ascending?: boolean }) => QueryBuilder
  limit: (n: number) => QueryBuilder
  insert: (row: object) => QueryBuilder
  update: (patch: object) => QueryBuilder
  single: () => Promise<{ data: unknown; error: unknown }>
  then: (resolve: (v: { data: unknown; error: unknown }) => void) => void
}

export interface RealtimeChannel {
  on: (
    event: string,
    opts: object,
    callback: (payload: { new: Record<string, unknown> }) => void,
  ) => RealtimeChannel
  subscribe: () => RealtimeChannel
}

export function getSupabase(): SupabaseClientLike | null {
  if (_supabase) return _supabase

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!url || !key) {
    // Not configured — app will use mock data
    return null
  }

  try {
    _supabase = createClient(url, key) as unknown as SupabaseClientLike
    return _supabase
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err)
    return null
  }
}

/** Returns true when Supabase is configured and available */
export function isSupabaseReady(): boolean {
  return getSupabase() !== null
}
