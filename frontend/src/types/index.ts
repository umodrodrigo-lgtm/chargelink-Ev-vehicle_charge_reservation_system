// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  firstName: string; lastName: string
  email: string; password: string; phone?: string
}
export interface RefreshTokenRequest { refreshToken: string }
export interface AuthResponse {
  accessToken: string; refreshToken: string
  tokenType: string; expiresIn: number
  user: User
}

// ─── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'USER' | 'ADMIN'
export interface User {
  id: string; email: string; firstName: string; lastName: string
  phone?: string; role: UserRole; active: boolean; createdAt: string
}
export interface UserUpdateRequest { firstName?: string; lastName?: string; phone?: string }

// ─── Station ───────────────────────────────────────────────────────────────────
export type StationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
export interface ChargingStation {
  id: string; name: string; description?: string
  address: string; city: string; state?: string; zipCode?: string
  latitude: number; longitude: number
  status: StationStatus; imageUrl?: string; openingHours?: string; phoneNumber?: string
  chargers: Charger[]; totalChargers: number; availableChargers: number
  createdAt: string
}
export interface CreateStationRequest {
  name: string; description?: string; address: string; city: string
  state?: string; zipCode?: string; latitude: number; longitude: number
  status?: StationStatus; imageUrl?: string; openingHours?: string; phoneNumber?: string
}

// ─── Charger ───────────────────────────────────────────────────────────────────
export type ChargerType = 'TYPE_1' | 'TYPE_2' | 'CCS' | 'CHADEMO' | 'TESLA'
export type ChargerStatus = 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'OFFLINE' | 'MAINTENANCE'
export interface Charger {
  id: string; chargerNumber: string; type: ChargerType
  powerKw: number; pricePerKwh: number; status: ChargerStatus
  stationId: string; stationName: string; createdAt: string
}
export interface CreateChargerRequest {
  stationId: string; chargerNumber: string; type: ChargerType
  powerKw: number; pricePerKwh: number
}

// ─── Reservation ───────────────────────────────────────────────────────────────
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export interface Reservation {
  id: string; userId: string; userFullName: string; userEmail: string
  chargerId: string; chargerNumber: string; chargerType: ChargerType
  chargerPowerKw: number; pricePerKwh: number
  stationId: string; stationName: string; stationAddress: string
  startTime: string; endTime: string; status: ReservationStatus
  estimatedCost?: number; actualCost?: number; energyDeliveredKwh?: number
  notes?: string; cancelledAt?: string; cancellationReason?: string; createdAt: string
}
export interface CreateReservationRequest {
  chargerId: string; startTime: string; endTime: string; notes?: string
}

// ─── Subscription ──────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string; name: string; description?: string
  priceMonthly: number; maxReservationsPerMonth: number
  maxReservationDurationMinutes: number; discountPercentage: number
  priorityBooking: boolean; active: boolean; planOrder: number
}
export interface UserSubscription {
  id: string; userId: string; plan: SubscriptionPlan
  startDate: string; endDate: string; active: boolean; currentlyActive: boolean; createdAt: string
}
export interface SubscribeRequest { planId: string }

// ─── API Wrappers ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean; message?: string; data?: T; errorCode?: string; timestamp: string
}
export interface PagedResponse<T> {
  content: T[]; page: number; size: number
  totalElements: number; totalPages: number; last: boolean; first: boolean
}

// ─── Availability ──────────────────────────────────────────────────────────────
export interface TimeSlot {
  startTime: string
  endTime: string
}
export interface ChargerAvailability {
  chargerId: string
  date: string
  reservedSlots: TimeSlot[]
}
export interface SlotCheck {
  available: boolean
  reason?: string
  nextAvailableTime?: string
}

// ─── WebSocket ─────────────────────────────────────────────────────────────────
export interface ChargerStatusUpdate {
  chargerId: string; stationId: string; chargerNumber: string
  status: ChargerStatus; timestamp: string
}
