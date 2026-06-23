import { Outlet } from 'react-router-dom'
import { NavRail } from '@/components/nav/NavRail'

/**
 * AppShell
 * ─────────
 * Full-height layout that houses the nav rail on the left
 * and renders child routes in the remaining space.
 *
 * Structure:
 *   [NavRail | <Outlet />]
 */
export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      {/* Left icon rail — always visible */}
      <NavRail />

      {/* Main content area — fills remaining space */}
      <main className="flex flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
