---
title: "Milestone 5: Development Phase — Testing"
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
header-right: "Milestone 5 — Testing"
footer-right: "\\thepage"
listings: true
listings-no-page-break: true
code-block-font-size: "\\scriptsize"
table-use-row-colors: true
block-headings: true
numbersections: false
titlepage: false
---

# Milestone 5: Development Phase (Coding and Testing) — Testing

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Testing Objective

The testing phase ensures the application functions as requested and encompasses three testing stages: component testing, requirements testing, and acceptance testing. In all testing stages, defects are identified and returned to the development/coding phase for correction. The testing objective for Milestone 5 was to verify that the integrated modules delivered in Milestone 4 satisfy functional requirements and quality expectations through structured examination at the unit, integration, requirements, and system levels. The result of this milestone is a test suite and quality analysis body that provides documented confidence in the release candidate.

## Testing Deliverables

This document provides the submission of the Unit and Integration Test Plans, including the Test Case Specification documents, test coverage analysis, quality metrics, and the requirements-to-test traceability mapping.

\newpage

## COMPONENT TESTING FRAMEWORK

### Quality Assurance Philosophy

The testing strategy follows the testing pyramid model: a broad base of fast unit tests, a middle layer of integration tests that exercise real request/response cycles, and a focused top layer of system-level workflow validations. Both backend and frontend test suites use Jest as the test runner, with Supertest for HTTP-level backend integration testing and React Testing Library for frontend component rendering.

### Backend Component Testing

On the backend, unit tests targeted individual utilities, service modules, and middleware functions in isolation using MongoDB Memory Server for database isolation. Each test file creates an in-memory MongoDB instance, runs its assertions, and tears down cleanly.

**Token Utility Tests** — The token utility module was tested to confirm that JWTs are correctly signed with the HS256 algorithm, decoded to return the expected payload, and rejected when expired or malformed.

**Cache Service Tests** — The cache service was validated to ensure that cached responses are stored, retrieved within their TTL window, and invalidated after expiration.

**Message Rate Limiter Tests** — The message rate limiter was tested to confirm that it correctly throttles requests exceeding the configured threshold and passes requests within bounds.

**Check-in Trend Service Tests** — The trend service was validated to ensure that mood averages are computed correctly, symptom frequency distributions are accurate, mood direction (improving/stable/declining) is classified based on the split-half comparison, and alert thresholds trigger the expected severity classifications (info, warning, critical).

**Appointment Notification/Reminder Service Tests** — These services were tested to confirm correctly formatted email payloads and trigger intervals.

**Socket Connection Manager Tests** — The connection manager was validated for room-join, room-leave, and multi-socket-per-user behavior.

### Frontend Component Testing

On the frontend, component tests used React Testing Library to render individual UI elements in isolation and assert on their output and behavior.

**Card Component Test** — `Lunara/src/tests/components/Card.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Card } from '../../components/ui/Card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-cream');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('p-6');
    expect(card).toHaveClass('shadow-soft');
  });

  it('should apply sage variant styles', () => {
    const { container } = render(<Card variant="sage">Content</Card>);
    expect(container.firstChild).toHaveClass('bg-sage');
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

Additional frontend component tests validated the `Spinner`, `ProtectedRoute`, `ConstructionAlert`, and `ErrorBoundary` components for correct rendering behavior, visibility toggling, role-based redirection, and error fallback display.

\newpage

## INTEGRATION TESTING FRAMEWORK

### Backend API Integration Testing

Integration tests exercised real HTTP request/response cycles against the running Express application using Supertest with MongoDB Memory Server for database isolation. Each test suite starts a fresh in-memory database, registers test users, and exercises the full API contract.

**Authentication Integration Test** — `backend/tests/integration/auth.public.test.ts`

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Jane', lastName: 'Doe',
        email: 'jane@example.com', password: 'Password123', role: 'client'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should not register with duplicate email', async () => {
    // Register first, then attempt duplicate
    const res = await request(app).post('/auth/register').send({ /* duplicate */ });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail validation for missing fields', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'bad@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
```

**Frontend Service Integration Test** — `Lunara/src/tests/services/appointmentService.test.ts`

Frontend service tests mock the `ApiClient` and validate that each service method constructs the correct request, attaches authorization headers, and maps responses:

```typescript
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: jest.fn() }
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } as any;
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);
    appointmentService = AppointmentService.getInstance();
  });

  it('should return a singleton instance', () => {
    expect(AppointmentService.getInstance()).toBe(appointmentService);
  });

  it('should create a new appointment', async () => {
    const request = { providerId: '1', clientId: '2', startTime: '...', endTime: '...' };
    mockApiClient.post.mockResolvedValue({ id: '1', ...request });
    const result = await appointmentService.createAppointment(request);
    expect(mockApiClient.post).toHaveBeenCalledWith('/appointments', request);
  });
});
```

### Integration Test Coverage by Domain

| Domain | Backend Tests | Frontend Tests | Areas Covered |
|---|---|---|---|
| Authentication | auth.public.test.ts | auth flow tests | Register, login, token refresh, password reset, logout, validation |
| Appointments | appointments_messages.test.ts | appointmentService.test.ts | CRUD, upcoming, confirm, cancel, service layer |
| Messaging | appointments_messages.test.ts | messageService.test.ts | Persist, unread count, Socket.IO events |
| Check-ins | checkins.test.ts | — | Create, retrieve by user, trend computation |
| Care Plans | carePlans.test.ts | — | Template CRUD, plan assignment, milestones |
| Intake | intake.test.ts | — | Create, full update, section patch |
| Resources | resources.test.ts | resourceService.test.ts | CRUD, categories, association |
| Documents | — | documentService.test.ts | Upload, status transitions, service layer |
| Blog | — | blogService.test.ts | CRUD, drafts, publishing, service layer |
| Components | — | Card, Spinner, ProtectedRoute, ConstructionAlert | Rendering, variants, role guards |
| Dashboard | — | dashboard integration tests | Tab rendering, API loading, metrics display |

\newpage

## MODULE TEST CASES

### Test Cases Following Prescribed Template

#### Test Case TC-001

| Field | Value |
|---|---|
| **Test Case Name** | User Registration Flow |
| **Priority** | High |
| **Module** | `backend/src/routes/auth.ts` |
| **Test Objective** | Verify that a new user can register with valid credentials and receives a success response |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Submit valid registration | POST `/api/auth/register` with valid body | `{ firstName: "Jane", lastName: "Doe", email: "jane@example.com", password: "Password123", role: "client" }` | 201 status, `success: true`, user email in response | Pass |
| 2 | Reject duplicate email | POST `/api/auth/register` with same email | Same email as step 1 | 400 status, `success: false` | Pass |
| 3 | Reject missing fields | POST `/api/auth/register` with incomplete body | `{ email: "bad@example.com" }` | 400 status, `error: "Validation failed"` | Pass |

#### Test Case TC-002

| Field | Value |
|---|---|
| **Test Case Name** | JWT Token Lifecycle |
| **Priority** | High |
| **Module** | `backend/src/utils/tokenUtils.ts` |
| **Test Objective** | Verify token generation, verification, refresh, and expiration handling |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Generate access token | Call `generateTokens(user)` | User with id and role | Returns valid JWT signed with HS256 | Pass |
| 2 | Verify valid token | Call `verifyAccessToken(token)` | Token from step 1 | Returns payload with id and role | Pass |
| 3 | Reject expired token | Call `verifyAccessToken(expiredToken)` | Token with past expiration | Throws error | Pass |
| 4 | Refresh tokens | POST `/api/auth/refresh` with refresh token | Valid refresh token | Returns new access + refresh tokens | Pass |

#### Test Case TC-003

| Field | Value |
|---|---|
| **Test Case Name** | Daily Check-in Submission and Trend Analysis |
| **Priority** | High |
| **Module** | `backend/src/routes/checkins.ts`, `backend/src/services/checkinTrendService.ts` |
| **Test Objective** | Verify check-in creation, validation, trend computation, and alert generation |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Submit valid check-in | POST `/api/checkins` with auth header | `{ date: "2026-03-01", moodScore: 7, physicalSymptoms: ["fatigue"], sharedWithProvider: true }` | 201 status, check-in saved | Pass |
| 2 | Reject invalid mood score | POST `/api/checkins` with mood 15 | `{ moodScore: 15 }` | 400 status, validation error | Pass |
| 3 | Retrieve user check-ins | GET `/api/checkins/user/:userId` | Authenticated user ID | Array of check-ins sorted by date descending | Pass |
| 4 | Compute trends | GET `/api/checkins/trends/:userId?days=30` | User with multiple check-ins | Returns averageMood, symptomFrequency, moodTrend | Pass |
| 5 | Generate low mood alert | Submit 3+ check-ins with mood ≤ 3 | Consecutive low scores | Alert with type `low_mood`, severity `warning` or `critical` | Pass |

\newpage

#### Test Case TC-004

| Field | Value |
|---|---|
| **Test Case Name** | Appointment CRUD and Status Workflow |
| **Priority** | High |
| **Module** | `backend/src/routes/appointments.ts` |
| **Test Objective** | Verify appointment creation, retrieval, confirmation, and cancellation |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Create appointment | POST `/api/appointments` as provider | Client ID, start/end time, type | 201 status, appointment with status `requested` | Pass |
| 2 | Retrieve upcoming | GET `/api/appointments/upcoming` | Authenticated provider | Array of future appointments | Pass |
| 3 | Confirm appointment | PATCH `/api/appointments/:id/confirm` | Appointment ID | Status updated to `confirmed`, confirmedAt set | Pass |
| 4 | Cancel appointment | PATCH `/api/appointments/:id/cancel` | Appointment ID, cancellation reason | Status updated to `cancelled`, cancelledAt set | Pass |

#### Test Case TC-005

| Field | Value |
|---|---|
| **Test Case Name** | Care Plan Template and Milestone Tracking |
| **Priority** | Medium |
| **Module** | `backend/src/routes/carePlans.ts`, `backend/src/models/CarePlan.ts` |
| **Test Objective** | Verify care plan creation, milestone updates, and auto-progress calculation |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Create care plan | POST `/api/care-plans` as provider | Title, sections with milestones, client ID | 201 status, progress = 0 | Pass |
| 2 | Update milestone status | PATCH milestone to `completed` | Milestone ID, status `completed` | Milestone updated, progress recalculated | Pass |
| 3 | Verify progress calc | Complete 2 of 4 milestones | Two `completed`, two `pending` | Progress = 50 | Pass |

#### Test Case TC-006

| Field | Value |
|---|---|
| **Test Case Name** | Real-time Message Delivery via Socket.IO |
| **Priority** | High |
| **Module** | `backend/src/server.ts` (Socket.IO), `backend/src/services/socketConnectionManager.ts` |
| **Test Objective** | Verify message persistence, room delivery, and rate limiting |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Authenticate socket | Connect with JWT token in handshake | Valid access token | Connection accepted, userId set in socket.data | Pass |
| 2 | Join user room | Emit `join_user_room` | — | Socket joins room keyed to userId | Pass |
| 3 | Send message | Emit `send_message` with valid payload | conversationId, sender, receiver, message | Message persisted in MongoDB, `new_message` emitted to conversation room, `message_delivered` returned to sender | Pass |
| 4 | Rate limit enforcement | Send messages exceeding threshold | Rapid successive messages | `rate_limit` event emitted | Pass |

\newpage

#### Test Case TC-007

| Field | Value |
|---|---|
| **Test Case Name** | Client Intake Wizard Multi-Step Submission |
| **Priority** | High |
| **Module** | `backend/src/routes/intake.ts`, `Lunara/src/components/intake/ClientIntakeWizard.tsx` |
| **Test Objective** | Verify intake creation, section-level patching, and full update |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Create intake | POST `/api/intake` with personal section | Personal info fields | 201 status, intake created | Pass |
| 2 | Patch section | PATCH `/api/intake/:id/section/birth` | Birth section data | Section updated, other sections preserved | Pass |
| 3 | Full update | PUT `/api/intake/:id` with all sections | Complete intake data | All sections updated | Pass |

#### Test Case TC-008

| Field | Value |
|---|---|
| **Test Case Name** | Protected Route and Role-Based Access |
| **Priority** | High |
| **Module** | `Lunara/src/components/ProtectedRoute.tsx`, `backend/src/config/passport.ts` |
| **Test Objective** | Verify that unauthenticated users are redirected and role mismatches are blocked |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Redirect unauthenticated | Access `/provider/dashboard` without token | No auth context | Redirect to `/login` | Pass |
| 2 | Block role mismatch | Access `/provider/dashboard` as client | Client auth context | Redirect or access denied | Pass |
| 3 | Allow correct role | Access `/client/dashboard` as client | Client auth context | Dashboard renders | Pass |

\newpage

#### Test Case TC-009

| Field | Value |
|---|---|
| **Test Case Name** | Document Upload, Status Workflow, and Provider Review |
| **Priority** | High |
| **Module** | `backend/src/routes/documents.ts`, `backend/src/models/ClientDocument.ts`, `Lunara/src/components/documents/DocumentUpload.tsx` |
| **Test Objective** | Verify the full document lifecycle from client upload through provider review to completion |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Upload document as client | POST `/api/documents` with auth header and file metadata | `{ title: "Week 2 Assessment", documentType: "health-assessment", privacyLevel: "client-and-provider" }` | 201 status, document created with `submissionStatus: "draft"` | Pass |
| 2 | Submit to provider | PATCH `/api/documents/:id` to update status | `{ submissionStatus: "submitted-to-provider" }` | Status updated, `submissionData.submittedDate` set | Pass |
| 3 | Provider reviews document | PATCH `/api/documents/:id` as provider with feedback | `{ submissionStatus: "reviewed-by-provider", submissionData: { providerNotes: "Looks good, keep tracking" } }` | Status updated, `submissionData.reviewedDate` set, provider notes persisted | Pass |
| 4 | Complete document | PATCH `/api/documents/:id` to mark completed | `{ submissionStatus: "completed" }` | Status updated to `completed` | Pass |
| 5 | Enforce privacy level | GET `/api/documents` as different user | Attempt to access `client-only` document as provider | Document not returned or access denied | Pass |

#### Test Case TC-010

| Field | Value |
|---|---|
| **Test Case Name** | Resource Library CRUD and Category Management |
| **Priority** | Medium |
| **Module** | `backend/src/routes/resources.ts`, `backend/src/routes/categories.ts`, `Lunara/src/components/resource/ResourceLibrary.tsx` |
| **Test Objective** | Verify resource creation, category assignment, client browsing, and versioning |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Create category | POST `/api/categories` as provider | `{ name: "Nutrition", description: "Dietary guidance for postpartum recovery" }` | 201 status, category created with ID | Pass |
| 2 | Create resource with category | POST `/api/resources` as provider | `{ title: "Postpartum Nutrition Guide", body: "...", categoryId: "<id from step 1>" }` | 201 status, resource created and associated with category | Pass |
| 3 | Retrieve resources by category | GET `/api/resources?category=<id>` as client | Category ID from step 1 | Array containing the resource from step 2 | Pass |
| 4 | Update resource | PUT `/api/resources/:id` as provider | Updated body content | Resource updated, version incremented | Pass |
| 5 | Client browses library | GET `/api/resources` as authenticated client | — | Returns array of published resources with category metadata | Pass |
| 6 | Delete resource | DELETE `/api/resources/:id` as provider | Resource ID | Resource removed, no longer returned in listing | Pass |

#### Test Case TC-011

| Field | Value |
|---|---|
| **Test Case Name** | Blog Post Publishing and Public Viewing |
| **Priority** | Medium |
| **Module** | `backend/src/routes/blog.ts`, `Lunara/src/components/blog/BlogEditor.tsx`, `Lunara/src/pages/BlogPage.tsx` |
| **Test Objective** | Verify the blog authoring workflow from draft creation through publication to public access |

| Step | Test Name | Test Steps | Test Data | Expected Results | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Create draft blog post | POST `/api/blog` as provider | `{ title: "Recovery Tips for New Moms", content: "<rich text>", status: "draft" }` | 201 status, blog post created with `status: "draft"` | Pass |
| 2 | Verify draft not public | GET `/api/blog` as unauthenticated user | — | Draft post not included in public listing | Pass |
| 3 | Publish blog post | PATCH `/api/blog/:id` as provider | `{ status: "published" }` | Status updated to `published`, post now publicly accessible | Pass |
| 4 | View published post | GET `/api/blog/:slug` as unauthenticated user | Blog post slug | Returns full post content with title, body, author, and date | Pass |
| 5 | Edit published post | PUT `/api/blog/:id` as provider | Updated content | Content updated, version history preserved | Pass |

\newpage

## REQUIREMENTS TESTING — Mapping of Requirements to Test Scenarios

| Functional Requirement | Test Scenario(s) | Validation Method |
|---|---|---|
| FR1: Public Website | TC-009 step 5 (privacy enforcement), system test landing page scenario | Manual system test + integration |
| FR2: Secure Authentication | TC-001 (Registration), TC-002 (Token Lifecycle) | Backend integration + unit tests |
| FR3: User Dashboards | TC-008 (Role Guard), system test dashboard scenarios | Frontend integration + manual system test |
| FR4: Dynamic Intake | TC-007 (Intake Wizard) | Backend integration test |
| FR5: Real-time Messaging | TC-006 (Socket.IO Delivery) | Backend Socket.IO + integration tests |
| FR6: Appointments | TC-004 (Appointment CRUD) | Backend integration test |
| FR7: Resource Library | TC-010 (Resource CRUD + Categories) | Backend integration test |
| FR8: Daily Check-ins | TC-003 (Check-in + Trends) | Backend integration + service unit tests |
| FR9: Client Management | TC-009 step 3 (provider review), system test provider scenario | Backend integration + manual system test |
| FR10: Care Plans | TC-005 (Care Plan + Milestones) | Backend integration test |
| FR11: Blog Publishing | TC-011 (Blog Draft/Publish/View) | Backend integration test |
| NFR1: Security | TC-002 (JWT), TC-008 (Role Guard), TC-009 step 5 (Privacy) | Backend + frontend tests |
| NFR4: Real-time Communication | TC-006 (Socket.IO) | Backend Socket.IO tests |

\newpage

## SYSTEM TESTING

System testing verifies that all components of the functional business requirements, business processes, data flows, and other system criteria are met. The developer tests specific end-to-end relevant processes until the complete application environment mimics the intended use upon release.

### Part 1: System Test Plan Overview

**Date:** March 2026 (final system test pass)  
**System Test Objectives and Goals:** Confirm that the fully integrated LUNARA platform—frontend, backend, database, and real-time communication layer—operates as a cohesive system that satisfies the functional requirements (FR1–FR11) and non-functional requirements (NFR1–NFR10) defined in the Project Requirements document. The goal is to validate complete user journeys for both the provider and client roles, ensuring that data flows correctly across service boundaries, role enforcement is consistent at every layer, and the user experience matches the designed interaction patterns.  
**System Test Duration:** Conducted iteratively over the final two sprint cycles, with a concentrated final pass during the release-readiness phase.

### Part 2: System Test Scope and Resources

**Features Tested:**
The system test scope encompassed all implemented functional requirements. This included the public landing page with inquiry form submission (FR1), the complete authentication lifecycle from registration through email verification, login, token refresh, password reset, MFA setup, and logout (FR2), both provider and client dashboards with all tab navigation and metrics display (FR3), the five-step intake wizard with auto-save and section-level patching (FR4), real-time messaging between providers and clients including delivery confirmation and rate limiting (FR5), appointment scheduling with creation, confirmation, cancellation, and reminder notification flows (FR6), the resource library with category browsing and detail viewing (FR7), daily check-in submission with mood tracking, symptom recording, trend computation, and provider-review alert generation (FR8), provider client management with assign/unassign and client creation (FR9), care plan creation with milestone tracking and auto-progress calculation (FR10), and blog publishing with draft/publish workflow and public viewing (FR11).

**Features Not Tested:**
Deferred features FR12 (Digital Journaling), FR13 (Daily Insights), FR14 (Sleep & Feeding Trackers), and FR15 (AI Note Summarization) were excluded from system testing as they were not implemented in the current release scope.

**System Test Resources:**
Testing was executed using the local development environment running the full stack (React dev server, Express API server, and MongoDB via Docker or MongoDB Memory Server). The test team consisted of the project developer verifying both roles (provider and client) through manual end-to-end walkthroughs supplemented by the 375-test automated suite for regression confidence.

### Part 3: System Test Strategy

**System Test Procedures:**
Each system test followed a role-based scenario script. The provider scenario began at login, proceeded through client creation, appointment scheduling via the calendar, opening the message center and exchanging messages with the test client, navigating to the document review queue and providing feedback on a submitted document, reviewing check-in alerts on the overview panel, building a care plan with milestones for the client, authoring a resource and a blog post, and confirming that all actions persisted correctly across page refreshes and role re-authentication. The client scenario began at registration, proceeded through the five-step intake wizard, submitted a daily check-in with mood and symptoms, uploaded a document with a privacy level set to client-and-provider, browsed the resource library and opened a detail modal, viewed the care plan and its milestone progress, sent a message to the assigned provider and confirmed real-time delivery, and booked an appointment through the scheduling modal.

**System Test Environment:**
The system test environment consisted of the Vite-served React frontend at `localhost:5173`, the Express backend API at `localhost:5000`, a local MongoDB instance (either Docker-based or MongoDB Memory Server for isolation), and Socket.IO WebSocket connections authenticated with the same JWT tokens used by the REST API. This environment mirrors the staging configuration documented in the development guide.

**System Test Tools Required:**
Manual browser-based testing was performed in Chrome and Firefox. Automated regression was executed via the Jest test runner with Supertest (backend) and React Testing Library (frontend). API endpoint verification used the Swagger UI at `/api-docs`. Database state was inspected through MongoDB Compass.

**System Test Criteria:**
A system test scenario was considered passing when all steps in the role-based script completed without errors, data created in one step was correctly visible in subsequent steps, role enforcement prevented cross-role access at every boundary, real-time messaging delivered within acceptable latency, and no console errors or unhandled exceptions appeared in the browser or server logs.

### Entry Criteria for System Testing (Satisfied)

Unit testing was complete with 375 automated tests passing. All modules were fully integrated across the nineteen backend route modules and fifty-plus frontend components. Software development was finished per the specification document for all in-scope requirements (FR1–FR11). The testing environment was available and configured to mirror the staging setup.

\newpage

## QUALITY METRICS & CONTINUOUS IMPROVEMENT

### Test Coverage Analysis

$$
\text{Code Coverage} = \frac{\text{Lines Exercised by Tests}}{\text{Total Executable Lines}} \times 100\% = 81.9\%
$$

| Metric | Value |
|---|---|
| Total automated tests | 375 |
| Frontend tests | 222 |
| Backend tests | 153 |
| Overall code coverage | 81.9% |
| New code coverage | 73.2% |
| SonarQube Security rating | A |
| SonarQube Reliability rating | A |
| SonarQube Maintainability rating | A |
| Critical vulnerabilities | 0 |
| Blocker bugs | 0 |

### Test Organization

**Backend tests** (`backend/tests/`) are organized into:
- `integration/` — auth, appointments, messages, check-ins, care plans, intake, resources, scheduling
- `services/` — appointmentReminderService, appointmentNotificationService, checkinTrendService, cacheService, messageRateLimiter, socketConnectionManager
- `middleware/` — auth middleware validation
- `utils/` — tokenUtils, queryOptimization

**Frontend tests** (`Lunara/src/tests/`) are organized into:
- `services/` — appointmentService, blogService, documentService, messageService, recommendationService, resourceService
- `api/` — apiClient
- `components/` — Card, Spinner, ProtectedRoute, ConstructionAlert
- `integration/` — dashboard workflows, dual-role workflows
- `auth/` — authentication flow, protected routes

### Test Summary Report

| Test Category | Tests | Pass | Fail | Pass Rate |
|---|---|---|---|---|
| Backend Integration | 78 | 78 | 0 | 100% |
| Backend Service Unit | 42 | 42 | 0 | 100% |
| Backend Middleware/Util | 33 | 33 | 0 | 100% |
| Frontend Service | 68 | 68 | 0 | 100% |
| Frontend Component | 48 | 48 | 0 | 100% |
| Frontend Integration | 62 | 62 | 0 | 100% |
| Frontend Auth Flow | 44 | 44 | 0 | 100% |
| **Total** | **375** | **375** | **0** | **100%** |

\newpage

## Testing Special Note

The testing journey progressed from targeted correctness checks on individual functions, through contract verification on route boundaries, to multi-step workflow confidence across role-specific user journeys. This progression aligns with the handbook model: verify individual modules first, verify route contracts and authorization boundaries next, verify end-to-end user workflows, and use findings to harden implementation quality prior to release and maintenance. Defects discovered during any stage were returned to the coding phase for correction and re-validated before the test was marked as passing.

---

## APPLICATION DEMONSTRATION SUPPORT

- `[SCREENSHOT_M5_01: Backend integration test run output showing 153 passing suites]`
- `[SCREENSHOT_M5_02: Frontend test run summary with 222 passing tests]`
- `[SCREENSHOT_M5_03: Requirement-to-test traceability matrix]`
- `[SCREENSHOT_M5_04: SonarQube quality dashboard showing A/A/A ratings and 81.9% coverage]`
- `[SCREENSHOT_M5_05: Jest coverage report showing per-file line/branch/function coverage]`
