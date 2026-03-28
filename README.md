# LUNARA Postpartum Support Platform

LUNARA is a full-stack web application connecting postpartum mothers with certified doulas and support specialists. The platform provides secure real-time messaging, appointment scheduling, mood and wellness tracking, document management, a blog, an educational resource library, and care plan tools within a warm, storybook-inspired interface.

Built as a senior capstone project at Grand Canyon University.

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js (Local, JWT, and Google OAuth strategies)
- **Real-time**: Socket.IO for live messaging
- **File Storage**: MongoDB GridFS
- **Email**: Nodemailer (SMTP)
- **Push Notifications**: Web Push API (VAPID)
- **MFA**: TOTP-based two-factor authentication (otpauth, QR code)
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, rate limiting, bcrypt, account locking
- **Testing**: Jest with Supertest, mongodb-memory-server
- **Validation**: express-validator
- **Logging**: Winston, Morgan

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Typography plugin
- **Routing**: React Router v6
- **State Management**: React Context API (Auth, Resource)
- **HTTP Client**: Axios with token refresh interceptors
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: React Quill
- **Real-time**: Socket.IO client
- **3D Visualization**: Three.js with React Three Fiber (mood orb)
- **Calendar**: React Big Calendar
- **Testing**: Jest, React Testing Library, Playwright (E2E)
- **Linting**: ESLint with TypeScript plugin

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions (backend, frontend, and SonarQube pipelines)
- **Code Quality**: SonarQube with lint-staged and Husky pre-commit hooks
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **Database Hosting**: MongoDB Atlas

## Project Structure

```
LUNARA/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/            # Passport.js configuration
│   │   ├── middleware/        # Auth, validation, caching, error handling
│   │   ├── models/            # 19 Mongoose models
│   │   ├── routes/            # 20 route modules (~127 endpoints)
│   │   ├── services/          # 30 business logic services
│   │   ├── seeds/             # Blog, resource, and category seed data
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Logger, errors, token utils, query helpers
│   ├── scripts/               # Admin creation, seeding, email verification
│   ├── tests/                 # Integration and unit tests
│   └── package.json
├── Lunara/                    # React frontend application
│   ├── src/
│   │   ├── api/               # Axios API client with interceptors
│   │   ├── components/        # Feature-organized component library
│   │   │   ├── blog/          # Blog editor and management
│   │   │   ├── client/        # Client dashboard, appointments, mood, care plans
│   │   │   ├── documents/     # Document upload, review, recommendations
│   │   │   ├── intake/        # Multi-step client onboarding wizard
│   │   │   ├── layout/        # Header, footer, main layout
│   │   │   ├── messaging/     # Real-time messaging center
│   │   │   ├── provider/      # Provider dashboard, scheduling, clients
│   │   │   ├── resources/     # Resource library and editor
│   │   │   └── ui/            # Shared UI primitives
│   │   ├── contexts/          # AuthContext, ResourceContext
│   │   ├── hooks/             # useAuth, useResource, useSocket
│   │   ├── pages/             # 10 page components
│   │   ├── services/          # 13 API service modules
│   │   ├── styles/            # Global CSS
│   │   ├── tests/             # Unit and integration tests
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets and images
│   └── package.json
├── Docs/                      # Project documentation
│   ├── Capstone-Papers/       # Academic capstone submission (12 papers)
│   ├── Planning/              # Sprint plan, requirements PDFs
│   ├── Templates/             # LaTeX templates for PDF generation
│   └── img/                   # Architecture diagrams and wireframes
├── .github/workflows/         # CI/CD pipeline definitions
├── .husky/                    # Git hook configuration
├── scripts/                   # Monorepo coverage and LCOV scripts
├── docker-compose.yml         # Local dev environment
├── render.yaml                # Render deployment blueprint
├── vercel.json                # Vercel deployment config
├── sonar-project.properties   # SonarQube analysis config
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omniV1/AQC.git
   cd AQC
   ```

2. **Set up environment variables:**
   - Copy `backend/.env.example` to `backend/.env` and fill in values
   - Copy `Lunara/.env.example` to `Lunara/.env` and fill in values
   - See the backend and frontend READMEs for required variables

3. **Start the backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   cd Lunara
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:10000/api
   - API Documentation: http://localhost:10000/api-docs

### Running with Docker

```bash
docker-compose up --build -d
```

Services available:
- Backend API: http://localhost:10000
- Frontend: http://localhost:5173
- MongoDB: port 27017
- SonarQube: http://localhost:9000

## Implemented Features

### Authentication and Security
- Email/password registration and login for clients and providers
- Google OAuth integration
- JWT access tokens with automatic refresh via httpOnly cookies
- Email verification and password reset flows
- Multi-factor authentication (TOTP with QR code setup and backup codes)
- Account locking after repeated failed login attempts
- Role-based access control (client, provider, admin)
- Rate limiting on sensitive endpoints

### Messaging
- Real-time one-to-one messaging between clients and their assigned providers via Socket.IO
- Unread message counts and conversation list
- Message delivery confirmation
- Per-user rate limiting

### Appointments and Scheduling
- Providers manage availability slots
- Clients request appointments; providers confirm, reschedule, or cancel
- Calendar views for both roles
- Appointment reminders (scheduled background service)
- Support for virtual and in-person appointment types

### Mood and Wellness Tracking
- Five-level mood check-in with a 3D animated orb visualization
- Physical symptom tracking across 10 symptom types
- Trend analysis and alert generation for concerning patterns
- Provider review of client check-ins

### Care Plans
- Providers create care plans from templates or from scratch
- Milestone tracking by category (physical, emotional, feeding, self-care)
- Progress percentage and status management

### Documents
- Clients upload and manage documents across eight types (emotional survey, health assessment, feeding log, sleep log, and others)
- Submission workflow: draft, submitted to provider, reviewed, completed
- Privacy levels: client-only, client-and-provider, care-team
- Provider review panel with feedback
- Version history with restore
- GridFS-backed file storage

### Blog
- Providers create and publish blog posts with a rich text editor
- SEO fields: slug, excerpt, tags, categories
- Auto-save, draft and publish states, version history
- Public blog listing and detail pages

### Educational Resources
- Resource library filterable by difficulty, postpartum week, and category
- Providers create and manage resources with file attachments
- Personalized recommendations based on a client's postpartum week
- Interaction tracking (views, likes, bookmarks)

### Client Onboarding
- Multi-step intake wizard collecting personal, birth, feeding, health, and support information
- Progressive form with validation at each step

### Push Notifications
- Browser-based push notifications via Web Push API (VAPID)
- Subscribe and unsubscribe per device

### Provider Tools
- Dashboard overview with client counts, pending appointments, and recent activity
- Client list management and invitation by email
- Availability slot configuration
- Blog and resource authoring
- Document review panel
- Check-in review for assigned clients

### Client Tools
- Personal dashboard with summary widgets
- Messaging with assigned provider
- Appointment calendar with time proposal
- Mood check-in
- Document uploads
- Resource browsing
- Care plan viewing

### Admin
- Provider account creation
- Platform statistics and analytics endpoints
- Content seeding
- User lock/unlock

## Quality and Testing

- 375 tests (222 frontend, 153 backend)
- 81.9% overall code coverage
- SonarQube quality gate passed with A ratings for security, reliability, and maintainability
- Pre-commit hooks enforce TypeScript type-checking, ESLint, and Prettier formatting
- GitHub Actions CI runs tests and builds on every push

## Production Deployment

- **Frontend**: https://www.lunaracare.org (Vercel)
- **Backend API**: https://lunara.onrender.com/api (Render)
- **Database**: MongoDB Atlas

## Documentation

- [Backend README](./backend/README.md) - API reference, models, routes, and setup
- [Frontend README](./Lunara/README.md) - Components, pages, services, and setup
- [Docs README](./Docs/README.md) - Project documentation index
- [Development Guide](./Docs/DEVELOPMENT_GUIDE.md) - Architecture and setup reference
- [Sprint Plan](./Docs/Planning/SPRINT_PLAN.md) - Roadmap and progress tracking

## Team

**LUNARA** is a senior capstone project at Grand Canyon University, advised by Professor Amr Elchouemi.

- **Owen Lindsey** - Backend Lead, DevOps, and Project Manager
- **Carter Wright** - Frontend Lead and UI/UX Designer

## Contributing

1. Follow existing TypeScript conventions and code patterns
2. Add tests for new features
3. Update API documentation (Swagger comments) for new endpoints
4. Ensure all tests pass and SonarQube quality gate clears before submitting a PR
5. Use conventional commit messages
6. Follow accessibility guidelines for UI components

## License

This project is licensed under the MIT License.
