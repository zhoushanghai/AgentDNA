# AgentDNA 项目结构详解

本文档详细解释了 `AgentDNA` 项目的目录结构以及每个文件的具体作用。

## 目录树概览

```text
/home/hz/ai_rules_tool/AgentDNA/
├── .vscode/                  # VS Code 开发配置
│   ├── launch.json           # 调试配置 (F5 启动扩展)
│   └── tasks.json            # 构建任务 (npm run watch)
├── dist/                     # 编译输出目录 (TypeScript -> JavaScript)
├── node_modules/             # 项目依赖包
├── src/                      # 源代码目录
│   ├── commands/             # 命令实现
│   │   ├── showMenu.ts       # 显示快捷菜单逻辑
│   │   ├── syncRules.ts      # 核心同步逻辑
│   │   └── tokenCommands.ts  # Token 管理逻辑
│   ├── services/             # 业务服务层
│   │   ├── GitService.ts     # Git 操作封装
│   │   ├── LinkService.ts    # 文件链接操作封装
│   │   └── TokenManager.ts   # 密钥存储管理
│   └── extension.ts          # 插件入口文件
├── images/                   # 图标资源
├── .gitignore                # Git 忽略配置
├── .vscodeignore             # 插件打包忽略配置
├── implement.md              # 项目实现计划书
├── LICENSE                   # 开源许可证
├── package.json              # 项目清单与配置
├── README.md                 # 用户使用文档
└── tsconfig.json             # TypeScript 编译配置
```

## 详细文件说明

### 1. 核心源代码 (`src/`)

这是插件的主要逻辑所在。

#### 入口文件
*   **`src/extension.ts`**:
    *   **作用**: 插件的入口点。
    *   **关键逻辑**:
        *   `activate()`: 插件激活时调用。初始化 `TokenManager`，注册所有命令 (`sync`, `setToken`, `deleteToken`, `showMenu`)。
        *   创建状态栏项目 (`$(sync) AgentDNA`)，点击可唤出操作菜单。

#### 命令模块 (`src/commands/`)
*   **`src/commands/syncRules.ts`**:
    *   **作用**: 实现 `AgentDNA: Sync` 命令，是插件的核心业务流程。
    *   **流程**:
        1.  读取配置 `agentDna.repoUrl`。
        2.  调用 `GitService` 将远程仓库同步到本地缓存目录 (`~/.agent_dna`)。
        3.  检查仓库中是否有 `AGENT.md`。
        4.  检查当前工作区是否已有文件，若有冲突（且不是软链接）则弹窗警告。
        5.  调用 `LinkService` 在当前项目根目录创建软链接。
*   **`src/commands/tokenCommands.ts`**:
    *   **作用**: 管理 GitHub Personal Access Token。
    *   **函数**:
        *   `setToken()`: 弹窗让用户输入 Token，并存入安全存储。
        *   `deleteToken()`: 清除已存储的 Token。
*   **`src/commands/showMenu.ts`**:
    *   **作用**: 实现 `AgentDNA: Show Menu` 命令。
    *   **逻辑**: 构建一个 QuickPick 菜单，聚合了同步、配置 Token、打开设置等常用操作，方便用户快速使用。

#### 服务模块 (`src/services/`)
*   **`src/services/GitService.ts`**:
    *   **作用**: 封装所有 Git 相关操作，屏蔽底层细节。
    *   **功能**:
        *   `syncRepo()`: 智能判断是执行 `git clone` 还是 `git pull`。
        *   `getAuthenticatedUrl()`: 处理私有仓库认证，将 Token 注入到 HTTPS URL 中。
        *   错误处理：将 Git 错误转化为用户友好的提示（如权限不足、仓库不存在）。
*   **`src/services/LinkService.ts`**:
    *   **作用**: 处理文件系统操作，特别是软链接。
    *   **功能**:
        *   `createSymlink()`: 创建跨平台的符号链接。
        *   `isSymlink()`: 准确判断文件是否为软链接（区分普通文件）。
        *   `fileExists()` / `remove()`: 基础文件操作。
*   **`src/services/TokenManager.ts`**:
    *   **作用**: 单例模式的密钥管理器。
    *   **技术**: 使用 VS Code 提供的 `context.secrets` API，将 Token 安全地存储在操作系统凭据管理器中（比明文配置更安全）。

### 2. 配置文件

*   **`package.json`**:
    *   **作用**: 定义插件的元数据和扩展点。
    *   **关键字段**:
        *   `activationEvents`: 定义插件何时激活（`onStartupFinished`）。
        *   `contributes.configuration`: 定义用户设置项 `agentDna.repoUrl`。
        *   `contributes.commands`: 注册用户可在命令面板看到的命令。
        *   `dependencies`: 运行时依赖（如 `simple-git`）。
*   **`tsconfig.json`**:
    *   **作用**: TypeScript 编译选项，定义如何将 `.ts` 编译为 `.js`。
*   **`.vscodeignore`**:
    *   **作用**: 使用 `vsce package` 打包插件时，排除不需要发布的文件（如源代码 `src/`，只保留编译后的 `dist/`）。

### 3. 文档与资源

*   **`implement.md`**: 开发初期的实现计划，记录了 MVP 功能范围和技术选型。
*   **`PROJECT_DOCS.md`** (新创建): 项目的详细文档。
*   **`README.md`**: 发布到插件市场的展示页，面向最终用户。
