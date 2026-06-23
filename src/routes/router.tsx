import { VendorDashboard } from '@/pages/vendor/VendorDashboard'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { WorkspacePage } from '@/pages/workspace/WorkspacePage'
import { QAgentPage } from '@/pages/qagent/QAgentPage'
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout'
import { KanbanView } from '@/pages/dashboard/KanbanView'
import { ManagerView } from '@/pages/dashboard/ManagerView'
import { LoginPage } from '@/pages/login/LoginPage'
import { MOCK_FLIGHTS } from '@/lib/mock-data'
import { getToken } from '@/lib/api'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return <>{children}</>
}

const defaultFlightId = MOCK_FLIGHTS[0].id

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
  path: 'vendor',
  element: <VendorDashboard />,
},
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      {
        index: true,
        element: <Navigate to={`/workspace/${defaultFlightId}`} replace />,
      },
      {
        path: 'workspace/:flightId',
        element: <WorkspacePage />,
      },
      {
        path: 'qagent',
        element: <QAgentPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="kanban" replace /> },
          { path: 'kanban', element: <KanbanView /> },
          { path: 'manager', element: <ManagerView /> },
        ],
      },
      {
        path: '*',
        element: <Navigate to={`/workspace/${defaultFlightId}`} replace />,
      },
    ],
  },
])
