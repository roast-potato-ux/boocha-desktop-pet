export interface WorkSurpriseSchedule {
  dueAt: number;
}

const surpriseChance = 0.3;
const minimumDelayMinutes = 5;
const maximumDelayMinutes = 30;

export function scheduleWorkSurprise(
  now: number,
  random: () => number,
  enabled: boolean,
): WorkSurpriseSchedule | null {
  if (!enabled || random() >= surpriseChance) {
    return null;
  }

  const delayMinutes =
    minimumDelayMinutes +
    Math.floor(random() * (maximumDelayMinutes - minimumDelayMinutes + 1));

  return {
    dueAt: now + delayMinutes * 60_000,
  };
}
