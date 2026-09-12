interface QuickActionsProps {
  mode: "main" | "countdown";
  onShowCountdownOptions: () => void;
  onStartCountdown: (minutes: number) => void;
  onStartCustomCountdown: () => void;
  onToggleStopwatch: () => void;
  onOpenSettings: () => void;
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
          className="quick-action quick-action--top"
          aria-label="开始 5 分钟倒计时"
          onClick={() => onStartCountdown(5)}
        >
          5
        </button>
        <button
          type="button"
          className="quick-action quick-action--upper-right"
          aria-label="开始 15 分钟倒计时"
          onClick={() => onStartCountdown(15)}
        >
          15
        </button>
        <button
          type="button"
          className="quick-action quick-action--right"
          aria-label="开始 30 分钟倒计时"
          onClick={() => onStartCountdown(30)}
        >
          30
        </button>
        <button
          type="button"
          className="quick-action quick-action--lower-right"
          aria-label="使用自定义时长开始倒计时"
          onClick={onStartCustomCountdown}
        >
          自
        </button>
      </div>
    );
  }

  return (
    <div className="quick-actions" aria-label="桌宠快捷操作">
      <button type="button" className="quick-action quick-action--top" aria-label="倒计时" onClick={onShowCountdownOptions}>
        ⏳
      </button>
      <button type="button" className="quick-action quick-action--right" aria-label="计时器" onClick={onToggleStopwatch}>
        ⏱
      </button>
      <button type="button" className="quick-action quick-action--lower-right" aria-label="设置" onClick={onOpenSettings}>
        ⚙
      </button>
    </div>
  );
}
