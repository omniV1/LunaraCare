# LUNARA Portfolio Site

Standalone project website for the LUNARA capstone. This app is separate from the main `Lunara/` product and is meant to satisfy the Milestone 6 portfolio requirement by presenting:

- project overview and background,
- architecture and implementation framing,
- code excerpts and supporting artifacts,
- links to the live application, repository, docs, and presentation materials,
- supplemental developer portfolio links.

## Stack

- React
- TypeScript
- Vite
- `@chenglou/pretext`

## Why Pretext

The hero section uses Pretext to lay out multiline body copy around a summary card without relying on DOM measurement in the hot path. That makes the portfolio site itself a small technical showcase rather than a plain static landing page.

## Run locally

```bash
cd LunaraPortfolio
npm install
npm run dev
```

Build with:

```bash
npm run build
```
