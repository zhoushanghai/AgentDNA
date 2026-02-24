import * as vscode from 'vscode';
import { syncLocalToRemote, syncRemoteToLocal } from './commands/orchestratorCommands';
import { showMenu } from './commands/showMenu';
import { TokenManager } from './services/TokenManager';
import { ControlPanelWebview } from './webview/controlPanel/ControlPanelWebview';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AgentDNA is now active!');

    // Initialize Services
    TokenManager.init(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agentDna.syncLocalToRemote', syncLocalToRemote),
        vscode.commands.registerCommand('agentDna.syncRemoteToLocal', syncRemoteToLocal),
        vscode.commands.registerCommand('agentDna.showMenu', showMenu),
        vscode.commands.registerCommand('agentDna.openPanel', () => {
            ControlPanelWebview.createOrShow(context);
        }),
        vscode.commands.registerCommand('agentDna.setup', () => {
            ControlPanelWebview.createOrShow(context); // Unified to panel
        })
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'agentDna.openPanel';
    statusBarItem.text = '$(sync) AgentDNA';
    statusBarItem.tooltip = 'Click to open AgentDNA dashboard';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
