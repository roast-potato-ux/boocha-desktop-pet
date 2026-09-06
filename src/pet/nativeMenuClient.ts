import { listen } from "@tauri-apps/api/event";
import type { PetState } from "./types";

interface ReminderPauseEvent {
  payload: unknown;
}

type ReminderPauseListener = (paused: boolean) => void;
type PetStateRequestListener = (state: PetState) => void;
type SettingsPanelRequestListener = () => void;

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

export function createSettingsPanelRequestHandler(
  onSettingsPanelRequest: SettingsPanelRequestListener,
) {
  return () => {
    onSettingsPanelRequest();
  };
}

export async function listenForSettingsPanelRequests(
  onSettingsPanelRequest: SettingsPanelRequestListener,
): Promise<() => void> {
  try {
    return await listen(
      "settings-panel-requested",
      createSettingsPanelRequestHandler(onSettingsPanelRequest),
    );
  } catch {
    return () => undefined;
  }
}
