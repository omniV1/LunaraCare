---
title: "Project Timeline"
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
header-right: "Project Timeline"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Project Timeline

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Timeline Overview

The LUNARA project progressed through the full capstone lifecycle—from requirements gathering and architectural design through iterative implementation, formal testing, release packaging, and transition into maintenance. The primary development window spanned the 2025 CST-451/CST-452 cycle, with extended hardening and quality-completion work carrying into early 2026. As of this writing, the project has entered the maintenance stage.

$$
\text{Requirements} \rightarrow \text{Design} \rightarrow \text{Implementation} \rightarrow \text{Testing} \rightarrow \text{Release} \rightarrow \text{Maintenance}
$$

## Phase A: Foundation and Direction

The project began with a problem statement rooted in a real clinical gap: new mothers navigating the fourth trimester frequently lack a centralized digital tool for coordinating care with their doula or postpartum support specialist. Early work focused on defining the project's scope around postpartum care-continuity workflows, establishing the architectural direction of a React frontend communicating with a Node.js/Express backend backed by MongoDB, and producing the initial documentation and development standards that would guide the entire build. The Project Proposal and Requirements Specification were completed during this phase, setting the contractual baseline for what the system would deliver.

\newpage

## Phase B: Core Feature Buildout

With the architecture in place, development moved into the intensive feature-construction period. Authentication and role enforcement were implemented first, establishing JWT-based identity flows, Passport.js strategies, multi-factor authentication, and route-level middleware that gates every API endpoint by user role. Once the security foundation was solid, the team built out the client and provider dashboard ecosystems—tabbed interfaces that serve as the operational centers of the application. The provider dashboard surfaces metrics like total active clients, upcoming appointments, and check-ins requiring attention, while offering quick-action paths to create clients, schedule appointments, open the message center, and generate reports. The client dashboard provides access to a multi-step intake wizard, daily mood and symptom check-ins, document uploads, the resource library, care-plan tracking, appointment management, and direct messaging with the assigned provider.

During this same period the major feature domains were implemented and integrated end to end. The appointment system supports creation, confirmation, cancellation, and reminder notifications. The messaging module uses Socket.IO for real-time bidirectional communication with JWT-authenticated WebSocket connections, user-specific rooms, and delivery-confirmation events. The resource library enables providers to author and categorize educational content that clients can browse and interact with. Blog management gives providers a rich-text authoring and publishing workflow. The intake wizard walks new clients through five validated sections—personal information, birth details, feeding preferences, support-network context, and health history—so that providers begin the care relationship with a comprehensive clinical picture. The check-in system captures mood on a one-to-ten scale alongside ten physical symptom assessments and optional notes, with a privacy toggle that lets the client choose whether to share each entry with the provider. Care-plan management allows providers to build individualized plans with milestones and track client progress over time. The document system supports upload, version tracking, provider review with structured feedback, and privacy-level controls. File storage routes through MongoDB GridFS, keeping binary assets within the same database cluster.

\newpage

## Phase C: Testing and Quality Refinement

As feature work stabilized, the project shifted emphasis toward formal verification. Backend integration tests exercised real HTTP request/response cycles across authentication, appointment, messaging, check-in, care-plan, intake, and resource routes. Frontend tests validated component rendering, service-layer behavior, authentication flows, and protected-route guards. By the end of this phase the combined test suite had grown to 375 automated tests—222 on the frontend and 153 on the backend—with an overall code-coverage figure of 81.9 percent. A SonarQube quality analysis workflow was integrated into the development process, and the project achieved "A" ratings across security, reliability, and maintainability dimensions. Findings from both automated testing and static analysis were fed back into iterative code fixes, strengthening the implementation before release.

## Phase D: Release Readiness and Portfolio Framing

With quality confidence established, the focus turned to consolidating documentation for onboarding and academic review, validating that the complete provider and client role workflows were demonstrable in a screencast format, and preparing capstone artifacts—including this paper packet—for both technical and nontechnical audiences. The README set, development guide, sprint planning records, and Swagger API documentation were reviewed and updated to reflect the final state of the system.

## Phase E: Maintenance Transition

Following release, the project transitioned from active feature expansion to maintenance-stage operations. The emphasis is now on stability, patching, security monitoring, and operational confidence rather than net-new functionality. The modular architecture, comprehensive test harnesses, and documented quality processes established during development provide the foundation for sustainable long-term maintenance.

\newpage

## Milestone Alignment

The capstone handbook defines three milestones for CST-452. Milestone 4 corresponds to the coding-focused implementation iteration described in Phase B, where the core feature domains were built and integrated. Milestone 5 corresponds to the testing-focused validation iteration described in Phase C, where automated test suites and quality analysis confirmed that the implementation satisfies functional requirements. Milestone 6 encompasses the final completion, release framing, and presentation packaging described in Phases D and E.

## Documented Progress Indicators

As captured in `Docs/Planning/SPRINT_PLAN.md` during the late-development window, the backend was documented as functionally complete across all major planned domains, quality-gate indicators reported high ratings, broad automated testing activity was recorded across combined backend and frontend suites, and remaining work was increasingly framed as frontend polish, deployment hardening, and launch-readiness tasks. These indicators confirmed that the project had satisfied its entry criteria for the maintenance stage: major functional domains implemented and integrated, end-to-end role workflows demonstrable, automated test coverage present, documentation and onboarding materials in place, and a quality workflow established for ongoing maintenance.
