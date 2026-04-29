(() => {
  const DEFAULT_TZ = "America/Vancouver";
  const MODE_CLOCK = "clock";
  const MODE_COUNTDOWN = "countdown";
  const MODE_STOPWATCH = "stopwatch";

  const params = new URLSearchParams(window.location.search);
  const requestedMode = (params.get("mode") || MODE_CLOCK).toLowerCase();
  const requestedTz = params.get("tz") || DEFAULT_TZ;
  const requestedTarget = params.get("target") || "19:30";

  const validModes = new Set([MODE_CLOCK, MODE_COUNTDOWN, MODE_STOPWATCH]);

  const timeDisplay = document.getElementById("timeDisplay");
  const dateDisplay = document.getElementById("dateDisplay");
  const modeLabel = document.getElementById("modeLabel");
  const tzLabel = document.getElementById("tzLabel");
  const countdownForm = document.getElementById("countdownForm");
  const targetInput = document.getElementById("targetInput");

  const state = {
    mode: validModes.has(requestedMode) ? requestedMode : MODE_CLOCK,
    timezone: requestedTz,
    countdownTarget: parseTargetTime(requestedTarget),
    stopwatchElapsedMs: 0,
    stopwatchRunning: false,
    stopwatchStartedAtMs: 0,
  };

  if (!isValidTimezone(state.timezone)) state.timezone = DEFAULT_TZ;

  function isValidTimezone(timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  function parseTargetTime(text) {
    const m = /^(\d{1,2}):(\d{2})$/.exec((text || "").trim());
    if (!m) return { hour: 19, minute: 30, raw: "19:30" };

    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour > 23 || minute > 59) return { hour: 19, minute: 30, raw: "19:30" };

    return {
      hour,
      minute,
      raw: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  function getZonedNowParts() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: state.timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date()).reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

    return {
      weekday: (parts.weekday || "").toUpperCase(),
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      second: Number(parts.second),
    };
  }

  function formatHms(totalSeconds) {
    const v = Math.max(0, totalSeconds);
    const h = Math.floor(v / 3600);
    const m = Math.floor((v % 3600) / 60);
    const s = v % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatDate(parts) {
    return `${parts.weekday} ${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  }

  function countdownRemainingSeconds(nowParts) {
    const now = nowParts.hour * 3600 + nowParts.minute * 60 + nowParts.second;
    const target = state.countdownTarget.hour * 3600 + state.countdownTarget.minute * 60;
    return target >= now ? target - now : target + 24 * 3600 - now;
  }

  function updateLabels() {
    modeLabel.textContent = state.mode.toUpperCase();
    tzLabel.textContent = state.timezone;
    countdownForm.classList.toggle("is-visible", state.mode === MODE_COUNTDOWN);
    targetInput.value = state.countdownTarget.raw;
  }

  function render() {
    const now = getZonedNowParts();

    if (state.mode === MODE_CLOCK) {
      timeDisplay.textContent = `${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}:${String(now.second).padStart(2, "0")}`;
      dateDisplay.textContent = formatDate(now);
      return;
    }

    if (state.mode === MODE_COUNTDOWN) {
      timeDisplay.textContent = formatHms(countdownRemainingSeconds(now));
      dateDisplay.textContent = `TARGET ${state.countdownTarget.raw} ${state.timezone}`;
      return;
    }

    const elapsedMs = state.stopwatchElapsedMs + (state.stopwatchRunning ? Date.now() - state.stopwatchStartedAtMs : 0);
    timeDisplay.textContent = formatHms(Math.floor(elapsedMs / 1000));
    dateDisplay.textContent = state.stopwatchRunning ? "RUNNING" : "PAUSED";
  }

  function setMode(mode) {
    if (!validModes.has(mode)) return;
    state.mode = mode;
    updateLabels();
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
    state.stopwatchStartedAtMs = state.stopwatchRunning ? Date.now() : 0;
  }

  function applyCountdownTarget(value) {
    state.countdownTarget = parseTargetTime(value);
    targetInput.value = state.countdownTarget.raw;
    render();
  }

  countdownForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyCountdownTarget(targetInput.value);
  });

  targetInput.addEventListener("change", () => applyCountdownTarget(targetInput.value));

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
  render();
  setInterval(render, 1000);
})();
