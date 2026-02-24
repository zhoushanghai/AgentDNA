import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentSyncService } from '../../services/DocumentSyncService';
import { PathResolver } from '../../services/PathResolver';
import { TokenManager } from '../../services/TokenManager';

export class ControlPanelWebview {
    public static currentPanel: ControlPanelWebview | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.context = context;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                try {
                    switch (message.command) {
                        case 'syncLocalToRemote':
                            await this.handleSyncLocalToRemote(message.source, message.force);
                            break;
                        case 'syncRemoteToLocal':
                            await this.handleSyncRemoteToLocal(message.targets);
                            break;
                        case 'saveSettings':
                            await this.handleSaveSettings(message.repoUrl, message.token, message.lastSource);
                            break;
                        case 'updateLastSync':
                            await this.context.globalState.update('agentDna.lastSync', message.time);
                            this._update();
                            break;
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`操作失败: ${error}`);
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ControlPanelWebview.currentPanel) {
            ControlPanelWebview.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'agentDnaControlPanel',
            'AgentDNA 控制面板',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        ControlPanelWebview.currentPanel = new ControlPanelWebview(panel, context.extensionUri, context);
    }

    private async handleSyncLocalToRemote(source: 'antigravity' | 'claude', force: boolean) {
        try {
            const docSyncService = new DocumentSyncService();
            const cloneDir = PathResolver.getCloneDir();
            const repoRoot = cloneDir;
            const token = await TokenManager.getInstance().getToken();

            await this.context.globalState.update('agentDna.lastSource', source);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `正在将本地 ${source} 更改同步到云端...`,
                cancellable: false
            }, async () => {
                const result = await docSyncService.syncLocalToRemote(repoRoot, cloneDir, source, force, token);
                if (result.success) {
                    const now = new Date().toLocaleString();
                    await this.context.globalState.update('agentDna.lastSync', now);
                    vscode.window.showInformationMessage(result.message);
                    this._update();
                } else {
                    vscode.window.showErrorMessage(result.message);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`同步失败: ${error}`);
        }
    }

    private async handleSyncRemoteToLocal(targets: ('antigravity' | 'claude')[]) {
        const docSyncService = new DocumentSyncService();
        const cloneDir = PathResolver.getCloneDir();
        const repoRoot = cloneDir;
        const token = await TokenManager.getInstance().getToken();

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "正在将云端更新同步到本地工具...",
                cancellable: false
            }, async () => {
                const result = await docSyncService.syncRemoteToLocal(repoRoot, cloneDir, targets, token);
                if (result.success) {
                    const now = new Date().toLocaleString();
                    await this.context.globalState.update('agentDna.lastSync', now);
                    vscode.window.showInformationMessage(result.message);
                    this._update();
                } else {
                    vscode.window.showErrorMessage(result.message);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`同步失败: ${error}`);
        }
    }

    private async handleSaveSettings(repoUrl: string, token: string, lastSource?: string) {
        const config = vscode.workspace.getConfiguration('agentDna');
        await config.update('repoUrl', repoUrl, vscode.ConfigurationTarget.Global);

        if (lastSource) {
            await this.context.globalState.update('agentDna.lastSource', lastSource);
        }

        if (token) {
            await TokenManager.getInstance().setToken(token);
        }

        vscode.window.showInformationMessage('配置已保存');
    }

    public dispose() {
        ControlPanelWebview.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const config = vscode.workspace.getConfiguration('agentDna');
        const repoUrl = config.get<string>('repoUrl') || '';
        const token = await TokenManager.getInstance().getToken();
        const lastSync = this.context.globalState.get<string>('agentDna.lastSync') || '从未同步';
        const lastSource = this.context.globalState.get<'antigravity' | 'claude'>('agentDna.lastSource')
            || config.get<'antigravity' | 'claude'>('lastSource', 'antigravity');

        const toolPathsAg = PathResolver.getToolPaths('antigravity');
        const toolPathsClaude = PathResolver.getToolPaths('claude');

        this._panel.webview.html = this._getHtmlForWebview(repoUrl, token, lastSync, toolPathsAg.skills, toolPathsClaude.skills, lastSource);
    }

    private _getHtmlForWebview(repoUrl: string, token: string | undefined, lastSync: string, agPath: string, claudePath: string, lastSource: 'antigravity' | 'claude' = 'antigravity') {
        return `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --color-border: var(--vscode-widget-border, #d0d7de);
            --color-bg-subtle: var(--vscode-editor-inactiveSelectionBackground, #f6f8fa);
            --color-fg-muted: var(--vscode-descriptionForeground, #57606a);
            --color-btn-bg: var(--vscode-button-background, #21262d);
            --color-btn-fg: var(--vscode-button-foreground, #ffffff);
            --color-btn-hover: var(--vscode-button-hoverBackground, #30363d);
            --color-danger-fg: #cf222e;
            --color-danger-btn: rgba(207, 34, 46, 0.1);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 30px;
            margin: 0;
        }

        .container { max-width: 750px; margin: 0 auto; }

        .Subhead {
            display: flex;
            padding-bottom: 8px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--color-border);
            align-items: center;
            gap: 12px;
        }

        .Subhead-heading {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
        }

        .section-header {
            margin-top: 32px;
            margin-bottom: 16px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px 0;
        }

        .section-desc {
            font-size: 13px;
            color: var(--color-fg-muted);
            margin: 0;
        }

        /* Box Layout */
        .Box {
            background-color: transparent;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            margin-bottom: 24px;
        }

        .Box-row {
            padding: 16px;
            border-top: 1px solid var(--color-border);
            display: flex;
            align-items: flex-start;
        }

        .Box-row:first-child { border-top: 0; }

        .Box-body { padding: 16px; }

        .flex-content { flex: 1; }

        /* Typography */
        .item-label {
            font-weight: 600;
            display: block;
            margin-bottom: 2px;
        }

        .subtext {
            font-size: 12px;
            color: var(--color-fg-muted);
            display: block;
        }

        /* Form Controls */
        .btn {
            width: 100px;
            padding: 5px 0;
            font-size: 12px;
            font-weight: 500;
            line-height: 20px;
            text-align: center;
            white-space: nowrap;
            cursor: pointer;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background-color: var(--color-bg-subtle);
            color: var(--vscode-foreground);
            transition: 0.15s;
        }
        .btn:hover { background-color: rgba(0,0,0,0.05); border-color: var(--vscode-focusBorder); }
        .btn-primary { background-color: #2ea043; color: white; border-color: rgba(27,31,35,0.15); }
        .btn-primary:hover { background-color: #3fb950; }
        .btn-danger { color: var(--color-danger-fg); border-color: var(--color-border); }
        .btn-danger:hover { background-color: var(--color-danger-btn); border-color: var(--color-danger-fg); }

        .form-control {
            width: 100%;
            padding: 5px 12px;
            font-size: 13px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            box-sizing: border-box;
        }
        .form-control:focus { border-color: var(--vscode-focusBorder); outline: none; }

        select.form-control { cursor: pointer; height: 32px; }

        .checkbox-container { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        input[type="checkbox"] { margin: 0; cursor: pointer; }

        .sync-status {
            font-size: 12px;
            color: #2ea043;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Collapsible Section */
        details summary {
            cursor: pointer;
            outline: none;
            list-style: none;
            font-weight: 600;
            font-size: 16px;
            padding: 4px 0;
        }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary { margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }

        .row-action {
             display: flex;
             align-items: center;
             gap: 12px;
             margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="Subhead">
            <h2 class="Subhead-heading">AgentDNA 控制面板</h2>
        </div>

        <!-- 1. Sync & Tool Selection -->
        <div class="section-header">
            <h3 class="section-title">1. 同步与工具 (Sync & Tools)</h3>
            <p class="section-desc">上下对应：左侧选择配置，右侧一键同步。</p>
        </div>
        <div class="Box">
            <!-- Row 1: Source & Push -->
            <div class="Box-row" style="align-items: center;">
                <div class="flex-content">
                    <span class="item-label">源 AI 工具 (Source AI Tool)</span>
                    <span class="subtext">当前活动源，用于提取修改并同步到云端。</span>
                    <div class="row-action">
                        <select id="sourceSelect" class="form-control" style="flex: 1;">
                            <option value="antigravity" ${lastSource === 'antigravity' ? 'selected' : ''}>Antigravity (Gemini)</option>
                            <option value="claude" ${lastSource === 'claude' ? 'selected' : ''}>Claude Code (Anthropic)</option>
                        </select>
                        <button class="btn btn-primary" id="btnSyncLocal" title="提取工具修改 -> 提交 -> 推送云端">同步到云端</button>
                    </div>
                </div>
            </div>
            <!-- Row 2: Targets & Pull -->
            <div class="Box-row" style="align-items: center;">
                <div class="flex-content">
                    <span class="item-label">下发目标 (Deployment Targets)</span>
                    <span class="subtext">拉取云端更新后，自动分发到已勾选的工具。</span>
                    <div class="row-action">
                        <div style="display: flex; gap: 20px; flex: 1;">
                            <label class="checkbox-container">
                                <input type="checkbox" id="targetAntigravity" checked> Antigravity
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="targetClaude" checked> Claude Code
                            </label>
                        </div>
                        <button class="btn" id="btnSyncRemote" title="拉取 -> 更新仓库 -> 分发下发">同步到本地</button>
                    </div>
                </div>
            </div>
            <!-- Status Row -->
            <div class="Box-row" style="background-color: var(--color-bg-subtle); border-top: 1px solid var(--color-border); padding: 8px 16px;">
                <div class="flex-content">
                     <label class="checkbox-container" style="color: var(--color-fg-muted); font-size: 11px;">
                        <input type="checkbox" id="forcePush"> 启用强制推送 (Force Push)
                    </label>
                </div>
                <div class="sync-status">
                    <span>上次同步: ${lastSync}</span>
                </div>
            </div>
        </div>

        <!-- 2. Settings (Collapsible) -->
        <div class="section-header">
            <details>
                <summary>⚙️ 仓库配置 (Repository Configuration)</summary>
                <div class="Box">
                    <div class="Box-body">
                        <div style="margin-bottom: 12px;">
                            <span class="item-label">仓库地址 (Git Remote URL)</span>
                            <input type="text" id="repoUrl" class="form-control" value="${repoUrl}" placeholder="https://github.com/user/agent-file.git">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <span class="item-label">访问令牌 (PAT Token)</span>
                            <input type="password" id="token" class="form-control" placeholder="${token ? '已加密存储 (输入新 Token 以修改)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); padding-top: 16px;">
                            <button class="btn" id="btnSaveSettings">保存设置</button>
                        </div>
                    </div>
                </div>

                <div class="section-header" style="margin-top: 24px;">
                    <h3 class="section-title danger-section-title">危险区域 (Danger Zone)</h3>
                </div>
                <div class="Box danger-box">
                    <div class="Box-row">
                        <div class="flex-content">
                            <span class="item-label">软重置配置 (Soft Reset)</span>
                            <span class="subtext">遇到仓库冲突或死锁时，尝试清除本地 Git 缓存。</span>
                        </div>
                        <button class="btn btn-danger" id="btnReset">重置缓存</button>
                    </div>
                </div>
            </details>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // 同步到云端 (Local -> Remote)
        document.getElementById('btnSyncLocal').addEventListener('click', () => {
             const source = document.getElementById('sourceSelect').value;
             const force = document.getElementById('forcePush').checked;
             vscode.postMessage({ command: 'syncLocalToRemote', source, force });
        });

        // 同步到本地 (Remote -> Local)
        document.getElementById('btnSyncRemote').addEventListener('click', () => {
             const targets = [];
             if (document.getElementById('targetAntigravity').checked) targets.push('antigravity');
             if (document.getElementById('targetClaude').checked) targets.push('claude');
             if (targets.length === 0) return;
             vscode.postMessage({ command: 'syncRemoteToLocal', targets });
        });

        // 软重置
        document.getElementById('btnReset').addEventListener('click', () => {
            vscode.postMessage({ command: 'syncRemoteToLocal', targets: ['antigravity'] });
        });

        // 保存设置
        document.getElementById('btnSaveSettings').addEventListener('click', () => {
            const repoUrl = document.getElementById('repoUrl').value;
            const token = document.getElementById('token').value;
            const lastSource = document.getElementById('sourceSelect').value;
            vscode.postMessage({ command: 'saveSettings', repoUrl, token, lastSource });
        });
    </script>
</body>
</html>`;
    }
}
