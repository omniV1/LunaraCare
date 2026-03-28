# LUNARA Documentation

Project documentation for the LUNARA Postpartum Support Platform.

## Quick Links

| Document | Description |
|----------|-------------|
| [Development Guide](./DEVELOPMENT_GUIDE.md) | Setup, architecture, API reference, and troubleshooting |
| [Sprint Plan](./Planning/SPRINT_PLAN.md) | 10-week roadmap, task breakdown, and quality metrics |
| [Project Requirements (PDF)](./Planning/LUNARA_ProjectRequirements.pdf) | Original requirements specification |
| [Development Phase Report (PDF)](./Planning/LUNARA_Development_Phase_Report.pdf) | Sprint 1 completion report |
| [Render Deployment Guide](./RENDER_DEPLOY.md) | Production deployment troubleshooting |
| [SCA Guide](./SCA_GUIDE.md) | Software Composition Analysis (dependency vulnerability scanning) |

## Project Overview

LUNARA is a postpartum support platform connecting new mothers with certified doulas and support specialists. It provides real-time messaging, appointment scheduling, mood tracking, document management, a blog, an educational resource library, and care plan tools.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, MongoDB |
| Auth | JWT with Passport.js, Google OAuth, TOTP-based MFA |
| Real-time | Socket.IO |
| File Storage | MongoDB GridFS |
| Push Notifications | Web Push API (VAPID) |
| CI/CD | GitHub Actions, Docker, SonarQube |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas |

### Team

- **Owen Lindsey** - Backend Lead, DevOps, and Project Manager
- **Carter Wright** - Frontend Lead and UI/UX Designer

### Current Status

Backend and frontend are feature-complete for all core requirements. Four stretch features (journaling, AI insights, advanced trackers, AI summarization) are deferred to post-launch.

Quality metrics (as of February 2026):
- 375 tests (222 frontend, 153 backend)
- 81.9% code coverage
- SonarQube A ratings for security, reliability, and maintainability

## Directory Structure

```
Docs/
├── README.md                          # This file
├── DEVELOPMENT_GUIDE.md               # Setup, architecture, and API reference
├── GCU_CAPSTONE_MAINTENANCE_PAPER.md  # Capstone paper (maintenance stage)
├── RENDER_DEPLOY.md                   # Production deployment troubleshooting
├── SCA_GUIDE.md                       # Dependency vulnerability scanning guide
├── CI-CD-Overview.html                # CI/CD pipeline visual documentation
├── Capstone-Papers/                   # Academic capstone submission package
│   ├── 00_INDEX.md                    # Master index for all papers
│   ├── 01-11 markdown papers          # Purpose, tech reqs, timeline, milestones, etc.
│   ├── APA_TITLE_PAGE.md              # Title page for submission
│   ├── Photos/                        # 69 UI screenshots (client, provider, public, tests)
│   ├── *.pdf                          # Compiled milestone papers
│   └── *.tex                          # LaTeX source for PDF generation
├── Planning/
│   ├── SPRINT_PLAN.md                 # 10-week roadmap with task breakdown
│   ├── LUNARA_ProjectRequirements.pdf # Original project requirements
│   └── LUNARA_Development_Phase_Report.pdf # Sprint 1 report
├── Templates/                         # LaTeX/Pandoc templates for PDF generation
│   ├── eisvogel.latex                 # Main document template
│   ├── common.latex                   # Shared macros
│   ├── font-settings.latex            # Font configuration
│   └── (7 additional template files)
└── img/
    ├── Diagrams/                      # 7 architecture and flow diagrams (PNG + SVG)
    │   ├── SystemArchitecture
    │   ├── ERDUML
    │   ├── SequenceDiagram
    │   ├── ActivityDiagram
    │   ├── SystemLogicalModel
    │   ├── TDSystemFlowChart
    │   └── Topology
    ├── Wireframes/                    # 10 UI mockups (PNG)
    │   ├── LandingPage, ClientDashboard, ClientLogin
    │   ├── ProviderLogin, Services, Contact
    │   ├── AboutProviders, FAQ, blogExpanded
    │   └── Philosophy
    └── Stats/
        └── Monitor.png
```

## Capstone Papers

The `Capstone-Papers/` directory contains the full academic submission for GCU's CST-451/452 capstone course. The 12-paper set covers:

| Paper | Topic |
|-------|-------|
| 01 | Purpose of the Capstone Project |
| 02 | Technology Requirements |
| 03 | Project Timeline |
| 04 | Milestone 4: Development Phase (Coding) |
| 05 | Milestone 5: Development Phase (Testing) |
| 06 | Milestone 6: Final Completion and Release |
| 07 | Academic Integrity |
| 08 | Plagiarism Statement |
| 09 | Sources of Information and References |
| 10 | Intellectual Property |
| 11 | References |
| APA | Title Page |

Screenshots supporting these papers are organized under `Photos/` by role: `client/` (34 images), `provider/` (25 images), `public/` (4 images), and `tests/` (6 images).

## Resources

- **Live Application**: https://www.lunaracare.org
- **API Docs (local)**: http://localhost:10000/api-docs
- **Repository**: https://github.com/omniV1/AQC
