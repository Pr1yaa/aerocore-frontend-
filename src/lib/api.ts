/**
 * api.ts
 * JWT-aware API client for AEROCORE v4 backend.
 * All calls go to VITE_API_BASE_URL (http://127.0.0.1:8000)
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

// ── Token storage ────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('aerocore_token')
}

export function setToken(token: string) {
  localStorage.setItem('aerocore_token', token)
}

export function clearToken() {
  localStorage.removeItem('aerocore_token')
  localStorage.removeItem('aerocore_user')
}

export function getUser(): AerocoreUser | null {
  const raw = localStorage.getItem('aerocore_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setUser(user: AerocoreUser) {
  localStorage.setItem('aerocore_user', JSON.stringify(user))
}

export interface AerocoreUser {
  id: string
  name: string
  email: string
  role: string
  authority_level: number
  airport_id: string
  designation?: string
  department?: string
  employee_id?: string
}

// ── Core fetch wrapper ───────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'API error')
  }

  return res.json() as Promise<T>
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await apiFetch<{ token: string; user: AerocoreUser; expires_at: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )
  setToken(data.token)
  setUser(data.user)
  return data
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } catch { /* ignore */ }
  clearToken()
}

// ── Ingress ──────────────────────────────────────────────────────────

export async function sendOpsMessage(payload: {
  raw_content: string
  message_type: string
  flight_context?: string
}) {
  return apiFetch<{ msg_id: string; status: string; pipeline: string; received_at: string }>(
    '/ingress/message',
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export async function sendChatMessage(payload: {
  raw_content: string
  query_type?: string
  session_id?: string
  conversation_history?: Array<{ role: string; content: string }>
}) {
  return apiFetch<{ chat_id: string; status: string; pipeline: string; session_id: string }>(
    '/ingress/chat',
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

// ── Dashboard ────────────────────────────────────────────────────────

export interface BackendTask {
  task_id: string
  flight_no: string | null
  title: string
  description: string | null
  type: string | null
  priority_label: string | null
  priority_score: number | null
  status: string
  sla_deadline_utc: string | null
  time_remaining_min: number | null
  escalation_level: number
  visible_to_levels: number[]
  labels: string[]
  created_at: string
}

export interface KanbanResponse {
  airport_id: string
  authority_level: number
  kanban: {
    New: BackendTask[]
    Ack: BackendTask[]
    InProgress: BackendTask[]
    Blocked: BackendTask[]
    Done: BackendTask[]
  }
  counts: Record<string, number>
}

export async function fetchKanbanTasks(airport_id: string): Promise<KanbanResponse> {
  return apiFetch<KanbanResponse>(`/dashboard/tasks?airport_id=${airport_id}`)
}

export async function acknowledgeTask(task_id: string) {
  return apiFetch(`/dashboard/tasks/${task_id}/ack`, { method: 'PATCH' })
}

export async function updateTaskStatus(task_id: string, status: string, note?: string) {
  return apiFetch(`/dashboard/tasks/${task_id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  })
}

export async function escalateTask(task_id: string, reason: string) {
  return apiFetch(`/dashboard/tasks/${task_id}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// ── Chat session ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  received_at?: string
  processed_at?: string
  source?: string
  query_type?: string
}

export async function fetchChatSession(session_id: string): Promise<{ session_id: string; messages: ChatMessage[]; count: number }> {
  return apiFetch(`/dashboard/chat/session/${session_id}`)
}

// ── Flights ──────────────────────────────────────────────────────────

export async function fetchFlightsFromBackend(airport_id: string) {
  return apiFetch<{ flights: unknown[]; count: number }>(`/flights?airport_id=${airport_id}`)
}
