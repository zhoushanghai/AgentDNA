# 🗺️ PROJECT_MAP — AgentDNA

> 本文档是项目的全局导航地图，由 AI 自动分析生成，供快速了解项目全貌使用。
> 生成时间：2026-02-23 21:30

---

## 一、项目简介

AgentDNA 是一个 **Visual Studio Code 扩展（插件）**，用于统一管理和同步 AI 编程工具（如 VS Code, Cursor, Antigravity）的三类全局文档：**Rules (GEMINI.md)**、**Workflows** 和 **Skills**。

**核心特性**：
- 🔄 **Pull (Sync from Global)**：从 GitHub 仓库拉取最新配置并部署到本机全局目录（`~/.gemini/`）。
- 📤 **Push (Sync to Global)**：将本机全局目录的修改合并推送到远程仓库。
- ⚡ **Force Push**：以本机为权威，强制覆盖远程仓库内容。
- ⚙️ **Settings Webview**：通过图形界面配置仓库、Token 及同步目标（Rules/Workflows/Skills）。
- 🔒 **安全存储**：GitHub Token 安全存储于系统凭据管理器。

---

## 二、技术栈

| 维度 | 内容 |
|---|---|
| **语言** | TypeScript 4.9 |
| **运行时** | Node.js (VS Code 内置) |
| **核心框架** | VS Code Extension API |
| **主要依赖** | `simple-git ^3.22`（Git 操作） |
| **目标平台** | Windows / macOS / Linux |

---

## 三、文件结构与模块说明

```
AgentDNA/
├── src/                         # TypeScript 源代码
├── src/extension.ts             # 🔑 插件入口：注册命令与状态栏图标
├── src/commands/                # 命令层
│   ├── syncRules.ts             # Pull 逻辑：部署到全局路径
│   ├── publishRules.ts          # Push 逻辑：从全局路径收集并提交
│   ├── forcePublish.ts          # 强制推送逻辑
│   ├── setupWebview.ts          # Settings UI：配置仓库与同步目标
│   └── showMenu.ts              # 状态栏菜单
├── src/services/                # 服务层
│   ├── DocumentSyncService.ts   # 核心同步逻辑：全局路径 ↔ 缓存目录
│   ├── PathResolver.ts          # 跨平台路径解析（~ 展开等）
│   ├── GitService.ts            # Git 底层封装
│   └── TokenManager.ts          # Token 安全管理
├── docs/                        # 文档中心
│   ├── plan_v3_multi_doc.md     # v3 实施计划与 Checklist
│   └── DEV_LOG.md               # [NEW] 开发日志与实验记录
├── README.md                    # 用户说明
├── PROJECT_MAP.md               # [THIS FILE] 项目地图
└── package.json                 # 插件清单与配置项定义
```

---

## 四、核心模块解析

### 1. DocumentSyncService (`src/services/DocumentSyncService.ts`)
**职责**：负责「全局配置目录」与「仓库本地缓存」之间的数据同步。支持保守合并（Push）和破坏性同步（Force Push/Pull）。

### 2. PathResolver (`src/services/PathResolver.ts`)
**职责**：封装操作系统差异，解析 `~/.gemini/` 等跨平台路径，提供 Rules、Workflows 和 Skills 的权威路径。

### 3. GitService (`src/services/GitService.ts`)
**职责**：底层 Git 操作封装。
- `validateRepoStructure()`: 验证仓库是否符合 v3 目录规范（rules/, workflows/, skills/）。

---

## 五、数据流向图

### 5.1 Pull (远端 → 本机)
```mermaid
flowchart TD
    A[用户触发 Pull] --> B[git pull 远程仓库到缓存]
    B --> C{是否为 v3 结构?}
    C -- 否 --> D[提示迁移/报错]
    C -- 是 --> E[DocumentSyncService.deployToGlobal()]
    E --> F[部署 Rules/Workflows/Skills 到 ~/.gemini/ 对应目录]
    F --> G[✅ 完成]
```

### 5.2 Push (本机 → 远端)
```mermaid
flowchart TD
    A[用户触发 Push] --> B[DocumentSyncService.collectFromGlobal()]
    B --> C[从 ~/.gemini/ 收集文件到缓存目录]
    C --> D[git add + commit + push]
    D -- 普通 Push --> E[合并语义：不删除远端独有文件]
    D -- 强制 Push --> F[覆盖语义：精确同步本机内容]
    E & F --> G[✅ 完成]
```

---

## 六、待研究 / 尚不明确
- [ ] Windows 环境下 `%USERPROFILE%\.gemini\` 的实际部署表现。
- [ ] 大量 Skills 文件场景下的同步性能。
- [ ] 自动化测试用例的编写（特别是跨平台路径模拟）。
