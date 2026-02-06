import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export async function showMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl') || 'Not configured';
    const hasToken = !!(await TokenManager.getInstance().getToken());

    // Create menu items
    const items: vscode.QuickPickItem[] = [
        {
            label: '$(sync) 立即同步',
            description: '从 GitHub 同步 AGENT.md',
            detail: `Repo: ${repoUrl}`,
            command: 'agentDna.sync'
        } as any,
        {
            label: hasToken ? '$(check) 配置 GitHub Token' : '$(key) 配置 GitHub Token',
            description: hasToken ? 'Token 已设置 (点击修改)' : '未设置 (点击配置)',
            detail: '用于私有仓库访问权限',
            command: 'agentDna.setToken'
        } as any,
        {
            label: '$(settings) 配置仓库地址',
            description: '修改规则仓库 URL',
            command: 'workbench.action.openSettings',
            args: ['agentDna.repoUrl']
        } as any
    ];

    if (hasToken) {
        items.push({
            label: '$(trash) 清除 Token',
            description: '从安全存储中删除 GitHub Token',
            command: 'agentDna.deleteToken'
        } as any);
    }

    // Show menu
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'AgentDNA 控制台 - 选择操作',
        title: 'AgentDNA'
    });

    if (selection) {
        // Handle selection
        const item = selection as any;
        if (item.command) {
            if (item.command === 'workbench.action.openSettings') {
                vscode.commands.executeCommand(item.command, ...item.args);
            } else {
                vscode.commands.executeCommand(item.command);
            }
        }
    }
}
