---
title: "Plagiarism"
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
header-right: "Plagiarism"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Plagiarism

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Position Statement

LUNARA follows accepted software engineering reuse practices without misrepresenting external work as original authorship. The project relies on open-source libraries and frameworks as foundational dependencies—React, Express, MongoDB, Socket.IO, Tailwind CSS, and many others—but the application-level business logic, domain workflows, architectural decisions, and integration patterns are original work produced by the project team.

## How Open-Source Dependencies Are Used

Modern software engineering is built on the principle of standing on the shoulders of well-maintained libraries rather than reinventing foundational infrastructure. LUNARA uses React as its UI framework, Express as its HTTP server, Mongoose as its database abstraction, Passport.js as its authentication strategy, and Socket.IO as its real-time transport layer, among dozens of other packages listed in the project's dependency manifests. Each of these libraries is consumed through its published API in the manner intended by its maintainers and in compliance with its open-source license. Vendor documentation and established community patterns informed implementation decisions—for example, the Passport.js documentation guided the JWT strategy configuration, and the Socket.IO documentation informed the room-based messaging architecture.

\newpage

## What Constitutes Original Work

The originality of this capstone project lies not in the libraries it uses but in the system it constructs from them. The end-to-end postpartum care workflow model—connecting clients and providers through intake, check-ins, care plans, messaging, appointments, documents, and resources—is a domain-specific design created by the project team. The role-based dashboard architecture that presents providers with practice-management tools and clients with self-care and communication tools is an original integration strategy. The data models that capture check-in mood ratings, ten-symptom physical assessments, document privacy levels, care-plan milestones, and intake wizard sections are domain-driven designs authored for this project. The nineteen backend route modules and their corresponding service and middleware layers represent original API architecture. The fifty-plus frontend components and their composition into cohesive user journeys represent original UI engineering. The 375-test automated suite was written specifically to validate this system's behavior.

## Boundaries Observed

The project team did not copy large authored logic blocks from external sources and present them as original work. Where external tutorials or documentation examples informed a pattern, the pattern was adapted to the project's specific domain requirements rather than used verbatim. No core business logic or architectural design was substituted with external code. Attribution context is maintained through the project's dependency manifests, which provide a complete and transparent record of every third-party package the system depends on.

## Compliance with Capstone Expectations

The capstone handbook and university policies recognize that professional software reuse is acceptable when the code is legally licensed, educationally ethical, and transparently represented. LUNARA's use of open-source dependencies satisfies all three criteria: every dependency carries a permissive open-source license, the dependencies serve an educational purpose by exposing the student to real-world engineering ecosystems, and their use is fully visible in the `package.json` files and lockfiles committed to the repository.

For detailed information regarding the University's plagiarism policies, refer to the GCU University Policy Handbook (Grand Canyon University, 2016).
