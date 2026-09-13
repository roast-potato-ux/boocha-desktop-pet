import { useRef, useState } from "react";
import {
  getBubbleGroupLines,
  normalizePetSettings,
  setBubbleGroupLines,
} from "./petSettings";
import type { BubbleGroup, PetSettings } from "./petSettings";

interface SettingsPanelProps {
  settings: PetSettings;
  onSave: (settings: PetSettings) => void;
  onPreviewSettings?: (settings: PetSettings) => void;
  onClose: () => void;
  autostart: {
    enabled: boolean;
    loading: boolean;
    error: string | null;
  };
  onAutostartChange: (enabled: boolean) => void;
}

interface BubbleTagEditorProps {
  field: string;
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}

function BubbleTagEditor({ field, label, lines, onChange }: BubbleTagEditorProps) {
  const [newLine, setNewLine] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addLine = () => {
    const nextLine = newLine.trim();
    if (!nextLine) {
      return;
    }

    onChange([...lines, nextLine]);
    setNewLine("");
    setIsAdding(false);
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
        <button
          type="button"
          className="bubble-tag-editor__add-button"
          aria-label={`添加${label}`}
          title="添加"
          onClick={() => setIsAdding(true)}
        >
          +
        </button>
      </div>
      {isAdding ? (
        <div
          className="bubble-tag-editor__popover"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setNewLine("");
              setIsAdding(false);
            }
          }}
        >
          <input
            autoFocus
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
            aria-label={`确认添加${label}`}
            title="添加"
            onClick={addLine}
          >
            添加
          </button>
          <button
            type="button"
            aria-label={`取消添加${label}`}
            title="取消"
            onClick={() => {
              setNewLine("");
              setIsAdding(false);
            }}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SettingsPanel({
  settings,
  onSave,
  onPreviewSettings,
  onClose,
  autostart,
  onAutostartChange,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const originalSettings = useRef(settings);

  const updateDraft = (next: Partial<PetSettings>) => {
    const nextDraft = {
      ...draft,
      ...next,
      startup: settings.startup,
    } as PetSettings;
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

  const updateBubbleGroup = (group: BubbleGroup, lines: string[]) => {
    updateBubbles(setBubbleGroupLines(draft.bubbles, group, lines));
  };

  const updateTimer = (next: Partial<PetSettings["timer"]>) => {
    updateDraft({ timer: { ...draft.timer, ...next } });
  };

  const updateSurprise = (next: Partial<PetSettings["surprise"]>) => {
    updateDraft({ surprise: { ...draft.surprise, ...next } });
  };

  return (
    <section className="settings-panel" aria-label="Boocha 设置面板">
      <div className="settings-panel__safe-area">
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
      </div>

      <div className="settings-panel__scroll">
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
        <h2>开机时启动 Boocha</h2>
        <label className="settings-panel__toggle-row">
          <small>登录 Mac 后自动陪你出现在桌面</small>
          <input
            type="checkbox"
            role="switch"
            aria-label="开机时启动 Boocha"
            checked={autostart.enabled}
            disabled={autostart.loading}
            onChange={(event) => onAutostartChange(event.currentTarget.checked)}
          />
        </label>
        {autostart.loading ? (
          <p className="settings-panel__hint">正在检查或更新启动设置…</p>
        ) : null}
        {autostart.error ? (
          <p className="settings-panel__error" role="alert">{autostart.error}</p>
        ) : null}
      </div>

      <div className="settings-panel__section">
        <h2>状态停留时间</h2>
        <label>
          吃饭状态停留时间（分钟）
          <input type="number" min="1" max="60" value={draft.durations.eatMinutes} onChange={(event) => updateDurations({ eatMinutes: Number(event.currentTarget.value) })} />
        </label>
        <label>
          嗯嗯随机冒泡间隔分钟
          <input type="number" min="1" max="30" value={draft.durations.idleInteractionMinutes} onChange={(event) => updateDurations({ idleInteractionMinutes: Number(event.currentTarget.value) })} />
        </label>
      </div>

      <div className="settings-panel__section">
        <h2>彩蛋</h2>
        <label className="settings-panel__toggle-row">
          <small>进入工作状态时，彩蛋会随机出现。</small>
          <input
            type="checkbox"
            role="switch"
            aria-label="开启彩蛋"
            checked={draft.surprise.enabled}
            onChange={(event) => updateSurprise({ enabled: event.currentTarget.checked })}
          />
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
        <BubbleTagEditor field="idle" label="嗯嗯" lines={getBubbleGroupLines(draft.bubbles, "idle")} onChange={(lines) => updateBubbleGroup("idle", lines)} />
        <BubbleTagEditor field="work" label="工作" lines={getBubbleGroupLines(draft.bubbles, "work")} onChange={(lines) => updateBubbleGroup("work", lines)} />
        <BubbleTagEditor field="eat" label="吃饭" lines={getBubbleGroupLines(draft.bubbles, "eat")} onChange={(lines) => updateBubbleGroup("eat", lines)} />
      </div>

        <footer className="settings-panel__footer">
        <button type="button" onClick={() => {
          const restored = {
            ...originalSettings.current,
            startup: settings.startup,
          };
          setDraft(restored);
          onPreviewSettings?.(restored);
        }}>
          恢复上次保存
        </button>
        <button className="settings-panel__primary-button" type="button" onClick={() => onSave(normalizePetSettings({ ...draft, startup: settings.startup }))}>
          保存设置
        </button>
        </footer>
      </div>
    </section>
  );
}
