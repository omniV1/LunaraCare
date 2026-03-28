---
title: "Milestone 6: Final Completion and Release"
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
header-right: "Milestone 6 — Release"
footer-right: "\\thepage"
listings: true
table-use-row-colors: true
block-headings: true
numbersections: false
titlepage: false
---

# Milestone 6: Final Project Completion and Presentation (Release Phase)

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Objective

Milestone 6 completes the capstone lifecycle by packaging the implemented and tested system into a release-grade deliverable, validating that the application is ready for deployment and ongoing maintenance, and presenting outcomes in a professional, portfolio-ready format suitable for both academic evaluation and prospective employers. The deliverable includes the completed final project with fully commented source code, executable application, final project artifacts (Project Proposal, Requirements Document, Architecture Plan), presentation, showcase poster, functional demonstration, and a .README file with a link to the private Git repository.

\newpage

## PROJECT REVIEW

### Requirements Status Assessment

Each functional requirement from the original Project Requirements document was evaluated against the delivered implementation. For each requirement, the table below states whether it was adequately met and, if not, explains why.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR1 | Public Website & Marketing | **Met** | Landing page with hero, offerings accordion, inquiry form at `/`; public routes at `/api/public` |
| FR2 | Secure User Authentication & Registration | **Met** | JWT + Passport.js local/JWT strategies; register, login, email verify, password reset, token refresh, MFA (TOTP); 19 auth-related test cases passing |
| FR3 | User Dashboard & Navigation | **Met** | Provider dashboard with 10 tabs (overview, calendar, clients, resources, blog, documents, notifications, reports, profile, admin); Client dashboard with 10 tabs; role-based routing via `ProtectedRoute` |
| FR4 | Dynamic Intake & Onboarding Forms | **Met** | Five-step wizard (personal, birth, feeding, support, health) with Zod validation, auto-save, section-level PATCH; `ClientIntakeWizard.tsx` + `/api/intake` |
| FR5 | Real-time Secure Messaging | **Met** | Socket.IO with JWT auth, user rooms, conversation rooms, delivery confirmation, rate limiting; `MessageCenter.tsx` + `ClientMessageProvider.tsx` + `/api/messages` |
| FR6 | Appointment Scheduling & Management | **Met** | CRUD endpoints, upcoming/request/confirm/cancel flows, reminder and notification services; `ProviderCalendar.tsx` + `ClientAppointments.tsx` + `/api/appointments` |
| FR7 | Personalized Resource Library | **Met** | Resource CRUD with versioning and categories, client browsable library with detail modal, resource interactions; `/api/resources` + `/api/categories` |
| FR8 | Daily Check-ins & Mood Tracking | **Met** | Mood 1–10, 10 physical symptoms, notes, share toggle; trend computation with improving/stable/declining classification; clinical alerts (low mood, declining trend, persistent symptom); `ClientCheckIns.tsx` + `/api/checkins` + `checkinTrendService.ts` |
| FR9 | Doula Client Management Dashboard | **Met** | Client listing with assign/unassign, client creation, check-in review panel with severity alerts, quick actions, reports; provider dashboard overview panel |
| FR10 | Care Plan Template System | **Met** | Templates with sections and milestones, plan CRUD, auto-progress calculation via pre-save hook, milestone status tracking; `CarePlanManager.tsx` + `/api/care-plans` |
| FR11 | Blog Publishing Platform | **Met** | Rich text editor, draft/publish workflow, versioning, public blog list and detail pages; `BlogEditor.tsx` + `BlogManagement.tsx` + `/api/blog` |
| FR12 | Digital Journaling Platform | **Deferred** | Lower priority; deferred to post-launch roadmap per mentor/instructor approval |
| FR13 | New Mama Horoscope & Daily Insights | **Deferred** | Lower priority; deferred to post-launch roadmap per mentor/instructor approval |
| FR14 | Sleep & Feeding Trackers | **Deferred** | Lower priority; deferred to post-launch roadmap per mentor/instructor approval |
| FR15 | AI-Powered Note Summarization | **Deferred** | Future-priority feature; deferred to post-launch AI integration phase |

### Non-Functional Requirements Status

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| NFR1 | Data Security & Privacy | **Met** | bcrypt (12 rounds), JWT with refresh rotation, Helmet, CORS, rate limiting, input validation, SonarQube A security rating |
| NFR2 | Mobile Responsiveness | **Partially Met** | Tailwind CSS responsive utilities applied; enhanced mobile optimization identified as maintenance-phase improvement |
| NFR3 | System Reliability & Performance | **Met** | Compression, database indexing, connection pooling, SonarQube A reliability rating |
| NFR4 | Real-time Communication | **Met** | Socket.IO with JWT auth, fallback handling, rate limiting, delivery confirmation |
| NFR5 | Scalability & Growth | **Met** | MongoDB indexing strategy, connection pooling, stateless JWT auth, Docker support |
| NFR6 | User Experience & Accessibility | **Partially Met** | Intuitive navigation, consistent design patterns; full WCAG 2.1 AA audit identified as maintenance-phase improvement |
| NFR7 | Data Backup & Recovery | **Met** | MongoDB Atlas automated backups, documented recovery procedures |
| NFR8 | Integration Capability | **Met** | RESTful API design, email service (Nodemailer), push notification service, Swagger documentation |
| NFR9 | Content Management | **Met** | Resource and blog versioning, rich text editor, category management |
| NFR10 | Monitoring & Analytics | **Met** | Morgan logging, SonarQube analysis, provider reports dashboard |

### Planned Improvements (Maintenance Phase)

- Enhanced mobile responsiveness with dedicated mobile testing pass
- Full WCAG 2.1 AA accessibility audit and remediation
- Expanded analytics dashboards with client progress reporting
- Integration with external calendar services (Google Calendar, iCal export)
- Implementation of deferred features (FR12–FR15) per post-launch roadmap

\newpage

## INTEGRATED APPLICATION DELIVERY

The final release package represents a coherent full-stack product. The system comprises nineteen backend route modules exposing over seventy endpoints, twenty-plus Mongoose models, nine dedicated service modules, and over fifty React components organized into role-specific dashboards, domain feature modules, and shared UI primitives. All code is written in TypeScript for end-to-end type safety.

A provider logging into LUNARA is greeted by a dashboard that aggregates client metrics, surfaces appointments and check-ins needing attention (flagged with info, warning, or critical severity based on the check-in trend service's alert thresholds), and provides one-click access to every operational tool: client management, calendar scheduling, real-time messaging, document review with structured feedback, resource authoring, blog publishing, care-plan construction with milestone tracking, and practice analytics.

A client logging in enters a parallel but appropriately scoped experience: a guided five-step intake wizard that builds a comprehensive clinical profile validated by Zod schemas with auto-save, daily check-in recording with mood on a one-to-ten scale and ten physical symptom self-assessments, document uploads with privacy controls (client-only, client-and-provider, care-team) and a status workflow from draft through provider review to completion, the resource library, care-plan milestone tracking with auto-calculated progress, appointment management, and direct messaging with the assigned provider through Socket.IO real-time communication.

Both experiences are secured by JWT authentication with optional multi-factor verification via TOTP, role-enforced route guards on the frontend (`ProtectedRoute` component with `allowedRoles` prop) and middleware-gated API endpoints on the backend (`passport.authenticate('jwt', { session: false })`), and security hardening through Helmet, CORS, rate limiting, and express-validator input validation.

\newpage

## DOCUMENTATION COMPLETION

Project documentation was reviewed and updated to reflect the final state of the system:

| Document | Location | Content |
|---|---|---|
| Project README | `README.md` | High-level overview, quickstart instructions, repository links |
| Backend README | `backend/README.md` | API architecture, environment configuration, route-module inventory |
| Frontend README | `Lunara/README.md` | Component structure, build pipeline, development workflow |
| Development Guide | `Docs/DEVELOPMENT_GUIDE.md` | Local setup, coding standards, testing procedures, contributor onboarding |
| Sprint Plan | `Docs/Planning/SPRINT_PLAN.md` | Iteration-level progress, completion percentages, scope adjustments |
| SCA Guide | `Docs/SCA_GUIDE.md` | SonarQube quality workflow, metrics interpretation |
| Swagger API Docs | `/api-docs` endpoint | Interactive endpoint explorer for all 70+ routes |
| Project Requirements | `Docs/Planning/LUNARA_ProjectRequirements.pdf` | 87-page requirements and architecture document (CST-451) |
| Development Phase Report | `Docs/Planning/LUNARA_Development_Phase_Report.pdf` | 56-page coding and testing report (CST-451 Milestone 4) |
| Live Application | `https://aqc-eight.vercel.app/` | Deployed frontend on Vercel; internet-facing portfolio and demo |

The Project Proposal and Requirements Document were updated to incorporate all prior instructor and mentor feedback. The Document History sections reflect what changed between iterations. Deferred requirements (FR12–FR15) are explicitly noted with justification.

\newpage

## PROJECT DEMONSTRATION AND PRESENTATION

The screencast demonstration follows a structured six-segment format designed to communicate the project's value within the five-to-ten-minute window:

| Segment | Duration | Content |
|---|---|---|
| Problem + Vision | 45s | Postpartum care-continuity gap; LUNARA's mission to connect mothers with doulas through a digital hub |
| Architecture | 60s | React 18 + TypeScript frontend, Node.js/Express backend, MongoDB with Mongoose, Socket.IO real-time, GridFS file storage |
| Auth + Roles | 45s | Provider and client login flows, role-based dashboard routing, MFA setup |
| Provider Flow | 90s | Client creation, appointment scheduling via calendar, message exchange in MessageCenter, document review with feedback, check-in alert review, care-plan construction with milestones |
| Client Flow | 90s | Intake wizard completion (5 steps), daily check-in submission, document upload with privacy controls, resource browsing, care-plan milestone viewing, provider messaging |
| Quality + Maintenance | 60s | 375 automated tests, 81.9% coverage, SonarQube A/A/A ratings, maintenance transition |

### Christian Worldview Integration

In the midst of building a platform that supports mothers through one of the most vulnerable periods of their lives, a Christian worldview served as a stabilizing anchor. The challenges encountered during development—scope adjustments when four features had to be deferred, technical complexity in implementing real-time messaging with security and rate limiting, and timeline pressures across the CST-451/452 cycle—were met with perseverance grounded in the belief that faithfulness in work reflects faithfulness to a larger purpose. The project's mission of care and support resonates with the principle that serving others through one's professional skills is a meaningful expression of faith. As noted in the GCU Statement on the Integration of Faith and Work, the Christian worldview helps stabilize life in the midst of challenges and struggles, serving as an anchor to link us to God's faithfulness and steadfastness (Grand Canyon University, n.d.).

\newpage

## PROJECT PORTFOLIO

The internet-facing Senior Project Portfolio is deployed at **[https://aqc-eight.vercel.app/](https://aqc-eight.vercel.app/)** and serves as both the live application demonstration and the portfolio entry point. The site is hosted on Vercel's global edge network, providing reliable access for potential employers and academic reviewers. The portfolio and live application contain:

- **Project Overview:** The postpartum care-continuity problem LUNARA addresses, the platform's mission, and target users — accessible from the public landing page
- **Architecture Diagrams:** Frontend/backend/database/real-time communication stack with technology justifications
- **Live Application Demo:** Rather than static screenshots, the deployed application at `https://aqc-eight.vercel.app/` allows reviewers to interact with the actual platform, including the public landing page, authentication flows, and role-specific dashboards
- **Code Snippets:** Annotated examples of key implementations (authentication middleware, check-in trend service, Socket.IO messaging, intake wizard validation)
- **Testing & Quality:** Test suite metrics (375 tests, 81.9% coverage), SonarQube ratings, testing methodology
- **Repository Access:** The source code is hosted on GitHub at `https://github.com/omniV1/AQC` with instructions for cloning and running the application locally with Docker or manual setup
- **Background:** Approach to implementation, design decisions, challenges overcome, and maintenance roadmap

The portfolio is designed to communicate the project's scope, technical depth, and professional quality to potential employers who may evaluate it alongside the candidate's resume.

\newpage

## RELEASE READINESS

$$
\text{Release Readiness} = \bigwedge_{d \in \text{Dimensions}} \text{Status}(d) = \text{Met}
$$

| Dimension | Criteria | Status | Evidence |
|---|---|---|---|
| Feature Completeness | All in-scope FRs implemented | **Met** | FR1–FR11 implemented and demonstrated; FR12–FR15 formally deferred |
| Quality & Test Confidence | Automated testing with adequate coverage | **Met** | 375 tests, 81.9% coverage, 100% pass rate, SonarQube A/A/A |
| Documentation Completeness | Onboarding and review materials | **Met** | README set, dev guide, sprint records, Swagger, capstone paper packet |
| Operational Readiness | Deployment and security | **Met** | Docker, env-var config, Helmet, CORS, rate limiting, bcrypt, JWT |

\newpage

## FINAL PROJECT SUBMISSION

The project folder and GitHub repository (`https://github.com/omniV1/AQC`) contain:

- Updated Project Proposal and Requirements Document
- Architecture Plan (87-page PDF)
- Development Phase Report (56-page PDF)
- .README file with link to private Git repository
- Complete source code with TypeScript throughout (backend + frontend)
- 375 automated tests (backend: `backend/tests/`, frontend: `Lunara/src/tests/`)
- Swagger/OpenAPI documentation at `/api-docs`
- Capstone paper packet (this document set)
- Presentation materials and screencast
- Live deployed application at `https://aqc-eight.vercel.app/`

This submission represents the culmination of the senior capstone experience and the transition of LUNARA into a maintainable, portfolio-worthy software product.

---

## Suggested Figure Placeholders

- `[SCREENSHOT_M6_01: End-to-end provider workflow from login through client creation to care-plan update]`
- `[SCREENSHOT_M6_02: Architecture diagram showing React ↔ Express ↔ MongoDB ↔ Socket.IO stack]`
- `[SCREENSHOT_M6_03: Test suite results showing 375 passing tests and SonarQube A/A/A dashboard]`
- `[SCREENSHOT_M6_04: Portfolio website overview page with project summary and architecture]`
- `[SCREENSHOT_M6_05: GitHub repository showing commit history and branch structure]`
- `[SCREENSHOT_M6_06: Swagger API documentation showing 19 route modules and 70+ endpoints]`
