# Contributing to Pixel Works Virtual Office

Thank you for your interest in contributing to **Pixel Works Virtual Office**! We welcome community contributions, including bug fixes, MCP server integrations, 3D Three.js performance improvements, and UI/UX polish.

---

## ⚖️ Mandatory Requirement: Contributor License Agreement (CLA)

Before your contribution or Pull Request (PR) can be reviewed and merged, **you must read and agree to our [Contributor License Agreement (CLA)](./CLA.md)**.

### Why Does This Project Require a CLA?
Pixel Works Virtual Office operates under a **Dual Licensing model (GNU AGPLv3 + Commercial License)**:
1. **Free for Open-Source Community**: The source code is freely available to study, inspect, run, and develop under the copyleft GNU AGPLv3.
2. **Protection Against Unauthorized Commercial Exploitation**: Third parties, corporations, and vendors **MAY NOT** take this code, close the source, rebrand it, or resell it as a proprietary SaaS or commercial distribution without purchasing an official Commercial License from the Project Owner.
3. **Relicensing & Commercial Authority**: By signing the CLA, you grant the Project Owner the legal authority to license and sell commercial/enterprise editions of the software (including your contributions) to corporate clients, while your authorship remains permanently recognized in Git commit history.

Agreeing to the CLA is fast and frictionless: simply check the **CLA Agreement** checkbox in the GitHub Pull Request template when submitting your PR. No third-party accounts, bots, or paperwork required.

---

## 🚀 Contribution Workflow

### 1. Fork & Setup
1. **Fork** this repository to your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/new_pixel.git
   cd new_pixel
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 2. Branch Naming Conventions
Create a dedicated branch for your work:
```bash
# New features or MCP integrations
git checkout -b feat/mcp-postgres-integration

# Bug fixes
git checkout -b fix/threejs-lighting-glitch

# Documentation improvements
git checkout -b docs/clarify-api-endpoints
```

### 3. Architecture & Code Guidelines
- **AI Agent System Prompts**: All agent prompts, roster definitions, and model selections are centralized in `data/team.json`. **Do not create redundant prompt files like `AGENTS.md`**.
- **MCP Server Integrations**: MCP tools must be declared in `server/mcp/catalog.js` and verified through `server/mcp/catalogRunner.js`.
- **Three.js Virtual Office**: Maintain clean boundary collision coordinates in `src/components/three/` so character avatars and furniture do not clip through walls.

### 4. Mandatory Testing & Verification
Before submitting a Pull Request, ensure that all unit tests and production builds pass cleanly:

```bash
# Run the test suite (all 29 tests must pass)
npm test

# Verify production Vite build (zero errors)
npm run build
```

### 5. Submitting Your Pull Request
1. Commit your changes with concise, conventional commit messages:
   ```bash
   git commit -m "feat(mcp): add live search integration test"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request on the main repository.
4. Fill out the PR template checklist and check the **CLA Agreement** checkbox.
5. Submit the PR for review and automated test checks.

---

## 💼 Inquiries Regarding Commercial Licenses
If you represent an organization interested in obtaining a **Commercial / Proprietary License** (to use this software in closed-source enterprise environments, custom private SaaS, or OEM white-label distribution), please contact the Project Owner directly.
