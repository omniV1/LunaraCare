export const heroNarrative =
  'LUNARA is a full-stack postpartum support platform that brings scheduling, messaging, check-ins, educational content, clinical context, and care-plan coordination into a single environment. The product is designed to reduce fragmentation for postpartum families while giving doulas a structured, secure workspace for continuity of care. The system spans a public brand surface, two role-specific dashboards, 127 REST endpoints, realtime Socket.IO messaging, MongoDB with GridFS file storage, and a CI/CD pipeline backed by GitHub Actions and SonarQube quality gates. Every workflow — from a five-step intake questionnaire to provider-authored care plans — is tested by over a thousand automated tests and deployed across Vercel and Render with Docker-ready containers.';

export const brandImages = {
  hero: 'https://www.lunaracare.org/images/ollie%20head.png',
  newborn: 'https://www.lunaracare.org/images/newborn.png',
  belly: 'https://www.lunaracare.org/images/belly.png',
  baby: 'https://www.lunaracare.org/images/baby.png',
  seal: 'https://www.lunaracare.org/images/wax%20seal.png',
};

export const portfolioStats = [
  { value: '1,044', label: 'Jest unit tests' },
  { value: '32', label: 'Playwright E2E specs' },
  { value: '127', label: 'API route handlers' },
  { value: '19', label: 'Mongoose data models' },
];

export const highlights = [
  {
    title: 'Care continuity across every touchpoint',
    body: 'Postpartum support often fragments across texts, spreadsheets, intake PDFs, and disconnected scheduling tools. LUNARA consolidates all of that — intake, check-ins, appointments, documents, care plans, messaging, and educational content — into one authenticated system so context follows the care relationship instead of being rebuilt at every interaction.',
  },
  {
    title: 'Provider command surface',
    body: 'The provider dashboard combines client management, a full scheduling calendar with availability slots, check-in review and alerting, care-plan authoring from reusable templates, blog and resource publishing with version history, document review workflows, and a multi-client realtime message center — all in a single tabbed workspace.',
  },
  {
    title: 'Client recovery experience',
    body: 'The client journey begins with a validated five-step intake wizard (personal, birth, feeding, support, health) and continues through mood check-ins rendered with a Three.js 3D orb, appointment booking, document uploads with privacy controls, suggested educational content, care-plan progress tracking, and direct provider messaging.',
  },
  {
    title: 'Enterprise-grade auth pipeline',
    body: 'Authentication covers JWT access and refresh tokens with httpOnly cookies, Passport.js strategies for local login and Google OAuth 2.0, TOTP-based multi-factor authentication with backup codes, account lockout after failed attempts, email verification, password reset flows, and cross-tab session synchronization.',
  },
];

export const architectureLayers = [
  {
    name: 'Experience layer — Public, Provider, Client',
    detail: 'A warm public landing page with inquiry forms, a tabbed provider command center (overview, clients, schedule, blog, profile, add-provider), and a client recovery dashboard (overview, messages, appointments, profile) — all code-split with React.lazy and guarded by role-based ProtectedRoute wrappers.',
  },
  {
    name: 'Application layer — React 18 + Vite + Tailwind',
    detail: '97 components, 11 lazy-loaded page routes, 13 frontend service modules, and 3 custom hooks organize the UI. State lives in React Context (AuthContext, ResourceContext) with an Axios client that handles automatic token refresh, 401 retry, and 429 exponential backoff. Forms use React Hook Form with Zod schema validation.',
  },
  {
    name: 'Coordination layer — Express + Socket.IO + Passport',
    detail: '20 route modules expose 127 handlers across auth, intake, appointments, messaging, check-ins, resources, documents, blog, care plans, recommendations, push notifications, files, and admin. 29 service modules encapsulate business logic. Socket.IO provides JWT-authenticated realtime messaging with delivery acknowledgement and per-user rate limiting.',
  },
  {
    name: 'Persistence layer — MongoDB + GridFS',
    detail: '19 Mongoose models capture users, clients, providers, appointments, availability slots, messages, resources, blog posts, care plans and templates, check-ins, documents, inquiries, interactions, push subscriptions, and version-history records. GridFS stores file uploads (images, PDFs, documents) up to 10 MB with ownership-checked retrieval.',
  },
  {
    name: 'Operations layer — Docker + CI/CD + SonarQube',
    detail: 'A docker-compose stack runs MongoDB 7, the Node 20 backend, an Nginx-fronted frontend, and SonarQube Community with Postgres. GitHub Actions run lint, type-check, tests, coverage, and Playwright E2E on Node 18 and 20. Husky pre-commit hooks enforce lint-staged Prettier, ESLint, and TypeScript checks before every commit.',
  },
];

export const featureColumns = [
  {
    heading: 'Provider command center',
    items: [
      'Overview workspace with active-client counts, pending appointments, and unread message indicators',
      'ProviderCalendar with availability-slot management, appointment scheduling, and status workflows (pending → confirmed → completed → cancelled)',
      'Client roster with inline profile editing, care-plan creation from reusable templates, and check-in detail views with mood and symptom history',
      'Blog and resource publishing with Quill rich-text editor, version history, category tagging, and draft/publish lifecycle',
      'Multi-client MessageCenter backed by Socket.IO with REST polling fallback and delivery acknowledgements',
      'Provider-initiated client invitations, document feedback workflows, and admin-level provider creation',
    ],
  },
  {
    heading: 'Client recovery workspace',
    items: [
      'Five-step Zod-validated intake wizard: personal details, birth information, feeding preferences, support needs, and health context',
      'Mood and symptom check-ins with a Three.js 3D orb visualization, share controls, and provider-visible trend aggregation',
      'Document uploads with privacy levels, GridFS storage, provider review statuses, and version tracking',
      'Appointment booking against provider availability slots, calendar grid view, and reminder scheduling',
      'Suggested blog content, resource library with favorites and interaction tracking, and DOMPurify-sanitized rich-text rendering',
      'Care-plan progress tracking with milestone completion inside a single authenticated dashboard',
    ],
  },
  {
    heading: 'Public brand surface',
    items: [
      'Marketing landing page with warm photography, calm typography, and service framing that establishes trust before asking for engagement',
      'React Hook Form inquiry submission with Zod validation posting to a rate-limited public contact endpoint',
      'Public blog index and detail pages with SEO-friendly slugs, view counts, and sanitized HTML content',
      'Login with email/password, Google OAuth redirect flow, and MFA challenge step — all with accessible form patterns and sr-only labels',
      'Email verification, forgot-password, and reset-password flows with tokenized links',
      'Responsive across all viewports with safe-area CSS variables for notched mobile devices',
    ],
  },
];

export const showcaseSections = [
  {
    title: 'Public experience that feels supportive, not clinical',
    description:
      'The public-facing surface establishes trust first: warm photography, calm typography, clear service framing, and direct movement into inquiry or login without losing the emotional tone of the brand. The landing page validates contact submissions with Zod, and the blog surfaces DOMPurify-sanitized educational content that providers publish from their dashboard.',
    image: brandImages.hero,
    align: 'image-right' as const,
    kicker: 'Public surface',
  },
  {
    title: 'Provider and client workflows share the same product spine',
    description:
      'Both dashboards draw from the same 127-endpoint backend: appointments, messages, documents, care plans, check-ins, and resources are first-class API domains. Socket.IO messaging delivers in realtime with REST fallback. The provider sees a multi-client command surface; the client sees a focused recovery workspace — same data, different lenses.',
    image: brandImages.newborn,
    align: 'image-left' as const,
    kicker: 'Product workflow',
  },
  {
    title: 'Every layer tested, every deploy gated',
    description:
      '1,044 Jest tests cover services, middleware, hooks, contexts, and components. 32 Playwright specs cover authentication, navigation, landing, and blog flows end-to-end across Chromium. GitHub Actions run lint, type-check, tests, coverage, and build on every push across Node 18 and 20 matrices. SonarQube enforces quality gates on duplications, maintainability, and code smells.',
    image: brandImages.belly,
    align: 'image-right' as const,
    kicker: 'Quality assurance',
  },
];

export const artifactLinks = [
  {
    title: 'Live application',
    href: 'https://www.lunaracare.org',
    meta: 'Primary product experience',
    description: 'Production deployment of the full LUNARA platform — public landing, provider dashboard, and client recovery workspace.',
  },
  {
    title: 'API documentation',
    href: 'https://lunara.onrender.com/api-docs',
    meta: 'Interactive Swagger / OpenAPI 3.0',
    description: 'Browse all 127 route handlers with request/response schemas, try endpoints with Bearer auth, and review the data model annotations.',
  },
  {
    title: 'Repository',
    href: 'https://github.com/omniV1/lunaraCare',
    meta: 'Source control evidence',
    description: 'Monorepo containing backend, frontend, portfolio site, documentation, CI/CD workflows, Docker configs, and SonarQube properties.',
  },
  {
    title: 'Capstone documentation',
    href: 'https://github.com/omniV1/lunaraCare/tree/main/Docs',
    meta: 'Milestone packet + guides',
    description: 'Six milestone papers (proposal through release), development guide, deployment runbooks, sprint plan, architecture diagrams, and CI/CD narrative.',
  },
  {
    title: 'Development guide',
    href: 'https://github.com/omniV1/lunaraCare/blob/main/Docs/DEVELOPMENT_GUIDE.md',
    meta: 'Onboarding reference',
    description: 'End-to-end local setup, environment variables, API surface tables, JWT flow, database schema sketches, Docker commands, and troubleshooting.',
  },
  {
    title: 'Showcase poster',
    href: '',
    meta: 'Presentation support',
    description: 'Revised poster export bundled directly with the deployed portfolio so reviewers can open it without depending on GitHub-tracked binaries.',
  },
];

export const implementationNotes = [
  'Backend test accounts: run `cd backend && npm run seed:test-users` to provision `testprovider@lunara.dev` and `testclient@lunara.dev` with the password `Testing123!`. Additional seed scripts create admin accounts and care-plan templates.',
  'The backend exposes a health endpoint at `/api/health` returning status, timestamp, and environment, used by Docker HEALTHCHECK and Render automatic monitoring.',
  'CORS is configured with an explicit allowlist plus dynamic pattern matching for Vercel preview deployments and lunaracare.org subdomains.',
  'Rate limiting applies globally (100 requests per 15-minute window in production) with stricter limits on sensitive auth endpoints (5 per 15 minutes) and the public contact form.',
  'File uploads use multer with memory storage (10 MB limit, MIME whitelist for images/PDF/Word) writing to MongoDB GridFS with ownership metadata for access control.',
  'The frontend Axios client intercepts 401 responses to attempt a silent token refresh via httpOnly cookie, retries the original request on success, and fires a cross-tab session-expiry event on failure.',
  'The production frontend runs behind Nginx with HSTS, Content-Security-Policy, X-Frame-Options, gzip compression, and long-cache headers for hashed static assets.',
];

export const codeSamples = [
  {
    title: 'JWT + Passport authentication middleware',
    language: 'ts',
    snippet: `// passport.ts — JWT strategy with issuer/audience verification
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: 'lunara-api',
  audience: 'lunara-frontend',
  algorithms: ['HS256'],
};

passport.use('jwt', new JwtStrategy(jwtOptions, async (payload, done) => {
  const user = await User.findById(payload.sub).select('-password');
  if (!user) return done(null, false);
  return done(null, user);
}));`,
  },
  {
    title: 'Socket.IO realtime messaging with JWT auth',
    language: 'ts',
    snippet: `// server.ts — Socket middleware verifies JWT before connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  const decoded = verifyAccessToken(token as string);
  socket.data.userId = decoded.sub;
  socket.data.role = decoded.role;
  next();
});

socket.on('send_message', async (payload) => {
  // Validate sender matches JWT, check relationship, persist, emit
  io.to(\`user_\${payload.receiver}\`).emit('new_message', saved);
  socket.emit('message_delivered', { messageId: saved._id });
});`,
  },
  {
    title: 'Zod-validated multi-step intake wizard',
    language: 'ts',
    snippet: `// intakeValidation.ts — step-specific schemas composed into wizard
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^\\+?[\\d\\s()-]{7,}$/, 'Valid phone required'),
  address: addressSchema,
});

export const birthInfoSchema = z.object({
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  deliveryType: z.enum(['vaginal', 'cesarean', 'vbac']),
  complications: z.string().optional(),
  babyInfo: babyInfoSchema,
});`,
  },
  {
    title: 'Axios client with refresh and backoff',
    language: 'ts',
    snippet: `// apiClient.ts — automatic token refresh and 429 retry
instance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        error.config.headers.Authorization = \`Bearer \${refreshed}\`;
        return instance(error.config); // retry original request
      }
      window.dispatchEvent(new Event('auth:session-expired'));
    }
    if (error.response?.status === 429) {
      await delay(Math.pow(2, retryCount) * 1000);
      return instance(error.config);
    }
    return Promise.reject(error);
  }
);`,
  },
  {
    title: 'GridFS file upload with ownership metadata',
    language: 'ts',
    snippet: `// gridfsService.ts — stream to MongoDB GridFS bucket
async uploadFile(
  file: Express.Multer.File,
  userId: string,
  folder: string
): Promise<Types.ObjectId> {
  const uploadStream = this.bucket.openUploadStream(file.originalname, {
    contentType: file.mimetype,
    metadata: { uploadedBy: userId, folder, originalName: file.originalname },
  });
  const readable = Readable.from(file.buffer);
  readable.pipe(uploadStream);
  return uploadStream.id;
}`,
  },
  {
    title: 'Role-protected frontend routes',
    language: 'tsx',
    snippet: `// App.tsx — lazy-loaded pages with role gating
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));

<Route path="/provider/dashboard" element={
  <ProtectedRoute allowedRoles={['provider']}>
    <ProviderDashboard />
  </ProtectedRoute>
} />
<Route path="/client/dashboard" element={
  <ProtectedRoute allowedRoles={['client']}>
    <ClientDashboard />
  </ProtectedRoute>
} />`,
  },
];

export const runSteps = [
  'Clone the monorepo: `git clone https://github.com/omniV1/lunaraCare.git && cd lunaraCare`',
  'Start MongoDB locally or set `MONGODB_URI` in `backend/.env` to an Atlas cluster',
  'Backend: `cd backend && npm install && npm run seed:test-users && npm run dev` — runs on port 10000',
  'Frontend: `cd Lunara && npm install && npm run dev` — runs on port 5173 with Vite HMR',
  'Portfolio site: `cd LunaraPortfolio && npm install && npm run dev` — standalone at port 5174',
  'Full Docker stack: `docker compose up` from the repo root spins up MongoDB, backend, frontend, and SonarQube',
  'Run all tests: `cd backend && npm test` (21 unit suites) then `cd Lunara && npm test` (107 test files) then `npm run test:e2e` (Playwright)',
];

export const teamLinks = [
  {
    name: 'Owen Lindsey',
    role: 'Full Stack Developer',
    href: 'https://www.omniv.org/',
    note: 'Supplemental personal portfolio',
  },
  {
    name: 'Carter Wright',
    role: 'Full Stack Developer',
    href: 'https://www.carterwright.dev/',
    note: 'Supplemental personal portfolio',
  },
  {
    name: 'Andrew Mack',
    role: 'Full Stack Developer',
    href: '',
    note: 'No public portfolio site provided in the final submission package',
  },
];

export const posterBoardNotes = [
  'The backend organizes 20 route modules and 127 Express handlers across authentication (register, login, refresh, logout, MFA, OAuth), intake, appointments, messaging, check-ins, resources, documents, blog publishing, care plans, recommendations, push notifications, file storage, and admin operations.',
  'Security is layered: Helmet and custom headers, bcrypt password hashing, JWT with issuer/audience claims, httpOnly refresh cookies, TOTP multi-factor authentication with backup codes, account lockout, rate limiting at global and per-endpoint levels, request sanitization, and CORS allowlisting.',
  '19 Mongoose models define the data layer with full relationship graphs — User, Client, Provider, Appointment, AvailabilitySlot, Message, Resource, ResourceVersion, Category, BlogPost, BlogPostVersion, CarePlan, CarePlanTemplate, CheckIn, ClientDocument, ClientDocumentVersion, Inquiry, UserResourceInteraction, and PushSubscription.',
  'The frontend ships 97 components, 11 lazy-loaded page routes, 13 service modules, and 3 custom hooks. React Context manages auth state and resource library state. An Axios interceptor handles automatic token refresh, cross-tab session sync, and exponential backoff on rate-limited responses.',
  'Quality assurance runs 1,044 Jest tests (services, middleware, hooks, contexts, components) and 32 Playwright E2E specs (landing, auth, blog, navigation) across a Node 18/20 CI matrix. SonarQube tracks duplications at 2.6%, maintainability ratings at A, and coverage above configured thresholds.',
];

export const architectureNarrative = [
  'LUNARA is not a single-page brochure with a login attached. It is a coordinated postpartum support system with three distinct surface areas — a public brand experience that builds trust before asking for engagement, a provider command center for managing an entire doula practice, and a client recovery workspace that turns fragmented postpartum care into a single continuous relationship.',
  'The backend is built on Express with TypeScript and follows a route → service → model separation. 20 route modules delegate to 29 service modules that encapsulate business logic for authentication, scheduling, messaging, content, documents, care plans, check-ins, file storage, email, push notifications, and caching. Passport.js manages three strategies: JWT for stateless API access, Local for email/password with bcrypt and lockout, and Google OAuth 2.0 for social login.',
  'The frontend uses React 18 on Vite with Tailwind CSS and code-splits every page with React.lazy. Role-based ProtectedRoute wrappers gate provider and client dashboards. State flows through AuthContext and ResourceContext, while an Axios client silently refreshes expired tokens, retries rate-limited requests with backoff, and broadcasts session-expiry events across browser tabs.',
  'Realtime messaging runs on Socket.IO with JWT verification in the handshake middleware, per-user room management, delivery acknowledgements, and a per-user message rate limiter. The frontend falls back to REST polling when the socket connection drops, so messages are never lost.',
  'The CI/CD pipeline consists of three GitHub Actions workflows: frontend-ci (ESLint, Jest, build, Playwright on Node 18/20), backend-ci (type-check, Jest, Docker build on main), and build (SonarQube analysis). Husky pre-commit hooks run lint-staged Prettier, ESLint, and TypeScript checks. Docker Compose orchestrates the full stack locally: MongoDB 7, the Node 20 backend with health checks, an Nginx-fronted frontend, and SonarQube Community with Postgres for static analysis.',
  'The deployment topology splits across Vercel (frontend hosting with instant rollbacks) and Render (backend with a render.yaml blueprint specifying health checks, environment secrets, and auto-deploy from main). MongoDB Atlas provides managed persistence. The Swagger UI at /api-docs offers an interactive API browser backed by OpenAPI 3.0 annotations across every route and model file.',
];

export const securityDetails = [
  {
    title: 'Authentication',
    body: 'JWT access tokens (HS256, issuer: lunara-api, audience: lunara-frontend) with short TTL, plus refresh tokens stored in httpOnly secure cookies with SameSite enforcement. Passport.js manages Local (bcrypt + lockout), JWT, and Google OAuth 2.0 strategies.',
  },
  {
    title: 'Multi-factor authentication',
    body: 'TOTP-based 2FA using the otpauth library with QR code provisioning, six-digit verification, and single-use backup codes. MFA challenge is enforced at login before issuing tokens.',
  },
  {
    title: 'Transport and headers',
    body: 'Helmet with custom CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, strict Referrer-Policy, and Permissions-Policy. Nginx adds an additional security header layer in production.',
  },
  {
    title: 'Rate limiting',
    body: 'Global express-rate-limit at 100 requests per 15-minute window in production. Sensitive auth endpoints (login, register, password reset) limited to 5 per 15 minutes. Contact form has its own limiter. Socket messages are rate-limited per user.',
  },
  {
    title: 'Data safety',
    body: 'Request body sanitization trims all nested strings. DOMPurify sanitizes all rich-text HTML rendering on the frontend. File uploads are MIME-whitelisted and size-capped. GridFS enforces ownership checks on retrieval and deletion.',
  },
];

export const testingDetails = [
  {
    title: 'Backend unit tests (21 suites)',
    body: 'Jest with ts-jest tests every service module, middleware layer, and utility. mongodb-memory-server provides ephemeral databases for integration-style tests without external dependencies.',
  },
  {
    title: 'Backend integration tests (7 suites)',
    body: 'Supertest drives full HTTP request/response cycles through auth, appointments, messaging, care plans, check-ins, intake, resources, and scheduling endpoints.',
  },
  {
    title: 'Frontend unit tests (107 files)',
    body: 'Testing Library and jest-dom verify every page, component, hook, context, service, and API client module. MSW mocks network requests for deterministic test isolation.',
  },
  {
    title: 'End-to-end (32 Playwright specs)',
    body: 'Playwright on Chromium covers landing page interactions, authentication flows, blog navigation, and route guarding against the live Vite dev server.',
  },
  {
    title: 'Quality gates',
    body: 'SonarQube Community enforces A-rated maintainability, tracks duplications at 2.6%, and monitors coverage thresholds. Backend statement coverage sits at ~90.58%, frontend at ~63.35%.',
  },
];
