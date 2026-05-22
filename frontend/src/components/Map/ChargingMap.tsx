import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import type { ChargingStation } from '@/types'
import { ChargerStatusBadge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { MapPin, Zap } from 'lucide-react'

// Custom marker icons
function createStationIcon(available: number, total: number) {
  const color = available === 0 ? '#ef4444' : available < total / 2 ? '#f59e0b' : '#10b981'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color}; color: white; border-radius: 50%; width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
        border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${available}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function userLocationIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: #3b82f6; border-radius: 50%; width: 18px; height: 18px;
        border: 3px solid white; box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function LocateUser() {
  const map = useMap()
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 })
    map.on('locationfound', (e) => {
      L.marker(e.latlng, { icon: userLocationIcon() }).addTo(map).bindPopup('You are here')
    })
  }, [map])
  return null
}

interface ChargingMapProps {
  stations: ChargingStation[]
  center?: [number, number]
  zoom?: number
  height?: string
}

export function ChargingMap({
  stations,
  center = [37.7749, -122.4194],
  zoom = 12,
  height = '500px',
}: ChargingMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className="rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateUser />
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[Number(station.latitude), Number(station.longitude)]}
          icon={createStationIcon(station.availableChargers, station.totalChargers)}
        >
          <Popup minWidth={240}>
            <div className="p-1">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{station.name}</h3>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{station.address}, {station.city}
              </p>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <Zap className="w-3 h-3" />{station.availableChargers}/{station.totalChargers} available
                </span>
              </div>
              <Link to={`/stations/${station.id}`}>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors">
                  View Station
                </button>
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
