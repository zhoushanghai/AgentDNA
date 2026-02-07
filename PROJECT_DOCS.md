# AgentDNA 项目文档

## 1. 项目概览

**项目名称**: AgentDNA
**版本**: 0.1.0
**描述**: 一个 Visual Studio Code 扩展，旨在跨项目同步 AI 代理规则（`AGENT.md`）。

AgentDNA 允许开发者维护一个中心化的 "AI 规则仓库"（通常是一个 GitHub 仓库），并将这些规则无缝同步到各个本地项目中。这确保了你的 AI 辅助编程工具（如 VS Code Copilot, Cursor, Antigravity 等）在不同项目中都能遵循一套统一的行为准则和上下文。

## 2. 核心功能

*   **规则同步**: 从配置的 GitHub 仓库拉取最新的 `AGENT.md` 文件。
*   **软链接机制**:
    *   将规则仓库克隆/更新到本地的统一存储位置：
        *   **Windows**: `%APPDATA%\AgentDNA`
        *   **macOS**: `~/Library/Application Support/AgentDNA`
        *   **Linux**: `~/.agent_dna`
    *   在当前 VS Code 工作区根目录创建指向该中心化文件的 **软链接 (Symlink)**。
    *   **优势**: 只需要维护一份规则文件，所有项目引用的都是同一个源文件。修改源文件，所有项目自动生效（取决于 AI 工具读取的时机）。
*   **冲突处理**: 如果工作区已存在 `AGENT.md`（且不是软链接），插件会发出警告并询问用户是否覆盖。
*   **安全认证**: 支持通过 GitHub Personal Access Token (PAT) 访问私有仓库。
*   **仓库检查**: 在导入规则前，自动检测当前目录是否为有效的 Git 仓库。如果不是（缺少 `.git` 目录），会弹出警告防止误操作。
*   **Git 追踪管理**:
    *   默认情况下，`AGENT.md` 会被自动添加到 `.gitignore` 中，防止规则文件污染项目代码库。
    *   用户可以通过设置 `agentDna.includeInGit` 或在快捷菜单中选择 "Git 追踪"，将规则文件加入版本控制（即从 `.gitignore` 中移除）。
    *   此功能仅在项目根目录存在 `.gitignore` 文件时可用。

## 3. 架构设计

### 3.1 工作流程

1.  **配置**: 用户在 VS Code 设置中配置 `agentDna.repoUrl`（规则仓库地址）。
2.  **触发**: 用户执行命令 `AgentDNA: Sync` 或点击状态栏图标。
3.  **下载/更新**: 插件调用 `GitService`，使用 `simple-git` 将仓库克隆或拉取到本地缓存目录。
4.  **链接**: 插件调用 `LinkService`，在当前打开的工作区根目录创建名为 `AGENT.md` 的符号链接，指向缓存目录中的对应文件。

### 3.2 目录结构

项目基于 TypeScript 和 VS Code Extension API 构建。

```text
ai_rules_tool/AgentDNA/
├── src/
│   ├── extension.ts          # 插件入口，注册命令和状态栏项目
│   ├── commands/
│   │   ├── syncRules.ts      # "Sync" 命令的核心逻辑 (流程控制)
│   │   ├── tokenCommands.ts  # Token 管理命令 (设置/删除 GitHub Token)
│   │   └── showMenu.ts       # 显示操作菜单
│   └── services/
│       ├── GitService.ts     # 封装 Git 操作 (Clone, Pull)
│       ├── LinkService.ts    # 封装文件系统操作 (检查文件, 创建软链接)
│       └── TokenManager.ts   # 封装敏感信息存储 (使用 VS Code SecretStorage)
├── package.json              # 插件清单 (命令定义, 配置项, 依赖)
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 用户使用说明
```

## 4. 详细模块说明

### 4.1 Extension Entry (`extension.ts`)
*   在 `activate` 函数中初始化 `TokenManager`。
*   注册以下命令：
    *   `agentDna.sync`: 同步规则。
    *   `agentDna.setToken`: 设置 GitHub Token (内部命令)。
    *   `agentDna.deleteToken`: 删除 GitHub Token (内部命令)。
    *   `agentDna.showMenu`: 显示主菜单。
*   创建并显示状态栏项目 `$(sync) AgentDNA`。

### 4.2 Sync Logic (`commands/syncRules.ts`)
*   验证 `agentDna.repoUrl` 是否已配置。
*   验证当前是否打开了工作区。
*   执行 `GitService.syncRepo` 更新本地缓存。
*   检查仓库中是否存在 `AGENT.md`。
*   处理目标文件已存在的情况（询问覆盖）。
*   执行 `LinkService.createSymlink` 创建链接。
*   调用 `GitIgnoreService` 更新 `.gitignore` 配置。

### 4.5 Menu Logic (`commands/showMenu.ts`)
*   **主菜单**:
    *   `立即同步`:
        *   若已配置仓库地址：正常触发同步。
        *   若未配置：显示为警示状态 `$(alert)`，点击触发配置向导 (Webview)。
    *   `设置`: 进入二级设置菜单。
    *   `Git 追踪`: 快速切换是否忽略 `AGENT.md`。
*   **设置子菜单**:
    *   `配置向导`: 打开 Webview 配置页面，并行设置地址和 Token。
    *   `修改仓库地址`: 单独修改 GitHub 仓库 URL。
    *   `修改 GitHub Token`: 单独管理私有仓库访问令牌。
    *   `删除所有配置`: 清除所有插件配置（重置状态）。

### 4.3 Git Service (`services/GitService.ts`)
*   使用 `simple-git` 库。
*   处理仓库的 Clone 和 Pull 操作。
*   处理带 Token 的 URL 认证。

### 4.4 Link Service (`services/LinkService.ts`)
*   使用 Node.js `fs` 模块。
*   `createSymlink`: 创建符号链接。
*   `isSymlink`: 检查文件是否已经是一个链接。

## 5. 配置与使用

### 5.1 设置项 (`package.json`)
*   `agentDna.repoUrl`: 字符串类型，指定存放 `AGENT.md` 的 GitHub 仓库地址。

### 5.2 依赖
*   `vscode`: VS Code 扩展 API。
*   `simple-git`: 用于执行 Git 命令。

## 6. 开发指南

1.  **安装依赖**: `npm install`
2.  **编译**: `npm run compile`
3.  **调试**: 按 `F5` 启动 "Extension Development Host"。
4.  **打包**: 使用 `vsce package` 打包为 `.vsix` 文件。
