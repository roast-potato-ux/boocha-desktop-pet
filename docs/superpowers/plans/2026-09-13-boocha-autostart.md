# Boocha 开机自启动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Boocha 设置页提供能真实创建或移除 macOS 登录项的开机自启动开关。

**Architecture:** `petSettings.ts` 保存浏览器预览的开关值；`autostartClient.ts` 封装原生插件和不可用时的安全回退；`SettingsPanel.tsx` 显示受控开关与错误状态。Rust 初始化官方插件并授予前端最小权限。

**Tech Stack:** React 19、TypeScript、Tauri 2、Tauri Autostart plugin、Vitest。

**Spec:** `docs/superpowers/specs/2026-09-13-boocha-autostart-design.md`

## Global Constraints

- 默认关闭，不得在安装、升级或首次运行时自动创建登录项。
- 当前插件版本的默认 Builder 在 macOS 使用 `MacosLauncher::LaunchAgent`。
- 原生调用失败必须让界面回退，并显示错误；不得伪造已开启。
- 不改变桌宠透明窗口与现有设置实时预览。

---

### Task 1: 设置数据与开关界面

**Files:**
- Modify: `src/pet/petSettings.ts`
- Modify: `src/pet/petSettings.test.ts`
- Modify: `src/pet/SettingsPanel.tsx`
- Modify: `src/pet/SettingsPanel.test.tsx`

**Interfaces:**
- Produces: `startup.launchAtLogin: boolean` 与 `onAutostartChange(enabled): Promise<void>`。

- [x] 写出默认关闭、保存／加载和设置页开关的失败测试。
- [x] 运行 `npm test -- --run src/pet/petSettings.test.ts src/pet/SettingsPanel.test.tsx`，确认新增断言失败。
- [x] 以最小改动实现设置字段与受控开关。
- [x] 再次运行上述测试，确认通过。

### Task 2: 原生插件与真实同步

**Files:**
- Create: `src/pet/autostartClient.ts`
- Create: `src/pet/autostartClient.test.ts`
- Modify: `src/App.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/capabilities/desktop.json`

**Interfaces:**
- Produces: `readAutostart`, `setAutostart`；在原生窗口调用插件、浏览器预览使用保存值。

- [x] 写出原生不可用时不抛出、成功同步和失败回滚的失败测试。
- [x] 运行 `npm test -- --run src/pet/autostartClient.test.ts`，确认新增断言失败。
- [x] 安装官方插件，注册 macOS LaunchAgent 和精确 capabilities。
- [x] 实现客户端封装与 App 保存流程；成功时持久化，失败时显示错误。
- [x] 再次运行客户端测试，确认通过。

### Task 3: 全量核验

- [x] 运行 `npm test`、`npm run build` 和 `PATH="/Users/bytedance/.cargo/bin:$PATH" cargo test --manifest-path src-tauri/Cargo.toml`。
- [x] 完整重启 `npm run tauri:dev`，打开设置，确认读取状态、打开、关闭都能改变 macOS 登录项。
