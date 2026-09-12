export type FocusTimerMode = "stopwatch" | "countdown";

export interface InactiveFocusTimerState {
  mode: null;
}

export interface ActiveFocusTimerState {
  mode: FocusTimerMode;
  startedAt: number;
  durationSeconds: number | null;
  /** Timestamp the timer was paused at, or null while it is running. */
  pausedAt: number | null;
  /** Total time already spent paused, excluded from the elapsed time. */
  pausedTotalMs: number;
}

export type FocusTimerState =
  | InactiveFocusTimerState
  | ActiveFocusTimerState;

export interface FocusTimerEvaluation {
  state: FocusTimerState;
  display: string | null;
  completed: boolean;
}

export function createInactiveFocusTimer(): FocusTimerState {
  return { mode: null };
}

export function startStopwatch(now: number): FocusTimerState {
  return {
    mode: "stopwatch",
    startedAt: now,
    durationSeconds: null,
    pausedAt: null,
    pausedTotalMs: 0,
  };
}

export function startCountdown(
  now: number,
  durationMinutes: number,
): FocusTimerState {
  const safeMinutes = Math.min(180, Math.max(1, Math.round(durationMinutes)));

  return {
    mode: "countdown",
    startedAt: now,
    durationSeconds: safeMinutes * 60,
    pausedAt: null,
    pausedTotalMs: 0,
  };
}

export function stopFocusTimer(): FocusTimerState {
  return createInactiveFocusTimer();
}

export function isFocusTimerPaused(state: FocusTimerState): boolean {
  return state.mode !== null && state.pausedAt !== null;
}

export function isFocusTimerActive(state: FocusTimerState): boolean {
  return state.mode !== null;
}

export function pauseFocusTimer(
  now: number,
  state: FocusTimerState,
): FocusTimerState {
  if (state.mode === null || state.pausedAt !== null) {
    return state;
  }

  return { ...state, pausedAt: now };
}

export function resumeFocusTimer(
  now: number,
  state: FocusTimerState,
): FocusTimerState {
  if (state.mode === null || state.pausedAt === null) {
    return state;
  }

  return {
    ...state,
    pausedAt: null,
    pausedTotalMs: state.pausedTotalMs + Math.max(0, now - state.pausedAt),
  };
}

export function formatTimerSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function evaluateFocusTimer(
  now: number,
  state: FocusTimerState,
): FocusTimerEvaluation {
  if (state.mode === null) {
    return {
      state,
      display: null,
      completed: false,
    };
  }

  // While paused the clock is frozen: keep measuring against the pause instant
  // and ignore time spent paused, so the display stops ticking.
  const referenceNow = state.pausedAt ?? now;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((referenceNow - state.startedAt - state.pausedTotalMs) / 1000),
  );

  if (state.mode === "stopwatch") {
    return {
      state,
      display: formatTimerSeconds(elapsedSeconds),
      completed: false,
    };
  }

  const remainingSeconds = Math.max(
    0,
    (state.durationSeconds ?? 0) - elapsedSeconds,
  );
  // A paused timer never completes: the user stopped the clock on purpose.
  const completed = remainingSeconds === 0 && state.pausedAt === null;

  return {
    state: completed ? createInactiveFocusTimer() : state,
    display: formatTimerSeconds(remainingSeconds),
    completed,
  };
}
