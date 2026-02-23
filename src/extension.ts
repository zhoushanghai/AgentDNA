import * as vscode from 'vscode';
import { syncRules } from './commands/syncRules';
import { publishRules } from './commands/publishRules';
import { forcePublishRules } from './commands/forcePublish';
import { showMenu } from './commands/showMenu';
import { SetupWebview } from './commands/setupWebview';
import { TokenManager } from './services/TokenManager';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AgentDNA is now active!');

    // Initialize Services
    TokenManager.init(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agentDna.sync', syncRules),
        vscode.commands.registerCommand('agentDna.publish', publishRules),
        vscode.commands.registerCommand('agentDna.forcePublish', forcePublishRules),
        vscode.commands.registerCommand('agentDna.showMenu', showMenu),
        vscode.commands.registerCommand('agentDna.setup', () => {
            SetupWebview.createOrShow(context.extensionUri);
        })
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
