import type { MealKind, PetEvent } from "./types";

export interface MealReminderStamp {
  dayKey: string;
  minuteOfDay: number;
}

export interface MealReminderState {
  lunch: MealReminderStamp | null;
  dinner: MealReminderStamp | null;
}

interface MealSchedule {
  meal: MealKind;
  minuteOfDay: number;
}

interface MealReminderResult {
  event: PetEvent | null;
  state: MealReminderState;
}

interface MealReminderOptions {
  paused?: boolean;
  meals?: {
    lunch: string;
    dinner: string;
  };
  focusQuietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const defaultMeals: MealSchedule[] = [
  { meal: "lunch", minuteOfDay: 12 * 60 },
  { meal: "dinner", minuteOfDay: 18 * 60 + 30 },
];

const suppressMinutes = 30;

function toLocalStamp(now: Date): MealReminderStamp {
  return {
    dayKey: [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-"),
    minuteOfDay: now.getHours() * 60 + now.getMinutes(),
  };
}

function shouldSuppress(
  now: MealReminderStamp,
  last: MealReminderStamp | null,
): boolean {
  return (
    last !== null &&
    last.dayKey === now.dayKey &&
    now.minuteOfDay - last.minuteOfDay < suppressMinutes
  );
}

function parseMealMinute(value: string, fallback: number): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return fallback;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function isWithinQuietHours(
  minuteOfDay: number,
  quietHours: MealReminderOptions["focusQuietHours"],
): boolean {
  if (!quietHours?.enabled) {
    return false;
  }

  const start = parseMealMinute(quietHours.start, -1);
  const end = parseMealMinute(quietHours.end, -1);
  if (start < 0 || end < 0 || start === end) {
    return false;
  }

  if (start < end) {
    return minuteOfDay >= start && minuteOfDay < end;
  }

  return minuteOfDay >= start || minuteOfDay < end;
}

function createMealSchedule(options: MealReminderOptions): MealSchedule[] {
  return [
    {
      meal: "lunch",
      minuteOfDay: parseMealMinute(
        options.meals?.lunch ?? "",
        defaultMeals[0].minuteOfDay,
      ),
    },
    {
      meal: "dinner",
      minuteOfDay: parseMealMinute(
        options.meals?.dinner ?? "",
        defaultMeals[1].minuteOfDay,
      ),
    },
  ];
}

export function evaluateMealReminder(
  now: Date,
  state: MealReminderState,
  options: MealReminderOptions = {},
): MealReminderResult {
  if (options.paused) {
    return { event: null, state };
  }

  const stamp = toLocalStamp(now);
  if (isWithinQuietHours(stamp.minuteOfDay, options.focusQuietHours)) {
    return { event: null, state };
  }

  const matchedMeal = createMealSchedule(options).find(
    (meal) => meal.minuteOfDay === stamp.minuteOfDay,
  );

  if (!matchedMeal) {
    return { event: null, state };
  }

  const lastStamp = state[matchedMeal.meal];
  if (shouldSuppress(stamp, lastStamp)) {
    return { event: null, state };
  }

  return {
    event: { type: "meal-reminder", meal: matchedMeal.meal },
    state: {
      ...state,
      [matchedMeal.meal]: stamp,
    },
  };
}

export function createInitialMealReminderState(): MealReminderState {
  return {
    lunch: null,
    dinner: null,
  };
}
