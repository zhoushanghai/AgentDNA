import * as vscode from 'vscode';
import { syncRules } from './commands/syncRules';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AgentDNA is now active!');

    // Register sync command
    const syncCommand = vscode.commands.registerCommand('agentDna.sync', syncRules);
    context.subscriptions.push(syncCommand);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'agentDna.sync';
    statusBarItem.text = '$(sync) AgentDNA';
    statusBarItem.tooltip = 'Click to sync AGENT.md from GitHub';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
