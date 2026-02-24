# AgentDNA Sync Fix & UI Polish Plan (v3.4)

解决推送/拉取不同步的问题，并统一界面按钮样式。

## 核心修复逻辑
- **推送 (Push)**：在执行 Git Push 之前，先将当前工作区（repoRoot）的文件同步到 Git 缓存区（cloneDir）。
- **拉取 (Pull)**：在执行 Git Pull 之后，将 Git 缓存区（cloneDir）的文件同步回当前工作区（repoRoot）。
- **UI 统一**：通过 CSS 为所有 `.btn` 元素设置统一的 `min-width`，确保视觉整齐。

## 修改内容

### [Component] DocumentSyncService

#### [MODIFY] [DocumentSyncService.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/services/DocumentSyncService.ts)
- 新增 `syncProjectToCache(repoRoot, cloneDir)`：将 `repoRoot` 的 `AGENT.md` 和 `skills/` 拷贝到 `cloneDir`。
- 新增 `syncCacheToProject(cloneDir, repoRoot)`：将 `cloneDir` 的内容拷贝回 `repoRoot`。
- 修改 `pushToRemote`：在 Git 操作前调用 `syncProjectToCache`。
- 修改 `pullFromRemote`：在 Git 操作后调用 `syncCacheToProject`。

### [Component] Control Panel Webview

#### [MODIFY] [ControlPanelWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/webview/controlPanel/ControlPanelWebview.ts)
- **CSS 优化**：
  - 为 `.btn` 添加 `width: 100px;` 或 `min-width: 100px;` 确保所有按钮长度一致。
  - 调整布局间距，确保按钮在行内对齐美观。
- **后端参数传递**：
  - 推送和拉取时需要获取当前工作区的 `repoRoot`。

## 验证计划
### 自动化验证
- 执行 `npm run compile` 验证代码正确性。

### 手动验证
1.  **修改文件**：在本地 `AGENT.md` 中添加测试文字。
2.  **点击推送**：确认控制台/日志显示文件已拷贝并成功 Push 到 GitHub。
3.  **验证远程**：打开浏览器确认 GitHub 仓库内容已更新。
4.  **点击拉取**：确认远程变更成功同步回 VS Code 工作区。
5.  **UI 检查**：观察“同步”、“远程仓库”和“设置”区的按钮是否宽度一致且排列整齐。
