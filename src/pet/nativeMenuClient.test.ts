import { describe, expect, it } from "vitest";
import { createReminderPauseHandler } from "./nativeMenuClient";

describe("createReminderPauseHandler", () => {
  it("sets reminders to paused when the native menu event payload is true", () => {
    const values: boolean[] = [];
    const handlePauseChange = createReminderPauseHandler((paused) => {
      values.push(paused);
    });

    handlePauseChange({ payload: true });

    expect(values).toEqual([true]);
  });

  it("sets reminders to resumed when the native menu event payload is false", () => {
    const values: boolean[] = [];
    const handlePauseChange = createReminderPauseHandler((paused) => {
      values.push(paused);
    });

    handlePauseChange({ payload: false });

    expect(values).toEqual([false]);
  });

  it("ignores malformed native menu event payloads", () => {
    const values: boolean[] = [];
    const handlePauseChange = createReminderPauseHandler((paused) => {
      values.push(paused);
    });

    handlePauseChange({ payload: "paused" });

    expect(values).toEqual([]);
  });
});
