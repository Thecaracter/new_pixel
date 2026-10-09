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

Request:
```json
{
  "message": "What files are in this project?",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest"
}
```

Response (success):
```json
{
  "reply": "The project contains the following files...",
  "sessionId": "ses_ede0a6b9effe8TjiONpWANC1k4",
  "model": "9router/claude-opus-4-1-latest"
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
- The `sessionId` and `model` fields are optional in the request
- If `sessionId` is omitted, a new session is created
- If `model` is omitted, the currently selected model is used
- The response always includes both fields for tracking

### Session Continuity

The integration supports persistent sessions across multiple messages:
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
