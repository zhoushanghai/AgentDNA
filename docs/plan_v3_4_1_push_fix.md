# AgentDNA Push Fix & UI Alignment Plan (v3.4.1)

修复 Webview 脚本运行中断导致的按钮点击失效问题，并进一步统一按钮布局。

## 问题诊断
- **脚本崩溃**：在移除“工具中转”按钮后，Webview 内的 JavaScript 仍然试图绑定 `btnTransfer` 的点击事件，导致 `TypeError: Cannot read properties of null`，中断了后面所有按钮（如推送、拉取）的事件注册。
- **按钮布局不一**：部分按钮在 `Box-row` 内靠右对齐，部分按钮在 `Box-body` 内靠左对齐。

## 修改内容

### [Component] Control Panel Webview

#### [MODIFY] [ControlPanelWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/webview/controlPanel/ControlPanelWebview.ts)
- **修复脚本**：删除 `_getHtmlForWebview` 中关于 `btnTransfer` 的事件绑定代码。
- **统一布局**：
  - 将 Section 4（仓库配置）和 Section 5（危险区域）的按钮统一放入 `Box-row` 或类似的 Flex 容器中，使其与 Section 2/3 的对齐方式保持一致（靠右对齐，垂直居中）。
  - 确保所有按钮使用统一的 `btn` class。

## 验证计划
### 自动化验证
- 执行 `npm run compile` 确认编译无误。

### 手动验证
1.  **打开控制面板**：确认不再有静默的 JS 错误（表现为所有按钮点击都有转圈或反馈）。
2.  **点击推送**：确认弹出“正在推送...”进度条。
3.  **UI 审查**：确认所有按钮都在各区块的右侧整齐排列，且宽度一致（100px）。
