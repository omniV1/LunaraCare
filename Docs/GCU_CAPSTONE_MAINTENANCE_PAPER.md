# LUNARA Capstone Project Paper (Maintenance Stage)

> [!note]
> This single-file version has been superseded by the split paper set at `Docs/Capstone-Papers/00_INDEX.md`, where each handbook header is now a separate paper and Milestone 4 / Milestone 5 are separated.

**Institution Context:** Grand Canyon University (GCU)  
**Program Context:** CST-451 / CST-452 Senior Capstone  
**Project:** LUNARA Postpartum Support Platform  
**Status Date:** March 10, 2026  
**Copyright Notice Reference:** \(\copyright\) 2025 Grand Canyon University. All Rights Reserved.

---

## Abstract

LUNARA is a full-stack postpartum care platform that connects clients (mothers and families) with providers (doulas/support specialists) through secure authentication, role-based dashboards, messaging, appointments, check-ins, care plans, document workflows, resource delivery, and blog content management.  
The project has completed primary development and release objectives and is now in the **maintenance phase**, with current effort focused on reliability, security hardening, operational stability, and iterative quality improvements.

This paper is structured to align with the **GCU Capstone Project Handbook** sections for purpose, technology requirements, timeline, development/testing milestones, final release completion, academic integrity, plagiarism, source use, intellectual property, and references.

---

## Table of Contents

1. [Purpose of the Capstone Project](#purpose-of-the-capstone-project)  
2. [Technology Requirements](#technology-requirements)  
3. [Project Timeline](#project-timeline)  
4. [Milestones 4 and 5: Development Phase (Coding and Testing)](#milestones-4-and-5-development-phase-coding-and-testing)  
5. [Milestone 6: Final Project Completion and Presentation (Release Phase)](#milestone-6-final-project-completion-and-presentation-release-phase)  
6. [Maintenance Stage Plan](#maintenance-stage-plan)  
7. [Academic Integrity](#academic-integrity)  
8. [Plagiarism](#plagiarism)  
9. [Sources of Information and Use of Reference Sources](#sources-of-information-and-use-of-reference-sources)  
10. [Intellectual Property (IP)](#intellectual-property-ip)  
11. [References](#references)

---

## Purpose of the Capstone Project

The purpose of this capstone is to demonstrate practical, professional software engineering ability through a deployable artifact that communicates value to technical and nontechnical audiences.

For LUNARA, that purpose is fulfilled through:

- A production-oriented web platform with real user roles and workflows.
- A complete software lifecycle execution: requirements, architecture, implementation, testing, release, and maintenance.
- A portfolio-quality artifact suitable for employer demonstration, code review, and technical interviews.
- Documentation and traceability connecting requirements to implementation and verification.

In measurable terms, capstone value can be represented as:

$$
V_{capstone} = f(\text{technical depth}, \text{usability}, \text{quality}, \text{maintainability}, \text{professional communication})
$$

LUNARA addresses each factor with TypeScript-first implementation, domain-specific workflow design, testing assets, and documentation for handoff/continuity.

---

## Technology Requirements

The implemented stack (from code and project docs) is:

### 1) Frontend

- React 18 + TypeScript
- Vite build tool
- Tailwind CSS styling
- React Router v6
- Axios API client with auth token handling
- React Hook Form + Zod validation
- Socket.IO client for real-time features
- Jest + Testing Library for frontend tests

### 2) Backend

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT auth with Passport strategies
- Socket.IO real-time messaging
- Swagger/OpenAPI documentation
- Helmet, CORS, rate limiting, input validation
- Nodemailer-based email flows
- GridFS file handling path and document workflows
- Jest + Supertest for backend tests

### 3) Tooling and Delivery

- Git/GitHub repository workflow
- Docker support for environment consistency
- SonarQube quality workflow integration
- Environment-based configuration for local and production targets

---

## Project Timeline

### Capstone Window

- Primary capstone period: 2025 cycle (CST-451/CST-452 sequence)
- Extended technical hardening and completion activities into early 2026
- Current lifecycle position: **Maintenance Stage**

### Lifecycle Progress Model

$$
\text{Lifecycle} = \{\text{Requirements} \rightarrow \text{Design} \rightarrow \text{Development} \rightarrow \text{Testing} \rightarrow \text{Release} \rightarrow \text{Maintenance}\}
$$

LUNARA has traversed all core stages and now emphasizes post-release operations.

---

## Milestones 4 and 5: Development Phase (Coding and Testing)

## Coding Objective

Milestones 4 and 5 focused on transforming design artifacts into integrated, testable code modules and delivering working user stories in iterative cycles.

### Implemented Application Domains

- Authentication and role authorization (client/provider/admin flows)
- Client and provider dashboard systems
- Intake and onboarding workflows
- Appointment scheduling and upcoming views
- Real-time and notification messaging
- Document upload, review, and management paths
- Resource library and content browsing
- Blog authoring and post management
- Check-ins and provider review queues
- Care plan management workflows

### Representative Module Delivery Map

| Functional Area | Key Frontend Module(s) | Key Backend Route(s) |
|---|---|---|
| Authentication | `LoginPage`, `ProtectedRoute`, auth context | `/api/auth/*`, `/api/auth/mfa/*` |
| Client Dashboard | `ClientDashboard`, `ClientDashboardLayout` | `/api/client/*`, `/api/users/*` |
| Provider Dashboard | `ProviderDashboard`, `ProviderDashboardLayout` | `/api/providers/*`, `/api/admin/*` |
| Messaging | `MessageCenter`, `ClientMessageProvider`, `MessagesList` | `/api/messages/*` + Socket.IO events |
| Appointments | `ClientAppointments`, `ProviderCalendar` | `/api/appointments/*` |
| Documents | `DocumentUpload`, `DocumentsList`, `ProviderDocumentsList` | `/api/documents/*`, `/api/files/*` |
| Resources | `ResourceLibrary`, `ResourceViewModal`, `ResourceEditor` | `/api/resources/*`, `/api/categories/*` |
| Intake | `ClientIntakeWizard` | `/api/intake/*` |
| Care Plans | `CarePlanManager` | `/api/care-plans/*` |
| Check-ins | `ClientCheckIns`, `ProviderClientCheckIns` | `/api/checkins/*` |

### Implementation Plan (Retrospective View)

The project followed an iterative path equivalent to Agile sprint execution:

1. Break features into scoped module increments.
2. Build backend routes/services/models.
3. Integrate frontend service + UI layer.
4. Perform module testing and integration testing.
5. Iterate based on test outcomes and usability review.

A simplified velocity expression:

$$
\text{Iteration Completion Rate} = \frac{\#\text{Completed Stories}}{\#\text{Planned Stories}} \times 100\%
$$

---

## Testing Objective

Testing validated that integrated modules satisfy functional expectations, protect user/security boundaries, and preserve reliability under practical use.

### Testing Coverage Approach

- **Component/Unit Testing:** service utilities, middleware, model logic, UI components.
- **Requirements/Integration Testing:** route behavior, role access, workflow continuity.
- **System Testing:** end-to-end dashboard, scheduling, messaging, document, and content paths.
- **Acceptance Readiness:** workflow demonstrations and role-based scenario validation.

### Existing Test Asset Footprint

- Backend test suite includes unit, service, middleware, and integration tests.
- Frontend test suite includes service, API client, component, and integration tests.
- Prior sprint reporting documents indicate broad automated coverage and passing suites at reporting time.

### Traceability Principle

For each requirement \(R_i\), at least one implementation artifact and one validation artifact are identified:

$$
R_i \Rightarrow \{M_i, T_i\}
$$

where:

- \(M_i\): module/function(s) implementing requirement \(R_i\)
- \(T_i\): test case(s) validating requirement \(R_i\)

---

## Milestone 6: Final Project Completion and Presentation (Release Phase)

## Objective

Complete release-ready delivery package and present the final integrated system.

## Delivered/Prepared Artifacts

- Source code repository with frontend and backend implementations
- README and technical documentation in `Docs/`
- Requirements/design/development supporting documentation (project planning set)
- Demonstrable role-based functional application
- Presentation/screencast-ready demonstration structure

## Final Demonstration Structure (Obsidian-friendly)

Use these placeholders and replace with your own captures:

- `[SCREENSHOT_01: Landing page and authentication flow]`
- `[SCREENSHOT_02: Provider dashboard overview with metrics]`
- `[SCREENSHOT_03: Client dashboard with resources/documents]`
- `[SCREENSHOT_04: Real-time messaging interface]`
- `[SCREENSHOT_05: Appointment calendar and scheduling]`
- `[SCREENSHOT_06: Check-in and provider review workflow]`
- `[SCREENSHOT_07: Document submission/review workflow]`
- `[SCREENSHOT_08: Resource and blog content management]`

Optional Obsidian image syntax later:

```md
![[SCREENSHOT_01.png]]
```

---

## Maintenance Stage Plan

Since development is complete, maintenance is now the primary engineering mode.

### Maintenance Objective

Preserve and improve system quality without destabilizing delivered core functionality.

### Maintenance Categories

1. **Corrective Maintenance**  
   Resolve defects identified post-release.

2. **Adaptive Maintenance**  
   Update for environment and dependency changes (runtime, browser, packages, deployment infra).

3. **Perfective Maintenance**  
   Improve UX, performance, and quality based on user/provider feedback.

4. **Preventive Maintenance**  
   Refactor and harden code to reduce future failure risk.

### Maintenance KPI Model

$$
\text{Operational Health Index} =
w_1(1-\text{Defect Escape Rate}) +
w_2(\text{Uptime}) +
w_3(1-\text{Security Finding Density}) +
w_4(\text{Automated Test Pass Rate})
$$

where \(w_1+w_2+w_3+w_4=1\).

### Recommended Ongoing Cadence

- Weekly: dependency/security scan, triage, minor patch window
- Bi-weekly: regression run + quality checks + docs update review
- Monthly: performance and reliability review, tech debt prioritization
- Per release: changelog + rollback plan + smoke testing checklist

---

## Academic Integrity

Project work follows academic integrity principles by:

- Clearly distinguishing original implementation from external references.
- Documenting source usage in references and comments where needed.
- Preserving transparent version control history.
- Avoiding misrepresentation of work ownership or contribution.

---

## Plagiarism

Where external code patterns, libraries, or examples were used:

- Usage remained limited to acceptable engineering practice.
- Attribution and licensing expectations were observed.
- Core project architecture and implementation decisions remained original to the team context.

---

## Sources of Information and Use of Reference Sources

Primary evidence sources used for this paper:

- Repository root and service-level README files
- Development planning and sprint documentation in `Docs/Planning`
- Backend route and server integration code
- Frontend routing and dashboard module code
- Test suite directory structure and scripts

Secondary sources include framework/library official documentation for implementation correctness and best practices.

---

## Intellectual Property (IP)

LUNARA implementation artifacts (code, architecture, documentation, and branded materials) constitute student-generated project output within GCU academic policy boundaries.

Key IP handling principles:

- Respect for university policy and advisor guidance.
- Respect for third-party licenses in dependencies.
- Preservation of project ownership records through source control.
- Restriction of any protected or private operational data from public artifacts.

---

## References

1. Grand Canyon University. *Capstone Project Handbook* (2025 edition context), including sections on development/testing milestones, release phase, academic integrity, plagiarism, source use, and intellectual property.
2. Grand Canyon University. (2016). *University Policy Handbook 2016-2017*. http://www.gcu.edu/academics/academic-policies.php
3. Grand Canyon University. (2015). *Academic Integrity*. http://students.gcu.edu/academics/academic-integrity.php
4. Grand Canyon University. (n.d.). *GCU Statement on the Integration of Faith and Work*. http://www.gcu.edu/Documents/IFLW.pdf
5. LUNARA repository documentation:
   - `README.md`
   - `Docs/README.md`
   - `Docs/DEVELOPMENT_GUIDE.md`
   - `Docs/Planning/SPRINT_PLAN.md`
   - `backend/README.md`
   - `Lunara/README.md`

---

## Appendix A: Optional Obsidian/LaTeX Styling Snippets

These are optional inserts if you want the paper to feel more publication-like in Obsidian:

### A.1 Equation Block Example

```md
$$
\Delta t_{response} = t_{ack} - t_{request}
$$
```

### A.2 Theorem-style Statement (Markdown + LaTeX-style notation)

```md
**Proposition.** If regression tests pass and route contracts remain unchanged, then maintenance release risk is reduced.
```

### A.3 Callout Block for Figure Placeholders

```md
> [!figure] Figure Placeholder
> Replace with: `SCREENSHOT_03`
> Caption: Client dashboard overview with active care modules.
```

