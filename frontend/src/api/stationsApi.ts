import api, { unwrap } from './axiosInstance'
import type { ApiResponse, PagedResponse, ChargingStation, CreateStationRequest } from '@/types'

export const stationsApi = {
  getAll: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PagedResponse<ChargingStation>>>('/stations', { params }).then(unwrap),

  getById: (id: string) =>
    api.get<ApiResponse<ChargingStation>>(`/stations/${id}`).then(unwrap),

  getNearby: (lat: number, lng: number, radiusKm = 10) =>
    api.get<ApiResponse<ChargingStation[]>>('/stations/nearby', { params: { lat, lng, radiusKm } }).then(unwrap),

  create: (data: CreateStationRequest) =>
    api.post<ApiResponse<ChargingStation>>('/stations', data).then(unwrap),

  update: (id: string, data: Partial<CreateStationRequest>) =>
    api.put<ApiResponse<ChargingStation>>(`/stations/${id}`, data).then(unwrap),

  delete: (id: string) =>
    api.delete(`/stations/${id}`),
}
