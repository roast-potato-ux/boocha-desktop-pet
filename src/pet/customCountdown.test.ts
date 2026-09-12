import { describe, expect, it } from "vitest";
import {
  createCustomCountdownDraft,
  enterCustomCountdownDigit,
  getCustomCountdownSeconds,
  selectCustomCountdownSegment,
} from "./customCountdown";

describe("customCountdown", () => {
  it("fills four countdown digits from left to right", () => {
    let draft = createCustomCountdownDraft();

    for (const digit of ["2", "9", "5", "5"]) {
      draft = enterCustomCountdownDigit(draft, digit);
    }

    expect(draft.digits).toEqual(["2", "9", "5", "5"]);
    expect(draft.filled).toEqual([true, true, true, true]);
    expect(getCustomCountdownSeconds(draft)).toBe(29 * 60 + 55);
  });

  it("moves the keyboard input point when minute or second digits are selected", () => {
    let draft = createCustomCountdownDraft();
    draft = selectCustomCountdownSegment(draft, "seconds");
    draft = enterCustomCountdownDigit(draft, "3");
    draft = enterCustomCountdownDigit(draft, "0");
    draft = selectCustomCountdownSegment(draft, "minutes");
    draft = enterCustomCountdownDigit(draft, "2");
    draft = enterCustomCountdownDigit(draft, "5");

    expect(draft.digits).toEqual(["2", "5", "3", "0"]);
    expect(getCustomCountdownSeconds(draft)).toBe(25 * 60 + 30);
  });

  it("does not start before four valid digits form a non-zero duration", () => {
    let draft = createCustomCountdownDraft();
    draft = enterCustomCountdownDigit(draft, "2");
    expect(getCustomCountdownSeconds(draft)).toBeNull();

    draft = createCustomCountdownDraft();
    for (const digit of ["0", "1", "7", "0"]) {
      draft = enterCustomCountdownDigit(draft, digit);
    }
    expect(getCustomCountdownSeconds(draft)).toBeNull();
  });
});
