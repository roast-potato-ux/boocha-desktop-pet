import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCustomCountdownDraft } from "./customCountdown";
import { TimerBadge } from "./TimerBadge";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe("TimerBadge", () => {
  it("turns into a four-digit countdown editor and starts only after a valid duration", () => {
    const onStart = vi.fn();

    function ComposerHarness() {
      const [draft, setDraft] = useState(createCustomCountdownDraft());

      return (
        <TimerBadge
          display="00:00"
          paused={false}
          onTogglePause={vi.fn()}
          onCancel={vi.fn()}
          mode="editing"
          draft={draft}
          onDraftChange={setDraft}
          onStart={onStart}
        />
      );
    }

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(<ComposerHarness />);
    });

    const editor = container.querySelector<HTMLElement>('[aria-label="自定义倒计时输入"]');
    const startButton = container.querySelector<HTMLButtonElement>('button[aria-label="开始自定义倒计时"]');

    expect(editor).not.toBeNull();
    expect(startButton?.disabled).toBe(true);

    for (const digit of ["2", "5", "3", "0"]) {
      act(() => {
        editor?.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true }));
      });
    }

    expect(editor?.textContent).toContain("25:30");
    expect(startButton?.disabled).toBe(false);

    act(() => startButton?.click());

    expect(onStart).toHaveBeenCalledWith(25 * 60 + 30);
  });

  it("lets the user click minute and second groups before typing", () => {
    function ComposerHarness() {
      const [draft, setDraft] = useState(createCustomCountdownDraft());
      return (
        <TimerBadge
          display="00:00"
          paused={false}
          onTogglePause={vi.fn()}
          onCancel={vi.fn()}
          mode="editing"
          draft={draft}
          onDraftChange={setDraft}
          onStart={vi.fn()}
        />
      );
    }

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(<ComposerHarness />));

    const editor = container.querySelector<HTMLElement>('[aria-label="自定义倒计时输入"]');
    const minutes = container.querySelector<HTMLButtonElement>('button[aria-label="输入分钟"]');
    const seconds = container.querySelector<HTMLButtonElement>('button[aria-label="输入秒钟"]');

    act(() => minutes?.click());
    for (const digit of ["2", "5"]) {
      act(() => editor?.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true })));
    }
    act(() => seconds?.click());
    for (const digit of ["3", "0"]) {
      act(() => editor?.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true })));
    }

    expect(editor?.textContent).toContain("25:30");
  });

  it("keeps an editing badge from opening the pet context menu", () => {
    function ComposerHarness() {
      const [draft, setDraft] = useState(createCustomCountdownDraft());
      const [openedMenu, setOpenedMenu] = useState(false);
      return (
        <div data-menu-open={openedMenu} onContextMenu={() => setOpenedMenu(true)}>
          <TimerBadge
            display="00:00"
            paused={false}
            onTogglePause={vi.fn()}
            onCancel={vi.fn()}
            mode="editing"
            draft={draft}
            onDraftChange={setDraft}
            onStart={vi.fn()}
          />
        </div>
      );
    }

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root?.render(<ComposerHarness />));

    const editor = container.querySelector<HTMLElement>('[aria-label="自定义倒计时输入"]');
    act(() => editor?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })));

    expect(container.firstElementChild?.getAttribute("data-menu-open")).toBe("false");
  });
});
