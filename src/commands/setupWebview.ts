import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export class SetupWebview {
    public static currentPanel: SetupWebview | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        await this._saveConfiguration(
                            message.repoUrl,
                            message.token,
                            message.syncRules,
                            message.syncWorkflows,
                            message.syncSkills
                        );
                        return;
                    case 'delete':
                        await this._deleteConfiguration();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (SetupWebview.currentPanel) {
            SetupWebview.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'agentDnaSetup',
            'AgentDNA 配置',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        SetupWebview.currentPanel = new SetupWebview(panel, extensionUri);
    }

    public dispose() {
        SetupWebview.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.title = 'AgentDNA 配置';
        this._panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        const config = vscode.workspace.getConfiguration('agentDna');
        const currentRepoUrl = config.get<string>('repoUrl') || '';
        const currentToken = await TokenManager.getInstance().getToken();

        const syncRules = config.get<boolean>('syncRules', true);
        const syncWorkflows = config.get<boolean>('syncWorkflows', true);
        const syncSkills = config.get<boolean>('syncSkills', true);

        // Generate a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        font-size: 1.1em; /* Increased base font size */
                    }
                    .container {
                        max-width: 700px;
                        margin: 0 auto;
                    }
                    .section-header {
                        margin-top: 30px;
                        margin-bottom: 8px;
                        font-size: 1.3em; /* Proportional increase */
                        font-weight: 600;
                        color: var(--vscode-editor-foreground);
                    }
                    .section-desc {
                        margin-top: 0;
                        margin-bottom: 20px;
                        font-size: 1em;
                        color: var(--vscode-descriptionForeground);
                    }
                    .card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 6px;
                        padding: 20px;
                        margin-bottom: 25px;
                    }
                    .form-group {
                        margin-bottom: 24px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        font-size: 1em;
                    }
                    input[type="text"], input[type="password"] {
                        width: 100%;
                        padding: 10px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        box-sizing: border-box;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 1em;
                    }
                    input:focus {
                        outline: 1px solid var(--vscode-focusBorder);
                        border-color: var(--vscode-focusBorder);
                    }
                    .help-text {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 8px;
                        line-height: 1.5;
                    }
                    a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    /* Primary Button (Green) */
                    .btn-primary {
                        padding: 8px 20px;
                        background-color: #2ea043; /* GitHub Green */
                        color: #ffffff;
                        border: 1px solid rgba(27, 31, 35, 0.15);
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 6px;
                        line-height: 20px;
                        transition: background-color 0.2s, transform 0.1s;
                    }
                    .btn-primary:hover {
                        background-color: #3fb950; /* Brighter Green for obvious hover */
                    }
                    .btn-primary:active {
                        background-color: #238636;
                        transform: translateY(2px);
                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
                    }

                    .danger-zone-card {
                        border: 1px solid var(--vscode-errorForeground);
                        background-color: transparent;
                        border-radius: 6px;
                        padding: 20px;
                    }
                    
                    /* Danger Button (Red) */
                    .btn-danger {
                        padding: 8px 20px;
                        background-color: #d73a49; /* Solid Red */
                        color: #ffffff;
                        border: 1px solid rgba(27, 31, 35, 0.15);
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 6px;
                        transition: background-color 0.2s, transform 0.1s;
                    }
                    .btn-danger:hover {
                        background-color: #ff4d5e; /* Brighter Red for obvious hover */
                    }
                    .btn-danger:active {
                        background-color: #b31d28;
                        transform: translateY(2px);
                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 style="margin-bottom: 30px; font-size: 1.5em; font-weight: 600;">AgentDNA 设置</h1>
                    
                    <!-- Configuration Section -->
                    <h3 class="section-header">基础配置 / Basic Settings</h3>
                    <p class="section-desc">配置 rules 仓库地址和访问凭证，以便同步 AGENT.md。</p>
                    
                    <div class="card">
                        <div class="form-group">
                            <label for="repoUrl">GitHub 仓库地址 (Repository URL)</label>
                            <div class="help-text" style="margin-bottom: 8px; margin-top: 0;">您的 AGENT.md 规则文件所在的 Git 仓库地址。</div>
                            <input type="text" id="repoUrl" value="${currentRepoUrl}" placeholder="https://github.com/user/rules.git">
                        </div>
                        
                        <div class="form-group">
                            <label for="token">GitHub Token (Personal Access Token)</label>
                            <div class="help-text" style="margin-bottom: 8px; margin-top: 0;">
                                用于访问私有仓库。如果没有 Token，请前往 
                                <a href="https://github.com/settings/tokens">GitHub Settings > Developer settings > Personal access tokens</a>
                                生成一个 (需要 <code>repo</code> 权限)。
                            </div>
                            <input type="password" id="token" placeholder="${currentToken ? '已设置 (如需修改请输入新 Token)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}">
                        </div>

                        <div style="margin-top: 20px;">
                            <button id="saveBtn" class="btn-primary">保存配置 (Save)</button>
                        </div>
                    </div>

                    <!-- Sync Targets Section -->
                    <h3 class="section-header">同步内容 / Sync Targets</h3>
                    <p class="section-desc">选择要与全局目录同步的文档类型（强制覆盖时也会受到此开关的保护）。</p>
                    
                    <div class="card">
                        <div class="form-group" style="margin-bottom: 12px; display: flex; align-items: center;">
                            <input type="checkbox" id="syncRules" ${syncRules ? 'checked' : ''} style="margin-right: 12px; transform: scale(1.2);">
                            <label for="syncRules" style="margin-bottom: 0;">Rules (~/.gemini/GEMINI.md)</label>
                        </div>
                        <div class="form-group" style="margin-bottom: 12px; display: flex; align-items: center;">
                            <input type="checkbox" id="syncWorkflows" ${syncWorkflows ? 'checked' : ''} style="margin-right: 12px; transform: scale(1.2);">
                            <label for="syncWorkflows" style="margin-bottom: 0;">Workflows (~/.gemini/antigravity/global_workflows/)</label>
                        </div>
                        <div class="form-group" style="margin-bottom: 12px; display: flex; align-items: center;">
                            <input type="checkbox" id="syncSkills" ${syncSkills ? 'checked' : ''} style="margin-right: 12px; transform: scale(1.2);">
                            <label for="syncSkills" style="margin-bottom: 0;">Skills (~/.gemini/antigravity/skills/)</label>
                        </div>
                    </div>

                    <!-- Danger Zone -->
                    <h3 class="section-header">危险区域 / Danger Zone</h3>
                    
                    <div class="danger-zone-card">
                        <div style="margin-bottom: 15px; font-size: 0.9em; font-weight: 600;">在此处可以清除插件的所有本地配置信息。</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div class="help-text" style="max-width: 70%; margin-top: 0;">
                                注意：此操作将从本地安全存储中永久删除您的仓库地址和 GitHub Token。
                            </div>
                            <button type="button" id="deleteBtn" class="btn-danger">删除所有配置</button>
                        </div>
                    </div>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    document.getElementById('saveBtn').addEventListener('click', () => {
                        const repoUrl = document.getElementById('repoUrl').value;
                        const token = document.getElementById('token').value;
                        const syncRules = document.getElementById('syncRules').checked;
                        const syncWorkflows = document.getElementById('syncWorkflows').checked;
                        const syncSkills = document.getElementById('syncSkills').checked;
                        
                        vscode.postMessage({
                            command: 'save',
                            repoUrl,
                            token,
                            syncRules,
                            syncWorkflows,
                            syncSkills
                        });
                    });

                    document.getElementById('deleteBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'delete'
                        });
                    });
                </script>
            </body>
            </html>`;
    }


    private async _saveConfiguration(repoUrl: string, token: string, syncRules: boolean, syncWorkflows: boolean, syncSkills: boolean) {
        const config = vscode.workspace.getConfiguration('agentDna');

        if (repoUrl !== undefined) {
            await config.update('repoUrl', repoUrl, vscode.ConfigurationTarget.Global);
        }

        await config.update('syncRules', syncRules, vscode.ConfigurationTarget.Global);
        await config.update('syncWorkflows', syncWorkflows, vscode.ConfigurationTarget.Global);
        await config.update('syncSkills', syncSkills, vscode.ConfigurationTarget.Global);

        if (token) {
            await TokenManager.getInstance().setToken(token);
        }

        vscode.window.showInformationMessage('AgentDNA: 配置已保存！');
        this.dispose();

        // Optionally trigger sync or reopen menu
        vscode.commands.executeCommand('agentDna.showMenu');
    }
    private async _deleteConfiguration() {
        const confirm = await vscode.window.showWarningMessage(
            '确定要删除所有配置吗？(仓库地址和 Token 将被清除)',
            '确定删除',
            '取消'
        );

        if (confirm === '确定删除') {
            await vscode.workspace.getConfiguration('agentDna').update('repoUrl', undefined, vscode.ConfigurationTarget.Global);
            await TokenManager.getInstance().setToken(undefined);

            vscode.window.showInformationMessage('AgentDNA: 所有配置已清除');
            this.dispose();
            vscode.commands.executeCommand('agentDna.showMenu');
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
