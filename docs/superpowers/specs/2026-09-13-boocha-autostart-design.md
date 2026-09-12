# Boocha 开机自启动设计

## 目标

在 Boocha 设置页提供“开机时启动 Boocha”开关，让用户自行决定是否在 macOS 登录后启动桌宠。

## 交互与状态

- 开关默认关闭。
- 设置面板打开时读取系统真实状态；读取期间禁用开关并显示“正在检查”。
- 用户打开开关时，调用 Tauri 官方 Autostart 插件创建 macOS LaunchAgent；关闭时移除它。
- 操作失败时开关恢复原状，并在开关下显示简短错误提示；不保存错误状态。
- 成功的状态同时保存到现有本地设置，供非原生浏览器预览使用；原生桌面窗口以系统查询结果为准。
- 系统状态同步只保存 `startup` 字段；设置页中尚未点击“保存设置”的大小、饭点和气泡预览不会因此被写入本地。

## 技术边界

- 使用 `@tauri-apps/plugin-autostart` 与 Rust `tauri-plugin-autostart`。当前插件版本的默认 Builder 在 macOS 采用 `MacosLauncher::LaunchAgent`。
- Tauri capability 仅增加该插件启用、禁用和读取状态的必要权限。
- 不改变透明窗口、振动效果、计时器或其他提醒逻辑。
