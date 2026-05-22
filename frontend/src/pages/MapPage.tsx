import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { stationsApi } from '@/api/stationsApi'
import { ChargingMap } from '@/components/Map/ChargingMap'
import { Input } from '@/components/UI/Input'
import { Card } from '@/components/UI/Card'
import { Spinner } from '@/components/UI/Spinner'
import { StationStatusBadge, ChargerStatusBadge } from '@/components/UI/Badge'
import { Link } from 'react-router-dom'
import { MapPin, Zap } from 'lucide-react'

export function MapPage() {
  const [query, setQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stations', query],
    queryFn: () => stationsApi.getAll({ query, size: 100 }),
  })

  const stations = data?.content ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Charging Map</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {stations.length} station{stations.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search stations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-slate-800 rounded-2xl">
              <Spinner size="lg" />
            </div>
          ) : (
            <ChargingMap stations={stations} height="520px" />
          )}
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))
          ) : stations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No stations found</div>
          ) : stations.map((station) => (
            <Link key={station.id} to={`/stations/${station.id}`}>
              <Card className="hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{station.name}</h3>
                  <StationStatusBadge status={station.status} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {station.address}, {station.city}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-primary-600" />
                  <span className="font-medium text-primary-700 dark:text-primary-400">
                    {station.availableChargers}
                  </span>
                  <span className="text-gray-500">/ {station.totalChargers} available</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
