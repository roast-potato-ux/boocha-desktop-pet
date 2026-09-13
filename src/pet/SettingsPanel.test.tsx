import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultPetSettings } from "./petSettings";
import { SettingsPanel } from "./SettingsPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderSettingsPanel(
  onPreviewSettings = vi.fn(),
  onAutostartChange = vi.fn(),
  autostart = { enabled: false, loading: false, error: null as string | null },
) {
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
        autostart={autostart}
        onAutostartChange={onAutostartChange}
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
  it("shows countdown completion tags instead of a custom-minute field", () => {
    renderSettingsPanel();

    expect(container?.textContent).toContain("计时和倒计时");
    expect(container?.querySelector('input[type="number"][min="1"][max="180"]'))
      .toBeNull();
    expect(container?.textContent).toContain("倒计时结束提示");
    expect(container?.textContent).not.toContain("工作状态显示分钟数");
    expect(container?.textContent).not.toContain("暂停提醒");
    expect(container?.textContent).not.toContain("专注时段不打扰");
  });

  it("keeps add fields hidden until the user opens the small plus button", () => {
    const onPreviewSettings = renderSettingsPanel();
    const completionEditor = container?.querySelector('[data-bubble-field="countdownCompleteLines"]');
    const addButton = completionEditor?.querySelector<HTMLButtonElement>('button[aria-label="添加倒计时结束提示"]');

    expect(completionEditor?.querySelector('input')).toBeNull();
    expect(addButton).not.toBeNull();

    act(() => {
      addButton?.click();
    });

    const completionInput = completionEditor?.querySelector<HTMLInputElement>('input');
    const submitButton = completionEditor?.querySelector<HTMLButtonElement>('button[aria-label="确认添加倒计时结束提示"]');

    expect(completionInput).not.toBeNull();
    expect(submitButton).not.toBeNull();

    act(() => {
      if (completionInput) setNativeValue(completionInput, "完成啦");
      submitButton?.click();
    });

    expect(onPreviewSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timer: { countdownCompleteLines: ["时间到，休息一下", "完成啦"] },
      }),
    );

    expect(completionEditor?.querySelector('input')).toBeNull();
  });

  it("shows three shared bubble groups and a minute-based eating duration", () => {
    renderSettingsPanel();

    expect(container?.textContent).toContain("吃饭状态停留时间（分钟）");
    expect(container?.querySelector('input[type="number"][min="1"][max="60"]'))
      .not.toBeNull();
    expect(container?.textContent).toContain("嗯嗯");
    expect(container?.textContent).toContain("工作");
    expect(container?.textContent).toContain("吃饭");
    expect(container?.textContent).not.toContain("待机点击");
    expect(container?.textContent).not.toContain("待机自己冒泡");
    expect(container?.textContent).not.toContain("工作时点击");
    expect(container?.textContent).not.toContain("开始工作时");
    expect(container?.textContent).not.toContain("午饭提醒");
    expect(container?.textContent).not.toContain("晚饭提醒");
    expect(container?.textContent).not.toContain("待机");
  });

  it("offers a default-off surprise switch with a clear work-session explanation", () => {
    const onPreviewSettings = renderSettingsPanel();
    const toggle = container?.querySelector<HTMLInputElement>(
      'input[aria-label="开启彩蛋"]',
    );

    expect(toggle?.checked).toBe(false);
    expect(container?.textContent).toContain("进入工作状态时，彩蛋会随机出现。");

    act(() => toggle?.click());

    expect(onPreviewSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ surprise: { enabled: true } }),
    );
  });

  it("uses the section title for launch-at-login and removes the duplicate label", () => {
    renderSettingsPanel();

    expect(container?.querySelector('.settings-panel__section:nth-of-type(2) h2')?.textContent)
      .toBe("开机时启动 Boocha");
    expect(container?.querySelector('.settings-panel__toggle-row strong')).toBeNull();
  });

  it("keeps a macOS-style close dot at the upper left", () => {
    renderSettingsPanel();

    expect(container?.querySelector('button[aria-label="关闭设置"]')).not.toBeNull();
  });

  it("keeps close controls in a non-scrolling safe area", () => {
    renderSettingsPanel();

    const safeArea = container?.querySelector(".settings-panel__safe-area");
    const scrollArea = container?.querySelector(".settings-panel__scroll");

    expect(safeArea?.querySelector('button[aria-label="关闭设置"]')).not.toBeNull();
    expect(safeArea?.textContent).toContain("设置");
    expect(scrollArea?.textContent).toContain("桌宠大小");
    expect(scrollArea?.querySelector('button[aria-label="关闭设置"]')).toBeNull();
  });

  it("offers a default-off launch-at-login switch", () => {
    const onAutostartChange = vi.fn();
    renderSettingsPanel(vi.fn(), onAutostartChange);

    const toggle = container?.querySelector<HTMLInputElement>(
      'input[aria-label="开机时启动 Boocha"]',
    );

    expect(container?.textContent).toContain("开机时启动 Boocha");
    expect(toggle?.checked).toBe(false);

    act(() => toggle?.click());

    expect(onAutostartChange).toHaveBeenCalledWith(true);
  });

  it("disables the switch while updating and shows the native error", () => {
    renderSettingsPanel(
      vi.fn(),
      vi.fn(),
      {
        enabled: true,
        loading: true,
        error: "无法更新开机自启动，请稍后重试",
      },
    );

    const toggle = container?.querySelector<HTMLInputElement>(
      'input[aria-label="开机时启动 Boocha"]',
    );

    expect(toggle?.disabled).toBe(true);
    expect(container?.textContent).toContain("正在检查或更新启动设置");
    expect(container?.querySelector('[role="alert"]')?.textContent).toBe(
      "无法更新开机自启动，请稍后重试",
    );
  });
});
