import { listen } from "@tauri-apps/api/event";

interface ReminderPauseEvent {
  payload: unknown;
}

type ReminderPauseListener = (paused: boolean) => void;

export function createReminderPauseHandler(
  onPauseChange: ReminderPauseListener,
) {
  return (event: ReminderPauseEvent) => {
    if (typeof event.payload === "boolean") {
      onPauseChange(event.payload);
    }
  };
}

export async function listenForReminderPauseChanges(
  onPauseChange: ReminderPauseListener,
): Promise<() => void> {
  try {
    return await listen(
      "reminders-paused-changed",
      createReminderPauseHandler(onPauseChange),
    );
  } catch {
    return () => undefined;
  }
}
