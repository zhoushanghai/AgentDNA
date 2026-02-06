# AgentDNA - VS Code 插件项目计划书 (精简版)

> *Sync your AI agent's DNA across projects*

## 项目目标

实现一个最简 MVP 版本的 VS Code 插件：
- 从 GitHub 仓库下载 AI 规则文件
- 存储到固定位置（如 `~/.agent_dna/`）
- 在当前项目目录创建软链接

```
┌─────────────────┐     下载      ┌─────────────────┐
│  GitHub 仓库    │  ─────────►  │ ~/.agent_dna/   │
│  (AGENT.md)     │              │  (本地缓存)      │
└─────────────────┘              └────────┬────────┘
                                          │ 软链接
                                          ▼
                                 ┌─────────────────┐
                                 │ 当前项目/       │
                                 │      AGENT.md   │
                                 └─────────────────┘
```

**规则文件格式**：统一使用 `AGENT.md`，放在项目根目录

**兼容性**：VS Code、Cursor、Antigravity 均可使用

**GitHub 仓库结构**：
```
my-rules-repo/
└── AGENT.md    # 规则文件直接放根目录
```

**冲突处理**：如果项目已存在 `AGENT.md`，弹窗提示用户确认是否覆盖

---

## MVP 功能 (Phase 1)

| 功能 | 描述 |
|------|------|
| 配置 GitHub 仓库 URL | 设置规则文件来源 |
| 下载规则 | 从 GitHub 克隆/更新到本地固定位置 |
| 创建软链接 | 点击按钮，在当前工作区创建软链接 |

---

## GitHub 私有仓库访问

### 方案对比

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| **复用系统 Git 配置** | 使用已配置的 SSH key 或 credential helper | MVP 推荐 |
| Personal Access Token | 用户在插件设置中配置 Token | 需要额外认证 |
| VS Code GitHub API | 使用 VS Code 内置 GitHub 认证弹窗 | 后续增强 |

### MVP 实现方案（复用系统 Git）

```typescript
import simpleGit from 'simple-git';
const git = simpleGit();

// 直接调用 git clone，复用用户已配置的 SSH key / credential manager
// 私有仓库自动生效（前提：用户已配置好 Git 认证）
await git.clone('git@github.com:user/private-rules.git', RULES_DIR);
```

**前提条件**：用户需要先配置好以下任一方式
- SSH Key：`~/.ssh/id_rsa` 或 `~/.ssh/id_ed25519`
- Git Credential Manager：`git config --global credential.helper store`

### 后续增强：VS Code 原生认证

```typescript
// 使用 VS Code 的 GitHub 认证 API（弹窗授权）
const session = await vscode.authentication.getSession('github', ['repo'], { 
  createIfNone: true 
});
const token = session.accessToken;
// 使用 token 克隆私有仓库
```

---

## 技术实现

### 目录结构 (精简版)

```
agent-dna/
├── src/
│   ├── extension.ts          # 插件入口
│   ├── services/
│   │   ├── GitService.ts     # GitHub 下载
│   │   └── LinkService.ts    # 软链接管理
│   └── commands/
│       └── syncRules.ts      # 同步命令
├── package.json
└── tsconfig.json
```

### 核心代码逻辑

```typescript
// 1. 从 GitHub 克隆到固定位置
const RULES_DIR = path.join(os.homedir(), '.agent_dna');
await git.clone(repoUrl, RULES_DIR);

// 2. 在当前项目根目录创建 AGENT.md 软链接
const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
const targetPath = path.join(workspaceRoot, 'AGENT.md');
await fs.symlink(path.join(RULES_DIR, 'AGENT.md'), targetPath);
```

### 用户交互

1. **命令面板**：`Ctrl+Shift+P` → "AgentDNA: Sync"
2. **状态栏按钮**：点击触发同步
3. **设置项**：配置 GitHub 仓库 URL


---

## package.json 配置

```json
{
  "name": "agent-dna",
  "displayName": "AgentDNA",
  "description": "Sync your AI agent's DNA across projects",
  "version": "0.1.0",
  "engines": { "vscode": "^1.85.0" },
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [{
      "command": "agentDna.sync",
      "title": "AgentDNA: Sync"
    }],
    "configuration": {
      "title": "AgentDNA",
      "properties": {
        "agentDna.repoUrl": {
          "type": "string",
          "default": "",
          "description": "GitHub repository URL for agent rules"
        }
      }
    }
  },
  "dependencies": {
    "simple-git": "^3.x"
  }
}
```

---

## 验证步骤

1. 在 VS Code 中加载插件
2. 设置 `agentDna.repoUrl` 为你的 GitHub 仓库
3. 执行命令 `AgentDNA: Sync`
4. 验证 `~/.agent_dna/` 目录已创建并包含 `AGENT.md`
5. 验证当前项目根目录 `AGENT.md` 是软链接

---

## 发布到插件市场

### 1. 准备工作

**创建发布者账号**：
1. 注册 [Azure DevOps](https://dev.azure.com/) 账号
2. 在 [VS Code Marketplace 管理页面](https://marketplace.visualstudio.com/manage) 创建 Publisher
3. 获取 Personal Access Token (PAT)，权限选择 **Marketplace > Manage**

**补充 package.json 字段**：
```json
{
  "publisher": "your-publisher-id",
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/agent-dna"
  },
  "icon": "images/icon.png",
  "license": "MIT"
}
```

**准备文件**：
- `README.md` - 插件介绍页面
- `images/icon.png` - 128x128 PNG 图标
- `CHANGELOG.md` - 版本更新日志（可选）

### 2. 发布命令

```bash
npm install -g @vscode/vsce   # 安装发布工具
vsce login your-publisher-id   # 登录（输入 PAT）
vsce package                   # 打包成 .vsix 文件（可选，用于本地测试）
vsce publish                   # 发布到市场
```

### 3. 更新版本

```bash
vsce publish patch   # 0.1.0 → 0.1.1
vsce publish minor   # 0.1.0 → 0.2.0
vsce publish major   # 0.1.0 → 1.0.0
```

---

## 后续扩展 (Phase 2+)

- [ ] GUI 面板选择要链接的规则
- [ ] 支持多个规则仓库
- [ ] 规则内容预览
- [ ] 侧边栏视图
