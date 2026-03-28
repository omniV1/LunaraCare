---
title: "Sources of Information and Use of Reference Sources"
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
header-right: "Sources"
footer-right: "\\thepage"
block-headings: true
numbersections: false
titlepage: false
---

# Sources of Information and Use of Reference Sources

**Author:** Owen Lindsey  
**Institution:** Grand Canyon University  
**Course:** CST-452 Senior Capstone  
**Date:** March 10, 2026

\newpage

## Source Strategy

To ensure factual accuracy and prevent overstatement, project reporting throughout this capstone packet prioritized first-party evidence over memory-based summaries. Every claim about what the system does, how it is structured, and what quality metrics it has achieved is traceable to a specific artifact in the project repository. External sources were consulted only for standards, terminology, and framework guidance—never as a substitute for the project's own implementation evidence.

## Primary Sources

The foundation of this packet is the project's own codebase and documentation. The repository-root `README.md` provides the high-level project overview and quickstart instructions. The `Docs/README.md` file documents the overall documentation structure. The development guide at `Docs/DEVELOPMENT_GUIDE.md` captures setup procedures, coding standards, and testing workflow for contributor onboarding. The sprint plan at `Docs/Planning/SPRINT_PLAN.md` preserves the iteration-level progress narrative, completion percentages, and scope-adjustment decisions that informed the timeline and milestone papers. The software composition analysis guide at `Docs/SCA_GUIDE.md` documents the SonarQube quality workflow and the metrics referenced in the testing and release papers. The backend README at `backend/README.md` details API architecture, route inventory, and environment configuration. The frontend README at `Lunara/README.md` covers component structure, build pipeline, and development workflow.

Code evidence was drawn directly from the implemented route files in `backend/src/routes`, which provided the authoritative inventory of nineteen route modules and their endpoint counts. Frontend workflow modules in `Lunara/src/pages` and `Lunara/src/components` provided the component inventory and feature descriptions used throughout the milestone papers. Test evidence came from the backend test suite in `backend/tests` and the frontend test suite in `Lunara/src/tests`, whose execution output supplied the 375-test count, 81.9 percent coverage figure, and individual test-category breakdowns.

\newpage

## How References Were Applied

The reference methodology followed a strict hierarchy. Code evidence served as the highest-authority source for any claim about system functionality, architecture, or technical implementation. Project documentation served as the primary source for timeline, planning, and process claims. Sprint planning records served as the source for milestone progress and scope-adjustment context. External sources—such as framework documentation, the capstone handbook, and university policy materials—were used only for standards, terminology, and institutional requirements. No claim was included in this packet that could not be tied to direct evidence from one of these source categories.

## GCU Library Resources

The GCU Library's research assistance services, database collections, and interlibrary loan capabilities were available throughout the capstone period for supporting research on software engineering practices, postpartum care domain knowledge, and academic formatting standards. The Library's Ask A Librarian service, database and resource search tools, help tutorials, and RefWorks citation management support were accessible for any research needs that extended beyond the project's first-party evidence base.

## Journey Coverage

The expanded papers in this packet intentionally connect prior documentation, current code implementation, and the project's progression into maintenance so that the final narrative reflects both accomplishment and process history. This approach ensures that the capstone submission is not merely a snapshot of the finished product but a documented account of the engineering journey from requirements through release.
