import { listen } from "@tauri-apps/api/event";
import type { PetState } from "./types";

interface ReminderPauseEvent {
  payload: unknown;
}

type ReminderPauseListener = (paused: boolean) => void;
type PetStateRequestListener = (state: PetState) => void;

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

function isPetState(value: unknown): value is PetState {
  return value === "idle" || value === "work" || value === "eat";
}

export function createPetStateRequestHandler(
  onPetStateRequest: PetStateRequestListener,
) {
  return (event: ReminderPauseEvent) => {
    if (isPetState(event.payload)) {
      onPetStateRequest(event.payload);
    }
  };
}

export async function listenForPetStateRequests(
  onPetStateRequest: PetStateRequestListener,
): Promise<() => void> {
  try {
    return await listen(
      "pet-state-requested",
      createPetStateRequestHandler(onPetStateRequest),
    );
  } catch {
    return () => undefined;
  }
}
