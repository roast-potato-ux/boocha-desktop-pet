export interface PetBubbleSettings {
  idleClick: string[];
  workClick: string[];
  eatClick: string[];
  ambientIdle: string[];
  lunch: string[];
  dinner: string[];
  workStart: string[];
}

export interface PetSettings {
  scale: number;
  durations: {
    eatSeconds: number;
    idleInteractionMinutes: number;
  };
  meals: {
    lunch: string;
    dinner: string;
  };
  bubbles: PetBubbleSettings;
  timer: {
    countdownCompleteLines: string[];
  };
  startup: {
    launchAtLogin: boolean;
  };
}

interface PetSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const petSettingsStorageKey = "boocha.pet.settings.v1";

export function createDefaultPetSettings(): PetSettings {
  return {
    scale: 1,
    durations: {
      eatSeconds: 30,
      idleInteractionMinutes: 3,
    },
    meals: {
      lunch: "12:00",
      dinner: "18:30",
    },
    bubbles: {
      idleClick: ["我在", "摸鱼一下", "今天也要好好吃饭"],
      workClick: ["盯着你工作", "别忘了保存", "认真五分钟也算认真"],
      eatClick: ["饭饭时间", "香", "先吃两口"],
      ambientIdle: ["偷偷冒个泡", "发呆中", "陪你趴一会儿"],
      lunch: ["饭点到"],
      dinner: ["晚饭时间"],
      workStart: ["开始认真搬砖"],
    },
    timer: {
      countdownCompleteLines: ["时间到，休息一下"],
    },
    startup: {
      launchAtLogin: false,
    },
  };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function isTimeString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match !== null;
}

function normalizeLines(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const lines = value
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean);

  // An explicit empty array means the user removed every tag. A non-empty
  // payload that becomes empty only after validation is malformed, so retain
  // the safe defaults for it instead.
  return value.length === 0 || lines.length > 0 ? lines : fallback;
}

export function normalizePetSettings(input: unknown): PetSettings {
  const defaults = createDefaultPetSettings();
  const source =
    input !== null && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const durations =
    source.durations !== null && typeof source.durations === "object"
      ? (source.durations as Record<string, unknown>)
      : {};
  const meals =
    source.meals !== null && typeof source.meals === "object"
      ? (source.meals as Record<string, unknown>)
      : {};
  const bubbles =
    source.bubbles !== null && typeof source.bubbles === "object"
      ? (source.bubbles as Record<string, unknown>)
      : {};
  const timer =
    source.timer !== null && typeof source.timer === "object"
      ? (source.timer as Record<string, unknown>)
      : {};
  const startup =
    source.startup !== null && typeof source.startup === "object"
      ? (source.startup as Record<string, unknown>)
      : {};

  return {
    scale: clamp(source.scale, 0.6, 1.4, defaults.scale),
    durations: {
      eatSeconds: clamp(
        durations.eatSeconds,
        10,
        180,
        defaults.durations.eatSeconds,
      ),
      idleInteractionMinutes: clamp(
        durations.idleInteractionMinutes,
        1,
        30,
        defaults.durations.idleInteractionMinutes,
      ),
    },
    meals: {
      lunch: isTimeString(meals.lunch) ? meals.lunch : defaults.meals.lunch,
      dinner: isTimeString(meals.dinner) ? meals.dinner : defaults.meals.dinner,
    },
    bubbles: {
      idleClick: normalizeLines(bubbles.idleClick, defaults.bubbles.idleClick),
      workClick: normalizeLines(bubbles.workClick, defaults.bubbles.workClick),
      eatClick: normalizeLines(bubbles.eatClick, defaults.bubbles.eatClick),
      ambientIdle: normalizeLines(
        bubbles.ambientIdle,
        defaults.bubbles.ambientIdle,
      ),
      lunch: normalizeLines(bubbles.lunch, defaults.bubbles.lunch),
      dinner: normalizeLines(bubbles.dinner, defaults.bubbles.dinner),
      workStart: normalizeLines(bubbles.workStart, defaults.bubbles.workStart),
    },
    timer: {
      countdownCompleteLines: normalizeLines(
        timer.countdownCompleteLines,
        defaults.timer.countdownCompleteLines,
      ),
    },
    startup: {
      launchAtLogin:
        typeof startup.launchAtLogin === "boolean"
          ? startup.launchAtLogin
          : defaults.startup.launchAtLogin,
    },
  };
}

export function loadPetSettings(storage: PetSettingsStorage): PetSettings {
  const raw = storage.getItem(petSettingsStorageKey);
  if (!raw) {
    return createDefaultPetSettings();
  }

  try {
    return normalizePetSettings(JSON.parse(raw));
  } catch {
    return createDefaultPetSettings();
  }
}

export function savePetSettings(
  storage: PetSettingsStorage,
  settings: PetSettings,
): PetSettings {
  const normalized = normalizePetSettings(settings);
  storage.setItem(petSettingsStorageKey, JSON.stringify(normalized));
  return normalized;
}
