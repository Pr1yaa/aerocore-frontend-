// ── Flights / Channels ───────────────────────────────────────────────
export interface Flight {
  id: string
  label: string
  route: string
  status: FlightStatus
  unread?: number
}

export type FlightStatus = 'on-time' | 'delayed' | 'boarding' | 'departed' | 'landed' | 'cancelled'

// ── Navigation ───────────────────────────────────────────────────────
export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
}

// ── Message / Chat ───────────────────────────────────────────────────
export type MessageCategory =
  | 'QUERY' | 'SUPPORT' | 'CAB' | 'HOTEL' | 'LEAVE'
  | 'TASK'  | 'INFO'    | 'ALERT' | 'APPROVAL' | 'ESCALATION'

export interface Message {
  id: string
  flightId: string
  senderId: string
  senderName: string
  senderRole: string
  category: MessageCategory
  content: string
  timestamp: string
  isAI?: boolean
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  type: 'doc' | 'image' | 'pdf'
  url: string
}

// ── User / Auth ──────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  role: 'captain' | 'first-officer' | 'cabin-crew' | 'ground-ops' | 'manager'
  employeeId: string
  avatar?: string
}

// ── Dashboard ────────────────────────────────────────────────────────
export type DashboardView = 'kanban' | 'manager'

// ── QAgent ───────────────────────────────────────────────────────────
export interface QAgentSession {
  id: string
  flightId?: string
  messages: QAgentMessage[]
}

export interface QAgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

// ── Composer payload ─────────────────────────────────────────────────
export interface ComposerPayload {
  message: string
  row1Type: MessageCategory | null
  row2Type: MessageCategory | null
  flightId: string
}
