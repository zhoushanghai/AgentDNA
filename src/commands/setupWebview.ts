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
                        await this._saveConfiguration(message.repoUrl, message.token);
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

        // Generate a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    h2 {
                        border-bottom: 1px solid var(--vscode-descriptionForeground);
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    input[type="text"], input[type="password"] {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        margin-top: 5px;
                    }
                    input:focus {
                        outline: 1px solid var(--vscode-focusBorder);
                    }
                    .help-text {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 5px;
                    }
                    button {
                        padding: 10px 20px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        font-size: 1em;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>AgentDNA 配置</h2>
                    <div class="form-group">
                        <label for="repoUrl">GitHub 仓库地址 (Repository URL)</label>
                        <input type="text" id="repoUrl" value="${currentRepoUrl}" placeholder="https://github.com/user/rules.git">
                        <div class="help-text">用于存储 AGENT.md 规则文件的 Git 仓库地址。</div>
                    </div>
                    <div class="form-group">
                        <label for="token">GitHub Token (Personal Access Token)</label>
                        <input type="password" id="token" placeholder="${currentToken ? '已设置 (如需修改请输入新 Token)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}">
                        <div class="help-text">私有仓库需要配置 Token，公开仓库可留空。</div>
                    </div>
                    <button id="saveBtn">保存配置</button>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    document.getElementById('saveBtn').addEventListener('click', () => {
                        const repoUrl = document.getElementById('repoUrl').value;
                        const token = document.getElementById('token').value;
                        vscode.postMessage({
                            command: 'save',
                            repoUrl: repoUrl,
                            token: token
                        });
                    });
                </script>
            </body>
            </html>`;
    }

    private async _saveConfiguration(repoUrl: string, token: string) {
        if (repoUrl) {
            await vscode.workspace.getConfiguration('agentDna').update('repoUrl', repoUrl, vscode.ConfigurationTarget.Global);
        }

        if (token) {
            await TokenManager.getInstance().setToken(token);
        }

        vscode.window.showInformationMessage('AgentDNA: 配置已保存！');
        this.dispose();

        // Optionally trigger sync or reopen menu
        vscode.commands.executeCommand('agentDna.showMenu');
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
