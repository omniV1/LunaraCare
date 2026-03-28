---
title: "Milestone 4: Development Phase — Coding"
author: "Owen Lindsey"
date: "March 10, 2026"
subject: "CST-452 Senior Capstone"
papersize: letter
fontsize: 12pt
geometry: [top=1in, bottom=1in, left=1in, right=1in]
linestretch: 1.5
colorlinks: true
urlcolor: "4A90D9"
header-left: "LUNARA Capstone Project"
header-right: "Milestone 4 — Coding"
footer-right: "\\thepage"
listings: true
listings-no-page-break: true
code-block-font-size: "\\scriptsize"
table-use-row-colors: true
block-headings: true
numbersections: false
titlepage: false
---

# Milestone 4: Development Phase (Coding and Testing) — Coding

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Coding Objective

The main objective of the development phase is to build the project code and create documentation based on the requirements and analysis decisions. This phase transforms the design documents into an executable program. System entities such as objects, data tables, classes, and components are developed, integrated, and tested to create a working application. The coding objective for Milestone 4 was to transform the approved requirements from the CST-451 Project Requirements document (FR1–FR15, NFR1–NFR10) and Architecture Plan into integrated, executable software modules while preserving scope discipline, quality, and maintainability. This milestone represented the most intensive period of feature construction in the LUNARA project, producing the working codebase that would later be formally validated in Milestone 5 and packaged for release in Milestone 6.

## Development Deliverables

This document provides the complete submission of the Implementation Plan with detailed task breakdown, the Functional Requirements Mapping (Traceability Matrix), Module Test Cases with testing framework context, the Source Code Listing with architectural documentation, and the Application Demonstration plan. The code repository is hosted on GitHub at `https://github.com/omniV1/AQC`.

\newpage

## IMPLEMENTATION PLAN

### Methodology and Execution Framework

**Formal Methodology Adopted:** Agile Scrum with iterative coding loops  
**Planning Tools:** GitHub Project Boards, sprint planning documents in `Docs/Planning/SPRINT_PLAN.md`  
**Code Review Process:** GitHub Pull Request workflow with peer review  
**Testing Integration:** Continuous integration with automated test execution  

Each iteration cycle followed a consistent pattern: define a scoped story objective, implement the backend route/service/model path, build the frontend consumption layer and UI behavior, integrate and validate in the running environment, and refine based on testability and usability constraints.

### Implementation Plan Matrix — CST-452 Development Iterations

| Use Case / User Story | Detailed Development Tasks | Est. (hrs) | Actual (hrs) | % Complete |
|---|---|---|---|---|
| **FR1: Public Website** | Landing page with hero, offerings accordion, inquiry form; contact POST endpoint | 12 | 12 | 100% |
| **FR2: Authentication & Registration** | JWT + Passport.js local/JWT strategies; register, login, email verify, password reset, token refresh, MFA (TOTP) | 24 | 26 | 100% |
| **FR3: User Dashboards** | Provider dashboard (overview, calendar, clients, resources, blog, documents, reports, profile tabs); Client dashboard (documents, resources, intake, check-ins, messages, appointments, care plan, settings tabs) | 32 | 34 | 100% |
| **FR4: Dynamic Intake Forms** | Five-step wizard (personal, birth, feeding, support, health); Zod validation per step; auto-save; section-level PATCH | 16 | 18 | 100% |
| **FR5: Real-time Messaging** | Socket.IO server with JWT auth; user rooms; conversation rooms; send/receive/deliver events; message rate limiter; MongoDB persistence; MessageCenter and ClientMessageProvider components | 20 | 22 | 100% |
| **FR6: Appointment Scheduling** | CRUD endpoints; upcoming/request/confirm/cancel flows; appointment notification service; reminder service; provider calendar and client scheduling modal | 16 | 16 | 100% |
| **FR7: Resource Library** | Resource CRUD with versioning; category management; client-side browsable library with detail modal; resource interactions (favorites, stats) | 12 | 12 | 100% |
| **FR8: Daily Check-ins** | Check-in model (mood 1–10, 10 symptoms, notes, share toggle); trend service; alert service; provider review panel; client check-in form with history and trend visualization | 16 | 18 | 100% |
| **FR9: Provider Client Management** | Client listing with assign/unassign; client creation with auto-generated password; provider profile editing; reports and analytics | 12 | 14 | 100% |
| **FR10: Care Plan System** | Care plan templates with sections and milestones; plan creation and CRUD; milestone status tracking; auto-progress calculation; CarePlanManager component | 16 | 16 | 100% |
| **FR11: Blog Platform** | Rich text editor; draft/publish workflow; blog versioning; public blog list and detail pages; blog management interface | 10 | 10 | 100% |
| **Documents & Files** | Document CRUD with type and privacy levels; status workflow (draft→submitted→reviewed→completed); GridFS file storage; bulk upload; provider document review with feedback | 14 | 16 | 100% |
| **Push Notifications** | Web Push with VAPID keys; subscription management; test notification endpoint | 6 | 6 | 100% |
| **Security Middleware** | Helmet, CORS, rate limiting, input validation (express-validator), compression, morgan logging | 8 | 8 | 100% |
| **Administrative** | Provider account creation; admin route module | 4 | 4 | 100% |
| **FR12: Digital Journaling** | — | — | — | Deferred |
| **FR13: Daily Insights** | — | — | — | Deferred |
| **FR14: Sleep & Feeding Trackers** | — | — | — | Deferred |
| **FR15: AI Note Summarization** | — | — | — | Deferred |

**Percent of user stories complete for this iteration:** 100% of in-scope stories (15/15)  
**Percent of user stories complete for entire project:** 73% (11 of 15 total FRs; 4 deferred to post-launch)

$$
\text{Iteration Completion Rate} = \frac{\text{Completed Stories}}{\text{Planned Stories}} \times 100\% = \frac{15}{15} \times 100\% = 100\%
$$

$$
\text{Project Completion Rate} = \frac{11}{15} \times 100\% \approx 73\%
$$

\newpage

## FUNCTIONAL REQUIREMENTS MAPPING (TRACEABILITY MATRIX)

For each requirement \(R_i\), at least one implementation artifact and one validation artifact are identified:

$$
R_i \Rightarrow \{M_i, T_i\}
$$

where \(M_i\) represents the module(s) implementing requirement \(R_i\) and \(T_i\) represents the test case(s) validating requirement \(R_i\).

| Functional Requirement | Architecture Plan Section | Code Module(s) | Test Case(s) |
|---|---|---|---|
| FR1.1: Responsive landing page | Frontend Architecture – React Components | `Lunara/src/pages/LandingPage.tsx`, `Lunara/src/components/layout/MainLayout.tsx` | TC-001: Landing Page Load |
| FR1.3: Contact/inquiry form | Form Handling Architecture | `Lunara/src/pages/LandingPage.tsx`, `backend/src/routes/public.ts` | TC-002: Contact Form Submission |
| FR2.1: Email/password registration | Authentication Service Architecture | `backend/src/routes/auth.ts`, `backend/src/config/passport.ts` | TC-003: User Registration Flow |
| FR2.2: JWT token management | Security Architecture | `backend/src/utils/tokenUtils.ts`, `backend/src/config/passport.ts` | TC-004: Token Refresh, TC-005: Protected Route |
| FR2.3: MFA (TOTP) | Authentication Architecture | `backend/src/routes/mfa.ts` | TC-006: MFA Setup and Verify |
| FR3.1: Provider dashboard | Dashboard Architecture | `Lunara/src/pages/ProviderDashboard.tsx`, `Lunara/src/components/provider/*` | TC-007: Provider Dashboard Render |
| FR3.2: Client dashboard | Dashboard Architecture | `Lunara/src/pages/ClientDashboard.tsx`, `Lunara/src/components/client/*` | TC-008: Client Dashboard Render |
| FR4.1: Dynamic intake | Intake Form Architecture | `Lunara/src/components/intake/ClientIntakeWizard.tsx`, `backend/src/routes/intake.ts` | TC-009: Intake Wizard Submit |
| FR5.1: Real-time messaging | Real-time Communication Architecture | `backend/src/server.ts` (Socket.IO), `Lunara/src/components/MessageCenter.tsx`, `Lunara/src/components/ClientMessageProvider.tsx` | TC-010: Message Send/Receive |
| FR6.1: Appointment scheduling | Scheduling Architecture | `backend/src/routes/appointments.ts`, `Lunara/src/components/provider/ProviderCalendar.tsx`, `Lunara/src/components/client/ClientAppointments.tsx` | TC-011: Appointment CRUD |
| FR7.1: Resource library | Content Management Architecture | `backend/src/routes/resources.ts`, `backend/src/routes/categories.ts`, `Lunara/src/components/resource/ResourceLibrary.tsx` | TC-012: Resource Browse |
| FR8.1: Daily check-ins | Wellness Tracking Architecture | `backend/src/routes/checkins.ts`, `backend/src/services/checkinTrendService.ts`, `Lunara/src/components/client/ClientCheckIns.tsx` | TC-013: Check-in Submit, TC-014: Trend Compute |
| FR9.1: Client management | Provider Dashboard Architecture | `backend/src/routes/client.ts`, `backend/src/routes/providers.ts`, `Lunara/src/components/provider/InviteClient.tsx` | TC-015: Client Assign/Unassign |
| FR10.1: Care plan templates | Care Plan Architecture | `backend/src/routes/carePlans.ts`, `backend/src/models/CarePlan.ts`, `Lunara/src/components/client/CarePlanManager.tsx` | TC-016: Care Plan CRUD |
| FR11.1: Blog publishing | Content Management Architecture | `backend/src/routes/blog.ts`, `Lunara/src/components/blog/BlogEditor.tsx`, `Lunara/src/components/blog/BlogManagement.tsx` | TC-017: Blog Publish |
| NFR1.1: Password hashing | Security Architecture | `backend/src/config/passport.ts` (bcrypt with 12 rounds) | TC-018: Password Hashing |
| NFR1.2: Input validation | Validation Architecture | `backend/src/routes/*.ts` (express-validator), `Lunara/src/components/intake/ClientIntakeWizard.tsx` (Zod) | TC-019: Validation Reject |
| NFR4.1: WebSocket management | Real-time Architecture | `backend/src/services/socketConnectionManager.ts`, `backend/src/services/messageRateLimiter.ts` | TC-020: Socket Auth |

\newpage

## SOURCE CODE LISTING & ARCHITECTURAL IMPLEMENTATION

### System Architecture Overview

The LUNARA platform implements a layered full-stack architecture with clear separation of concerns. The backend follows an Express.js route → middleware → service → model pattern, while the frontend follows a React page → component → context → service pattern. Both layers are written entirely in TypeScript for end-to-end type safety.

### Backend Architecture Implementation (`/backend`)

#### Core Application Layer — `src/server.ts`

The Express application entry point configures the middleware stack, database connection, route registration, Socket.IO real-time messaging, and Swagger API documentation. The security-first middleware pipeline applies Helmet HTTP header hardening (with CSP intentionally disabled for JSON-only API endpoints), CORS policy enforcement with a configurable allowed-origins list, compression, and rate limiting differentiated between development (1,000 requests per 15 minutes) and production (100 requests per 15 minutes).

```typescript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import passport from 'passport';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: allowedOriginsSet, credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
});
```

Nineteen route modules are registered under the `/api` prefix:

```typescript
app.use('/api/auth', authRouter);
app.use('/api/auth/mfa', mfaRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/intake', intakeRouter);
app.use('/api/care-plans', carePlansRouter);
app.use('/api/admin', adminRouter);
app.use('/api/blog', blogRouter);
app.use('/api/users', usersRouter);
app.use('/api/providers', providersRouter);
app.use('/api/client', clientRouter);
app.use('/api/public', publicRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/files', filesRouter);
app.use('/api/push', pushNotificationsRouter);
app.use('/api/interactions', interactionsRouter);
```

\newpage

#### Authentication & Authorization Layer — `src/config/passport.ts`

Authentication uses Passport.js with JWT and Local strategies. The JWT strategy extracts the bearer token from the Authorization header, verifies it against the JWT secret, and retrieves the corresponding user from MongoDB:

```typescript
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'your-secret-key',
    },
    async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) return done(null, user);
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Local Strategy (Email/Password) with bcrypt comparison
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !user.password) return done(null, false, { message: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    }
  )
);
```

Protected routes use `passport.authenticate('jwt', { session: false })` as middleware, ensuring every request is verified before reaching the handler.

\newpage

#### Data Access Layer — Database Schema Design

Over twenty Mongoose models define the domain. Representative schemas are shown below.

**Users Collection** — `src/models/User.ts`

The User model represents all users in the system (clients, providers, admins) and stores authentication data, MFA configuration, and refresh tokens:

```typescript
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'client' | 'provider' | 'admin';
  isEmailVerified: boolean;
  oauthProviders: IOAuthProvider[];
  profile: IProfile;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  refreshTokens: IRefreshToken[];
  intakeCompleted?: boolean;
  intakeCompletedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  canLogin(): boolean;
  getPermissions(): string[];
}
```

**CheckIn Collection** — `src/models/CheckIn.ts`

The CheckIn model captures daily wellness self-assessments with mood rating, physical symptoms, and provider-sharing controls:

```typescript
export const PHYSICAL_SYMPTOMS = [
  'fatigue', 'sleep_issues', 'appetite_changes', 'anxiety', 'pain',
  'headache', 'nausea', 'dizziness', 'breast_soreness', 'bleeding',
] as const;

const checkInSchema = new Schema<ICheckInDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  moodScore: { type: Number, required: true, min: 1, max: 10 },
  physicalSymptoms: [{ type: String, enum: PHYSICAL_SYMPTOMS }],
  notes: { type: String, maxlength: 2000 },
  sharedWithProvider: { type: Boolean, default: false },
  providerReviewed: { type: Boolean, default: false },
}, { timestamps: true });

checkInSchema.index({ userId: 1, date: -1 }, { unique: true });
```

**Appointments Collection** — `src/models/Appointment.ts`

```typescript
export interface IAppointmentDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  type?: 'virtual' | 'in_person';
  notes?: string;
  requestedBy: mongoose.Types.ObjectId;
  reminderSentAt?: Date;
}

appointmentSchema.index({ clientId: 1, startTime: -1 });
appointmentSchema.index({ providerId: 1, startTime: -1 });
appointmentSchema.index({ status: 1 });
```

**Messages Collection** — `src/models/Message.ts`

```typescript
const messageSchema = new Schema<IMessageDocument>({
  conversationId: { type: Schema.Types.ObjectId, required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['text','image','file','system'], default: 'text' },
}, { timestamps: { createdAt: true, updatedAt: false } });
```

**CarePlan Collection** — `src/models/CarePlan.ts`

The CarePlan model includes a pre-save hook that automatically computes progress as the percentage of completed milestones:

```typescript
export interface IMilestone {
  title: string;
  description?: string;
  weekOffset: number;
  category: 'physical' | 'emotional' | 'feeding' | 'self_care' | 'general';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

const carePlanSchema = new Schema<ICarePlanDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  sections: [sectionSchema],
  status: { type: String, enum: ['active','completed','paused','archived'], default: 'active' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

carePlanSchema.pre('save', function (next) {
  const allMilestones = this.sections.flatMap(s => s.milestones);
  if (allMilestones.length === 0) this.progress = 0;
  else {
    const done = allMilestones.filter(m => m.status === 'completed' || m.status === 'skipped').length;
    this.progress = Math.round((done / allMilestones.length) * 100);
  }
  next();
});
```

**ClientDocument Collection** — `src/models/ClientDocument.ts`

Documents support type classification, privacy levels, and a status workflow:

```typescript
export interface IClientDocument extends Document {
  title: string;
  documentType: 'emotional-survey' | 'health-assessment' | 'personal-assessment' | 'progress-photo' | 'other';
  uploadedBy: mongoose.Types.ObjectId;
  assignedProvider?: mongoose.Types.ObjectId;
  files: IFileAttachment[];
  submissionStatus: 'draft' | 'submitted-to-provider' | 'reviewed-by-provider' | 'completed';
  privacyLevel: 'client-only' | 'client-and-provider' | 'care-team';
}
```

\newpage

#### API Layer & Business Services

**Authentication Endpoints** — `src/routes/auth.ts`

The auth router exposes registration with express-validator input validation, login via Passport Local strategy, token refresh, email verification, password reset, and logout with token revocation. A rate limiter restricts sensitive endpoints to 5 requests per 15 minutes:

```typescript
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later.',
});

router.post('/register', [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['client', 'provider']),
], async (req, res) => { /* registration logic */ });
```

**Check-in Endpoints** — `src/routes/checkins.ts`

The check-in router validates mood scores (1–10), symptom values against the predefined enum, and note length, then saves and triggers alert analysis:

```typescript
router.post('/', authenticate, [
  body('date').isISO8601(),
  body('moodScore').isInt({ min: 1, max: 10 }),
  body('physicalSymptoms').optional().isArray()
    .custom((arr) => arr.every(s => PHYSICAL_SYMPTOMS.includes(s))),
  body('notes').optional().isString().isLength({ max: 2000 }),
  body('sharedWithProvider').optional().isBoolean(),
], async (req, res) => {
  const checkIn = new CheckIn({ userId: user._id, ...req.body });
  await checkIn.save();
  const alerts = await getCheckInAlerts(user._id.toString());
  return res.status(201).json({ message: 'Check-in recorded', checkIn, alerts });
});
```

**Check-in Trend Service** — `src/services/checkinTrendService.ts`

The trend service computes mood averages, daily mood mappings, symptom frequency distributions, mood direction (improving/stable/declining), and clinical alerts for low mood streaks, declining trends, and persistent symptoms:

```typescript
const ALERT_THRESHOLDS = {
  LOW_MOOD_SCORE: 3,
  LOW_MOOD_STREAK: 3,
  DECLINING_WINDOW: 7,
  PERSISTENT_SYMPTOM_DAYS: 5,
};

export async function getCheckInAlerts(userId: string): Promise<AlertInfo[]> {
  const alerts: AlertInfo[] = [];
  const recent = await CheckIn.find({ userId })
    .sort({ date: -1 }).limit(ALERT_THRESHOLDS.DECLINING_WINDOW);

  // Low mood streak detection
  let lowStreak = 0;
  for (const c of recent) {
    if (c.moodScore <= ALERT_THRESHOLDS.LOW_MOOD_SCORE) lowStreak++;
    else break;
  }
  if (lowStreak >= ALERT_THRESHOLDS.LOW_MOOD_STREAK) {
    alerts.push({
      type: 'low_mood',
      message: `Mood has been ${ALERT_THRESHOLDS.LOW_MOOD_SCORE} or below for ${lowStreak} consecutive check-ins`,
      severity: lowStreak >= 5 ? 'critical' : 'warning',
    });
  }
  // ... declining trend and persistent symptom detection
}
```

**Real-time Messaging** — Socket.IO in `src/server.ts`

Socket.IO connections are authenticated with the same JWT strategy. After verification, users join private rooms keyed to their user ID. Message delivery persists to MongoDB, broadcasts to the conversation room, sends a notification to the receiver's user room, and confirms delivery to the sender:

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication error: missing token'));
  const payload = verifyAccessToken(token);
  socket.data.userId = payload.id;
  socket.data.role = payload.role;
  next();
});

io.on('connection', socket => {
  socket.on('send_message', async (messageData) => {
    if (isRateLimited(socket.data.userId)) {
      socket.emit('rate_limit', { error: 'Too many messages' });
      return;
    }
    const doc = new Message({ ...messageData, read: false });
    await doc.save();
    io.to(doc.conversationId).emit('new_message', payload);
    io.to(doc.receiver).emit('new_message_notification', payload);
    socket.emit('message_delivered', { messageId: doc._id });
  });
});
```

\newpage

### Frontend Architecture Implementation (`/Lunara`)

#### Application Root — `src/App.tsx`

The React 18 application wraps all routes in an `AuthProvider` context for global authentication state, a `ResourceProvider` for resource library data, and a `PageErrorBoundary` for graceful error recovery. Role-based route protection ensures providers and clients are directed to separate dashboards:

```typescript
<ProtectedRoute allowedRoles={['provider']}>
  <ErrorBoundary>
    <ProviderDashboard />
  </ErrorBoundary>
</ProtectedRoute>

<ProtectedRoute allowedRoles={['client']}>
  <ErrorBoundary>
    <ClientDashboard />
  </ErrorBoundary>
</ProtectedRoute>
```

#### Client Check-in Component — `src/components/client/ClientCheckIns.tsx`

The check-in form captures mood via a slider (1–10), physical symptoms via a checkbox list of ten predefined options, optional notes, and a provider-sharing toggle. On submission, it calls the check-in API and refreshes the history and trend views:

```typescript
const SYMPTOMS: Array<{ id: PhysicalSymptom; label: string }> = [
  { id: 'fatigue', label: 'Fatigue / low energy' },
  { id: 'sleep_issues', label: 'Sleep challenges' },
  { id: 'appetite_changes', label: 'Appetite changes' },
  { id: 'anxiety', label: 'Anxiety / worry' },
  { id: 'pain', label: 'Pain' },
  { id: 'headache', label: 'Headache' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'breast_soreness', label: 'Breast / chest soreness' },
  { id: 'bleeding', label: 'Bleeding' },
];
```

#### Intake Wizard — `src/components/intake/ClientIntakeWizard.tsx`

The five-step wizard validates each section with Zod schemas before allowing progression. The personal step captures partner information, address, emergency contact, and communication preferences. The birth step captures pregnancy history and birth experience. Feeding, support, and health steps complete the clinical profile:

```typescript
type StepId = 'personal' | 'birth' | 'feeding' | 'support' | 'health';

const schemas: Record<StepId, z.ZodTypeAny> = {
  personal: z.object({
    partnerName: optionalShort(120),
    address: z.object({ street, city, state, zipCode }).optional(),
    emergencyContact: z.object({ name, phone, relationship }).optional(),
    communicationPreferences: z.object({ preferredContactMethod, bestTimeToContact }).optional(),
  }),
  birth: z.object({
    isFirstBaby: z.boolean().optional(),
    birthExperience: z.object({ birthType, birthLocation, laborDuration }).optional(),
  }),
  // feeding, support, health schemas follow same pattern
};
```

\newpage

### Source Code File Inventory

| Layer | Directory | File Count | Description |
|---|---|---|---|
| Backend Routes | `backend/src/routes/` | 19 modules | API endpoint handlers for all domains |
| Backend Models | `backend/src/models/` | 20+ models | Mongoose schemas and interfaces |
| Backend Services | `backend/src/services/` | 9 services | GridFS, email, push, trends, cache, reminders, rate limiter, socket manager |
| Backend Config | `backend/src/config/` | Passport, Swagger | Authentication strategies, API docs |
| Backend Utils | `backend/src/utils/` | Token utils, logger, query optimization | Shared utilities |
| Frontend Pages | `Lunara/src/pages/` | 8 pages | Route-level entry points |
| Frontend Components | `Lunara/src/components/` | 50+ components | Provider, client, documents, intake, blog, resource, UI |
| Frontend Contexts | `Lunara/src/contexts/` | 2 providers | AuthProvider, ResourceProvider |
| Frontend Services | `Lunara/src/services/` | 8+ services | API service layer for each domain |

\newpage

## Milestone 4 Special Note — Scope Adjustment Context

As documented in sprint planning, four planned features were formally deferred to a post-launch roadmap after discussion with the mentor and instructor: FR12 (Digital Journaling), FR13 (Daily Insights / Horoscopes), FR14 (Sleep & Feeding Trackers), and FR15 (AI-Powered Note Summarization). The justification for each deferral was recorded in the sprint documentation. These were lower-priority features from the original requirements that fell outside the timeline after the core functional requirements (FR1–FR11) consumed more development effort than initially estimated due to the depth of integration required across the full stack. Where scope changed, execution focused on preserving the core functional requirements and delivery quality. This milestone established the integrated coding baseline that enabled formal Milestone 5 testing and Milestone 6 release packaging.

---

## APPLICATION DEMONSTRATION

The Milestone 4 application demonstration is a screencast (5–10 minutes per GCU policies) that demonstrates the functionality working up to this point. The demonstration covers the public landing page, authentication flows (register, login, MFA), the provider dashboard with client management and messaging, the client dashboard with intake wizard and check-ins, appointment scheduling, document upload and review, and the resource library.

## MODULE TEST CASES (TEST PLAN)

The following test cases were developed and executed during the Milestone 4 coding iteration. Each test case maps to one or more functional requirements from the Traceability Matrix. Testing was performed manually against the deployed staging environment (lunara.onrender.com) and locally via `npm run dev`. Automated unit tests supplement manual verification and are maintained in the repository under `backend/src/__tests__/`.

| Test Case | Priority | Module | Test Objective |
|---|---|---|---|
| **TC-001** | P1 | Landing Page | Verify the public landing page loads with hero, offerings accordion, inquiry form, and footer |
| **TC-002** | P1 | Contact Form | Verify the inquiry form validates required fields and submits to `POST /api/public/contact` |
| **TC-003** | P1 | User Registration | Verify a new user can register with valid email, password (8+ chars), first/last name, and role |
| **TC-004** | P1 | Token Refresh | Verify an expired access token is replaced via `POST /api/auth/refresh-token` using a valid refresh token |
| **TC-005** | P1 | Protected Route | Verify requests to protected endpoints without a valid JWT return `401 Unauthorized` |
| **TC-006** | P2 | MFA Setup | Verify TOTP setup returns a QR code and that a valid 6-digit code completes MFA enrollment |
| **TC-007** | P1 | Provider Dashboard | Verify the provider dashboard renders overview metrics, quick actions, upcoming appointments, and recent activity |
| **TC-008** | P1 | Client Dashboard | Verify the client dashboard renders mood check-in orb, document count, resource count, and suggested reading |
| **TC-009** | P1 | Intake Wizard | Verify the five-step intake wizard validates each section (Zod) and submits the complete intake to the backend |
| **TC-010** | P1 | Messaging | Verify a client can send a message via Socket.IO and the provider receives it in the Message Center in real time |
| **TC-011** | P1 | Appointment CRUD | Verify appointments can be created, approved, confirmed, and cancelled through both provider and client flows |
| **TC-012** | P1 | Resource Library | Verify resources are browsable, filterable by category/difficulty/week, and display full content in the detail modal |
| **TC-013** | P1 | Check-in Submit | Verify a daily check-in with mood score (1–10), symptoms, and notes saves and returns alert analysis |
| **TC-014** | P2 | Trend Compute | Verify the trend service computes mood averages, direction (improving/stable/declining), and low-mood streak alerts |
| **TC-015** | P1 | Client Management | Verify a provider can create, assign, and unassign clients; verify the client list reflects changes |
| **TC-016** | P2 | Care Plan CRUD | Verify care plans can be created from templates, milestones can be marked complete, and progress auto-computes |
| **TC-017** | P1 | Blog Publish | Verify a provider can create a blog post (draft or published), and published posts appear on the public blog |
| **TC-018** | P1 | Password Hashing | Verify passwords are stored as bcrypt hashes (12 rounds) and that raw passwords are never persisted or returned |
| **TC-019** | P1 | Validation Reject | Verify malformed input (missing fields, invalid email, short password, out-of-range mood) is rejected with `422` |
| **TC-020** | P1 | Socket Auth | Verify Socket.IO connections without a valid JWT are rejected at the middleware handshake |

\newpage

### Detailed Test Case Specifications

**TC-001: Landing Page Load**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Navigate to `https://www.lunaracare.org` | — | Page loads with hero section, navigation, and footer | Pass |
| 2 | Scroll to offerings section | — | Accordion items expand/collapse on click | Pass |
| 3 | Scroll to inquiry form | — | Form displays First Name, Last Name, Email, Message fields | Pass |
| 4 | Resize browser to 375px width | — | Layout adapts to mobile; no horizontal scroll | Pass |

**TC-003: User Registration Flow**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Navigate to `/register` | — | Registration form renders with all fields | Pass |
| 2 | Submit with missing email | `firstName: "Test", lastName: "User", password: "Test1234!"` | Validation error displayed; form not submitted | Pass |
| 3 | Submit with password < 8 chars | `email: "test@example.com", password: "short"` | Validation error: "Password must be at least 8 characters" | Pass |
| 4 | Submit with valid data | `firstName: "New", lastName: "Client", email: "client@email.com", password: "Secure1234!", role: "client"` | Account created; verification email sent; redirect to login | Pass |

**TC-010: Message Send/Receive**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Client logs in and navigates to Messages tab | Valid client credentials | Chat interface loads; Socket.IO connection established ("Connected" indicator) | Pass |
| 2 | Client types and sends a message | `content: "Im feeling a bit tired today!"` | Message appears in client chat with timestamp | Pass |
| 3 | Provider opens Message Center | Valid provider credentials | Provider sees the client in the sidebar; message appears in conversation | Pass |
| 4 | Provider replies | `content: "hello"` | Reply appears in both provider and client views in real time | Pass |

**TC-011: Appointment CRUD**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Client selects a date on the calendar | March 19, 2026 | Date panel shows "Request time" option | Pass |
| 2 | Client fills and submits request | `date: "03/19/2026", start: "7:02 PM", end: "9:02 PM", type: "Virtual", notes: "Casual check in"` | Request submitted; appears as "Pending approval" | Pass |
| 3 | Provider views Schedule tab | — | Pending request appears with Approve/Decline actions | Pass |
| 4 | Provider approves the request | — | Status changes to "Confirmed"; client sees confirmation on calendar | Pass |

**TC-013: Check-in Submit**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Client selects mood on the orb interface | "Doing well" (maps to mood score 9–10) | Orb turns green; mood label displayed | Pass |
| 2 | System records the check-in | — | `POST /api/checkins` returns `201` with check-in data and alert analysis | Pass |
| 3 | Client selects "Need support now" | Maps to mood score 1–2 | Orb turns red; check-in recorded; provider alert generated if streak threshold met | Pass |

**TC-017: Blog Publish**

| Step | Action | Test Data | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1 | Provider navigates to Blog > Create New Post | — | Blog editor form renders | Pass |
| 2 | Provider fills in post details | `title: "5 Ways to Support Clients...", category: "General", excerpt: "...", content: "..."` | All fields accept input; featured image upload works | Pass |
| 3 | Provider clicks "Publish" | — | Success toast; post appears in Manage Posts with "Published" status | Pass |
| 4 | Client navigates to `/blog` | — | Published post appears in the public blog list with excerpt | Pass |

\newpage

## APPLICATION SCREENSHOTS

The following screenshots document the working application as demonstrated in the Milestone 4 screencast. They are organized by access level: public pages, provider dashboard workflows, and client dashboard workflows.

### Public Website (FR1)

**Figure 1 — Landing Page**

The public homepage features a hero section, the "Dear Parent" introduction, client login access, an interactive offerings accordion, and an inquiry contact form.

![Landing Page](Photos/public/HomePage.png)

**Figure 2 — Login Page**

The login page supports email/password authentication with role-based redirection to the appropriate dashboard.

![Login Page](Photos/public/loginPage.png)

**Figure 3 — Public Blog List**

The public-facing blog displays published posts with excerpts, dates, and "Read More" links.

![Public Blog List](Photos/public/publicBlog_page.png)

**Figure 4 — Public Blog Post Detail**

A full blog post view with category tags, author attribution, read time, and view count.

![Public Blog Detail](Photos/public/publicBlog_detailed.png)

\newpage

### Provider Dashboard (FR3, FR9, FR11)

**Figure 5 — Provider Dashboard Overview**

The provider dashboard displays active client count, pending inquiries, check-ins needing attention, quick action buttons (Create Client, Schedule Appointment, View Clients, Blog & Resources), upcoming appointments, and a personal to-do list.

![Provider Dashboard](Photos/provider/provider_dashboard_overview.png)

**Figure 6 — Provider Recent Activity**

The recent activity feed shows upcoming appointments, document submissions from clients, and client assignment history.

![Recent Activity](Photos/provider/provider_recent_activity.png)

**Figure 7 — Provider Clients Page**

The Clients tab shows "My clients" (assigned) and "All created clients" with names, emails, provider assignments, and actions (View/Edit profile, Care plans, Remove).

![Clients Page](Photos/provider/provider_clients_page_names_resolved.png)

**Figure 8 — Invite New Client Form**

Providers can invite new clients by entering first name, last name, and email. The client receives an email to set their password and access their dashboard.

![Invite Client](Photos/provider/provider_invite_client_form.png)

**Figure 9 — New Client Created**

After inviting a client, the new client appears in the "All created clients" list with an "Add to my list" option.

![Client Created](Photos/provider/provider_client_created.png)

\newpage

**Figure 10 — Schedule Appointment Modal**

The Schedule Appointment modal with client and provider selected, start/end times, type (Virtual), and notes filled in.

![Schedule Appointment](Photos/provider/provider_schedule_appointment_complete.png)

**Figure 11 — Provider Schedule Calendar**

The Schedule tab shows a monthly calendar view with appointments color-coded by status (Completed, Confirmed, Scheduled, Requested, Cancelled, Has availability, Pending approval). The sidebar displays appointments and availability slots for the selected day.

![Schedule Calendar](Photos/provider/provider_schedule_calendar.png)

**Figure 12 — Provider Availability Slots**

Providers can add availability time slots (e.g., 09:00–10:00, 10:00–11:00) for specific dates so clients can see open times when requesting appointments.

![Availability Slots](Photos/provider/provider_schedule_availability_slots.png)

\newpage

**Figure 13 — Client Documents Search and Filter**

The Client Documents section with search, filter by document type, submission status, and date range. Shows a submitted document with "Review Now" action.

![Client Documents](Photos/provider/provider_client_document_found.png)

**Figure 14 — Document Review Panel**

The review panel displays the document title, author, attached files with a "View" button, client notes, fields for internal notes and client-facing feedback, and a review status dropdown.

![Document Review](Photos/provider/provider_document_review_panel.png)

**Figure 15 — Authenticated File Viewer**

Client-uploaded files are viewed through an authenticated blob URL, displaying the document content directly in the browser.

![File Viewer](Photos/provider/provider_file_view_success.png)

**Figure 16 — Document Review Completed**

After submitting a review, the document status updates to "Completed" and the client is notified.

![Review Completed](Photos/provider/provider_document_review_completed.png)

\newpage

**Figure 17 — Blog Management**

The Manage Blog Posts page with search, filter by category/tag/author, and tabs for All, Published, and Drafts.

![Blog Management](Photos/provider/provider_blog_manage_empty.png)

**Figure 18 — Create New Blog Post**

The blog editor with title, category, excerpt, featured image upload, tags, and a rich text content area. Posts can be saved as drafts or published immediately.

![Create Blog Post](Photos/provider/provider_blog_create_post.png)

**Figure 19 — Blog Post Published**

After publishing, the post appears in the management list with Edit, Publish, and Delete actions.

![Blog Published](Photos/provider/provider_blog_manage_with_post.png)

\newpage

**Figure 20 — Create New Resource (Blank Form)**

The resource creation form with title, category, description, content, difficulty level, target pregnancy/postpartum week selectors, tags, and a publish checkbox.

![Resource Form Blank](Photos/provider/provider_resource_create_blank.png)

**Figure 21 — Create New Resource (Completed Form)**

A completed resource form for "First Trimester: What to Expect and When to Reach Out" with pregnancy weeks 1–12 selected, content filled in, and the publish checkbox checked.

![Resource Form Filled](Photos/provider/provider_resource_create_filled.png)

**Figure 22 — Resource Published in Library**

After creation, the resource appears in the resource library with its detail modal showing the full content, category, difficulty, and week targeting.

![Resource in Library](Photos/provider/provider_resource_in_library.png)

\newpage

**Figure 23 — Provider Profile Edit**

The My Profile tab allows providers to edit personal information, bio, certifications, specialties, languages, services offered, service areas, and availability settings.

![Profile Edit](Photos/provider/provider_profile_edit.png)

**Figure 24 — Account Settings**

The Account Settings tab includes password change, notification preferences (email, appointment reminders, new message alerts, check-in reminders), two-factor authentication toggle, and account deletion.

![Account Settings](Photos/provider/provider_account_settings.png)

**Figure 25 — Create Provider Account**

The Add Provider page allows creating new provider accounts with first name, last name, email, and password with complexity requirements.

![Create Provider](Photos/provider/provider_create_provider_form.png)

**Figure 26 — Provider Account Created**

Confirmation toast after a new provider account is successfully created.

![Provider Created](Photos/provider/provider_create_provider_success.png)

**Figure 27 — Provider Messaging Center**

The Message Center shows the provider's client list on the left with real-time connection status. The conversation view displays message history including system-generated notifications for document reviews, blog publications, resource publications, and appointment proposals.

![Messaging Center](Photos/provider/provider_messaging_center.png)

\newpage

### Client Dashboard (FR3, FR4, FR5, FR6, FR7, FR8, Documents)

**Figure 28 — Client Dashboard Overview**

The client dashboard displays document count, resource count, upcoming appointments, the daily mood check-in orb, suggested reading articles, and the resource filter/search interface.

![Client Dashboard](Photos/client/client_dashboard_overview.png)

**Figure 29 — Mood Orb: "Need Support Now"**

The mood orb glows red when the client selects "Need support now," indicating they need immediate provider attention.

![Mood Need Support](Photos/client/client_mood_need_support.png)

**Figure 30 — Mood Orb: "Having a Tough Day"**

The orb shifts to a warm red-orange tone for the "Having a tough day" state.

![Mood Tough Day](Photos/client/client_mood_tough_day.png)

**Figure 31 — Mood Orb: "Hanging in There"**

A golden-amber orb representing the neutral "Hanging in there" mood state.

![Mood Hanging In There](Photos/client/client_mood_hanging_in_there.png)

**Figure 32 — Mood Orb: "Doing Alright"**

A pink-magenta orb for the positive "Doing alright" mood state.

![Mood Doing Alright](Photos/client/client_mood_doing_alright.png)

**Figure 33 — Mood Orb: "Doing Well"**

A bright green orb representing the most positive mood state, "Doing well."

![Mood Doing Well](Photos/client/client_mood_doing_well.png)

\newpage

**Figure 34 — Resource Library (Filtered)**

The resource library filtered by category "Postpartum" and difficulty "Beginner," showing matching resources with pregnancy/postpartum week targeting and author attribution.

![Resource Filtered](Photos/client/client_resource_filtered.png)

**Figure 35 — Resource Detail View**

A full resource view showing "Postpartum Daily Recovery" content organized by week with practical guidance for physical recovery milestones.

![Resource Detail](Photos/client/client_resource_detail.png)

**Figure 36 — Resource Library Grid**

The full resource grid showing recommended resources filtered by the client's postpartum stage.

![Resource Grid](Photos/client/client_resource_library_grid.png)

**Figure 37 — Blog Post Detail (Client View)**

A client reading a published blog post with category tags, reading time, and full article content.

![Blog Post](Photos/client/client_blog_post_detail.png)

**Figure 38 — Blog List (Client View)**

The authenticated blog list showing published posts available to the client.

![Blog List](Photos/client/client_blog_list.png)

\newpage

**Figure 39 — Appointments Calendar**

The client appointments view with a monthly calendar, status legend (Confirmed, Scheduled, Pending approval, Completed, Cancelled), and upcoming appointments list.

![Appointments Calendar](Photos/client/client_appointments_calendar.png)

**Figure 40 — Request a Specific Time**

The appointment request form with date picker, type selector (Virtual), start/end time inputs, and optional notes.

![Request Time](Photos/client/client_request_time_form.png)

**Figure 41 — Request Time (Completed Form)**

A completed appointment request for March 19, 2026, 7:02–9:02 PM (Virtual) with the note "Casual check in."

![Request Filled](Photos/client/client_request_time_filled.png)

**Figure 42 — Appointment Approved**

After the provider approves the request, a success toast confirms the approval and the appointment appears on the calendar.

![Appointment Approved](Photos/client/client_appointment_approved.png)

**Figure 43 — Appointment Confirmed**

The confirmed appointment appears in the upcoming appointments list with date, time, type, and "CONFIRMED" status badge.

![Appointment Confirmed](Photos/client/client_appointment_confirmed.png)

\newpage

**Figure 44 — Client Notifications and Real-time Chat**

The Messages tab shows a notification badge with unread messages and the real-time chat with the assigned provider, including text messages and system-generated appointment proposal notifications.

![Notifications and Chat](Photos/client/client_notifications_and_chat.png)

**Figure 45 — Client Messaging (Full View)**

The full messaging page with notification area and the provider conversation showing message history with timestamps and sender attribution.

![Messaging Full](Photos/client/client_messaging_with_notifications.png)

\newpage

**Figure 46 — Client Profile and Document Upload**

The Profile tab with edit form (first name, last name, email, delivery date), sub-navigation (Profile, Password, Notifications, Security, Delete Account), and the Upload Documents section with drag-and-drop file input.

![Profile and Upload](Photos/client/client_profile_edit_and_upload.png)

**Figure 47 — Document Upload Form**

The document upload form with file selector, title, description, category dropdown, and tags input.

![Upload Form](Photos/client/client_document_upload_form.png)

**Figure 48 — Document Upload (Completed Form)**

A completed upload form with a selected image file, title "Intake," description, category "Other," and tag "General."

![Upload Filled](Photos/client/client_document_upload_filled.png)

**Figure 49 — Document Upload Success**

Confirmation toast "Document uploaded successfully!" after the file is submitted to the provider.

![Upload Success](Photos/client/client_document_upload_success.png)

**Figure 50 — Client Security Settings**

The Security sub-tab showing Two-Factor Authentication (2FA) status with the option to manage 2FA settings.

![Security 2FA](Photos/client/client_profile_security_2fa.png)
