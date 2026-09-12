export type PetState = "idle" | "work" | "eat";

export type MealKind = "lunch" | "dinner";

export type PetEvent =
  | { type: "pet-click" }
  | { type: "ambient-interaction"; seed: number }
  | { type: "start-work" }
  | { type: "stop-work" }
  | { type: "select-state"; state: PetState }
  | { type: "meal-reminder"; meal: MealKind }
  | { type: "cycle-state" }
  | { type: "clear-bubble"; interactionAt: number }
  | { type: "return-previous" }
  | { type: "countdown-complete"; bubble: string };

export interface PetViewModel {
  state: PetState;
  previousState: PetState | null;
  bubble: string | null;
  lastInteractionAt: number;
}
