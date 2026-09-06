# Booch Desktop Pet V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first playable macOS desktop pet that stays on the desktop, can be dragged, responds to clicks, and switches among idle, work, and eat states.

**Architecture:** Use Tauri 2 as the desktop shell with a React + TypeScript frontend. Keep visual pet state and animation in the frontend, and keep native window behavior, menu/tray, notification permissions, and reminder evaluation on the Tauri/Rust side.

**Tech Stack:** Tauri 2, Rust stable, React, TypeScript, Vite, Vitest, npm.

**Spec:** `docs/superpowers/specs/2026-09-06-booch-desktop-pet-design.md`

## Global Constraints

- First version is for the user's own macOS computer only.
- First version has exactly three pet states: idle, work, eat.
- The pet must appear as a transparent, borderless, always-on-top desktop window.
- The pet must be draggable, and the last position must persist after restart.
- The pet must not read active applications, keyboard content, screen content, or other personal data.
- Meal reminders use local machine time only.
- Default meal times are 12:00 and 18:30.
- Do not implement account login, cloud sync, partner-device behavior, or Windows build work in V1.
- Supplied recordings are V1 local private-use assets; do not package original IP art for public distribution.

---

## File Structure

- `package.json`: npm scripts and frontend/Tauri dependencies.
- `index.html`: Vite entry HTML.
- `vite.config.ts`: React + Vitest configuration.
- `tsconfig.json`: TypeScript project configuration.
- `src/main.tsx`: React application bootstrap.
- `src/App.tsx`: Top-level pet screen wiring.
- `src/styles.css`: Transparent desktop styling and pet animation styles.
- `src/assets/booch-idle.mov`: Local private-use idle video copied from the user's supplied recording.
- `src/assets/booch-work.mov`: Local private-use work video copied from the user's supplied recording.
- `src/assets/booch-eat.mov`: Local private-use eat video copied from the user's supplied recording.
- `src/pet/types.ts`: Shared frontend types for pet state, reminder messages, and settings.
- `src/pet/stateMachine.ts`: Pure state transitions for idle, work, eat, and click responses.
- `src/pet/stateMachine.test.ts`: Vitest coverage for allowed transitions.
- `src/pet/schedulerClient.ts`: Frontend listener for Rust reminder events.
- `src/pet/mealScheduler.ts`: Frontend fallback and preview meal reminder evaluation.
- `src/pet/PetSprite.tsx`: Visual pet body, click target, drag area, and state-based rendering.
- `src/pet/Bubble.tsx`: Short speech bubble component.
- `src-tauri/Cargo.toml`: Rust dependencies.
- `src-tauri/tauri.conf.json`: Window, bundle, and security configuration.
- `src-tauri/capabilities/default.json`: Tauri permissions for window, event, store, window-state, and notifications.
- `src-tauri/src/main.rs`: Tauri entry point.
- `src-tauri/src/lib.rs`: Tauri builder, window setup, plugins, and command registration.
- `src-tauri/src/reminders.rs`: Pure Rust reminder evaluation.
- `src-tauri/src/reminders_test.rs`: Rust tests for meal reminder timing and duplicate suppression.
- `src-tauri/src/settings.rs`: App settings model and defaults.

---

### Task 1: Toolchain And App Skeleton

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: confirmed V1 design spec.
- Produces: runnable Tauri + React app shell with npm scripts `npm test`, `npm run build`, and `npm run tauri dev`.

- [ ] **Step 1: Verify local toolchain**

Run:

```bash
node -v
npm -v
cargo -V
rustc -V
xcode-select -p
```

Expected: Node and npm print versions; Xcode Command Line Tools path prints; `cargo` and `rustc` may fail on this machine before Rust is installed.

- [ ] **Step 2: Install Rust if missing**

Run only if `cargo -V` fails:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
cargo -V
rustc -V
```

Expected: `cargo` and `rustc` print stable Rust versions.

- [ ] **Step 3: Create the frontend and Tauri skeleton files**

Create `package.json`:

```json
{
  "name": "booch-desktop-pet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "jsdom": "^25.0.0"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booch Desktop Pet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    strictPort: true,
    port: 1420,
  },
  envPrefix: ["VITE_", "TAURI_"],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="pet-stage" aria-label="Booch desktop pet">
      <button className="pet-shell" type="button">待机</button>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #25211d;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
}

.pet-stage {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background: transparent;
}

.pet-shell {
  width: 168px;
  height: 168px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 18%);
  color: #25211d;
  cursor: grab;
}
```

Create `src-tauri/Cargo.toml`:

```toml
[package]
name = "booch-desktop-pet"
version = "0.1.0"
description = "A playful desktop pet for macOS"
authors = ["bytedance"]
edition = "2021"

[lib]
name = "booch_desktop_pet_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = ["macos-private-api", "tray-icon"] }
tauri-plugin-notification = "2"
tauri-plugin-store = "2"
tauri-plugin-window-state = "2"
```

Create `src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build();
}
```

Create `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Booch Desktop Pet",
  "version": "0.1.0",
  "identifier": "com.cai.boochpet",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://127.0.0.1:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "macOSPrivateApi": true,
    "windows": [
      {
        "title": "Booch",
        "width": 220,
        "height": 220,
        "decorations": false,
        "transparent": true,
        "resizable": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": []
  }
}
```

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default desktop permissions for Booch pet",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "core:window:allow-set-position",
    "core:window:allow-outer-position",
    "core:window:allow-set-always-on-top",
    "notification:default",
    "store:default"
  ]
}
```

Create `src-tauri/src/main.rs`:

```rust
fn main() {
    booch_desktop_pet_lib::run();
}
```

Create `src-tauri/src/lib.rs`:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running Booch Desktop Pet");
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 5: Verify the skeleton**

Run:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: TypeScript build passes; Rust tests pass with zero tests.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json src src-tauri
git commit -m "feat: scaffold booch desktop pet app"
```

---

### Task 2: Three-State Pet Model

**Files:**
- Create: `src/pet/types.ts`
- Create: `src/pet/stateMachine.ts`
- Create: `src/pet/stateMachine.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: no prior runtime state.
- Produces: `PetState`, `PetEvent`, `PetViewModel`, `reducePetState(current, event, now): PetViewModel`.

- [ ] **Step 1: Write the failing state-machine tests**

Create `src/pet/stateMachine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { reducePetState } from "./stateMachine";
import type { PetViewModel } from "./types";

const idle: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: 0,
};

describe("reducePetState", () => {
  it("starts work mode when the user asks to work", () => {
    expect(reducePetState(idle, { type: "start-work" }, 1000)).toMatchObject({
      state: "work",
      bubble: "开始认真搬砖",
    });
  });

  it("switches to eat mode for a meal reminder", () => {
    expect(reducePetState(idle, { type: "meal-reminder", meal: "lunch" }, 2000)).toMatchObject({
      state: "eat",
      bubble: "饭点到",
    });
  });

  it("never creates a fourth pet state after click feedback", () => {
    const result = reducePetState(idle, { type: "pet-click" }, 3000);
    expect(["idle", "work", "eat"]).toContain(result.state);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pet/stateMachine.test.ts
```

Expected: FAIL because `src/pet/stateMachine.ts` and `src/pet/types.ts` do not exist.

- [ ] **Step 3: Implement the state types and reducer**

Create `src/pet/types.ts`:

```ts
export type PetState = "idle" | "work" | "eat";

export type MealKind = "lunch" | "dinner";

export type PetEvent =
  | { type: "pet-click" }
  | { type: "start-work" }
  | { type: "stop-work" }
  | { type: "meal-reminder"; meal: MealKind }
  | { type: "return-idle" };

export interface PetViewModel {
  state: PetState;
  bubble: string | null;
  lastInteractionAt: number;
}
```

Create `src/pet/stateMachine.ts`:

```ts
import type { PetEvent, PetViewModel } from "./types";

const idleClickLines = ["我在", "摸鱼一下", "今天也要好好吃饭"];
const workClickLines = ["盯着你工作", "别忘了保存", "认真五分钟也算认真"];
const eatClickLines = ["香", "先吃两口", "饭饭时间"];

function pickLine(lines: string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length];
}

export function reducePetState(
  current: PetViewModel,
  event: PetEvent,
  now: number,
): PetViewModel {
  if (event.type === "start-work") {
    return { state: "work", bubble: "开始认真搬砖", lastInteractionAt: now };
  }

  if (event.type === "stop-work" || event.type === "return-idle") {
    return { state: "idle", bubble: null, lastInteractionAt: now };
  }

  if (event.type === "meal-reminder") {
    return {
      state: "eat",
      bubble: event.meal === "lunch" ? "饭点到" : "晚饭时间",
      lastInteractionAt: now,
    };
  }

  if (event.type === "pet-click") {
    const linesByState = {
      idle: idleClickLines,
      work: workClickLines,
      eat: eatClickLines,
    } satisfies Record<PetViewModel["state"], string[]>;

    return {
      ...current,
      bubble: pickLine(linesByState[current.state], now),
      lastInteractionAt: now,
    };
  }

  return current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/pet/stateMachine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire the reducer into the app**

Modify `src/App.tsx`:

```tsx
import { useReducer } from "react";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";

const initialPet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: Date.now(),
};

function reducer(state: PetViewModel, event: PetEvent): PetViewModel {
  return reducePetState(state, event, Date.now());
}

export default function App() {
  const [pet, dispatch] = useReducer(reducer, initialPet);

  return (
    <main className="pet-stage" aria-label="Booch desktop pet">
      <button
        className={`pet-shell pet-shell--${pet.state}`}
        type="button"
        onClick={() => dispatch({ type: "pet-click" })}
        onDoubleClick={() => dispatch(pet.state === "work" ? { type: "return-idle" } : { type: "start-work" })}
      >
        {pet.state === "idle" ? "待机" : pet.state === "work" ? "工作" : "吃饭"}
      </button>
      {pet.bubble ? <p className="pet-bubble">{pet.bubble}</p> : null}
    </main>
  );
}
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test
npm run build
git add src/App.tsx src/pet
git commit -m "feat: add three-state pet model"
```

---

### Task 3: Playful Pet Rendering And Motion

**Files:**
- Create: `src/pet/PetSprite.tsx`
- Create: `src/pet/Bubble.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PetViewModel` from Task 2.
- Produces: `<PetSprite pet={pet} onClick={handler} onToggleWork={handler} />` and `<Bubble text={text} />`.

- [ ] **Step 1: Create the sprite and bubble components**

Create `src/pet/Bubble.tsx`:

```tsx
interface BubbleProps {
  text: string;
}

export function Bubble({ text }: BubbleProps) {
  return <p className="pet-bubble">{text}</p>;
}
```

Create `src/pet/PetSprite.tsx`:

```tsx
import type { PetViewModel } from "./types";

interface PetSpriteProps {
  pet: PetViewModel;
  onClick: () => void;
  onToggleWork: () => void;
}

export function PetSprite({ pet, onClick, onToggleWork }: PetSpriteProps) {
  return (
    <button
      className={`pet-shell pet-shell--${pet.state}`}
      type="button"
      onClick={onClick}
      onDoubleClick={onToggleWork}
      aria-label={`渣熊${pet.state}`}
    >
      <span className="pet-face" aria-hidden="true">
        <span className="pet-ear pet-ear--left" />
        <span className="pet-ear pet-ear--right" />
        <span className="pet-eye pet-eye--left" />
        <span className="pet-eye pet-eye--right" />
        <span className="pet-mouth" />
        {pet.state === "work" ? <span className="pet-laptop" /> : null}
        {pet.state === "eat" ? <span className="pet-bowl" /> : null}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Wire components into `App.tsx`**

Modify `src/App.tsx`:

```tsx
import { useReducer } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";

const initialPet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: Date.now(),
};

function reducer(state: PetViewModel, event: PetEvent): PetViewModel {
  return reducePetState(state, event, Date.now());
}

export default function App() {
  const [pet, dispatch] = useReducer(reducer, initialPet);

  return (
    <main className="pet-stage" aria-label="Booch desktop pet">
      {pet.bubble ? <Bubble text={pet.bubble} /> : null}
      <PetSprite
        pet={pet}
        onClick={() => dispatch({ type: "pet-click" })}
        onToggleWork={() =>
          dispatch(pet.state === "work" ? { type: "return-idle" } : { type: "start-work" })
        }
      />
    </main>
  );
}
```

- [ ] **Step 3: Replace placeholder styles with stateful motion**

Modify `src/styles.css` so the pet remains compact, transparent around the body, and visibly different in the three states. Keep the root/body transparent styles from Task 1 and replace `.pet-stage`, `.pet-shell`, and related pet styles with:

```css
.pet-stage {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background: transparent;
  user-select: none;
}

.pet-shell {
  position: relative;
  width: 168px;
  height: 150px;
  border: 0;
  border-radius: 46% 46% 40% 40%;
  background: #fffdf8;
  box-shadow: 0 12px 30px rgb(43 33 22 / 18%);
  cursor: grab;
  animation: idle-breathe 3.2s ease-in-out infinite;
}

.pet-shell:active {
  cursor: grabbing;
}

.pet-shell--work {
  animation: work-focus 2.8s ease-in-out infinite;
}

.pet-shell--eat {
  animation: eat-nom 0.8s ease-in-out infinite;
}

.pet-face,
.pet-ear,
.pet-eye,
.pet-mouth,
.pet-laptop,
.pet-bowl {
  position: absolute;
  display: block;
}

.pet-ear {
  width: 38px;
  height: 38px;
  top: 6px;
  border-radius: 50%;
  background: #fffdf8;
  box-shadow: inset 0 -5px 0 #f0e8dc;
}

.pet-ear--left {
  left: 24px;
}

.pet-ear--right {
  right: 24px;
}

.pet-eye {
  width: 12px;
  height: 14px;
  top: 62px;
  border-radius: 50%;
  background: #25211d;
  animation: blink 4.8s infinite;
}

.pet-eye--left {
  left: 58px;
}

.pet-eye--right {
  right: 58px;
}

.pet-mouth {
  left: 76px;
  top: 86px;
  width: 18px;
  height: 10px;
  border-bottom: 3px solid #25211d;
  border-radius: 0 0 18px 18px;
}

.pet-laptop {
  left: 43px;
  bottom: 14px;
  width: 82px;
  height: 42px;
  border-radius: 8px;
  background: #b9d2dc;
  box-shadow: 0 8px 0 #7f9faa;
}

.pet-bowl {
  left: 50px;
  bottom: 8px;
  width: 70px;
  height: 32px;
  border-radius: 0 0 42px 42px;
  background: #f0b35b;
  box-shadow: inset 0 8px 0 #fff2d7;
}

.pet-bubble {
  position: absolute;
  top: 8px;
  max-width: 180px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgb(255 255 255 / 86%);
  box-shadow: 0 8px 22px rgb(43 33 22 / 14%);
  font-size: 13px;
  line-height: 1.35;
}

@keyframes idle-breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes work-focus {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-3px) rotate(1deg); }
}

@keyframes eat-nom {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.96) translateY(3px); }
}

@keyframes blink {
  0%, 94%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.08); }
}
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm test
npm run build
git add src/App.tsx src/pet/PetSprite.tsx src/pet/Bubble.tsx src/styles.css
git commit -m "feat: render playful three-state pet"
```

---

### Task 4: Native Desktop Window Behavior

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/pet/PetSprite.tsx`
- Create: `src/pet/windowControls.ts`

**Interfaces:**
- Consumes: `<PetSprite />` from Task 3.
- Produces: `startPetDrag(): Promise<void>` and native window configuration for transparent, borderless, always-on-top behavior with persisted window position.

- [ ] **Step 1: Add frontend drag helper**

Create `src/pet/windowControls.ts`:

```ts
import { getCurrentWindow } from "@tauri-apps/api/window";

export async function startPetDrag(): Promise<void> {
  await getCurrentWindow().startDragging();
}
```

- [ ] **Step 2: Wire drag into the sprite**

Modify `src/pet/PetSprite.tsx`:

```tsx
import type { PetViewModel } from "./types";
import { startPetDrag } from "./windowControls";

interface PetSpriteProps {
  pet: PetViewModel;
  onClick: () => void;
  onToggleWork: () => void;
}

export function PetSprite({ pet, onClick, onToggleWork }: PetSpriteProps) {
  return (
    <button
      className={`pet-shell pet-shell--${pet.state}`}
      type="button"
      onClick={onClick}
      onDoubleClick={onToggleWork}
      onMouseDown={(event) => {
        if (event.button === 0) {
          void startPetDrag();
        }
      }}
      aria-label={`渣熊${pet.state}`}
    >
      <span className="pet-face" aria-hidden="true">
        <span className="pet-ear pet-ear--left" />
        <span className="pet-ear pet-ear--right" />
        <span className="pet-eye pet-eye--left" />
        <span className="pet-eye pet-eye--right" />
        <span className="pet-mouth" />
        {pet.state === "work" ? <span className="pet-laptop" /> : null}
        {pet.state === "eat" ? <span className="pet-bowl" /> : null}
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Ensure native window is pet-shaped in behavior**

Verify `src-tauri/tauri.conf.json` contains:

```json
"windows": [
  {
    "title": "Booch",
    "width": 220,
    "height": 220,
    "decorations": false,
    "transparent": true,
    "resizable": false,
    "alwaysOnTop": true,
    "skipTaskbar": true,
    "visible": true
  }
]
```

Verify `src-tauri/src/lib.rs` contains the window-state plugin installed in Task 1:

```rust
.plugin(tauri_plugin_window_state::Builder::default().build())
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:dev
```

Expected in the running app: transparent borderless pet window appears; dragging the pet moves the native window; closing and reopening keeps the last position; normal typing in other apps is not blocked after clicking away.

Commit after manual verification:

```bash
git add src-tauri src/pet/PetSprite.tsx src/pet/windowControls.ts
git commit -m "feat: add native desktop pet window behavior"
```

---

### Task 5: Meal Reminder Logic

**Files:**
- Create: `src-tauri/src/settings.rs`
- Create: `src-tauri/src/reminders.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src/pet/schedulerClient.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: frontend `PetEvent` from Task 2.
- Produces: Rust event payload `{ meal: "lunch" | "dinner" }` emitted as `meal-reminder`.

- [ ] **Step 1: Write Rust reminder tests**

Create `src-tauri/src/reminders.rs` with tests in the same file:

```rust
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum MealKind {
    Lunch,
    Dinner,
}

#[derive(Debug, Clone, Copy)]
pub struct ReminderConfig {
    pub lunch_minutes: u16,
    pub dinner_minutes: u16,
    pub suppress_minutes: u16,
}

impl Default for ReminderConfig {
    fn default() -> Self {
        Self {
            lunch_minutes: 12 * 60,
            dinner_minutes: 18 * 60 + 30,
            suppress_minutes: 30,
        }
    }
}

#[derive(Debug, Default, Clone, Copy)]
pub struct ReminderState {
    pub last_lunch_at: Option<ReminderStamp>,
    pub last_dinner_at: Option<ReminderStamp>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReminderStamp {
    pub day: i32,
    pub minute_of_day: u16,
}

fn is_suppressed(now: ReminderStamp, last: ReminderStamp, suppress_minutes: u16) -> bool {
    now.day == last.day
        && now.minute_of_day.saturating_sub(last.minute_of_day) < suppress_minutes
}

pub fn evaluate_meal_reminder(
    now: ReminderStamp,
    config: ReminderConfig,
    state: &mut ReminderState,
) -> Option<MealKind> {
    if now.minute_of_day == config.lunch_minutes {
        if state.last_lunch_at.map_or(true, |last| !is_suppressed(now, last, config.suppress_minutes)) {
            state.last_lunch_at = Some(now);
            return Some(MealKind::Lunch);
        }
    }

    if now.minute_of_day == config.dinner_minutes {
        if state.last_dinner_at.map_or(true, |last| !is_suppressed(now, last, config.suppress_minutes)) {
            state.last_dinner_at = Some(now);
            return Some(MealKind::Dinner);
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emits_lunch_at_default_noon() {
        let config = ReminderConfig::default();
        let mut state = ReminderState::default();
        let now = ReminderStamp { day: 1, minute_of_day: 12 * 60 };

        assert_eq!(evaluate_meal_reminder(now, config, &mut state), Some(MealKind::Lunch));
    }

    #[test]
    fn emits_dinner_at_default_evening() {
        let config = ReminderConfig::default();
        let mut state = ReminderState::default();
        let now = ReminderStamp { day: 1, minute_of_day: 18 * 60 + 30 };

        assert_eq!(evaluate_meal_reminder(now, config, &mut state), Some(MealKind::Dinner));
    }

    #[test]
    fn ignores_non_meal_minutes() {
        let config = ReminderConfig::default();
        let mut state = ReminderState::default();
        let now = ReminderStamp { day: 1, minute_of_day: 15 * 60 };

        assert_eq!(evaluate_meal_reminder(now, config, &mut state), None);
    }

    #[test]
    fn allows_the_same_meal_time_on_the_next_day() {
        let config = ReminderConfig::default();
        let mut state = ReminderState::default();
        let day_one = ReminderStamp { day: 1, minute_of_day: 12 * 60 };
        let day_two = ReminderStamp { day: 2, minute_of_day: 12 * 60 };

        assert_eq!(evaluate_meal_reminder(day_one, config, &mut state), Some(MealKind::Lunch));
        assert_eq!(evaluate_meal_reminder(day_two, config, &mut state), Some(MealKind::Lunch));
    }
}
```

- [ ] **Step 2: Run Rust tests**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml reminders
```

Expected: PASS after the file is created.

- [ ] **Step 3: Emit meal events from Tauri**

Modify `src-tauri/src/lib.rs`:

```rust
mod reminders;

use chrono::{Datelike, Timelike};
use reminders::{evaluate_meal_reminder, MealKind, ReminderConfig, ReminderStamp, ReminderState};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MealReminderPayload {
    meal: MealKind,
}

fn current_stamp() -> ReminderStamp {
    let now = chrono::Local::now();
    ReminderStamp {
        day: now.num_days_from_ce(),
        minute_of_day: (now.hour() * 60 + now.minute()) as u16,
    }
}

fn spawn_meal_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let config = ReminderConfig::default();
        let mut state = ReminderState::default();

        loop {
            let stamp = current_stamp();
            if let Some(meal) = evaluate_meal_reminder(stamp, config, &mut state) {
                let _ = app.emit("meal-reminder", MealReminderPayload { meal });
            }
            tauri::async_runtime::sleep(Duration::from_secs(60)).await;
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            spawn_meal_scheduler(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Booch Desktop Pet");
}
```

Also add `chrono = "0.4"` to `src-tauri/Cargo.toml` dependencies:

```toml
chrono = { version = "0.4", features = ["clock"] }
```

- [ ] **Step 4: Listen to meal events in React**

Create `src/pet/schedulerClient.ts`:

```ts
import { listen } from "@tauri-apps/api/event";
import type { MealKind, PetEvent } from "./types";

interface MealReminderPayload {
  meal: MealKind;
}

export function listenForMealReminders(dispatch: (event: PetEvent) => void): () => void {
  let unlisten: (() => void) | null = null;

  void listen<MealReminderPayload>("meal-reminder", (event) => {
    dispatch({ type: "meal-reminder", meal: event.payload.meal });
  }).then((nextUnlisten) => {
    unlisten = nextUnlisten;
  });

  return () => {
    if (unlisten) {
      unlisten();
    }
  };
}
```

Modify `src/App.tsx` to subscribe once:

```tsx
import { useEffect, useReducer } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
import { listenForMealReminders } from "./pet/schedulerClient";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";

const initialPet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: Date.now(),
};

function reducer(state: PetViewModel, event: PetEvent): PetViewModel {
  return reducePetState(state, event, Date.now());
}

export default function App() {
  const [pet, dispatch] = useReducer(reducer, initialPet);

  useEffect(() => listenForMealReminders(dispatch), []);

  return (
    <main className="pet-stage" aria-label="Booch desktop pet">
      {pet.bubble ? <Bubble text={pet.bubble} /> : null}
      <PetSprite
        pet={pet}
        onClick={() => dispatch({ type: "pet-click" })}
        onToggleWork={() =>
          dispatch(pet.state === "work" ? { type: "return-idle" } : { type: "start-work" })
        }
      />
    </main>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
git add src src-tauri
git commit -m "feat: add local meal reminders"
```

---

### Task 6: Manual Run And V1 Acceptance

**Files:**
- Modify: `docs/superpowers/specs/2026-09-06-booch-desktop-pet-design.md`
- Create: `docs/runbook.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified local run notes and a simple user runbook.

- [ ] **Step 1: Add a runbook**

Create `docs/runbook.md`:

````md
# Booch Desktop Pet Runbook

## Run Locally

```bash
npm run tauri:dev
```

## Expected V1 Behavior

- The pet appears in a small transparent borderless window.
- Dragging the pet moves it around the desktop.
- Clicking the pet shows a short bubble.
- Double-clicking cycles through idle, work, eat, then back to idle.
- At 12:00 and 18:30 local time, the pet switches to eat mode.

## Stop

Quit from the app window, menu/tray entry, or terminal running the dev command.
````

- [ ] **Step 2: Run automated checks**

Run:

```bash
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all checks pass.

- [ ] **Step 3: Run the app manually**

Run:

```bash
npm run tauri:dev
```

Manual checks:

```text
Pet window is transparent and borderless.
Pet stays visually above normal windows.
Pet can be dragged.
Click shows one short bubble.
Double-click toggles work mode.
Eat mode can be triggered by temporarily setting lunch_minutes to the next local minute during manual QA, then restored to 12:00.
```

- [ ] **Step 4: Update spec verification notes**

Append this section to `docs/superpowers/specs/2026-09-06-booch-desktop-pet-design.md`:

```md
## 6. V1 Verification Notes

- Automated frontend tests passed with `npm test`.
- Frontend production build passed with `npm run build`.
- Rust tests passed with `cargo test --manifest-path src-tauri/Cargo.toml`.
- Manual macOS run was checked with `npm run tauri:dev`.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/runbook.md docs/superpowers/specs/2026-09-06-booch-desktop-pet-design.md
git commit -m "docs: add v1 runbook and verification notes"
```

---

## Self-Review

- Spec coverage: the plan covers macOS-only scope, three states, transparent borderless topmost window, drag behavior, click feedback, local meal reminders, default meal times, no privacy-invasive app/screen/keyboard reading, and no V1 cloud sync.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, or empty edge-case instruction is intentionally left.
- Type consistency: frontend states use `idle | work | eat`; Rust reminder payload maps to frontend `meal-reminder`; no drink or acknowledged state is introduced.
- Known execution blocker: the repository currently needs a local Git identity before commits can succeed.
