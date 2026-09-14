import { describe, expect, it } from "vitest";
import {
  createDefaultPetSettings,
  loadPetSettings,
  normalizePetSettings,
  savePetSettings,
} from "./petSettings";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("petSettings", () => {
  it("provides defaults for the first local settings panel", () => {
    expect(createDefaultPetSettings()).toMatchObject({
      scale: 0.7,
      durations: {
        eatMinutes: 1,
        idleInteractionMinutes: 3,
      },
      meals: {
        lunch: "12:00",
        dinner: "18:30",
      },
    });
  });

  it("provides focus timer defaults and no longer exposes pause or quiet hours", () => {
    const settings = createDefaultPetSettings();

    expect(settings).toMatchObject({
      timer: {
        countdownCompleteLines: ["时间到，休息一下"],
      },
      startup: {
        launchAtLogin: false,
      },
    });
    expect("remindersPaused" in settings).toBe(false);
    expect("focusQuietHours" in settings).toBe(false);
    expect("workMinutes" in settings.durations).toBe(false);
  });

  it("keeps the work surprise disabled unless the user explicitly enables it", () => {
    expect(createDefaultPetSettings().surprise).toEqual({ enabled: false });
    expect(normalizePetSettings({}).surprise).toEqual({ enabled: false });
    expect(normalizePetSettings({ surprise: { enabled: true } }).surprise).toEqual({
      enabled: true,
    });
  });

  it("loads saved settings while filling missing fields from defaults", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "boocha.pet.settings.v1",
      JSON.stringify({
        scale: 1.2,
        meals: { lunch: "11:45" },
        bubbles: { lunch: ["开饭开饭"] },
        startup: { launchAtLogin: true },
      }),
    );

    const settings = loadPetSettings(storage);

    expect(settings.scale).toBe(1.2);
    expect(settings.meals).toEqual({ lunch: "11:45", dinner: "18:30" });
    expect(settings.bubbles.lunch).toEqual(["开饭开饭"]);
    expect(settings.bubbles.workClick.length).toBeGreaterThan(0);
    expect(settings.startup).toEqual({ launchAtLogin: true });
  });

  it("migrates an old eating duration in seconds to whole minutes and shares each bubble group", () => {
    const settings = normalizePetSettings({
      durations: { eatSeconds: 30 },
      bubbles: {
        idleClick: ["点我"],
        ambientIdle: ["自己说话"],
        workClick: ["工作中"],
        workStart: ["开始啦"],
        eatClick: ["吃饭"],
        lunch: ["午饭"],
        dinner: ["晚饭"],
      },
    });

    expect(settings.durations.eatMinutes).toBe(1);
    expect(settings.bubbles.idleClick).toEqual(["点我", "自己说话"]);
    expect(settings.bubbles.ambientIdle).toEqual(["点我", "自己说话"]);
    expect(settings.bubbles.workClick).toEqual(["工作中", "开始啦"]);
    expect(settings.bubbles.workStart).toEqual(["工作中", "开始啦"]);
    expect(settings.bubbles.eatClick).toEqual(["吃饭", "午饭", "晚饭"]);
    expect(settings.bubbles.lunch).toEqual(["吃饭", "午饭", "晚饭"]);
    expect(settings.bubbles.dinner).toEqual(["吃饭", "午饭", "晚饭"]);
  });

  it("falls back to defaults when saved settings are not readable", () => {
    const storage = new MemoryStorage();
    storage.setItem("boocha.pet.settings.v1", "{");

    expect(loadPetSettings(storage)).toEqual(createDefaultPetSettings());
  });

  it("keeps unsafe values within usable local prototype ranges", () => {
    const settings = normalizePetSettings({
      scale: 9,
      durations: {
        eatMinutes: 0,
        idleInteractionMinutes: 0,
      },
      meals: {
        lunch: "99:99",
        dinner: "19:15",
      },
      bubbles: {
        idleClick: ["  "],
        lunch: ["开饭"],
      },
      timer: {
        countdownCompleteLines: ["  完成啦  "],
      },
    });

    expect(settings.scale).toBe(1.4);
    expect(settings.durations).toEqual({
      eatMinutes: 1,
      idleInteractionMinutes: 1,
    });
    expect(settings.meals).toEqual({ lunch: "12:00", dinner: "19:15" });
    expect(settings.bubbles.idleClick).toEqual(
      createDefaultPetSettings().bubbles.idleClick,
    );
    expect(settings.bubbles.lunch).toEqual(["开饭"]);
    expect(settings.timer).toEqual({
      countdownCompleteLines: ["完成啦"],
    });
  });

  it("saves normalized settings to local storage", () => {
    const storage = new MemoryStorage();

    savePetSettings(storage, {
      ...createDefaultPetSettings(),
      scale: 0.2,
    });

    expect(JSON.parse(storage.getItem("boocha.pet.settings.v1") ?? "{}").scale).toBe(
      0.6,
    );
  });
});
