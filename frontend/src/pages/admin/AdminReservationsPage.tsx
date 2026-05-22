import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reservationsApi } from '@/api/reservationsApi'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Spinner } from '@/components/UI/Spinner'
import { ReservationStatusBadge } from '@/components/UI/Badge'
import { format } from 'date-fns'
import type { ReservationStatus } from '@/types'

const STATUSES: Array<ReservationStatus | 'ALL'> = ['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

export function AdminReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reservations', status, page],
    queryFn: () => reservationsApi.getAll({
      status: status === 'ALL' ? undefined : status,
      page,
      size: 20,
    }),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{data?.totalElements ?? 0} total</span>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    {['User', 'Station / Charger', 'Start', 'End', 'Status', 'Est. Cost'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {data?.content.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{res.userFullName}</div>
                        <div className="text-xs text-gray-400">{res.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white">{res.stationName}</div>
                        <div className="text-xs text-gray-400">Charger #{res.chargerNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(res.startTime), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(res.endTime), 'h:mm a')}
                      </td>
                      <td className="px-4 py-3"><ReservationStatusBadge status={res.status} /></td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {res.estimatedCost ? `$${res.estimatedCost}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.content.length === 0 && (
                <div className="text-center py-12 text-gray-400">No reservations found</div>
              )}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {data.page + 1} of {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={data.first} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
