import { describe, expect, it } from "vitest";
import {
  createPetStateRequestHandler,
  createReminderPauseHandler,
  createSettingsPanelRequestHandler,
} from "./nativeMenuClient";

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

describe("createPetStateRequestHandler", () => {
  it("passes through a valid native pet state request", () => {
    const states: string[] = [];
    const handlePetStateRequest = createPetStateRequestHandler((state) => {
      states.push(state);
    });

    handlePetStateRequest({ payload: "work" });

    expect(states).toEqual(["work"]);
  });

  it("ignores malformed native pet state requests", () => {
    const states: string[] = [];
    const handlePetStateRequest = createPetStateRequestHandler((state) => {
      states.push(state);
    });

    handlePetStateRequest({ payload: "sleep" });
    handlePetStateRequest({ payload: "surprise" });
    handlePetStateRequest({ payload: 1 });

    expect(states).toEqual([]);
  });
});

describe("createSettingsPanelRequestHandler", () => {
  it("opens the settings panel when the native menu requests it", () => {
    let requests = 0;
    const handleSettingsRequest = createSettingsPanelRequestHandler(() => {
      requests += 1;
    });

    handleSettingsRequest();

    expect(requests).toBe(1);
  });
});
