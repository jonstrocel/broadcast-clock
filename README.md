# Broadcast Clock v1.1

Broadcast Clock is a static confidence-monitor timer display designed for live production use. It runs as plain HTML/CSS/JS and works directly on GitHub Pages.

## Features

- Broadcast-safe 16:9 monitor styling on a black background
- Three modes:
  - `clock`
  - `countdown`
  - `stopwatch`
- Countdown target input with a **Set** button (`HH:MM`, 24-hour)
- Keyboard controls for fast operation
- URL parameters for mode, target time, and timezone
- Dependency-free: no build tools, no external libraries

## Quick start

Open `index.html` locally, or publish the repository using GitHub Pages.

## URL parameters

Example:

- `?mode=countdown&target=19:30&timezone=America/Vancouver`

Supported parameters:

- `mode` — `clock`, `countdown`, `stopwatch`
- `target` — countdown target in `HH:MM` format
- `timezone` — IANA timezone value (for example `America/Vancouver`)
- `tz` — legacy alias for timezone (still accepted)

Invalid values automatically fall back to:

- `mode=clock`
- `timezone=America/Vancouver`
- `target=19:30`

## Keyboard shortcuts

- `C` — Clock mode
- `D` — Countdown mode
- `S` — Stopwatch mode
- `Space` — Start/Pause stopwatch
- `R` — Reset stopwatch

## GitHub Pages compatibility

This app is fully static and GitHub Pages compatible:

- `index.html`
- `style.css`
- `script.js`

No bundling or server-side runtime required.
