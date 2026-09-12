# Boocha 桌宠交接文档（2026-09-13）

交接时间：2026-09-13 01:35
项目路径：`/Users/bytedance/Documents/AI Explore/booch-desktop-pet`
当前分支：`main`
当前 HEAD：`005f4c5 feat: rename to Boocha, timer pause/cancel, arc quick actions, fix vibrancy residue and small-scale clipping`
工作区状态：干净（已提交）

> 注意：目录名仍是 `booch-desktop-pet`，但**桌宠名字叫 Boocha**（用户 2026-09-13 明确要求），代码/文案/素材/包名都已改名，只有目录名没动。

---

## 1. 用户真正要的东西

一个跑在 Mac 上的私人桌宠原型：透明置顶、可拖动、有互动，最终目标是和对象跨设备一起玩（第二阶段的事，现在不做同步）。

硬边界（用户明确要求过，别破坏）：

- **名字叫 Boocha**，不是 Booch。
- 视频素材是用户的 IP，**仅限本机私用**，不要包装成可公开分发/售卖的产品。
- v1 只保留三个状态：`待机 / 工作 / 吃饭`。「喝水」状态已被明确删除，不要恢复。
- **桌宠窗口必须纯透明**：平时不能有任何背景板/毛玻璃残留；毛玻璃只在设置面板打开期间存在。
- 用户偏好中文、直接、具体；**不要把没验证的东西说成完成**。

---

## 2. 本轮（2026-09-12 夜 ~ 09-13 凌晨）做完的事

全部在 `005f4c5` 一个提交里（31 文件，+577/-192，含 3 个素材改名）。

### 2.1 关闭设置后毛玻璃残留（根因修复）

- 根因：Tauri `set_effects` 每次调用都会在 macOS 上**新增**一个带 tag 的 `NSVisualEffectView`，而 `window_vibrancy::clear_vibrancy` 每次只删一个。设置面板 live preview 期间窗口被反复 resize → 玻璃层越叠越多 → 关面板后清一层还剩一堆。另外 Tauri 2.11.5 的 JS `clearEffects()` 在 macOS 上是 no-op。
- 修复：`src-tauri/src/lib.rs` 新增 `clear_all_vibrancy`（循环最多 32 次清到干净），`set_panel_vibrancy(false)` 走它；`setup` 里对 main 窗口做启动清理。

### 2.2 窗口尺寸被旧值覆盖（根因修复）

- 根因：`tauri_plugin_window_state` 会在窗口就绪时把上次保存的**尺寸**也恢复回来，覆盖前端 `setSize`。
- 修复：`lib.rs` 里插件改为 `.with_state_flags(POSITION | VISIBLE | DECORATIONS)`——只记位置，不恢复尺寸。**窗口尺寸完全由前端 `settings.scale` 管**。

### 2.3 快捷按钮改成弧形排在桌宠右侧

- 窗口基准尺寸 220×240 → **288×240**：左侧 188px 是桌宠列（顶部 52px 透明带留给气泡），右侧 100px 放弧形按钮。
- 涉及：`tauri.conf.json`、`src/pet/nativeWindowClient.ts`（`petWindowBaseWidth = 288`）、`src/styles.css`（`.pet-anchor` / `.pet-scale-frame` / `.pet-column`）、`src/App.tsx` 两处内联宽度。
- 按钮 40×40，主菜单弧形坐标：`arc-top (200,74)`、`arc-mid (220,122)`、`arc-bottom (200,170)`；倒计时子菜单：`fan-top (196,58)`、`fan-upper (220,102)`、`fan-lower (220,146)`、`fan-bottom (196,190)`。全部 x ≥ 196 > 188，**不遮挡桌宠**。

### 2.4 图标统一

- emoji 换成共享 viewBox 0 0 24 24、strokeWidth 1.9 的内联 SVG（沙漏/秒表/齿轮），CSS 统一 23×23 居中填满 40×40 按钮。

### 2.5 计时/倒计时加暂停、继续、取消

- `src/pet/focusTimer.ts`：新增 `pausedAt`、`pausedTotalMs`、`pauseFocusTimer`、`resumeFocusTimer`、`isFocusTimerPaused`、`isFocusTimerActive`；`evaluateFocusTimer` 用 `pausedAt ?? now` 冻结时钟、扣掉累计暂停时长、暂停中的倒计时永不完成。
- `src/pet/TimerBadge.tsx`：改成胶囊「时间 + 暂停/继续 + 取消」，仍是三处事件隔离。
- `src/pet/focusTimer.test.ts`：新增 6 个暂停/恢复用例（总 127 个测试）。

### 2.6 全项目改名 booch → Boocha

- 文案：托盘「退出 Boocha」、tooltip / 窗口标题 / 设置面板 header / index.html title。
- 标识符：`getBoochaVideoCropRect`、`boochaBackgroundThreshold`、`boochaIdle/Work/Eat`。
- 素材：`git mv` → `src/assets/boocha-{idle,work,eat}.mov`。
- **存储键**：`boocha.pet.position`、`boocha.pet.settings.v1`（旧键不再读取，用户设置/位置已重置一次）。
- 包身份：npm 与 Cargo 包名 `boocha-desktop-pet`、crate `boocha_desktop_pet_lib`、identifier `com.cai.boochapet`、productName `Boocha Desktop Pet`。
- 活文档 `docs/HANDOFF.md`、`docs/runbook.md` 已同步（HANDOFF 里的历史 commit 记录块保持原样）。
- **有意保留**：项目目录名、HANDOFF 的 git log 历史、`docs/superpowers/` 下的历史 plan/spec 归档。

### 2.7 小缩放下计时器按钮被切（根因修复，最后一个提交前发现的）

- 症状：把缩放拉到 65% 后，右键菜单最靠右的「计时器」按钮右侧被窗口边缘切掉一半。
- 根因：`.pet-anchor--native` 是 flex 容器，`.pet-scale-frame`（288×240）是 flex item，**默认 `flex-shrink: 1`**。窗口窄于 288 时（scale < 1）flex 先把画布压到窗口宽，`transform: scale()` 再在压扁后的盒子上缩放；而按钮绝对定位仍按 288 坐标系排 → 右溢。65% 溢出 13.9px；80% 只溢 3px 看不出来；≥100% 不压缩所以正常。
- 修复（`src/styles.css`，纯 CSS）：`.pet-scale-frame` 加 `flex: 0 0 auto` + 显式 `transform-origin: center center`；把 flex 居中从 `.pet-anchor--native` 提升到基类 `.pet-anchor`（浏览器预览模式在 <100% 时有同样的溢出，一并修掉）。

---

## 3. 已做验证

```bash
cd "/Users/bytedance/Documents/AI Explore/booch-desktop-pet"
npm run build        # ✓
npm test             # ✓ 26 files / 127 tests
PATH="/Users/bytedance/.cargo/bin:$PATH" cargo check --manifest-path src-tauri/Cargo.toml   # ✓
```

布局验证（浏览器 1:1 复刻原生几何 + 真实 DOM 测量）：

- 六档缩放 0.6 / 0.65 / 0.8 / 1.0 / 1.25 / 1.4，按钮与桌宠本体 **worst-overflow 全部为 0**。
- 倒计时子菜单（5/15/30/自）在 65% 下全部在界内。
- 浏览器预览模式（非 native）在 65% 下同样无溢出。
- 改名后原生应用实测：窗口 owner 已是 `boocha-desktop-pet`。

暂停/取消行为验证（浏览器，5 分钟倒计时）：`04:58` 起 → 点暂停 3 秒仍冻结 `04:51`、标签变「已暂停」、按钮变「继续计时」→ 恢复后正确扣掉暂停时长走到 `04:48` → 取消后胶囊消失、桌宠回 idle。

**尚未由用户肉眼确认的点**：关闭设置后毛玻璃是否真的不再残留（只能在原生窗口看）。修复逻辑已就位，建议接手时请用户确认一次。

---

## 4. 怎么跑

```bash
cd "/Users/bytedance/Documents/AI Explore/booch-desktop-pet"

# 桌面应用（会编译 Rust，改动 tauri.conf.json / lib.rs 必须重启它才生效）
PATH="/Users/bytedance/.cargo/bin:$PATH" npm run tauri:dev

# 前端预览（浏览器调试用，1420 端口）
npm run dev
```

打包成可双击的 .app（用户问过，还没做）：

```bash
PATH="/Users/bytedance/.cargo/bin:$PATH" npm run tauri:build
```

### 排查原生窗口问题的可靠手段（强烈推荐）

用 Quartz 直接读运行中窗口的真实 bounds，**不需要屏幕录制权限**：

```bash
/Users/bytedance/.workbuddy/binaries/python/envs/default/bin/python -c "
import Quartz
opts = Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements
for w in Quartz.CGWindowListCopyWindowInfo(opts, Quartz.kCGNullWindowID):
    n = w.get('kCGWindowOwnerName','')
    if 'booch' in n.lower():
        print(n, '| pid', w.get('kCGWindowOwnerPID'), '|', dict(w.get('kCGWindowBounds')))
"
```

（`pyobjc-framework-Quartz` 已装在 `/Users/bytedance/.workbuddy/binaries/python/envs/default`。截图权限 `screencapture` 在本机不可用。）

浏览器复刻原生布局的技巧：打开 1420，把 `.pet-stage` 强制设成目标窗口尺寸（如 188×156）+ `overflow:hidden`，给 `.pet-anchor` 加 `pet-anchor--native` 类并把尺寸设成 100%，即可 1:1 复刻原生几何后量 `getBoundingClientRect()`。

---

## 5. 已知的坑（别再踩）

1. **`tauri.conf.json` 是编译期产物**。改窗口尺寸/transparent/windowEffects 后前端热更新无效，必须重启 `tauri:dev`（会重编译 Rust）。
2. **Tauri 2.11.5 `clearEffects()` 在 macOS 上是 no-op**；`window-vibrancy::clear_vibrancy()` 必须在主线程（已用 `run_on_main_thread`）。
3. **`set_effects` 会叠加 vibrancy view**，启用路径**不要**先 clear 再 apply（`run_on_main_thread` 异步顺序竞争会把刚加的删掉）。关面板时用 `clear_all_vibrancy`。
4. **别把 window-state 的 SIZE flag 加回来**，否则又会覆盖前端窗口尺寸。
5. **vite HMR 会漏更新模块**（本机实测：`nativeWindowClient.ts` 的改动没推给运行中的 webview，导致窗口一直用旧宽度）。**改了布局常量后一律完整重启 dev，不要相信热更新。**
6. **快捷按钮事件必须保留三处隔离**（`onPointerDown` / `onDoubleClick` / `onClick` 里 `stopPropagation`），否则事件冒泡到桌宠交互层会把菜单关掉。
7. **flex 容器里的定尺画布要显式 `flex: 0 0 auto`**，否则小缩放下会被压缩，绝对定位元素随之溢出。
8. 改 identifier / productName 会换 WebKit 数据目录（`~/Library/WebKit/<name>`），localStorage 会清空、用户设置重置一次。
9. `npm test` 会扫到 `.worktrees/` 里的测试（见 follow-up）。

---

## 6. 代码地图（改之前先看这里）

| 关注点 | 位置 |
| --- | --- |
| 窗口基准尺寸、缩放换算、设置面板窗口、vibrancy 开关 | `src/pet/nativeWindowClient.ts` |
| 布局基准常量 288×240、桌宠列 188、弧形按钮坐标 | `src/styles.css`（`.pet-anchor` / `.pet-scale-frame` / `.pet-column` / `.quick-action--arc-*` / `--fan-*`） |
| 缩放滑杆范围 | `src/pet/SettingsPanel.tsx`（range 0.6–1.4，step 0.05）；默认值在 `src/pet/petSettings.ts` |
| 计时/倒计时纯逻辑 + 暂停模型 | `src/pet/focusTimer.ts` |
| 时间胶囊 UI（含暂停/取消） | `src/pet/TimerBadge.tsx` |
| 右键快捷按钮 | `src/pet/QuickActions.tsx` |
| Toast/气泡与状态机 | `src/pet/stateMachine.ts`、`src/App.tsx` |
| 原生侧 vibrancy / 窗口状态插件 / 托盘 | `src-tauri/src/lib.rs`（`main.rs` 只是调用 `boocha_desktop_pet_lib::run()`） |
| 设置持久化键 | `src/pet/petSettings.ts`（`boocha.pet.settings.v1`）、`src/pet/petPlacement.ts`（`boocha.pet.position`） |

---

## 7. 未完成 / 建议接手后做的事

1. **让用户肉眼确认**：关设置后无玻璃残留；65% 缩放下计时器按钮完整。
2. **vitest 排除 `.worktrees/`**：main checkout 会跑到 worktree 里的测试（61+61 → 现在 127 里含重复），gitignore 对 vitest 默认无效。建议在 vitest 配置加 `exclude`。
3. **上一轮 code review 留下的 4 条 Important（性能/语义，未修）**：
   - `focusTimer` 的 effect 每秒重建 interval；
   - Tauri `listen` 频繁重订阅；
   - ambient 交互 effect 反复重建；
   - `toggleStopwatch` 停止时强制回 idle，覆盖了「吃饭后回上一状态」的语义。
4. **打包 .app**：用户提过「要打包的时候说一声」，尚未执行。
5. `.worktrees/booch-focus-timer` 已合并（`6bd3574`），**保留未删**，不要擅自清理。

---

## 8. 给接手 agent 的一句话

核心体验已经跑顺，最需要保护的四点：**平时窗口必须纯透明（毛玻璃只在设置面板活着）；快捷按钮不遮挡桌宠且在小缩放下不被切；计时中桌宠安静、显示时间、可暂停/取消；事件不能从按钮冒泡到桌宠本体**。改布局常量前先读第 6 节代码地图，改完一定完整重启 dev 再验证。
