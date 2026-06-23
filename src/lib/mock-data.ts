import type { Flight, NavItem, Message } from '@/types'

export const MOCK_FLIGHTS: Flight[] = [
  { id: '6e2001', label: '6E2001', route: 'DEL → BOM', status: 'boarding',  unread: 3 },
  { id: '6e2002', label: '6E2002', route: 'BOM → HYD', status: 'on-time',   unread: 0 },
  { id: '6e2003', label: '6E2003', route: 'HYD → DEL', status: 'delayed',   unread: 7 },
  { id: '6e2004', label: '6E2004', route: 'DEL → CCU', status: 'departed',  unread: 0 },
  { id: '6e2005', label: '6E2005', route: 'MAA → DEL', status: 'on-time',   unread: 1 },
]

export const NAV_ITEMS: NavItem[] = [
  { id: 'alerts',    label: 'Alerts',    icon: 'Bell',           path: '#',               badge: 4 },
{ id: 'vendor', label: 'Vendor', icon: 'Store', path: '/vendor' },
  { id: 'workspace', label: 'Workspace', icon: 'MessagesSquare', path: '/workspace/6e2001'          },
  { id: 'crew',      label: 'Crew',      icon: 'Users',          path: '#'                          },
  { id: 'schedule',  label: 'Schedule',  icon: 'CalendarDays',   path: '#'                          },
  { id: 'phone',     label: 'Calls',     icon: 'Phone',          path: '#'                          },
  { id: 'qagent',   label: 'QAgent',    icon: 'Bot',            path: '/qagent'                    },
]

// ── Mock Messages per flight ────────────────────────────────────────
export const MOCK_MESSAGES: Message[] = [
  // 6E2001 — boarding
  {
    id: 'm1', flightId: '6e2001', senderId: 'capt-01',
    senderName: 'Capt. Arvind Sharma', senderRole: 'Captain',
    category: 'INFO', content: 'Pre-flight checks complete. Boarding commenced at Gate B12. All systems nominal.',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: 'm2', flightId: '6e2001', senderId: 'ground-01',
    senderName: 'Ground Ops – Priya', senderRole: 'Ground Operations',
    category: 'SUPPORT', content: 'Catering loaded. Final pax count: 168/186. Baggage reconciliation in progress.',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: 'm3', flightId: '6e2001', senderId: 'me',
    senderName: 'You', senderRole: 'Ops Controller',
    category: 'QUERY', content: 'Any update on the 4 pax who checked in late? Do we hold or close?',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
  },
  {
    id: 'm4', flightId: '6e2001', senderId: 'capt-01',
    senderName: 'Capt. Arvind Sharma', senderRole: 'Captain',
    category: 'INFO', content: 'Holding for 10 mins. ATD revised to 14:35 IST. Slot confirmed with ATC.',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'm5', flightId: '6e2001', senderId: 'ai',
    senderName: 'QAgent', senderRole: 'AI Assistant',
    category: 'ALERT', content: '⚡ Heads up: Weather advisory issued for BOM. Light turbulence expected at FL280. ETA impact: +8 min. No action required at this time.',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    isAI: true,
  },
  {
    id: 'm6', flightId: '6e2001', senderId: 'ground-01',
    senderName: 'Ground Ops – Priya', senderRole: 'Ground Operations',
    category: 'APPROVAL', content: 'Requesting approval for offload of 2 unchecked bags (rows 14C, 22A). Pax declined to board.',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
  },

  // 6E2003 — delayed
  {
    id: 'm7', flightId: '6e2003', senderId: 'fo-01',
    senderName: 'F/O Rekha Nair', senderRole: 'First Officer',
    category: 'ALERT', content: 'Aircraft delayed at HYD — tech issue on previous sector. AOC team on site. ETD pushed to 16:15.',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'm8', flightId: '6e2003', senderId: 'me',
    senderName: 'You', senderRole: 'Ops Controller',
    category: 'HOTEL', content: 'Initiating hotel block at Novotel HYD for 24 pax. Connection passengers priority.',
    timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
  },
  {
    id: 'm9', flightId: '6e2003', senderId: 'ai',
    senderName: 'QAgent', senderRole: 'AI Assistant',
    category: 'INFO', content: 'Hotel block confirmed: 24 rooms at Novotel Hyderabad Airport. Shuttle arranged for 15:30. Vouchers issued digitally.',
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    isAI: true,
  },
  {
    id: 'm10', flightId: '6e2003', senderId: 'ground-02',
    senderName: 'Ground Ops – Vikram', senderRole: 'Ground Operations',
    category: 'ESCALATION', content: 'ESCALATION: Pax in row 8 reporting medical emergency — mild chest pain. Paramedics called. Need ops manager to be notified.',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },

  // 6E2002 — on-time (no unread)
  {
    id: 'm11', flightId: '6e2002', senderId: 'capt-02',
    senderName: 'Capt. Mehul Desai', senderRole: 'Captain',
    category: 'INFO', content: 'Airborne at 11:42. All pax comfortable. ETA BOM 13:10 IST.',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
  },
]

// ── QAgent suggestion prompts ──────────────────────────────────
export const QAGENT_PROMPTS = [
  'Show delay summary for all active flights',
  'Which crew members are approaching duty hour limits?',
  'Draft a hotel arrangement message for 6E2003',
  'What are the open escalations right now?',
  'Suggest cab options near DEL T3 for crew transport',
]
