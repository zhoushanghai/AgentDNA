# AgentDNA UI Refinement Plan (v3.2)

Refine the Control Panel layout to strictly match the user's functional requirements and ASCII mockup while maintaining the "Functional Industrial Minimalism" style. **Focus on high information density (compactness) and full Chinese (中文) language support.**

## Proposed Changes

### [Component] Control Panel Webview

#### [MODIFY] [ControlPanelWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/webview/controlPanel/ControlPanelWebview.ts)
- **Backend**:
  - Update `_update()` to fetch available skills from `~/.gemini/antigravity/skills`.
  - Retrieve "Last Sync" status from `context.globalState`.
  - Pass the following metadata to the HTML generator: `repoUrl`, `token`, `skills[]`, `lastSync`.
- **Frontend (HTML/JS)**:
  - **Language**: Translate all UI strings to Chinese (中文).
  - **Section: Sync Targets (同步目标)**: Add checkboxes for Antigravity and Claude with their absolute paths displayed.
  - **Section: Sync Content (同步内容)**: 
    - Add "Agent 文件 (AGENT.md)" checkbox.
    - Add "Skills" group with sub-checkboxes for each listed skill.
  - **Section: Operations (操作)**:
    - Add "Pull 来源" dropdown.
    - Layout buttons: `[Push →]`, `[← Pull]`, `[Force Push ⚠]`.
    - Add status line for "上次同步".
  - **Section: Configuration (配置)**: Move to a `<details>` collapsible block, default closed.
  - **CSS**: Refine styling for **compactness**:
    - Smaller font sizes (12px for notes, 13px for body).
    - Reduced padding in Boxes and Rows.
    - Tighter margins between sections.

## Checklist
- [ ] Update backend to fetch skill list and sync status
- [ ] Implement Sync Targets section (paths + checkboxes)
- [ ] Implement Sync Content section (nested skill checkboxes)
- [ ] Implement Operations section (button row + status)
- [ ] Implement Collapsible Configuration
- [ ] Verify build and functionality

## Verification Plan

### Automated Tests
- Run `npm run compile` to ensure no TypeScript regressions.

### Manual Verification
1.  Open the Control Panel via the Status Bar or command palette.
2.  Verify the layout matches the ASCII mockup:
    - Check if the "Push Targets" section shows correct paths.
    - Check if "Sync Content" dynamically lists the global skills.
    - Check if "Configuration" is collapsible and default closed.
3.  Test "Push" and "Pull" buttons to verify message passing still works.
4.  Confirm the "Last Sync" status updates after a successful operation (persisting in `globalState`).
