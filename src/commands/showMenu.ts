import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export async function showMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl');

    // Main Menu Items
    const items: vscode.QuickPickItem[] = [];

    if (repoUrl) {
        items.push({
            label: '$(sync) 同步全局文档 (Pull)',
            description: '从 GitHub 拉取配置以覆盖本机',
            detail: `Repo: ${repoUrl}`,
            command: 'agentDna.sync'
        } as any);

        items.push({
            label: '$(cloud-upload) 发布全局文档 (Push)',
            description: '将本机新增和修改推送到 GitHub',
            detail: '保守合并: 不会删除远端独有的文件',
            command: 'agentDna.publish'
        } as any);

        items.push({
            label: '$(error) 强制推送 (以本地为准)',
            description: '危险：以本机状态镜像覆盖远端',
            detail: '强制覆盖: 将删除远端独有的受管文件',
            command: 'agentDna.forcePublish'
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
        detail: '配置仓库、Token 与同步选项',
        command: 'agentDna.setup'
    } as any);

    /* Git Tracking Option - Hidden by User Request
    if (workspaceFolders && workspaceFolders.length > 0) { ... }
    */

    // Show menu
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'AgentDNA 控制台 - 选择操作',
        title: 'AgentDNA'
    });

    if (selection) {
        const item = selection as any;
        if (item.command === 'agentDna.setup') {
            await vscode.commands.executeCommand('agentDna.setup');
        } else if (item.command) {
            vscode.commands.executeCommand(item.command);
        }
    }
}


