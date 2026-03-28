# LUNARA Backend API

Express.js backend for the LUNARA Postpartum Support Platform. This server provides a RESTful API with real-time messaging via Socket.IO, JWT-based authentication with MFA support, MongoDB data persistence with GridFS file storage, email notifications, and push notifications.

## Technology Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.18 with TypeScript 5.8 |
| Database | MongoDB with Mongoose 8.15 ODM |
| Authentication | Passport.js (Local, JWT, Google OAuth strategies) |
| Tokens | JSON Web Tokens (access + refresh) |
| MFA | TOTP via otpauth with QR code generation |
| Real-time | Socket.IO 4.7 |
| File Storage | MongoDB GridFS (with legacy Cloudinary support) |
| Email | Nodemailer (SMTP) |
| Push Notifications | web-push (VAPID) |
| API Documentation | Swagger/OpenAPI via swagger-jsdoc |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
| Validation | express-validator |
| Logging | Winston (application), Morgan (HTTP requests) |
| Testing | Jest, Supertest, mongodb-memory-server |
| Process Management | Nodemon (development) |

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── passport.ts                # Passport strategy configuration
│   ├── middleware/
│   │   ├── index.ts                   # authenticate, requireRole, errorHandler,
│   │   │                                notFoundHandler, securityHeaders,
│   │   │                                sanitizeRequest, responseFormatter,
│   │   │                                requestLogger, asyncHandler,
│   │   │                                handleValidationErrors
│   │   └── cacheMiddleware.ts         # TTL-based response caching
│   ├── models/                        # 19 Mongoose models
│   │   ├── User.ts                    # Base user (all roles)
│   │   ├── Client.ts                  # Client profile and intake data
│   │   ├── Provider.ts                # Provider profile, certs, availability
│   │   ├── Appointment.ts             # Scheduling with status workflow
│   │   ├── AvailabilitySlot.ts        # Provider time slots
│   │   ├── Message.ts                 # Chat messages
│   │   ├── CheckIn.ts                 # Mood and symptom tracking
│   │   ├── CarePlan.ts                # Care plans with milestones
│   │   ├── CarePlanTemplate.ts        # Reusable care plan templates
│   │   ├── BlogPost.ts               # Blog articles
│   │   ├── BlogPostVersion.ts        # Blog version history
│   │   ├── Resources.ts              # Educational resources
│   │   ├── ResourceVersion.ts        # Resource version history
│   │   ├── Category.ts               # Hierarchical categories
│   │   ├── ClientDocument.ts          # Uploaded documents and forms
│   │   ├── ClientDocumentVersion.ts   # Document version history
│   │   ├── UserResourceInteraction.ts # Views, likes, bookmarks
│   │   ├── PushSubscription.ts        # Web Push subscriptions
│   │   └── Inquiry.ts                 # Public contact form submissions
│   ├── routes/                        # 20 route modules
│   │   ├── auth.ts                    # Registration, login, email verify, password reset
│   │   ├── mfa.ts                     # TOTP setup, verify, disable, backup codes
│   │   ├── users.ts                   # Profile management, admin user operations
│   │   ├── providers.ts               # Provider profiles, availability, ratings
│   │   ├── client.ts                  # Client profiles, provider assignment
│   │   ├── appointments.ts            # Scheduling, availability, calendar
│   │   ├── messages.ts                # Conversations, send, read status
│   │   ├── checkins.ts                # Mood/symptom check-ins, trends, alerts
│   │   ├── carePlans.ts               # Care plan CRUD, milestones, templates
│   │   ├── blog.ts                    # Blog CRUD, publishing, versioning
│   │   ├── resources.ts               # Resource CRUD, publishing, versioning
│   │   ├── documents.ts               # Document upload, submission, review
│   │   ├── files.ts                   # GridFS file upload/download/delete
│   │   ├── categories.ts             # Category hierarchy CRUD
│   │   ├── intake.ts                  # Client intake forms
│   │   ├── recommendations.ts         # Personalized resource suggestions
│   │   ├── interactions.ts            # View/like/bookmark tracking
│   │   ├── pushNotifications.ts       # Push subscribe/unsubscribe/send
│   │   ├── admin.ts                   # Provider creation, stats, seeding
│   │   └── public.ts                  # Platform info, contact, public content
│   ├── services/                      # 30 business logic services
│   │   ├── authService.ts             # Register, login, verify, reset, MFA
│   │   ├── mfaService.ts              # TOTP setup, verification, backup codes
│   │   ├── userService.ts             # User CRUD, search, preferences
│   │   ├── clientService.ts           # Client profiles, assignment tracking
│   │   ├── providerService.ts         # Provider profiles, availability, ratings
│   │   ├── appointmentService.ts      # Scheduling, calendar, status transitions
│   │   ├── appointmentNotificationService.ts # Email notifications for appointments
│   │   ├── appointmentReminderService.ts     # Scheduled reminders (15-min interval)
│   │   ├── messageService.ts          # Message persistence, conversations
│   │   ├── messageRateLimiter.ts      # Per-user message rate limiting
│   │   ├── socketConnectionManager.ts # Socket.IO connection tracking
│   │   ├── checkinService.ts          # Check-in CRUD
│   │   ├── checkinTrendService.ts     # Mood/symptom trend analysis and alerts
│   │   ├── carePlanService.ts         # Care plan CRUD, milestone tracking
│   │   ├── blogService.ts             # Blog CRUD, versioning, publishing
│   │   ├── resourceService.ts         # Resource CRUD, versioning, publishing
│   │   ├── categoryService.ts         # Category hierarchy management
│   │   ├── documentService.ts         # Document upload, review workflow
│   │   ├── fileService.ts             # File operation wrapper
│   │   ├── gridfsService.ts           # MongoDB GridFS integration
│   │   ├── emailService.ts            # Nodemailer templates and sending
│   │   ├── pushNotificationService.ts # Web Push sending
│   │   ├── pushSubscriptionService.ts # Subscription management
│   │   ├── recommendationService.ts   # Personalized resource recommendations
│   │   ├── intakeService.ts           # Intake form management
│   │   ├── inquiryService.ts          # Contact form handling
│   │   ├── interactionService.ts      # View/like/bookmark tracking
│   │   ├── adminService.ts            # Admin operations, provider creation
│   │   ├── cacheService.ts            # In-memory TTL cache
│   │   └── clientService.ts           # Client operations
│   ├── seeds/
│   │   └── seedContent.ts            # Auto-seeds categories, blog posts, and resources on startup
│   ├── types/
│   │   ├── index.ts                   # TypeScript interfaces and enums
│   │   └── express.d.ts              # Express request type extensions
│   ├── utils/
│   │   ├── errors.ts                  # Custom error classes (APIError, NotFoundError, etc.)
│   │   ├── logger.ts                  # Winston logger configuration
│   │   ├── tokenUtils.ts             # JWT creation and verification helpers
│   │   └── queryOptimization.ts      # Database query helpers
│   └── server.ts                      # Application entry point
├── scripts/
│   ├── createAdmin.ts                 # Create an admin user account
│   ├── seedCarePlanTemplates.ts       # Seed care plan templates
│   ├── seedTestUsers.ts               # Seed test client and provider accounts
│   └── verifyEmailConfig.ts          # Verify SMTP email configuration
├── tests/
│   ├── integration/                   # API integration tests
│   ├── services/                      # Service unit tests
│   ├── middleware/                    # Middleware unit tests
│   └── utils/                         # Utility unit tests
└── package.json
```

## API Endpoints

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new client or provider |
| POST | `/login` | Email/password login |
| POST | `/google` | Initiate Google OAuth |
| GET | `/google/callback` | Google OAuth callback |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |
| POST | `/verify-email` | Verify email with token |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Complete password reset |
| GET | `/check-email` | Check if email is already registered |
| POST | `/resend-verification` | Resend verification email |
| POST | `/me` | Get current authenticated user |
| GET | `/session` | Get session info |

### Multi-Factor Authentication (`/api/auth/mfa`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/setup` | Generate TOTP secret and QR code |
| POST | `/confirm-setup` | Confirm MFA with 6-digit code |
| POST | `/disable` | Disable MFA |
| POST | `/verify` | Verify TOTP code during login |
| GET | `/backup-codes` | Retrieve backup codes |

### Users (`/api/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update current user profile |
| GET | `/all` | List all users (admin) |
| GET | `/search` | Search users |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user (admin) |
| DELETE | `/:id` | Delete user (admin) |
| POST | `/:id/lock` | Lock/unlock account (admin) |

### Providers (`/api/providers`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current provider profile |
| PUT | `/me` | Update provider profile |
| GET | `/all` | List all providers |
| GET | `/available` | Get providers with open availability |
| GET | `/search` | Search providers |
| GET | `/stats` | Provider statistics |
| GET | `/:id` | Get provider details |
| PUT | `/:id` | Update provider (admin) |
| DELETE | `/:id` | Delete provider (admin) |
| PUT | `/:id/availability` | Update availability |
| POST | `/:id/rating` | Rate a provider |
| POST | `/:id/verify` | Verify provider (admin) |

### Clients (`/api/client`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current client profile |
| PUT | `/me` | Update client profile |
| GET | `/stats` | Client statistics |
| GET | `/assigned-provider` | Get assigned provider info |
| GET | `/:id` | Get client details |
| PUT | `/:id` | Update client (admin) |
| GET | `/:id/history` | Get client history |
| POST | `/:id/assign-provider` | Assign provider to client |

### Appointments (`/api/appointments`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List appointments for current user |
| POST | `/` | Create appointment |
| GET | `/upcoming` | Get upcoming appointments |
| GET | `/calendar` | Calendar view |
| GET | `/availability` | Get provider availability |
| GET | `/:id` | Get appointment details |
| PUT | `/:id` | Update appointment |
| DELETE | `/:id` | Delete appointment |
| POST | `/:id/request` | Client requests appointment |
| POST | `/:id/propose` | Propose alternative time |
| POST | `/:id/confirm` | Confirm appointment |
| POST | `/:id/cancel` | Cancel appointment |
| POST | `/availability/create` | Create availability slot |
| DELETE | `/availability/:id` | Delete availability slot |
| POST | `/bulk` | Bulk create appointments |
| GET | `/provider/:id` | Get provider's appointments |
| GET | `/client/:id` | Get client's appointments |

### Messages (`/api/messages`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List conversations |
| POST | `/` | Send a message |
| GET | `/all` | Get all messages (paginated) |
| GET | `/unread` | Get unread messages |
| GET | `/unread/count` | Get unread count |
| GET | `/conversation/:id` | Get conversation messages |
| PUT | `/:id/read` | Mark message as read |
| DELETE | `/:id` | Delete message |

### Check-ins (`/api/checkins`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit a check-in |
| GET | `/` | Get user's check-ins |
| GET | `/trends` | Get mood/symptom trends |
| GET | `/alerts` | Get alerts for concerning patterns |
| GET | `/:id` | Get specific check-in |
| PUT | `/:id` | Update check-in |
| DELETE | `/:id` | Delete check-in |
| GET | `/provider/:id` | Provider views client check-ins |

### Care Plans (`/api/care-plans`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates` | List care plan templates |
| POST | `/templates` | Create template (provider) |
| POST | `/` | Create care plan |
| GET | `/:id` | Get care plan details |
| PUT | `/:id` | Update care plan |
| DELETE | `/:id` | Delete care plan |
| GET | `/:id/milestones` | Get milestones |
| PUT | `/:id/milestones/:milestoneId` | Update milestone status |
| PUT | `/:id/progress` | Update progress |
| POST | `/:id/complete` | Mark as complete |
| GET | `/client/:id` | Get client's care plans |
| GET | `/provider/:id` | Get provider's care plans |

### Blog (`/api/blog`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List published blog posts |
| POST | `/` | Create blog post (provider) |
| GET | `/search` | Search blog posts |
| GET | `/slug/:slug` | Get post by slug |
| GET | `/:id` | Get post by ID |
| PUT | `/:id` | Update blog post |
| DELETE | `/:id` | Delete blog post |
| GET | `/:id/versions` | Get version history |
| POST | `/:id/restore` | Restore previous version |
| POST | `/:id/publish` | Publish post |
| POST | `/:id/unpublish` | Unpublish post |

### Resources (`/api/resources`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List resources (filterable) |
| POST | `/` | Create resource (provider/admin) |
| GET | `/search` | Search resources |
| GET | `/category/:categoryId` | Get resources by category |
| GET | `/:id` | Get resource details |
| PUT | `/:id` | Update resource |
| DELETE | `/:id` | Delete resource |
| GET | `/:id/versions` | Get version history |
| POST | `/:id/restore` | Restore previous version |
| POST | `/:id/publish` | Publish resource |
| POST | `/:id/unpublish` | Unpublish resource |

### Documents (`/api/documents`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's documents |
| POST | `/` | Upload/create document |
| GET | `/:id` | Get document details |
| PUT | `/:id` | Update document |
| DELETE | `/:id` | Delete document |
| POST | `/:id/submit` | Submit to provider |
| POST | `/:id/review` | Provider review with feedback |
| GET | `/:id/versions` | Get version history |
| POST | `/:id/restore` | Restore previous version |
| GET | `/provider/:id` | Provider view of client documents |

### Files (`/api/files`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file to GridFS |
| GET | `/:id` | Download file |
| DELETE | `/:id` | Delete file |
| GET | `/:id/info` | Get file metadata |

### Categories (`/api/categories`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all categories |
| POST | `/` | Create category (admin) |
| GET | `/search` | Search categories |
| GET | `/:id` | Get category details |
| PUT | `/:id` | Update category |
| DELETE | `/:id` | Delete category |
| GET | `/:id/tree` | Get full category tree |
| GET | `/:id/children` | Get subcategories |

### Intake (`/api/intake`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current user's intake |
| POST | `/` | Create or update intake |
| GET | `/:id` | Get intake by ID |
| PUT | `/:id` | Update intake |

### Recommendations (`/api/recommendations`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/resources` | Get personalized resource suggestions |
| GET | `/checkin-insights` | Get check-in trend insights |

### Interactions (`/api/interactions`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/view` | Track resource view |
| POST | `/like` | Like resource |
| POST | `/bookmark` | Bookmark resource |
| GET | `/history` | Get interaction history |

### Push Notifications (`/api/push`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/vapid-public-key` | Get VAPID public key |
| POST | `/subscribe` | Subscribe to push notifications |
| POST | `/unsubscribe` | Unsubscribe |
| POST | `/send-test` | Send test notification |
| GET | `/subscriptions` | Get user's subscriptions |

### Admin (`/api/admin`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/providers` | Create provider account |
| GET | `/stats` | Platform statistics |
| GET | `/analytics` | Analytics data |
| POST | `/content/seed` | Seed default content |

### Public (`/api/public`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/info` | Platform information (no auth) |
| GET | `/contact` | Contact information |
| POST | `/inquiries` | Submit contact form |
| GET | `/resources` | Public resources |
| GET | `/blog` | Public blog posts |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

## Data Models

### User
Base model for all roles. Fields: firstName, lastName, email, password (bcrypt hashed), role (client/provider/admin), isEmailVerified, mfaSecret, mfaEnabled, refreshTokens (max 5), failedLoginAttempts, lockUntil, lastLogin.

### Client
Extends User with postpartum-specific data: partner name, address, emergency contact, birth details (type, location, complications), medical and mental health history, feeding preferences and challenges, support needs (breastfeeding, emotional, recovery, sleep, meal prep, household help, partner support), assigned provider reference.

### Provider
Professional profile: certifications (DONA, CAPPA, IBCLC, etc.), years of experience, specialties, business contact, availability by day, max clients, holidays, pricing (hourly and package rates), client list with status, average rating.

### Appointment
Fields: clientId, providerId, startTime, endTime, status (requested/confirmed/scheduled/completed/cancelled), type (virtual/in_person), notes, cancellation reason, timestamps.

### AvailabilitySlot
Provider time blocks: date, startTime, endTime, isBooked, recurrencePattern.

### Message
Fields: conversationId, sender, receiver, content, type (text/image/file/system), read status.

### CheckIn
Fields: userId, date, moodScore (1-10), physicalSymptoms (fatigue, sleep issues, anxiety, pain, headache, nausea, dizziness, breast soreness, bleeding), sharedWithProvider, providerReviewed.

### CarePlan / CarePlanTemplate
Care plans with sections containing milestones. Milestone fields: title, weekOffset, category (physical/emotional/feeding/self_care), status (pending/in_progress/completed/skipped), completedAt.

### BlogPost / BlogPostVersion
Blog content with title, slug, excerpt, content, author, featuredImage, tags, category, isPublished, viewCount, readTime. Versioning for history and restore.

### Resources / ResourceVersion
Educational content with title, description, content, category, tags, difficulty (beginner/intermediate/advanced), targetWeeks (postpartum), targetPregnancyWeeks, fileUrl, thumbnailUrl, isPublished. Versioning for history and restore.

### ClientDocument / ClientDocumentVersion
Document types: emotional-survey, health-assessment, personal-assessment, feeding-log, sleep-log, mood-check-in, recovery-notes, progress-photo. Workflow: draft, submitted-to-provider, reviewed-by-provider, completed. Privacy levels: client-only, client-and-provider, care-team.

### Category
Hierarchical categories with parent and subcategory references. Used for blog and resources.

### UserResourceInteraction
Tracks views, likes, and bookmarks per user per resource.

### PushSubscription
Web Push API subscription data: userId, endpoint, keys (p256dh, auth).

### Inquiry
Contact form submissions: name, email, phone, message, status (new/contacted/converted/closed).

## Authentication and Security

### Token System
- **Access tokens**: JWT, 15-minute lifetime, signed with JWT_SECRET
- **Refresh tokens**: 7-day lifetime, stored as httpOnly secure cookies
- **Max sessions**: 5 concurrent refresh tokens per user (oldest evicted)

### Account Protection
- Account locks after 5 failed login attempts (15-minute lockout)
- Email verification required before login (configurable via SKIP_EMAIL_VERIFICATION)
- Rate limiting on login, register, and password reset endpoints (5 requests per 15 minutes)

### MFA
- TOTP-based two-factor authentication
- QR code generation for authenticator app enrollment
- 8 backup codes generated on setup
- Required on every login when enabled

### Request Security
- Helmet security headers
- CORS with configurable allowed origins
- Input sanitization (string trimming)
- express-validator on route inputs
- Global error handler that hides internal details in production

## Real-time Messaging (Socket.IO)

### Client-to-Server Events
| Event | Description |
|-------|-------------|
| `join_user_room` | Join personal notification room |
| `join_conversation` | Join a specific conversation room |
| `send_message` | Send a message (validated and persisted) |

### Server-to-Client Events
| Event | Description |
|-------|-------------|
| `new_message` | Broadcast to conversation room |
| `new_message_notification` | Notification to receiver's personal room |
| `message_delivered` | Confirmation to sender |
| `message_error` | Error response |
| `auth_error` | Authentication failure |
| `rate_limit` | Rate limit exceeded |

Authentication is required on connection via JWT token (auth or query parameter). Messages are only allowed between clients and their assigned providers. Rate limit: 30 messages per 10 seconds per user.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)
- Gmail account with app password (for email features)

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```

3. **Required environment variables:**
   ```env
   NODE_ENV=development
   PORT=10000
   MONGODB_URI=mongodb://localhost:27017/lunara
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:5173
   SKIP_EMAIL_VERIFICATION=true
   ```

4. **Optional environment variables:**
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=...
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_EMAIL=...
   CLOUDINARY_URL=...
   RATE_LIMIT_DISABLED=true
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   LOG_LEVEL=info
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the API:**
   - Swagger UI: http://localhost:10000/api-docs
   - Health check: http://localhost:10000/api/health

### Available Scripts

```bash
npm run dev              # Start with nodemon and ts-node
npm run dev:watch        # Start with file watching
npm start                # Production start (from dist/)
npm run build            # Compile TypeScript to JavaScript
npm run type-check       # TypeScript type checking (no emit)
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run create:admin     # Create an admin user (requires ADMIN_EMAIL, ADMIN_PASSWORD)
npm run seed:care-plan-templates  # Seed care plan templates
npm run seed:test-users  # Seed test client and provider accounts
npm run email:verify     # Verify SMTP email configuration
```

## Seed Data

On startup, the server automatically seeds default content if none exists:
- 9 categories (General, Pregnancy, Postpartum, Breastfeeding, Nutrition, Mental Health, Physical Recovery, Newborn Care, Self-Care)
- 10+ blog posts covering postpartum topics
- 15+ educational resources targeted by postpartum week (0-12 weeks)

Additional seeding scripts are available for care plan templates and test users (see scripts above).

## Testing

- **Integration tests**: 8 test suites covering auth, appointments, messaging, care plans, check-ins, intake, resources, and scheduling
- **Service unit tests**: 12+ test files for core business logic
- **Middleware tests**: caching and request handling
- **Test database**: mongodb-memory-server provides isolated in-memory MongoDB instances

```bash
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report
npm run test:watch        # Watch mode
```

## Deployment

The backend deploys to Render via the `render.yaml` blueprint at the repository root.

- **Build**: `npm ci --include=dev && npm run type-check && npm run build`
- **Start**: `npm start` (runs `node dist/server.js`)
- **Health check**: `/api/health`
- **Plan**: Free tier
- **Region**: Oregon

Production environment variables are configured in the Render dashboard (JWT secrets, MongoDB URI, email credentials, VAPID keys, OAuth credentials).

### Production Checklist

- Strong JWT secrets (32+ characters)
- MongoDB Atlas with IP whitelisting
- SKIP_EMAIL_VERIFICATION set to false
- CORS configured for production frontend domain
- VAPID keys generated for push notifications
- Gmail app password (not regular password) for email

## License

This project is licensed under the MIT License.
