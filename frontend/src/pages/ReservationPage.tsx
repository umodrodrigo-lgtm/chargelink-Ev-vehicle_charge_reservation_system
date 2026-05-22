import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stationsApi } from '@/api/stationsApi'
import { reservationsApi } from '@/api/reservationsApi'
import { chargersApi } from '@/api/chargersApi'
import { Card, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { FullPageSpinner } from '@/components/UI/Spinner'
import { ChargerStatusBadge } from '@/components/UI/Badge'
import { Zap, MapPin, Calendar, ChevronLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addHours, parseISO } from 'date-fns'
import type { TimeSlot } from '@/types'

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toDateValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function slotToPercent(timeStr: string, date: string): number {
  const t = new Date(timeStr)
  const dayStart = new Date(`${date}T00:00:00`)
  return Math.min(100, Math.max(0, (t.getTime() - dayStart.getTime()) / 864000))
}

function AvailabilityTimeline({
  date,
  reservedSlots,
  selectionStart,
  selectionEnd,
  hasConflict,
}: {
  date: string
  reservedSlots: TimeSlot[]
  selectionStart: string
  selectionEnd: string
  hasConflict: boolean
}) {
  const hours = [0, 6, 12, 18, 24]

  return (
    <div className="mt-4">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
        Availability for {format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy')}
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
        {/* Reserved slots */}
        {reservedSlots.map((slot, i) => {
          const left = slotToPercent(slot.startTime, date)
          const right = slotToPercent(slot.endTime, date)
          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-red-400 dark:bg-red-600 opacity-80"
              style={{ left: `${left}%`, width: `${right - left}%` }}
              title={`Reserved: ${format(new Date(slot.startTime), 'h:mm a')} – ${format(new Date(slot.endTime), 'h:mm a')}`}
            />
          )
        })}

        {/* User selection */}
        {selectionStart && selectionEnd && (() => {
          const left = slotToPercent(selectionStart, date)
          const right = slotToPercent(selectionEnd, date)
          if (right <= left) return null
          return (
            <div
              className={`absolute top-0 h-full opacity-70 border-2 rounded ${
                hasConflict
                  ? 'bg-orange-400 border-orange-600'
                  : 'bg-emerald-400 border-emerald-600'
              }`}
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          )
        })()}
      </div>

      {/* Hour labels */}
      <div className="relative h-4 mt-0.5">
        {hours.map(h => (
          <span
            key={h}
            className="absolute text-[10px] text-gray-400 -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 0 ? '12am' : h === 12 ? '12pm' : h === 24 ? '' : h < 12 ? `${h}am` : `${h - 12}pm`}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400" /> Reserved
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${hasConflict ? 'bg-orange-400' : 'bg-emerald-400'}`} />
          Your selection
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-slate-600" /> Available
        </div>
      </div>

      {/* Reserved slots list */}
      {reservedSlots.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {reservedSlots.map((slot, i) => (
            <span key={i} className="text-[11px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
              {format(new Date(slot.startTime), 'h:mm a')} – {format(new Date(slot.endTime), 'h:mm a')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReservationPage() {
  const { chargerId } = useParams<{ chargerId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const now = new Date()
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  const defaultEnd = addHours(now, 1)

  const [selectedDate, setSelectedDate] = useState(toDateValue(now))
  const [startTime, setStartTime] = useState(toDatetimeLocalValue(now))
  const [endTime, setEndTime] = useState(toDatetimeLocalValue(defaultEnd))
  const [notes, setNotes] = useState('')

  // Keep date in sync with startTime picker
  useEffect(() => {
    if (startTime) setSelectedDate(startTime.slice(0, 10))
  }, [startTime])

  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations-all'],
    queryFn: () => stationsApi.getAll({ size: 200 }),
  })

  const charger = stations?.content.flatMap(s => s.chargers).find(c => c.id === chargerId)
  const station = stations?.content.find(s => s.chargers.some(c => c.id === chargerId))

  // Fetch reserved slots for the selected date
  const { data: availability } = useQuery({
    queryKey: ['charger-availability', chargerId, selectedDate],
    queryFn: () => chargersApi.getAvailability(chargerId!, selectedDate),
    enabled: !!chargerId && !!selectedDate,
  })

  // Real-time slot conflict check
  const startISO = startTime ? toLocalISO(new Date(startTime)) : ''
  const endISO = endTime ? toLocalISO(new Date(endTime)) : ''
  const durationMinutes = startTime && endTime
    ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
    : 0

  const { data: slotCheck } = useQuery({
    queryKey: ['slot-check', chargerId, startISO, endISO],
    queryFn: () => chargersApi.checkSlot(chargerId!, startISO, endISO),
    enabled: !!chargerId && !!startISO && !!endISO && durationMinutes >= 15 && durationMinutes <= 240,
    staleTime: 10_000,
  })

  const mutation = useMutation({
    mutationFn: () => reservationsApi.create({
      chargerId: chargerId!,
      startTime: startISO,
      endTime: endISO,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      toast.success('Reservation confirmed!')
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
      qc.invalidateQueries({ queryKey: ['charger-availability', chargerId] })
      navigate('/dashboard')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Failed to create reservation')
    },
  })

  if (isLoading) return <FullPageSpinner />
  if (!charger || !station) return <div className="text-center py-20">Charger not found.</div>

  const estimatedKwh = durationMinutes > 0 ? (charger.powerKw * durationMinutes / 60).toFixed(2) : '0'
  const estimatedCost = (Number(estimatedKwh) * charger.pricePerKwh).toFixed(2)
  const isConflict = slotCheck !== undefined && !slotCheck.available
  const canBook = durationMinutes >= 15 && durationMinutes <= 240 && slotCheck?.available === true

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/stations/${station.id}`}>
          <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Charger</h1>
      </div>

      <div className="grid gap-4 mb-6">
        {/* Charger details */}
        <Card>
          <CardTitle className="mb-3">Charger Details</CardTitle>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span>{station.name} · #{charger.chargerNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Zap className="w-4 h-4 text-primary-600" />
              <span>{charger.type} · {charger.powerKw} kW · ${charger.pricePerKwh}/kWh</span>
            </div>
          </div>
          <div className="mt-2"><ChargerStatusBadge status={charger.status} /></div>
        </Card>

        {/* Time slot selection */}
        <Card>
          <CardTitle className="mb-4">Select Time Slot</CardTitle>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="datetime-local"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value)
                  // auto-advance end time to maintain duration
                  if (endTime) {
                    const dur = new Date(endTime).getTime() - new Date(startTime).getTime()
                    if (dur > 0) {
                      const newEnd = new Date(new Date(e.target.value).getTime() + dur)
                      setEndTime(toDatetimeLocalValue(newEnd))
                    }
                  }
                }}
                icon={<Calendar className="w-4 h-4" />}
                min={toDatetimeLocalValue(new Date())}
              />
              <Input
                label="End Time"
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
                min={startTime}
              />
            </div>
            <Input
              label="Notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions…"
            />

            {/* Availability timeline */}
            <AvailabilityTimeline
              date={selectedDate}
              reservedSlots={availability?.reservedSlots ?? []}
              selectionStart={startISO}
              selectionEnd={endISO}
              hasConflict={isConflict}
            />
          </div>
        </Card>

        {/* Conflict / availability status */}
        {durationMinutes >= 15 && slotCheck && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            slotCheck.available
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {slotCheck.available ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              {slotCheck.available ? (
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  This time slot is available!
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {slotCheck.reason ?? 'This time slot is not available'}
                  </p>
                  {slotCheck.nextAvailableTime && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next available: {format(parseISO(slotCheck.nextAvailableTime), 'h:mm a')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Booking summary */}
        {durationMinutes >= 15 && (
          <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardTitle className="mb-3 text-primary-800 dark:text-primary-300">Booking Summary</CardTitle>
            <div className="grid grid-cols-3 gap-4 text-center">
              {([
                ['Duration', `${durationMinutes} min`],
                ['Est. Energy', `${estimatedKwh} kWh`],
                ['Est. Cost', `$${estimatedCost}`],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <div className="text-xl font-bold text-primary-700 dark:text-primary-400">{value}</div>
                  <div className="text-xs text-primary-600 dark:text-primary-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        disabled={!canBook}
      >
        Confirm Reservation
      </Button>

      {durationMinutes > 0 && durationMinutes < 15 && (
        <p className="text-sm text-red-500 text-center mt-2">Minimum reservation is 15 minutes</p>
      )}
      {durationMinutes > 240 && (
        <p className="text-sm text-red-500 text-center mt-2">Maximum reservation is 4 hours</p>
      )}
    </div>
  )
}
