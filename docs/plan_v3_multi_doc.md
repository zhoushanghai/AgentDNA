# AgentDNA v3 多文档架构 - 实施计划

> **主文档**：此文件是 v3 设计的权威来源，所有后续修改以此为准。

---

## 目标

将插件从管理单一 `AGENT.md` 文件，升级为统一管理 AI 编程工具的三类全局文档：**Rules、Workflows、Skills**，且只管全局路径，不再分发到各工作区。

---

## v3 核心设计

### 三类文档与目标路径（跨平台）

| 类型 | Linux / macOS | Windows |
|------|--------------|---------| 
| **Rules** | `~/.gemini/GEMINI.md` | `%USERPROFILE%\.gemini\GEMINI.md` |
| **Workflows** | `~/.gemini/antigravity/global_workflows/` | `%USERPROFILE%\.gemini\antigravity\global_workflows\` |
| **Skills** | `~/.gemini/antigravity/skills/` | `%USERPROFILE%\.gemini\antigravity\skills\` |

> ⚠️ Windows 路径为合理推测，需实测验证。

### Clone 缓存目录（内部，用户不感知）

| 平台 | 路径 |
|------|------|
| Linux | `~/.agent_dna/` |
| macOS | `~/Library/Application Support/AgentDNA/` |
| Windows | `%APPDATA%\AgentDNA\` |

### 远端仓库结构（v3 新格式）

```
my-agent-dna-repo/
├── rules/
│   └── GEMINI.md
├── workflows/
│   ├── introduce-project.md
│   └── skill-creator.md
└── skills/
    ├── commit/
    │   └── SKILL.md
    └── gen-play-script/
        ├── SKILL.md
        └── scripts/
```

### 同步流程

#### Pull（GitHub → 本机）

```
GitHub 远端仓库
        │ git clone / pull
        ▼
~/.agent_dna/（clone 缓存，用户不感知）
        │ deployToGlobal()
        ▼
~/.agent_dna/rules/GEMINI.md    →  ~/.gemini/GEMINI.md
~/.agent_dna/workflows/         →  ~/.gemini/antigravity/global_workflows/
~/.agent_dna/skills/            →  ~/.gemini/antigravity/skills/
```
**语义**：远端有本地无 → 新增；双方都有 → **本地被覆盖**。

#### 普通 Push（本机 → GitHub，保守合并）

```
~/.gemini/GEMINI.md                     →  ~/.agent_dna/rules/GEMINI.md
~/.gemini/antigravity/global_workflows/ →  ~/.agent_dna/workflows/
~/.gemini/antigravity/skills/           →  ~/.agent_dna/skills/
        │ git add . && commit && push
        ▼
        GitHub 远端仓库
```
**语义**：本机无、远端有 → **远端保留**（不删除）。

#### 本地强制覆盖（本机 → GitHub，以本机为权威）

① clone 远端 → ② 清空 `rules/` `workflows/` `skills/` → ③ 写入本机内容 → ④ commit & push

**语义**：本机无、远端有 → **从远端删除**。操作前弹窗确认。

---

## 边界情况与特殊处理 (Edge Cases)

### 1. 文件删除的同步逻辑

| 场景 | Pull (远端 → 本机) | 普通 Push (合并) | 强制 Push (覆盖) |
|------|-------------------|------------------|------------------|
| **本地删除了某 Rule/Skill** | 不适用（Pull 时远端为主） | 远端**不会**被删除 (保守保留) | 远端**会**被删除 (精确镜像) |
| **远端删除了某 Rule/Skill** | 本地**不会**被删除 (如远端删了某 Skill，本地该 Skill 依然保留) | 不适用（Push 时本地为主） | 不适用 |

> **核心思想**：为了防止意外丢失用户的代码和笔记，**普通同步操作绝不主动删除对方文件**，这是一种"加法"合并。只有明确的「强制覆盖」操作才会执行删除机制。

### 2. DocumentSet 的 Enabled 状态

用户在 UI 设置中可以**选择性地打开或关闭**某类文档的同步（例如：只同步 Rules，不同步 Skills）。

*   当 `enabled = false` 时：
    *   **Pull**：完全跳过该目录的部署。
    *   **普通 Push**：跳过将该目录收集到 `~/.agent_dna/` 的过程。此时即使 `~/.agent_dna/` 里有旧的远端文件，本次 Push 也不会改动它们。
    *   **强制 Push**：**🚨 危险点**！强制推送第一步是"清空 clone 目录"。如果某类别未启用，清空后又没收集进去，推送后远端的该类别会被**意外清空**。
    *   **处理方案**：在强制 Push 中，清空目录时**只清空 `enabled = true` 的目标目录**。未启用的目录保持 clone 下来的原样。

---

## 新增服务

### PathResolver
封装所有平台路径差异，上层代码不允许直接拼路径字符串：
```typescript
class PathResolver {
  static getCloneDir(): string;
  static getGlobalPaths(): { rules: string; workflows: string; skills: string };
  static resolve(path: string): string;  // 展开 ~ 和 %USERPROFILE%
}
```

### DocumentSyncService
负责 clone 目录 ↔ 全局路径的双向同步：
```typescript
class DocumentSyncService {
  // Pull: clone 目录 → 全局路径
  async deployToGlobal(cloneDir: string, docSet: DocumentSet): Promise<SyncResult>;
  // Push: 全局路径 → clone 目录（保守合并）
  async collectFromGlobal(cloneDir: string, docSet: DocumentSet): Promise<void>;
  // Push: 全局路径 → clone 目录（强制覆盖：先清空受管目录）
  async forceCollectFromGlobal(cloneDir: string, docSet: DocumentSet): Promise<void>;
  // 判断 clone 目录是否为 v3 仓库结构
  isV3Repo(cloneDir: string): boolean;
}
```

### DocumentSet 数据模型
```typescript
interface DocumentSet {
  rules:     { enabled: boolean; repoSubPath: string; globalPath: string; };
  workflows: { enabled: boolean; repoSubPath: string; globalPath: string; };
  skills:    { enabled: boolean; repoSubPath: string; globalPath: string; };
}
// repoSubPath: 仓库内的子路径，如 "rules/GEMINI.md"
// globalPath:  本机全局目标路径，由 PathResolver 提供
```

---

## UI 设计

### Setup Webview 新增勾选模块

```
┌─── AgentDNA v3 设置 ────────────────────────────────────┐
│  📦 仓库配置                                              │
│  Repository URL: [_______________________]                │
│  GitHub Token:   [_______________________]                │
│  [保存配置]                                               │
│                                                           │
│  ✅ 同步内容 (Sync Targets)                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [✓] Rules     ~/.gemini/GEMINI.md                  │   │
│  │ [✓] Workflows ~/.gemini/antigravity/global_workflows│   │
│  │ [✓] Skills    ~/.gemini/antigravity/skills/        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                           │
│  ⚠️ 危险区域   [删除所有配置]                              │
└───────────────────────────────────────────────────────────┘
```

### showMenu 菜单项变更

| 新增 / 修改 | 菜单文本 | 对应命令 |
|------------|---------|---------|
| 修改 | `$(sync) 同步全局文档 (Pull)` | `agentDna.sync` |
| 修改 | `$(cloud-upload) 发布全局文档 (Push)` | `agentDna.publish` |
| **新增** | `$(cloud-upload) 强制推送（以本地为准）` | `agentDna.forcePublish` |

---

## v2 → v3 迁移说明

**旧格式仓库**（根目录只有 `AGENT.md`）：
- 执行 Pull 时，插件检测到非 v3 结构，提示迁移而非报错
- 执行 Push 时，提示用户是否以本机内容重新初始化仓库结构

**package.json 变更**（`contributes.commands` 需同步更新）：
- 新增：`agentDna.forcePublish`（强制推送）
- 删除：`agentDna.syncToLocalProjects`（分发到各工作区）

---

## 实施 Checklist

### Phase 0：分析（已完成）
- [x] 阅读 v2 核心源文件（`syncRules.ts`, `publishRules.ts`, `GitService.ts` 等）
- [x] 确认 v3 关键设计：只管全局，不分发工作区
- [x] 确认两种 Push 语义、跨平台路径方案、新增服务设计

### Phase 1：数据层重构
- [x] 新增 `PathResolver.ts`，封装所有平台路径差异
- [x] 新增 `DocumentSyncService.ts`，实现双向同步 + 强制覆盖
- [x] 更新 `GitService.ts`：`hasAgentMd()` → `validateRepoStructure()`
- [x] 删除 `LinkService.ts`
- [x] 删除 `GitIgnoreService.ts`
- [x] 删除 `ProjectRegistry.ts`

### Phase 2：命令层重写
- [x] 重载 `syncRules.ts` → Pull 后部署到全局路径
- [x] 重载 `publishRules.ts` → 从全局路径收集后 Push（支持两种模式）
- [x] 新增 `forcePublish.ts` → 强制覆盖推送命令
- [x] 删除 `syncToLocalProjects.ts`
- [x] 更新 `extension.ts`：移除已删除命令，注册 `agentDna.forcePublish`
- [x] 更新 `package.json`：同步 `contributes.commands` 变更

### Phase 3：UI 升级
- [x] 升级 `setupWebview.ts`：新增 DocSet 勾选开关（Rules / Workflows / Skills）
- [x] 更新 `showMenu.ts`：新增「强制推送」菜单项，菜单文本升级为多文档语义

### Phase 4：兼容与文档
- [ ] 完善 README，说明 v3 仓库目录结构
- ✅ ~~实现旧格式仓库兼容检测与迁移提示（Pull 和 Push 均需处理）~~

### Phase 5：测试与验收
- [ ] Pull 流程：三类文档分别验证
- [ ] 普通 Push 流程：验证合并语义（远端独有不丢失）
- [ ] 本地强制覆盖：验证远端独有内容被删除
- [ ] 旧格式仓库兼容性：验证不 crash，正确提示迁移
- [ ] Windows 路径验证：确认 `%USERPROFILE%\.gemini\` 路径实际生效
