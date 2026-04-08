<h1 align="center">Lunara Documentation</h1>

<p align="center">
  <img src="img/Diagrams/SystemArchitecture.png" alt="Architecture" width="72%"/>
</p>

<p align="center">
  <em>Architecture references, academic capstone papers, diagrams, wireframes, and project planning for the Lunara platform.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/diagrams-7-blue?style=flat-square" alt="Diagrams"/>
  <img src="https://img.shields.io/badge/capstone_papers-12-purple?style=flat-square" alt="Papers"/>
  <img src="https://img.shields.io/badge/screenshots-69-teal?style=flat-square" alt="Screenshots"/>
</p>

<p align="center">
  <a href="./DEVELOPMENT_GUIDE.md">Dev Guide</a> &nbsp;&bull;&nbsp;
  <a href="./Planning/SPRINT_PLAN.md">Sprint Plan</a> &nbsp;&bull;&nbsp;
  <a href="./RENDER_DEPLOY.md">Deploy Guide</a> &nbsp;&bull;&nbsp;
  <a href="https://lunara.onrender.com/api-docs">Live API Docs</a>
</p>

---

## What's In Here

This directory holds everything that isn't source code: architecture diagrams, formal capstone submissions, wireframes, deployment guides, and the sprint plan driving development.

### Technical References

| Document | Purpose |
|---|---|
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Full setup walkthrough, architecture overview, API route reference table covering all 20 route modules, database schema definitions, document upload system details, testing instructions, and troubleshooting |
| [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) | Production deployment troubleshooting for the Render-hosted backend: JWT debugging, MongoDB connectivity, CORS verification, and a quick test checklist |
| [SCA_GUIDE.md](./SCA_GUIDE.md) | Software Composition Analysis guide covering `npm audit` and SonarQube for dependency vulnerability scanning |
| [CI-CD-Overview.html](./CI-CD-Overview.html) | Visual documentation of the GitHub Actions deployment pipeline |

### Planning

| Document | Purpose |
|---|---|
| [SPRINT_PLAN.md](./Planning/SPRINT_PLAN.md) | 10-week development roadmap (Feb 5 through Apr 16, 2026) with task breakdown, quality metrics, risk management, and checkpoint schedule |
| Project Requirements (submission PDF) | Original formal requirements specification carried into the final project package |
| Development Phase Report (submission PDF) | Prior milestone report included with the final submission package |
| [Portfolio Site README](../LunaraPortfolio/README.md) | Standalone employer-facing project website included alongside the core application |

---

## Architecture Diagrams

The `img/Diagrams/` directory contains seven diagrams in both PNG and SVG formats. These visualize the system from different angles:

<table>
<tr>
<td align="center" width="33%">
<a href="./img/Diagrams/SystemArchitecture.png"><strong>System Architecture</strong></a><br/>
<sub>High-level service topology: React frontend, Express API, MongoDB, Socket.IO, and external services</sub>
</td>
<td align="center" width="33%">
<a href="./img/Diagrams/ERDUML.png"><strong>Entity-Relationship Diagram</strong></a><br/>
<sub>All 19 MongoDB collections and their relationships</sub>
</td>
<td align="center" width="33%">
<a href="./img/Diagrams/Topology.png"><strong>Deployment Topology</strong></a><br/>
<sub>Network layout: Vercel, Render, MongoDB Atlas, and CI pipeline</sub>
</td>
</tr>
<tr>
<td align="center" width="33%">
<a href="./img/Diagrams/SequenceDiagram.png"><strong>Sequence Diagram</strong></a><br/>
<sub>Request flows for key user interactions</sub>
</td>
<td align="center" width="33%">
<a href="./img/Diagrams/ActivityDiagram.png"><strong>Activity Diagram</strong></a><br/>
<sub>User activity workflows across the platform</sub>
</td>
<td align="center" width="33%">
<a href="./img/Diagrams/TDSystemFlowChart.png"><strong>System Flow Chart</strong></a><br/>
<sub>Top-down data and control flow</sub>
</td>
</tr>
</table>

The [Logical Model](./img/Diagrams/SystemLogicalModel.png) provides an additional data-centric view.

---

## Wireframes

Early-stage UI mockups live in `img/Wireframes/`. These informed the final design for the landing page, login flows, client and provider dashboards, services page, FAQ, blog, and provider directory.

---

## Capstone Papers

The `Capstone-Papers/` directory contains the complete academic submission for GCU's CST-451/452 capstone course. Twelve papers plus an APA title page, organized by a master index at [00_INDEX.md](./Capstone-Papers/00_INDEX.md).

| # | Paper | Covers |
|---|---|---|
| 01 | Purpose of Capstone Project | Mission statement, competency demonstration, project vision |
| 02 | Technology Requirements | Full stack selection rationale with requirement-to-technology mapping |
| 03 | Project Timeline | Phase breakdown and lifecycle progress model |
| 04 | Milestone 4: Coding | Implementation plan, 16-feature task breakdown, traceability matrix, test cases |
| 05 | Milestone 5: Testing | Test suite structure, 1044 Jest tests + 32 E2E, coverage analysis, SonarQube quality metrics |
| 06 | Milestone 6: Release | Production deployment, security hardening, maintenance handoff |
| 07-11 | Academic Sections | Integrity, plagiarism, sources, intellectual property, references |

### Supporting Materials

The papers reference **69 screenshots** organized by role:

| Directory | Count | Shows |
|---|---|---|
| `Photos/client/` | 34 | Dashboard, appointments, messaging, mood tracking, documents, resources, profile |
| `Photos/provider/` | 25 | Dashboard, scheduling, client management, blog authoring, document review, resources |
| `Photos/public/` | 4 | Home page, login, public blog |
| `Photos/tests/` | 6 | Jest and CLI test output for both frontend and backend |

Compiled PDFs for Milestone 4 and Milestone 5 are included alongside their LaTeX source files.

### Presentation Assets

Milestone 6 presentation materials currently included in the repository:

| File | Purpose |
|---|---|
| [LUNARA_Showcase_Poster.pptx](./Presentations/LUNARA_Showcase_Poster.pptx) | Poster source deck |
| [LUNARA_Showcase_Poster.pdf](./Presentations/LUNARA_Showcase_Poster.pdf) | Poster export |
| [LUNARA_Showcase_Poster_REVISED.pdf](./Presentations/LUNARA_Showcase_Poster_REVISED.pdf) | Revised poster export for final submission |

---

## LaTeX Templates

The `Templates/` directory contains 10 Pandoc/LaTeX template files based on the Eisvogel theme, used to generate the milestone PDFs from Markdown source. Includes font configuration, title page layout, beamer presentation support, and hyperlink setup.

---

## Project Status

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Complete-brightgreen?style=for-the-badge" alt="Backend Complete"/>
  <img src="https://img.shields.io/badge/Frontend-Complete-brightgreen?style=for-the-badge" alt="Frontend Complete"/>
  <img src="https://img.shields.io/badge/Jest-1044_passing-brightgreen?style=for-the-badge" alt="Jest tests"/>
  <img src="https://img.shields.io/badge/Playwright_E2E-32-blue?style=for-the-badge" alt="E2E"/>
  <img src="https://img.shields.io/badge/backend_statements-90.58%25-brightgreen?style=for-the-badge" alt="Backend Jest coverage"/>
  <img src="https://img.shields.io/badge/frontend_statements-63.35%25-brightgreen?style=for-the-badge" alt="Frontend Jest coverage"/>
</p>

All core functional requirements are implemented and deployed. Test and coverage figures follow [Milestone 5](./Capstone-Papers/05_milestone_5.tex) (1044 Jest tests; backend 90.58% and frontend 63.35% statement coverage). Four stretch features (journaling, AI insights, advanced trackers, AI summarization) are deferred to post-launch.

### Team

| | |
|---|---|
| **Owen Lindsey** | Full Stack Developer |
| **Carter Wright** | Full Stack Developer |
| **Andrew Mack** | Full Stack Developer |

Senior capstone project at Grand Canyon University, advised by Professor Amr Elchouemi.

---

## Quick Links

| Resource | URL |
|---|---|
| Standalone Portfolio Site Source | [LunaraPortfolio](../LunaraPortfolio) |
| Live Application | [lunaracare.org](https://www.lunaracare.org) |
| API Documentation (local) | http://localhost:10000/api-docs |
| API Documentation (production) | [lunara.onrender.com/api-docs](https://lunara.onrender.com/api-docs) |
| Repository | [github.com/omniV1/lunaraCare](https://github.com/omniV1/lunaraCare) |
