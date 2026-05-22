import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Phone, Zap, ChevronLeft } from 'lucide-react'
import { stationsApi } from '@/api/stationsApi'
import { Card, CardTitle } from '@/components/UI/Card'
import { Badge, ChargerStatusBadge, StationStatusBadge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { FullPageSpinner } from '@/components/UI/Spinner'
import { ChargingMap } from '@/components/Map/ChargingMap'
import { useAuthStore } from '@/store/authStore'

const CHARGER_TYPE_LABELS: Record<string, string> = {
  TYPE_1: 'Type 1 (SAE J1772)',
  TYPE_2: 'Type 2 (IEC 62196)',
  CCS: 'CCS (Combined Charging)',
  CHADEMO: 'CHAdeMO',
  TESLA: 'Tesla Proprietary',
}

export function StationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()

  const { data: station, isLoading } = useQuery({
    queryKey: ['station', id],
    queryFn: () => stationsApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <FullPageSpinner />
  if (!station) return <div className="text-center py-20 text-gray-500">Station not found.</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/map">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" /> Back to Map
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{station.name}</h1>
                {station.description && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{station.description}</p>
                )}
              </div>
              <StationStatusBadge status={station.status} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-600" />
                <span>{station.address}, {station.city}{station.state && `, ${station.state}`}</span>
              </div>
              {station.openingHours && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 text-primary-600" />{station.openingHours}
                </div>
              )}
              {station.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4 text-primary-600" />{station.phoneNumber}
                </div>
              )}
            </div>
          </Card>

          {/* Chargers */}
          <Card>
            <CardTitle className="mb-4">
              Chargers
              <span className="ml-2 text-sm font-normal text-gray-500">
                {station.availableChargers}/{station.totalChargers} available
              </span>
            </CardTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              {station.chargers.map((charger) => (
                <div key={charger.id}
                  className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      #{charger.chargerNumber}
                    </span>
                    <ChargerStatusBadge status={charger.status} />
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-primary-600" />
                      {CHARGER_TYPE_LABELS[charger.type] ?? charger.type} · {charger.powerKw} kW
                    </div>
                    <div className="text-xs text-gray-400">${charger.pricePerKwh}/kWh</div>
                  </div>
                  {charger.status === 'OFFLINE' || charger.status === 'MAINTENANCE' ? (
                    <div className="mt-3 text-xs text-center text-gray-400">
                      {charger.status === 'OFFLINE' ? 'Charger offline' : 'Under maintenance'}
                    </div>
                  ) : isAuthenticated ? (
                    <Link to={`/reserve/${charger.id}`} className="block mt-3">
                      <Button size="sm" className="w-full">
                        {charger.status === 'IN_USE' ? 'Book Future Slot' : 'Reserve'}
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login" className="block mt-3">
                      <Button size="sm" variant="secondary" className="w-full">Login to Reserve</Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card padding={false} className="overflow-hidden">
            <ChargingMap
              stations={[station]}
              center={[Number(station.latitude), Number(station.longitude)]}
              zoom={15}
              height="300px"
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
