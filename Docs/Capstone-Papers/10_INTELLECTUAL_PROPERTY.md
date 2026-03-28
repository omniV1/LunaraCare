---
title: "Intellectual Property (IP)"
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
header-right: "Intellectual Property"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Intellectual Property (IP)

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## IP Position for LUNARA

All outputs of the LUNARA project—source code, architecture designs, documentation, workflow logic, visual assets, and presentation materials—are treated as capstone-generated intellectual artifacts within the boundaries of Grand Canyon University policy and applicable open-source license obligations. The project team recognizes its ownership of the intellectual property created during the capstone while respecting institutional policies and third-party licensing terms.

## Software Artifacts

The project's primary intellectual property resides in its software artifacts. The backend API comprises nineteen route modules, over twenty Mongoose data models, nine dedicated service modules, and shared middleware that together implement the complete LUNARA domain: authentication, multi-factor verification, user and provider management, appointments, real-time messaging, client intake, daily check-ins, care plans, documents, resources, blog content, push notifications, and administrative operations. The frontend application comprises over fifty React components organized into role-specific dashboards, domain feature modules, and shared UI primitives, along with page-level entry points, context providers, and service-layer abstractions. The automated test suite of 375 tests represents additional intellectual property in its own right, as each test encodes domain knowledge about expected system behavior. All software artifacts are written in TypeScript, and the architectural decisions—modular route organization, role-based access patterns, real-time Socket.IO integration, GridFS file storage, and Zod-validated form workflows—are original design choices made by the project team.

## Documentation Artifacts

The documentation produced during the capstone constitutes a separate category of intellectual property. The README files, development guide, sprint planning records, SCA guide, and this capstone paper packet represent significant authored work that captures not only what was built but why specific decisions were made, how the development progressed, and what the system's operational requirements are. These documents have value both as academic submissions and as professional artifacts that support portfolio presentation and employer evaluation.

## Design and Product Artifacts

Beyond code and documentation, the project's intellectual property includes the UX flow decisions that shape the provider and client dashboard structures, the domain models that define how postpartum care data is captured and organized, the workflow logic that governs document lifecycles and care-plan milestone tracking, and the portfolio-facing narrative that communicates the project's value to nontechnical audiences. These design-level decisions represent applied creative and engineering judgment that is distinct from the open-source tools used to implement them.

\newpage

## Open-Source License Boundary

LUNARA depends on numerous open-source packages, each carrying its own license terms. The use of these packages does not transfer ownership of the project-authored business logic, workflow architecture, domain models, or original documentation to any third party. The project's `package.json` files and lockfiles provide a complete, transparent inventory of every third-party dependency, and each dependency was selected in compliance with its published license. The boundary is clear: the frameworks and libraries are tools; the system built with them is original intellectual property.

## IP Compliance Principles

The project adheres to four IP compliance principles throughout development and into maintenance. First, institutional policy and advisor requirements are respected in all publication and submission decisions. Second, third-party package licenses and usage conditions are honored without exception. Third, ownership and contribution traceability are preserved through the Git commit history, which provides an auditable record of authorship. Fourth, sensitive or protected operational data—such as environment secrets, API keys, and user credentials—are excluded from public artifacts and managed through environment variable configuration.

## Maintenance-Stage IP Responsibilities

Intellectual property governance does not end at release. As the project continues in maintenance, the same principles apply to patch commits, documentation revisions, deployment configuration updates, and security and quality process records. Any future contributions to the codebase will be subject to the same ownership, licensing, and traceability standards established during the capstone period.

For detailed information regarding the University's intellectual property rights, refer to the GCU University Policy Handbook (Grand Canyon University, 2016).
