import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, AuthLayout } from '@/components/Layout/Layout'
import { useAuthStore } from '@/store/authStore'

import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HomePage } from '@/pages/HomePage'
import { MapPage } from '@/pages/MapPage'
import { StationDetailsPage } from '@/pages/StationDetailsPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { UserDashboardPage } from '@/pages/UserDashboardPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminStationsPage } from '@/pages/admin/AdminStationsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminReservationsPage } from '@/pages/admin/AdminReservationsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        </Route>

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/stations/:id" element={<StationDetailsPage />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />

          <Route path="/reserve/:chargerId" element={
            <RequireAuth><ReservationPage /></RequireAuth>
          } />
          <Route path="/dashboard" element={
            <RequireAuth><UserDashboardPage /></RequireAuth>
          } />

          <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
          <Route path="/admin/stations" element={<RequireAdmin><AdminStationsPage /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
          <Route path="/admin/reservations" element={<RequireAdmin><AdminReservationsPage /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
