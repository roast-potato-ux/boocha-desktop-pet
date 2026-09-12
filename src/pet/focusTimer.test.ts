import { describe, expect, it } from "vitest";
import {
  createInactiveFocusTimer,
  evaluateFocusTimer,
  formatTimerSeconds,
  isFocusTimerActive,
  isFocusTimerPaused,
  pauseFocusTimer,
  resumeFocusTimer,
  startCountdown,
  startCountdownSeconds,
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

  it("starts a countdown with an exact second duration", () => {
    const timer = startCountdownSeconds(1_000, 25 * 60 + 30);
    const result = evaluateFocusTimer(31_000, timer);

    expect(result.display).toBe("25:00");
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

  it("reports paused and active states", () => {
    const inactive = createInactiveFocusTimer();
    expect(isFocusTimerPaused(inactive)).toBe(false);
    expect(isFocusTimerActive(inactive)).toBe(false);

    const running = startStopwatch(1_000);
    expect(isFocusTimerPaused(running)).toBe(false);
    expect(isFocusTimerActive(running)).toBe(true);

    const paused = pauseFocusTimer(5_000, running);
    expect(isFocusTimerPaused(paused)).toBe(true);
    expect(isFocusTimerActive(paused)).toBe(true);
  });

  it("freezes the stopwatch display while paused", () => {
    const running = startStopwatch(1_000);
    const paused = pauseFocusTimer(10_000, running);

    const duringPause = evaluateFocusTimer(95_000, paused);
    expect(duringPause.display).toBe("00:09");
    expect(duringPause.state).toBe(paused);

    // Pausing an already paused timer is a no-op.
    expect(pauseFocusTimer(50_000, paused)).toBe(paused);
  });

  it("excludes paused time after resuming", () => {
    const running = startStopwatch(1_000);
    const paused = pauseFocusTimer(10_000, running);
    const resumed = resumeFocusTimer(70_000, paused);

    // 60s spent paused must not count: only 9s elapsed.
    const result = evaluateFocusTimer(80_000, resumed);
    expect(result.display).toBe("00:19");
    expect(isFocusTimerPaused(resumed)).toBe(false);

    // Resuming a running timer is a no-op.
    expect(resumeFocusTimer(90_000, resumed)).toBe(resumed);
  });

  it("pauses and resumes an inactive timer as a no-op", () => {
    const inactive = createInactiveFocusTimer();
    expect(pauseFocusTimer(1_000, inactive)).toBe(inactive);
    expect(resumeFocusTimer(2_000, inactive)).toBe(inactive);
  });

  it("never completes a paused countdown even at zero remaining", () => {
    const running = startCountdown(1_000, 5);
    // 4 minutes pass (1 minute remaining), then pause for 10 minutes.
    const paused = pauseFocusTimer(241_000, running);

    const duringPause = evaluateFocusTimer(841_000, paused);
    expect(duringPause.display).toBe("01:00");
    expect(duringPause.completed).toBe(false);
    expect(duringPause.state).toBe(paused);

    // Resume and let the last minute tick away.
    const resumed = resumeFocusTimer(841_000, paused);
    const finished = evaluateFocusTimer(902_000, resumed);
    expect(finished.display).toBe("00:00");
    expect(finished.completed).toBe(true);
    expect(finished.state).toEqual(createInactiveFocusTimer());
  });
});
