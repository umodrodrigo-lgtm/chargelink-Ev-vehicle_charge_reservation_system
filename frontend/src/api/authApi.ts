import api from './axiosInstance'
import type { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest, ApiResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data).then(r => r.data.data!),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then(r => r.data.data!),

  refresh: (data: RefreshTokenRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', data).then(r => r.data.data!),

  logout: (data: RefreshTokenRequest) =>
    api.post('/auth/logout', data),
}
