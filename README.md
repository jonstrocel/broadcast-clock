# Broadcast Clock

A static, broadcast-safe confidence monitor clock that runs directly in the browser (including GitHub Pages).

## Features

- Fullscreen black background with a professional confidence-monitor look
- Oversized `HH:MM:SS` readout with tighter broadcast-style spacing
- Default timezone: `America/Vancouver`
- URL-controlled mode, timezone, and countdown target
- Countdown target input field for quick on-the-fly changes
- Keyboard controls for live operation
- No build tools and no external dependencies

## Usage

Open `index.html` directly or host via GitHub Pages.

### URL parameters

- `?tz=America/Vancouver`
- `?mode=countdown&target=19:30`

Supported `mode` values:

- `clock`
- `countdown`
- `stopwatch`

`target` is used in countdown mode and must be `HH:MM` (24-hour).

## Countdown target input

When in countdown mode, use the target input field at the bottom to change the target time (`HH:MM`). Press `Enter` or click away to apply.

## Keyboard shortcuts

- `C` = clock mode
- `D` = countdown mode
- `S` = stopwatch mode
- `Space` = start/pause stopwatch
- `R` = reset stopwatch
