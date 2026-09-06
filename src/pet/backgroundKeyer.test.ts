import { describe, expect, it } from "vitest";
import { removeBackgroundPixels, sampleCornerColor } from "./backgroundKeyer";

describe("backgroundKeyer", () => {
  it("samples the background color from frame corners", () => {
    const pixels = new Uint8ClampedArray([
      240, 240, 236, 255,
      30, 30, 30, 255,
      244, 242, 238, 255,
      40, 40, 40, 255,
      20, 20, 20, 255,
      50, 50, 50, 255,
      242, 242, 238, 255,
      30, 30, 30, 255,
      242, 242, 238, 255,
    ]);

    expect(sampleCornerColor(pixels, 3, 3)).toEqual({ r: 242, g: 242, b: 238 });
  });

  it("turns matching background pixels transparent", () => {
    const pixels = new Uint8ClampedArray([
      242, 241, 237, 255,
      32, 28, 24, 255,
    ]);

    removeBackgroundPixels(pixels, 2, 1, { r: 242, g: 241, b: 237 }, 18);

    expect(Array.from(pixels)).toEqual([
      242, 241, 237, 0,
      32, 28, 24, 255,
    ]);
  });

  it("also fades pixels close to the background color", () => {
    const pixels = new Uint8ClampedArray([
      248, 246, 242, 255,
      180, 130, 70, 255,
    ]);

    removeBackgroundPixels(pixels, 2, 1, { r: 242, g: 241, b: 237 }, 18);

    expect(pixels[3]).toBeLessThan(255);
    expect(pixels[7]).toBe(255);
  });

  it("keeps matching character fill when it is enclosed by outlines", () => {
    const background = [242, 241, 237, 255];
    const outline = [20, 20, 20, 255];
    const fill = [244, 242, 238, 255];
    const pixels = new Uint8ClampedArray([
      ...background, ...background, ...background, ...background, ...background,
      ...background, ...outline, ...outline, ...outline, ...background,
      ...background, ...outline, ...fill, ...outline, ...background,
      ...background, ...outline, ...outline, ...outline, ...background,
      ...background, ...background, ...background, ...background, ...background,
    ]);

    removeBackgroundPixels(pixels, 5, 5, { r: 242, g: 241, b: 237 }, 18);

    const centerAlpha = pixels[(2 * 5 + 2) * 4 + 3];
    const cornerAlpha = pixels[3];

    expect(centerAlpha).toBe(255);
    expect(cornerAlpha).toBe(0);
  });

  it("keeps light character fill when the character reaches the frame edge", () => {
    const background = [242, 241, 237, 255];
    const outline = [20, 20, 20, 255];
    const fill = [255, 255, 255, 255];
    const pixels = new Uint8ClampedArray([
      ...background, ...background, ...background, ...background, ...background,
      ...background, ...outline, ...outline, ...outline, ...outline,
      ...background, ...outline, ...fill, ...fill, ...fill,
      ...background, ...outline, ...outline, ...outline, ...outline,
      ...background, ...background, ...background, ...background, ...background,
    ]);

    removeBackgroundPixels(pixels, 5, 5, { r: 242, g: 241, b: 237 }, 18);

    const edgeFillAlpha = pixels[(2 * 5 + 4) * 4 + 3];

    expect(edgeFillAlpha).toBe(255);
  });

  it("does not let bright character fill become a path into the character body", () => {
    const background = [242, 241, 237, 255];
    const outline = [20, 20, 20, 255];
    const fill = [255, 255, 255, 255];
    const pixels = new Uint8ClampedArray([
      ...background, ...background, ...background, ...background, ...background,
      ...background, ...outline, ...fill, ...outline, ...background,
      ...background, ...outline, ...fill, ...outline, ...background,
      ...background, ...outline, ...fill, ...outline, ...background,
      ...background, ...background, ...background, ...background, ...background,
    ]);

    removeBackgroundPixels(pixels, 5, 5, { r: 242, g: 241, b: 237 }, 18);

    const topGapFillAlpha = pixels[(1 * 5 + 2) * 4 + 3];
    const innerFillAlpha = pixels[(2 * 5 + 2) * 4 + 3];

    expect(topGapFillAlpha).toBe(255);
    expect(innerFillAlpha).toBe(255);
  });
});
