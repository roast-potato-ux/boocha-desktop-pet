import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultPetSettings } from "./petSettings";
import { SettingsPanel } from "./SettingsPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderSettingsPanel(onPreviewSettings = vi.fn()) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <SettingsPanel
        settings={createDefaultPetSettings()}
        onSave={vi.fn()}
        onPreviewSettings={onPreviewSettings}
        onClose={vi.fn()}
      />,
    );
  });

  return onPreviewSettings;
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype = Object.getPrototypeOf(element) as typeof element;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe("SettingsPanel", () => {
  it("shows countdown settings instead of retired reminder and work-duration controls", () => {
    renderSettingsPanel();

    expect(container?.textContent).toContain("计时和倒计时");
    expect(container?.querySelector('input[type="number"][min="1"][max="180"]'))
      .not.toBeNull();
    expect(container?.textContent).toContain("倒计时结束提示");
    expect(container?.textContent).not.toContain("工作状态显示分钟数");
    expect(container?.textContent).not.toContain("暂停提醒");
    expect(container?.textContent).not.toContain("专注时段不打扰");
  });

  it("previews custom countdown edits with normalized completion lines", () => {
    const onPreviewSettings = renderSettingsPanel();
    const inputs = container?.querySelectorAll<HTMLInputElement>('input[type="number"]');
    const customCountdownInput = Array.from(inputs ?? []).find(
      (input) => input.min === "1" && input.max === "180",
    );
    const completionTextarea = Array.from(
      container?.querySelectorAll<HTMLTextAreaElement>("textarea") ?? [],
    ).find((textarea) => textarea.value === "时间到，休息一下");

    expect(customCountdownInput).toBeDefined();
    expect(completionTextarea).toBeDefined();

    act(() => {
      if (customCountdownInput) {
        setNativeValue(customCountdownInput, "40");
      }
    });
    act(() => {
      if (completionTextarea) {
        setNativeValue(completionTextarea, "完成啦\n  休息一下  ");
      }
    });

    expect(onPreviewSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timer: {
          customCountdownMinutes: 40,
          countdownCompleteLines: ["完成啦", "休息一下"],
        },
      }),
    );
  });
});
