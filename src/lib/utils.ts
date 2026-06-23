import { clsx, type ClassValue } from 'clsx'

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/** Format ISO timestamp to HH:MM */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Format ISO timestamp to relative string */
export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/** Get status colour utility classes */
export function statusColor(status: string): string {
  const map: Record<string, string> = {
    'on-time':   'text-status-ok',
    'boarding':  'text-status-info',
    'delayed':   'text-status-warn',
    'departed':  'text-ink-secondary',
    'landed':    'text-ink-muted',
    'cancelled': 'text-status-alert',
  }
  return map[status] ?? 'text-ink-secondary'
}

/** Get status dot colour */
export function statusDot(status: string): string {
  const map: Record<string, string> = {
    'on-time':   'bg-status-ok',
    'boarding':  'bg-status-info',
    'delayed':   'bg-status-warn',
    'departed':  'bg-ink-secondary',
    'landed':    'bg-ink-muted',
    'cancelled': 'bg-status-alert',
  }
  return map[status] ?? 'bg-ink-muted'
}
