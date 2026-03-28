# LUNARA Frontend

React 18 + TypeScript + Vite frontend for the LUNARA Postpartum Support Platform. This application provides the client-facing and provider-facing interfaces for appointment scheduling, real-time messaging, mood tracking, document management, blog reading and authoring, educational resource browsing, care plan viewing, and client onboarding.

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3.4 with Typography plugin |
| Routing | React Router v6 |
| State Management | React Context API (AuthContext, ResourceContext) |
| HTTP Client | Axios with token refresh interceptors |
| Forms | React Hook Form with Zod validation |
| Rich Text Editor | React Quill |
| Real-time | Socket.IO client |
| Calendar | React Big Calendar |
| 3D Visualization | Three.js with React Three Fiber and Drei |
| Icons | FontAwesome and React Icons |
| Sanitization | DOMPurify |
| Testing | Jest, React Testing Library, Playwright (E2E), MSW (mocking) |
| Linting | ESLint with TypeScript plugin |
| Formatting | Prettier |

## Implemented Features

### Authentication and Authorization
- Email/password login for both clients and providers
- Registration flows with role selection
- JWT access tokens stored in localStorage with automatic refresh
- Multi-factor authentication challenge during login (TOTP)
- MFA setup and management page with QR code enrollment
- Session synchronization across browser tabs
- Protected routes with role-based guards
- Password reset and email verification pages

### Provider Dashboard
- **Overview tab**: client counts, upcoming appointments, pending approvals, quick actions
- **Clients tab**: client list with filtering, create new client form, email invitation
- **Schedule tab**: calendar view, availability slot management, appointment approval and scheduling modal
- **Blog tab**: blog post management, create/edit/publish/unpublish with rich text editor, auto-save, version history
- **Resources tab**: resource library management, create/edit resources with file uploads, category and difficulty filtering
- **Profile tab**: edit professional info, specialties, bio, availability, account settings
- **Messages**: real-time messaging center with conversation list
- **Check-in review**: view and respond to client wellness check-ins

### Client Dashboard
- **Overview tab**: summary widgets for unread messages, documents, upcoming appointments, resources, recent blog posts, mood check-in shortcut
- **Messages tab**: real-time messaging with assigned provider
- **Appointments tab**: calendar view, request new appointments, propose alternative times, view appointment status
- **Documents tab**: upload documents (eight types including emotional survey, health assessment, feeding log, sleep log), view submission status, search and filter
- **Mood check-in**: five-level mood selector with 3D animated orb visualization (Three.js), one-hour cooldown between submissions, optional provider sharing
- **Care plans**: view active care plans, track milestones by category
- **Resources**: browse educational resource library with filters for difficulty, postpartum week, and category
- **Settings**: edit personal information, update baby birth date, manage profile

### Client Onboarding
- Multi-step intake wizard with progress indicator
- Five steps: personal information, birth details (type, location, date), feeding preferences, health assessment, and support needs
- Form validation at each step via Zod schemas

### Blog (Public)
- Public blog listing page with filtering
- Individual post detail view with slug-based routing
- View count tracking

### Push Notifications
- Browser notification permission request and toggle
- Web Push API subscription management via service worker

### Security Settings
- TOTP-based two-factor authentication setup page
- Enable, disable, and manage MFA

## Pages and Routing

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/forgot-password` | Password reset request | Public |
| `/reset-password` | Password reset completion | Public |
| `/verify-email` | Email verification | Public |
| `/blog` | Blog listing | Public |
| `/blog/:slug` | Blog post detail | Public |
| `/provider/dashboard` | Provider dashboard | Provider only |
| `/client/dashboard` | Client dashboard | Client only |
| `/settings/security` | MFA settings | Authenticated |

## Project Structure

```
src/
├── api/
│   └── apiClient.ts              # Singleton Axios client with interceptors
├── components/
│   ├── blog/                     # Blog editor, management, content editor,
│   │                               metadata form, tag input, featured image,
│   │                               action buttons, auto-save status
│   ├── client/
│   │   ├── appointments/         # Calendar, day list, proposed time form,
│   │   │                           slot booking confirmation, status badge
│   │   ├── CarePlanCard.tsx       # Care plan display with milestones
│   │   ├── CarePlanManager.tsx    # Care plan listing and creation
│   │   ├── ClientAppointments.tsx # Client appointment management
│   │   ├── ClientCalendarGrid.tsx # Month calendar grid
│   │   ├── ClientCheckIns.tsx     # Check-in submission and history
│   │   ├── ClientDashboardLayout.tsx # Tabbed navigation layout
│   │   ├── ClientDayDetailPanel.tsx  # Day detail sidebar
│   │   ├── ClientSettings.tsx     # Profile and settings
│   │   ├── MoodCheckIn.tsx        # Mood selection interface
│   │   ├── MoodOrb.tsx            # 3D orb visualization (Three.js)
│   │   ├── ProviderClientProfileEdit.tsx # Provider editing client profile
│   │   └── UpdateBabyBirthDate.tsx # Birth date editor
│   ├── documents/                # Document upload, card, list, search/filter,
│   │                               edit, provider review, recommendations
│   ├── intake/                   # ClientIntakeWizard, ClientIntakeForm,
│   │                               IntakeProgressHeader, step components
│   │                               (Personal, Birth, Feeding, Health, Support)
│   ├── layout/                   # MainLayout, SimpleHeader, SimpleFooter
│   ├── messaging/                # MessageCenter, MessagesList,
│   │                               ClientMessageProvider
│   ├── provider/                 # ProviderDashboardLayout, OverviewTab,
│   │                               ClientsTab, BlogTab, ProviderAppointments,
│   │                               ProviderCalendar, CalendarGrid, DayDetailPanel,
│   │                               CalendarNavigation, ScheduleAppointmentModal,
│   │                               ProviderProfileEdit, ProviderClientCheckIns,
│   │                               CheckInsReviewSection, PushNotificationToggle
│   ├── resources/                # ResourceLibrary, ResourceEditor,
│   │                               ResourceViewModal
│   └── ui/                       # Card, Skeleton, Spinner, ErrorBoundary,
│                                   ConstructionAlert, ProtectedRoute,
│                                   RichTextEditor, MfaSetup
├── contexts/
│   ├── AuthContext.tsx            # Authentication state, login, MFA, tokens
│   └── ResourceContext.tsx        # Resource and category state, filtering
├── hooks/
│   ├── useAuth.ts                # Access AuthContext
│   ├── useResource.ts            # Access ResourceContext
│   └── useSocket.ts              # Socket.IO connection and events
├── pages/
│   ├── LandingPage.tsx           # Hero, services accordion, inquiry form
│   ├── LoginPage.tsx             # Login with MFA challenge support
│   ├── ForgotPasswordPage.tsx    # Password reset request
│   ├── ResetPasswordPage.tsx     # Token-based password reset
│   ├── VerifyEmailPage.tsx       # Email verification
│   ├── ClientDashboard.tsx       # Client dashboard wrapper
│   ├── ProviderDashboard.tsx     # Provider dashboard wrapper
│   ├── BlogPage.tsx              # Public blog listing
│   ├── BlogPostDetail.tsx        # Blog post view (slug routing)
│   └── SecuritySettingsPage.tsx  # MFA setup and management
├── services/
│   ├── authService.ts            # Registration, login, MFA, token refresh
│   ├── appointmentService.ts     # Appointment CRUD, availability, calendar
│   ├── blogService.ts            # Blog post CRUD, publishing, search
│   ├── documentService.ts        # Document upload, submission, review
│   ├── messageService.ts         # Messaging, conversations, read status
│   ├── resourceService.ts        # Resource CRUD, publishing, search
│   ├── providerService.ts        # Provider profile and availability
│   ├── userService.ts            # User profile management
│   ├── recommendationService.ts  # Personalized resource and document suggestions
│   ├── pushService.ts            # Push notification subscribe/unsubscribe
│   ├── supportSessionService.ts  # Support session operations
│   └── serviceFactory.ts         # Service instantiation
├── styles/                       # Global CSS and Tailwind configuration
├── tests/                        # Unit and integration tests
├── types/
│   ├── models.ts                 # Core domain types
│   ├── api.ts                    # API request/response types
│   ├── auth.ts                   # Authentication types
│   └── user.ts                   # User profile types
└── utils/                        # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

1. **Install dependencies:**
   ```bash
   cd Lunara
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```

3. **Required environment variable:**
   ```env
   VITE_API_BASE_URL=http://localhost:10000/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   - Frontend: http://localhost:5173
   - The backend must be running at the configured API URL

### Available Scripts

```bash
npm run dev            # Start Vite development server
npm run build          # TypeScript compile and Vite production build
npm run preview        # Preview production build locally
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format code with Prettier
npm run format:check   # Check formatting without writing
npm run type-check     # TypeScript type checking (no emit)
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:e2e       # Run Playwright end-to-end tests
npm run test:e2e:ui    # Run Playwright tests with UI
```

## API Integration

The frontend communicates with the backend through an Axios-based singleton API client (`src/api/apiClient.ts`). Key behaviors:

- Base URL is set from the `VITE_API_BASE_URL` environment variable
- In development, Vite proxies `/api` requests to `http://localhost:5000`
- Access tokens are attached to every request automatically
- When a 401 response is received, the client attempts a token refresh and retries the original request
- Failed refresh results in automatic logout

### Authentication Flow
1. User submits credentials through the login form
2. Backend returns a JWT access token and sets a refresh token as an httpOnly cookie
3. Access token is stored in localStorage
4. If MFA is enabled, the login response triggers the MFA challenge UI
5. Axios interceptors handle token attachment and refresh transparently
6. Session state syncs across tabs via localStorage events

## Build Configuration

**Vite** is configured with:
- API proxy: `/api` requests forward to `http://localhost:5000` during development
- Manual chunk splitting for Three.js (`vendor-three`) and Quill (`vendor-quill`) to optimize bundle size
- React plugin for JSX transformation

**Tailwind CSS** uses the Typography plugin for rendering rich text content from the blog and resource editors.

## Testing

- **Unit tests**: Jest with React Testing Library for components, services, and hooks
- **API mocking**: MSW (Mock Service Worker) for intercepting HTTP requests in tests
- **E2E tests**: Playwright for full browser testing
- **Coverage**: 222 tests with reporting via Jest coverage

## Deployment

The frontend is deployed to Vercel. The `vercel.json` at the repository root configures:
- Build command: `cd Lunara && npm ci && npm run build`
- Output directory: `Lunara/dist`
- SPA fallback: all routes rewrite to `/index.html`

Production environment variable:
```env
VITE_API_BASE_URL=https://lunara.onrender.com/api
```

## License

This project is licensed under the MIT License.
