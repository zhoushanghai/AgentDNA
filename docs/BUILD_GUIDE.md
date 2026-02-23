# AgentDNA v3 构建与开发指南

本文档记录了如何在你自己的机器上从零搭建 AgentDNA 插件的开发环境，并进行编译与调试。

## 1. 开发环境要求

AgentDNA 是一个基于 Node.js 和 TypeScript 开发的 VS Code 扩展。你需要准备以下基础环境：

- **Node.js**: 推荐版本 `v20.x` 或以上。(可以通过 `nvm` 或官网安装)
- **npm**: Node.js 自带的包管理工具。
- **Git**: 插件由于依赖 `simple-git` 执行底层同步逻辑，你的操作机上必须安装并配置好全局的 Git 环境。
- **VS Code**: 用于测试和调试扩展。

## 2. 初始环境安装

首先，克隆仓库并进入项目根目录：

```bash
# 假设已经 clone 下来，进入项目根目录
cd AgentDNA

# 安装所有项目依赖
npm install
```

> **注意**: 如果遇到依赖冲突或过时警告，可以直接运行 `npm audit fix`，但通常 `npm install` 成功且不报错即可。

## 3. 核心构建机制

AgentDNA 的代码存放在 `src/` 目录下（采用 TypeScript 编写）。所有命令逻辑都在 `src/commands`，底层逻辑封装在 `src/services` 中。

为了让 VS Code 能运行该扩展，TypeScript 代码必须编译成 JavaScript 并放入 `dist/` 目录。

### 手动单次编译

如果你只需要编译一次并检查代码中的 TypeScript 语法错误，运行：

```bash
npm run compile
```

这会在后台执行 `tsc -p ./`。如果看到 `Exit code: 0` 或者没有任何报错输出，说明编译成功。

### 持续监听模式 (Watch Mode)

如果你正在**重度开发**，不想每次修改代码都手动敲一次 compile 命令，可以开启 Watch 模式：

```bash
npm run watch
```

这会让 `tsc` 处于常驻后台的状态，每当你按下保存（Save）时，它都会在一秒钟内自动将 `.ts` 增量编译为 `.js`。

## 4. 在 VS Code 中调试运行

VS Code 提供了原生级别的扩展开发支持，这是我们在编写扩展时最重要的一环：

1. **打开项目**：使用 VS Code 打开 `AgentDNA` 目录。
2. **启动扩展开发宿主**：按键盘上的 `F5` 键（或在侧边栏点击 "Run and Debug" 图标，然后点击绿色的播放按钮 "Run Extension"）。
3. **测试功能**：
   - 此时会弹出一个崭新的 VS Code 窗口，标题上带有 `[Extension Development Host]` 的字样。
   - 在这个新窗口中，你的 AgentDNA V3 版本已经被临时“安装”上了。
   - 按下 `Ctrl+Shift+P`，输入 `AgentDNA`，即可看到刚写好的所有命令（如 `AgentDNA: Force Push`、`AgentDNA: Settings`），你可以安全地在这里点击并进行真实环境的功能测试。
4. **断点调试**：你可以在原窗口的 `src/*.ts` 源码中打红点（Breakpoints）。当在“测试窗口”触发相关命令时，VS Code 会自动暂停在你打断点的地方，方便你排查变量内容。

## 5. 打包发布 (.vsix)

当你完成了开发和测试，想把插件打包发给别人（或者拖进自己的主力 VS Code 里安装）时，你需要将其打包成 VS Code 扩展专用的 `.vsix` 文件。

### 步骤

1. 安装 VS Code 扩展打包工具（如果还没安装过）：
   ```bash
   npm install -g @vscode/vsce
   ```

2. 确保依赖都是干净的，代码已最新编译：
   ```bash
   npm install
   npm run compile
   ```

3. 执行打包命令：
   ```bash
   vsce package
   ```

打包成功后，当前目录下会生成一个 `agent-dna-0.2.0.vsix`（版本号取决于 `package.json` 中的 version 配置）。你可以通过 VS Code 的扩展栏 ->右上角三个点 -> `Install from VSIX...` 来安装这个插件。
