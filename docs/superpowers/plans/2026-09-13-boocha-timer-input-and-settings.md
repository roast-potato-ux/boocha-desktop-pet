# Boocha 自定义倒计时与设置面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在桌宠头顶输入四位 `MM:SS` 自定义倒计时，并把设置面板调整为 macOS 关闭圆点与可增删的气泡标签。

**Architecture:** `customCountdown.ts` 保持四位时间输入、光标与校验的纯逻辑；`CountdownComposer.tsx` 负责可聚焦的头顶编辑胶囊；`App.tsx` 只在编辑完成后按秒启动现有计时器。设置面板继续把气泡保存为字符串数组，但用标签编辑器操作它们。

**Tech Stack:** React 19、TypeScript、Vitest、既有 Tauri 2 壳层。

**Spec:** `docs/superpowers/specs/2026-09-13-boocha-timer-input-and-settings-design.md`

## Global Constraints

- Boocha 平时窗口必须纯透明；毛玻璃仅用于现有设置面板与时间胶囊。
- 不恢复“喝水”状态，不把用户 IP 素材用于公开分发。
- 快捷按钮保留 `onPointerDown`、`onDoubleClick`、`onClick` 三处阻止事件冒泡。
- 预设倒计时继续使用 5／15／30 分钟；自定义倒计时最大为 `99:59`。

---

### Task 1: 四位倒计时模型与秒级启动

**Files:**
- Create: `src/pet/customCountdown.ts`
- Create: `src/pet/customCountdown.test.ts`
- Modify: `src/pet/focusTimer.ts`
- Modify: `src/pet/focusTimer.test.ts`

**Interfaces:**
- Produces: `createCustomCountdownDraft`, `enterCustomCountdownDigit`, `selectCustomCountdownSegment`, `getCustomCountdownSeconds`, `startCountdownSeconds`。

- [ ] 写出四位按顺序输入、分／秒点击定位、非法秒数和未填满不能启动的失败测试。
- [ ] 运行 `npm test -- src/pet/customCountdown.test.ts src/pet/focusTimer.test.ts`，确认新增用例失败。
- [ ] 用最小纯函数实现草稿与秒级启动；预设分钟 API 保持兼容。
- [ ] 再次运行上述测试，确认通过。

### Task 2: 顶部编辑胶囊与快捷入口

**Files:**
- Create: `src/pet/CountdownComposer.tsx`
- Create: `src/pet/CountdownComposer.test.tsx`
- Modify: `src/pet/TimerBadge.tsx`
- Modify: `src/pet/QuickActions.tsx`
- Modify: `src/pet/QuickActions.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 1 的 `CustomCountdownDraft` 和秒数校验。
- Produces: 头顶 `MM:SS` 编辑状态，播放开始、x 取消和更大的运行时间胶囊。

- [ ] 写出 `....` 入口、四位编辑、回车／播放开始、取消和暂停行为的失败测试。
- [ ] 运行相关 Vitest 文件，确认新断言失败。
- [ ] 实现编辑胶囊、App 状态衔接和大号时间胶囊样式。
- [ ] 运行相关 Vitest 文件，确认通过。

### Task 3: macOS 关闭点与气泡标签编辑

**Files:**
- Modify: `src/pet/petSettings.ts`
- Modify: `src/pet/petSettings.test.ts`
- Modify: `src/pet/SettingsPanel.tsx`
- Modify: `src/pet/SettingsPanel.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: 既有 `PetBubbleSettings` 字符串数组。
- Produces: 可添加、删除（可删空，表示该类事件静默）的标签编辑器，以及固定可见的左上关闭点。

- [ ] 写出设置中没有自定义分钟输入、加号新增、x 删除和关闭点的失败测试。
- [ ] 运行 `npm test -- src/pet/SettingsPanel.test.tsx src/pet/petSettings.test.ts`，确认新增断言失败。
- [ ] 实现标签编辑器、旧设置安全迁移和 macOS 风格关闭点。
- [ ] 运行对应测试，确认通过。

### Task 4: 全量验证和桌面核验

**Files:**
- Modify: 本任务实际涉及的测试与代码文件。

- [ ] 运行 `npm test`。
- [ ] 运行 `npm run build`。
- [ ] 运行 `PATH="/Users/bytedance/.cargo/bin:$PATH" cargo test --manifest-path src-tauri/Cargo.toml`。
- [ ] 完整重启 `npm run tauri:dev`，检查大时间胶囊、四位输入、设置关闭圆点和标签增删。
