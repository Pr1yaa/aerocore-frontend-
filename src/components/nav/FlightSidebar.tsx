import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, ChevronRight, Plane, AlertCircle, RefreshCw } from 'lucide-react'
import { cn, statusDot } from '@/lib/utils'
import { useFlights } from '@/lib/useFlights'
import type { Flight } from '@/types'

// ── Channel Item ─────────────────────────────────────────────────────
function ChannelItem({ flight, active }: { flight: Flight; active: boolean }) {
  const navigate = useNavigate()

  return (
    <li>
      <button
        onClick={() => navigate(`/workspace/${flight.id}`)}
        className={cn('channel-item w-full text-left group', active && 'active')}
        aria-current={active ? 'page' : undefined}
        aria-label={`Flight ${flight.label}, ${flight.route}, status ${flight.status}${flight.unread ? `, ${flight.unread} unread` : ''}`}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot(flight.status))} aria-hidden="true" />

        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium font-mono truncate">{flight.label}</span>
          <span className="block text-[10px] text-ink-muted truncate mt-0.5">{flight.route}</span>
        </span>

        {flight.unread && flight.unread > 0 ? (
          <span
            aria-label={`${flight.unread} unread`}
            className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-[10px] font-bold text-white font-mono"
          >
            {flight.unread > 9 ? '9+' : flight.unread}
          </span>
        ) : (
          <ChevronRight size={12} className="text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        )}
      </button>
    </li>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col">
      <span className={cn('text-[13px] font-mono font-bold leading-none', color)}>{value}</span>
      <span className="text-[9px] text-ink-muted mt-0.5">{label}</span>
    </div>
  )
}

// ── Skeleton loader ──────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 pt-2" aria-label="Loading flights" role="status">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-[46px] rounded-md bg-surface-subtle animate-pulse" />
      ))}
    </div>
  )
}

// ── FlightSidebar ────────────────────────────────────────────────────
export function FlightSidebar() {
  const { flightId } = useParams<{ flightId: string }>()
  const [query, setQuery] = useState('')
  const { flights, loading, error, refetch } = useFlights()

  const filtered = flights.filter(
    (f) =>
      f.label.toLowerCase().includes(query.toLowerCase()) ||
      f.route.toLowerCase().includes(query.toLowerCase()),
  )

  const hasUnread = flights.filter((f) => (f.unread ?? 0) > 0)
  const hasAttention = flights.filter((f) => f.status === 'delayed' || f.status === 'cancelled')

  const onTimeCount = flights.filter((f) => f.status === 'on-time').length
  const delayedCount = flights.filter((f) => f.status === 'delayed').length
  const boardingCount = flights.filter((f) => f.status === 'boarding').length

  return (
    <aside
      className="flex flex-col bg-surface-raised border-r border-surface-border shrink-0 animate-slide-in-left"
      style={{ width: 'var(--sidebar-width)' }}
      aria-label="Flight channels"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Plane size={13} className="text-indigo-500" strokeWidth={2} aria-hidden="true" />
          <span className="text-label">Flights</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasUnread.length > 0 && (
            <span
              aria-label={`${hasUnread.length} flights with unread messages`}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-mono font-bold text-white"
            >
              {hasUnread.length}
            </span>
          )}
          {error && (
            <button
              onClick={refetch}
              title="Retry loading flights"
              aria-label="Retry loading flights"
              className="w-5 h-5 flex items-center justify-center text-ink-muted hover:text-indigo-500 transition-colors"
            >
              <RefreshCw size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-surface-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-base border border-surface-border text-ink-muted focus-within:border-indigo-400 transition-colors">
          <Search size={12} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            placeholder="Find flight…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search flights"
            className="flex-1 bg-transparent text-xs font-sans text-ink-secondary placeholder:text-ink-muted outline-none w-full"
          />
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center gap-2 mx-2 mt-2 px-3 py-2 rounded-md bg-red-50 border border-red-200" role="alert">
          <AlertCircle size={12} className="text-red-500 shrink-0" />
          <span className="text-[11px] text-red-600">Failed to load flights</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SidebarSkeleton />
      ) : (
        <>
          {/* Attention section */}
          {hasAttention.length > 0 && !query && (
            <>
              <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-alert animate-pulse-dot" aria-hidden="true" />
                <span className="text-label text-status-alert">Needs Attention</span>
              </div>
              <ul className="px-2 pb-1 space-y-0.5" role="list">
                {hasAttention.map((flight) => (
                  <ChannelItem key={flight.id} flight={flight} active={flight.id === flightId} />
                ))}
              </ul>
              <div className="mx-3 h-px bg-surface-border my-1" />
            </>
          )}

          {/* All flights */}
          <div className="px-3 pt-2 pb-1">
            <span className="text-label">All Flights</span>
          </div>

          <ul className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5" role="list">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center">
                <p className="text-xs text-ink-muted">
                  {query ? 'No flights match your search' : 'No flights available'}
                </p>
              </li>
            ) : (
              filtered.map((flight) => (
                <ChannelItem key={flight.id} flight={flight} active={flight.id === flightId} />
              ))
            )}
          </ul>
        </>
      )}

      {/* Footer summary */}
      <div className="border-t border-surface-border px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-label">Today</span>
          <span className="text-[10px] font-mono text-ink-muted">{flights.length} flights</span>
        </div>
        <div className="flex gap-3">
          <Stat label="On-time"  value={onTimeCount}  color="text-status-ok"   />
          <Stat label="Delayed"  value={delayedCount}  color="text-status-warn"  />
          <Stat label="Boarding" value={boardingCount} color="text-status-info"  />
        </div>
      </div>
    </aside>
  )
}
