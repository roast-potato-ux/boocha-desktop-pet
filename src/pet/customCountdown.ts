export type CustomCountdownSegment = "minutes" | "seconds";

export interface CustomCountdownDraft {
  digits: [string, string, string, string];
  filled: [boolean, boolean, boolean, boolean];
  cursor: 0 | 1 | 2 | 3;
}

export function createCustomCountdownDraft(): CustomCountdownDraft {
  return {
    digits: ["0", "0", "0", "0"],
    filled: [false, false, false, false],
    cursor: 0,
  };
}

function asCursor(value: number): 0 | 1 | 2 | 3 {
  return Math.min(3, Math.max(0, value)) as 0 | 1 | 2 | 3;
}

export function selectCustomCountdownSegment(
  draft: CustomCountdownDraft,
  segment: CustomCountdownSegment,
): CustomCountdownDraft {
  return {
    ...draft,
    cursor: segment === "minutes" ? 0 : 2,
  };
}

export function enterCustomCountdownDigit(
  draft: CustomCountdownDraft,
  digit: string,
): CustomCountdownDraft {
  if (!/^\d$/.test(digit)) {
    return draft;
  }

  const digits = [...draft.digits] as CustomCountdownDraft["digits"];
  const filled = [...draft.filled] as CustomCountdownDraft["filled"];
  digits[draft.cursor] = digit;
  filled[draft.cursor] = true;

  return {
    digits,
    filled,
    cursor: asCursor(draft.cursor + 1),
  };
}

export function eraseCustomCountdownDigit(
  draft: CustomCountdownDraft,
): CustomCountdownDraft {
  const cursor = asCursor(draft.cursor - 1);
  const digits = [...draft.digits] as CustomCountdownDraft["digits"];
  const filled = [...draft.filled] as CustomCountdownDraft["filled"];
  digits[cursor] = "0";
  filled[cursor] = false;

  return { digits, filled, cursor };
}

export function getCustomCountdownSeconds(
  draft: CustomCountdownDraft,
): number | null {
  if (!draft.filled.every(Boolean)) {
    return null;
  }

  const minutes = Number(`${draft.digits[0]}${draft.digits[1]}`);
  const seconds = Number(`${draft.digits[2]}${draft.digits[3]}`);

  if (seconds > 59) {
    return null;
  }

  const totalSeconds = minutes * 60 + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
}
