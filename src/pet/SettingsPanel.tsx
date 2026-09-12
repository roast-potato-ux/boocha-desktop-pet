import { useRef, useState } from "react";
import { normalizePetSettings } from "./petSettings";
import type { PetSettings } from "./petSettings";

interface SettingsPanelProps {
  settings: PetSettings;
  onSave: (settings: PetSettings) => void;
  onPreviewSettings?: (settings: PetSettings) => void;
  onClose: () => void;
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SettingsPanel({
  settings,
  onSave,
  onPreviewSettings,
  onClose,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const originalSettings = useRef(settings);

  const updateDraft = (next: Partial<PetSettings>) => {
    const nextDraft = { ...draft, ...next } as PetSettings;
    setDraft(nextDraft);
    onPreviewSettings?.(nextDraft);
  };

  const updateDurations = (next: Partial<PetSettings["durations"]>) => {
    updateDraft({ durations: { ...draft.durations, ...next } });
  };

  const updateMeals = (next: Partial<PetSettings["meals"]>) => {
    updateDraft({ meals: { ...draft.meals, ...next } });
  };

  const updateBubbles = (next: Partial<PetSettings["bubbles"]>) => {
    updateDraft({ bubbles: { ...draft.bubbles, ...next } });
  };

  const updateTimer = (next: Partial<PetSettings["timer"]>) => {
    updateDraft({ timer: { ...draft.timer, ...next } });
  };

  return (
    <section className="settings-panel" aria-label="Booch 设置面板">
      <header className="settings-panel__header" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <p className="settings-panel__eyebrow" data-tauri-drag-region>
            Booch Desktop Pet
          </p>
          <h1 data-tauri-drag-region>设置</h1>
        </div>
        <button className="settings-panel__ghost-button" type="button" onClick={onClose}>
          关闭
        </button>
      </header>

      <div className="settings-panel__section">
        <h2>桌宠大小</h2>
        <div className="settings-panel__segmented">
          <button
            type="button"
            data-active={draft.scale === 0.8}
            onClick={() => updateDraft({ scale: 0.8 })}
          >
            小
          </button>
          <button
            type="button"
            data-active={draft.scale === 1}
            onClick={() => updateDraft({ scale: 1 })}
          >
            中
          </button>
          <button
            type="button"
            data-active={draft.scale === 1.25}
            onClick={() => updateDraft({ scale: 1.25 })}
          >
            大
          </button>
        </div>
        <label>
          缩放比例 {Math.round(draft.scale * 100)}%
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.05"
            value={draft.scale}
            onChange={(event) => updateDraft({ scale: Number(event.currentTarget.value) })}
          />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>状态停留时间</h2>
        <label>
          吃饭状态显示秒数
          <input
            type="number"
            min="10"
            max="180"
            value={draft.durations.eatSeconds}
            onChange={(event) =>
              updateDurations({ eatSeconds: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          待机随机冒泡间隔分钟
          <input
            type="number"
            min="1"
            max="30"
            value={draft.durations.idleInteractionMinutes}
            onChange={(event) =>
              updateDurations({
                idleInteractionMinutes: Number(event.currentTarget.value),
              })
            }
          />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>饭点提醒</h2>
        <label>
          午饭时间
          <input
            type="time"
            value={draft.meals.lunch}
            onChange={(event) => updateMeals({ lunch: event.currentTarget.value })}
          />
        </label>
        <label>
          晚饭时间
          <input
            type="time"
            value={draft.meals.dinner}
            onChange={(event) => updateMeals({ dinner: event.currentTarget.value })}
          />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>计时和倒计时</h2>
        <label>
          自定义倒计时分钟数
          <input
            type="number"
            min="1"
            max="180"
            value={draft.timer.customCountdownMinutes}
            onChange={(event) =>
              updateTimer({
                customCountdownMinutes: Number(event.currentTarget.value),
              })
            }
          />
        </label>
        <label>
          倒计时结束提示
          <textarea
            value={linesToText(draft.timer.countdownCompleteLines)}
            onChange={(event) =>
              updateTimer({
                countdownCompleteLines: textToLines(event.currentTarget.value),
              })
            }
          />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>气泡文案</h2>
        <label>
          待机点击
          <textarea
            value={linesToText(draft.bubbles.idleClick)}
            onChange={(event) =>
              updateBubbles({ idleClick: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          工作时点击
          <textarea
            value={linesToText(draft.bubbles.workClick)}
            onChange={(event) =>
              updateBubbles({ workClick: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          吃饭时点击
          <textarea
            value={linesToText(draft.bubbles.eatClick)}
            onChange={(event) =>
              updateBubbles({ eatClick: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          待机自己冒泡
          <textarea
            value={linesToText(draft.bubbles.ambientIdle)}
            onChange={(event) =>
              updateBubbles({ ambientIdle: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          午饭提醒
          <textarea
            value={linesToText(draft.bubbles.lunch)}
            onChange={(event) =>
              updateBubbles({ lunch: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          晚饭提醒
          <textarea
            value={linesToText(draft.bubbles.dinner)}
            onChange={(event) =>
              updateBubbles({ dinner: textToLines(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          开始工作时
          <textarea
            value={linesToText(draft.bubbles.workStart)}
            onChange={(event) =>
              updateBubbles({ workStart: textToLines(event.currentTarget.value) })
            }
          />
        </label>
      </div>

      <footer className="settings-panel__footer">
        <button
          type="button"
          onClick={() => {
            setDraft(originalSettings.current);
            onPreviewSettings?.(originalSettings.current);
          }}
        >
          恢复上次保存
        </button>
        <button
          className="settings-panel__primary-button"
          type="button"
          onClick={() => onSave(normalizePetSettings(draft))}
        >
          保存设置
        </button>
      </footer>
    </section>
  );
}
