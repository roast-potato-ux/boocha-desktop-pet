import { useRef, useState } from "react";
import { normalizePetSettings } from "./petSettings";
import type { PetSettings } from "./petSettings";

interface SettingsPanelProps {
  settings: PetSettings;
  onSave: (settings: PetSettings) => void;
  onPreviewSettings?: (settings: PetSettings) => void;
  onClose: () => void;
}

interface BubbleTagEditorProps {
  field: string;
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}

function BubbleTagEditor({ field, label, lines, onChange }: BubbleTagEditorProps) {
  const [newLine, setNewLine] = useState("");

  const addLine = () => {
    const nextLine = newLine.trim();
    if (!nextLine) {
      return;
    }

    onChange([...lines, nextLine]);
    setNewLine("");
  };

  return (
    <div className="bubble-tag-editor" data-bubble-field={field}>
      <span className="bubble-tag-editor__label">{label}</span>
      <div className="bubble-tag-editor__tags">
        {lines.map((line, index) => (
          <span className="bubble-tag" key={`${line}-${index}`}>
            {line}
            <button
              type="button"
              aria-label={`删除气泡文案：${line}`}
              title="删除"
              onClick={() => onChange(lines.filter((_, itemIndex) => itemIndex !== index))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="bubble-tag-editor__add-row">
        <input
          type="text"
          value={newLine}
          aria-label={`输入${label}`}
          placeholder="输入一句话"
          onChange={(event) => setNewLine(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addLine();
            }
          }}
        />
        <button
          type="button"
          className="bubble-tag-editor__add-button"
          aria-label={`添加${label}`}
          title="添加"
          onClick={addLine}
        >
          +
        </button>
      </div>
    </div>
  );
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
    <section className="settings-panel" aria-label="Boocha 设置面板">
      <button
        className="settings-panel__close-dot"
        type="button"
        aria-label="关闭设置"
        title="关闭"
        onClick={onClose}
      />
      <header className="settings-panel__header" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <p className="settings-panel__eyebrow" data-tauri-drag-region>
            Boocha Desktop Pet
          </p>
          <h1 data-tauri-drag-region>设置</h1>
        </div>
      </header>

      <div className="settings-panel__section">
        <h2>桌宠大小</h2>
        <div className="settings-panel__segmented">
          <button type="button" data-active={draft.scale === 0.8} onClick={() => updateDraft({ scale: 0.8 })}>小</button>
          <button type="button" data-active={draft.scale === 1} onClick={() => updateDraft({ scale: 1 })}>中</button>
          <button type="button" data-active={draft.scale === 1.25} onClick={() => updateDraft({ scale: 1.25 })}>大</button>
        </div>
        <label>
          缩放比例 {Math.round(draft.scale * 100)}%
          <input type="range" min="0.6" max="1.4" step="0.05" value={draft.scale} onChange={(event) => updateDraft({ scale: Number(event.currentTarget.value) })} />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>状态停留时间</h2>
        <label>
          吃饭状态显示秒数
          <input type="number" min="10" max="180" value={draft.durations.eatSeconds} onChange={(event) => updateDurations({ eatSeconds: Number(event.currentTarget.value) })} />
        </label>
        <label>
          待机随机冒泡间隔分钟
          <input type="number" min="1" max="30" value={draft.durations.idleInteractionMinutes} onChange={(event) => updateDurations({ idleInteractionMinutes: Number(event.currentTarget.value) })} />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>饭点提醒</h2>
        <label>
          午饭时间
          <input type="time" value={draft.meals.lunch} onChange={(event) => updateMeals({ lunch: event.currentTarget.value })} />
        </label>
        <label>
          晚饭时间
          <input type="time" value={draft.meals.dinner} onChange={(event) => updateMeals({ dinner: event.currentTarget.value })} />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>计时和倒计时</h2>
        <BubbleTagEditor
          field="countdownCompleteLines"
          label="倒计时结束提示"
          lines={draft.timer.countdownCompleteLines}
          onChange={(countdownCompleteLines) => updateTimer({ countdownCompleteLines })}
        />
      </div>

      <div className="settings-panel__section">
        <h2>气泡文案</h2>
        <BubbleTagEditor field="idleClick" label="待机点击" lines={draft.bubbles.idleClick} onChange={(idleClick) => updateBubbles({ idleClick })} />
        <BubbleTagEditor field="workClick" label="工作时点击" lines={draft.bubbles.workClick} onChange={(workClick) => updateBubbles({ workClick })} />
        <BubbleTagEditor field="eatClick" label="吃饭时点击" lines={draft.bubbles.eatClick} onChange={(eatClick) => updateBubbles({ eatClick })} />
        <BubbleTagEditor field="ambientIdle" label="待机自己冒泡" lines={draft.bubbles.ambientIdle} onChange={(ambientIdle) => updateBubbles({ ambientIdle })} />
        <BubbleTagEditor field="lunch" label="午饭提醒" lines={draft.bubbles.lunch} onChange={(lunch) => updateBubbles({ lunch })} />
        <BubbleTagEditor field="dinner" label="晚饭提醒" lines={draft.bubbles.dinner} onChange={(dinner) => updateBubbles({ dinner })} />
        <BubbleTagEditor field="workStart" label="开始工作时" lines={draft.bubbles.workStart} onChange={(workStart) => updateBubbles({ workStart })} />
      </div>

      <footer className="settings-panel__footer">
        <button type="button" onClick={() => { setDraft(originalSettings.current); onPreviewSettings?.(originalSettings.current); }}>
          恢复上次保存
        </button>
        <button className="settings-panel__primary-button" type="button" onClick={() => onSave(normalizePetSettings(draft))}>
          保存设置
        </button>
      </footer>
    </section>
  );
}
