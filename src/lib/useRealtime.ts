/**
 * useRealtime.ts
 * ──────────────
 * Supabase realtime subscription hooks.
 *
 * ⚠️  BACKEND DEPENDENCY:
 *   These hooks only activate when Supabase is configured
 *   (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set).
 *   Without them the hooks are no-ops and the app stays on local/mock state.
 *
 * Tables subscribed:
 *   - messages       (INSERT filtered by flight_id)
 *   - tasks          (INSERT + UPDATE)
 *   - leave_requests (INSERT + UPDATE)
 */

import { useEffect } from 'react'
import { getSupabase } from './supabase'
import type { Message } from '@/types'

// ── Messages ──────────────────────────────────────────────────────────

/**
 * Subscribe to new messages for a given flightId.
 * Calls `onNew` for each INSERT that arrives over the websocket.
 */
export function useMessageRealtime(
  flightId: string | undefined,
  onNew: (msg: Message) => void,
) {
  useEffect(() => {
    if (!flightId) return
    const sb = getSupabase()
    if (!sb) return // Supabase not configured

    const channel = sb
      .channel(`messages:${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          onNew(payload.new as unknown as Message)
        },
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [flightId, onNew])
}

// ── Tasks ─────────────────────────────────────────────────────────────

export interface TaskRealtimePayload {
  id: string
  status: string
  [key: string]: unknown
}

/**
 * Subscribe to task INSERT and UPDATE events.
 * Useful for the Kanban board to stay live.
 */
export function useTaskRealtime(
  onChange: (payload: TaskRealtimePayload, eventType: 'INSERT' | 'UPDATE') => void,
) {
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    const channel = sb
      .channel('tasks:all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => onChange(payload.new as TaskRealtimePayload, 'INSERT'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => onChange(payload.new as TaskRealtimePayload, 'UPDATE'),
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [onChange])
}

// ── Leave Requests ────────────────────────────────────────────────────

export interface LeaveRealtimePayload {
  id: string
  status: string
  [key: string]: unknown
}

/**
 * Subscribe to leave_request INSERT and UPDATE events.
 * Manager view uses this to get live approval state.
 */
export function useLeaveRealtime(
  onChange: (payload: LeaveRealtimePayload, eventType: 'INSERT' | 'UPDATE') => void,
) {
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    const channel = sb
      .channel('leave_requests:all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leave_requests' },
        (payload) => onChange(payload.new as LeaveRealtimePayload, 'INSERT'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests' },
        (payload) => onChange(payload.new as LeaveRealtimePayload, 'UPDATE'),
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [onChange])
}
