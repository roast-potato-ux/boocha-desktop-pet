# Boocha Desktop Pet

<img src="src-tauri/icons/boocha-readme.jpg" alt="Boocha 图标" width="220">

一只一直趴在 Mac 桌面上的 Boocha 桌宠。它能在待机、工作与吃饭之间切换，提醒饭点，陪你专注。

> 当前仅支持 macOS，首个公开安装包面向 Apple Silicon（M 系列芯片）Mac。
> ©️版权声明： @ [Bearis（IP 作者）](https://xhslink.cn/o/8aYhoxW8bl6) 和 [AI(OH)3（代码作者）](https://xhslink.cn/o/6q0mMPXO7Up)。如需在网络上发布和本项目有关的内容，请@他们俩～

## 功能

- 单击显示/切换冒泡（文案可自定义），双击切换「嗯嗯／工作／吃饭」状态、右键打开倒计时／计时器／设置。
- 饭点自动进入吃饭状态；待机时随机冒泡。
- 计时器与倒计时：工作视觉、毛玻璃时间窗和可编辑的结束提示。
- 🎁工作状态下，会随机出现小彩蛋。

## 给所有爱 Boocha 的我们：下载后直接安装

### 点击下面按钮，前往下载最新的 macOS 安装包：

<p>
  <a href="https://github.com/roast-potato-ux/boocha-desktop-pet/releases/tag/v0.1.0">
    <img src="https://img.shields.io/badge/下载%20Boocha%20for%20Mac-v0.1.0-111827?style=for-the-badge&logo=apple&logoColor=white" alt="下载 Boocha for Mac">
  </a>
</p>

### 🤖或者让 Agent 帮你安装（最简单、最直白、最通用的方法）
如果你也使用 Codex、Claude、Workbuddy、豆包工作、Openclaw、Trae 等 Agent

把下面这段话复制给你常用的 Agent 即可：

```text
请帮我在这台 Mac 安装 Boocha Desktop Pet。请从 https://github.com/roast-potato-ux/boocha-desktop-pet/releases/tag/v0.1.0 下载最新版 Apple Silicon（M 系列）`.dmg`，把 Boocha Desktop Pet.app 安装到“应用程序（Applications）”。如果发现已有同名 App，请先告诉我并询问是否覆盖。安装完成后，使用 Control 点击应用并选择“打开”完成首次启动；这是未签名测试版，macOS 的安全提示属于正常现象。最后启动 Boocha 并告诉我结果。不要请求或使用我的 GitHub 凭据。
```

1. 双击下载好的 `.dmg` 文件。
2. 把 **Boocha Desktop Pet** 拖进「应用程序（Applications）」文件夹。
3. 第一次启动：在「应用程序」里找到 Boocha，**按住 Control 点击它**，选择「打开」，然后在确认框中再次选择「打开」。
4. 之后可像普通 App 一样双击启动。右键桌宠可打开快捷操作；在设置中可开启「登录 Mac 后自动出现」。

> 安装包文件名包含 `aarch64` 时，表示它适用于 Apple Silicon（M 系列芯片）Mac。

#### ⚠️ 第一次安装会提示“无法验证开发者”

**这是正常现象！！！** 
目前发布包是**未签名测试版**，所以 macOS 会显示安全提示；这不代表它不能运行。请仅从本项目 GitHub Releases 下载，并按上面的首次启动步骤操作。

> 不要在 DMG 内直接使用 App。请先拖入「应用程序」再打开，开机自动启动才会正常工作。

## 给开发者 / Agent 用户：从源码运行（支持二创，适合有一定 coding 能力的 uu）

### 环境

- 一台 macOS 电脑
- Node.js 20 或更高版本
- Rust stable
- Xcode Command Line Tools

### 本地开发

想在本地边改边看效果，可以先把项目下载到电脑里，安装依赖后启动开发模式。启动后会打开一个桌宠窗口，你修改前端代码时可以实时调试交互和样式。

```bash
git clone https://github.com/roast-potato-ux/boocha-desktop-pet.git
cd boocha-desktop-pet
npm install
npm run tauri:dev
```

### 自己打包

想把改好的 Boocha 变成可以安装的 `.dmg`，运行下面的打包命令。打包会花一点时间，完成后到输出目录里找到安装包即可。

```bash
npm run tauri:build -- --bundles dmg
```

打包完成后，macOS 安装包通常在：

```text
src-tauri/target/release/bundle/dmg/
```

## 二次创作

欢迎基于代码做桌宠交互、状态、设置面板和本地功能的二次创作，二创后的代码同样欢迎提交 PR。

- 代码采用 [MIT License](LICENSE)。
- 本项目使用的 Boocha 角色形象与视频素材已获项目授权；但代码的 MIT License 不会自动把这些媒体素材再授权给所有二创者。请在公开发布二创作品前确认你的素材授权范围。

#### 📢共创与发布说明

如需在网络上发布与本项目相关的内容，请同时注明并 @ [Bearis（IP 作者）](https://xhslink.cn/o/8aYhoxW8bl6) 和 [AI(OH)3（代码作者）](https://xhslink.cn/o/6q0mMPXO7Up)。

## 发布者自检

每次上传新的 `.dmg` 前，请至少确认：

1. 在一台未安装开发环境的 Mac 上，能完成拖入「应用程序」和首次启动。
2. 设置中的「登录 Mac 后自动出现」可正常开启、关闭。
3. Release 页面明确标出适用芯片架构（Apple Silicon 或 Intel）。
4. 未签名版本的首次启动说明仍与本 README 一致。

## 许可证

见 [LICENSE](LICENSE)。
