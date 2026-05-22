# ChargeLink — EV Charging Reservation System

Production-ready MVP for local development.

---

## Quick Start

### Prerequisites
- Java 21
- Maven 3.8+
- Node.js 20+
- PostgreSQL 15+ (database: `chargelink`)
- Redis 7+ (running on default port 6379)

### 1. Create the PostgreSQL database

```sql
CREATE DATABASE chargelink;
```

### 2. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080/api`  
Swagger UI: `http://localhost:8080/api/swagger-ui.html`

**Seeded demo accounts (auto-created on first start):**

| Email | Password | Role |
|---|---|---|
| `admin@chargelink.com` | `Admin@1234` | ADMIN |
| `user@chargelink.com` | `User@1234` | USER |

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`

---

## Environment Variables (backend)

| Variable | Default | Description |
|---|---|---|
| `DB_USERNAME` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | (base64 default) | JWT signing key — change in production |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |

---

## Architecture

```
backend/
├── com.chargelink/
│   ├── auth/               # JWT login, register, refresh, logout
│   ├── users/              # User entity, profile management
│   ├── stations/           # Charging stations CRUD
│   ├── chargers/           # Charger management + Redis caching
│   ├── reservations/       # Booking with Redis distributed lock
│   ├── subscriptions/      # Plans + user subscriptions
│   ├── websocket/          # STOMP/SockJS real-time broadcasts
│   ├── security/           # JWT filter, SecurityConfig, UserDetails
│   ├── config/             # Redis, WebSocket, OpenAPI, DataInitializer
│   └── common/             # BaseEntity, ApiResponse, GlobalExceptionHandler

frontend/src/
├── api/                    # Axios service layer (one file per domain)
├── components/
│   ├── Layout/             # Navbar, Layout wrappers
│   ├── Map/                # Leaflet/OpenStreetMap map component
│   └── UI/                 # Button, Card, Input, Badge, Modal, Spinner
├── hooks/                  # useAuth, useWebSocket
├── pages/                  # All route pages
│   └── admin/              # Admin-only pages
├── store/                  # Zustand auth store (persisted)
└── types/                  # TypeScript type definitions
```

---

## Key Features

| Feature | Implementation |
|---|---|
| JWT Auth | Access token (15 min) + Refresh token (7 days) stored in DB |
| Redis Locking | `setIfAbsent` with 30 s TTL prevents double-booking |
| Redis Caching | Charger availability cached with 10 min TTL |
| Real-time Updates | WebSocket STOMP topics: `/topic/chargers/{id}`, `/topic/reservations` |
| Reservation Lifecycle | Scheduled job (every 60 s) auto-activates and completes bookings |
| Role-based Access | `@PreAuthorize("hasRole('ADMIN')")` + route guards in React |
| Map | OpenStreetMap + Leaflet.js with custom availability-colored markers |

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Register |
| POST | `/auth/login` | public | Login |
| POST | `/auth/refresh` | public | Refresh token |
| POST | `/auth/logout` | public | Logout |
| GET | `/stations` | public | List stations |
| GET | `/stations/nearby` | public | Nearby stations |
| GET | `/stations/{id}` | public | Station details |
| POST | `/stations` | ADMIN | Create station |
| GET | `/chargers/station/{id}` | public | Station chargers |
| PATCH | `/chargers/{id}/status` | ADMIN | Update status |
| POST | `/reservations` | USER | Create reservation |
| GET | `/reservations/my` | USER | My reservations |
| PATCH | `/reservations/my/{id}/cancel` | USER | Cancel reservation |
| GET | `/reservations` | ADMIN | All reservations |
| GET | `/subscriptions/plans` | public | Active plans |
| POST | `/subscriptions/subscribe` | USER | Subscribe |
| GET | `/users/me` | USER | My profile |
| GET | `/users` | ADMIN | All users |

---

## WebSocket

Connect via SockJS at `/ws`, then subscribe to STOMP topics:

```js
client.subscribe('/topic/chargers/{chargerId}', handler)   // status updates
client.subscribe('/topic/reservations', handler)            // all reservation events
client.subscribe('/topic/users/{userId}/reservations', h)   // user-specific events
```
