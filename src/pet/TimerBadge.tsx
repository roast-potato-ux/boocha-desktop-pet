import type { MouseEvent, SyntheticEvent } from "react";

interface TimerBadgeProps {
  display: string;
  paused: boolean;
  onTogglePause: () => void;
  onCancel: () => void;
}

// Keep the badge buttons from reaching the pet interaction layer underneath,
// otherwise pausing would also count as clicking/dragging the pet.
function preventPetInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

function runBadgeAction(
  action: () => void,
): (event: MouseEvent<HTMLButtonElement>) => void {
  return (event) => {
    preventPetInteraction(event);
    action();
  };
}

function PauseIcon() {
  return (
    <svg className="timer-badge__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5" width="3.6" height="14" rx="1.5" fill="currentColor" />
      <rect x="13.4" y="5" width="3.6" height="14" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="timer-badge__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg className="timer-badge__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7L7 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function TimerBadge({
  display,
  paused,
  onTogglePause,
  onCancel,
}: TimerBadgeProps) {
  const pauseLabel = paused ? "继续计时" : "暂停计时";

  return (
    <div
      className={`timer-badge${paused ? " timer-badge--paused" : ""}`}
      aria-label={`${paused ? "已暂停" : "计时中"} ${display}`}
    >
      <span className="timer-badge__time">{display}</span>
      <button
        type="button"
        className="timer-badge__button"
        aria-label={pauseLabel}
        title={pauseLabel}
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onClick={runBadgeAction(onTogglePause)}
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <button
        type="button"
        className="timer-badge__button"
        aria-label="取消计时"
        title="取消计时"
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onClick={runBadgeAction(onCancel)}
      >
        <CancelIcon />
      </button>
    </div>
  );
}
