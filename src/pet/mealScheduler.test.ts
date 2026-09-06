import { describe, expect, it } from "vitest";
import { evaluateMealReminder } from "./mealScheduler";
import type { MealReminderState } from "./mealScheduler";

const emptyState: MealReminderState = {
  lunch: null,
  dinner: null,
};

describe("evaluateMealReminder", () => {
  it("triggers lunch at 12:00 local time", () => {
    const result = evaluateMealReminder(
      new Date("2026-09-06T12:00:00+08:00"),
      emptyState,
    );

    expect(result.event).toEqual({ type: "meal-reminder", meal: "lunch" });
  });

  it("triggers dinner at 18:30 local time", () => {
    const result = evaluateMealReminder(
      new Date("2026-09-06T18:30:00+08:00"),
      emptyState,
    );

    expect(result.event).toEqual({ type: "meal-reminder", meal: "dinner" });
  });

  it("does not repeat the same meal reminder within 30 minutes", () => {
    const first = evaluateMealReminder(
      new Date("2026-09-06T12:00:00+08:00"),
      emptyState,
    );
    const repeated = evaluateMealReminder(
      new Date("2026-09-06T12:00:30+08:00"),
      first.state,
    );

    expect(repeated.event).toBeNull();
  });

  it("allows the same meal reminder on the next day", () => {
    const first = evaluateMealReminder(
      new Date("2026-09-06T12:00:00+08:00"),
      emptyState,
    );
    const nextDay = evaluateMealReminder(
      new Date("2026-09-07T12:00:00+08:00"),
      first.state,
    );

    expect(nextDay.event).toEqual({ type: "meal-reminder", meal: "lunch" });
  });
});
