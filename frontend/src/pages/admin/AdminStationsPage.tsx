import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stationsApi } from '@/api/stationsApi'
import { chargersApi } from '@/api/chargersApi'
import { Card, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { Modal } from '@/components/UI/Modal'
import { Spinner } from '@/components/UI/Spinner'
import { StationStatusBadge, ChargerStatusBadge } from '@/components/UI/Badge'
import { Plus, Search, Pencil, Trash2, MapPin, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ChargingStation, CreateStationRequest, Charger, ChargerType, ChargerStatus } from '@/types'

// ─── Station form ──────────────────────────────────────────────────────────────

const defaultStation: CreateStationRequest = {
  name: '', address: '', city: '', latitude: 0, longitude: 0,
  description: '', state: '', openingHours: '', phoneNumber: '',
}

// ─── Charger form ──────────────────────────────────────────────────────────────

interface ChargerForm {
  chargerNumber: string
  type: ChargerType
  powerKw: number
  pricePerKwh: number
  status: ChargerStatus
}

const defaultCharger: ChargerForm = {
  chargerNumber: '', type: 'CCS', powerKw: 50, pricePerKwh: 0.35, status: 'AVAILABLE',
}

const CHARGER_TYPES: ChargerType[] = ['TYPE_1', 'TYPE_2', 'CCS', 'CHADEMO', 'TESLA']
const CHARGER_STATUSES: ChargerStatus[] = ['AVAILABLE', 'OFFLINE', 'MAINTENANCE']
const selectCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

// ─── Charger management modal ──────────────────────────────────────────────────

function ChargerModal({ station, onClose }: { station: ChargingStation; onClose: () => void }) {
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editCharger, setEditCharger] = useState<Charger | null>(null)
  const [form, setForm] = useState<ChargerForm>(defaultCharger)

  const { data: chargers, isLoading } = useQuery({
    queryKey: ['admin-chargers', station.id],
    queryFn: () => chargersApi.getByStation(station.id),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-chargers', station.id] })
    qc.invalidateQueries({ queryKey: ['admin-stations'] })
    qc.invalidateQueries({ queryKey: ['stations-all'] })
    qc.invalidateQueries({ queryKey: ['station', station.id] })
  }

  const saveMutation = useMutation({
    mutationFn: () => editCharger
      ? chargersApi.update(editCharger.id, form)
      : chargersApi.create({ stationId: station.id, ...form }),
    onSuccess: () => {
      toast.success(editCharger ? 'Charger updated' : 'Charger added')
      invalidate()
      setView('list')
      setEditCharger(null)
      setForm(defaultCharger)
    },
    onError: () => toast.error('Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chargersApi.delete(id),
    onSuccess: () => { toast.success('Charger deleted'); invalidate() },
    onError: () => toast.error('Delete failed'),
  })

  const openAdd = () => { setForm(defaultCharger); setEditCharger(null); setView('form') }
  const openEdit = (c: Charger) => {
    setForm({ chargerNumber: c.chargerNumber, type: c.type, powerKw: c.powerKw, pricePerKwh: c.pricePerKwh, status: c.status })
    setEditCharger(c)
    setView('form')
  }

  const set = (k: keyof ChargerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  return (
    <Modal open onClose={onClose} title={`Chargers — ${station.name}`} size="lg">
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {chargers?.length ?? 0} charger(s)
            </span>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Charger
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : chargers?.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No chargers yet. Add one to allow reservations.
            </div>
          ) : (
            <div className="space-y-2">
              {chargers?.map(c => (
                <div key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        #{c.chargerNumber} · {c.type} · {c.powerKw} kW
                      </div>
                      <div className="text-xs text-gray-400">${c.pricePerKwh}/kWh</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChargerStatusBadge status={c.status} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" size="sm"
                      onClick={() => { if (confirm(`Delete charger #${c.chargerNumber}?`)) deleteMutation.mutate(c.id) }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <button onClick={() => { setView('list'); setEditCharger(null) }}
              className="text-sm text-primary-600 hover:underline">
              ← Back to charger list
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
              {editCharger ? `Edit Charger #${editCharger.chargerNumber}` : 'Add New Charger'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Charger Number" value={form.chargerNumber}
              onChange={set('chargerNumber')} placeholder="e.g. A1" />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select value={form.type} onChange={set('type')}
                className={selectCls}>
                {CHARGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <Input label="Power (kW)" type="number" step="any" min="1"
              value={form.powerKw} onChange={set('powerKw')} />

            <Input label="Price per kWh ($)" type="number" step="0.01" min="0.01"
              value={form.pricePerKwh} onChange={set('pricePerKwh')} />

            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select value={form.status} onChange={set('status')}
                className={selectCls}>
                {CHARGER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="secondary" onClick={() => { setView('list'); setEditCharger(null) }}>
              Cancel
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editCharger ? 'Save Changes' : 'Add Charger'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function AdminStationsPage() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [showStationModal, setShowStationModal] = useState(false)
  const [stationForm, setStationForm] = useState<CreateStationRequest>(defaultStation)
  const [editId, setEditId] = useState<string | null>(null)
  const [chargerStation, setChargerStation] = useState<ChargingStation | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stations', query],
    queryFn: () => stationsApi.getAll({ query, size: 50 }),
  })

  const stationMutation = useMutation({
    mutationFn: () => editId ? stationsApi.update(editId, stationForm) : stationsApi.create(stationForm),
    onSuccess: () => {
      toast.success(editId ? 'Station updated' : 'Station created')
      qc.invalidateQueries({ queryKey: ['admin-stations'] })
      qc.invalidateQueries({ queryKey: ['stations-all'] })
      setShowStationModal(false)
      setStationForm(defaultStation)
      setEditId(null)
    },
    onError: () => toast.error('Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stationsApi.delete(id),
    onSuccess: () => {
      toast.success('Station deleted')
      qc.invalidateQueries({ queryKey: ['admin-stations'] })
      qc.invalidateQueries({ queryKey: ['stations-all'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const set = (k: keyof CreateStationRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setStationForm(f => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const openCreate = () => { setStationForm(defaultStation); setEditId(null); setShowStationModal(true) }
  const openEdit = (s: ChargingStation) => {
    setStationForm({
      name: s.name, address: s.address, city: s.city,
      latitude: Number(s.latitude), longitude: Number(s.longitude),
      description: s.description ?? '', state: s.state ?? '',
      openingHours: s.openingHours ?? '', phoneNumber: s.phoneNumber ?? '',
    })
    setEditId(s.id)
    setShowStationModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Charging Stations</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Station</Button>
      </div>

      <div className="w-72">
        <Input placeholder="Search stations…" value={query} onChange={e => setQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />} />
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  {['Name', 'City', 'Status', 'Chargers', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {data?.content.map(station => (
                  <tr key={station.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{station.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{station.city}</div>
                    </td>
                    <td className="px-4 py-3"><StationStatusBadge status={station.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setChargerStation(station)}
                        className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {station.availableChargers}/{station.totalChargers} available
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(station)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="danger" size="sm"
                          onClick={() => { if (confirm('Delete this station and all its chargers?')) deleteMutation.mutate(station.id) }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.content.length === 0 && (
              <div className="text-center py-12 text-gray-400">No stations found</div>
            )}
          </div>
        )}
      </Card>

      {/* Station create/edit modal */}
      <Modal open={showStationModal} onClose={() => setShowStationModal(false)}
        title={editId ? 'Edit Station' : 'New Station'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" value={stationForm.name} onChange={set('name')} className="col-span-2" />
          <Input label="Address" value={stationForm.address} onChange={set('address')} className="col-span-2" />
          <Input label="City" value={stationForm.city} onChange={set('city')} />
          <Input label="State" value={stationForm.state ?? ''} onChange={set('state')} />
          <Input label="Latitude" type="number" step="any" value={stationForm.latitude} onChange={set('latitude')} />
          <Input label="Longitude" type="number" step="any" value={stationForm.longitude} onChange={set('longitude')} />
          <Input label="Opening Hours" value={stationForm.openingHours ?? ''} onChange={set('openingHours')} />
          <Input label="Phone Number" value={stationForm.phoneNumber ?? ''} onChange={set('phoneNumber')} />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setShowStationModal(false)}>Cancel</Button>
          <Button loading={stationMutation.isPending} onClick={() => stationMutation.mutate()}>
            {editId ? 'Save Changes' : 'Create Station'}
          </Button>
        </div>
      </Modal>

      {/* Charger management modal */}
      {chargerStation && (
        <ChargerModal station={chargerStation} onClose={() => setChargerStation(null)} />
      )}
    </div>
  )
}
