import { clsx } from 'clsx'
import type { ChargerStatus, ReservationStatus, StationStatus } from '@/types'

interface BadgeProps { label: string; className?: string }

export function Badge({ label, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      className,
    )}>
      {label}
    </span>
  )
}

export function ChargerStatusBadge({ status }: { status: ChargerStatus }) {
  const map: Record<ChargerStatus, { label: string; cls: string }> = {
    AVAILABLE:   { label: 'Available',   cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    IN_USE:      { label: 'In Use',      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    RESERVED:    { label: 'Reserved',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    OFFLINE:     { label: 'Offline',     cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  }
  const { label, cls } = map[status]
  return <Badge label={label} className={cls} />
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const map: Record<ReservationStatus, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    ACTIVE:    { label: 'Active',    cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    COMPLETED: { label: 'Completed', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    NO_SHOW:   { label: 'No Show',   cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  }
  const { label, cls } = map[status]
  return <Badge label={label} className={cls} />
}

export function StationStatusBadge({ status }: { status: StationStatus }) {
  const map: Record<StationStatus, { label: string; cls: string }> = {
    ACTIVE:      { label: 'Active',      cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    INACTIVE:    { label: 'Inactive',    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  }
  const { label, cls } = map[status]
  return <Badge label={label} className={cls} />
}
