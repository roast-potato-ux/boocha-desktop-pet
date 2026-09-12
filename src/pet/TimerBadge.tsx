import { useEffect, useRef } from "react";
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import {
  enterCustomCountdownDigit,
  eraseCustomCountdownDigit,
  getCustomCountdownSeconds,
  selectCustomCountdownSegment,
} from "./customCountdown";
import type { CustomCountdownDraft } from "./customCountdown";

interface TimerBadgeProps {
  display: string;
  paused: boolean;
  onTogglePause: () => void;
  onCancel: () => void;
  mode?: "running" | "editing";
  draft?: CustomCountdownDraft;
  onDraftChange?: (draft: CustomCountdownDraft) => void;
  onStart?: (seconds: number) => void;
}

function preventPetInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

function preventPetContextMenu(event: SyntheticEvent) {
  event.preventDefault();
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
  mode = "running",
  draft,
  onDraftChange,
  onStart,
}: TimerBadgeProps) {
  const composerRef = useRef<HTMLDivElement>(null);
  const pauseLabel = paused ? "继续计时" : "暂停计时";
  const editing = mode === "editing" && draft && onDraftChange && onStart;
  const draftSeconds = editing ? getCustomCountdownSeconds(draft) : null;

  useEffect(() => {
    if (editing) {
      composerRef.current?.focus();
    }
  }, [editing]);

  const updateDraft = (nextDraft: CustomCountdownDraft) => {
    onDraftChange?.(nextDraft);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editing || !draft) {
      return;
    }

    preventPetInteraction(event);

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      updateDraft(enterCustomCountdownDigit(draft, event.key));
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      updateDraft(eraseCustomCountdownDigit(draft));
      return;
    }

    if (event.key === "Enter" && draftSeconds !== null) {
      event.preventDefault();
      onStart?.(draftSeconds);
    }
  };

  if (editing && draft) {
    return (
      <div
        ref={composerRef}
        className="timer-badge timer-badge--editing"
        tabIndex={0}
        aria-label="自定义倒计时输入"
        onPointerDown={preventPetInteraction}
        onDoubleClick={preventPetInteraction}
        onContextMenu={preventPetContextMenu}
        onKeyDown={handleEditorKeyDown}
      >
        <button
          type="button"
          className={`timer-badge__time-group${draft.cursor < 2 ? " timer-badge__time-group--active" : ""}`}
          aria-label="输入分钟"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runBadgeAction(() =>
            updateDraft(selectCustomCountdownSegment(draft, "minutes")),
          )}
        >
          {draft.digits[0]}{draft.digits[1]}
        </button>
        <span className="timer-badge__separator" aria-hidden="true">:</span>
        <button
          type="button"
          className={`timer-badge__time-group${draft.cursor >= 2 ? " timer-badge__time-group--active" : ""}`}
          aria-label="输入秒钟"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runBadgeAction(() =>
            updateDraft(selectCustomCountdownSegment(draft, "seconds")),
          )}
        >
          {draft.digits[2]}{draft.digits[3]}
        </button>
        <button
          type="button"
          className="timer-badge__button"
          aria-label="开始自定义倒计时"
          title="开始倒计时"
          disabled={draftSeconds === null}
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runBadgeAction(() => {
            if (draftSeconds !== null) {
              onStart?.(draftSeconds);
            }
          })}
        >
          <PlayIcon />
        </button>
        <button
          type="button"
          className="timer-badge__button"
          aria-label="取消自定义倒计时"
          title="取消"
          onPointerDown={preventPetInteraction}
          onDoubleClick={preventPetInteraction}
          onClick={runBadgeAction(onCancel)}
        >
          <CancelIcon />
        </button>
      </div>
    );
  }

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
