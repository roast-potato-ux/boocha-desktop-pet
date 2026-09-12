export type FocusTimerMode = "stopwatch" | "countdown";

export interface InactiveFocusTimerState {
  mode: null;
}

export interface ActiveFocusTimerState {
  mode: FocusTimerMode;
  startedAt: number;
  durationSeconds: number | null;
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
  };
}

export function stopFocusTimer(): FocusTimerState {
  return createInactiveFocusTimer();
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

  const elapsedSeconds = Math.max(0, Math.floor((now - state.startedAt) / 1000));

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
  const completed = remainingSeconds === 0;

  return {
    state: completed ? createInactiveFocusTimer() : state,
    display: formatTimerSeconds(remainingSeconds),
    completed,
  };
}
