# Boocha Desktop Pet

一只一直趴在 Mac 桌面上的 Boocha 桌宠。它能拖动、切换待机／工作／吃饭状态、提示饭点、设置开机登录后启动，并提供计时器和倒计时。

> 当前只支持 macOS。

## 给普通用户：下载后直接安装

请到本项目 GitHub 页面右侧的 **Releases** 下载最新的 `Boocha Desktop Pet_*.dmg`。

1. 双击下载好的 `.dmg` 文件。
2. 把 **Boocha Desktop Pet** 拖进「应用程序（Applications）」文件夹。
3. 第一次启动：在「应用程序」里找到 Boocha，**按住 Control 点击它**，选择「打开」，然后在确认框中再次选择「打开」。
4. 之后可像普通 App 一样双击启动。右键桌宠可打开快捷操作；在设置中可开启「登录 Mac 后自动出现」。

### 为什么第一次会看到“无法验证开发者”？

目前发布包是**未签名测试版**，所以 macOS 会显示安全提示；这不代表它不能运行。请仅从本项目 GitHub Releases 下载，并按上面的首次启动步骤操作。

> 不要在 DMG 内直接使用 App。请先拖入「应用程序」再打开，开机自动启动才会正常工作。

## 给开发者 / Agent 用户：从源码运行

### 环境

- 一台 macOS 电脑
- Node.js 20 或更高版本
- Rust stable
- Xcode Command Line Tools

### 本地开发

```bash
git clone <本仓库地址>
cd booch-desktop-pet
npm install
npm run tauri:dev
```

### 自己打包

```bash
npm run tauri:build
```

打包完成后，macOS 安装包通常在：

```text
src-tauri/target/release/bundle/dmg/
```

## 二次创作

欢迎基于代码做桌宠交互、状态、设置面板和本地功能的二次创作。

- 代码采用 [MIT License](LICENSE)。
- Boocha 的角色形象、视频和其他媒体素材不因代码的 MIT License 而自动获得再授权；请按你的素材授权范围使用，公开发布二创作品时尤其需要确认这一点。

## 发布者自检

每次上传新的 `.dmg` 前，请至少确认：

1. 在一台未安装开发环境的 Mac 上，能完成拖入「应用程序」和首次启动。
2. 设置中的「登录 Mac 后自动出现」可正常开启、关闭。
3. Release 页面明确标出适用芯片架构（Apple Silicon 或 Intel）。
4. 未签名版本的首次启动说明仍与本 README 一致。

## 许可证

见 [LICENSE](LICENSE)。
