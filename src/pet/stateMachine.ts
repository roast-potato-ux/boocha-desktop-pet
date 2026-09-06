import type { PetEvent, PetViewModel } from "./types";

const idleClickLines = ["我在", "摸鱼一下", "今天也要好好吃饭"];
const workClickLines = ["盯着你工作", "别忘了保存", "认真五分钟也算认真"];
const eatClickLines = ["香", "先吃两口", "饭饭时间"];

function pickLine(lines: string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length];
}

export function reducePetState(
  current: PetViewModel,
  event: PetEvent,
  now: number,
): PetViewModel {
  if (event.type === "start-work") {
    return { state: "work", bubble: "开始认真搬砖", lastInteractionAt: now };
  }

  if (event.type === "stop-work" || event.type === "return-idle") {
    return { state: "idle", bubble: null, lastInteractionAt: now };
  }

  if (event.type === "meal-reminder") {
    return {
      state: "eat",
      bubble: event.meal === "lunch" ? "饭点到" : "晚饭时间",
      lastInteractionAt: now,
    };
  }

  if (event.type === "pet-click") {
    const linesByState = {
      idle: idleClickLines,
      work: workClickLines,
      eat: eatClickLines,
    } satisfies Record<PetViewModel["state"], string[]>;

    return {
      ...current,
      bubble: pickLine(linesByState[current.state], now),
      lastInteractionAt: now,
    };
  }

  if (event.type === "cycle-state") {
    if (current.state === "idle") {
      return { state: "work", bubble: "开始认真搬砖", lastInteractionAt: now };
    }

    if (current.state === "work") {
      return { state: "eat", bubble: "饭点到", lastInteractionAt: now };
    }

    return { state: "idle", bubble: null, lastInteractionAt: now };
  }

  return current;
}
