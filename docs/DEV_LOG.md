# DEV_LOG.md - 开发日志

## 1. 关键变更

- **[2026-02-25]** 更新 `BUILD_GUIDE.md` 打包流程为已验证可复现版本：
    - 将原先的 `vsce package` 通用描述替换为项目实测可用命令（`npx @vscode/vsce package --no-dependencies --no-yarn`）。
    - 增补 `Extension entrypoint(s) missing: extension/dist/extension.js` 的排查说明，明确检查项：编译产物、打包参数、`.vscodeignore`。
    - **Action**: Revised packaging documentation with a verified VSIX build workflow.
    - **Details**: Updated Section 5 in `docs/BUILD_GUIDE.md` and added troubleshooting steps for missing entrypoint errors.
    - **Execution Record**: `npm run compile && npm_config_cache=/tmp/.npm-cache npx @vscode/vsce package --no-dependencies --no-yarn -o agent-dna-0.3.0-build-verify.vsix`

- **[2026-02-25]** 按 `BUILD_GUIDE.md` 完成插件打包（VSIX）：
    - 按文档执行 `npm install`、`npm run compile`、`vsce package` 流程。
    - 首次打包报错：`Extension entrypoint(s) missing: extension/dist/extension.js`。
    - 通过清理打包路径策略完成打包：临时移开 `.vscodeignore`，使用 `vsce package --no-dependencies --no-yarn` 成功输出 VSIX，随后恢复 `.vscodeignore`。
    - **Action**: Packaged extension artifact based on `docs/BUILD_GUIDE.md`.
    - **Details**: Resolved VSCE entrypoint packaging issue and generated a valid VSIX without persisting temporary packaging config changes.
    - **Execution Record**: `mv .vscodeignore .vscodeignore.bak && npm_config_cache=/tmp/.npm-cache npx @vscode/vsce package --no-dependencies --no-yarn -o agent-dna-0.3.0-build-20260225.vsix; rc=$?; mv .vscodeignore.bak .vscodeignore; exit $rc`

- **[2026-02-23]** 重构 AgentDNA v3 架构：
    - 引入 `DocumentSyncService` 核心同步逻辑，支持多文档类型（Rules, Workflows, Skills）。
    - 引入 `PathResolver` 统一跨平台路径管理。
    - 移除 v2 时代的冗余服务（`LinkService`, `GitIgnoreService`, `ProjectRegistry`）。
    - 重载 `syncRules`, `publishRules` 状态机以支持全局同步模式。
    - 新增 `forcePublish` 命令，支持强制覆盖远程仓库。
    - 更新 `README.md` 和 `PROJECT_MAP.md` 以匹配 v3 设计。

- **[2026-02-23]** 移除 Workflows 相关功能与配置：
    - 在 `package.json` 中移除 `agentDna.syncWorkflows` 配置项。
    - 更新 `PathResolver.ts` 移除 `workflows` 路径解析。
    - 更新 `DocumentSyncService.ts` 移除 Workflows 同步逻辑。
    - 更新 `setupWebview.ts` 移除设置界面中的 Workflows 选项。
    - 更新 `PROJECT_MAP.md` 移除相关描述。
    - （注：根据用户指令，未删除本地全局 Workflows 目录）

- **Action**: Modified play command generation for enhanced video naming.
- **Details**: Updated logic in play command generation (likely within a script or skill) to ensure video recordings follow the `{CheckpointName}_{Timestamp}` format.
- **Action**: Completed implementation of AgentDNA v3.2 multi-format synchronization architecture.
- **Details**: Implemented `FormatAdapter`, `DocumentSyncService`, `PathResolver`, `GitService`, and the `ControlPanelProvider` (Webview UI) to support bidirectional sync between local repository (OSS format) and multiple AI tools (Antigravity/Gemini and Claude Code). Refactored repository to Open Source Standard.
- **Action**: Restored Control Panel UI and fixed build errors.
- **Details**: 
  - Reverted `package.json` to move Control Panel from Sidebar back to Editor Tab.
  - Implemented `ControlPanelWebview.ts` with premium glassmorphism aesthetics and "Inter" font.
  - Fixed 7 compilation errors by bridging legacy command logic to v3.2 services in `DocumentSyncService.ts`.
  - Removed obsolete `ControlPanelProvider.ts`.
- **Execution Record**: `rm src/webview/controlPanel/ControlPanelProvider.ts && npm run compile` (Build Success).

- **Tools Comparison Document**: Created `docs/tools_comparison.md`, fixed Antigravity/Claude structures, and added comparison for Agent definition files (AGENT.md, GEMINI.md, CLAUDE.md) based on Open Source Standard (Official), Antigravity, and Claude Code.

- **[2026-02-23] v3.1 Multi-Format Sync 设计文档**：创建 `docs/plan_v3_multi_format_sync.md`，设计了以 Open Source Standard 为统一存储格式的 Hub-and-Spoke 多工具同步架构。
- **[2026-02-23] v3.2 最终实现阶段完成**：
    - **仓库重构**：将 `AGENT.md` 和 `skills/` 移回根目录，应用 Open Source Standard 标准。
    - **FormatAdapter 实现**：支持 Antigravity 和 Claude Code 的双向转换与路径映射。
    - **控制面板上线**：全新的侧边栏 Webview 仪表盘，支持分层同步（本地部署、工具中转、保存更改、云端同步）。
    - **服务集成**：升级 `DocumentSyncService` 和 `PathResolver`，支持静默 Git Commit。

- **[2026-02-23] v3.4.1 脚本修复与 UI 对齐**：
    - 修复了 Webview 内因按钮移除导致的 JS 脚本崩溃问题，恢复了推送/拉取按钮的响应。
    - 统一了所有操作按钮的宽度（100px）并实现了全区块右对齐布局。
    - 进一步优化了各功能区的 Microcopy 排版，视觉更趋一致。

- **[2026-02-23] v3.3 UI 深度重构**：
    - 全面实现“功能性工业简约风 (Functional Industrial Minimalism)”。
    - 将管理面板划分为 5 个标准区块：工具选择、同步、远程仓库、仓库配置、危险区域。
    - 引入 GitHub 风格的极简排版与 Microcopy，大幅提升交互“确定感”。
    - 完成全界面汉化，并优化了配置项的折叠与展示逻辑。

- **[2026-02-24] v3.5 同步逻辑简化与 UI 精炼**：
    - **逻辑整合**：在 `DocumentSyncService.ts` 中实现 `syncLocalToRemote` 和 `syncRemoteToLocal` 编排，简化外部调用。
    - **UI 布局重组**：精简为“同步与工具”和“仓库配置”两个主区块。
    - **按钮堆叠**：将同步按钮垂直放置在选择行右侧，实现上下直接对应。
    - **配置折叠**：整合“仓库配置”与“危险区域”为可折叠项。
    - **清理废弃代码**：删除 `src/commands` 下 4 个旧版同步指令文件，优化 `extension.ts`。
    - **界面优化**：移除 DNA 表情，恢复 Functional Industrial Minimalism 原始风格。

## 2. 重要命令 (Success Commands)

- **[2026-02-23]** `git commit`: refactor(core): 重构 AgentDNA v3 架构，实现多文档同步与路径解析 / refactor AgentDNA v3 architecture for multi-document sync and path resolution
- **[2026-02-24]** `git commit`: refactor(ui): 简化同步操作为两键模式并重塑工业风（界面待后续美化） / simplify sync to 2-button layout and restore industrial style (ui refining pending)
- **[2026-02-24]** `git commit`: chore(release): 升级版本至 0.3.0 并更新 CHANGELOG / bump version to 0.3.0 and update CHANGELOG
- **[2026-02-25]** `git commit`: feat(sync): 增加Codex支持 / add codex support
- **[2026-02-25]** `git commit`: docs(build): 更新打包流程与排错说明 / refine VSIX packaging docs
