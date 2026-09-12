export interface PetPosition {
  left: number;
  top: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PointerPoint {
  x: number;
  y: number;
}

interface DragInput {
  startPosition: PetPosition;
  startPointer: PointerPoint;
  currentPointer: PointerPoint;
  viewport: ViewportSize;
}

export const petFrame = {
  width: 188,
  height: 220,
};

const margin = 24;
const storageKey = "boocha.pet.position";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getDefaultPetPosition(viewport: ViewportSize): PetPosition {
  return {
    left: Math.max(margin, viewport.width - petFrame.width - margin),
    top: Math.max(margin, viewport.height - petFrame.height - margin),
  };
}

export function clampPetPosition(
  position: PetPosition,
  viewport: ViewportSize,
): PetPosition {
  return {
    left: clamp(position.left, 0, Math.max(0, viewport.width - petFrame.width)),
    top: clamp(position.top, 0, Math.max(0, viewport.height - petFrame.height)),
  };
}

export function applyDrag(input: DragInput): PetPosition {
  return clampPetPosition(
    {
      left: input.startPosition.left + input.currentPointer.x - input.startPointer.x,
      top: input.startPosition.top + input.currentPointer.y - input.startPointer.y,
    },
    input.viewport,
  );
}

export function loadPetPosition(storage: Storage): PetPosition | null {
  const rawValue = storage.getItem(storageKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PetPosition>;

    if (typeof parsed.left === "number" && typeof parsed.top === "number") {
      return { left: parsed.left, top: parsed.top };
    }
  } catch {
    return null;
  }

  return null;
}

export function savePetPosition(storage: Storage, position: PetPosition): void {
  storage.setItem(storageKey, JSON.stringify(position));
}
