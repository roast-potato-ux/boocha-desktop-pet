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
    expect(
      reducePetState(idle, { type: "meal-reminder", meal: "lunch" }, 2000),
    ).toMatchObject({
      state: "eat",
      bubble: "饭点到",
    });
  });

  it("never creates a fourth pet state after click feedback", () => {
    const result = reducePetState(idle, { type: "pet-click" }, 3000);

    expect(["idle", "work", "eat"]).toContain(result.state);
  });

  it("shows ambient idle feedback without leaving idle mode", () => {
    const result = reducePetState(
      idle,
      { type: "ambient-interaction", seed: 0 },
      3500,
    );

    expect(result).toMatchObject({
      state: "idle",
      bubble: "偷偷冒个泡",
      lastInteractionAt: 3500,
    });
  });

  it("clears a bubble without changing the current pet state", () => {
    const work: PetViewModel = {
      state: "work",
      bubble: "别忘了保存",
      lastInteractionAt: 4000,
    };

    const result = reducePetState(
      work,
      { type: "clear-bubble", interactionAt: 4000 },
      5000,
    );

    expect(result).toEqual({
      state: "work",
      bubble: null,
      lastInteractionAt: 4000,
    });
  });

  it("does not clear a newer bubble from an older timer", () => {
    const newerInteraction: PetViewModel = {
      state: "idle",
      bubble: "我在",
      lastInteractionAt: 7000,
    };

    const result = reducePetState(
      newerInteraction,
      { type: "clear-bubble", interactionAt: 6000 },
      8000,
    );

    expect(result).toBe(newerInteraction);
  });

  it("cycles through the three visible states for manual preview", () => {
    const work = reducePetState(idle, { type: "cycle-state" }, 4000);
    const eat = reducePetState(work, { type: "cycle-state" }, 5000);
    const backToIdle = reducePetState(eat, { type: "cycle-state" }, 6000);

    expect(work.state).toBe("work");
    expect(eat.state).toBe("eat");
    expect(backToIdle.state).toBe("idle");
  });
});
