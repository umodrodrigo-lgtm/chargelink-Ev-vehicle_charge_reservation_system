import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationsApi } from '@/api/reservationsApi'
import { subscriptionsApi } from '@/api/subscriptionsApi'
import { usersApi } from '@/api/usersApi'
import { useAuthStore } from '@/store/authStore'
import { Card, CardTitle } from '@/components/UI/Card'
import { ReservationStatusBadge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Spinner } from '@/components/UI/Spinner'
import { Link } from 'react-router-dom'
import { Calendar, Zap, User, CreditCard, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export function UserDashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: reservations, isLoading: resLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => reservationsApi.getMyReservations({ size: 20 }),
  })

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.getMy(),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Reservation cancelled')
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Could not cancel')
    },
  })

  const activeCount = reservations?.content.filter(r => r.status === 'CONFIRMED' || r.status === 'ACTIVE').length ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName}!</p>
        </div>
        <Link to="/map">
          <Button><Zap className="w-4 h-4" /> Find Charger</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Reservations', value: activeCount, icon: <Calendar className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Reservations', value: reservations?.totalElements ?? 0, icon: <Calendar className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Current Plan', value: subscription?.plan.name ?? 'Free', icon: <CreditCard className="w-5 h-5 text-primary-500" />, color: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Account', value: user?.role ?? 'USER', icon: <User className="w-5 h-5 text-gray-500" />, color: 'bg-gray-50 dark:bg-gray-900/20' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}>
            <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>{icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Reservations */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>My Reservations</CardTitle>
          <Link to="/map" className="text-sm text-primary-600 hover:underline">New Reservation</Link>
        </div>

        {resLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : reservations?.content.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No reservations yet.</p>
            <Link to="/map" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
              Find a charger →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations?.content.map((res) => (
              <div key={res.id}
                className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {res.stationName} · #{res.chargerNumber}
                    </span>
                    <ReservationStatusBadge status={res.status} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />{res.stationAddress}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format(new Date(res.startTime), 'MMM d, h:mm a')} → {format(new Date(res.endTime), 'h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {res.estimatedCost && (
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                      ~${res.estimatedCost}
                    </span>
                  )}
                  {(res.status === 'CONFIRMED') && (
                    <Button
                      variant="danger" size="sm"
                      loading={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(res.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Subscription */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Subscription</CardTitle>
          <Link to="/subscriptions" className="text-sm text-primary-600 hover:underline">Manage</Link>
        </div>
        {subscription?.currentlyActive ? (
          <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <div>
              <div className="font-semibold text-primary-800 dark:text-primary-300">{subscription.plan.name} Plan</div>
              <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                Expires {subscription.endDate}
              </div>
            </div>
            <Zap className="w-6 h-6 text-primary-600" />
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p className="text-sm mb-3">You're on the Free plan.</p>
            <Link to="/subscriptions">
              <Button variant="secondary" size="sm">Upgrade Plan</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
