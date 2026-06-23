import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'kanban',  label: 'Kanban',  icon: LayoutDashboard, path: '/dashboard/kanban' },
  { id: 'manager', label: 'Manager', icon: Users,           path: '/dashboard/manager' },
]

export function DashboardLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-surface-base">
      <header
        className="shrink-0 flex items-center justify-between px-5 border-b border-surface-border bg-surface-raised"
        style={{ height: 'var(--header-height)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-base text-ink-primary tracking-wide">
            OPERATIONS DASHBOARD
          </span>
          {/* Tabs */}
          <div className="flex items-center gap-0.5 ml-4 bg-surface-base rounded-md p-0.5 border border-surface-border">
            {TABS.map(({ id, label, icon: Icon, path }) => (
              <NavLink
                key={id}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display font-semibold tracking-wide transition-all duration-150',
                    isActive
                      ? 'bg-surface-raised text-ink-primary shadow-card border border-surface-border'
                      : 'text-ink-muted hover:text-ink-secondary',
                  )
                }
              >
                <Icon size={12} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          aria-label="Close dashboard"
          className="rail-btn w-7 h-7 rounded text-ink-muted hover:text-status-alert"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
