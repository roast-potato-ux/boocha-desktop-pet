export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function pixelOffset(width: number, x: number, y: number): number {
  return (y * width + x) * 4;
}

function readColor(pixels: Uint8ClampedArray, offset: number): RgbColor {
  return {
    r: pixels[offset],
    g: pixels[offset + 1],
    b: pixels[offset + 2],
  };
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;

  return Math.sqrt(red * red + green * green + blue * blue);
}

function luminance(color: RgbColor): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

function isBrightCharacterFill(color: RgbColor, keyColor: RgbColor): boolean {
  return (
    color.r >= keyColor.r &&
    color.g >= keyColor.g &&
    color.b >= keyColor.b &&
    luminance(color) - luminance(keyColor) >= 8
  );
}

export function sampleCornerColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): RgbColor {
  const corners = [
    readColor(pixels, pixelOffset(width, 0, 0)),
    readColor(pixels, pixelOffset(width, width - 1, 0)),
    readColor(pixels, pixelOffset(width, 0, height - 1)),
    readColor(pixels, pixelOffset(width, width - 1, height - 1)),
  ];

  return {
    r: Math.round(corners.reduce((sum, color) => sum + color.r, 0) / corners.length),
    g: Math.round(corners.reduce((sum, color) => sum + color.g, 0) / corners.length),
    b: Math.round(corners.reduce((sum, color) => sum + color.b, 0) / corners.length),
  };
}

export function removeBackgroundPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  keyColor: RgbColor,
  threshold: number,
): void {
  const visited = new Uint8Array(width * height);
  const stack: Array<[number, number]> = [];
  const softThreshold = threshold * 2.5;
  const seedSize = Math.max(2, Math.ceil(Math.min(width, height) * 0.08));

  for (let y = 0; y < seedSize; y += 1) {
    for (let x = 0; x < seedSize; x += 1) {
      stack.push(
        [x, y],
        [width - 1 - x, y],
        [x, height - 1 - y],
        [width - 1 - x, height - 1 - y],
      );
    }
  }

  while (stack.length > 0) {
    const next = stack.pop();

    if (!next) {
      continue;
    }

    const [x, y] = next;
    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) {
      continue;
    }

    visited[pixelIndex] = 1;
    const offset = pixelIndex * 4;
    const color = readColor(pixels, offset);

    if (isBrightCharacterFill(color, keyColor)) {
      continue;
    }

    const distance = colorDistance(color, keyColor);

    if (distance > softThreshold) {
      continue;
    }

    if (distance <= threshold) {
      pixels[offset + 3] = 0;
    } else {
      const opacity = (distance - threshold) / (softThreshold - threshold);
      pixels[offset + 3] = Math.round(255 * opacity);
    }

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
