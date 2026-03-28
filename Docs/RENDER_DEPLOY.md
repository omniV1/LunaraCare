# Render Deployment Checklist

## 401 Unauthorized After Login

If you log in successfully but immediately get 401 on API requests and are logged out:

### 1. Verify JWT secrets

- **JWT_SECRET** and **JWT_REFRESH_SECRET** must be set in Render → Your Service → Environment
- They must be **identical** across deploys—if you rotate them, all existing tokens become invalid
- Use strong random values (e.g. `openssl rand -hex 32`)

### 2. Verify user exists in production DB

- **MONGODB_URI** on Render must point to the database where your user was created
- If using a new/production Atlas cluster, you must:
  - Run the seed script, **or**
  - Register again on the production URL
- The JWT contains your user ID; the backend looks up that user in the DB. If the user doesn't exist, you get 401.

### 3. Verify CORS

- **FRONTEND_URL** should match where your app is served (e.g. `https://www.lunaracare.org`)
- **CORS_ALLOWED_ORIGINS** can override; include your frontend origin

### 4. Check Render logs

After the passport change, logs will show:
- `JWT valid but user not found in DB` → User ID from token doesn't exist in production MongoDB
- `JWT strategy error` → Token invalid/expired or wrong JWT_SECRET

### Quick test

1. Clear localStorage (or use incognito)
2. Log in again on the production frontend
3. If 401 persists, check Render logs for the message above and verify secrets + DB
