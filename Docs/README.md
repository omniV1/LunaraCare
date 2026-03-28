# LUNARA Documentation

Comprehensive documentation for the LUNARA Postpartum Support Platform.

## Quick Links

| Document | Description |
|----------|-------------|
| [Sprint Plan](./Planning/SPRINT_PLAN.md) | 10-week roadmap, tasks, and security checklist |
| [Development Guide](./DEVELOPMENT_GUIDE.md) | Setup, architecture, API reference |
| [Project Requirements (PDF)](./Planning/LUNARA_ProjectRequirements.pdf) | Original requirements document |
| [Development Report (PDF)](./Planning/LUNARA_Development_Phase_Report.pdf) | Sprint 1 completion report |

## Project Overview

**LUNARA** is a postpartum support platform connecting new mothers with certified doulas and support specialists. Built as a senior capstone project at Grand Canyon University.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, MongoDB |
| Auth | JWT with Passport.js |
| Real-time | Socket.IO |
| File Storage | MongoDB GridFS |
| CI/CD | GitHub Actions, Docker |

### Team

- **Owen Lindsey** - Backend Lead & DevOps
- **Carter Wright** - Frontend Lead & UI/UX

### Current Status

**Overall Completion: ~70-75%**

- Core infrastructure complete
- Authentication system operational
- Provider & Client dashboards functional
- Blog platform and Resource library complete
- Document management system working

## Directory Structure

```
Docs/
├── README.md                 # This file
├── DEVELOPMENT_GUIDE.md      # Setup & architecture
├── Planning/
│   ├── SPRINT_PLAN.md        # Roadmap & tasks
│   └── *.pdf                 # Formal documents
├── Templates/                # LaTeX for PDF generation
└── img/
    ├── Diagrams/             # Architecture diagrams
    └── Wireframes/           # UI mockups
```

## Resources

- **API Docs**: http://localhost:5000/api-docs (when running locally)
- **Repository**: https://github.com/omniV1/AQC
