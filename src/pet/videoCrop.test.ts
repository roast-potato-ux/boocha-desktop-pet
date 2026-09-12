import { describe, expect, it } from "vitest";
import { getBoochaVideoCropRect } from "./videoCrop";

describe("getBoochaVideoCropRect", () => {
  it("removes the bottom recording artifact from a Boocha source frame", () => {
    expect(getBoochaVideoCropRect(480, 370)).toEqual({
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 480,
      sourceHeight: 355,
    });
  });

  it("keeps at least one source row for tiny frames", () => {
    expect(getBoochaVideoCropRect(2, 2)).toEqual({
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 2,
      sourceHeight: 1,
    });
  });
});
