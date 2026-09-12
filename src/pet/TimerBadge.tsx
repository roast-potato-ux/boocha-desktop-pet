interface TimerBadgeProps {
  display: string;
}

export function TimerBadge({ display }: TimerBadgeProps) {
  return (
    <div className="timer-badge" aria-label={`计时 ${display}`}>
      {display}
    </div>
  );
}
