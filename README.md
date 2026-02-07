# AgentDNA

> Sync your AI agent's DNA across projects

AgentDNA 是一个 VS Code 插件，用于从 GitHub 仓库同步 `AGENT.md` 规则文件到你的项目中。

## 0.2.0 新特性

- **基于复制的同步**：不再使用软链接，而是直接复制文件，确保每个项目的规则文件独立且稳定。
- **发布功能**：支持将本地修改的 `AGENT.md` 推送到远程仓库（需配置 Git 权限）。
- **多项目同步**：更新规则后，可选择一键同步到所有已注册的本地项目。
- **快速设置**：新的设置界面，方便配置仓库地址和 Token。

## 核心功能

1. **Pull (Sync)**: 从远程仓库拉取最新的 `AGENT.md` 到当前项目。
2. **Push (Publish)**: 将当前项目的 `AGENT.md` 修改推送到远程仓库。
3. **Sync Local**: 将最新的 `AGENT.md` 同步到本机其他使用 AgentDNA 的项目。

## 使用方法

1. **快速设置**:
   - 按 `Ctrl+Shift+P`，输入 `AgentDNA: Quick Setup` 打开设置页面。
   - 配置 GitHub 仓库地址（支持 HTTPS 和 SSH）和 Personal Access Token (可选，私有仓库需要)。

2. **日常使用**:
   - **同步规则**：运行 `AgentDNA: Sync (Pull)` 或点击状态栏图标。
   - **发布更新**：运行 `AgentDNA: Publish (Push)`。
   - **同步到其他项目**：发布后根据提示，或手动运行 `AgentDNA: Sync Local Projects`。

## 配置项

| 配置 | 说明 | 示例 |
|------|------|------|
| `agentDna.config` | 存储仓库地址和 Token 的内部配置（通过 Quick Setup 修改） | - |
| `agentDna.includeInGit` | 是否将 AGENT.md 加入版本控制 (默认 false，会自动添加到 .gitignore) | `false` |

## 规则存储位置

为了支持多项目管理，AgentDNA 会在本地维护一个主副本（Master Copy），路径如下：

- **Windows**: `%APPDATA%\AgentDNA`
- **macOS**: `~/Library/Application Support/AgentDNA`
- **Linux**: `~/.agent_dna`

## License

MIT
