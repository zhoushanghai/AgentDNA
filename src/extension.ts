import * as vscode from 'vscode';
import { syncRules } from './commands/syncRules';
import { setToken, deleteToken } from './commands/tokenCommands';
import { showMenu } from './commands/showMenu';
import { TokenManager } from './services/TokenManager';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AgentDNA is now active!');

    // Initialize TokenManager
    TokenManager.init(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agentDna.sync', syncRules),
        vscode.commands.registerCommand('agentDna.setToken', setToken),
        vscode.commands.registerCommand('agentDna.deleteToken', deleteToken),
        vscode.commands.registerCommand('agentDna.showMenu', showMenu)
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'agentDna.showMenu'; // Change to show menu
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
