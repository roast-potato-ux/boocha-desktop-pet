import { describe, expect, it } from "vitest";
import { scheduleWorkSurprise } from "./workSurprise";

function randomValues(...values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("scheduleWorkSurprise", () => {
  it("schedules the earliest allowed surprise after a successful 30% draw", () => {
    expect(scheduleWorkSurprise(1_000, randomValues(0.29, 0), true)).toEqual({
      dueAt: 301_000,
    });
  });

  it("uses the inclusive 30-minute upper delay boundary", () => {
    expect(scheduleWorkSurprise(1_000, randomValues(0, 0.999_999), true)).toEqual({
      dueAt: 1_801_000,
    });
  });

  it("does not schedule when the switch is off or the 30% draw misses", () => {
    expect(scheduleWorkSurprise(1_000, randomValues(0), false)).toBeNull();
    expect(scheduleWorkSurprise(1_000, randomValues(0.3), true)).toBeNull();
  });
});
