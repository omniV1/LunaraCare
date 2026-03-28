# How to Get Your JWT Token

## 🎯 Quick Answer

**You get your JWT token by logging in!** The token is generated automatically when you successfully authenticate.

---

## 📝 Step-by-Step Guide

### **Step 1: Make sure your server is running**

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

---

### **Step 2: Register a user (First time only)**

**Using Swagger UI:** http://localhost:5000/api-docs

1. Find the `POST /auth/register` endpoint
2. Click "Try it out"
3. Fill in:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "client"
}
```

4. Click "Execute"

**OR using curl:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "client"
  }'
```

---

### **Step 3: Login to GET your JWT token**

**Using Swagger UI:**

1. Find the `POST /auth/login` endpoint
2. Click "Try it out"
3. Fill in:

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

4. Click "Execute"
5. **LOOK AT THE RESPONSE** - you'll see:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "67890abc...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "client",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwYWJjLi4uIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTcwMTQ1NjAwMCwiZXhwIjoxNzAxNDU5NjAwfQ.xyz123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

6. **COPY THE `accessToken` VALUE!** ← This is your JWT token!

**OR using curl:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Copy the `accessToken`!**

---

### **Step 4: Use your JWT token**

#### **In Swagger UI:**

1. Click the green **"Authorize"** button (top right)
2. Paste your token in the "Value" field
3. Click "Authorize"
4. Click "Close"
5. Now all your requests will include the token!

#### **In Postman:**

1. Open your request (e.g., `GET /resources`)
2. Go to the **Authorization** tab
3. Select **Type: Bearer Token**
4. Paste your `accessToken` in the **Token** field
5. Send the request!

#### **Using curl:**

```bash
curl -X GET http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with your actual token.

---

## 🎬 Complete Example with Real Commands

### **Full workflow in terminal:**

```bash
# 1. Register a user (first time only)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123",
    "role": "client"
  }'

# 2. Login to get your token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'

# Response will include:
# "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Use the token (replace YOUR_TOKEN with the actual token from step 2)
curl -X GET http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 What Your JWT Token Looks Like

A JWT token is a long string with three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwYWJjZGVmMTIzNDU2Nzg5MCIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3MDE0NTYwMDAsImV4cCI6MTcwMTQ1OTYwMH0.xyz123abc456...
```

**Parts:**
- Header (algorithm & token type)
- Payload (your user info: id, email, role)
- Signature (security verification)

You can decode it at https://jwt.io to see what's inside (but don't share your token publicly!).

---

## ⚠️ Important Notes

### **Token Expiration**

- **Access tokens expire after 1 hour**
- If you get `401 Unauthorized`, your token expired - just login again!
- Refresh tokens last 7 days (for getting new access tokens without logging in)

### **Security**

- ❌ Never commit tokens to Git
- ❌ Never share your tokens publicly
- ❌ Don't hardcode tokens in your code
- ✅ Get a fresh token by logging in
- ✅ Store tokens securely (environment variables, secure storage)

### **Where is the JWT_SECRET?**

The `JWT_SECRET` is a **server-side secret** used to sign tokens. It's in your `.env` file:

```bash
# backend/.env
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-other-secret-key-here
```

**You don't need to touch this** - it's already configured and used automatically by the server.

---

## 🛠️ Troubleshooting

### "Email not verified" error

Your `.env` file needs:
```bash
SKIP_EMAIL_VERIFICATION=true
```

This is for development only - in production, users would verify via email.

### "Invalid credentials" error

- Check your email and password are correct
- Make sure you registered first
- Password must have: uppercase, lowercase, and number

### "Unauthorized" when using token

- Make sure you copied the **full token** (they're long!)
- Check the token hasn't expired (1 hour limit)
- Format should be: `Bearer YOUR_TOKEN` (with the word "Bearer" and a space)

### Can't find the token in the response

Make sure you're looking at the **response body** (not request body):

```json
{
  "data": {
    "accessToken": "← COPY THIS ONE",
    "refreshToken": "← Or this for refresh"
  }
}
```

---

## 📱 Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         JWT Token Quick Reference           │
├─────────────────────────────────────────────┤
│ 1. Login: POST /auth/login                  │
│    → Get accessToken from response          │
│                                              │
│ 2. Copy the token (the long string)         │
│                                              │
│ 3. Use it:                                   │
│    Authorization: Bearer YOUR_TOKEN          │
│                                              │
│ 4. Token expires in: 1 hour                 │
│    → Just login again to get a new one      │
└─────────────────────────────────────────────┘
```

---

## 🎓 Example for Postman

### Create a collection with auto-authentication:

1. **Create Environment:**
   - Name: "LUNARA Dev"
   - Variable: `jwt_token`
   - Value: (paste your token here)

2. **Set Collection Auth:**
   - Type: Bearer Token
   - Token: `{{jwt_token}}`

3. **Update token after login:**
   - Login → Copy new token
   - Update the `jwt_token` variable
   - All requests automatically use the new token!

---

## 🚀 Pro Tip: Postman Auto-Token Script

Add this to your Login request's "Tests" tab in Postman:

```javascript
// Auto-save the token after login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.accessToken) {
        pm.environment.set("jwt_token", jsonData.data.accessToken);
        console.log("✅ Token saved automatically!");
    }
}
```

Now when you login, the token is automatically saved to your environment! 🎉

---

**Still confused?** Just run these 2 commands:

```bash
# Get your token:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Use your token (copy it from above response):
curl -X GET http://localhost:5000/api/resources \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

