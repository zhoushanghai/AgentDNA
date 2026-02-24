# AgentDNA UI Redesign Plan (v3.3) - 功能性工业简约风

按照“功能性工业简约风 (Functional Industrial Minimalism)”对管理面板进行全面重构，遵循 GitHub 的视觉层级、卡片式结构和排版导向设计逻辑。

## 核心设计准则
- **极简视觉层级**：黑白灰主色调，仅在状态和警示（Danger Zone）处使用功能性色彩。
- **结构化布局**：每个功能区块使用 `Box` 模型包裹，严谨的间距划分。
- **排版导向**：清晰的标题梯度配合灰色辅助说明文字（Microcopy）。
- **确定性交互**：按钮和复选框样式回归原生感，强调“点击即生效”。

## 拟定修改内容

### [Component] Control Panel Webview

#### [MODIFY] [ControlPanelWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/webview/controlPanel/ControlPanelWebview.ts)
- **HTML 结构重组**：
  - **第 1 部分：工具选择 (Tool Selection)**
    - 源工具选择（Antigravity/Claude 下拉框）
    - 部署目标选择（Antigravity/Claude 复选框）
  - **第 2 部分：同步 (Synchronization)**
    - 部署到工具 (Deploy to Tools) -> [同步到工具]
    - 从源保存 (Save from Source) -> [保存更改]
    - 工具中转 (Tool Transfer) -> [运行中转]
  - **第 3 部分：远程仓库 (Remote Repository)**
    - 拉取更改 (Pull Changes) -> [拉取]
    - 推送更改 (Push Changes) -> 复选框 [强制] + [推送]
  - **第 4 部分：仓库配置 (Repository Configuration)**
    - Git 远程 URL 输入框
    - PAT Token 输入框
    - [保存设置] 按钮
  - **第 5 部分：危险区域 (Danger Zone)**
    - 软重置配置 (Soft Reset Configuration) -> [重置缓存]
- **CSS 优化**：
  - 使用更正式的 GitHub 风格 Box 模型。
  - 增加对 `danger-zone` 的特殊处理（暗红色文字与边框）。
  - 优化辅助文本（Subtext/Microcopy）的间距和对比度。
- **逻辑绑定**：
  - 确保所有新按钮正确绑定到原有的后端命令（`deploy`, `import`, `transfer`, `push`, `pull`, `saveSettings`, `pull` (for reset)）。

## 实施 Checklist
- [ ] 按照 5 段式结构重写 `_getHtmlForWebview`
- [ ] 引入 GitHub 风格的工业级 CSS 样式表
- [ ] 汉化所有交互文本及 subtext 描述
- [ ] 绑定按钮点击事件到后端交互逻辑
- [ ] 验证界面层级和色彩符合“极简主义”原则

## 验证计划
### 自动化验证
- 执行 `npm run compile` 确保逻辑代码无错误。

### 手动验证
- 检查 5 个 Section 是否显示完整且排版有序。
- 确认“工具选择”中的复选状态和下拉选择正确传递给后端。
- 测试“同步”区块中的三个核心功能按钮。
- 确认“远程仓库”中的推送操作能正确读取“强制”复选框状态。
- 验证“危险区域”按钮使用了暗红色视觉警示。
- 确保所有 Subtext 描述准确无误且易于阅读。
