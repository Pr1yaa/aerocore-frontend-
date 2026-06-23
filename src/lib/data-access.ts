/**
 * data-access.ts — updated for AEROCORE v4 backend
 */

import { getSupabase } from './supabase'
import { sendOpsMessage } from './api'
import { MOCK_FLIGHTS, MOCK_MESSAGES } from './mock-data'
import type { Flight, Message, ComposerPayload, MessageCategory } from '@/types'

// ── Flights ──────────────────────────────────────────────────────────

export async function fetchFlights(): Promise<Flight[]> {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await (sb
        .from('flights')
        .select('*')
        .order('label', { ascending: true }) as unknown as Promise<{
        data: Flight[] | null
        error: unknown
      }>)
      if (!error && data) return data
    } catch { /* fall through */ }
  }
  return structuredClone(MOCK_FLIGHTS)
}

// ── Messages ─────────────────────────────────────────────────────────

export async function fetchMessages(flightId: string): Promise<Message[]> {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await (sb
        .from('messages')
        .select('*')
        .eq('flight_id', flightId)
        .order('timestamp', { ascending: true }) as unknown as Promise<{
        data: Message[] | null
        error: unknown
      }>)
      if (!error && data) return data
    } catch { /* fall through */ }
  }
  return structuredClone(MOCK_MESSAGES.filter((m) => m.flightId === flightId))
}

/**
 * Send a message — routes to AEROCORE v4 backend POST /ingress/message
 * Maps frontend MessageCategory → backend message_type
 */
export async function sendMessage(payload: ComposerPayload): Promise<Message> {
  const category: MessageCategory = payload.row2Type ?? payload.row1Type ?? 'INFO'

  const optimistic: Message = {
    id: `local-${Date.now()}`,
    flightId: payload.flightId,
    senderId: 'me',
    senderName: 'You',
    senderRole: 'Ops Controller',
    category,
    content: payload.message,
    timestamp: new Date().toISOString(),
  }

  // Map frontend category → backend message_type
  const typeMap: Partial<Record<MessageCategory, string>> = {
    TASK:       'task',
    INFO:       'info',
    ALERT:      'alert',
    APPROVAL:   'approval',
    ESCALATION: 'escalation',
  }
  const backendType = typeMap[category] ?? 'info'

  try {
    await sendOpsMessage({
      raw_content:    payload.message,
      message_type:   backendType,
      flight_context: payload.flightId !== 'mock-1' ? payload.flightId : undefined,
    })
  } catch (err) {
    console.error('[sendMessage] Backend error:', err)
    // Graceful degradation — return optimistic
  }

  return optimistic
}

// ── Leave requests ────────────────────────────────────────────────────

export async function approveLeave(_id: string): Promise<boolean> {
  return false // handled via /agents/roster/confirm-assignment
}

export async function rejectLeave(_id: string): Promise<boolean> {
  return false
}

// ── Tasks ─────────────────────────────────────────────────────────────

export async function advanceTaskStatus(_id: string, _newStatus: string): Promise<boolean> {
  return false // handled directly in KanbanView via api.ts
}
