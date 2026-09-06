# Booch Desktop Pet Runbook

## Run Frontend Preview

```bash
npm run dev
```

Open `http://127.0.0.1:1420/`.

## Expected Preview Behavior

- The pet uses the user's local videos for idle, work, and eat states.
- Click the pet to show a short bubble.
- Double-click the pet to cycle through idle, work, eat, then back to idle.
- At 12:00 and 18:30 local time, the preview switches the pet to eat.

## Current Native App Boundary

The frontend preview is working. The macOS desktop-window version still needs Rust installed before Tauri can run.

Current environment check:

```text
Node: installed
npm: installed
Xcode Command Line Tools: installed
Rust: not installed
Cargo: not installed
```

After Rust is approved and installed, run:

```bash
npm run tauri:dev
```
