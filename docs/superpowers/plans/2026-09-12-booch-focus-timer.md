# Booch Focus Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add countdown / stopwatch focus modes, right-click quick actions, timer badge, and revised automation/settings rules to Booch Desktop Pet.

**Architecture:** Keep focus timing separate from the visible pet state machine. A new pure `focusTimer` module owns stopwatch/countdown state and formatting; `App.tsx` coordinates it with existing pet state, schedulers, settings, and window resizing. UI is split into small components: `QuickActions` for right-click radial buttons and `TimerBadge` for the frosted glass time display.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Tauri 2, CSS, existing localStorage settings.

**Spec:** `docs/superpowers/specs/2026-09-12-booch-focus-timer-design.md`

## Global Constraints

- Keep visible pet states limited to `idle`, `work`, and `eat`.
- Focus timer / countdown runs locally only; no remote sync, sound, statistics, or system notification in this feature.
- During stopwatch/countdown, force visual pet state to `work`, suppress normal bubbles, suppress ambient idle bubbles, and suppress meal reminder switching.
- Countdown end forces visual state to `idle` and shows the user-editable completion bubble.
- Right-click pet shows three circular frosted-glass buttons: countdown, stopwatch, settings.
- Countdown quick choices are `5`, `15`, `30`, and custom minutes from settings.
- Settings panel removes reminder pause, quiet hours, and work auto-duration controls.
- Settings panel must keep the pet visible and allow real-time scale preview.
- Keep storage in `localStorage` for this implementation.

---

## File Structure

- Create `src/pet/focusTimer.ts`: pure focus timer state, event reducer, selectors, and time formatting.
- Create `src/pet/focusTimer.test.ts`: unit coverage for stopwatch, countdown, formatting, and completion.
- Create `src/pet/QuickActions.tsx`: right-click circular action buttons and countdown option buttons.
- Create `src/pet/TimerBadge.tsx`: frosted glass time label shown above the pet.
- Modify `src/pet/types.ts`: track prior state for meal return behavior if needed.
- Modify `src/pet/stateMachine.ts` and `src/pet/stateMachine.test.ts`: meal return goes to previous state; work state no longer auto-returns.
- Modify `src/pet/petSettings.ts` and `src/pet/petSettings.test.ts`: remove pause/quiet-hour settings, remove work duration, add timer settings and completion bubble.
- Modify `src/pet/mealScheduler.ts` and `src/pet/mealScheduler.test.ts`: remove pause/quiet-hours and add a simple `blocked` option for focus timer suppression.
- Modify `src/pet/SettingsPanel.tsx`: remove pause/quiet-hour/work duration fields; add custom countdown and completion bubble fields.
- Modify `src/pet/nativeWindowClient.ts`: add a combined pet + settings window size while leaving pet visible.
- Modify `src/App.tsx`: wire focus timer, quick actions, timer badge, meal suppression, no work auto-return, settings live preview.
- Modify `src/styles.css`: add radial buttons, countdown choices, timer badge, and side-by-side settings layout.
- Optionally update `docs/runbook.md`: user-facing behavior summary.

---

### Task 1: Add pure focus timer logic

**Files:**
- Create: `src/pet/focusTimer.ts`
- Create: `src/pet/focusTimer.test.ts`

**Interfaces:**
- Produces:
  - `type FocusTimerMode = "stopwatch" | "countdown"`
  - `interface FocusTimerState`
  - `createInactiveFocusTimer(): FocusTimerState`
  - `startStopwatch(now: number): FocusTimerState`
  - `startCountdown(now: number, durationMinutes: number): FocusTimerState`
  - `stopFocusTimer(): FocusTimerState`
  - `evaluateFocusTimer(now: number, state: FocusTimerState): FocusTimerEvaluation`
  - `formatTimerSeconds(totalSeconds: number): string`

- [ ] **Step 1: Write the failing tests**

Create `src/pet/focusTimer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createInactiveFocusTimer,
  evaluateFocusTimer,
  formatTimerSeconds,
  startCountdown,
  startStopwatch,
  stopFocusTimer,
} from "./focusTimer";

describe("focusTimer", () => {
  it("formats timer seconds as mm:ss", () => {
    expect(formatTimerSeconds(0)).toBe("00:00");
    expect(formatTimerSeconds(5)).toBe("00:05");
    expect(formatTimerSeconds(25 * 60)).toBe("25:00");
    expect(formatTimerSeconds(61 * 60 + 2)).toBe("61:02");
  });

  it("evaluates a running stopwatch", () => {
    const timer = startStopwatch(1_000);
    const result = evaluateFocusTimer(66_000, timer);

    expect(result.display).toBe("01:05");
    expect(result.completed).toBe(false);
    expect(result.state.mode).toBe("stopwatch");
  });

  it("evaluates a running countdown", () => {
    const timer = startCountdown(1_000, 5);
    const result = evaluateFocusTimer(61_000, timer);

    expect(result.display).toBe("04:00");
    expect(result.completed).toBe(false);
    expect(result.state.mode).toBe("countdown");
  });

  it("completes a countdown at zero", () => {
    const timer = startCountdown(1_000, 5);
    const result = evaluateFocusTimer(301_000, timer);

    expect(result.display).toBe("00:00");
    expect(result.completed).toBe(true);
    expect(result.state).toEqual(createInactiveFocusTimer());
  });

  it("stops any running focus timer", () => {
    expect(stopFocusTimer()).toEqual(createInactiveFocusTimer());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pet/focusTimer.test.ts
```

Expected: FAIL because `src/pet/focusTimer.ts` does not exist.

- [ ] **Step 3: Implement the pure module**

Create `src/pet/focusTimer.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/pet/focusTimer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pet/focusTimer.ts src/pet/focusTimer.test.ts
git commit -m "feat: add focus timer logic"
```

---

### Task 2: Update settings and scheduler rules

**Files:**
- Modify: `src/pet/petSettings.ts`
- Modify: `src/pet/petSettings.test.ts`
- Modify: `src/pet/mealScheduler.ts`
- Modify: `src/pet/mealScheduler.test.ts`

**Interfaces:**
- Consumes: none from Task 1.
- Produces:
  - `PetSettings["timer"]` with `{ customCountdownMinutes: number; countdownCompleteLines: string[] }`
  - `evaluateMealReminder(..., { blocked: boolean, meals })` suppresses meals while focus timer runs.

- [ ] **Step 1: Write the failing settings tests**

Update `src/pet/petSettings.test.ts`:

```ts
it("provides focus timer defaults and no longer exposes pause or quiet hours", () => {
  const settings = createDefaultPetSettings();

  expect(settings).toMatchObject({
    timer: {
      customCountdownMinutes: 25,
      countdownCompleteLines: ["时间到，休息一下"],
    },
  });
  expect("remindersPaused" in settings).toBe(false);
  expect("focusQuietHours" in settings).toBe(false);
  expect("workMinutes" in settings.durations).toBe(false);
});

it("normalizes custom countdown settings", () => {
  const settings = normalizePetSettings({
    timer: {
      customCountdownMinutes: 999,
      countdownCompleteLines: ["  完成啦  "],
    },
  });

  expect(settings.timer.customCountdownMinutes).toBe(180);
  expect(settings.timer.countdownCompleteLines).toEqual(["完成啦"]);
});
```

Also update the existing expectations:

```ts
expect(createDefaultPetSettings()).toMatchObject({
  scale: 1,
  durations: {
    eatSeconds: 30,
    idleInteractionMinutes: 3,
  },
  meals: {
    lunch: "12:00",
    dinner: "18:30",
  },
});
```

- [ ] **Step 2: Write the failing meal scheduler test**

Update `src/pet/mealScheduler.test.ts`:

```ts
it("does not trigger meal reminders while focus timer blocks automatic switches", () => {
  const result = evaluateMealReminder(
    new Date("2026-09-06T12:00:00+08:00"),
    emptyState,
    { blocked: true },
  );

  expect(result.event).toBeNull();
  expect(result.state).toBe(emptyState);
});
```

Remove tests that assert `paused` and `focusQuietHours` behavior, because those settings are removed.

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- src/pet/petSettings.test.ts src/pet/mealScheduler.test.ts
```

Expected: FAIL because interfaces still contain old fields and no timer settings.

- [ ] **Step 4: Update `PetSettings`**

Change `src/pet/petSettings.ts` interfaces:

```ts
export interface PetSettings {
  scale: number;
  durations: {
    eatSeconds: number;
    idleInteractionMinutes: number;
  };
  meals: {
    lunch: string;
    dinner: string;
  };
  bubbles: PetBubbleSettings;
  timer: {
    customCountdownMinutes: number;
    countdownCompleteLines: string[];
  };
}
```

Default:

```ts
timer: {
  customCountdownMinutes: 25,
  countdownCompleteLines: ["时间到，休息一下"],
},
```

In `normalizePetSettings`, read `timer`:

```ts
const timer =
  source.timer !== null && typeof source.timer === "object"
    ? (source.timer as Record<string, unknown>)
    : {};
```

Return normalized timer:

```ts
timer: {
  customCountdownMinutes: clamp(
    timer.customCountdownMinutes,
    1,
    180,
    defaults.timer.customCountdownMinutes,
  ),
  countdownCompleteLines: normalizeLines(
    timer.countdownCompleteLines,
    defaults.timer.countdownCompleteLines,
  ),
},
```

Remove `workMinutes`, `remindersPaused`, and `focusQuietHours` from defaults and normalization.

- [ ] **Step 5: Update meal scheduler options**

Change `src/pet/mealScheduler.ts` options:

```ts
interface MealReminderOptions {
  blocked?: boolean;
  meals?: {
    lunch: string;
    dinner: string;
  };
}
```

Change early return:

```ts
if (options.blocked) {
  return { event: null, state };
}
```

Remove `isWithinQuietHours` and quiet-hour parsing code that is no longer used.

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
npm test -- src/pet/petSettings.test.ts src/pet/mealScheduler.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pet/petSettings.ts src/pet/petSettings.test.ts src/pet/mealScheduler.ts src/pet/mealScheduler.test.ts
git commit -m "feat: update settings for focus timer"
```

---

### Task 3: Update pet state rules for previous-state meal return and no work auto-return

**Files:**
- Modify: `src/pet/types.ts`
- Modify: `src/pet/stateMachine.ts`
- Modify: `src/pet/stateMachine.test.ts`

**Interfaces:**
- Consumes: `PetSettings["timer"].countdownCompleteLines` from Task 2 only later in `App`.
- Produces:
  - `PetViewModel.previousState: PetState | null`
  - `PetEvent` includes `{ type: "countdown-complete"; bubble: string }`
  - `return-idle` event replaced or interpreted as meal return to previous state.

- [ ] **Step 1: Write failing state machine tests**

Update `src/pet/stateMachine.test.ts` initial fixture:

```ts
const idle: PetViewModel = {
  state: "idle",
  previousState: null,
  bubble: null,
  lastInteractionAt: 0,
};
```

Add:

```ts
it("returns from eating to the previous visible state", () => {
  const work: PetViewModel = {
    state: "work",
    previousState: null,
    bubble: null,
    lastInteractionAt: 1000,
  };
  const eating = reducePetState(
    work,
    { type: "meal-reminder", meal: "dinner" },
    2000,
  );
  const returned = reducePetState(eating, { type: "return-previous" }, 3000);

  expect(eating.previousState).toBe("work");
  expect(returned).toMatchObject({
    state: "work",
    previousState: null,
    bubble: null,
  });
});

it("shows countdown completion while switching to idle", () => {
  const work: PetViewModel = {
    state: "work",
    previousState: null,
    bubble: null,
    lastInteractionAt: 1000,
  };
  const result = reducePetState(
    work,
    { type: "countdown-complete", bubble: "时间到" },
    2000,
  );

  expect(result).toEqual({
    state: "idle",
    previousState: null,
    bubble: "时间到",
    lastInteractionAt: 2000,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pet/stateMachine.test.ts
```

Expected: FAIL because `previousState`, `return-previous`, and `countdown-complete` do not exist.

- [ ] **Step 3: Update types**

Change `src/pet/types.ts`:

```ts
export type PetEvent =
  | { type: "pet-click" }
  | { type: "ambient-interaction"; seed: number }
  | { type: "start-work" }
  | { type: "stop-work" }
  | { type: "select-state"; state: PetState }
  | { type: "meal-reminder"; meal: MealKind }
  | { type: "cycle-state" }
  | { type: "clear-bubble"; interactionAt: number }
  | { type: "return-previous" }
  | { type: "countdown-complete"; bubble: string };

export interface PetViewModel {
  state: PetState;
  previousState: PetState | null;
  bubble: string | null;
  lastInteractionAt: number;
}
```

- [ ] **Step 4: Update reducer behavior**

In `src/pet/stateMachine.ts`, ensure every returned `PetViewModel` includes `previousState`.

Meal reminder:

```ts
if (event.type === "meal-reminder") {
  return {
    state: "eat",
    previousState: current.state,
    bubble: pickLine(
      event.meal === "lunch" ? bubbles.lunch : bubbles.dinner,
      now,
    ),
    lastInteractionAt: now,
  };
}
```

Return previous:

```ts
if (event.type === "return-previous") {
  return {
    state: current.previousState ?? "idle",
    previousState: null,
    bubble: null,
    lastInteractionAt: now,
  };
}
```

Countdown complete:

```ts
if (event.type === "countdown-complete") {
  return {
    state: "idle",
    previousState: null,
    bubble: event.bubble,
    lastInteractionAt: now,
  };
}
```

Manual select/cycle/start/stop should reset `previousState` to `null`.

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npm test -- src/pet/stateMachine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pet/types.ts src/pet/stateMachine.ts src/pet/stateMachine.test.ts
git commit -m "feat: update pet state return rules"
```

---

### Task 4: Add quick action and timer badge components

**Files:**
- Create: `src/pet/QuickActions.tsx`
- Create: `src/pet/TimerBadge.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `onStartCountdown(minutes: number)`
  - `onStartCustomCountdown()`
  - `onToggleStopwatch()`
  - `onOpenSettings()`
- Produces:
  - `QuickActions` with `mode: "main" | "countdown"`
  - `TimerBadge` with `display: string`

- [ ] **Step 1: Create `TimerBadge`**

Create `src/pet/TimerBadge.tsx`:

```tsx
interface TimerBadgeProps {
  display: string;
}

export function TimerBadge({ display }: TimerBadgeProps) {
  return (
    <div className="timer-badge" aria-label={`计时 ${display}`}>
      {display}
    </div>
  );
}
```

- [ ] **Step 2: Create `QuickActions`**

Create `src/pet/QuickActions.tsx`:

```tsx
interface QuickActionsProps {
  mode: "main" | "countdown";
  onShowCountdownOptions: () => void;
  onStartCountdown: (minutes: number) => void;
  onStartCustomCountdown: () => void;
  onToggleStopwatch: () => void;
  onOpenSettings: () => void;
}

export function QuickActions({
  mode,
  onShowCountdownOptions,
  onStartCountdown,
  onStartCustomCountdown,
  onToggleStopwatch,
  onOpenSettings,
}: QuickActionsProps) {
  if (mode === "countdown") {
    return (
      <div className="quick-actions quick-actions--countdown" aria-label="倒计时选项">
        <button type="button" className="quick-action quick-action--top" onClick={() => onStartCountdown(5)}>
          5
        </button>
        <button type="button" className="quick-action quick-action--upper-right" onClick={() => onStartCountdown(15)}>
          15
        </button>
        <button type="button" className="quick-action quick-action--right" onClick={() => onStartCountdown(30)}>
          30
        </button>
        <button type="button" className="quick-action quick-action--lower-right" onClick={onStartCustomCountdown}>
          自
        </button>
      </div>
    );
  }

  return (
    <div className="quick-actions" aria-label="桌宠快捷操作">
      <button type="button" className="quick-action quick-action--top" aria-label="倒计时" onClick={onShowCountdownOptions}>
        ⏳
      </button>
      <button type="button" className="quick-action quick-action--right" aria-label="计时器" onClick={onToggleStopwatch}>
        ⏱
      </button>
      <button type="button" className="quick-action quick-action--lower-right" aria-label="设置" onClick={onOpenSettings}>
        ⚙
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Add CSS for the new components**

Append to `src/styles.css`:

```css
.timer-badge {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 3;
  min-width: 70px;
  padding: 7px 12px;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 13px;
  background: rgb(255 255 255 / 72%);
  -webkit-backdrop-filter: blur(14px) saturate(1.6);
  backdrop-filter: blur(14px) saturate(1.6);
  box-shadow: 0 3px 10px rgb(60 47 30 / 12%);
  color: #26221c;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  text-align: center;
  transform: translate(-50%, 10px);
}

.quick-actions {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.quick-action {
  position: absolute;
  width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 62%);
  border-radius: 999px;
  background: rgb(255 255 255 / 68%);
  -webkit-backdrop-filter: blur(16px) saturate(1.65);
  backdrop-filter: blur(16px) saturate(1.65);
  box-shadow: 0 4px 14px rgb(60 47 30 / 14%);
  color: #25211d;
  cursor: pointer;
  font-size: 17px;
  pointer-events: auto;
}

.quick-action--top {
  left: 50%;
  top: 4px;
  transform: translateX(-50%);
}

.quick-action--upper-right {
  right: 6px;
  top: 52px;
}

.quick-action--right {
  right: -4px;
  top: 104px;
}

.quick-action--lower-right {
  right: 18px;
  bottom: 22px;
}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pet/QuickActions.tsx src/pet/TimerBadge.tsx src/styles.css
git commit -m "feat: add focus timer controls UI"
```

---

### Task 5: Wire focus timer into App behavior and window layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pet/nativeWindowClient.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `evaluateFocusTimer`, `startCountdown`, `startStopwatch`, `stopFocusTimer`
  - `QuickActions`
  - `TimerBadge`
  - `PetSettings["timer"]`
- Produces:
  - Working focus timer/countdown UX.
  - Settings panel side-by-side with pet still visible.

- [ ] **Step 1: Update `initialPet`**

In `src/App.tsx`:

```ts
const initialPet: PetViewModel = {
  state: "idle",
  previousState: null,
  bubble: null,
  lastInteractionAt: Date.now(),
};
```

- [ ] **Step 2: Import focus timer and new UI**

```ts
import { QuickActions } from "./pet/QuickActions";
import { TimerBadge } from "./pet/TimerBadge";
import {
  createInactiveFocusTimer,
  evaluateFocusTimer,
  startCountdown,
  startStopwatch,
  stopFocusTimer,
} from "./pet/focusTimer";
import type { FocusTimerState } from "./pet/focusTimer";
```

- [ ] **Step 3: Add App state**

```ts
const [focusTimer, setFocusTimer] = useState<FocusTimerState>(() =>
  createInactiveFocusTimer(),
);
const [timerDisplay, setTimerDisplay] = useState<string | null>(null);
const [quickActionsOpen, setQuickActionsOpen] = useState(false);
const [quickActionMode, setQuickActionMode] = useState<"main" | "countdown">(
  "main",
);
```

Derived values:

```ts
const focusTimerActive = focusTimer.mode !== null;
const visiblePet = focusTimerActive
  ? { ...pet, state: "work" as const, bubble: null }
  : pet;
```

- [ ] **Step 4: Add timer tick effect**

```ts
useEffect(() => {
  const tick = () => {
    setFocusTimer((current) => {
      const result = evaluateFocusTimer(Date.now(), current);
      setTimerDisplay(result.display);

      if (result.completed) {
        const line = settings.timer.countdownCompleteLines[0] ?? "时间到，休息一下";
        dispatchPet({ type: "countdown-complete", bubble: line });
      }

      return result.state;
    });
  };

  tick();
  const timer = window.setInterval(tick, 1000);

  return () => {
    window.clearInterval(timer);
  };
}, [dispatchPet, settings.timer.countdownCompleteLines]);
```

- [ ] **Step 5: Suppress meal and ambient behavior during focus timer**

Meal scheduler call:

```ts
const result = evaluateMealReminder(new Date(), mealReminderState.current, {
  blocked: focusTimer.mode !== null,
  meals: settings.meals,
});
```

Ambient scheduler effect should early return while focus timer is active:

```ts
if (focusTimer.mode !== null) {
  return;
}
```

Use `visiblePet` for rendering only; scheduler continues to read actual `pet`.

- [ ] **Step 6: Remove work auto-return effect and change eat auto-return**

Delete the effect that checks `pet.state !== "work"` and dispatches `return-idle`.

Change eat timer dispatch:

```ts
dispatchPet({ type: "return-previous" });
```

- [ ] **Step 7: Add focus timer handlers**

```ts
const closeQuickActions = () => {
  setQuickActionsOpen(false);
  setQuickActionMode("main");
};

const startCountdownForMinutes = (minutes: number) => {
  setFocusTimer(startCountdown(Date.now(), minutes));
  setTimerDisplay(null);
  dispatchPet({ type: "select-state", state: "work" });
  closeQuickActions();
};

const toggleStopwatch = () => {
  if (focusTimer.mode === "stopwatch") {
    setFocusTimer(stopFocusTimer());
    setTimerDisplay(null);
    dispatchPet({ type: "select-state", state: "idle" });
    closeQuickActions();
    return;
  }

  setFocusTimer(startStopwatch(Date.now()));
  setTimerDisplay(null);
  dispatchPet({ type: "select-state", state: "work" });
  closeQuickActions();
};
```

- [ ] **Step 8: Replace right-click behavior**

Change `onContextMenu`:

```ts
onContextMenu={(event) => {
  event.preventDefault();
  setQuickActionsOpen((open) => !open);
  setQuickActionMode("main");
}}
```

- [ ] **Step 9: Render quick actions and timer badge**

Inside `.pet-scale-frame`:

```tsx
{focusTimerActive && timerDisplay ? <TimerBadge display={timerDisplay} /> : null}
{!focusTimerActive && pet.bubble ? <Bubble text={pet.bubble} /> : null}
{quickActionsOpen ? (
  <QuickActions
    mode={quickActionMode}
    onShowCountdownOptions={() => setQuickActionMode("countdown")}
    onStartCountdown={startCountdownForMinutes}
    onStartCustomCountdown={() =>
      startCountdownForMinutes(settings.timer.customCountdownMinutes)
    }
    onToggleStopwatch={toggleStopwatch}
    onOpenSettings={() => {
      closeQuickActions();
      setSettingsOpen(true);
    }}
  />
) : null}
<PetSprite
  pet={visiblePet}
  onClick={() => {
    if (!focusTimerActive) {
      dispatchPet({ type: "pet-click" });
    }
  }}
  onToggleWork={() => {
    if (!focusTimerActive) {
      dispatchPet({ type: "cycle-state" });
    }
  }}
/>
```

- [ ] **Step 10: Keep pet visible with settings panel**

In `src/styles.css`, remove:

```css
.pet-stage--settings .pet-anchor {
  display: none;
}
```

Add layout:

```css
.pet-stage--settings {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  box-sizing: border-box;
}

.pet-stage--settings .pet-anchor {
  position: relative;
  flex: 0 0 auto;
}

.pet-stage--settings .settings-panel {
  width: 460px;
  max-height: 100%;
  overflow-y: auto;
}
```

- [ ] **Step 11: Update native window size for settings plus pet**

In `src/pet/nativeWindowClient.ts`:

```ts
const settingsWindowWidth = 720;
const settingsWindowHeight = 700;
```

Keep existing `resizeWindowForSettingsPanel` API name so `App` does not need another native call.

- [ ] **Step 12: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add src/App.tsx src/pet/nativeWindowClient.ts src/styles.css
git commit -m "feat: wire focus timer interactions"
```

---

### Task 6: Update settings panel fields and finish verification

**Files:**
- Modify: `src/pet/SettingsPanel.tsx`
- Modify: `src/styles.css`
- Modify: `docs/runbook.md`

**Interfaces:**
- Consumes:
  - `PetSettings["timer"].customCountdownMinutes`
  - `PetSettings["timer"].countdownCompleteLines`
- Produces: Settings panel matching spec.

- [ ] **Step 1: Remove old setting controls**

In `src/pet/SettingsPanel.tsx`, remove:

```tsx
<label>
  工作状态显示分钟数
  ...
</label>
```

Remove the entire pause checkbox, quiet-hours checkbox, and start/end quiet-hour controls.

Remove `updateFocusQuietHours`.

- [ ] **Step 2: Add timer settings helper**

Add:

```ts
const updateTimer = (next: Partial<PetSettings["timer"]>) => {
  updateDraft({ timer: { ...draft.timer, ...next } });
};
```

- [ ] **Step 3: Add timer settings section**

After state duration section:

```tsx
<div className="settings-panel__section">
  <h2>计时和倒计时</h2>
  <label>
    自定义倒计时分钟数
    <input
      type="number"
      min="1"
      max="180"
      value={draft.timer.customCountdownMinutes}
      onChange={(event) =>
        updateTimer({
          customCountdownMinutes: Number(event.currentTarget.value),
        })
      }
    />
  </label>
  <label>
    倒计时结束提示
    <textarea
      value={linesToText(draft.timer.countdownCompleteLines)}
      onChange={(event) =>
        updateTimer({
          countdownCompleteLines: textToLines(event.currentTarget.value),
        })
      }
    />
  </label>
</div>
```

- [ ] **Step 4: Update runbook**

In `docs/runbook.md`, add expected behavior:

```md
- Right-click the pet to show frosted circular quick actions for countdown, stopwatch, and settings.
- Countdown offers 5 / 15 / 30 / custom minutes before starting.
- While countdown or stopwatch is running, the pet shows the work video and a frosted time badge above its head.
- Countdown completion switches the pet to idle and shows the custom completion bubble.
- Settings open beside the pet, and scale changes preview live.
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- src/pet/focusTimer.test.ts src/pet/petSettings.test.ts src/pet/mealScheduler.test.ts src/pet/stateMachine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm test
npm run build
PATH="/Users/bytedance/.cargo/bin:$PATH" cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all PASS.

- [ ] **Step 7: Manual desktop QA**

Run:

```bash
PATH="/Users/bytedance/.cargo/bin:$PATH" npm run tauri:dev
```

Check:

- Right-click shows three circular frosted buttons around pet.
- Countdown button switches to `5 / 15 / 30 / 自定义`.
- Stopwatch starts immediately and can be stopped by clicking stopwatch again.
- Running timer shows `booch-work.mov` and a frosted time badge.
- Normal bubbles do not appear during running timer.
- Countdown end shows custom completion bubble and `booch-idle.mov`.
- Settings panel opens beside pet and pet remains visible.
- Scale changes preview live while settings is open.

- [ ] **Step 8: Commit**

```bash
git add src/pet/SettingsPanel.tsx src/styles.css docs/runbook.md
git commit -m "feat: finish focus timer settings"
```

---

## Self-Review

Spec coverage:

- Countdown and stopwatch logic: Task 1 and Task 5.
- Frosted time display above pet: Task 4 and Task 5.
- Suppress bubbles and force work visual while running: Task 5.
- Countdown completion to idle with editable bubble: Task 1, Task 2, Task 3, Task 5, Task 6.
- Right-click semi-surrounding circular buttons: Task 4 and Task 5.
- Meal reminders blocked during focus timer: Task 2 and Task 5.
- Ambient bubbles preserved but suppressed during focus timer: Task 5.
- Eat return to previous state: Task 3 and Task 5.
- Work state no longer auto-returns: Task 5.
- Settings removals/additions: Task 2 and Task 6.
- Settings panel keeps pet visible with live scale preview: Task 5.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified implementation steps remain.

Type consistency:

- `FocusTimerState`, `PetSettings["timer"]`, `QuickActions`, and `TimerBadge` names are defined before use.
- The plan consistently uses `return-previous` and `countdown-complete` as new pet events.
