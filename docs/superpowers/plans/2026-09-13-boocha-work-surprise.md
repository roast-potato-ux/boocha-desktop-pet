# Boocha 工作彩蛋与新版状态素材 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three visible pet videos and add an optional, delayed work-session surprise that plays “送你” for one minute before returning to work.

**Architecture:** Keep the existing Canvas chroma-keying pipeline and replace only the imported MOV assets. Extend the pet state machine with an internal `surprise` state, while a new pure scheduler decides whether and when an eligible manual work session should enter it. Persist the default-off switch inside the existing normalized `PetSettings` object and have `App` own browser timers, invalidating old timers whenever the work session changes.

**Tech Stack:** React, TypeScript, Vite asset imports, Vitest, Tauri 2 / Rust menu labels, Canvas 2D video keying.

**Spec:** `docs/superpowers/specs/2026-09-13-boocha-work-surprise-design.md`

## Global Constraints

- Replace only with `/Users/bytedance/Movies/嗯嗯.mov`, `/Users/bytedance/Movies/工作.mov`, `/Users/bytedance/Movies/吃饭.mov`, and `/Users/bytedance/Movies/送你.mov`.
- Keep `KeyedVideo` edge-connected background removal and bottom feathering; do not package a rectangular background or make character fills transparent.
- The switch `surprise.enabled` defaults to `false` and old saved settings must normalize safely.
- Only a manually requested transition into work can schedule a surprise; countdown, stopwatch, meals, and ambient behavior cannot.
- A work session has a 30% chance; on success wait an integer random delay from 5 through 30 minutes, show “送你” for exactly 60 seconds with “小彩蛋送你”, then return to work.
- User-visible base states and native menu remain 嗯嗯、工作、吃饭. “送你” is never a menu or manual-cycle choice.
- Existing unrelated uncommitted settings-editor work must remain intact.

---

### Task 1: Import the four new keyed video assets and expose the internal surprise state

**Files:**
- Create: `src/assets/boocha-surprise.mov`
- Modify: `src/assets/boocha-idle.mov`, `src/assets/boocha-work.mov`, `src/assets/boocha-eat.mov` (replace binary contents from the user-provided files)
- Modify: `src/pet/types.ts:1-22`
- Modify: `src/pet/PetSprite.tsx:1-37`
- Modify: `src/pet/PetSprite.test.tsx`
- Modify: `src-tauri/src/lib.rs:58-79`

**Interfaces:**
- Produces `PetState = "idle" | "work" | "eat" | "surprise"`; public menu requests remain restricted to the first three states.
- Produces `PetSprite` source mapping for all four state values.

- [ ] **Step 1: Write the failing sprite and state tests**

```tsx
it("uses the separate surprise video for the internal surprise state", () => {
  render(<PetSprite pet={{ state: "surprise", previousState: "work", bubble: "小彩蛋送你", lastInteractionAt: 0 }} onClick={() => undefined} onToggleWork={() => undefined} />);
  expect(screen.getByRole("button", { name: "渣熊surprise" })).toBeTruthy();
  expect(document.querySelector("video")?.getAttribute("src")).toContain("boocha-surprise");
});
```

Add native-menu handler coverage showing payload `"surprise"` is ignored.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/pet/PetSprite.test.tsx src/pet/nativeMenuClient.test.ts`

Expected: FAIL because `surprise` is not a valid state and no video mapping exists.

- [ ] **Step 3: Copy the supplied MOVs and implement the mappings**

```bash
cp "/Users/bytedance/Movies/嗯嗯.mov" src/assets/boocha-idle.mov
cp "/Users/bytedance/Movies/工作.mov" src/assets/boocha-work.mov
cp "/Users/bytedance/Movies/吃饭.mov" src/assets/boocha-eat.mov
cp "/Users/bytedance/Movies/送你.mov" src/assets/boocha-surprise.mov
```

Import `boocha-surprise.mov` in `PetSprite.tsx` and add `surprise: boochaSurprise` to its source map. Extend `PetState`; keep `isPetState` in `nativeMenuClient.ts` limited to `idle`, `work`, and `eat`. In `src-tauri/src/lib.rs`, change the menu text `切到待机` to `切到嗯嗯` without changing the emitted `idle` payload.

- [ ] **Step 4: Run focused tests and validate the keyed rendering path**

Run: `npm test -- --run src/pet/PetSprite.test.tsx src/pet/nativeMenuClient.test.ts src/pet/backgroundKeyer.test.ts src/pet/videoCrop.test.ts`

Expected: PASS. In the browser, select each base state and confirm only the edge-connected video background disappears while internal light areas remain opaque.

- [ ] **Step 5: Commit the asset and state boundary**

```bash
git add src/assets/boocha-idle.mov src/assets/boocha-work.mov src/assets/boocha-eat.mov src/assets/boocha-surprise.mov src/pet/types.ts src/pet/PetSprite.tsx src/pet/PetSprite.test.tsx src/pet/nativeMenuClient.test.ts src-tauri/src/lib.rs
git commit -m "feat: add Boocha surprise video state"
```

### Task 2: Define pure surprise scheduling and state-machine lifecycle

**Files:**
- Create: `src/pet/workSurprise.ts`
- Create: `src/pet/workSurprise.test.ts`
- Modify: `src/pet/types.ts:7-21`
- Modify: `src/pet/stateMachine.ts:20-170`
- Modify: `src/pet/stateMachine.test.ts`

**Interfaces:**
- Produces `scheduleWorkSurprise(now: number, random: () => number, enabled: boolean): WorkSurpriseSchedule | null`.
- Produces `isCurrentWorkSurprise(schedule: WorkSurpriseSchedule | null, dueAt: number): boolean`.
- Consumes `PetEvent` variants `{ type: "start-surprise" }`, `{ type: "finish-surprise" }`, and base-state selection events.

- [ ] **Step 1: Write the failing scheduler and state tests**

```ts
expect(scheduleWorkSurprise(1_000, () => 0.29, true)).toMatchObject({ dueAt: 301_000 });
expect(scheduleWorkSurprise(1_000, () => 0.3, true)).toBeNull();
expect(scheduleWorkSurprise(1_000, () => 0, false)).toBeNull();

expect(reducePetState(work, { type: "start-surprise" }, 5_000)).toMatchObject({
  state: "surprise",
  previousState: "work",
  bubble: "小彩蛋送你",
});
expect(reducePetState(surprise, { type: "finish-surprise" }, 65_000).state).toBe("work");
```

Use two injected random values: the first is the 30% gate, the second maps to an inclusive integer delay in `[5, 30]` minutes.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/pet/workSurprise.test.ts src/pet/stateMachine.test.ts`

Expected: FAIL because the scheduler and surprise events do not exist.

- [ ] **Step 3: Implement the scheduler and events**

```ts
export interface WorkSurpriseSchedule {
  dueAt: number;
}

export function scheduleWorkSurprise(now: number, random: () => number, enabled: boolean): WorkSurpriseSchedule | null {
  if (!enabled || random() >= 0.3) return null;
  const delayMinutes = 5 + Math.floor(random() * 26);
  return { dueAt: now + delayMinutes * 60_000 };
}
```

Add `start-surprise` to transition only from `work` into `{ state: "surprise", previousState: "work", bubble: "小彩蛋送你" }`; add `finish-surprise` to return to work with no bubble. Any manual base-state select or cycle from `surprise` must choose its normal base-state result and not leave `previousState: "surprise"` behind.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npm test -- --run src/pet/workSurprise.test.ts src/pet/stateMachine.test.ts`

Expected: PASS, including probability boundary, 5/30 minute boundaries, fixed message, and recovery to work.

- [ ] **Step 5: Commit scheduler and lifecycle**

```bash
git add src/pet/workSurprise.ts src/pet/workSurprise.test.ts src/pet/types.ts src/pet/stateMachine.ts src/pet/stateMachine.test.ts
git commit -m "feat: schedule Boocha work surprise"
```

### Task 3: Persist the 彩蛋开关 and simplify user-visible labels

**Files:**
- Modify: `src/pet/petSettings.ts:11-250`
- Modify: `src/pet/petSettings.test.ts`
- Modify: `src/pet/SettingsPanel.tsx:20-265`
- Modify: `src/pet/SettingsPanel.test.tsx`
- Modify: `src/styles.css:323-565`

**Interfaces:**
- Produces `settings.surprise.enabled: boolean` with default `false`.
- Produces a `SettingsPanel` 彩蛋开关 which passes the previewed/persisted `PetSettings` through existing `onPreviewSettings` and `onSave` pathways.

- [ ] **Step 1: Write the failing setting tests**

```ts
expect(createDefaultPetSettings().surprise).toEqual({ enabled: false });
expect(normalizePetSettings({}).surprise).toEqual({ enabled: false });
```

```tsx
expect(screen.getByRole("switch", { name: "开启彩蛋" })).not.toBeChecked();
expect(screen.getByText("进入工作状态时，彩蛋会随机出现。")).toBeTruthy();
expect(screen.getByText("嗯嗯")).toBeTruthy();
expect(screen.queryByText("待机")).toBeNull();
```

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- --run src/pet/petSettings.test.ts src/pet/SettingsPanel.test.tsx`

Expected: FAIL because `surprise` is absent and the UI still renders 待机.

- [ ] **Step 3: Implement normalized settings and UI**

Add `surprise: { enabled: boolean }` to the `PetSettings` interface, defaults, and `normalizePetSettings`. In the SettingsPanel, add a compact left-aligned toggle below the work-related behavior controls using the exact title `开启彩蛋` and exact helper copy `进入工作状态时，彩蛋会随机出现。`. Rename the visible idle bubble editor and any visible setting labels to `嗯嗯`; preserve internal storage keys such as `idleClick` and `ambientIdle`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npm test -- --run src/pet/petSettings.test.ts src/pet/SettingsPanel.test.tsx`

Expected: PASS with older stored values acquiring a disabled switch and the panel immediately previewing toggle changes.

- [ ] **Step 5: Commit persisted setting and copy**

```bash
git add src/pet/petSettings.ts src/pet/petSettings.test.ts src/pet/SettingsPanel.tsx src/pet/SettingsPanel.test.tsx src/styles.css
git commit -m "feat: add Boocha surprise setting"
```

### Task 4: Wire work sessions to timers without affecting focus timers

**Files:**
- Modify: `src/App.tsx:70-420`
- Create: `src/pet/workSurpriseIntegration.test.tsx`

**Interfaces:**
- Consumes `scheduleWorkSurprise`, `settings.surprise.enabled`, `start-surprise`, and `finish-surprise`.
- Produces one invalidatable browser timeout per eligible manual work session, plus a 60-second surprise completion timeout.

- [ ] **Step 1: Write the failing integration tests with fake timers**

```tsx
vi.useFakeTimers();
// A manual work selection with random 0, 0 reaches surprise after five minutes.
// A countdown or stopwatch start keeps the work sprite but never schedules surprise.
// Switching back to 嗯嗯 before dueAt prevents any later surprise transition.
// Advancing 60 seconds from surprise restores the normal work video.
```

Expose the work-entry action through a small testable callback or integration event; do not test implementation details such as React state setters.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/pet/workSurpriseIntegration.test.tsx`

Expected: FAIL because App has no work-session scheduler.

- [ ] **Step 3: Implement eligible manual-work scheduling**

Create a `startManualWorkSession()` callback in `App.tsx`: dispatch the normal work selection first, then ask `scheduleWorkSurprise(Date.now(), Math.random, settings.surprise.enabled)` for a due time. Store a monotonically increasing work-session token in a ref; timeout callbacks verify the token, the enabled setting, no active focus timer, and `pet.state === "work"` before dispatching `start-surprise`. Start a second timeout only after `pet.state === "surprise"`, dispatching `finish-surprise` after `60_000` ms. Invalidate tokens and clear timers when leaving normal work, disabling the switch, opening any focus timer, completing a countdown, closing a custom countdown draft, or unmounting.

Route only manual work entry points to `startManualWorkSession()`: the idle-to-work part of double-click cycle and native-menu `work` selection. Keep `startCountdownForMinutes`, `startCountdownForSeconds`, and `toggleStopwatch` on their existing normal work selection path with no surprise schedule.

- [ ] **Step 4: Run focused and full verification**

Run: `npm test -- --run src/pet/workSurpriseIntegration.test.tsx src/pet/workSurprise.test.ts src/pet/stateMachine.test.ts && npm test && npm run build`

Expected: all tests PASS and the Vite production build succeeds.

- [ ] **Step 5: Manually verify the running desktop/browser preview**

With the switch on, use a controlled dev random source or temporary test hook to observe the `送你` video, “小彩蛋送你” bubble, and one-minute recovery. Confirm the switch off path and a timer-created work session do not show it. Remove any temporary hook before committing.

- [ ] **Step 6: Commit App integration**

```bash
git add src/App.tsx src/pet/workSurpriseIntegration.test.tsx
git commit -m "feat: show Boocha surprise during manual work"
```

### Task 5: Rebuild the Tauri desktop app and perform final visual QA

**Files:**
- Modify only if Task 1–4 verification identifies a focused correction.

**Interfaces:**
- Consumes the completed frontend build and existing Tauri configuration.
- Produces a restarted native dev app running the replacement MOV assets and the current Rust menu label.

- [ ] **Step 1: Run native tests and build validation**

Run: `PATH="/Users/bytedance/.cargo/bin:$PATH" cargo test --manifest-path src-tauri/Cargo.toml -q && npm run tauri:dev`

Expected: Rust tests pass and a fully restarted Tauri dev app appears. Do not rely on Vite HMR for Rust menu text changes.

- [ ] **Step 2: Verify native interaction paths**

In the macOS app, confirm the menu says `切到嗯嗯`, each new video has no rectangular background, manually entering work can produce the delayed 彩蛋, and countdown/stopwatch work does not.
