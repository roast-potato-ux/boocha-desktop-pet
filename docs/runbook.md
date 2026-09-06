# Booch Desktop Pet Runbook

## Run Frontend Preview

```bash
npm run dev
```

Open `http://127.0.0.1:1420/`.

## Expected Preview Behavior

- The pet uses the user's local videos for idle, work, and eat states.
- The video background is removed in the app: the outside background is transparent, while Booch's own light body fill is preserved.
- Click the pet to show a short bubble.
- Double-click the pet to cycle through idle, work, eat, then back to idle.
- At 12:00 and 18:30 local time, the preview switches the pet to eat.
- In the macOS desktop app, use the status bar menu to pause reminders, resume reminders, or quit Booch.

## Run macOS Desktop App

```bash
npm run tauri:dev
```

The macOS desktop version runs as a transparent, always-on-top, draggable Booch window.

## Current Environment Check

Rust is installed through rustup for this local project environment.

```text
Node: installed
npm: installed
Xcode Command Line Tools: installed
Rust: installed
Cargo: installed
```
