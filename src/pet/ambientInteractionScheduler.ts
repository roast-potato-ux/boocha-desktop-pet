import type { PetEvent, PetViewModel } from "./types";

export interface AmbientInteractionState {
  lastTriggeredAt: number | null;
}

interface AmbientInteractionResult {
  event: PetEvent | null;
  state: AmbientInteractionState;
}

interface AmbientInteractionOptions {
  idleInteractionMinutes?: number;
}

const quietWindowMs = 90 * 1000;
const triggerChance = 0.18;

export function createInitialAmbientInteractionState(): AmbientInteractionState {
  return {
    lastTriggeredAt: null,
  };
}

export function evaluateAmbientInteraction(
  now: number,
  pet: PetViewModel,
  state: AmbientInteractionState,
  randomRoll: number,
  options: AmbientInteractionOptions = {},
): AmbientInteractionResult {
  if (pet.state !== "idle" || pet.bubble) {
    return { event: null, state };
  }

  const quietMs =
    typeof options.idleInteractionMinutes === "number"
      ? options.idleInteractionMinutes * 60 * 1000
      : quietWindowMs;

  if (
    state.lastTriggeredAt !== null &&
    now - state.lastTriggeredAt < quietMs
  ) {
    return { event: null, state };
  }

  if (randomRoll > triggerChance) {
    return { event: null, state };
  }

  return {
    event: {
      type: "ambient-interaction",
      seed: Math.floor(randomRoll * 1000),
    },
    state: {
      lastTriggeredAt: now,
    },
  };
}
