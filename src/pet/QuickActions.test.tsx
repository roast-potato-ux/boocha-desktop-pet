import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickActions } from "./QuickActions";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function QuickActionsHarness() {
  const [mode, setMode] = useState<"main" | "countdown">("main");
  const [bubbledEvent, setBubbledEvent] = useState("none");

  return (
    <div
      data-bubbled-event={bubbledEvent}
      onClick={() => setBubbledEvent("click")}
      onPointerDown={() => setBubbledEvent("pointerdown")}
    >
      <QuickActions
        mode={mode}
        onShowCountdownOptions={() => setMode("countdown")}
        onStartCountdown={vi.fn()}
        onStartCustomCountdown={vi.fn()}
        onToggleStopwatch={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    </div>
  );
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe("QuickActions", () => {
  it("switches to countdown choices without triggering the pet interaction layer", () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(<QuickActionsHarness />);
    });

    const countdownButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="倒计时"]',
    );

    expect(countdownButton).not.toBeNull();

    act(() => {
      countdownButton?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      countdownButton?.click();
    });

    expect(container.querySelector('[aria-label="倒计时选项"]')).not.toBeNull();
    expect(container.firstElementChild?.getAttribute("data-bubbled-event")).toBe(
      "none",
    );
  });

  it("labels every countdown duration button for assistive technology", () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <QuickActions
          mode="countdown"
          onShowCountdownOptions={vi.fn()}
          onStartCountdown={vi.fn()}
          onStartCustomCountdown={vi.fn()}
          onToggleStopwatch={vi.fn()}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    expect(
      Array.from(container.querySelectorAll("button")).map((button) =>
        button.getAttribute("aria-label"),
      ),
    ).toEqual([
      "开始 5 分钟倒计时",
      "开始 15 分钟倒计时",
      "开始 30 分钟倒计时",
      "输入自定义倒计时",
    ]);
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="输入自定义倒计时"]')?.textContent).toBe("....");
  });
});
