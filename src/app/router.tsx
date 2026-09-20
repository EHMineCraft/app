import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { WorldSelectPage } from '../features/worlds/pages/WorldSelectPage'
import { MapPage } from '../features/map/pages/MapPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/worlds" replace /> },
      { path: 'login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'worlds', element: <WorldSelectPage /> },
          { path: 'worlds/:worldId/map', element: <MapPage /> },
        ],
      },
    ],
  },
])
