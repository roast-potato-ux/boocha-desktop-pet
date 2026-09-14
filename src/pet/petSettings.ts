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
    eatMinutes: number;
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
  surprise: {
    enabled: boolean;
  };
}

interface PetSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const petSettingsStorageKey = "boocha.pet.settings.v1";

export type BubbleGroup = "idle" | "work" | "eat";

function uniqueLines(...sources: string[][]): string[] {
  return [...new Set(sources.flat().map((line) => line.trim()).filter(Boolean))];
}

export function getBubbleGroupLines(
  bubbles: PetBubbleSettings,
  group: BubbleGroup,
): string[] {
  if (group === "idle") {
    return uniqueLines(bubbles.idleClick, bubbles.ambientIdle);
  }

  if (group === "work") {
    return uniqueLines(bubbles.workClick, bubbles.workStart);
  }

  return uniqueLines(bubbles.eatClick, bubbles.lunch, bubbles.dinner);
}

export function setBubbleGroupLines(
  bubbles: PetBubbleSettings,
  group: BubbleGroup,
  lines: string[],
): PetBubbleSettings {
  const nextLines = uniqueLines(lines);

  if (group === "idle") {
    return { ...bubbles, idleClick: nextLines, ambientIdle: nextLines };
  }

  if (group === "work") {
    return { ...bubbles, workClick: nextLines, workStart: nextLines };
  }

  return {
    ...bubbles,
    eatClick: nextLines,
    lunch: nextLines,
    dinner: nextLines,
  };
}

export function createDefaultPetSettings(): PetSettings {
  const idleLines = [
    "我在",
    "摸鱼一下",
    "今天也要好好吃饭",
    "偷偷冒个泡",
    "发呆中",
    "陪你趴一会儿",
  ];
  const workLines = ["盯着你工作", "别忘了保存", "认真五分钟也算认真", "开始认真搬砖"];
  const eatLines = ["饭饭时间", "香", "先吃两口", "饭点到", "晚饭时间"];

  return {
    scale: 0.7,
    durations: {
      eatMinutes: 1,
      idleInteractionMinutes: 3,
    },
    meals: {
      lunch: "12:00",
      dinner: "18:30",
    },
    bubbles: {
      idleClick: idleLines,
      ambientIdle: idleLines,
      workClick: workLines,
      workStart: workLines,
      eatClick: eatLines,
      lunch: eatLines,
      dinner: eatLines,
    },
    timer: {
      countdownCompleteLines: ["时间到，休息一下"],
    },
    startup: {
      launchAtLogin: false,
    },
    surprise: {
      enabled: false,
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

function normalizeGroupLines(
  source: Record<string, unknown>,
  fields: (keyof PetBubbleSettings)[],
  fallback: string[],
): string[] {
  const configuredFields = fields.filter((field) =>
    Object.prototype.hasOwnProperty.call(source, field),
  );

  if (configuredFields.length === 0) {
    return fallback;
  }

  const lines = uniqueLines(
    ...configuredFields.map((field) => normalizeLines(source[field], [])),
  );

  const hasExplicitEmptyGroup = configuredFields.some(
    (field) => Array.isArray(source[field]) && source[field].length === 0,
  );

  return lines.length > 0 || hasExplicitEmptyGroup ? lines : fallback;
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
  const surprise =
    source.surprise !== null && typeof source.surprise === "object"
      ? (source.surprise as Record<string, unknown>)
      : {};

  const idleLines = normalizeGroupLines(
    bubbles,
    ["idleClick", "ambientIdle"],
    getBubbleGroupLines(defaults.bubbles, "idle"),
  );
  const workLines = normalizeGroupLines(
    bubbles,
    ["workClick", "workStart"],
    getBubbleGroupLines(defaults.bubbles, "work"),
  );
  const eatLines = normalizeGroupLines(
    bubbles,
    ["eatClick", "lunch", "dinner"],
    getBubbleGroupLines(defaults.bubbles, "eat"),
  );
  const sharedBubbles = setBubbleGroupLines(
    setBubbleGroupLines(
      setBubbleGroupLines(defaults.bubbles, "idle", idleLines),
      "work",
      workLines,
    ),
    "eat",
    eatLines,
  );

  return {
    scale: clamp(source.scale, 0.6, 1.4, defaults.scale),
    durations: {
      eatMinutes: clamp(
        typeof durations.eatMinutes === "number"
          ? durations.eatMinutes
          : typeof durations.eatSeconds === "number"
            ? Math.ceil(durations.eatSeconds / 60)
            : undefined,
        1,
        60,
        defaults.durations.eatMinutes,
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
    bubbles: sharedBubbles,
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
    surprise: {
      enabled:
        typeof surprise.enabled === "boolean"
          ? surprise.enabled
          : defaults.surprise.enabled,
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
