import api, { unwrap } from './axiosInstance'
import type { ApiResponse, PagedResponse, User, UserUpdateRequest } from '@/types'

export const usersApi = {
  getMe: () =>
    api.get<ApiResponse<User>>('/users/me').then(unwrap),

  updateMe: (data: UserUpdateRequest) =>
    api.put<ApiResponse<User>>('/users/me', data).then(unwrap),

  getAll: (params?: { query?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PagedResponse<User>>>('/users', { params }).then(unwrap),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then(unwrap),

  toggleActive: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/toggle-active`).then(unwrap),
}
