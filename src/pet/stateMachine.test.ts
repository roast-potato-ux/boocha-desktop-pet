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

  it("cycles through the three visible states for manual preview", () => {
    const work = reducePetState(idle, { type: "cycle-state" }, 4000);
    const eat = reducePetState(work, { type: "cycle-state" }, 5000);
    const backToIdle = reducePetState(eat, { type: "cycle-state" }, 6000);

    expect(work.state).toBe("work");
    expect(eat.state).toBe("eat");
    expect(backToIdle.state).toBe("idle");
  });
});
