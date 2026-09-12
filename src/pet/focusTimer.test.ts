import { describe, expect, it } from "vitest";
import {
  createInactiveFocusTimer,
  evaluateFocusTimer,
  formatTimerSeconds,
  startCountdown,
  startStopwatch,
  stopFocusTimer,
} from "./focusTimer";

describe("focusTimer", () => {
  it("formats timer seconds as mm:ss", () => {
    expect(formatTimerSeconds(0)).toBe("00:00");
    expect(formatTimerSeconds(5)).toBe("00:05");
    expect(formatTimerSeconds(25 * 60)).toBe("25:00");
    expect(formatTimerSeconds(61 * 60 + 2)).toBe("61:02");
  });

  it("evaluates a running stopwatch", () => {
    const timer = startStopwatch(1_000);
    const result = evaluateFocusTimer(66_000, timer);

    expect(result.display).toBe("01:05");
    expect(result.completed).toBe(false);
    expect(result.state.mode).toBe("stopwatch");
  });

  it("evaluates a running countdown", () => {
    const timer = startCountdown(1_000, 5);
    const result = evaluateFocusTimer(61_000, timer);

    expect(result.display).toBe("04:00");
    expect(result.completed).toBe(false);
    expect(result.state.mode).toBe("countdown");
  });

  it("completes a countdown at zero", () => {
    const timer = startCountdown(1_000, 5);
    const result = evaluateFocusTimer(301_000, timer);

    expect(result.display).toBe("00:00");
    expect(result.completed).toBe(true);
    expect(result.state).toEqual(createInactiveFocusTimer());
  });

  it("stops any running focus timer", () => {
    expect(stopFocusTimer()).toEqual(createInactiveFocusTimer());
  });
});
