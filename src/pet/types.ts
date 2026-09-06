export type PetState = "idle" | "work" | "eat";

export type MealKind = "lunch" | "dinner";

export type PetEvent =
  | { type: "pet-click" }
  | { type: "start-work" }
  | { type: "stop-work" }
  | { type: "meal-reminder"; meal: MealKind }
  | { type: "cycle-state" }
  | { type: "return-idle" };

export interface PetViewModel {
  state: PetState;
  bubble: string | null;
  lastInteractionAt: number;
}
