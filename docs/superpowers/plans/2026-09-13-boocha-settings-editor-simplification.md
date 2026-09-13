# Boocha 设置编辑器精简 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将设置页收敛为三组气泡标签、分钟级吃饭停留时间和不遮挡滚动内容的顶部关闭圆点。

**Architecture:** `petSettings.ts` 负责从旧秒数字段迁移到 `eatMinutes`；`SettingsPanel.tsx` 负责三组聚合编辑与浮层输入；状态机继续使用旧事件与字段，但同一编辑结果同步给相应字段。CSS 负责左对齐和滚动安全留白。

**Tech Stack:** React 19、TypeScript、Vitest、CSS。

**Spec:** `docs/superpowers/specs/2026-09-13-boocha-settings-editor-simplification-design.md`

## Global Constraints

- 保留现有开机自启动的原生读写行为。
- 旧的 `eatSeconds` 保存值必须迁移为至少 1 分钟。
- 不删除既有气泡文案；三组编辑时同步旧字段。
- 默认界面不能显示新增标签输入框。

---

### Task 1: 分钟设置与文案聚合

**Files:**
- Modify: `src/pet/petSettings.ts`
- Modify: `src/pet/petSettings.test.ts`
- Modify: `src/pet/stateMachine.ts`
- Modify: `src/pet/stateMachine.test.ts`
- Modify: `src/App.tsx`

- [ ] 写出旧 `eatSeconds: 30` 读入后得到 `eatMinutes: 1`，以及每个合并气泡组能服务对应触发事件的失败测试。
- [ ] 运行相关 Vitest 文件并确认失败原因是 `eatMinutes` 和合并文案尚未实现。
- [ ] 实现分钟模型、旧值迁移和三组文案同步读取；将 App 中吃饭回退计时改为分钟换算。
- [ ] 重新运行相关测试并确认通过。

### Task 2: 设置页编辑交互与安全留白

**Files:**
- Modify: `src/pet/SettingsPanel.tsx`
- Modify: `src/pet/SettingsPanel.test.tsx`
- Modify: `src/styles.css`

- [ ] 写出失败测试：启动标题无重复文案、分钟输入、三组标签、默认隐藏／点击出现的新增浮层。
- [ ] 运行设置面板测试并确认失败。
- [ ] 实现左对齐启动区、三组标签编辑器、浮层输入与关闭圆点滚动安全留白。
- [ ] 重新运行设置面板测试并确认通过。

### Task 3: 最终核验

- [ ] 运行 `npm test`、`npm run build` 和 `PATH="/Users/bytedance/.cargo/bin:$PATH" cargo test --manifest-path src-tauri/Cargo.toml`。
- [ ] 在浏览器预览检查设置页滚动、标签新增和保存行为。
