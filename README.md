# AgentDNA

> Sync your AI agent's DNA across projects

AgentDNA 是一个 VS Code 插件，用于从 GitHub 仓库同步 `AGENT.md` 规则文件到你的项目中。

## 功能

- 从 GitHub 仓库下载 `AGENT.md` 规则文件
- 在项目根目录创建软链接，一处更新，处处生效
- 支持 VS Code、Cursor、Antigravity 等编辑器

## 使用方法

1. 打开设置，配置 `agentDna.repoUrl` 为你的 GitHub 仓库地址
2. 按 `Ctrl+Shift+P`，输入 `AgentDNA: Sync`
3. 或点击状态栏的 `$(sync) AgentDNA` 按钮

## 配置项

| 配置 | 说明 | 示例 |
|------|------|------|
| `agentDna.repoUrl` | GitHub 仓库地址 | `git@github.com:user/rules.git` |

## 前提条件

确保你的 Git 已配置好认证方式：
- SSH Key：`~/.ssh/id_rsa` 或 `~/.ssh/id_ed25519`
- 或 Git Credential Manager

## 规则存储位置

为了支持多平台，`AGENT.md` 会被存储在不同系统的标准配置目录下：

- **Windows**: `%APPDATA%\AgentDNA`
- **macOS**: `~/Library/Application Support/AgentDNA`
- **Linux**: `~/.agent_dna`

## License

MIT
