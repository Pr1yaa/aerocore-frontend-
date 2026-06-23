import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Radio, Users, ChevronDown } from 'lucide-react'
import { cn, statusColor, statusDot } from '@/lib/utils'
import type { Flight } from '@/types'

interface WorkspaceHeaderProps {
  flight: Flight | null
}

export function WorkspaceHeader({ flight }: WorkspaceHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className="workspace-header shrink-0"
      role="banner"
      aria-label={flight ? `Flight ${flight.label} workspace` : 'Workspace'}
    >
      {/* Left — Flight title & meta */}
      <div className="flex items-center gap-3 min-w-0">
        {flight ? (
          <>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn('w-2 h-2 rounded-full', statusDot(flight.status))}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-[10px] font-mono uppercase tracking-wider font-bold',
                  statusColor(flight.status),
                )}
              >
                {flight.status}
              </span>
            </div>

            <span className="w-px h-4 bg-surface-border shrink-0" aria-hidden="true" />

            <h1 className="font-display font-bold text-lg text-ink-primary tracking-wide leading-none truncate">
              FLIGHT {flight.label}
            </h1>

            <span className="text-[13px] text-ink-secondary font-mono shrink-0 hidden sm:block">
              {flight.route}
            </span>

            <div className="flex items-center gap-1 ml-1 text-ink-muted shrink-0 hidden md:flex">
              <Users size={13} strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[11px] font-mono">6 crew</span>
            </div>

            {/* Live badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-info/10 border border-status-info/30 shrink-0"
              aria-label="Live operations"
            >
              <Radio size={11} className="text-status-info animate-pulse" strokeWidth={2} aria-hidden="true" />
              <span className="text-[10px] font-mono font-bold text-status-info">LIVE</span>
            </div>
          </>
        ) : (
          <h1 className="font-display font-bold text-lg text-ink-primary">Select a Flight</h1>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
        {flight && (
          <button
            aria-label={`Flight ${flight.label} options`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary border border-surface-border hover:border-indigo-400/60 hover:text-indigo-600 transition-all duration-150 font-mono"
          >
            <span>{flight.label}</span>
            <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
          </button>
        )}

        <button
          onClick={() => navigate('/dashboard/kanban')}
          aria-label="Open dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-display font-semibold tracking-wide text-ink-primary border border-surface-border bg-surface-overlay hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all duration-200"
        >
          <LayoutDashboard size={13} strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline">DASHBOARD</span>
        </button>
      </div>
    </header>
  )
}
