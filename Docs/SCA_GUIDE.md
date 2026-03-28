# SCA (Software Composition Analysis) Guide for Carter

Quick guide to run dependency and code security scans on the AQC project. Copy the prompts below and paste them into Cursor or your AI assistant.

---

## What is SCA?

**Software Composition Analysis** checks your dependencies (npm packages) for known security vulnerabilities. It answers: *"Are any of my project's packages vulnerable?"*

---

## Option 1: npm audit (No key needed)

Runs immediately. Checks all npm dependencies for known vulnerabilities.

### Prompt for AI:
```
Run npm audit in the Lunara and backend directories to check for dependency vulnerabilities. Show a summary of any findings.
```

### Commands (if running manually):
```bash
cd Lunara
npm audit

cd ../backend
npm audit
```

---

## Option 2: SonarQube scan (Key required)

Full code quality + security analysis. **Carter: Contact [your name] for the SonarQube token before running this.**

### Important: run from repo root
Coverage and Sonar scripts live at the **monorepo root** (`E:\AQC`), not inside `Lunara/` or `backend/`. From a subfolder, go to root first:
```bash
cd E:\AQC
# or: cd /e/AQC   (Git Bash)
```
Then run `npm run coverage` or `node scripts/fix-lcov-paths.js`.

### What you need:
- **SONAR_HOST_URL** – The SonarQube server URL (e.g. `https://sonarqube.yourorg.com`)
- **SONAR_TOKEN** – The authentication token (contact the project owner for this)

### Prompt for AI:
```
Run SonarQube analysis on the AQC project:

1. Install the SonarQube scanner: npm install -g @sonar/scan
2. Run the scan for the backend:
   cd backend
   sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN -Dsonar.projectKey=AQC-Backend
3. Run the scan for the frontend:
   cd Lunara
   sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN -Dsonar.projectKey=AQC-Frontend

I will provide SONAR_HOST_URL and SONAR_TOKEN when prompted.
```

### Commands (if running manually):
```bash
npm install -g @sonar/scan

# Backend
cd backend
sonar -Dsonar.host.url=YOUR_SONAR_URL -Dsonar.token=YOUR_TOKEN -Dsonar.projectKey=AQC-Backend

# Frontend (from project root)
cd ../Lunara
sonar -Dsonar.host.url=YOUR_SONAR_URL -Dsonar.token=YOUR_TOKEN -Dsonar.projectKey=AQC-Frontend
```

**Replace `YOUR_SONAR_URL` and `YOUR_TOKEN` with the values you get from the project owner.**

---

## Quick reference

| Tool       | Key needed? | What it does                    |
|-----------|-------------|---------------------------------|
| npm audit | No          | Check npm packages for CVEs     |
| SonarQube | Yes         | Code quality + security analysis|

---

## After running

- **npm audit**: Fix or review any high/critical issues. Run `npm audit fix` for automatic patches (use with caution).
- **SonarQube**: Review the report in the SonarQube web UI and address any new issues.
