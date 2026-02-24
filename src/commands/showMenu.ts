import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export async function showMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl');

    // Main Menu Items
    const items: vscode.QuickPickItem[] = [];

    if (repoUrl) {
        items.push({
            label: '$(cloud-upload) 同步到云端 (Sync to Remote)',
            description: '提取本地工具修改并推送到 GitHub',
            detail: `Source: ${config.get('lastSource', 'antigravity')}`,
            command: 'agentDna.syncLocalToRemote'
        } as any);

        items.push({
            label: '$(sync) 同步到本地 (Sync to Local)',
            description: '从 GitHub 拉取并同步到本地所有工具',
            detail: '将覆盖本地工具的受管文件',
            command: 'agentDna.syncRemoteToLocal'
        } as any);
    } else {
        items.push({
            label: '$(alert) 请先进行初始配置',
            description: '点击配置仓库地址与 Token',
            detail: '需要完成设置后方可进行同步操作',
            command: 'agentDna.setup'
        } as any);
    }

    // Settings
    items.push({
        label: '$(settings) 设置面板',
        detail: '查看控制面板、配置仓库与同步选项',
        command: 'agentDna.setup'
    } as any);

    // Show menu
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'AgentDNA 控制台 - 选择操作',
        title: 'AgentDNA'
    });

    if (selection) {
        const item = selection as any;
        if (item.command) {
            vscode.commands.executeCommand(item.command);
        }
    }
}


