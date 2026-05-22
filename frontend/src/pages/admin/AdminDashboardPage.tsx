import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { stationsApi } from '@/api/stationsApi'
import { reservationsApi } from '@/api/reservationsApi'
import { usersApi } from '@/api/usersApi'
import { Card, CardTitle } from '@/components/UI/Card'
import { Spinner } from '@/components/UI/Spinner'
import { Button } from '@/components/UI/Button'
import { MapPin, Users, Calendar, Zap, Settings, ChevronRight } from 'lucide-react'
import { ReservationStatusBadge } from '@/components/UI/Badge'
import { format } from 'date-fns'

export function AdminDashboardPage() {
  const { data: stations } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: () => stationsApi.getAll({ size: 100 }),
  })

  const { data: reservations } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => reservationsApi.getAll({ size: 5 }),
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll({ size: 100 }),
  })

  const totalStations = stations?.totalElements ?? 0
  const totalReservations = reservations?.totalElements ?? 0
  const totalUsers = users?.totalElements ?? 0
  const activeReservations = reservations?.content.filter(r =>
    r.status === 'CONFIRMED' || r.status === 'ACTIVE').length ?? 0

  const adminLinks = [
    { to: '/admin/stations', label: 'Manage Stations', icon: <MapPin className="w-5 h-5" />, desc: 'Add and update charging stations' },
    { to: '/admin/users', label: 'Manage Users', icon: <Users className="w-5 h-5" />, desc: 'View and moderate user accounts' },
    { to: '/admin/reservations', label: 'Manage Reservations', icon: <Calendar className="w-5 h-5" />, desc: 'Monitor all booking activity' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">System overview and management</p>
        </div>
        <Settings className="w-6 h-6 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Stations', value: totalStations, icon: <MapPin className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Users', value: totalUsers, icon: <Users className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Total Reservations', value: totalReservations, icon: <Calendar className="w-5 h-5 text-primary-500" />, color: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Active Now', value: activeReservations, icon: <Zap className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-50 dark:bg-yellow-900/20' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}>
            <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>{icon}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {adminLinks.map(({ to, label, icon, desc }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600">{icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Reservations */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Reservations</CardTitle>
          <Link to="/admin/reservations">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {reservations?.content.slice(0, 5).map(res => (
            <div key={res.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {res.userFullName} → {res.stationName}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(res.startTime), 'MMM d, h:mm a')}
                </div>
              </div>
              <ReservationStatusBadge status={res.status} />
            </div>
          )) ?? <div className="text-center py-6 text-gray-400 text-sm">No data yet</div>}
        </div>
      </Card>
    </div>
  )
}
