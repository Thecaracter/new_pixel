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

1. **User sends message** in the chat panel
2. **Frontend calls** `POST /api/chat` with the message
3. **Backend proxy** executes `opencode run [message]` via child process
4. **OpenCode** sends the prompt to your configured AI provider (e.g., 9router)
5. **Response returned** to frontend and displayed in the chat

### Backend API

**POST /api/chat**

Request:
```json
{
  "message": "What files are in this project?",
  "sessionId": null
}
```

Response (success):
```json
{
  "reply": "The project contains the following files...",
  "sessionId": "abc123"
}
```

Response (error):
```json
{
  "error": "OpenCode service unavailable",
  "details": "Failed to start OpenCode: command not found"
}
```

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

## Troubleshooting

### Chat shows "OpenCode service unavailable"

1. **Check OpenCode is installed**: `opencode --version`
2. **Check provider is configured**: `opencode providers`
   - If not configured, run `opencode providers` and follow the prompts to add credentials
3. **Check backend is running**: Backend should print to console on startup

### Chat shows "Failed to start OpenCode: command not found"

- OpenCode CLI is not in PATH
- Install globally: `npm install -g opencode`
- Or update your PATH to include the OpenCode binary location

### Build succeeds but chat doesn't work in production

- The `/api/chat` endpoint is only available during development via the proxy
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
