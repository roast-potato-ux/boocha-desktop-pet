import { describe, expect, it, vi } from "vitest";
import {
  hasTauriInternals,
  startPetDragFromWindow,
} from "./windowControls";

describe("startPetDragFromWindow", () => {
  it("starts native dragging when a Tauri window is available", async () => {
    const startDragging = vi.fn().mockResolvedValue(undefined);

    await expect(startPetDragFromWindow({ startDragging })).resolves.toBe("started");

    expect(startDragging).toHaveBeenCalledOnce();
  });

  it("reports unavailable when native dragging cannot start", async () => {
    const startDragging = vi.fn().mockRejectedValue(new Error("not in Tauri"));

    await expect(startPetDragFromWindow({ startDragging })).resolves.toBe(
      "unavailable",
    );
  });

  it("detects a native Tauri runtime marker", () => {
    expect(hasTauriInternals({ __TAURI_INTERNALS__: {} })).toBe(true);
    expect(hasTauriInternals({})).toBe(false);
  });
});
