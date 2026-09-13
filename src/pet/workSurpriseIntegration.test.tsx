import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function openAndEnableSurprise() {
  const pet = container?.querySelector<HTMLButtonElement>(
    'button[aria-label="渣熊idle"]',
  );

  act(() => {
    pet?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
  });

  const settings = container?.querySelector<HTMLButtonElement>(
    'button[aria-label="设置"]',
  );

  act(() => settings?.click());

  const toggle = container?.querySelector<HTMLInputElement>(
    'input[aria-label="开启彩蛋"]',
  );

  act(() => toggle?.click());
  act(() => container?.querySelector<HTMLButtonElement>(".settings-panel__primary-button")?.click());
}

describe("work surprise integration", () => {
  it("shows the delayed surprise only for a manual work entry and returns to work after a minute", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);

    act(() => root?.render(<App />));
    openAndEnableSurprise();

    const pet = container?.querySelector<HTMLButtonElement>(
      'button[aria-label="渣熊idle"]',
    );
    act(() => pet?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));

    expect(container?.querySelector('button[aria-label="渣熊work"]')).not.toBeNull();

    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(container?.querySelector('button[aria-label="渣熊surprise"]')).not.toBeNull();
    expect(container?.textContent).toContain("小彩蛋送你");

    act(() => vi.advanceTimersByTime(60_000));
    expect(container?.querySelector('button[aria-label="渣熊work"]')).not.toBeNull();
  });

  it("does not schedule a surprise when a countdown creates the work visual", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    act(() => root?.render(<App />));
    openAndEnableSurprise();

    const pet = container?.querySelector<HTMLButtonElement>(
      'button[aria-label="渣熊idle"]',
    );
    act(() => {
      pet?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    });
    act(() => container?.querySelector<HTMLButtonElement>('button[aria-label="倒计时"]')?.click());
    act(() => container?.querySelector<HTMLButtonElement>('button[aria-label="开始 5 分钟倒计时"]')?.click());
    act(() => vi.advanceTimersByTime(4 * 60_000));

    expect(container?.querySelector('button[aria-label="渣熊work"]')).not.toBeNull();
    expect(container?.querySelector('button[aria-label="渣熊surprise"]')).toBeNull();
  });
});
