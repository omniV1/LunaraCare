---
title: "Purpose of the Capstone Project"
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
header-right: "Purpose"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Purpose of the Capstone Project

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Formal Purpose Statement

The purpose of the LUNARA capstone project is to produce a tangible, production-oriented software artifact that demonstrates applied knowledge across software architecture, secure implementation, testing, documentation, and professional communication for both technical and nontechnical audiences.

## Project Mission in Context

LUNARA was conceived to address a gap in postpartum care continuity. New mothers navigating the fourth trimester—the critical weeks following childbirth—often lack a centralized digital hub through which they can communicate with their doula or support specialist, track their physical and emotional well-being, access educational resources, and manage the documents and care plans that define their recovery journey. LUNARA fills that gap by providing a full-stack web platform where clients and providers operate within a shared but role-separated environment.

On the provider side, a certified doula logs in to a comprehensive dashboard that surfaces key operational data at a glance: the total number of active clients, upcoming appointments, and check-ins that need clinical attention. From that single hub the provider can create and manage client accounts, schedule or confirm appointments through an integrated calendar, exchange real-time messages with any assigned client, author educational blog posts and curated resource articles, review uploaded client documents with structured feedback, and build individualized care plans complete with milestones and progress tracking. The provider dashboard turns what would otherwise be a fragmented set of administrative tasks into a cohesive practice-management workflow.

On the client side, a new mother completes a guided multi-step intake wizard that captures personal, birth, feeding, support-network, and health information so that her provider begins the relationship with a thorough clinical picture. Once onboarded, the client can record daily check-ins that include a mood rating on a one-to-ten scale, self-assessments across ten physical symptoms such as fatigue, sleep quality, appetite, anxiety, and pain, and optional free-text notes—all of which can be shared with the provider at the client's discretion. The client can upload sensitive documents, browse the resource library, view and track her care plan milestones, book appointments, and communicate directly with her assigned provider through Socket.IO-powered real-time messaging. The platform treats the client's privacy and autonomy as first-class concerns while still enabling meaningful provider oversight.

This mission aligns with the capstone expectation that the final artifact should be meaningful, demonstrable, and career-relevant. LUNARA is not a toy project or a feature checklist; it is an integrated care-coordination system whose domain complexity and technical breadth reflect the kind of software a professional engineering team would deliver.

In measurable terms, the capstone value proposition can be expressed as:

$$
V_{capstone} = f(\text{technical depth}, \text{usability}, \text{quality}, \text{maintainability}, \text{professional communication})
$$

LUNARA addresses each factor with TypeScript-first implementation, domain-specific workflow design, 375 automated tests with 81.9% coverage, and documentation for handoff and continuity.

\newpage

## Demonstrated Capstone Competencies

### Technical Breadth and Depth

LUNARA is implemented entirely in TypeScript across both the React 18 frontend and the Node.js/Express backend, providing end-to-end type safety that reduces runtime errors and improves maintainability. The backend exposes nineteen route modules and over seventy individual API endpoints spanning authentication, multi-factor authentication, user management, appointments, messaging, check-ins, care plans, intake, documents, file storage via MongoDB GridFS, resources, blog content, push notifications, and administrative operations. The frontend delivers over fifty React components organized into role-specific dashboards, shared UI primitives, and feature modules for intake, check-ins, messaging, documents, resources, and blog management. Real-time communication is powered by Socket.IO with JWT-authenticated connections, user-specific rooms, and live message delivery.

### Professional Engineering Practice

The project follows production-grade engineering patterns. Environment variables govern configuration across local and deployment contexts, and Docker support enables reproducible builds. Security is addressed through bcrypt password hashing with twelve salt rounds, Helmet HTTP header hardening, CORS policy enforcement, request rate limiting, and input validation at every API boundary. The API surface is documented with Swagger/OpenAPI, and the codebase is organized into modular route, service, model, and middleware layers that mirror the separation-of-concerns principles taught throughout the program.

### Communication and Artifact Quality

Documentation exists at every level of the project: repository-root README files, a detailed development guide for contributor onboarding, sprint planning records that capture iteration-level progress, and this capstone paper packet itself. The combination of code evidence, test evidence, and narrative documentation creates a traceability chain from requirements through implementation to validation—a quality that makes the project suitable for both academic review and portfolio presentation to prospective employers.

\newpage

## Why LUNARA Meets the Capstone Vision

LUNARA satisfies the capstone vision because it is a complete, domain-driven application with maintainable architecture choices, operational and security considerations that go beyond classroom exercises, measurable quality checkpoints backed by 375 automated tests and SonarQube analysis, and a clear lifecycle progression from iterative development through release into ongoing maintenance. The project is not a prototype; it is an engineered system that could be deployed and used by real doula practices to improve the continuity and quality of postpartum care.

## Current Lifecycle Position

Consistent with project status and completed implementation evidence, LUNARA has moved from iterative development into maintenance-stage operations, where the emphasis shifts from feature expansion to stability, patching, and long-term support.
