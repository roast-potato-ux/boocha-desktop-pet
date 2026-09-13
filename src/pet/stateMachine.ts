import type { PetEvent, PetViewModel } from "./types";
import type { PetBubbleSettings } from "./petSettings";

const idleLines = ["我在", "摸鱼一下", "今天也要好好吃饭", "偷偷冒个泡", "发呆中", "陪你趴一会儿"];
const workLines = ["盯着你工作", "别忘了保存", "认真五分钟也算认真", "开始认真搬砖"];
const eatLines = ["饭饭时间", "香", "先吃两口", "饭点到", "晚饭时间"];

const defaultBubbles: PetBubbleSettings = {
  idleClick: idleLines,
  ambientIdle: idleLines,
  workClick: workLines,
  workStart: workLines,
  eatClick: eatLines,
  lunch: eatLines,
  dinner: eatLines,
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

  if (event.type === "start-surprise") {
    if (current.state !== "work") {
      return current;
    }

    return {
      state: "surprise",
      previousState: "work",
      bubble: "小彩蛋送你",
      lastInteractionAt: now,
    };
  }

  if (event.type === "finish-surprise") {
    if (current.state !== "surprise") {
      return current;
    }

    return {
      state: "work",
      previousState: null,
      bubble: null,
      lastInteractionAt: now,
    };
  }

  if (event.type === "meal-reminder") {
    return {
      state: "eat",
      previousState: current.state,
      bubble: pickLine(bubbles.eatClick, now),
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
      surprise: [],
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
      bubble: pickLine(bubbles.idleClick, event.seed),
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
        bubble: pickLine(bubbles.eatClick, now),
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
