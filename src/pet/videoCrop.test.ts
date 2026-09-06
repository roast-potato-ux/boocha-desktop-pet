import { describe, expect, it } from "vitest";
import { getBoochVideoCropRect } from "./videoCrop";

describe("getBoochVideoCropRect", () => {
  it("removes the bottom recording artifact from a Booch source frame", () => {
    expect(getBoochVideoCropRect(480, 370)).toEqual({
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 480,
      sourceHeight: 355,
    });
  });

  it("keeps at least one source row for tiny frames", () => {
    expect(getBoochVideoCropRect(2, 2)).toEqual({
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 2,
      sourceHeight: 1,
    });
  });
});
