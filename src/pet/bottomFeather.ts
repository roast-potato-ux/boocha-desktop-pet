export function applyBottomFeather(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  featherRows: number,
): void {
  const rows = Math.min(Math.max(0, featherRows), height);

  for (let fadeRow = 0; fadeRow < rows; fadeRow += 1) {
    const y = height - rows + fadeRow;
    const alphaScale = (rows - fadeRow - 1) / rows;

    for (let x = 0; x < width; x += 1) {
      const alphaOffset = (y * width + x) * 4 + 3;
      pixels[alphaOffset] = Math.round(pixels[alphaOffset] * alphaScale);
    }
  }
}
