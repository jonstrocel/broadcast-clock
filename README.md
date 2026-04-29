# Broadcast Clock

A static, broadcast-safe confidence monitor clock that runs directly in the browser (including GitHub Pages).

## Features

- Fullscreen black background with a clean 16:9 safe-area frame
- Large `HH:MM:SS` readout and date line
- Default timezone: `America/Vancouver`
- URL-controlled mode and timezone
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

## Keyboard shortcuts

- `C` = clock mode
- `D` = countdown mode
- `S` = stopwatch mode
- `Space` = start/pause stopwatch
- `R` = reset stopwatch
