# GreenPoint Mumbai - Routing & Auth Debugging Guide

## ✅ Implementation Complete

This guide covers the routing fix that ensures users are properly redirected to their respective dashboards after Login/Signup.

---

## 🔍 How to Debug

### Step 1: Open Browser DevTools

```
Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
→ Click "Console" tab
```

### Step 2: Watch for Auth Logs

Look for messages with `[AUTH]` and `[ROUTE]` prefixes:

```
[AUTH] Starting login process for: citizen@example.com
[AUTH] Making API request to http://127.0.0.1:8000/login
[AUTH] API Response Status: 200
[AUTH] Setting user in state: citizen@example.com (citizen)
[AUTH] Saving user to localStorage
[AUTH] Login successful
[ROUTE] Redirecting authenticated user to /citizen
```

---

## 🔄 Complete Login Flow

### What Happens Step-by-Step:

```
1. User fills form + clicks Login
   ↓
2. handleLogin() is called
   ↓
3. [AUTH] logs: "Starting login process..."
   ↓
4. AuthContext.login() makes API call to /login
   ↓
5. [AUTH] logs: "API Response Status: 200" (or error if failed)
   ↓
6. Response parsed: { user_id, email, role, session_token }
   ↓
7. [AUTH] logs: "Setting user in state: X@Y.com (citizen)"
   ↓
8. localStorage.setItem('current_user', {...user data...})
   ↓
9. [AUTH] logs: "Login successful"
   ↓
10. handleLogin() checks localStorage
    ↓
11. navigate('/citizen', { replace: true })
    ↓
12. [ROUTE] logs: "Redirecting authenticated user to /citizen"
    ↓
13. ProtectedRoute validates role
    ↓
14. [ROUTE] logs: "Access granted for X@Y.com (citizen) to /citizen"
    ↓
15. DashboardApp renders
```

---

## 🐛 Troubleshooting Common Issues

### Issue #1: "Stuck on Login Page After Clicking Login"

**What to check in console:**

1. Look for `[AUTH]` messages
   - ❌ NO `[AUTH]` messages? → JavaScript error, check errors above console
   - ✅ See `[AUTH] Starting...`? → Continue to step 2

2. Look for API error
   - `[AUTH] Login API Error (401)` → Invalid email/password
   - `[AUTH] Login API Error (500)` → Backend error
   - `[AUTH] Login failed:` → Check backend logs

**Solution:**
- Verify backend is running: `curl http://127.0.0.1:8000/health`
- Check credentials are correct
- Look at backend logs for detailed error

---

### Issue #2: "Login Successful But No Redirect"

**What to check in console:**

```
// Should see these logs in order:
[AUTH] Login successful ✅
[ROUTE] Redirecting authenticated user to /citizen ✅
[ROUTE] Access granted for X@Y.com (citizen) to /citizen ✅
```

If you see `[AUTH] Login successful` but NOT the `[ROUTE]` redirect logs:

**Solution:**
1. Verify localStorage saved the user:
   ```javascript
   // In console:
   JSON.parse(localStorage.getItem('current_user'))
   // Should print: { user_id: "...", email: "...", role: "...", ... }
   ```

2. If empty, the navigate() didn't execute
   - Check browser errors above the console
   - Refresh page and try again

---

### Issue #3: "Role Mismatch - Redirected to Wrong Dashboard"

**Console shows:**
```
[ROUTE] User role mismatch. User role: citizen, Required: collector
[ROUTE] Redirecting to /citizen
```

This is **expected behavior** - a safety feature that prevents:
- Citizen accessing collector endpoint
- Collector seeing citizen data

**Solution:**
- This is working correctly!
- User is protected and redirected to their correct role dashboard

---

### Issue #4: "Collector Access Code Error"

**Console shows:**
```
[AUTH] Signup API Error (400): Invalid Collector Access Code
```

**Solutions:**
1. Access code must be exactly: `BMC2026` (case-sensitive)
2. Check for extra spaces or typos
3. Verify you're on signup tab (not login)

---

## 🧪 Manual Testing Checklist

### Test Citizen Login
- [ ] Navigate to http://localhost:5173
- [ ] Click "Login" tab
- [ ] Enter: `citizen@example.com` / `password123`
- [ ] Click "Login"
- [ ] **Expected:** Redirected to `/citizen`
- [ ] **Console:** Should see `[AUTH]` and `[ROUTE]` logs

### Test Citizen Signup
- [ ] Navigate to http://localhost:5173
- [ ] Click "Sign Up" tab
- [ ] Enter: `newcitizen@example.com` / `password123`
- [ ] Select: "Citizen"
- [ ] Click "Create Account"
- [ ] **Expected:** Redirected to `/citizen`
- [ ] **Console:** Should see signup + login + redirect logs

### Test Collector Signup
- [ ] Navigate to http://localhost:5173
- [ ] Click "Sign Up" tab
- [ ] Enter: `collector@bmc.com` / `password123`
- [ ] Select: "BMC Collector"
- [ ] Enter Access Code: `BMC2026`
- [ ] Click "Create Account"
- [ ] **Expected:** Redirected to `/collector`
- [ ] **Console:** Should see collector-specific logs

### Test Role Mismatch Protection
- [ ] Log in as citizen
- [ ] Manually type: `http://localhost:5173/collector`
- [ ] **Expected:** Automatically redirected to `/citizen`
- [ ] **Console:** Should show `[ROUTE] User role mismatch...`

### Test Logout
- [ ] Click "Logout" button in header
- [ ] **Expected:** Redirected to `/login`, success toast shown
- [ ] **Console:** Should show `[AUTH] Logout called...`
- [ ] Manually refresh page
- [ ] **Expected:** Should stay on `/login` (not auto-login)

### Test Session Persistence
- [ ] Log in as citizen
- [ ] Press F5 to refresh
- [ ] **Expected:** Stay on `/citizen` (not redirected to login)
- [ ] Open DevTools console
- [ ] **Console:** Should show `[AUTH] Found existing user session...`

---

## 💾 localStorage Inspection

### View Current User Data

In browser console:
```javascript
// View all user data
console.table(JSON.parse(localStorage.getItem('current_user')))

// View just the role
console.log(JSON.parse(localStorage.getItem('current_user')).role)

// View all localStorage keys
console.table(Object.keys(localStorage))
```

### Reset localStorage (Nuclear Option)

```javascript
// Clear ALL stored data
localStorage.clear()

// Then refresh
location.reload()

// Should redirect to /login
```

---

## 🌐 API Testing

### Using curl (Backend Verification)

```bash
# Test login
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@example.com","password":"password123"}'

# Expected response:
# {
#   "transaction_id": "xxx",
#   "timestamp": "2024-04-16T...",
#   "data": {
#     "user_id": "xxx",
#     "email": "citizen@example.com",
#     "role": "citizen",
#     "session_token": "xxx"
#   }
# }
```

### Using Browser Network Tab

1. Open DevTools → "Network" tab
2. Fill login form + click Login
3. Look for POST request to `/login`
4. Click on it → "Response" tab
5. Verify you see `"role": "citizen"` in response

---

## 📊 Logging Reference

### Auth Events ([AUTH] prefix)

| Log | Meaning | Action |
|-----|---------|--------|
| `Starting login process` | Form submitted | Check email format |
| `Making API request to...` | Calling backend | Verify backend URL |
| `API Response Status: 200` | Success | Continue to redirect |
| `API Response Status: 401` | Invalid credentials | Check email/password |
| `API Response Status: 500` | Backend error | Check backend logs |
| `Setting user in state` | Updating React state | User object received |
| `Saving user to localStorage` | Persisting session | Data saved for refresh |
| `Login successful` | Ready to redirect | Check [ROUTE] logs next |
| `Logout called for...` | Logout initiated | User session cleared |

### Route Events ([ROUTE] prefix)

| Log | Meaning | Action |
|-----|---------|--------|
| `Current path: /citizen` | Page location | Verify correct URL |
| `No authenticated user` | Not logged in | Redirect to /login (expected) |
| `User already authenticated` | Logged in + on /login | Redirect to dashboard |
| `User role mismatch` | Role doesn't match path | Redirect to correct dashboard |
| `Access granted` | Auth + role validated | Page renders normally |

---

## 🎯 Key Points to Remember

1. **localStorage is the source of truth**
   - Checked by ProtectedRoute
   - Persists across page refreshes
   - Cleared on logout

2. **navigate() is explicit**
   - Happens AFTER localStorage is set
   - 100ms delay ensures data is written
   - Uses `replace: true` to prevent back-button issues

3. **Console logs are your friend**
   - [AUTH] = authentication events
   - [ROUTE] = routing decisions
   - Follow the flow step-by-step

4. **Role validation prevents accidents**
   - Can't access wrong dashboard
   - Automatically redirects to correct path
   - This is security, not a bug!

---

## 📞 Still Having Issues?

1. **Open console and share the [AUTH] + [ROUTE] logs**
   - Copy the entire console output
   - Look for the exact error message

2. **Verify backend is running**
   ```bash
   curl http://127.0.0.1:8000/health
   # Should return: {"transaction_id":"...","timestamp":"...","data":{"status":"ok"}}
   ```

3. **Check both frontend + backend logs**
   - Frontend: Browser Console (F12)
   - Backend: Terminal where you ran `python -m uvicorn`

4. **Clear cache if stuck**
   ```javascript
   // Browser console:
   localStorage.clear()
   location.reload()
   ```
