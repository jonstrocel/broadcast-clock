(() => {
  const DEFAULT_TZ = "America/Vancouver";
  const DEFAULT_TARGET = "19:30";
  const MODE_CLOCK = "clock";
  const MODE_COUNTDOWN = "countdown";
  const MODE_STOPWATCH = "stopwatch";
  const validModes = new Set([MODE_CLOCK, MODE_COUNTDOWN, MODE_STOPWATCH]);

  const params = new URLSearchParams(window.location.search);

  const timeDisplay = document.getElementById("timeDisplay");
  const dateDisplay = document.getElementById("dateDisplay");
  const modeLabel = document.getElementById("modeLabel");
  const tzLabel = document.getElementById("tzLabel");
  const countdownForm = document.getElementById("countdownForm");
  const targetInput = document.getElementById("targetInput");

  const state = {
    mode: normalizeMode(params.get("mode")),
    timezone: normalizeTimezone(params.get("timezone") || params.get("tz") || DEFAULT_TZ),
    countdownTarget: parseTargetTime(params.get("target") || DEFAULT_TARGET),
    stopwatchElapsedMs: 0,
    stopwatchRunning: false,
    stopwatchStartedAtMs: 0,
  };

  function normalizeMode(mode) {
    const value = (mode || MODE_CLOCK).toLowerCase();
    return validModes.has(value) ? value : MODE_CLOCK;
  }

  function normalizeTimezone(tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
      return tz;
    } catch {
      return DEFAULT_TZ;
    }
  }

  function parseTargetTime(text) {
    const match = /^(\d{1,2}):(\d{2})$/.exec((text || "").trim());
    if (!match) return parseTargetTime(DEFAULT_TARGET);

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return parseTargetTime(DEFAULT_TARGET);

    return {
      hour,
      minute,
      raw: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  function getZonedParts(date) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: state.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    });

    const parts = formatter.formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      second: Number(parts.second),
      weekday: (parts.weekday || "").toUpperCase(),
    };
  }

  function formatHms(totalSeconds) {
    const t = Math.max(0, totalSeconds);
    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = t % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function countdownRemaining(parts) {
    const nowSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
    const targetSeconds = state.countdownTarget.hour * 3600 + state.countdownTarget.minute * 60;
    let delta = targetSeconds - nowSeconds;
    if (delta < 0) delta += 24 * 3600;
    return delta;
  }

  function formatDate(parts) {
    return `${parts.weekday} ${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  }

  function updateQueryParams() {
    const next = new URLSearchParams();
    next.set("mode", state.mode);
    next.set("timezone", state.timezone);
    if (state.mode === MODE_COUNTDOWN) next.set("target", state.countdownTarget.raw);
    history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  }

  function updateLabels() {
    modeLabel.textContent = state.mode.toUpperCase();
    tzLabel.textContent = state.timezone;
    countdownForm.classList.toggle("is-visible", state.mode === MODE_COUNTDOWN);
    targetInput.value = state.countdownTarget.raw;
  }

  function render() {
    const now = new Date();
    const zoned = getZonedParts(now);

    if (state.mode === MODE_CLOCK) {
      timeDisplay.textContent = `${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")}:${String(zoned.second).padStart(2, "0")}`;
      dateDisplay.textContent = formatDate(zoned);
      return;
    }

    if (state.mode === MODE_COUNTDOWN) {
      timeDisplay.textContent = formatHms(countdownRemaining(zoned));
      dateDisplay.textContent = `TARGET ${state.countdownTarget.raw} ${state.timezone}`;
      return;
    }

    const elapsed = state.stopwatchElapsedMs + (state.stopwatchRunning ? Date.now() - state.stopwatchStartedAtMs : 0);
    timeDisplay.textContent = formatHms(Math.floor(elapsed / 1000));
    dateDisplay.textContent = state.stopwatchRunning ? "RUNNING" : "PAUSED";
  }

  function setMode(mode) {
    if (!validModes.has(mode)) return;
    state.mode = mode;
    updateLabels();
    updateQueryParams();
    render();
  }

  function toggleStopwatch() {
    if (state.stopwatchRunning) {
      state.stopwatchElapsedMs += Date.now() - state.stopwatchStartedAtMs;
      state.stopwatchRunning = false;
      return;
    }
    state.stopwatchStartedAtMs = Date.now();
    state.stopwatchRunning = true;
  }

  function resetStopwatch() {
    state.stopwatchElapsedMs = 0;
    if (state.stopwatchRunning) state.stopwatchStartedAtMs = Date.now();
  }

  countdownForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.countdownTarget = parseTargetTime(targetInput.value);
    updateQueryParams();
    updateLabels();
    render();
  });

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;

    const key = event.key.toLowerCase();
    if (key === "c") setMode(MODE_CLOCK);
    else if (key === "d") setMode(MODE_COUNTDOWN);
    else if (key === "s") setMode(MODE_STOPWATCH);
    else if (event.code === "Space") {
      event.preventDefault();
      if (state.mode === MODE_STOPWATCH) toggleStopwatch();
    } else if (key === "r" && state.mode === MODE_STOPWATCH) {
      resetStopwatch();
    }

    render();
  });

  updateLabels();
  updateQueryParams();
  render();
  setInterval(render, 250);
})();
