import api, { unwrap } from './axiosInstance'
import type { ApiResponse, PagedResponse, Reservation, CreateReservationRequest, ReservationStatus } from '@/types'

export const reservationsApi = {
  create: (data: CreateReservationRequest) =>
    api.post<ApiResponse<Reservation>>('/reservations', data).then(unwrap),

  getMyReservations: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<PagedResponse<Reservation>>>('/reservations/my', { params }).then(unwrap),

  getMyReservation: (id: string) =>
    api.get<ApiResponse<Reservation>>(`/reservations/my/${id}`).then(unwrap),

  cancel: (id: string, reason?: string) =>
    api.patch<ApiResponse<Reservation>>(`/reservations/my/${id}/cancel`, null, { params: { reason } }).then(unwrap),

  // Admin
  getAll: (params?: { status?: ReservationStatus; page?: number; size?: number }) =>
    api.get<ApiResponse<PagedResponse<Reservation>>>('/reservations', { params }).then(unwrap),
}
