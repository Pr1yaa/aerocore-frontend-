import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, MessagesSquare, Users, CalendarDays, Phone, Bot, Store,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/mock-data'
import { ConnectionBadge } from '@/components/ui/ConnectionBadge'
import type { NavItem } from '@/types'

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Bell, MessagesSquare, Users, CalendarDays, Phone, Bot, Store,
}

function NavIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon {...props} />
}

function QAgentButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="QAgent — AI Ops Assistant"
      aria-label="QAgent AI Assistant"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        active
          ? 'bg-indigo-600 shadow-glow-violet text-white'
          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-glow-violet',
      )}
    >
      <Bot size={18} strokeWidth={1.8} />
      {!active && (
        <span
          className="absolute inset-0 rounded-md ring-1 ring-indigo-400/50 animate-pulse-dot"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  const navigate = useNavigate()

  if (item.id === 'qagent') {
    return (
      <li>
        <QAgentButton active={active} onClick={() => navigate(item.path)} />
      </li>
    )
  }

  return (
    <li>
      <button
        onClick={() => item.path !== '#' && navigate(item.path)}
        title={item.label}
        aria-label={item.label + (item.badge ? `, ${item.badge} notifications` : '')}
        aria-current={active ? 'page' : undefined}
        disabled={item.path === '#'}
        className={cn(
          'rail-btn',
          active && 'active',
          item.path === '#' && 'cursor-not-allowed opacity-40',
        )}
      >
        <NavIcon name={item.icon} size={18} strokeWidth={1.8} />
        {item.badge ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-status-alert text-[9px] font-mono font-bold text-white leading-none"
          >
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        ) : null}
      </button>
    </li>
  )
}

export function NavRail() {
  const location = useLocation()

  const isActive = (item: NavItem) => {
    if (item.path === '#') return false
    return location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'))
  }

  const topItems = NAV_ITEMS.slice(0, 5)
  const bottomItems = NAV_ITEMS.slice(5)

  return (
    <nav
      className="relative z-10 flex flex-col items-center py-3 gap-1 bg-surface-raised shadow-rail shrink-0"
      style={{ width: 'var(--rail-width)' }}
      aria-label="Primary navigation"
    >
      {/* Logo mark */}
      <div className="flex items-center justify-center w-10 h-10 mb-2" aria-label="CrewOps">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <path
            d="M13 2L22 20H4L13 2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-indigo-500"
          />
          <path
            d="M13 8L18 18H8L13 8Z"
            fill="currentColor"
            className="text-indigo-600"
          />
        </svg>
      </div>

      <div className="w-7 h-px bg-surface-border mb-1" aria-hidden="true" />

      <ul className="flex flex-col items-center gap-1" role="list">
        {topItems.map((item) => (
          <RailItem key={item.id} item={item} active={isActive(item)} />
        ))}
      </ul>

      <div className="flex-1" />

      <div className="w-7 h-px bg-surface-border mb-2" aria-hidden="true" />
      <ul className="flex flex-col items-center gap-1 mb-2" role="list">
        {bottomItems.map((item) => (
          <RailItem key={item.id} item={item} active={isActive(item)} />
        ))}
      </ul>

      {/* Connection badge */}
      <div className="mb-1">
        <ConnectionBadge />
      </div>

      {/* User avatar */}
      <button
        aria-label="User profile — Arnav Kumar, Ops Controller"
        title="Arnav Kumar · Ops Controller"
        className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center mt-1 hover:border-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <span className="text-[10px] font-display font-bold text-indigo-700" aria-hidden="true">AK</span>
      </button>
    </nav>
  )
}
