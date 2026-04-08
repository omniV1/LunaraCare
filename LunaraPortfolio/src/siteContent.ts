export const heroNarrative =
  'LUNARA is a full-stack postpartum support platform that brings client care, provider workflows, educational content, documentation, and quality evidence into one cohesive product. The application closes a real care-continuity gap by giving doulas and postpartum families a single place to communicate, schedule, track recovery, and manage care artifacts.';

export const highlights = [
  {
    title: 'Why it matters',
    body: 'Postpartum care often gets fragmented across messages, spreadsheets, paper forms, and disconnected tools. LUNARA replaces that fragmentation with a role-aware digital hub centered on continuity, privacy, and sustainable provider workflows.',
  },
  {
    title: 'What was built',
    body: 'The MVP includes secure authentication, provider and client dashboards, intake, appointments, real-time messaging, mood and symptom tracking, documents, care plans, educational resources, blog publishing, and admin tooling.',
  },
  {
    title: 'How it was delivered',
    body: 'The codebase uses React, TypeScript, Vite, Express, MongoDB, Socket.IO, Swagger, Docker, GitHub Actions, Jest, Playwright, and SonarQube. The portfolio site adds Pretext to present that story with precise editorial layout.',
  },
];

export const architectureLayers = [
  {
    name: 'Portfolio Site',
    detail: 'This standalone employer-facing site summarizes the project and links outward to the live app, docs, artifacts, and team references.',
  },
  {
    name: 'Live Application',
    detail: 'The production product at lunaracare.org exposes the public marketing/blog experience and role-based client and provider workflows.',
  },
  {
    name: 'Frontend + API',
    detail: 'React 18 on Vite talks to an Express + TypeScript backend over REST and Socket.IO, with guarded routes, refresh-token auth, and Swagger docs.',
  },
  {
    name: 'Persistence + Ops',
    detail: 'MongoDB Atlas stores data and GridFS uploads, while Docker, GitHub Actions, Render, Vercel, and SonarQube support delivery and maintenance.',
  },
];

export const featureColumns = [
  {
    heading: 'Client experience',
    items: [
      'Five-step intake wizard with progressive validation',
      'Daily mood and symptom check-ins with provider visibility controls',
      'Appointment requests, confirmations, and calendar views',
      'Secure document uploads, privacy levels, and care-plan tracking',
      'Real-time messaging with the assigned provider',
    ],
  },
  {
    heading: 'Provider experience',
    items: [
      'Dashboard overview of clients, schedules, and review queues',
      'Calendar scheduling and availability management',
      'Resource and blog publishing workflows',
      'Document review, check-in alerts, and care-plan management',
      'Admin/provider account tools and analytics surfaces',
    ],
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
    href: 'https://github.com/omniV1/lunaraCare/blob/main/Docs/Presentations/LUNARA_Showcase_Poster_REVISED.pdf',
    meta: 'Presentation support',
    description: 'Revised poster export included in the project submission materials.',
  },
];

export const implementationNotes = [
  'Backend test/demo accounts can be created with `cd backend && npm run seed:test-users`, which provisions `testprovider@lunara.dev` and `testclient@lunara.dev` using the known password `Testing123!`.',
  'The live app remains the main deliverable; this portfolio site exists to explain the architecture, decisions, artifacts, and project context for employers and evaluators.',
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
    title: 'Pretext-powered editorial layout',
    language: 'ts',
    snippet: `const prepared = prepareWithSegments(heroNarrative, BODY_FONT);\nlet cursor = { segmentIndex: 0, graphemeIndex: 0 };\n\nwhile (true) {\n  const maxWidth = y < obstacleHeight ? stageWidth - obstacleWidth - gap : stageWidth;\n  const line = layoutNextLine(prepared, cursor, maxWidth);\n  if (!line) break;\n  lines.push({ text: line.text, top: y, width: line.width });\n  cursor = line.end;\n  y += lineHeight;\n}`,
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
