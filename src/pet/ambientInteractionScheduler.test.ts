import { describe, expect, it } from "vitest";
import {
  createInitialAmbientInteractionState,
  evaluateAmbientInteraction,
} from "./ambientInteractionScheduler";
import type { PetViewModel } from "./types";

const idlePet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: 0,
};

describe("evaluateAmbientInteraction", () => {
  it("triggers an ambient interaction for an idle pet after the quiet window", () => {
    const result = evaluateAmbientInteraction(
      100_000,
      idlePet,
      createInitialAmbientInteractionState(),
      0.05,
    );

    expect(result.event).toEqual({ type: "ambient-interaction", seed: 50 });
    expect(result.state.lastTriggeredAt).toBe(100_000);
  });

  it("does not trigger ambient interactions while the pet is working", () => {
    const result = evaluateAmbientInteraction(
      100_000,
      { ...idlePet, state: "work" },
      createInitialAmbientInteractionState(),
      0.05,
    );

    expect(result.event).toBeNull();
  });

  it("does not trigger ambient interactions while a bubble is already visible", () => {
    const result = evaluateAmbientInteraction(
      100_000,
      { ...idlePet, bubble: "我在" },
      createInitialAmbientInteractionState(),
      0.05,
    );

    expect(result.event).toBeNull();
  });

  it("does not trigger again before the quiet window has passed", () => {
    const result = evaluateAmbientInteraction(
      130_000,
      idlePet,
      { lastTriggeredAt: 100_000 },
      0.05,
    );

    expect(result.event).toBeNull();
    expect(result.state).toEqual({ lastTriggeredAt: 100_000 });
  });

  it("uses a customized idle interaction interval from settings", () => {
    const result = evaluateAmbientInteraction(
      250_000,
      idlePet,
      { lastTriggeredAt: 100_000 },
      0.05,
      { idleInteractionMinutes: 3 },
    );

    expect(result.event).toBeNull();
    expect(result.state).toEqual({ lastTriggeredAt: 100_000 });
  });

  it("does not trigger when the random roll is above the chance", () => {
    const result = evaluateAmbientInteraction(
      100_000,
      idlePet,
      createInitialAmbientInteractionState(),
      0.95,
    );

    expect(result.event).toBeNull();
  });
});
