import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PetSprite } from "./PetSprite";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe("PetSprite", () => {
  it("uses the separate surprise video for the internal surprise state", () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <PetSprite
          pet={{
            state: "surprise",
            previousState: "work",
            bubble: "小彩蛋送你",
            lastInteractionAt: 0,
          }}
          onClick={() => undefined}
          onToggleWork={() => undefined}
        />,
      );
    });

    expect(container.querySelector('button[aria-label="渣熊surprise"]')).not.toBeNull();
    expect(container.querySelector("video")?.getAttribute("src")).toContain(
      "boocha-surprise",
    );
  });
});
