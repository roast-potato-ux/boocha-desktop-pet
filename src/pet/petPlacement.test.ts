import { describe, expect, it } from "vitest";
import {
  applyDrag,
  getDefaultPetPosition,
  loadPetPosition,
  savePetPosition,
} from "./petPlacement";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  length = 0;

  clear(): void {
    this.values.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
    this.length = this.values.size;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
    this.length = this.values.size;
  }
}

describe("petPlacement", () => {
  it("places the pet near the lower right on first launch", () => {
    expect(getDefaultPetPosition({ width: 1200, height: 800 })).toEqual({
      left: 988,
      top: 556,
    });
  });

  it("keeps dragging inside the visible viewport", () => {
    const next = applyDrag({
      startPosition: { left: 100, top: 100 },
      startPointer: { x: 100, y: 100 },
      currentPointer: { x: -300, y: 900 },
      viewport: { width: 500, height: 400 },
    });

    expect(next).toEqual({ left: 0, top: 180 });
  });

  it("loads and saves a valid pet position", () => {
    const storage = new MemoryStorage();

    savePetPosition(storage, { left: 42, top: 99 });

    expect(loadPetPosition(storage)).toEqual({ left: 42, top: 99 });
  });

  it("ignores invalid stored positions", () => {
    const storage = new MemoryStorage();
    storage.setItem("booch.pet.position", "{\"left\":\"x\",\"top\":99}");

    expect(loadPetPosition(storage)).toBeNull();
  });
});
