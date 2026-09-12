import { describe, expect, it } from "vitest";
import { createDefaultPetSettings } from "./petSettings";
import {
  createAutostartOperationTracker,
  synchronizeAutostartSettings,
  withAutostartEnabled,
} from "./autostartState";

describe("autostartState", () => {
  it("keeps an in-progress preview visible without accidentally saving it", () => {
    const persistedSettings = createDefaultPetSettings();
    const displayedSettings = {
      ...createDefaultPetSettings(),
      scale: 1.25,
      meals: { lunch: "11:45", dinner: "19:15" },
    };

    expect(synchronizeAutostartSettings(
      persistedSettings,
      displayedSettings,
      true,
    )).toEqual({
      persistedSettings: {
        ...persistedSettings,
        startup: { launchAtLogin: true },
      },
      displayedSettings: {
        ...displayedSettings,
        startup: { launchAtLogin: true },
      },
    });
  });

  it("only changes the autostart field when merging a system result", () => {
    const latestSettings = {
      ...createDefaultPetSettings(),
      scale: 1.25,
    };

    expect(withAutostartEnabled(latestSettings, true)).toEqual({
      ...latestSettings,
      startup: { launchAtLogin: true },
    });
  });

  it("marks older reads stale after a newer update begins", () => {
    const operations = createAutostartOperationTracker();
    const settingsRead = operations.begin();
    const userToggle = operations.begin();

    expect(operations.isCurrent(settingsRead)).toBe(false);
    expect(operations.isCurrent(userToggle)).toBe(true);
  });
});
