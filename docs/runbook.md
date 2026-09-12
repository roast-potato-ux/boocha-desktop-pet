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
- While idle, the pet occasionally shows a short ambient bubble on its own without switching out of idle mode.
- Double-click the pet to cycle through idle, work, eat, then back to idle.
- In the macOS desktop app, the status bar menu can directly switch the pet to idle, work, or eat.
- At 12:00 and 18:30 local time, the preview switches the pet to eat.
- Right-click the pet to show frosted circular quick actions for countdown, stopwatch, and settings.
- Countdown offers 5 / 15 / 30 / custom minutes before starting.
- While countdown or stopwatch is running, the pet shows the work video and a frosted time badge above its head.
- Countdown completion switches the pet to idle and shows the custom completion bubble.
- Settings open beside the pet, and scale changes preview live.

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
