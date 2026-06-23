/**
 * KanbanView.tsx — wired to AEROCORE v4 backend
 * Fetches real tasks from GET /dashboard/tasks
 * Supports per-flight filtering via dropdown
 */
import { useState, useCallback, useEffect } from 'react'
import { Plus, LayoutDashboard, AlertOctagon, CheckCircle2, Loader2, Eye, Inbox, RefreshCw, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OpsCard } from '@/components/ui/OpsCard'
import { acknowledgeTask, updateTaskStatus, type BackendTask } from '@/lib/api'
import { useTaskRealtime, type TaskRealtimePayload } from '@/lib/useRealtime'
import type { OpsCardData } from '@/components/ui/OpsCard'
import { useAuth } from '@/lib/auth'

export type KanbanColumnId = 'new' | 'acknowledged' | 'in-progress' | 'blocked' | 'done'

interface KanbanColumn {
  id: KanbanColumnId
  label: string
  icon: React.ElementType
  headerCls: string
  countCls: string
  bgCls: string
  borderCls: string
  backendStatus: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'new',          label: 'New',          icon: Inbox,        backendStatus: 'New',        headerCls: 'text-slate-600',  countCls: 'bg-slate-100 text-slate-500',   bgCls: 'bg-slate-50/50',  borderCls: 'border-slate-200'  },
  { id: 'acknowledged', label: 'Acknowledged', icon: Eye,          backendStatus: 'Ack',        headerCls: 'text-sky-700',    countCls: 'bg-sky-50 text-sky-600',        bgCls: 'bg-sky-50/30',    borderCls: 'border-sky-200'    },
  { id: 'in-progress',  label: 'In Progress',  icon: Loader2,      backendStatus: 'InProgress', headerCls: 'text-violet-700', countCls: 'bg-violet-50 text-violet-600',  bgCls: 'bg-violet-50/30', borderCls: 'border-violet-200' },
  { id: 'blocked',      label: 'Blocked',      icon: AlertOctagon, backendStatus: 'Blocked',    headerCls: 'text-red-600',    countCls: 'bg-red-50 text-red-500',        bgCls: 'bg-red-50/30',    borderCls: 'border-red-200'    },
  { id: 'done',         label: 'Done',         icon: CheckCircle2, backendStatus: 'Done',       headerCls: 'text-green-700',  countCls: 'bg-green-50 text-green-600',    bgCls: 'bg-green-50/30',  borderCls: 'border-green-200'  },
]

// Map backend task → OpsCardData
function toOpsCard(t: BackendTask): OpsCardData {
  const priorityMap: Record<string, OpsCardData['priority']> = {
    High: 'critical', Medium: 'high', Low: 'medium',
  }
  return {
    id: t.task_id,
    title: t.title,
    flight: t.flight_no ?? '',
    priority: priorityMap[t.priority_label ?? ''] ?? 'medium',
    category: (t.labels?.[1] ?? t.type ?? 'TASK').toUpperCase() as OpsCardData['category'],
    dueTime: t.sla_deadline_utc
  ? new Date(t.sla_deadline_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : '',
    notes: t.description ?? undefined,
    createdAt: t.created_at ? new Date(t.created_at).toLocaleString() : '',
  }
}

const ADVANCE_ORDER: KanbanColumnId[] = ['new', 'acknowledged', 'in-progress', 'done']
const BACKEND_STATUS_MAP: Record<KanbanColumnId, string> = {
  'new': 'Ack',
  'acknowledged': 'InProgress',
  'in-progress': 'Done',
  'blocked': 'InProgress',
  'done': 'Done',
}

function nextColumn(current: KanbanColumnId): KanbanColumnId | null {
  const idx = ADVANCE_ORDER.indexOf(current)
  if (idx === -1 || idx === ADVANCE_ORDER.length - 1) return null
  return ADVANCE_ORDER[idx + 1]
}

const FLIGHT_OPTIONS = [
  { value: 'ALL', label: 'All Flights' },
  { value: '6E2001', label: '6E2001' },
  { value: '6E2002', label: '6E2002' },
  { value: '6E2003', label: '6E2003' },
  { value: '6E2004', label: '6E2004' },
  { value: '6E2005', label: '6E2005' },
  { value: '6E245',  label: '6E245'  },
  { value: '6E301',  label: '6E301'  },
  { value: '6E512',  label: '6E512'  },
]

export function KanbanView() {
  const { user } = useAuth()
  const [cards, setCards] = useState<Record<KanbanColumnId, OpsCardData[]>>({
    new: [], acknowledged: [], 'in-progress': [], blocked: [], done: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [prevCols, setPrevCols] = useState<Record<string, KanbanColumnId>>({})
  const [selectedFlight, setSelectedFlight] = useState<string>('ALL')

  const airportId: string = user?.airport_id ?? 'DEL_T3'

  async function loadTasks() {
    setIsLoading(true)
    try {
      const flightFilter = selectedFlight !== 'ALL' ? selectedFlight : undefined
      const url = flightFilter
        ? `/dashboard/tasks?airport_id=${airportId}&flight_no=${flightFilter}`
        : `/dashboard/tasks?airport_id=${airportId}`

      const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
      const token = localStorage.getItem('aerocore_token')
      const res = await fetch(`${BASE}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      const newCards: Record<KanbanColumnId, OpsCardData[]> = {
        new:           (data.kanban.New        ?? []).map(toOpsCard),
        acknowledged:  (data.kanban.Ack        ?? []).map(toOpsCard),
        'in-progress': (data.kanban.InProgress ?? []).map(toOpsCard),
        blocked:       (data.kanban.Blocked    ?? []).map(toOpsCard),
        done:          (data.kanban.Done       ?? []).map(toOpsCard),
      }
      setCards(newCards)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Kanban] Failed to fetch tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 5000)
    return () => clearInterval(interval)
  }, [airportId, selectedFlight])

  function moveCard(cardId: string, toCol: KanbanColumnId) {
    setCards((prev) => {
      const next = { ...prev } as Record<KanbanColumnId, OpsCardData[]>
      let found: OpsCardData | null = null
      for (const [col, list] of Object.entries(next) as [KanbanColumnId, OpsCardData[]][]) {
        const idx = list.findIndex((c) => c.id === cardId)
        if (idx !== -1) {
          found = list[idx]
          next[col as KanbanColumnId] = list.filter((c) => c.id !== cardId)
          break
        }
      }
      if (found) next[toCol] = [...next[toCol], found]
      return next
    })
  }

  async function advanceCard(cardId: string) {
    for (const [col, list] of Object.entries(cards) as [KanbanColumnId, OpsCardData[]][]) {
      if (list.find((c) => c.id === cardId)) {
        const nextCol = nextColumn(col as KanbanColumnId)
        if (nextCol) {
          moveCard(cardId, nextCol)
          try {
            if (col === 'new') {
              await acknowledgeTask(cardId)
            } else {
              await updateTaskStatus(cardId, BACKEND_STATUS_MAP[col as KanbanColumnId])
            }
          } catch (err) {
            console.error('[Kanban] Failed to advance task:', err)
            moveCard(cardId, col as KanbanColumnId)
          }
        }
        return
      }
    }
  }

  function blockCard(cardId: string) {
    for (const [col, list] of Object.entries(cards) as [KanbanColumnId, OpsCardData[]][]) {
      if (list.find((c) => c.id === cardId)) {
        if (col !== 'blocked') {
          setPrevCols((p) => ({ ...p, [cardId]: col as KanbanColumnId }))
          moveCard(cardId, 'blocked')
        } else {
          const returnCol = prevCols[cardId] ?? 'in-progress'
          moveCard(cardId, returnCol)
          setPrevCols((p) => { const n = { ...p }; delete n[cardId]; return n })
        }
        return
      }
    }
  }

  const handleTaskChange = useCallback(
    (_payload: TaskRealtimePayload, eventType: 'INSERT' | 'UPDATE') => {
      if (eventType === 'INSERT' || eventType === 'UPDATE') loadTasks()
    }, [selectedFlight],
  )
  useTaskRealtime(handleTaskChange)

  const totalActive = Object.entries(cards)
    .filter(([id]) => id !== 'done')
    .reduce((sum, [, list]) => sum + list.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden" role="main" aria-label="Operations Kanban board">
      {/* Sub-header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-surface-raised border-b border-surface-border">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={13} className="text-indigo-500" strokeWidth={2} />
          <span className="text-[10px] font-display font-bold tracking-widest uppercase text-ink-muted">Ops Kanban</span>
          {isLoading
            ? <Loader2 size={11} className="animate-spin text-indigo-400 ml-1" />
            : <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded-full ml-1">{totalActive} active</span>
          }
        </div>

        <div className="flex items-center gap-2">
          {/* Flight filter */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-surface-border bg-surface-base">
            <Plane size={11} className="text-indigo-400" strokeWidth={2} />
            <select
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
              className="text-[11px] font-mono bg-transparent text-ink-primary outline-none cursor-pointer"
            >
              {FLIGHT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <span className="text-[9px] text-ink-muted font-mono">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={loadTasks}
            className="p-1 rounded hover:bg-surface-subtle text-ink-muted hover:text-indigo-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Flight badge when filtered */}
      {selectedFlight !== 'ALL' && (
        <div className="shrink-0 px-5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <Plane size={11} className="text-indigo-500" strokeWidth={2} />
          <span className="text-[11px] font-mono font-bold text-indigo-700">
            Showing tasks for Flight {selectedFlight}
          </span>
          <button
            onClick={() => setSelectedFlight('ALL')}
            className="ml-2 text-[10px] text-indigo-400 hover:text-indigo-700 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-0 min-w-max px-4 py-4">
          {COLUMNS.map((col, colIdx) => {
            const colCards = cards[col.id] ?? []
            const Icon = col.icon
            return (
              <div
                key={col.id}
                className={cn(
                  'flex flex-col w-[230px] shrink-0 rounded-xl border overflow-hidden',
                  colIdx < COLUMNS.length - 1 && 'mr-3',
                  col.bgCls, col.borderCls,
                )}
              >
                {/* Column header */}
                <div className={cn('flex items-center justify-between px-3 py-2.5 border-b', col.borderCls, 'bg-white/60')}>
                  <div className="flex items-center gap-2">
                    <Icon size={12} className={col.headerCls} strokeWidth={2} />
                    <span className={cn('text-[11px] font-display font-bold tracking-wide', col.headerCls)}>{col.label}</span>
                  </div>
                  <span className={cn('text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full', col.countCls)}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                  {colCards.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                      <Icon size={20} className={col.headerCls} strokeWidth={1.5} />
                      <span className="text-[10px] font-mono text-ink-muted">
                        {isLoading ? 'Loading…' : 'Empty'}
                      </span>
                    </div>
                  )}
                  {colCards.map((card) => (
                    <OpsCard
                      key={card.id}
                      card={card}
                      onAdvance={advanceCard}
                      onBlock={blockCard}
                      isBlocked={col.id === 'blocked'}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className={cn('shrink-0 p-2 border-t', col.borderCls)}>
                  <button className={cn(
                    'w-full py-1.5 rounded-md text-[10px] font-mono flex items-center justify-center gap-1 transition-all duration-150',
                    'text-ink-muted border border-dashed border-surface-border',
                    'hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50',
                  )}>
                    <Plus size={10} strokeWidth={2.5} />
                    Add task
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}