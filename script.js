(() => {
  const DEFAULT_TZ = "America/Vancouver";
  const MODE_CLOCK = "clock";
  const MODE_COUNTDOWN = "countdown";
  const MODE_STOPWATCH = "stopwatch";

  const params = new URLSearchParams(window.location.search);
  const requestedMode = (params.get("mode") || MODE_CLOCK).toLowerCase();
  const requestedTz = params.get("tz") || DEFAULT_TZ;
  const targetClock = params.get("target") || "19:30";

  const validModes = new Set([MODE_CLOCK, MODE_COUNTDOWN, MODE_STOPWATCH]);

  const timeDisplay = document.getElementById("timeDisplay");
  const dateDisplay = document.getElementById("dateDisplay");
  const modeLabel = document.getElementById("modeLabel");
  const tzLabel = document.getElementById("tzLabel");
  const targetControl = document.querySelector(".target-control");
  const targetInput = document.getElementById("targetInput");

  const state = {
    mode: validModes.has(requestedMode) ? requestedMode : MODE_CLOCK,
    timezone: requestedTz,
    countdownTarget: parseTargetTime(targetClock),
    stopwatchElapsedMs: 0,
    stopwatchRunning: false,
    stopwatchStartedAt: null,
  };

  function isValidTimezone(tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  if (!isValidTimezone(state.timezone)) {
    state.timezone = DEFAULT_TZ;
  }

  function parseTargetTime(input) {
    const matched = /^(\d{1,2}):(\d{2})$/.exec(input || "");
    if (!matched) return { hour: 19, minute: 30, raw: "19:30" };

    const hour = Number(matched[1]);
    const minute = Number(matched[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return { hour: 19, minute: 30, raw: "19:30" };

    return { hour, minute, raw: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
  }

  function getZonedParts(date, timezone) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
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
      year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
      hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
      weekday: (parts.weekday || "").toUpperCase(),
    };
  }

  function formatHms(totalSeconds) {
    const clamped = Math.max(0, totalSeconds);
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = clamped % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function getCountdownSeconds(nowParts) {
    const nowSeconds = nowParts.hour * 3600 + nowParts.minute * 60 + nowParts.second;
    const targetSeconds = state.countdownTarget.hour * 3600 + state.countdownTarget.minute * 60;
    let delta = targetSeconds - nowSeconds;
    if (delta < 0) delta += 24 * 3600;
    return delta;
  }

  function formatDateLine(parts) {
    return `${parts.weekday} ${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  }

  function updateLabels() {
    modeLabel.textContent = state.mode.toUpperCase();
    tzLabel.textContent = state.timezone;
    targetControl.classList.toggle("is-visible", state.mode === MODE_COUNTDOWN);
    if (targetInput) targetInput.value = state.countdownTarget.raw;
  }

  function render() {
    const now = new Date();
    const zoned = getZonedParts(now, state.timezone);

    if (state.mode === MODE_CLOCK) {
      timeDisplay.textContent = `${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")}:${String(zoned.second).padStart(2, "0")}`;
      dateDisplay.textContent = formatDateLine(zoned);
    } else if (state.mode === MODE_COUNTDOWN) {
      timeDisplay.textContent = formatHms(getCountdownSeconds(zoned));
      dateDisplay.textContent = `TARGET ${state.countdownTarget.raw} ${state.timezone}`;
    } else {
      const elapsed = state.stopwatchElapsedMs + (state.stopwatchRunning ? now - state.stopwatchStartedAt : 0);
      timeDisplay.textContent = formatHms(Math.floor(elapsed / 1000));
      dateDisplay.textContent = state.stopwatchRunning ? "RUNNING" : "PAUSED";
    }
  }

  function setMode(mode) {
    if (!validModes.has(mode)) return;
    state.mode = mode;
    updateLabels();
    render();
  }

  function toggleStopwatch() {
    const now = Date.now();
    if (state.stopwatchRunning) {
      state.stopwatchElapsedMs += now - state.stopwatchStartedAt;
      state.stopwatchStartedAt = null;
      state.stopwatchRunning = false;
    } else {
      state.stopwatchStartedAt = now;
      state.stopwatchRunning = true;
    }
  }

  function resetStopwatch() {
    state.stopwatchElapsedMs = 0;
    state.stopwatchStartedAt = state.stopwatchRunning ? Date.now() : null;
  }

  function applyTargetFromInput() {
    if (!targetInput) return;
    state.countdownTarget = parseTargetTime(targetInput.value.trim());
    targetInput.value = state.countdownTarget.raw;
    render();
  }

  if (targetInput) {
    targetInput.value = state.countdownTarget.raw;
    targetInput.addEventListener("change", applyTargetFromInput);
    targetInput.addEventListener("blur", applyTargetFromInput);
    targetInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyTargetFromInput();
      }
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;

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
