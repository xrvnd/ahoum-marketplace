# Ahoum Marketplace: Technical Deep-Dive

This document provides a comprehensive technical breakdown of the Ahoum Marketplace. It is designed to enable incoming developers to understand the system architecture, component responsibilities, data flow, and runtime mechanics, prioritizing systemic behaviors over basic syntax.

---

## 1. Architecture Overview

Ahoum Marketplace employs a **decoupled Client-Server architecture**, containerized via Docker.

- **Frontend:** Next.js (App Router) acting as the UI tier.
- **Backend:** Django with Django Rest Framework (DRF) serving as the API and state manager.
- **Database:** PostgreSQL (production/dockerized) or SQLite (local fallback) for relational data persistence.
- **Reverse Proxy:** Nginx, responsible for routing requests between the client, frontend server, and backend server.

### Container Topology & Deployment
The system is orchestrated using `docker-compose`. Nginx acts as the primary ingress point (Port `80`). 
- Requests to `/api/*`, `/admin/*`, and `/accounts/*` are proxied to the Django `backend` (Gunicorn on Port `8000`).
- All other requests (e.g., `/`, `/dashboard`) are proxied to the Next.js `frontend` container.
- The `backend` depends on the `db` (Postgres 16) passing a health check before booting.

---

## 2. Core Logic & Data Flow

### Authentication Flow (OAuth 2.0 + JWT)
The platform uses Google OAuth, managed by `django-allauth`, issuing SimpleJWT tokens for session persistence.

1. **Initiation**: Unauthenticated users click "Sign in with Google", directing them to `NEXT_PUBLIC_GOOGLE_AUTH_URL` (which points to `/accounts/google/login/` on the Django backend).
2. **Provider Handshake**: Django Allauth handles the OAuth PKCE flow with Google.
3. **Adapter Hook**: The `CustomSocialAccountAdapter` in `apps.accounts` intercepts the successful login to link the social account to a local User model.
4. **Token Issuance**: The user is redirected to `/api/auth/callback/` (via `LOGIN_REDIRECT_URL`), where the backend issues a JWT Access & Refresh token pair.
5. **Client Persistence**: The Next.js `AuthContext` retrieves and stores the JWT (usually in memory and localStorage/cookies), attaching it as a Bearer token via the Axios instance (`api.js`) for subsequent authenticated requests.

### Marketplace Browsing & Booking Flow
1. **Public Catalog**: Next.js fetches available sessions via `GET /api/sessions/`. This endpoint is governed by DRF's `IsAuthenticatedOrReadOnly` permission, allowing public access to read data.
2. **Data Presentation**: The frontend leverages a complex Bento Grid layout (`SessionBentoGrid` using CSS Grid with `grid-flow-row-dense`). The cards receive JSON data containing `price`, `capacity`, `bookings_count`, etc.
3. **Capacity Resolution**: The component calculates dynamic availability (`Math.max(0, capacity - bookings_count)`) and sets status badges locally.
4. **Booking Action**: When a user books a session, a `POST` request is sent to `/api/bookings/`. DRF validates the user's JWT, verifies that `bookings_count < capacity`, and transactionally creates the booking record, updating the session's booked count.

---

## 3. Code Structure & Modules

### Backend (`/backend`)
A monolithic Django application structured by domain-driven apps:
- **`config/`**: Global settings (`settings.py`), routing (`urls.py`), and WSGI/ASGI entry points. Note that `CORS_ALLOW_CREDENTIALS` and `CORS_ALLOWED_ORIGINS` are configured here to allow the frontend to interact with the backend securely.
- **`apps.accounts/`**: Handles the custom Allauth social adapter, user profiles, and JWT extensions.
- **`apps.marketplace_sessions/`**: Contains models representing the core marketplace offerings (Title, Creator, Schedule, Capacity). Exposes ViewSets for CRUD operations.
- **`apps.bookings/`**: Manages the ledger of user-to-session reservations. Contains race-condition safeguards for capacity limits.

### Frontend (`/frontend`)
A Next.js 13+ application using the `src/` directory pattern:
- **`src/app/`**: Implements the Next.js App Router (e.g., `page.jsx` for the public marketplace, `dashboard/` for authenticated user spaces, `sessions/` for individual session views).
- **`src/components/`**: Reusable presentational components (e.g., `SessionCard`, `Navbar`). Styling leans heavily on Tailwind CSS.
- **`src/context/AuthContext.jsx`**: Global React Context managing the active user object and authentication state.
- **`src/lib/api.js`**: Axios instance pre-configured with the backend's base URL and Axios interceptors for automatically appending the JWT to protected routes.

---

## 4. Runtime Behavior & Dependencies

- **Django ORM & Transactions**: To prevent double-booking, the backend relies on Django DB transactions and aggregate calculations on the `capacity` fields.
- **Stateless Auth**: The backend is highly stateless regarding API requests. It does not use traditional Django sessions (`SessionMiddleware` is only retained for the Allauth OAuth handshake state). Subsequent requests rely entirely on the Bearer JWT.
- **Frontend Rendering**: Currently, the `page.jsx` is marked with `'use client'`, meaning the sessions are fetched on the client side after the initial DOM load. This results in a loading state and relies on client-side React rendering.

---

## 5. Known Limitations & Technical Debt

1. **SEO & SSR Utilization**: Because the main marketplace page (`page.jsx`) uses `'use client'` and fetches data via `useEffect`, it bypasses the Server-Side Rendering (SSR) benefits of Next.js. This hurts SEO. **Recommendation**: Move data fetching to server components or use `getStaticProps` equivalent patterns.
2. **Localization Debt**: Formatting rules (like `Intl.DateTimeFormat('en-IN')` and currency symbol `₹`) are hardcoded in components. This will block multi-region expansion.
3. **Database Fallbacks**: The `settings.py` allows a fallback to `db.sqlite3` if `DATABASE_URL` is missing. While useful for local dev without Docker, it can mask migration issues that only appear in PostgreSQL.
4. **Pagination Handling**: The backend DRF explicitly returns paginated responses (`{ count, results }`). Currently, the frontend dumps `res.data.results` into state but lacks UI controls to fetch page 2, page 3, etc.
5. **No Robust Error Boundaries**: If a component encounters bad data (e.g., `capacity: null` failing math operations), the entire React tree could crash. Global Error Boundaries (`error.jsx`) need to be hardened.
