---
title: "Technology Requirements"
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
header-right: "Technology Requirements"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Technology Requirements

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Technology Selection Strategy

Technology choices for LUNARA were driven by three concurrent goals: delivering capstone-level technical rigor, following realistic production engineering patterns, and establishing a stack that remains maintainable well beyond the initial release. Every tool and framework was independently selected with guidance from the project mentor, and the resulting stack was implemented in a way consistent with the handbook expectation that students own their tooling decisions and deliver repository-based artifacts.

## Frontend Platform

The client-facing application is built with React 18 and TypeScript, scaffolded and bundled through Vite for fast development iteration and optimized production builds. Tailwind CSS provides a utility-first design system that keeps visual styling consistent across the provider and client dashboards without requiring a heavyweight component library. Navigation is handled by React Router v6, which supports role-aware route guards so that providers and clients are directed to their respective dashboards after authentication. All API communication flows through an Axios client layer configured with interceptors for automatic JWT token attachment and refresh logic, ensuring that authenticated requests are seamless from the user's perspective. Form-heavy workflows—such as the five-step client intake wizard—use React Hook Form paired with Zod schema validation, giving each form both runtime type checking and declarative validation rules that surface clear error messages. Real-time messaging between clients and providers is powered by a Socket.IO client that maintains a persistent WebSocket connection, listens for incoming messages, and delivers them to the conversation view without requiring a page refresh. Component and integration tests are written with Jest and React Testing Library, enabling confidence that UI behavior and service interactions remain correct as the codebase evolves.

\newpage

## Backend Platform

The server is a Node.js application built on Express with TypeScript, providing the same type-safety benefits on the API side that the frontend enjoys. Data persistence uses MongoDB through Mongoose, which supplies schema-level validation, middleware hooks, and a query builder that maps cleanly to the domain models required by LUNARA—users, providers, clients, appointments, check-ins, care plans, documents, messages, resources, blog posts, and more, totaling over twenty distinct models. Authentication relies on a JWT and Passport.js strategy that issues access and refresh tokens and supports multi-factor authentication through time-based one-time passwords. The real-time messaging server is a Socket.IO instance that authenticates connections with the same JWT strategy, assigns users to private rooms, and broadcasts messages with delivery confirmation events. File storage for uploaded client documents and provider assets is routed through MongoDB GridFS, keeping binary content within the same database cluster rather than introducing a separate object-storage dependency. The API surface is documented with Swagger/OpenAPI, which generates an interactive endpoint explorer at the `/api-docs` path and serves as living documentation for both development and review. Security hardening includes Helmet for HTTP header protection, CORS policy enforcement, express-rate-limit for request throttling, bcrypt password hashing with twelve salt rounds, and express-validator for input sanitization at every route boundary. Email notifications—such as appointment reminders and password-reset flows—are handled by a Nodemailer service configured for Gmail SMTP, and Web Push notifications deliver browser-level alerts for time-sensitive events. Backend testing uses Jest and Supertest, enabling route-level integration tests that exercise real HTTP request/response cycles against the Express application.

\newpage

## Engineering Tooling and Delivery

Source control and collaboration follow a standard Git/GitHub workflow with branching, pull requests, and commit-history traceability that satisfies the handbook requirement for a private repository with verifiable development progression. Docker configuration files support reproducible environment setup so that a reviewer or future maintainer can spin up the full stack without manual dependency installation. Code quality is monitored through a SonarQube analysis workflow documented in the project's SCA guide, which produces security, reliability, and maintainability ratings—all of which achieved an "A" grade as of the most recent scan. Environment variable configuration separates local development secrets from production values, following twelve-factor application principles.

## Technology-to-Requirement Mapping

Each major functional requirement of the platform is supported by a deliberate technology choice. Secure identity and role-based access control are implemented through JWT, Passport, route middleware, and protected frontend routes. Scalable API design relies on Express route modularization across nineteen modules and Mongoose model definitions for over twenty domain entities. Real-time communication between clients and providers is enabled by Socket.IO's bidirectional event system on both client and server. Input validation and data reliability are enforced by express-validator patterns on the backend and Zod-validated forms on the frontend. Transparency and onboarding are supported by the README documentation set, the development guide, and the Swagger API explorer. Quality assurance is backed by 1044 Jest tests (891 frontend, 153 backend) plus 32 Playwright end-to-end tests, spanning unit, component, service, and integration layers, as documented in Milestone 5. Deployment readiness is addressed through Docker support and environment-variable-driven configuration.

\newpage

## Why This Stack Was Appropriate for Capstone

The chosen stack demonstrates skills that are directly relevant to employers hiring full-stack engineers: modern frontend framework proficiency with React, backend API architecture competency with Express and MongoDB, secure authentication and data-handling workflows, a disciplined testing and quality-ownership practice, and documented maintenance viability that extends well beyond the academic deadline. The maturity of these ecosystems, combined with TypeScript's refactoring safety and the established test harnesses, means that LUNARA can be patched, extended, and maintained with confidence in its post-release lifecycle.
