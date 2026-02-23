# AgentDNA

> Sync your AI agent's DNA across projects - Rules, Workflows, and Skills

AgentDNA 是一个 VS Code 插件，用于统一管理和同步 AI 编程工具（如 VS Code, Cursor, Antigravity）的三类全局文档：**Rules (GEMINI.md)**、**Workflows** 和 **Skills**。

## 0.3.0 (v3) 核心变更

- **多文档管理**：支持 Rules、Workflows 和 Skills 的统一同步。
- **全局同步模式**：不再分发到各个工作区，而是直接管理本机的全局配置目录（`~/.gemini/`）。
- **强制覆盖模式**：新增「强制推送」功能，允许以本机内容为权威覆盖远程仓库。
- **跨平台路径解析**：自动适配 Windows、macOS 和 Linux 的全局配置路径。

## 核心功能

1. **Pull (Sync from Global)**: 从远程仓库拉取最新的文档并部署到本机全局目录。
2. **Push (Sync to Global)**: 将本机全局目录的修改合并推送到远程仓库（保守合并，不删除远程独有文件）。
3. **Force Push (Overwrite Remote)**: 以本机内容为准，强制覆盖远程仓库（会删除远程独有文件）。

## 使用方法

1. **快速设置**:
   - 按 `Ctrl+Shift+P`，输入 `AgentDNA: Settings` 打开设置界面。
   - 配置 GitHub 仓库地址和 Personal Access Token（私有仓库推荐使用）。
   - 在 **Sync Targets** 中勾选需要同步的内容（Rules / Workflows / Skills）。

2. **日常使用**:
   - **同步**：运行 `AgentDNA: Pull (Sync from Global)`。
   - **发布**：运行 `AgentDNA: Push (Sync to Global)`。
   - **强制更新远程**：运行 `AgentDNA: Force Push (Overwrite Remote)`。

## 文档存储位置 (Global Paths)

| 类型 | 路径 (Linux / macOS) | 路径 (Windows) |
|------|-----------------------|----------------|
| **Rules** | `~/.gemini/GEMINI.md` | `%USERPROFILE%\.gemini\GEMINI.md` |
| **Workflows** | `~/.gemini/antigravity/global_workflows/` | `%USERPROFILE%\.gemini\antigravity\global_workflows\` |
| **Skills** | `~/.gemini/antigravity/skills/` | `%USERPROFILE%\.gemini\antigravity\skills\` |

## License

MIT
