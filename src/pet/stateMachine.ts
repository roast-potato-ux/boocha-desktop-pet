import type { PetEvent, PetViewModel } from "./types";
import type { PetBubbleSettings } from "./petSettings";

const idleClickLines = ["我在", "摸鱼一下", "今天也要好好吃饭"];
const workClickLines = ["盯着你工作", "别忘了保存", "认真五分钟也算认真"];
const eatClickLines = ["饭饭时间", "香", "先吃两口"];
const ambientIdleLines = ["偷偷冒个泡", "发呆中", "陪你趴一会儿"];

const defaultBubbles: PetBubbleSettings = {
  idleClick: idleClickLines,
  workClick: workClickLines,
  eatClick: eatClickLines,
  ambientIdle: ambientIdleLines,
  lunch: ["饭点到"],
  dinner: ["晚饭时间"],
  workStart: ["开始认真搬砖"],
};

function pickLine(lines: string[], seed: number): string | null {
  if (lines.length === 0) {
    return null;
  }

  return lines[Math.abs(seed) % lines.length];
}

export function reducePetState(
  current: PetViewModel,
  event: PetEvent,
  now: number,
  bubbles: PetBubbleSettings = defaultBubbles,
): PetViewModel {
  if (event.type === "start-work") {
    return {
      state: "work",
      previousState: null,
      bubble: pickLine(bubbles.workStart, now),
      lastInteractionAt: now,
    };
  }

  if (event.type === "stop-work") {
    return {
      state: "idle",
      previousState: null,
      bubble: null,
      lastInteractionAt: now,
    };
  }

  if (event.type === "return-previous") {
    return {
      state: current.previousState ?? "idle",
      previousState: null,
      bubble: null,
      lastInteractionAt: now,
    };
  }

  if (event.type === "countdown-complete") {
    return {
      state: "idle",
      previousState: null,
      bubble: event.bubble,
      lastInteractionAt: now,
    };
  }

  if (event.type === "meal-reminder") {
    return {
      state: "eat",
      previousState: current.state,
      bubble: pickLine(
        event.meal === "lunch" ? bubbles.lunch : bubbles.dinner,
        now,
      ),
      lastInteractionAt: now,
    };
  }

  if (event.type === "select-state") {
    if (event.state === "idle") {
      return {
        state: "idle",
        previousState: null,
        bubble: null,
        lastInteractionAt: now,
      };
    }

    if (event.state === "work") {
      return {
        state: "work",
        previousState: null,
        bubble: pickLine(bubbles.workStart, now),
        lastInteractionAt: now,
      };
    }

    return {
      state: "eat",
      previousState: null,
      bubble: pickLine(bubbles.eatClick, now),
      lastInteractionAt: now,
    };
  }

  if (event.type === "pet-click") {
    const linesByState = {
      idle: bubbles.idleClick,
      work: bubbles.workClick,
      eat: bubbles.eatClick,
    } satisfies Record<PetViewModel["state"], string[]>;

    return {
      ...current,
      bubble: pickLine(linesByState[current.state], now),
      lastInteractionAt: now,
    };
  }

  if (event.type === "ambient-interaction") {
    if (current.state !== "idle") {
      return current;
    }

    return {
      ...current,
      bubble: pickLine(bubbles.ambientIdle, event.seed),
      lastInteractionAt: now,
    };
  }

  if (event.type === "clear-bubble") {
    if (current.lastInteractionAt !== event.interactionAt) {
      return current;
    }

    return {
      ...current,
      bubble: null,
    };
  }

  if (event.type === "cycle-state") {
    if (current.state === "idle") {
      return {
        state: "work",
        previousState: null,
        bubble: pickLine(bubbles.workStart, now),
        lastInteractionAt: now,
      };
    }

    if (current.state === "work") {
      return {
        state: "eat",
        previousState: null,
        bubble: pickLine(bubbles.lunch, now),
        lastInteractionAt: now,
      };
    }

    return {
      state: "idle",
      previousState: null,
      bubble: null,
      lastInteractionAt: now,
    };
  }

  return current;
}
