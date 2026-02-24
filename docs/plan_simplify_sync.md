# 实施计划 - 简化同步逻辑与 UI

本计划旨在简化 AgentDNA 的操作流程，将原本分层的“工具-仓库”和“仓库-云端”操作整合为直观的“本地到云端”和“云端到本地”两个核心操作，并优化 UI 布局。

## 用户审查确认 (User Review Required)

> [!IMPORTANT]
> - **操作整合**：“本地到云端”将自动执行“从工具保存到仓库”和“从仓库推送到云端”；“从云端拉取”将自动执行“从云端下载到仓库”和“从仓库部署到所有工具”。
> - **UI 变更**：删除原有的“同步”和“远程仓库”区块，将操作按钮移至“源 AI 工具”选择框右侧。

## 拟议变更 (Proposed Changes)

### 核心服务层 (Core Services)

#### [MODIFY] [DocumentSyncService.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/services/DocumentSyncService.ts)

- 新增 `syncLocalToRemote(repoRoot: string, source: 'antigravity' | 'claude', force: boolean)`：
    - **逻辑说明**：
        1. 调用 `importFromTool(repoRoot, source)`：将指定工具（如 Antigravity）中的最新技能和规则文件提取到本地开发仓库。
        2. 调用 `pushToRemote(repoRoot, cloneDir, force)`：将本地仓库的改动同步到 Git 缓存，执行 git commit，并推送至 GitHub 远端。
    - **目的**：实现“本地工具改动 -> 仓库 -> 远端”的一键备份。

- 新增 `syncRemoteToLocal(repoRoot: string, targets: ('antigravity' | 'claude')[])`：
    - **逻辑说明**：
        1. 调用 `pullFromRemote(repoRoot, cloneDir)`：从 GitHub 远端拉取最新更新到 Git 缓存，并同步回本地开发仓库。
        2. 调用 `deployToTools(repoRoot, targets)`：将更新后的本地仓库内容分发到所有勾选的目标工具（Antigravity 和/或 Claude）。
    - **目的**：实现“远端更新 -> 仓库 -> 本地多个工具”的一键分发。

---

### UI 层 (UI Layer)

#### [MODIFY] [ControlPanelWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/webview/controlPanel/ControlPanelWebview.ts)

- 修改 `_getHtmlForWebview`：
    - **移除 Emoji**：从 `Subhead-heading` 中移除 🧬 表情。
    - **恢复设计风格**：
        - 恢复 `:root` 中的原始颜色变量（使用 GitHub 工业风配色）。
        - 恢复 `.btn` 的原始背景和 hover 逻辑，不再强制跟随 VSCode 按钮主题（除非用户指示）。
    - **保留布局**：保持之前实现的按钮上下堆叠和折叠配置区块逻辑。
- 更新消息处理器以调用新的服务方法。

#### [MODIFY] [showMenu.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/commands/showMenu.ts)

- 简化 QuickPick 菜单项，仅保留“同步到云端”和“同步到本地”核心操作。

---

## 验证计划 (Verification Plan)

### 自动化测试
- 运行 `npm run compile` 确保代码无误。

### 手动验证
1. 打开控制面板，检查按钮是否在下拉框右侧。
2. 点击“同步到云端”：观察是否成功从源工具提取并推送到云端。
3. 点击“同步到本地”：观察是否从云端拉取并分发到所有勾选的目标工具。
4. 验证 QuickPick 菜单的功能一致性。

## 任务清单 (Checklist)

- ✅ ~~修改 `DocumentSyncService.ts` 整合逻辑~~
- [ ] 修改 `ControlPanelWebview.ts` 简化 UI
- [ ] 修改 `showMenu.ts` 同步菜单逻辑
- [ ] 运行编译验证
- [ ] 手动端到端测试
