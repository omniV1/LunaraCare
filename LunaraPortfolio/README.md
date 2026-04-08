<p align="center">
  <img src="../Lunara/public/images/lunara stamp.png" alt="Lunara" width="140"/>
</p>

<h1 align="center">LUNARA Project Portfolio</h1>

<p align="center">
  <em>An employer-facing companion site that tells the story of the LUNARA capstone project — its architecture, security posture, quality evidence, and the thinking behind every layer.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="https://www.lunara-profile.design">Live Site</a> &nbsp;&bull;&nbsp;
  <a href="https://www.lunaracare.org">Live Application</a> &nbsp;&bull;&nbsp;
  <a href="../README.md">Monorepo</a> &nbsp;&bull;&nbsp;
  <a href="https://www.youtube.com/watch?v=EY6ncwOMFUQ">Video Demo</a>
</p>

---

## Purpose

This site was built for **Milestone 6** of the GCU CST-451/452 Senior Capstone to fulfil the requirement for an internet-facing project portfolio that potential employers can access. It is deployed at **[www.lunara-profile.design](https://www.lunara-profile.design)** on Vercel with a custom domain.

The portfolio is **not** the LUNARA application itself — it is a companion site that explains what LUNARA is, how it was built, and what the team delivered.

---

## What the Portfolio Covers

The portfolio walks a reviewer through the full arc of the project. It opens with the problem statement — fragmented postpartum care across texts, spreadsheets, and disconnected scheduling tools — and introduces LUNARA's mission to unify that experience into a single authenticated platform for families and doulas.

From there, the site breaks down the four-layer architecture: a React frontend with role-specific dashboards, an Express API coordinating 127 route handlers, a MongoDB persistence layer backed by GridFS for file storage, and a DevOps pipeline driven by GitHub Actions, Docker, and SonarQube quality gates. Security is presented not as an afterthought but as a deliberate design decision, covering JWT and refresh token flows, TOTP-based multi-factor authentication, account lockout policies, Helmet headers, CORS allowlisting, per-endpoint rate limiting, and input sanitisation across every surface.

The testing narrative follows, documenting 1,044 Jest tests spanning services, middleware, hooks, and components alongside 32 Playwright end-to-end specs that exercise authentication, navigation, and content flows across Chromium. SonarQube quality gates and coverage metrics provide the quantitative evidence.

Implementation highlights showcase the most technically interesting subsystems — Socket.IO realtime messaging with JWT-authenticated handshakes, a Three.js 3D mood orb for client check-ins, GridFS document workflows with ownership-checked retrieval, and a care-plan engine built on reusable provider-authored templates. Annotated code excerpts from the backend services and frontend components give reviewers a direct line into the codebase without needing to clone the repository.

The site closes with links to every deliverable — the live application, interactive Swagger API documentation, capstone papers, the showcase poster, and a video screencast — followed by developer profiles and supplemental professional references.

---

## Stack

The portfolio itself is a lightweight React 19 application written in TypeScript and bundled with Vite 6. Styling is handled inline and through a global CSS file rather than a utility framework, keeping the dependency footprint intentionally small for what is essentially a single-page editorial experience.

The most distinctive technical choice is the use of [Pretext](https://github.com/chenglou/pretext) by @chenglou for the hero section. Pretext measures text against canvas-based font metrics to produce pixel-perfect multiline line-breaking independent of CSS reflow. The hero narrative wraps around a floating summary card without relying on DOM measurement in the hot path, making the portfolio itself a small technical showcase rather than a plain static landing page.

---

## Run Locally

```bash
cd LunaraPortfolio
npm install
npm run dev          # http://localhost:5173
```

To build for production, run `npm run build` which outputs to `dist/`, then `npm run preview` to serve the production bundle locally.

---

## Deployment

The site is deployed on **Vercel** with a custom domain at **[www.lunara-profile.design](https://www.lunara-profile.design)**. A `vercel.json` configuration at the project root handles SPA routing with a catch-all rewrite rule so that direct navigation and page refreshes resolve correctly. The framework preset is Vite, the build command is `npm run build`, and the output directory is `dist`.

---

## Project Structure

The codebase is deliberately minimal. `App.tsx` is the root component and contains the full editorial layout powered by the Pretext line-breaking engine. All portfolio text, statistics, section data, code samples, and team information live in `siteContent.ts`, making content updates a single-file change. `main.tsx` bootstraps the React tree, and `index.css` holds global styles with responsive breakpoints. The `vercel.json` at the root configures SPA routing for Vercel, and the `public/` directory includes the showcase poster PDF so reviewers can access it directly from the deployed site without depending on GitHub-tracked binaries.

---

## Related Links

The live LUNARA application is at [lunaracare.org](https://www.lunaracare.org), and this portfolio site is at [lunara-profile.design](https://www.lunara-profile.design). The interactive API documentation is hosted at [lunara.onrender.com/api-docs](https://lunara.onrender.com/api-docs), and a video screencast walkthrough is available on [YouTube](https://www.youtube.com/watch?v=EY6ncwOMFUQ). The full monorepo lives at [github.com/omniV1/lunaraCare](https://github.com/omniV1/lunaraCare), with dedicated READMEs for the [backend](../backend/README.md) and [frontend](../Lunara/README.md), and all six milestone papers are collected under [Docs/Capstone-Papers/](../Docs/Capstone-Papers/).

---

## License

MIT (see repository root).
