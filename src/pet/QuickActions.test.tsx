import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickActions } from "./QuickActions";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe("QuickActions", () => {
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
      "使用自定义时长开始倒计时",
    ]);
  });
});
