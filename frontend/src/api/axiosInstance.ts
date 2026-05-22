import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

function parseJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

api.interceptors.request.use(async (config) => {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState()

  if (accessToken) {
    const expiry = parseJwtExpiry(accessToken)
    const isExpired = expiry !== null && Date.now() > expiry - 30_000 // refresh 30s early

    if (isExpired && refreshToken && !isRefreshing) {
      isRefreshing = true
      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data
        setTokens(newAccess, newRefresh)
        processQueue(null, newAccess)
        config.headers.Authorization = `Bearer ${newAccess}`
      } catch (e) {
        processQueue(e, null)
        logout()
      } finally {
        isRefreshing = false
      }
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  }

  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, logout } = useAuthStore.getState()
      if (!refreshToken) {
        logout()
        return Promise.reject(error)
      }

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        setTokens(accessToken, newRefresh)
        processQueue(null, accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (e) {
        processQueue(e, null)
        logout()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export const unwrap = <T,>(r: { data: { data?: T } }): T => r.data.data!

export default api
