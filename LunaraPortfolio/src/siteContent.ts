export const heroNarrative =
  'LUNARA is a full-stack postpartum support platform that brings scheduling, messaging, check-ins, educational content, clinical context, and care-plan coordination into a single environment. The product is designed to reduce fragmentation for postpartum families while giving doulas a structured, secure workspace for continuity of care.';

export const brandImages = {
  hero: 'https://www.lunaracare.org/images/ollie%20head.png',
  newborn: 'https://www.lunaracare.org/images/newborn.png',
  belly: 'https://www.lunaracare.org/images/belly.png',
  baby: 'https://www.lunaracare.org/images/baby.png',
  seal: 'https://www.lunaracare.org/images/wax%20seal.png',
};

export const portfolioStats = [
  { value: '1044', label: 'Jest tests' },
  { value: '32', label: 'Playwright E2E' },
  { value: '20', label: 'Route modules' },
  { value: '30', label: 'Backend services' },
];

export const highlights = [
  {
    title: 'Care continuity',
    body: 'Postpartum support often breaks across texts, spreadsheets, intake forms, and disconnected scheduling tools. LUNARA consolidates those fragments into one system so context follows the relationship instead of being rebuilt at every step.',
  },
  {
    title: 'Provider operations',
    body: 'The provider workspace combines client management, scheduling, check-in review, care-plan authoring, educational publishing, document review, and secure communication in a single operational command surface.',
  },
  {
    title: 'Client engagement',
    body: 'The client experience balances warmth and structure: intake, recovery check-ins, appointments, documents, resources, care plans, and direct provider communication all live behind one authenticated workflow.',
  },
];

export const architectureLayers = [
  {
    name: 'Experience layer',
    detail: 'A public landing experience and two role-specific workspaces organize the product around client recovery and provider operations.',
  },
  {
    name: 'Application layer',
    detail: 'React 18 on Vite drives protected routes, dashboard state, intake workflows, scheduling UI, documents, resources, blog surfaces, and messaging views.',
  },
  {
    name: 'Coordination layer',
    detail: 'Express and TypeScript expose REST endpoints plus Socket.IO events for messaging, notifications, authentication, intake, resources, documents, and admin workflows.',
  },
  {
    name: 'Persistence + operations',
    detail: 'MongoDB, GridFS, Docker, Render, Vercel, GitHub Actions, Swagger, and SonarQube provide storage, deployment, documentation, and release confidence.',
  },
];

export const featureColumns = [
  {
    heading: 'Provider command center',
    items: [
      'Overview workspace with active-client and pending-work visibility',
      'Calendar scheduling, availability management, and appointment workflows',
      'Client roster management with profile editing and care-plan actions',
      'Blog and resource publishing with version-aware content handling',
      'Check-in review, alerts, and document feedback loops',
    ],
  },
  {
    heading: 'Client recovery workspace',
    items: [
      'Five-step onboarding intake with progressive validation',
      'Mood and symptom check-ins with share controls and recovery context',
      'Document uploads, privacy levels, and provider review statuses',
      'Appointments, unread messaging, resources, and recent blog content',
      'Care-plan progress tracking inside a single signed-in dashboard',
    ],
  },
];

export const showcaseSections = [
  {
    title: 'Public experience that feels supportive, not clinical',
    description:
      'The public-facing surface establishes trust first: warm photography, calm typography, clear service framing, and direct movement into inquiry or login without losing the emotional tone of the brand.',
    image: brandImages.hero,
    align: 'image-right' as const,
    kicker: 'Public surface',
  },
  {
    title: 'Provider and client workflows share the same product spine',
    description:
      'The application ties together dashboards, scheduling, intake, messaging, documents, and educational content so both sides of the relationship work from the same source of truth.',
    image: brandImages.newborn,
    align: 'image-left' as const,
    kicker: 'Product workflow',
  },
  {
    title: 'Release materials support the product instead of distracting from it',
    description:
      'Documentation, poster assets, architecture references, testing evidence, and deployment links all reinforce the same delivery story: a polished application with credible engineering depth and a clear maintenance posture.',
    image: brandImages.belly,
    align: 'image-right' as const,
    kicker: 'Submission package',
  },
];

export const artifactLinks = [
  {
    title: 'Live application',
    href: 'https://www.lunaracare.org',
    meta: 'Primary product experience',
    description: 'Public-facing entry point for the working LUNARA application and the main product showcased to reviewers.',
  },
  {
    title: 'API documentation',
    href: 'https://lunara.onrender.com/api-docs',
    meta: 'Interactive Swagger',
    description: 'Route inventory and request/response documentation for the Express backend.',
  },
  {
    title: 'Repository',
    href: 'https://github.com/omniV1/lunaraCare',
    meta: 'Source control evidence',
    description: 'Monorepo containing backend, frontend, documentation, and the standalone portfolio site.',
  },
  {
    title: 'Capstone documentation',
    href: 'https://github.com/omniV1/lunaraCare/tree/main/Docs',
    meta: 'Milestone packet + guides',
    description: 'Formal capstone papers, development guide, sprint plan, deployment notes, and supporting artifacts.',
  },
  {
    title: 'Showcase poster',
    href: '',
    meta: 'Presentation support',
    description: 'Revised poster export bundled directly with the deployed project so reviewers can open the presentation asset without relying on GitHub-tracked binaries.',
  },
];

export const implementationNotes = [
  'Backend test/demo accounts can be created with `cd backend && npm run seed:test-users`, which provisions `testprovider@lunara.dev` and `testclient@lunara.dev` using the known password `Testing123!`.',
  'The production application remains the primary deliverable and demonstrates the full public, provider, and client experience at `lunaracare.org`.',
  'Developer websites are supplemental references only: Owen Lindsey (`omniv.org`) and Carter Wright (`carterwright.dev`). Andrew Mack does not currently have a public portfolio site linked in the submission.',
];

export const codeSamples = [
  {
    title: 'Seed disposable test accounts',
    language: 'ts',
    snippet: `const CLIENT_EMAIL = process.env.SEED_CLIENT_EMAIL?.trim() || 'testclient@lunara.dev';\nconst PASSWORD = 'Testing123!';\n\nawait User.create({\n  firstName: 'Test',\n  lastName: 'Client',\n  email: CLIENT_EMAIL,\n  password: PASSWORD,\n  role: 'client',\n  isEmailVerified: true,\n});`,
  },
  {
    title: 'Role-protected frontend routes',
    language: 'tsx',
    snippet: `<Route\n  path=\"/provider/dashboard\"\n  element={\n    <ProtectedRoute allowedRoles={['provider']}>\n      <ProviderDashboard />\n    </ProtectedRoute>\n  }\n/>`,
  },
  {
    title: 'Realtime message delivery acknowledgement',
    language: 'ts',
    snippet: `socket.emit('message_delivered', {\n  messageId: payload.id,\n  conversationId: payload.conversationId,\n  receiverId: payload.receiver,\n  deliveredAt: new Date().toISOString(),\n});`,
  },
];

export const runSteps = [
  'Run the product locally from the monorepo: start the backend in `backend/`, then the main app in `Lunara/`.',
  'Run this portfolio site separately from `LunaraPortfolio/` with `npm install` and `npm run dev`.',
  'Use the live product for interactive review and the portfolio site for architecture, artifact, and implementation context.',
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
  'The backend organizes 20 route modules across authentication, intake, appointments, messaging, check-ins, resources, documents, blog publishing, push notifications, and admin operations.',
  'Provider dashboards expose overview, clients, schedule, blog, profile, and provider-creation workflows; client dashboards focus on overview, messages, appointments, and profile-driven recovery tasks.',
  'Release confidence is backed by 1044 Jest tests, 32 Playwright end-to-end tests, Swagger documentation, and a deployed frontend/backend split across Vercel and Render.',
];

export const architectureNarrative = [
  'LUNARA is not a single-page brochure with a login attached. It is a coordinated postpartum support system with a public brand surface, protected dashboards, and a backend that treats scheduling, communication, content, and recovery context as first-class product domains.',
  'The client journey starts with onboarding and continues through appointments, check-ins, documents, care plans, and educational resources. The provider journey sits in parallel, with client oversight, scheduling control, content publishing, and operational review all available from one workspace.',
  'Underneath those flows, the backend blends route modularity, service orchestration, secure authentication, realtime messaging, and file handling into a maintainable architecture that can support continued growth after the capstone milestone.',
];
