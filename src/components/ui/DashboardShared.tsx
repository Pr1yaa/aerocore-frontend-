import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MessageCategory } from '@/types'

// ── Priority Badge ────────────────────────────────────────────────────
export type Priority = 'critical' | 'high' | 'medium' | 'low'

const PRIORITY_CFG: Record<Priority, { label: string; cls: string; dot: string }> = {
  critical: { label: 'CRITICAL', cls: 'bg-red-50 text-red-700 border-red-300',    dot: 'bg-red-500'    },
  high:     { label: 'HIGH',     cls: 'bg-orange-50 text-orange-700 border-orange-300', dot: 'bg-orange-500' },
  medium:   { label: 'MED',      cls: 'bg-amber-50 text-amber-700 border-amber-300',    dot: 'bg-amber-400'  },
  low:      { label: 'LOW',      cls: 'bg-slate-50 text-slate-500 border-slate-200',    dot: 'bg-slate-400'  },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CFG[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[9px] font-display font-bold tracking-widest px-1.5 py-0.5 rounded border', cfg.cls)}>
      <span className={cn('w-1 h-1 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ── Category Tag ──────────────────────────────────────────────────────
const TAG_STYLE: Partial<Record<MessageCategory | string, string>> = {
  ALERT:      'bg-red-50 text-red-600 border-red-200',
  ESCALATION: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVAL:   'bg-sky-50 text-sky-700 border-sky-200',
  TASK:       'bg-violet-50 text-violet-700 border-violet-200',
  HOTEL:      'bg-teal-50 text-teal-700 border-teal-200',
  CAB:        'bg-orange-50 text-orange-700 border-orange-200',
  LEAVE:      'bg-pink-50 text-pink-700 border-pink-200',
  SUPPORT:    'bg-green-50 text-green-700 border-green-200',
  INFO:       'bg-slate-50 text-slate-600 border-slate-200',
  QUERY:      'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export function CategoryTag({ tag }: { tag: string }) {
  return (
    <span className={cn('text-[9px] font-display font-bold tracking-widest px-1.5 py-0.5 rounded border', TAG_STYLE[tag] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
      {tag}
    </span>
  )
}

// ── Status Pill ───────────────────────────────────────────────────────
export type StatusPill = 'new' | 'acknowledged' | 'in-progress' | 'blocked' | 'done'

const STATUS_CFG: Record<StatusPill, { label: string; cls: string; dot: string }> = {
  'new':          { label: 'New',          cls: 'bg-slate-100 text-slate-600',      dot: 'bg-slate-400'    },
  'acknowledged': { label: 'Acknowledged', cls: 'bg-sky-50 text-sky-700',          dot: 'bg-sky-500'      },
  'in-progress':  { label: 'In Progress',  cls: 'bg-violet-50 text-violet-700',    dot: 'bg-violet-500'   },
  'blocked':      { label: 'Blocked',      cls: 'bg-red-50 text-red-600',          dot: 'bg-red-500'      },
  'done':         { label: 'Done',         cls: 'bg-green-50 text-green-700',      dot: 'bg-green-500'    },
}

export function StatusPillBadge({ status }: { status: StatusPill }) {
  const cfg = STATUS_CFG[status]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full', cfg.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ── Section Header ────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon?: LucideIcon
  label: string
  count?: number
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ icon: Icon, label, count, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={13} className="text-indigo-500" strokeWidth={2} />}
        <span className="text-label">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Metric Card ───────────────────────────────────────────────────────
interface MetricCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  trend?: string
  trendUp?: boolean
  colorClass: string
  bgClass: string
}

export function MetricCard({ icon: Icon, value, label, trend, trendUp, colorClass, bgClass }: MetricCardProps) {
  return (
    <div className={cn('panel p-4 flex flex-col gap-2 border', bgClass)}>
      <div className="flex items-start justify-between">
        <Icon size={16} className={colorClass} strokeWidth={1.8} />
        {trend && (
          <span className={cn('text-[9px] font-mono font-bold', trendUp ? 'text-status-ok' : 'text-status-alert')}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <span className={cn('text-2xl font-display font-bold leading-none', colorClass)}>{value}</span>
      <span className="text-xs text-ink-secondary">{label}</span>
    </div>
  )
}

// ── Assignee Avatar ───────────────────────────────────────────────────
export function AssigneeAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[10px]'
  // Deterministic color from name
  const colors = [
    'bg-indigo-100 border-indigo-200 text-indigo-700',
    'bg-violet-100 border-violet-200 text-violet-700',
    'bg-teal-100 border-teal-200 text-teal-700',
    'bg-pink-100 border-pink-200 text-pink-700',
    'bg-sky-100 border-sky-200 text-sky-700',
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  return (
    <div className={cn('rounded-full border flex items-center justify-center font-display font-bold shrink-0', sizeClass, colors[colorIdx])}>
      {initials}
    </div>
  )
}
