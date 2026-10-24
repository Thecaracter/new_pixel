# Kantor Virtual — Pixel Works

A React conversion of the isometric virtual office scene with animated characters, interactive tooltips, responsive mobile support, and an integrated chat panel connected to OpenCode.

## Prerequisites

- **Node.js** 16+ and npm
- **OpenCode CLI** 1.18+ installed globally (`npm install -g opencode`)
- **OpenCode provider configured** with credentials for AI access (run `opencode providers` to configure)

## Setup

```bash
npm install
```

## Development

Start both the backend API and Vite dev server:

```bash
npm run dev
```

This command:
1. Starts the Express backend on `http://127.0.0.1:3001` with `/api/chat` endpoint
2. Starts the Vite dev server on `http://localhost:5173` with hot module reloading
3. Frontend requests to `/api` are proxied to the backend

The chat panel at the bottom of the page connects to OpenCode through the backend proxy, which executes `opencode run [message]` to send prompts and return responses. Sessions are tracked locally to maintain continuity.

### Alternative: Frontend-only development

If you only want to work on the UI without backend integration:

```bash
npm run dev:frontend
```

Starts just Vite on `http://localhost:5173`. The chat will show connection errors (expected without backend).

## Production Build

```bash
npm run build
```

Outputs optimized bundle to `dist/`. Preview with:

```bash
npm run preview
```

## Features

- **Isometric office scene** with 7 animated characters (typists, speaker, walker, cat)
- **Character animations** using CSS keyframes: typing, nodding, talking, walking, writing
- **Walker path animation** using requestAnimationFrame for smooth motion
- **Interactive tooltips** on hover/tap for desks, equipment, and characters
- **Parallax effect** driven by mouse and scroll position
- **Speech bubbles** that rotate through character-specific sentences
- **Chat panel** with OpenCode integration for command interface
- **Responsive layout**: Desktop (full scene), tablet (full with adjusted parallax), mobile (simplified 5-character view)
- **Accessibility**: `prefers-reduced-motion` support disables all animations
- **Dark mode**: Automatic detection via `prefers-color-scheme` or manual toggle via `data-theme` attribute
- **Tailwind-compatible styling** with CSS custom properties for theming

## Structure

```
src/
  ├── App.jsx                    # Main React component
  ├── index.css                  # Global styles & animations
  ├── App.css                    # Component-specific styles
  ├── components/
  │   ├── ChatPanel.jsx          # Chat panel with OpenCode backend integration
  │   ├── OfficeHeader.jsx
  │   ├── OfficeScene.jsx
  │   ├── ResponsiveNotes.jsx
  │   ├── SceneTooltip.jsx
  │   └── VirtualOfficePage.jsx
  ├── hooks/
  │   ├── useParallaxEffect.js
  │   ├── useResponsiveViewBox.js
  │   ├── useSceneTooltips.js
  │   ├── useSpeechBubbles.js
  │   └── useWalkerAnimation.js
  └── utils/
      ├── svgUtils.js            # Isometric projection & SVG primitives
      ├── characterUtils.js      # Character head & body rendering
      └── sceneGenerator.js      # Complete scene assembly

server.js                         # Express backend for OpenCode chat proxy
```

## Chat Integration

### How It Works

1. **User selects model** from the model dropdown in the chat panel
2. **User sends message** in the chat panel
3. **Frontend calls** `POST /api/chat` with the message, optional session ID, and selected model
4. **Backend proxy** executes `opencode run --format json --model provider/model --session [sessionId] [message]` via child process
5. **OpenCode** sends the prompt using the selected model to your configured AI provider
6. **Backend parses** the JSON output to extract the session ID and text response
7. **Response returned** to frontend and displayed in the chat
8. **Session ID persisted** in ChatPanel state for subsequent message continuity
9. **Model persists** until changed by the user

### Model Selection

The chat panel displays a dropdown selector with available models. Models are configured via:

1. **Environment variable** `OPENCODE_MODELS` (comma-separated list):
   ```bash
   OPENCODE_MODELS="9router/claude-opus-4-1-latest,9router/claude-sonnet-4-20250514" npm run dev
   ```

2. **Default models** (if env var not set):
   - `9router/claude-haiku-4.5-thinking-agentic`
   - `9router/claude-opus-4-1-latest`
   - `9router/claude-sonnet-4-20250514`

The backend exposes available models via the `/api/models` endpoint, which the frontend fetches on load.

### Session Continuity and Model Changes

- **Same model**: Session ID is preserved and reused across messages
- **Different model**: Session is automatically reset when you change the model to ensure no incompatible context mixing
  - The backend logs: `Model changed from X to Y, resetting session`
  - A new session starts with the next message using the new model

The response always includes:
- `reply`: The text response from OpenCode
- `sessionId`: Current session ID for use in subsequent requests
- `model`: The model that processed the request

### Backend API

**GET /api/models**

Response:
```json
{
  "models": [
    "9router/claude-haiku-4.5-thinking-agentic",
    "9router/claude-opus-4-1-latest"
  ],
  "defaultModel": "9router/claude-haiku-4.5-thinking-agentic",
  "currentModel": "9router/claude-opus-4-1-latest"
}
```

**POST /api/chat**

Request (Standard Chat):
```json
{
  "message": "What files are in this project?",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest"
}
```

Response (Standard Chat):
```json
{
  "reply": "The project contains the following files...",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest",
  "mode": "chat",
  "phase": "chat"
}
```

Request (Leader Coordination Mode - Arif):
```json
{
  "message": "Kita mau buat fitur export PDF laporan bulanan.",
  "mode": "leader",
  "model": "9router/claude-opus-4-1-latest"
}
```

Response (Leader Mode - Clarifying Phase):
```json
{
  "reply": "Sebelum membagi tugas ke tim, saya perlu mengklarifikasi beberapa detail teknis.",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest",
  "mode": "leader",
  "phase": "clarifying",
  "questions": [
    "Apakah export di-generate di browser atau server?",
    "Data apa saja yang wajib masuk dalam laporan bulanan ini?",
    "Kapan batas waktu rilis yang ditargetkan?"
  ],
  "plan": null,
  "confirmation_prompt": null,
  "valid": true
}
```

Response (Leader Mode - Awaiting Confirmation Phase):
```json
{
  "reply": "Rencana kerja sprint untuk fitur export PDF sudah disusun bersama tim.",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest",
  "mode": "leader",
  "phase": "awaiting_confirmation",
  "questions": [],
  "plan": {
    "title": "Fitur Export PDF Laporan Bulanan",
    "goal": "Menyediakan download PDF laporan keuangan dan operasional",
    "scope": "Frontend button, backend generator, template PDF",
    "tasks": [
      {
        "id": "TASK-1",
        "title": "Requirement & Skema Data",
        "assignee": "Rina",
        "role": "Finance / Accountant",
        "description": "Menentukan field tabel dan format angka rupiah",
        "status": "pending"
      },
      {
        "id": "TASK-2",
        "title": "Desain Layout PDF",
        "assignee": "Dimas",
        "role": "UI/UX Designer",
        "description": "Membuat template tata letak header, tabel, dan footer",
        "status": "pending"
      },
      {
        "id": "TASK-3",
        "title": "Implementasi Tombol Export & Service",
        "assignee": "Bayu",
        "role": "Product / Frontend Engineer",
        "description": "Wiring tombol di antarmuka dan penanganan download stream",
        "status": "pending"
      }
    ]
  },
  "confirmation_prompt": "Apakah rencana tugas di atas sudah sesuai? Balas 'setuju' untuk konfirmasi sebelum tim memulai pengerjaan.",
  "valid": true
}
```

Response (error):
```json
{
  "error": "OpenCode service unavailable",
  "details": "Failed to start OpenCode: command not found"
}
```

**Notes**:
- The `sessionId`, `model`, and `mode` fields are optional in the request
- Mode dapat diaktifkan lewat `mode: "leader"` atau `leader: true`
- Seluruh tugas pada `plan.tasks` berstatus `pending` (MVP tidak mengeksekusi otomatis)
- If `sessionId` is omitted, a new session is created
- If `model` is omitted, the currently selected model is used
- The response always includes tracking fields

**GET /api/chat/history**

Fetches durable conversation history and session IDs isolated per mode.

Query parameters:
- `mode` (optional): `leader`, `chat`, or `orchestrator`. If omitted, returns all modes.

Response:
```json
{
  "mode": "leader",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "messages": [
    {
      "id": "msg_1729760000_abc123",
      "timestamp": 1729760000000,
      "type": "user",
      "mode": "leader",
      "text": "Kita mau buat fitur export PDF laporan bulanan."
    }
  ]
}
```

**POST /api/chat/reset** (or `DELETE /api/chat/history`)

Resets durable messages and session IDs for a specific mode or all modes.

Body / Query:
```json
{
  "mode": "leader"
}
```

**POST /api/chat/approve-plan** (alias: `/api/kanban/approve-plan`)

Explicit approval endpoint to create tasks in Kanban from a leader/orchestrator plan.

Request:
```json
{
  "planId": "plan_login_v1",
  "idempotencyKey": "plan_login_v1",
  "messageId": "msg_1729760000_abc123",
  "plan": {
    "id": "plan_login_v1",
    "title": "Fitur Login & Autentikasi",
    "goal": "User dapat login dengan aman",
    "scope": "Frontend & backend auth",
    "tasks": [
      {
        "id": "TASK-1",
        "title": "Desain Form Login",
        "assignee": "Dimas",
        "role": "UI/UX Designer",
        "description": "Mockup form login",
        "status": "pending"
      }
    ]
  }
}
```

Response (Created - 201):
```json
{
  "success": true,
  "alreadyApproved": false,
  "planId": "plan_login_v1",
  "idempotencyKey": "plan_login_v1",
  "message": "Plan approved: 1 tasks created in Kanban backlog.",
  "tasks": [
    {
      "id": "TASK-1",
      "planId": "plan_login_v1",
      "planTitle": "Fitur Login & Autentikasi",
      "title": "Desain Form Login",
      "description": "Mockup form login",
      "assignee": "Dimas",
      "role": "UI/UX Designer",
      "status": "pending",
      "column": "backlog",
      "createdAt": "2026-10-24T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

Response on Retry (Idempotent - 200):
```json
{
  "success": true,
  "alreadyApproved": true,
  "planId": "plan_login_v1",
  "idempotencyKey": "plan_login_v1",
  "message": "Plan has already been approved. Existing tasks preserved.",
  "tasks": [...],
  "count": 1
}
```

**GET /api/kanban/tasks**

Returns current Kanban tasks, columns (`Backlog`, `In Progress`, `Done`), and approved plan records.

Response:
```json
{
  "tasks": [...],
  "columns": [
    { "id": "backlog", "name": "Backlog", "position": 1 },
    { "id": "in_progress", "name": "In Progress", "position": 2 },
    { "id": "done", "name": "Done", "position": 3 }
  ],
  "approvedPlans": {...}
}
```

### Session Continuity and Durable Storage

The integration supports persistent sessions across multiple messages and browser reloads:
- **Durable File Store**: Chat histories and active sessions are stored in `data/chat_history.json`, surviving browser reloads and backend restarts.
- **Kanban Task Store**: Approved plans are durably stored in `data/kanban.json`.
- **Mode Isolation**: Leader mode, Standard Chat, and Multi-Agent Orchestrator maintain strictly separated session IDs and message threads.
- **Concurrency & Mutex**: All mutations are serialized with an in-process `AsyncMutex` (`chatMutex`, `kanbanMutex`) to eliminate race conditions and lost updates during concurrent requests.
- **Atomic File Writes**: Safe writes utilize temporary files with atomic rename and retry loop on Windows to eliminate partial JSON writes. Fallback to direct write was removed to preserve atomicity guarantees.
- **DoS Protection & Validation**: Limits are enforced on plans and tasks (`MAX_PLAN_TITLE_LENGTH = 200`, `MAX_TASKS_PER_PLAN = 50`, `MAX_TASK_TITLE_LENGTH = 200`, `MAX_TASK_DESCRIPTION_LENGTH = 2000`).
- **Collision-Proof Task IDs**: Unique non-colliding task identifiers are generated even if distinct plans submit identical task keys.
- **Idempotency**: Repeated approval requests using the same plan/key do not create duplicate Kanban tasks.
- **Gating**: Unapproved plans remain in pending status and never create Kanban tasks without explicit user approval.
- **First message**: Creates a new OpenCode session (no `--session` flag needed)
- **Subsequent messages**: Include the session ID via `--session <sessionId>` flag
- **Session ID parsing**: Extracted from the first JSON event in OpenCode's output (`event.sessionID`)
- **Session tracking**: Stored in ChatPanel component state, sent in request body, and updated with each response
- **Model changes**: Automatically reset session to prevent context mixing

Verified with OpenCode CLI 1.18.31:
- ✅ `opencode run --help` confirms `--session` flag support
- ✅ `--format json` outputs structured events with `sessionID` field on every event
- ✅ `-m, --model provider/model` flag for model selection
- ✅ Session continuity tested: same session ID maintained across multiple API calls
- ✅ Model switching tested: session resets when model changes

### Environment Variables

- `BACKEND_PORT` — Backend API port (default: `3001`)

Example:
```bash
BACKEND_PORT=3000 npm run dev
```

## Technical Details

- **Build tool**: Vite 5 with React Fast Refresh
- **Framework**: React 18 with Hooks
- **Styling**: CSS custom properties + CSS animations
- **SVG**: Procedurally generated isometric primitives (no external images)
- **Animation**: CSS keyframes + React state for dynamic positioning
- **Backend**: Express.js with child_process integration to OpenCode CLI
- **Cross-platform support**: Windows PATH detection via `where` command, fallback to PATH lookup on Unix
- **Session management**: OpenCode session IDs tracked via JSON output parsing (`--format json`)

## Troubleshooting

### Chat shows "Backend not running — start with: npm run dev"

This error means the frontend cannot connect to the Express backend on `http://127.0.0.1:3001`. The backend and Vite frontend run together:

1. **Ensure you used the full dev command**: `npm run dev` (not `npm run dev:frontend`)
   - `npm run dev` starts BOTH backend (3001) and frontend (5173)
   - `npm run dev:frontend` only starts Vite and has no backend
2. **Check backend startup**: Look at the console output from `npm run dev`; you should see:
   ```
   ✅ Backend server running on http://127.0.0.1:3001
   ✅ Chat API available at http://127.0.0.1:3001/api/chat
   ✅ Models endpoint available at http://127.0.0.1:3001/api/models
   ```
3. **Verify port 3001 is not in use**:
   - Windows: `netstat -ano | findstr :3001`
   - macOS/Linux: `lsof -i :3001`
   - If in use, set `BACKEND_PORT=3002 npm run dev` to use a different port

### Chat shows "Could not load available models" (generic error)

If you see a different error message with more details:

1. **Check backend is running**: Backend should print to console on startup
2. **Verify `/api/models` endpoint**: Open `http://127.0.0.1:3001/api/models` in your browser
3. **Check server logs** for errors during model discovery
4. **Check browser console** (F12) for network errors on the `/api/models` request

### Model selector shows "No models available"

- Verify the `OPENCODE_MODELS` environment variable is set correctly if using custom models
- Fall back to defaults: check that the default models in `server.js` are accessible
- Run `opencode run "hello" --model 9router/claude-haiku-4.5-thinking-agentic` to test a specific model

### Chat shows "OpenCode service unavailable"

1. **Check OpenCode is installed**: `opencode --version`
2. **Check provider is configured**: `opencode providers`
   - If not configured, run `opencode providers` and follow the prompts to add credentials
3. **Check backend is running**: Backend should print to console on startup

### Chat shows "Failed to start OpenCode: command not found"

- OpenCode CLI is not in PATH
- Install globally: `npm install -g opencode`
- Or update your PATH to include the OpenCode binary location

### Model changes but chat still uses old model

- Session is automatically reset when you change models; the next message uses the new model
- Check browser console for errors during model selection
- Verify the response includes the correct model in the `model` field

### Build succeeds but chat doesn't work in production

- The `/api/chat` and `/api/models` endpoints are only available during development via the proxy
- For production deployment, you would need to run the Express backend as a separate service
- Or build a production-ready backend integration (not covered in this setup)

## Testing

Run unit & integration tests for chat and leader coordination contracts:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

Manual testing with `curl`:

```bash
# Standard chat request (backward-compatible)
curl -X POST http://127.0.0.1:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Halo Arif, apa kabar?"}'

# Leader coordination mode (requests clarification or structured plan)
curl -X POST http://127.0.0.1:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tolong pimpin pembuatan fitur autentikasi OAuth", "mode": "leader"}'

# Read durable chat history
curl -X GET "http://127.0.0.1:3001/api/chat/history?mode=leader"

# Approve leader plan and create Kanban backlog tasks
curl -X POST http://127.0.0.1:3001/api/chat/approve-plan \
  -H "Content-Type: application/json" \
  -d '{"planId": "plan-1", "plan": {"title": "Fitur Login", "tasks": [{"title": "Desain UI", "assignee": "Dimas", "role": "UI/UX Designer"}]}}'

# View Kanban tasks
curl -X GET http://127.0.0.1:3001/api/kanban/tasks
```

## Preservation Notes

All original behaviors preserved:
- ✅ Character animation loops (CSS keyframes)
- ✅ Walker motion and direction (requestAnimationFrame)
- ✅ Speech bubble rotation (React effect)
- ✅ Tooltip show/hide on pointer events
- ✅ Parallax on mouse/scroll
- ✅ Mobile viewBox adaptation
- ✅ Dark mode support
- ✅ Reduced motion fallback
- ✅ Chat panel with local message history and OpenCode backend integration
