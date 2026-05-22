import api, { unwrap } from './axiosInstance'
import type { ApiResponse, Charger, ChargerAvailability, ChargerStatus, CreateChargerRequest, SlotCheck } from '@/types'

export const chargersApi = {
  getByStation: (stationId: string) =>
    api.get<ApiResponse<Charger[]>>(`/chargers/station/${stationId}`).then(unwrap),

  create: (data: CreateChargerRequest) =>
    api.post<ApiResponse<Charger>>('/chargers', data).then(unwrap),

  update: (id: string, data: { chargerNumber: string; type: string; powerKw: number; pricePerKwh: number; status: ChargerStatus }) =>
    api.put<ApiResponse<Charger>>(`/chargers/${id}`, data).then(unwrap),

  updateStatus: (id: string, status: ChargerStatus) =>
    api.patch<ApiResponse<Charger>>(`/chargers/${id}/status`, null, { params: { status } }).then(unwrap),

  delete: (id: string) =>
    api.delete(`/chargers/${id}`),

  getAvailability: (chargerId: string, date: string) =>
    api.get<ApiResponse<ChargerAvailability>>(`/chargers/${chargerId}/availability`, { params: { date } }).then(unwrap),

  checkSlot: (chargerId: string, start: string, end: string) =>
    api.get<ApiResponse<SlotCheck>>(`/chargers/${chargerId}/check-slot`, { params: { start, end } }).then(unwrap),
}
