# LUNARA Development Guide

Complete setup, architecture, and API reference for the LUNARA platform.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [API Reference](#api-reference)
6. [Authentication](#authentication)
7. [Database Schema](#database-schema)
8. [Document Upload System](#document-upload-system)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 1. Clone and Install

```bash
git clone https://github.com/omniV1/lunaraCare.git
cd lunaraCare

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd ../Lunara
npm install
cp .env.example .env
# Edit .env with your settings
```

### 2. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# API: http://localhost:10000
# Docs: http://localhost:10000/api-docs

# Terminal 2 - Frontend
cd Lunara
npm run dev
# App: http://localhost:5173
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      LUNARA PLATFORM                        │
├──────────────────────────┬──────────────────────────────────┤
│       FRONTEND           │           BACKEND                │
│   (React + TypeScript)   │    (Node.js + Express)           │
├──────────────────────────┼──────────────────────────────────┤
│  • React 18              │  • Express.js                    │
│  • Vite                  │  • TypeScript                    │
│  • Tailwind CSS          │  • MongoDB + Mongoose            │
│  • React Router v6       │  • Passport.js (JWT)             │
│  • React Hook Form       │  • Socket.IO                     │
│  • Zod Validation        │  • Nodemailer                    │
│  • Axios                 │  • GridFS (file storage)         │
└──────────────────────────┴──────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    MongoDB      │
                    │    Atlas        │
                    └─────────────────┘
```

### Directory Structure

```
AQC/
├── backend/
│   ├── src/
│   │   ├── config/         # Passport, database config
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers, token utils
│   │   └── server.ts       # Entry point
│   └── tests/
├── Lunara/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/
└── Docs/
```

---

## Backend Setup

### Environment Variables

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=10000
API_URL=http://localhost:10000/api
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lunara

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email (Gmail with app password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@lunara.com
EMAIL_FROM_NAME=LUNARA Platform

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Development
SKIP_EMAIL_VERIFICATION=true
```

> **Note:** File uploads are stored in MongoDB GridFS. No external file storage configuration required.

### Available Scripts

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start            # Production start
npm test             # Run tests
npm run test:coverage # Tests with coverage
npm run type-check   # TypeScript checking
npm run lint         # ESLint
```

---

## Frontend Setup

### Environment Variables

Create `Lunara/.env`:

```env
VITE_API_BASE_URL=http://localhost:10000/api
VITE_APP_NAME=Lunara
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # ESLint
npm run format       # Prettier
```

---

## Portfolio Site Setup

The repository also includes `LunaraPortfolio/`, a standalone project website created to package the application for Milestone 6 and employer-facing review. It is not the production app itself; instead, it summarizes the project and links back to `lunaracare.org`, the repository, and the supporting artifacts.

```bash
cd LunaraPortfolio
npm install
npm run dev
```

Use `npm run build` to create a production bundle for separate deployment if needed.

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login, get tokens |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/verify-email` | POST | Verify email |
| `/api/auth/forgot-password` | POST | Request reset |
| `/api/auth/reset-password` | POST | Reset password |

### Users

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/profile` | GET | Yes | Get current user |
| `/api/users/profile` | PUT | Yes | Update profile |

### Appointments

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/appointments` | GET | Yes | List appointments |
| `/api/appointments/:id` | GET | Yes | Get appointment |
| `/api/appointments` | POST | Yes | Create appointment |
| `/api/appointments/:id` | PUT | Yes | Update appointment |
| `/api/appointments/:id` | DELETE | Yes | Delete appointment |

### Messages

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/messages` | GET | Yes | List messages |
| `/api/messages/:id` | GET | Yes | Get message |
| `/api/messages` | POST | Yes | Send message |
| `/api/messages/:id` | DELETE | Yes | Delete message |

### Documents

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/documents` | GET | Yes | List documents |
| `/api/documents` | POST | Yes | Create document |
| `/api/documents/:id` | GET | Yes | Get document |
| `/api/documents/:id` | PUT | Yes | Update document |
| `/api/documents/:id` | DELETE | Yes | Delete document |
| `/api/documents/:id/submit` | POST | Yes | Submit to provider |
| `/api/documents/:id/review` | POST | Provider | Review with feedback |

### Resources

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/resources` | GET | Yes | List resources |
| `/api/resources/:id` | GET | Yes | Get resource |
| `/api/resources` | POST | Provider | Create resource |
| `/api/resources/:id` | PUT | Provider | Update resource |

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/platform-info` | GET | Platform info |
| `/api/public/doulas` | GET | Featured providers |
| `/api/public/contact` | POST | Contact form |

---

## Authentication

### JWT Flow

```
1. POST /auth/login → { accessToken (1h), refreshToken (7d) }
2. Include header: Authorization: Bearer <accessToken>
3. On 401: POST /auth/refresh → { accessToken (new) }
4. After 7 days: User must login again
```

### Using Swagger UI

1. Start backend: `npm run dev`
2. Open http://localhost:10000/api-docs
3. Login via `POST /auth/login`
4. Copy `accessToken` from response
5. Click "Authorize" button
6. Paste token (without "Bearer")
7. Test protected endpoints

### Using cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' \
  | jq -r '.data.accessToken')

# Use token
curl http://localhost:10000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Schema

### User

```typescript
{
  email: string (unique),
  password: string (hashed),
  firstName: string,
  lastName: string,
  role: 'client' | 'provider' | 'admin',
  isEmailVerified: boolean,
  emailVerificationToken?: string,
  passwordResetToken?: string,
  refreshToken?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Client (extends User)

```typescript
{
  user: ObjectId (ref: User),
  dateOfBirth?: Date,
  phoneNumber?: string,
  address?: { street, city, state, zipCode },
  assignedProvider?: ObjectId,
  intakeCompleted: boolean,
  intakeData?: { ... },
  postpartumWeek?: number,
  deliveryDate?: Date
}
```

### Provider (extends User)

```typescript
{
  user: ObjectId (ref: User),
  title?: string,
  bio?: string,
  certifications: string[],
  specialties: string[],
  yearsExperience?: number,
  availability?: { ... },
  serviceAreas: string[],
  acceptingNewClients: boolean
}
```

### Appointment

```typescript
{
  client: ObjectId,
  provider: ObjectId,
  dateTime: Date,
  duration: number (minutes),
  type: 'virtual' | 'in-person',
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
  notes?: string,
  location?: string
}
```

### Message

```typescript
{
  sender: ObjectId,
  recipient: ObjectId,
  content: string,
  read: boolean,
  attachments?: string[],
  createdAt: Date
}
```

---

## Document Upload System

### Overview

Clients can upload documents (surveys, assessments, photos) to providers. Files are stored in **MongoDB GridFS** (HIPAA-compliant), metadata in MongoDB collections.

### Document Types

- `emotional-survey` - Emotional wellness surveys (PDF)
- `health-assessment` - Health assessments (PDF)
- `progress-photo` - Progress photos (JPG, PNG)
- `personal-assessment` - Personal assessments (PDF)

### Submission Workflow

```
1. Client uploads file → Backend API → MongoDB GridFS
2. Document created with status: 'draft'
3. Client submits → status: 'submitted-to-provider'
4. Provider reviews → status: 'reviewed-by-provider'
5. Provider completes → status: 'completed'
```

### Privacy Levels

- `client-only` - Only the client can see
- `client-and-provider` - Client and assigned provider
- `care-team` - All providers in care team

### File Storage (GridFS)

Files are stored in MongoDB GridFS, which:
- Keeps all data in one place (MongoDB Atlas)
- Supports HIPAA compliance when using MongoDB Atlas dedicated clusters
- Handles files up to 16MB per upload
- Provides automatic chunking for large files

**API Endpoints:**
- `POST /api/files/upload` - Upload a file (multipart/form-data)
- `GET /api/files/:fileId` - Download/view a file
- `GET /api/files/:fileId/info` - Get file metadata
- `DELETE /api/files/:fileId` - Delete a file

---

## Testing

### Backend Tests

```bash
cd backend
npm test                    # All tests
npm run test:coverage       # With coverage
npm test -- auth.test.ts    # Specific file
```

### Frontend Tests

```bash
cd Lunara
npm test                    # All tests
npm run test:coverage       # With coverage
```

### Manual Testing

1. Start both servers
2. Register a test user
3. Login and get token
4. Test endpoints via Swagger or Postman

---

## Deployment

### Production Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:prod-pass@cluster/lunara
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
FRONTEND_URL=https://your-domain.com
SKIP_EMAIL_VERIFICATION=false
```

### Docker

```bash
# Build
docker build -t lunara-backend ./backend

# Run
docker run -p 5000:5000 --env-file .env lunara-backend
```

### Security Checklist

- [ ] Strong JWT secrets (64+ characters)
- [ ] MongoDB Atlas IP allowlist configured
- [ ] HTTPS/TLS enabled
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled
- [ ] Email verification enabled
- [ ] Error monitoring configured (Sentry)
- [ ] Database backups scheduled

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check connection string format
- Verify IP is allowlisted in Atlas
- Ensure credentials are correct

**JWT Errors**
- Verify secrets are set in `.env`
- Check token expiration
- Ensure Bearer format in header

**CORS Errors**
- Check `FRONTEND_URL` matches exactly
- Include protocol (http/https)

**Email Not Sending**
- Use Gmail app password (not regular password)
- Enable "Less secure apps" or use app-specific password
- Check EMAIL_HOST and EMAIL_PORT

### Debug Mode

```bash
# Backend with debug logs
DEBUG=* npm run dev

# Check environment
node -e "console.log(process.env.MONGODB_URI)"
```

---

## Resources

- **API Docs**: http://localhost:10000/api-docs
- **Repository**: https://github.com/omniV1/lunaraCare
- **MongoDB Docs**: https://docs.mongodb.com
- **Express Docs**: https://expressjs.com
- **React Docs**: https://react.dev

---

*Last updated: February 5, 2026*
