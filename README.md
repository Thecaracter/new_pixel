# Kantor Virtual — Pixel Works

A React conversion of the isometric virtual office scene with animated characters, interactive tooltips, and responsive mobile support.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173` with hot module reloading.

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
  └── utils/
      ├── svgUtils.js            # Isometric projection & SVG primitives
      ├── characterUtils.js      # Character head & body rendering
      └── sceneGenerator.js      # Complete scene assembly
```

## Technical Details

- **Build tool**: Vite 5 with React Fast Refresh
- **Framework**: React 18 with Hooks
- **Styling**: CSS custom properties + CSS animations
- **SVG**: Procedurally generated isometric primitives (no external images)
- **Animation**: CSS keyframes + React state for dynamic positioning

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
- ✅ No gameplay systems (game-like scene only)
