import { describe, expect, it } from "vitest";
import { applyBottomFeather } from "./bottomFeather";

describe("applyBottomFeather", () => {
  it("fades the final source row to hide a straight recording cut", () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ]);

    applyBottomFeather(pixels, 1, 3, 2);

    expect(pixels[3]).toBe(255);
    expect(pixels[7]).toBeLessThan(255);
    expect(pixels[11]).toBe(0);
  });

  it("does not change color channels while fading alpha", () => {
    const pixels = new Uint8ClampedArray([
      12, 34, 56, 255,
      78, 90, 12, 255,
    ]);

    applyBottomFeather(pixels, 1, 2, 1);

    expect(Array.from(pixels.slice(0, 3))).toEqual([12, 34, 56]);
    expect(Array.from(pixels.slice(4, 7))).toEqual([78, 90, 12]);
  });
});
