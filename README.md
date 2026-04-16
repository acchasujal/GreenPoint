# GreenPoint Mumbai Prototype

FastAPI + React prototype for GreenPoint Mumbai civic reward/penalty workflow.

**Latest Features (Phase 4)**:
- ✅ Private data isolation endpoints with authentication
- ✅ Role-based access control (citizen/collector)
- ✅ Real-time violation sync with 5-second polling
- ✅ Multilingual violation alerts (English/Hindi/Marathi)
- ✅ Graduated enforcement model (30-day rolling window, 3-tier penalties)

## Prerequisites

- Python 3.13+
- Node.js 23+ and npm

## Project Structure

- `backend` - FastAPI API and SQLite data
- `frontend` - React + Vite UI

## 1) Backend Setup and Run

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend runs at: `http://127.0.0.1:8000`

Useful endpoint check:

```bash
curl http://127.0.0.1:8000/health
```

## 2) Frontend Setup and Run

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 3) Build (Frontend)

```bash
cd frontend
npm run build
```

Build output is generated in `frontend/dist`.

---

## New Security & Real-Time Features (Phase 4)

### Private Profile Endpoint

**Endpoint**: `GET /user/profile/private`

**Authentication**: Required (Bearer token in Authorization header)

**Response**: Returns only current user's data:
```json
{
  "user_id": "citizen-1001",
  "points": 245,
  "violation_count": 2,
  "xp_points": 180,
  "landfill_saved_kg": 122.5,
  "ward": "Chembur",
  "society_name": "Green Heights",
  "violation_history": [
    {
      "id": "violation-1",
      "offense_tier": 1,
      "violation_type": "Non-segregation",
      "points_delta": -20,
      "geo_tag": "Chembur",
      "details": "Tier 1 warning issued with 20-point deduction.",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pending_notifications": [
    {
      "id": "notif-1",
      "tier": 1,
      "english": "Warning: Non-segregated waste detected. 20 points deducted.",
      "hindi": "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।",
      "marathi": "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत.",
      "message": "Tier 1 warning issued with 20-point deduction.",
      "created_at": "2024-01-15T10:30:00Z",
      "acknowledged_at": null
    }
  ]
}
```

**Security Features**:
- ✅ Session token validation (Bearer token from Authorization header)
- ✅ User ID extracted from token - prevents data leaks
- ✅ Only returns current user's violations (last 30 days)
- ✅ Includes unacknowledged notifications only

### Collector Search Endpoint

**Endpoint**: `GET /collector/search-users?search_query={query}`

**Authentication**: Required (Bearer token + collector role)

**Response**: Privacy-preserving user list:
```json
{
  "results": [
    {
      "user_id": "citizen-1001",
      "violation_count": 2,
      "last_violation_date": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

**Privacy By Design**:
- ✅ NO points totals exposed
- ✅ NO personal data (email, society, ward)
- ✅ NO historical data except violation count
- ✅ Only collectors can use this endpoint
- ✅ Minimal data necessary for enforcement action

### Real-Time Violation Sync

**Frontend Implementation**:
- ✅ 5-second polling interval on citizen dashboard
- ✅ Auto-fetches user profile on each poll
- ✅ Detects new unacknowledged violations
- ✅ High-priority red modal triggers automatically

**Usage Flow**:
1. Citizen logged in → Citizen View dashboard
2. Collector flags violation in Collector View
3. 5-second polling detects new violation
4. **High-Priority Red Modal pops immediately** (no refresh needed)
5. Warning displayed in English/Hindi/Marathi
6. Citizen acknowledges → Modal closes

### Graduated Enforcement Model

**Penalties on 30-day rolling window**:

| Tier | Event | Points | Action |
|------|-------|--------|--------|
| 1 | First violation (within 30 days) | -20 | Warning modal + 48hr appeal window |
| 2 | Second violation (within 30 days) | -50 | Society notification issued |
| 3 | Third+ violation (within 30 days) | -200 | BMC monetary fine (₹200) |

**Implementation**:
- ✅ Ledger table tracks all violations with timestamps
- ✅ 30-day window calculated from today - 30 days
- ✅ Tier determined by count of violations in window
- ✅ Points enforced atomically with ledger entry

### Multilingual Warnings

**Supported Languages**: English, Hindi (हिंदी), Marathi (मराठी)

**Stored in Database**:
```python
WARNING_MESSAGES = {
    "en": "Warning: Non-segregated waste detected. 20 points deducted.",
    "hi": "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।",
    "mr": "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत.",
}
```

**Frontend**:
- ✅ Language selector in header (EN/HI/MR)
- ✅ Modal displays all 3 languages simultaneously
- ✅ User preference persisted in state

### Access Control & Role-Based Protection

**Protected Routes**:
- `POST /violation` - Collector role required
- `GET /collector/search-users` - Collector role required
- `GET /user/profile/private` - Any authenticated user
- `/collector` route - Collector role enforced on frontend

**Access Denial Flow**:
1. Citizen tries `/collector` in URL
2. ProtectedRoute checks role
3. **Toast notification**: "Access Denied: BMC Officer Credentials Required"
4. Hard redirect to `/citizen`

**Implementation**:
```typescript
// In ProtectedRoute component
if (currentUser.role !== requiredRole) {
  showToast("Access Denied: BMC Officer Credentials Required", "error");
  return <Navigate to={correctRoute} replace />;
}
```

---

## Testing Real-Time Features

### Manual Test: Violation Sync

1. **Terminal 1**: Start backend
   ```bash
   cd backend && python -m uvicorn main:app --reload --port 8000
   ```

2. **Terminal 2**: Start frontend
   ```bash
   cd frontend && npm run dev
   ```

3. **Browser 1**: Login as citizen-1001
   - Navigate to `/citizen` dashboard
   - Leave this tab open

4. **Browser 2**: Login as collector (BMC2026 code)
   - Navigate to `/collector` dashboard
   - Search for `citizen-1001`
   - Flag a violation → Watch Browser 1

5. **Expected**: Within 5 seconds, Browser 1 should show:
   - High-priority red modal pops automatically
   - Warning in selected language (EN/HI/MR)
   - "I Acknowledge" button ready
   - Console logs show polling completed

### Manual Test: Access Denial

1. **Browser**: Login as collector
2. **URL Bar**: Type `http://localhost:5173/citizen`
3. **Expected**: 
   - Immediate redirect to `/collector`
   - Toast appears: "Access Denied: BMC Officer Credentials Required"
   - Console logs show role mismatch

### Manual Test: Private Endpoint

```bash
# Get session token from localStorage after login
# Then test private endpoint:
curl -X GET http://127.0.0.1:8000/user/profile/private \
  -H "Authorization: Bearer {SESSION_TOKEN}"

# Compare with public endpoint (exposes all user data):
curl http://127.0.0.1:8000/user/citizen-1001
```

---

## Debugging & Logging

**Frontend Console Logs** (with prefixes):
- `[AUTH]` - Authentication flow events
- `[ROUTE]` - Route protection decisions
- `[VIOLATION_MODAL]` - Modal trigger/acknowledgment
- `[CITIZEN_POLL]` - Real-time sync polling

**Backend Logs**:
```
- POST /violation - Logs tier calculation and notification creation
- GET /user/profile/private - Logs user_id extraction and validation
- GET /collector/search-users - Logs role check and search query
```

**Check Logs**:
```bash
# Open browser DevTools → Console
# Filter by prefix: [AUTH], [ROUTE], [VIOLATION_MODAL]

# Or in VS Code terminal:
# Search for log prefix in output
```

---

## API Specification

### Authentication Header

**Format**: `Authorization: Bearer {session_token}`

**Session Token**: Base64-encoded string
```
Format: "{user_id}:{role}:{timestamp}"
Example: "Y2l0aXplbi0xMDAxOmNpdGl6ZW46MjAyNC0wMS0xNVQxMDozMDowMFo="
```

**Obtaining Token**:
1. Call `POST /signup` or `POST /login`
2. Response includes `session_token`
3. Use in subsequent authenticated requests

### Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Missing authorization header" or "Invalid authorization token"
}
```

**403 Forbidden**:
```json
{
  "detail": "Only collectors can search users"
}
```

---

## Database Schema

### users table
- `id` (PRIMARY KEY)
- `points`, `violation_count`, `xp_points`, `landfill_saved_kg`
- `ward`, `society_name`, `last_quiz_date`

### auth_users table
- `id` (PRIMARY KEY)
- `email`, `password_hash`, `role` (citizen/collector)
- `created_at`

### ledger table
- `id`, `user_id` (FOREIGN KEY users.id)
- `event_type` (violation, reward, notification_ack)
- `points_delta`, `offense_tier`, `violation_type`
- `collector_id`, `geo_tag`, `details`, `created_at`

### notifications table
- `id`, `user_id` (FOREIGN KEY users.id)
- `tier`, `english`, `hindi`, `marathi`
- `message`, `created_at`
- `acknowledged_at`, `acknowledged_by`

## 4) Quick Local Workflow

1. Start backend (`uvicorn`) in terminal 1.
2. Start frontend (`vite`) in terminal 2.
3. Open `http://localhost:5173`.
4. **Login/Signup** with your credentials.
5. Use `/citizen` and `/collector` views to test reward and violation flows.

## Authentication System

### Login/Signup Flow

1. Navigate to `http://localhost:5173` → redirected to `/login`
2. Choose **Login** or **Sign Up** tab
3. Enter credentials and role
4. If registering as **BMC Collector**, enter access code: `BMC2026`
5. On success → redirected to appropriate dashboard:
   - **Citizen** → `/citizen`
   - **Collector** → `/collector`

### Test Credentials

| Role | Email | Password | Access Code |
|------|-------|----------|-------------|
| Citizen | citizen@example.com | password123 | — |
| Collector | collector@bmc.com | password123 | BMC2026 |

## Debugging Guide

### Browser Console Logs

All authentication and routing events are logged with `[AUTH]` and `[ROUTE]` prefixes for easy debugging:

```javascript
// Examples:
[AUTH] Starting login process for: citizen@example.com
[ROUTE] Current path: /citizen, User: citizen@example.com
[AUTH] Login successful. User role: citizen, ID: xxxxxxxx
[ROUTE] Access granted for citizen@example.com (citizen) to /citizen
```

**Open browser DevTools** (`F12` → Console) to view real-time logs.

### Common Issues & Solutions

#### Issue: Stuck on Login Page After Submit

**Solution:** Check browser console for error messages:
- `[AUTH] Login API Error (401)` → Invalid credentials
- `[AUTH] Login API Error (500)` → Backend not running
- Check backend logs for detailed error

#### Issue: After Login, Page Doesn't Redirect

**Solution:**
1. Check console for `[AUTH]` logs
2. Verify backend returned correct role in API response
3. Clear browser cache and localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

#### Issue: "Invalid Credentials" Error on Collector Signup

**Solution:**
- Access code must be exactly: `BMC2026`
- Check for typos or extra spaces

#### Issue: Role Mismatch (e.g., Citizen tries to access /collector)

**Solution:**
- `[ROUTE] User role mismatch` message will appear
- User automatically redirected to correct dashboard (`/citizen`)
- This is expected security behavior

### Enable Detailed Debugging

**In browser console:**

```javascript
// View current user data
console.log(JSON.parse(localStorage.getItem('current_user')))

// Check all API calls
// Open DevTools → Network tab
// Filter by "login" or "signup"

// Force logout and reset
localStorage.clear()
sessionStorage.clear()
location.href = '/login'
```

### Backend API Testing

```bash
# Test login endpoint
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@example.com","password":"password123"}'

# Test signup endpoint
curl -X POST http://127.0.0.1:8000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123","role":"citizen"}'

# Test collector signup (with access code)
curl -X POST http://127.0.0.1:8000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"collector@bmc.com","password":"password123","role":"collector","access_code":"BMC2026"}'
```

## Architecture Overview

### Frontend Authentication Flow

```
User enters credentials
        ↓
Form submission (handleLogin/handleSignup)
        ↓
[1] AuthContext.login() or AuthContext.signup()
        ↓
[2] API Request to backend (/login or /signup)
        ↓
[3] Response received with user_id, role, session_token
        ↓
[4] localStorage.setItem('current_user', {user_id, email, role, session_token})
        ↓
[5] useNavigate() → '/citizen' or '/collector'
        ↓
[6] ProtectedRoute checks localStorage and role
        ↓
DashboardApp Rendered
```

### Protected Route Logic

```
User navigates to /citizen or /collector
        ↓
ProtectedRoute Component
        ↓
Check localStorage for 'current_user'
        ↓
No user? → Redirect to /login
User exists? → Check role matches path
        ↓
Role mismatch? → Redirect to correct path
Role matches? → Render DashboardApp
```

### Session Persistence

- User data stored in `localStorage` with key: `current_user`
- On page refresh → AuthProvider loads from localStorage
- On logout → localStorage cleared + redirect to /login
- Session persists until logout or manual localStorage clear

## Environment Variables

Create `.env` file in `frontend/` directory:

```bash
# Backend API URL (optional, defaults to http://127.0.0.1:8000)
VITE_API_URL=http://127.0.0.1:8000
```

See `.env.example` for all available options.

## Troubleshooting

### Frontend won't connect to backend

1. Verify backend is running: `curl http://127.0.0.1:8000/health`
2. Check CORS is enabled in FastAPI (`main.py`)
3. Update `VITE_API_URL` in `.env` if backend is on different host

### Database issues

1. Delete `backend/greenpoint.db` to reset
2. Restart backend server
3. Database will be recreated automatically

### Node/npm issues

```bash
# Clear cache and reinstall
cd frontend
rm -r node_modules package-lock.json
npm install
npm run dev
```
