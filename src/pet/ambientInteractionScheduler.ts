import type { PetEvent, PetViewModel } from "./types";

export interface AmbientInteractionState {
  lastTriggeredAt: number | null;
}

interface AmbientInteractionResult {
  event: PetEvent | null;
  state: AmbientInteractionState;
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
): AmbientInteractionResult {
  if (pet.state !== "idle" || pet.bubble) {
    return { event: null, state };
  }

  if (
    state.lastTriggeredAt !== null &&
    now - state.lastTriggeredAt < quietWindowMs
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
