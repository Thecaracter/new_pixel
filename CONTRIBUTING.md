# Contributing to Pixel Works Virtual Office

<p align="center">
  <strong>Language:</strong>
  <a href="CONTRIBUTING.md"><strong>English 🇬🇧</strong></a> | 
  <a href="CONTRIBUTING.id.md"><strong>Bahasa Indonesia 🇮🇩</strong></a>
</p>

Thank you for your interest in contributing to **Pixel Works Virtual Office**! We are building an autonomous 3D virtual workspace where AI agents collaborate seamlessly with humans. We warmly welcome community contributions from developers, 3D artists, UI/UX designers, and AI enthusiasts worldwide.

---

## 🎯 What We Are Looking For (Contribution Wishlist)

We are actively seeking contributions across several core areas. If you are passionate about any of the following, we would love your help:

### 1. 🎨 3D Virtual Office & Three.js Visuals (`src/components/three/`)
- **New Office Furniture & Interactive Props**: Add procedural 3D models such as an espresso coffee machine (with steam particles!), ping-pong or pool table in the break room, server racks with blinking activity lights, whiteboards, and office plants.
- **Lighting & Atmosphere**: Implement dynamic Day / Night cycle lighting, cozy ambient shadows, custom GLSL shaders, or seasonal office decorations (holiday themes, rain against the window).
- **Avatars & Animations**: Add character accessories (glasses, headphones, hoodies), custom skin tones, and new idle animations (sipping coffee, stretching, pacing during thought mode).
- **Camera & Room Navigation**: Add smooth isometric zoom (wheel scroll), pan controls, or customizable room layouts.

### 2. 🛠️ MCP (Model Context Protocol) Server Integrations (`server/mcp/`)
- **Popular Cloud & Dev Integrations**: Build and test MCP integrations for GitHub, GitLab, PostgreSQL, Redis, Slack, Discord, Notion, Jira, Linear, and Google Workspace.
- **Agent Skill Catalog**: Expand our live registry search (`server/mcp/catalog.js`) to discover, install, and invoke tools dynamically from NPM and community registries.
- **Tool Sandbox & Security**: Enhance runtime sandboxing and parameter validation for MCP tool execution.

### 3. 🤖 AI Agent Orchestration & LLM Providers (`server/agents/`, `data/team.json`)
- **Local & Alternative LLM Support**: Support local LLM execution via Ollama, LM Studio, or vLLM alongside cloud providers (Anthropic Claude, OpenAI GPT-4, Google Gemini, Groq, DeepSeek).
- **Multi-Agent Collaboration Heuristics**: Improve inter-agent communication, automated peer review (e.g., QA reviewing Developer's code before marking tasks done), and debate pipelines.
- **Agent Roles & Personas**: Propose and refine specialized roles in `data/team.json` with tested, hallucination-resistant system prompts.

### 4. 📊 Project Kanban, Chat UI & Audio Polish (`src/components/`)
- **Kanban Enhancements**: Drag-and-drop task reordering, due date pickers, priority tags, and export/import sprint data (JSON/CSV/Markdown).
- **Sound Effects & Ambience (Optional Audio)**: Add subtle retro 8-bit sound effects (keyboard clacking, task completion chime, agent speech bubble pops) with an easily accessible mute toggle.
- **Multi-Thread Chat**: Search/filter chat history, export discussion summaries, and thread tagging.

### 5. ⚡ WebGL Performance & Optimization
- **Low-End Device Compatibility**: Mesh instancing, geometry batching, texture optimization, and automated FPS throttling when tab is inactive.
- **Bundle Optimization**: Code-splitting dynamic imports to minimize initial load time.

---

## ⚖️ Mandatory Requirement: Contributor License Agreement (CLA)

Before your contribution or Pull Request (PR) can be reviewed and merged, **you must agree to our [Contributor License Agreement (CLA)](./CLA.md)**.

### Why Does This Project Require a CLA?
Pixel Works Virtual Office operates under a **Dual Licensing model (GNU AGPLv3 + Commercial License)**:
1. **Free for Open-Source Community**: The source code is freely available to study, run, and develop under the copyleft GNU AGPLv3.
2. **Protection Against Unauthorized Resale**: Corporations and third parties **MAY NOT** take this code, close the source, rebrand it, or resell it as a proprietary SaaS without purchasing an official Commercial License from the Project Owner.
3. **Relicensing Authority**: By signing the CLA, you grant the Project Owner the legal authority to license commercial/enterprise editions of the software (including your contributions) to corporate clients, while your authorship remains permanently recognized in Git commit history.

### How to Accept the CLA:
Agreeing to the CLA is fast and frictionless: **simply check the CLA Agreement checkbox in the GitHub Pull Request template when submitting your PR**. No third-party accounts, bots, or paperwork required.

---

## 🚀 Contribution Workflow

### 1. Fork & Setup
1. **Fork** this repository to your GitHub account: `https://github.com/Thecaracter/new_pixel`.
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
# New features, 3D props, or MCP integrations
git checkout -b feat/threejs-coffee-machine
git checkout -b feat/mcp-postgres-integration

# Bug fixes
git checkout -b fix/avatar-collision-boundary

# Documentation improvements
git checkout -b docs/clarify-api-endpoints
```

### 3. Architecture & Code Guidelines
- **Centralized Agent Prompts**: All agent prompts, roster definitions, and model selections are centralized in `data/team.json`. **Do not create redundant prompt files like `AGENTS.md`**.
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
   git commit -m "feat(3d): add procedural espresso machine with steam"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request on the main repository (`Thecaracter/new_pixel`).
4. Fill out the PR template checklist and check the **CLA Agreement** checkbox.
5. Submit the PR for review! We actively review and celebrate new contributions.

---

## 💼 Inquiries Regarding Commercial Licenses
If you represent an organization interested in obtaining a **Commercial / Proprietary License** (to use this software in closed-source enterprise environments, custom private SaaS, or OEM white-label distribution), please contact the Project Owner directly.
