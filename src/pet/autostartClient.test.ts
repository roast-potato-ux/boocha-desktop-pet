import { describe, expect, it, vi } from "vitest";
import {
  readAutostart,
  setAutostart,
} from "./autostartClient";

describe("autostartClient", () => {
  it("keeps the saved preference in a browser preview without calling the native plugin", async () => {
    const api = {
      isEnabled: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    };

    await expect(readAutostart(false, true, api)).resolves.toBe(true);
    await setAutostart(false, false, api);

    expect(api.isEnabled).not.toHaveBeenCalled();
    expect(api.enable).not.toHaveBeenCalled();
    expect(api.disable).not.toHaveBeenCalled();
  });

  it("reads and updates the real native autostart state", async () => {
    const api = {
      isEnabled: vi.fn().mockResolvedValue(false),
      enable: vi.fn().mockResolvedValue(undefined),
      disable: vi.fn().mockResolvedValue(undefined),
    };

    await expect(readAutostart(true, true, api)).resolves.toBe(false);
    await setAutostart(true, true, api);
    await setAutostart(true, false, api);

    expect(api.enable).toHaveBeenCalledTimes(1);
    expect(api.disable).toHaveBeenCalledTimes(1);
  });

  it("leaves native failures visible to the settings panel instead of pretending the change worked", async () => {
    const api = {
      isEnabled: vi.fn().mockRejectedValue(new Error("permission denied")),
      enable: vi.fn().mockRejectedValue(new Error("permission denied")),
      disable: vi.fn(),
    };

    await expect(readAutostart(true, false, api)).rejects.toThrow(
      "permission denied",
    );
    await expect(setAutostart(true, true, api)).rejects.toThrow(
      "permission denied",
    );
    expect(api.disable).not.toHaveBeenCalled();
  });
});
