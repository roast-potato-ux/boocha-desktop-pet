import type { MouseEvent, SyntheticEvent } from "react";

interface QuickActionsProps {
  mode: "main" | "countdown";
  onShowCountdownOptions: () => void;
  onStartCountdown: (minutes: number) => void;
  onStartCustomCountdown: () => void;
  onToggleStopwatch: () => void;
  onOpenSettings: () => void;
}

function preventPetInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

function runQuickAction(
  action: () => void,
): (event: MouseEvent<HTMLButtonElement>) => void {
  return (event) => {
    preventPetInteraction(event);
    action();
  };
}

// Inline SVGs instead of emoji: ⏳ / ⏱ / ⚙ each render at their own optical
// size, so the three icons never looked consistent. These share one viewBox and
// one stroke, and are sized by CSS to fill the round button evenly.
function HourglassIcon() {
  return (
    <svg
      className="quick-action__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M6.5 3h11" />
      <path d="M6.5 21h11" />
      <path d="M8 3v3.4a4 4 0 0 0 1.5 3.1L12 12l2.5-2.5A4 4 0 0 0 16 6.4V3" />
      <path d="M8 21v-3.4a4 4 0 0 1 1.5-3.1L12 12l2.5 2.5A4 4 0 0 1 16 17.6V21" />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg
      className="quick-action__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 10v3.8l2.6 2.4" />
      <path d="M9.2 2.6h5.6" />
      <path d="M12 2.6v3.4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      className="quick-action__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.03H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.55V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1.03H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.55 1.03z" />
    </svg>
  );
}

export function QuickActions({
  mode,
  onShowCountdownOptions,
  onStartCountdown,
  onStartCustomCountdown,
  onToggleStopwatch,
  onOpenSettings,
}: QuickActionsProps) {
  if (mode === "countdown") {
    return (
      <div className="quick-actions quick-actions--countdown" aria-label="倒计时选项">
        <button
          type="button"
          className="quick-action quick-action--fan-top"
          aria-label="开始 5 分钟倒计时"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runQuickAction(() => onStartCountdown(5))}
        >
          5
        </button>
        <button
          type="button"
          className="quick-action quick-action--fan-upper"
          aria-label="开始 15 分钟倒计时"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runQuickAction(() => onStartCountdown(15))}
        >
          15
        </button>
        <button
          type="button"
          className="quick-action quick-action--fan-lower"
          aria-label="开始 30 分钟倒计时"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runQuickAction(() => onStartCountdown(30))}
        >
          30
        </button>
        <button
          type="button"
          className="quick-action quick-action--fan-bottom"
          aria-label="使用自定义时长开始倒计时"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runQuickAction(onStartCustomCountdown)}
        >
          自
        </button>
      </div>
    );
  }

  return (
    <div className="quick-actions" aria-label="桌宠快捷操作">
      <button
        type="button"
        className="quick-action quick-action--arc-top"
        aria-label="倒计时"
        title="倒计时"
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onClick={runQuickAction(onShowCountdownOptions)}
      >
        <HourglassIcon />
      </button>
      <button
        type="button"
        className="quick-action quick-action--arc-mid"
        aria-label="计时器"
        title="计时器"
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onClick={runQuickAction(onToggleStopwatch)}
      >
        <StopwatchIcon />
      </button>
      <button
        type="button"
        className="quick-action quick-action--arc-bottom"
        aria-label="设置"
        title="设置"
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onClick={runQuickAction(onOpenSettings)}
      >
        <GearIcon />
      </button>
    </div>
  );
}
