/**
 * ManagerView.tsx — wired to AEROCORE v4 backend
 * Fetches real leave requests, approves with backup selection, rejects
 */
import { useState, useCallback, useEffect } from 'react'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Plane,
  UserCheck, CalendarOff, ArrowRightLeft, ChevronRight, Shield,
  X, Check, Loader2, RefreshCw,
} from 'lucide-react'
import { cn, statusDot, statusColor } from '@/lib/utils'
import { useFlights } from '@/lib/useFlights'
import { MOCK_FLIGHTS } from '@/lib/mock-data'
import { useLeaveRealtime, type LeaveRealtimePayload } from '@/lib/useRealtime'
import { MetricCard, SectionHeader, AssigneeAvatar, PriorityBadge, CategoryTag } from '@/components/ui/DashboardShared'
import { getToken } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const STATS = [
  { label: 'Active Flights',   value: '5',  icon: TrendingUp,    colorClass: 'text-status-info',  bgClass: 'bg-sky-50 border-sky-200',     trend: '+1', trendUp: true  },
  { label: 'Crew On Duty',     value: '32', icon: Users,         colorClass: 'text-status-ok',    bgClass: 'bg-green-50 border-green-200'                               },
  { label: 'Open Escalations', value: '3',  icon: AlertTriangle, colorClass: 'text-status-warn',  bgClass: 'bg-amber-50 border-amber-200', trend: '+2', trendUp: false },
  { label: 'Tasks Resolved',   value: '18', icon: CheckCircle,   colorClass: 'text-status-ok',    bgClass: 'bg-green-50 border-green-200', trend: '6h', trendUp: true  },
]

const CREW = [
  { name: 'Capt. Arvind Sharma',  flight: '6E2001', role: 'Captain',         hours: '8h 12m', status: 'BOARDING' },
  { name: 'F/O Rekha Nair',       flight: '6E2003', role: 'First Officer',   hours: '9h 20m', status: 'DELAYED'  },
  { name: 'Cabin Lead Raj Kumar', flight: '6E2001', role: 'Cabin Crew Lead', hours: '7h 45m', status: 'BOARDING' },
  { name: 'Capt. Mehul Desai',    flight: '6E2002', role: 'Captain',         hours: '5h 30m', status: 'ON-TIME'  },
  { name: 'F/O Priya Singh',      flight: '6E2005', role: 'First Officer',   hours: '6h 10m', status: 'ON-TIME'  },
]

const SUBSTITUTIONS = [
  { id: 's1', for: 'F/O Rekha Nair',       flight: '6E2003', suggested: 'F/O Ankit Mehta',    hours: '4h 20m', rating: 98, reason: 'Type-rated A320, base HYD, within FDP limits'       },
  { id: 's2', for: 'Cabin Lead Raj Kumar', flight: '6E2001', suggested: 'Sr. CC Divya Rajan', hours: '3h 10m', rating: 95, reason: 'Senior cabin crew, same seniority band, BOM base'    },
  { id: 's3', for: 'Capt. Mehul Desai',    flight: '6E2002', suggested: 'Capt. Sunita Rao',   hours: '2h 45m', rating: 99, reason: 'Type-rated A320/321, base BOM, available immediately' },
]

const DUTY_LIMIT = 10 * 60
function parseMins(h: string) {
  const [hrs, mins] = h.replace('m', '').split('h ').map(Number)
  return hrs * 60 + (mins || 0)
}

interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  designation: string
  department: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  reason: string
  backup_assigned_to: string | null
  backup_name: string | null
}

interface StaffMember {
  id: string
  name: string
  role: string
  designation: string
  employee_id: string
}

function daysBetween(start: string, end: string): number {
  try {
    const s = new Date(start)
    const e = new Date(end)
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  } catch { return 1 }
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return d }
}

function priorityFromLeave(leave: LeaveRequest): 'high' | 'medium' | 'low' {
  if (leave.leave_type?.toLowerCase().includes('emergency') || leave.leave_type?.toLowerCase().includes('medical')) return 'high'
  if (leave.leave_type?.toLowerCase().includes('sick')) return 'medium'
  return 'low'
}

// ── Leave Card ─────────────────────────────────────────────────────────
function LeaveCard({
  leave,
  staff,
  onApprove,
  onReject,
  busy,
}: {
  leave: LeaveRequest
  staff: StaffMember[]
  onApprove: (id: string, backupId: string) => void
  onReject: (id: string) => void
  busy?: boolean
}) {
  const [showBackup, setShowBackup] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState('')
  const isPending = leave.status === 'Pending'
  const days = daysBetween(leave.start_date, leave.end_date)
  const priority = priorityFromLeave(leave)

  const otherStaff = staff.filter(s => s.id !== leave.employee_id)

  return (
    <article className={cn(
      'panel p-4 flex flex-col gap-3 transition-all duration-200',
      leave.status === 'Approved' && 'border-green-200 bg-green-50/30',
      leave.status === 'Rejected' && 'border-red-100 bg-red-50/20 opacity-60',
    )}>
      <div className="flex items-start gap-3">
        <AssigneeAvatar name={leave.employee_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-primary truncate">{leave.employee_name}</p>
            <PriorityBadge priority={priority} />
          </div>
          <p className="text-[10px] text-ink-muted font-mono mt-0.5">
            {leave.designation || leave.department || 'Staff'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <CategoryTag tag="LEAVE" />
        <span className="text-[10px] font-display font-semibold text-ink-secondary capitalize">
          {leave.leave_type?.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] text-ink-muted font-mono ml-auto">
          {formatDate(leave.start_date)} – {formatDate(leave.end_date)} ({days}d)
        </span>
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed bg-surface-subtle rounded-md px-3 py-2">
        {leave.reason || 'No reason provided.'}
      </p>

      {leave.backup_name && leave.status === 'Approved' && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
          <UserCheck size={11} strokeWidth={2} />
          Backup: {leave.backup_name}
        </div>
      )}

      {isPending ? (
        <div className="flex flex-col gap-2">
          {!showBackup ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBackup(true)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-display font-semibold tracking-wide transition-colors active:scale-95 disabled:opacity-60"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                Approve
              </button>
              <button
                onClick={() => onReject(leave.id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-display font-semibold tracking-wide transition-colors active:scale-95 disabled:opacity-60"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2.5} />}
                Reject
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-[10px] font-display font-bold text-indigo-700 uppercase tracking-wide">
                Select backup employee
              </p>
              <select
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-indigo-200 text-[11px] font-mono bg-white outline-none focus:border-indigo-400"
              >
                <option value="">-- Select backup --</option>
                {otherStaff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.designation ? `· ${s.designation}` : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedBackup) onApprove(leave.id, selectedBackup)
                  }}
                  disabled={!selectedBackup || busy}
                  className="flex-1 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold disabled:opacity-50 transition-all"
                >
                  {busy ? <Loader2 size={11} className="animate-spin mx-auto" /> : 'Confirm Approval'}
                </button>
                <button
                  onClick={() => setShowBackup(false)}
                  className="flex-1 py-1.5 rounded-md border border-surface-border text-[11px] text-ink-muted hover:bg-surface-subtle transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={cn(
          'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-display font-semibold tracking-wide',
          leave.status === 'Approved'
            ? 'text-green-700 bg-green-50 border border-green-200'
            : 'text-red-600 bg-red-50 border border-red-200',
        )}>
          {leave.status === 'Approved' ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
          {leave.status}
        </div>
      )}
    </article>
  )
}

// ── Substitution Card ──────────────────────────────────────────────────
function SubCard({ sub }: { sub: typeof SUBSTITUTIONS[0] }) {
  const [accepted, setAccepted] = useState<boolean | null>(null)
  return (
    <article className={cn(
      'panel p-3.5 flex flex-col gap-3 transition-all duration-200',
      accepted === true && 'border-green-200 bg-green-50/30',
      accepted === false && 'opacity-50',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted">Replacing</p>
          <p className="text-xs font-medium text-ink-secondary mt-0.5">{sub.for}</p>
          <span className="text-[9px] font-mono text-indigo-500">{sub.flight}</span>
        </div>
        <ChevronRight size={14} className="text-ink-muted mt-1 shrink-0" strokeWidth={1.5} />
        <div className="text-right">
          <p className="text-[9px] font-display font-bold tracking-widest uppercase text-ink-muted">Suggested</p>
          <p className="text-xs font-medium text-ink-primary mt-0.5">{sub.suggested}</p>
          <span className="text-[9px] font-mono text-ink-muted">{sub.hours} duty</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Shield size={10} className="text-green-600" strokeWidth={2} />
        <p className="text-[10px] text-ink-secondary leading-relaxed flex-1">{sub.reason}</p>
        <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded shrink-0">
          {sub.rating}%
        </span>
      </div>
      {accepted === null ? (
        <div className="flex items-center gap-2">
          <button onClick={() => setAccepted(true)} className="flex-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-display font-bold tracking-wide transition-colors active:scale-95">Accept</button>
          <button onClick={() => setAccepted(false)} className="flex-1 py-1.5 rounded-md border border-surface-border text-ink-muted text-[10px] font-display font-bold tracking-wide hover:border-indigo-300 hover:text-indigo-600 transition-colors active:scale-95">Decline</button>
        </div>
      ) : (
        <div className={cn('text-center text-[10px] font-display font-bold tracking-wide py-1.5 rounded-md', accepted ? 'text-green-700 bg-green-50 border border-green-200' : 'text-ink-muted border border-surface-border')}>
          {accepted ? '✓ Substitution Accepted' : 'Declined'}
        </div>
      )}
    </article>
  )
}

// ── ManagerView ────────────────────────────────────────────────────────
export function ManagerView() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [busyLeave, setBusyLeave] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { flights: liveFlights } = useFlights()
  const flightsToShow = liveFlights.length > 0 ? liveFlights : MOCK_FLIGHTS
  const airportId = user?.airport_id ?? 'DEL_T3'

  async function fetchLeaves() {
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/dashboard/manager/leave-requests?airport_id=${airportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLeaves(data.leave_requests || [])
    } catch (err) {
      console.error('[Manager] Failed to fetch leaves:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchStaff() {
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/dashboard/manager/staff?airport_id=${airportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStaff(data.staff || [])
    } catch (err) {
      console.error('[Manager] Failed to fetch staff:', err)
    }
  }

  useEffect(() => {
    fetchLeaves()
    fetchStaff()
  }, [])

  async function handleApprove(id: string, backupId: string) {
    setBusyLeave(id)
    try {
      const token = getToken()
      await fetch(`${BASE}/agents/roster/confirm-assignment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_request_id: id, backup_employee_id: backupId })
      })
      const backupName = staff.find(s => s.id === backupId)?.name ?? 'Staff'
      setLeaves(prev => prev.map(l => l.id === id
        ? { ...l, status: 'Approved', backup_assigned_to: backupId, backup_name: backupName }
        : l
      ))
    } catch (err) {
      console.error('[Manager] Approve failed:', err)
    } finally {
      setBusyLeave(null)
    }
  }

  async function handleReject(id: string) {
    setBusyLeave(id)
    try {
      const token = getToken()
      await fetch(`${BASE}/dashboard/manager/leave-requests/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' } : l))
    } catch (err) {
      console.error('[Manager] Reject failed:', err)
    } finally {
      setBusyLeave(null)
    }
  }

  const handleLeaveChange = useCallback((payload: LeaveRealtimePayload) => {
    setLeaves(prev => prev.map(l => l.id === payload.id ? { ...l, status: payload.status } : l))
  }, [])
  useLeaveRealtime(handleLeaveChange)

  const pendingCount = leaves.filter(l => l.status === 'Pending').length

  return (
    <div className="p-5 flex flex-col gap-5 overflow-auto h-full">
      {/* Metric row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => <MetricCard key={s.label} {...s} />)}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left col — Leave Queue */}
        <div className="flex flex-col gap-5">
          <section>
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionHeader
                  icon={CalendarOff}
                  label="Leave Approval Queue"
                  count={pendingCount}
                  action={
                    <span className="text-[9px] font-mono text-ink-muted">
                      {leaves.filter(l => l.status === 'Approved').length} approved today
                    </span>
                  }
                />
                <button
                  onClick={() => { setIsLoading(true); fetchLeaves() }}
                  className="p-1 rounded hover:bg-surface-subtle text-ink-muted hover:text-indigo-600 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={11} strokeWidth={2} />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-ink-muted">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs font-mono">Loading leave requests...</span>
                </div>
              ) : leaves.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-ink-muted">No leave requests found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {leaves.map(leave => (
                    <LeaveCard
                      key={leave.id}
                      leave={leave}
                      staff={staff}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      busy={busyLeave === leave.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-5">
          {/* Substitution suggestions */}
          <section>
            <div className="panel p-4">
              <SectionHeader
                icon={ArrowRightLeft}
                label="Substitution Suggestions"
                count={SUBSTITUTIONS.length}
                action={
                  <span className="text-[9px] font-mono text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                    AI Recommended
                  </span>
                }
              />
              <div className="flex flex-col gap-3">
                {SUBSTITUTIONS.map(sub => <SubCard key={sub.id} sub={sub} />)}
              </div>
            </div>
          </section>

          {/* Flight summary */}
          <section>
            <div className="panel p-4">
              <SectionHeader icon={Plane} label="Flight Status Overview" />
              <div className="flex flex-col gap-1">
                {flightsToShow.map(flight => (
                  <div key={flight.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', statusDot(flight.status))} />
                      <span className="text-sm font-mono font-medium text-ink-primary">{flight.label}</span>
                      <span className="text-xs text-ink-muted">{flight.route}</span>
                    </div>
                    <span className={cn('text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-surface-subtle', statusColor(flight.status))}>
                      {flight.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Crew duty hours */}
          <section>
            <div className="panel p-4">
              <SectionHeader icon={Clock} label="Crew Duty Hours" action={<span className="text-[9px] font-mono text-ink-muted">Limit: 10h</span>} />
              <div className="flex flex-col gap-3">
                {CREW.map(crew => {
                  const mins = parseMins(crew.hours)
                  const pct = Math.min((mins / DUTY_LIMIT) * 100, 100)
                  const isWarning = pct >= 85
                  const isCritical = pct >= 95
                  return (
                    <div key={crew.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <AssigneeAvatar name={crew.name} size="sm" />
                          <div>
                            <span className="text-xs font-medium text-ink-primary">{crew.name}</span>
                            <span className="text-[10px] text-ink-muted ml-1.5 font-mono">{crew.role} · {crew.flight}</span>
                          </div>
                        </div>
                        <span className={cn('text-[11px] font-mono font-bold', isCritical ? 'text-status-alert' : isWarning ? 'text-status-warn' : 'text-ink-secondary')}>
                          {crew.hours}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', isCritical ? 'bg-status-alert' : isWarning ? 'bg-status-warn' : 'bg-status-ok')} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Crew directory */}
          <section>
            <div className="panel p-4">
              <SectionHeader icon={UserCheck} label="On-Duty Crew" count={CREW.length} />
              <div className="flex flex-col gap-2">
                {CREW.map(crew => (
                  <div key={crew.name} className="flex items-center gap-3 py-1.5 border-b border-surface-border last:border-0">
                    <AssigneeAvatar name={crew.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-primary truncate">{crew.name}</p>
                      <p className="text-[10px] text-ink-muted font-mono">{crew.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{crew.flight}</span>
                      <span className={cn('text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full',
                        crew.status === 'BOARDING' ? 'text-sky-700 bg-sky-50' :
                        crew.status === 'DELAYED'  ? 'text-status-warn bg-amber-50' :
                                                     'text-status-ok bg-green-50'
                      )}>
                        {crew.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}