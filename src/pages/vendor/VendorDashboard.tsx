import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Hotel, Clock, Store, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getToken } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

type TicketStatus = 'Open' | 'Acknowledged' | 'InProgress' | 'Resolved' | 'Escalated'

interface VendorTicket {
  id: string
  ticket_id: string
  ticket_type: 'cab' | 'hotel'
  status: TicketStatus
  details: Record<string, string>
  sla_deadline_utc: string
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  Open:         'bg-red-50 text-red-600 border-red-200',
  Acknowledged: 'bg-sky-50 text-sky-600 border-sky-200',
  InProgress:   'bg-violet-50 text-violet-600 border-violet-200',
  Resolved:     'bg-green-50 text-green-600 border-green-200',
  Escalated:    'bg-orange-50 text-orange-600 border-orange-200',
}

const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  Open:         'Acknowledged',
  Acknowledged: 'InProgress',
}

const STATUS_LABEL: Partial<Record<TicketStatus, string>> = {
  Open:         'Open → Acknowledge',
  Acknowledged: 'Acknowledged → In Progress',
  InProgress:   'In Progress',
}

function TimeRemaining({ deadline }: { deadline: string }) {
  const now = new Date()
  const due = new Date(deadline)
  const diffMin = Math.round((due.getTime() - now.getTime()) / 60000)
  const isOverdue = diffMin < 0
  return (
    <span className={cn(
      'flex items-center gap-1 text-[10px] font-mono font-bold',
      isOverdue ? 'text-red-500' : diffMin < 10 ? 'text-orange-500' : 'text-ink-muted'
    )}>
      <Clock size={10} strokeWidth={2} />
      {isOverdue ? `Overdue ${Math.abs(diffMin)}m` : `${diffMin}m left`}
    </span>
  )
}

function TicketCard({ ticket, onStatusChange, onResolve }: {
  ticket: VendorTicket
  onStatusChange: (id: string, status: TicketStatus) => void
  onResolve: (id: string) => void
}) {
  const [resolving, setResolving] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [notes, setNotes] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const isResolved = ticket.status === 'Resolved'
  const nextStatus = NEXT_STATUS[ticket.status]

  async function handleAdvanceStatus() {
    if (!nextStatus) return
    setAdvancing(true)
    try {
      const token = getToken()
      await fetch(`${BASE}/agents/cabhotel/ticket/${ticket.ticket_id}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      onStatusChange(ticket.ticket_id, nextStatus)
    } catch (err) {
      console.error(err)
    } finally {
      setAdvancing(false)
    }
  }

  async function handleResolve() {
    if (!notes.trim()) return
    setResolving(true)
    try {
      const token = getToken()
      await fetch(`${BASE}/agents/cabhotel/ticket/${ticket.ticket_id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: notes })
      })
      onResolve(ticket.ticket_id)
    } catch (err) {
      console.error(err)
    } finally {
      setResolving(false)
      setShowResolve(false)
    }
  }

  return (
    <div className={cn('rounded-xl border bg-white p-4 flex flex-col gap-3 shadow-sm transition-all', isResolved && 'opacity-60')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold text-indigo-600">{ticket.ticket_id}</span>
          <span className="text-xs font-display font-bold text-ink-primary">
            {ticket.ticket_type === 'cab' ? '🚕 Cab Request' : '🏨 Hotel Request'}
          </span>
        </div>

        {/* Clickable status button */}
        {!isResolved && nextStatus ? (
          <button
            onClick={handleAdvanceStatus}
            disabled={advancing}
            title={`Click to advance: ${STATUS_LABEL[ticket.status]}`}
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all hover:opacity-70 active:scale-95',
              STATUS_COLORS[ticket.status],
              advancing && 'opacity-50 cursor-wait'
            )}
          >
            {advancing ? '...' : `${ticket.status} →`}
          </button>
        ) : (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', STATUS_COLORS[ticket.status])}>
            {ticket.status}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="bg-surface-subtle rounded-lg p-2.5 flex flex-col gap-1">
        {Object.entries(ticket.details || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-[10px] text-ink-muted font-mono capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-[10px] text-ink-primary font-mono font-bold text-right max-w-[60%]">{String(value)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {ticket.sla_deadline_utc && <TimeRemaining deadline={ticket.sla_deadline_utc} />}
        <span className="text-[9px] text-ink-muted font-mono">
          {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Resolution notes if resolved */}
      {isResolved && ticket.resolution_notes && (
        <div className="bg-green-50 rounded-lg p-2 text-[10px] text-green-700 font-mono">
          ✓ {ticket.resolution_notes}
        </div>
      )}

      {/* Resolve button — only when InProgress */}
      {!isResolved && (
        <div className="flex flex-col gap-2">
          {!showResolve ? (
            <button
              onClick={() => setShowResolve(true)}
              className={cn(
                'w-full py-1.5 rounded-lg text-[11px] font-display font-bold transition-all',
                ticket.status === 'InProgress'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-surface-subtle text-ink-muted border border-surface-border hover:border-green-400 hover:text-green-700'
              )}
            >
              Mark Resolved
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Resolution notes..."
                className="px-2 py-1.5 rounded-lg border border-surface-border text-[11px] font-mono outline-none focus:border-indigo-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResolve}
                  disabled={!notes.trim() || resolving}
                  className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold disabled:opacity-50 transition-all"
                >
                  {resolving ? <Loader2 size={11} className="animate-spin mx-auto" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowResolve(false)}
                  className="flex-1 py-1.5 rounded-lg border border-surface-border text-[11px] text-ink-muted hover:bg-surface-subtle transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function VendorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'cab' | 'hotel'>('cab')
  const [tickets, setTickets] = useState<VendorTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function loadTickets(showLoader = false) {
    if (showLoader) setIsLoading(true)
    try {
      const token = getToken()
      const res = await fetch(
        `${BASE}/agents/cabhotel/tickets?airport_id=${user?.airport_id ?? 'DEL_T3'}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const data = await res.json()
      setTickets(data.tickets || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Vendor] Failed to fetch tickets:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTickets(true)
    const interval = setInterval(() => loadTickets(false), 10000)
    return () => clearInterval(interval)
  }, [])

  function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    setTickets(prev => prev.map(t =>
      t.ticket_id === ticketId ? { ...t, status: newStatus } : t
    ))
  }

  function handleResolved(ticketId: string) {
    setTickets(prev => prev.map(t =>
      t.ticket_id === ticketId ? { ...t, status: 'Resolved' as TicketStatus } : t
    ))
  }

  const cabTickets = tickets.filter(t => t.ticket_type === 'cab')
  const hotelTickets = tickets.filter(t => t.ticket_type === 'hotel')
  const activeTickets = activeTab === 'cab' ? cabTickets : hotelTickets
  const openCount = (tab: 'cab' | 'hotel') =>
    tickets.filter(t => t.ticket_type === tab && t.status !== 'Resolved').length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-base">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-surface-raised border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace/6e2001')}
            className="p-1.5 rounded-lg hover:bg-surface-subtle text-ink-muted hover:text-indigo-600 transition-colors"
            title="Back to Workspace"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Store size={15} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-ink-primary">Vendor Dashboard</h1>
            <p className="text-[10px] text-ink-muted font-mono -mt-0.5">
              {user?.name ?? 'Vendor'} · {user?.airport_id ?? 'DEL_T3'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-ink-muted font-mono">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={loadTickets} className="p-1 rounded hover:bg-surface-subtle text-ink-muted hover:text-indigo-600 transition-colors">
            <RefreshCw size={11} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-0 px-5 pt-3 border-b border-surface-border bg-surface-raised">
        {(['cab', 'hotel'] as const).map((tab) => {
          const Icon = tab === 'cab' ? Car : Hotel
          const count = openCount(tab)
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-[11px] font-display font-bold border-b-2 transition-all mr-2',
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-700'
                  : 'border-transparent text-ink-muted hover:text-ink-primary'
              )}
            >
              <Icon size={13} strokeWidth={2} />
              {tab === 'cab' ? 'Cab Requests' : 'Hotel Requests'}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-ink-muted">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-mono">Loading tickets...</span>
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-40">
            {activeTab === 'cab' ? <Car size={32} strokeWidth={1} /> : <Hotel size={32} strokeWidth={1} />}
            <span className="text-sm font-mono text-ink-muted">No {activeTab} requests yet</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTickets.map(ticket => (
              <TicketCard
                key={ticket.ticket_id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
                onResolve={handleResolved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}