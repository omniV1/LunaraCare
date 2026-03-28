# LUNARA Sprint 2-3 Completion Plan

**10-Week Roadmap to Platform Launch**  
**Timeline:** February 5, 2026 - April 16, 2026  
**Team:** Owen Lindsey (Backend Lead & DevOps), Carter Wright (Frontend Lead)

---

## Executive Summary

### Current Status: ~90% Complete (Backend 100%, Frontend pending)

| ID | Requirement | Status |
|----|-------------|--------|
| FR1 | Public Website & Marketing | Complete |
| FR2 | Secure Authentication | Complete |
| FR3 | User Dashboards | Complete |
| FR4 | Intake & Onboarding Forms | Backend Complete, Frontend pending |
| FR5 | Real-time Messaging | Backend Complete (Socket.io + JWT + rate limiting), Frontend pending |
| FR6 | Appointment Scheduling | Backend Complete (booking workflow + reminders), Frontend pending |
| FR7 | Resource Library | Complete |
| FR8 | Daily Check-ins & Mood Tracking | Backend Complete (trends + alerts), Frontend pending |
| FR9 | Doula Client Dashboard | Complete |
| FR10 | Care Plan Templates | Backend Complete (templates + milestones), Frontend pending |
| FR11 | Blog Platform | Complete |

### Remaining Work

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| FR4 | Intake & Onboarding Forms (Frontend) | HIGH | 1 week |
| FR5 | Real-time Messaging (Frontend) | HIGH | 1 week |
| FR6 | Appointment Scheduling (Frontend) | HIGH | 1 week |
| FR8 | Daily Check-ins (Frontend) | MEDIUM | 1 week |
| FR10 | Care Plan Templates (Frontend) | MEDIUM | 1 week |

### Quality Metrics (as of Feb 16, 2026)

| Metric | Value |
|--------|-------|
| SonarQube Quality Gate | Passed |
| Security | A (0 issues) |
| Reliability | A (0 issues) |
| Maintainability | A (0 issues) |
| SonarQube overall coverage | 81.9% |
| New Code Coverage | 73.2% |
| Jest tests (Milestone 5) | 1044 (891 frontend + 153 backend), 118 suites, all passing |
| Playwright E2E | 32 |
| Jest statement coverage | Backend 90.58%; frontend 63.35% |
| Duplications | 2.6% |

### Deferred to Post-Launch

- FR12: Digital Journaling
- FR13: Daily Insights/Horoscope
- FR14: Sleep & Feeding Trackers
- FR15: AI Note Summarization

---

## Phase 1: Design Alignment & Quick Wins
### Weeks 1-2 (Feb 5 - Feb 19)

### Week 1: Design & Planning

**Carter (Frontend)**
- [x] Export updated Figma designs
- [x] Create design component inventory





### Week 2: Real-time Messaging (FR5 Completion)

**Owen (Backend)**
- [x] Implement Socket.io server integration
- [x] Create WebSocket connection manager
- [x] Implement message delivery confirmation (Socket event acks + persistence)
- [x] Add room-based broadcasting and receiver notification channel
- [x] Add basic logging/metrics for socket connections (incl. rate limiting + JWT auth)

**Carter (Frontend)**
- [ ] Update MessagesList.tsx with real-time listeners
- [ ] Add typing indicators and online status
- [ ] Update Landing, Provider, Client dashboards to new designs
- [ ] Ensure mobile responsiveness

**Deliverables:**
- [ ] Real-time messaging working
- [ ] 3+ pages updated to new design

---

## Phase 2: Core Missing Features
### Weeks 3-4 (Feb 20 - Mar 5)

### Week 3: Intake Forms (FR4)

**Owen (Backend)**
- [x] Create IntakeForm model in MongoDB
- [x] Design schema with conditional fields
- [x] Implement endpoints:
  - `POST /api/intake`
  - `GET /api/intake/:userId`
  - `PATCH /api/intake/:userId/section/:sectionId`
- [x] Add intake completion status to User model
- [x] Implement auto-save functionality

**Carter (Frontend)**
- [ ] Create IntakeFormPage.tsx with multi-step wizard
- [ ] Implement form sections (Personal, Birth, Feeding, Support, Health)
- [ ] Add progress indicator
- [ ] Implement conditional field rendering
- [ ] Add Zod validation
- [ ] Implement auto-save with debouncing

### Week 4: Appointment Scheduling (FR6 Completion)

**Owen (Backend)**
- [x] Enhance Appointment model with availability slots
- [x] Create availability endpoints:
  - `GET /api/providers/:id/availability`
  - `POST /api/providers/:id/availability`
- [x] Implement booking workflow:
  - `POST /api/appointments/request`
  - `POST /api/appointments/:id/confirm`
  - `POST /api/appointments/:id/cancel`
- [x] Add email notification triggers
- [x] Implement reminder system

**Carter (Frontend)**
- [ ] Create AppointmentBookingPage.tsx
- [ ] Implement calendar date picker
- [ ] Create time slot selection UI
- [ ] Add appointment type selection (virtual/in-person)
- [ ] Create booking confirmation modal
- [ ] Create availability management view for providers

**Deliverables:**
- [ ] Intake form fully functional with auto-save
- [ ] Appointment booking flow complete
- [ ] Providers can set availability
- [ ] Email notifications working

---

## Phase 3: New Features
### Weeks 5-6 (Mar 6 - Mar 19)

### Week 5: Daily Check-ins (FR8)

**Owen (Backend)**
- [x] Create CheckIn model:
  ```
  {
    userId, date, moodScore (1-10),
    physicalSymptoms: [], notes,
    sharedWithProvider: Boolean
  }
  ```
- [x] Implement endpoints:
  - `POST /api/checkins`
  - `GET /api/checkins/user/:userId`
  - `GET /api/checkins/trends/:userId`
- [x] Create trend analysis service
- [x] Implement alert system for concerning patterns

**Carter (Frontend)**
- [ ] Create DailyCheckInPage.tsx
- [ ] Implement mood slider (1-10)
- [ ] Create symptom checklist (fatigue, sleep, appetite, anxiety, pain)
- [ ] Add optional notes
- [ ] Create check-in history view
- [ ] Implement trend visualization charts

### Week 6: Care Plan Templates (FR10)

**Owen (Backend)**
- [x] Create CarePlan model with sections and milestones
- [x] Create CarePlanTemplate model
- [x] Implement endpoints:
  - `GET /api/care-plans/templates`
  - `POST /api/care-plans`
  - `PUT /api/care-plans/:id`
  - `PATCH /api/care-plans/:id/milestone/:milestoneId`

**Carter (Frontend)**
- [ ] Create CarePlanEditor.tsx for providers
- [ ] Implement template selection interface
- [ ] Add milestone tracker component
- [ ] Create CarePlanView.tsx for clients
- [ ] Add progress tracking visualization

**Deliverables:**
- [ ] Daily check-in system functional
- [ ] Mood tracking with trends
- [ ] Care plan templates operational
- [ ] Milestone tracking working

---

## Phase 4: Integration & Polish
### Weeks 7-8 (Mar 20 - Apr 2)

### Week 7: Performance & Quality

**Owen (Backend)**
- [x] Database query optimization
- [x] Add in-memory caching layer for frequent data (Redis-ready)
- [ ] Run Lighthouse audits
- [x] API documentation review

**Carter (Frontend)**
- [ ] Lazy loading for heavy components
- [ ] Bundle size optimization (code splitting)
- [ ] Run Lighthouse audits
- [ ] Component documentation

### Week 8: Testing & Mobile

**Owen (Backend)**
- [x] Boost backend unit test coverage (69% → 94% statements)
- [x] Add tests for: cacheMiddleware, socketConnectionManager, queryOptimization
- [x] Add tests for: checkinTrendService, appointmentNotificationService, appointmentReminderService
- [x] Fix SonarQube maintainability issues (cognitive complexity, readonly, type assertions)
- [x] Achieve SonarQube quality gate: A/A/A (Security/Reliability/Maintainability)

**Both**
- [x] Create test scenarios:
  - New user registration
  - Client intake completion
  - Appointment booking
  - Messaging flow
  - Check-in submission
  - Care plan tracking
  - Resource browsing
- [x] Execute all scenarios (1044 Jest tests + 32 E2E passing; see `Docs/Capstone-Papers/05_milestone_5.tex`)
- [ ] Document and fix bugs

**Carter (Frontend)**
- [ ] Mobile responsiveness audit
- [ ] Fix layout issues
- [ ] Verify 44px touch targets
- [ ] Test iOS Safari and Android Chrome

**Deliverables:**
- [ ] Page load times < 3 seconds
- [ ] All E2E tests passing
- [ ] Mobile verified on real devices
- [ ] No critical bugs

---

## Phase 5: Launch Preparation
### Weeks 9-10 (Apr 3 - Apr 16)

### Week 9: Security & Production Setup

**Owen (Backend/DevOps)**
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review auth flows for security issues
- [ ] Verify API authorization on all endpoints
- [ ] Test rate limiting
- [ ] Configure production MongoDB Atlas
- [ ] Set up production environment variables
- [ ] Configure production CORS
- [ ] Set up SSL certificates
- [ ] Configure production email service
- [ ] Set up error monitoring (Sentry)

### Week 10: Final Polish & Deploy

**Carter (Frontend)**
- [ ] Final UI consistency review
- [ ] Fix remaining styling issues
- [ ] Deploy frontend to production

**Owen (Backend)**
- [ ] Final API documentation review
- [ ] Performance benchmarking
- [ ] Deploy backend to production
- [ ] Smoke test production
- [ ] Prepare rollback plan

**Both**
- [ ] Update README files
- [ ] Create user help content

**Deliverables:**
- [ ] All security vulnerabilities addressed
- [ ] Production environment configured
- [ ] Documentation complete
- [ ] Platform deployed and live

---

## Security Checklist

### Current Security (Implemented)

- [x] Password hashing with bcrypt (12 rounds)
- [x] JWT token authentication
- [x] Refresh token rotation
- [x] Password excluded from API responses
- [x] Generic error messages (no user enumeration)
- [x] Express-validator for input validation
- [x] Helmet.js security headers
- [x] CORS configuration
- [x] Rate limiting (100 req/15 min)
- [x] MongoDB Atlas with authentication

### Production Requirements

- [ ] Change all default secrets
- [ ] Generate strong JWT secrets (64+ chars): `openssl rand -base64 64`
- [ ] Enable HTTPS/TLS
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Restrict CORS to production domains
- [ ] Configure MongoDB Atlas IP allowlist
- [ ] Set `SKIP_EMAIL_VERIFICATION=false`
- [ ] Configure production email service
- [ ] Set up centralized error monitoring
- [ ] Enable MongoDB encryption at rest
- [ ] Set up database backups

### Pre-Launch Verification

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Email verification enabled
- [ ] Error monitoring active
- [ ] Database backups configured
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] JWT secrets rotated
- [ ] Dependencies updated
- [ ] Security scan completed

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page load time | < 3 seconds |
| API response time | < 1 second |
| Real-time message delivery | < 500ms |
| System uptime | > 99.5% |
| Mobile Lighthouse score | > 90 |
| Test coverage | > 85% |
| Critical security vulnerabilities | 0 |
| P0 bugs at launch | 0 |

---

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Design changes larger than expected | Medium | Time-box UI updates, prioritize critical pages |
| Team availability issues | Medium | 2-week buffer in schedule |
| Unexpected technical debt | Medium | Dedicated bug-fix time in weeks 7-8 |
| Two-person team capacity | Medium | Prioritize core features, defer nice-to-haves |

### Contingency Plans

**If behind by Week 4:**
- Reduce FR8 (mood tracking) to basic implementation
- Simplify FR10 (care plans) to single template

**If behind by Week 6:**
- Reduce polish time, focus on core functionality
- Defer non-critical UI enhancements to post-launch

---

## Checkpoint Schedule

| Date | Checkpoint | Expected Status |
|------|------------|-----------------|
| Feb 12 | Week 1 Review | FAQ, Philosophy pages complete |
| Feb 19 | Phase 1 Complete | Real-time messaging, UI refresh |
| Mar 5 | Phase 2 Complete | Intake forms, Appointment booking |
| Mar 19 | Phase 3 Complete | Mood tracking, Care plans |
| Apr 2 | Phase 4 Complete | Integration, Testing |
| Apr 16 | **LAUNCH** | Production deployment |

---

*Last updated: February 16, 2026*
