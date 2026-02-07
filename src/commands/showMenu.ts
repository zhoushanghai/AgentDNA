import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';
import { GitIgnoreService } from '../services/GitIgnoreService';

import { ProjectRegistry } from '../services/ProjectRegistry';

export async function showMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl');

    // Register current project if workspace is open
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        ProjectRegistry.getInstance().addProject(workspaceFolders[0].uri.fsPath);
    }

    // Main Menu Items
    const items: vscode.QuickPickItem[] = [];

    if (repoUrl) {
        items.push({
            label: '$(sync) 立即同步 (Pull)',
            description: '从 GitHub 拉取最新 AGENT.md (覆盖本地)',
            detail: `Repo: ${repoUrl}`,
            command: 'agentDna.sync'
        } as any);

        items.push({
            label: '$(cloud-upload) 发布规则 (Publish)',
            description: '将本地修改推送到 GitHub',
            detail: '会自动提交并在其他项目中同步',
            command: 'agentDna.publish'
        } as any);
    } else {
        items.push({
            label: '$(alert) 立即同步 (未配置)',
            description: '点击进行初始配置',
            detail: '设置仓库地址后才能开始同步',
            command: 'agentDna.quickSetup'
        } as any);
    }

    items.push({
        label: '$(gear) 设置',
        description: '配置仓库地址和 Token',
        command: 'agentDna.showSettings'
    } as any);

    // Git Tracking Option
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitIgnoreService = new GitIgnoreService();

        if (gitIgnoreService.hasGitIgnore(workspaceRoot)) {
            const includeInGit = config.get<boolean>('includeInGit', false);
            items.push({
                label: includeInGit ? '$(check) Git 追踪: 已启用' : '$(circle-slash) Git 追踪: 已禁用',
                description: includeInGit ? 'AGENT.md 将被提交到仓库' : 'AGENT.md 被忽略 (推荐)',
                detail: '点击切换是否将规则文件加入版本控制',
                command: 'agentDna.toggleGitTracking' // Custom command handled below
            } as any);
        } else {
            items.push({
                label: '$(circle-slash) Git 追踪: 不可用',
                description: '当前目录未找到 .gitignore 文件',
                detail: '请先创建 .gitignore 文件以启用此功能',
                command: 'agentDna.showGitIgnoreInfo'
            } as any);
        }
    }

    // Show menu
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'AgentDNA 控制台 - 选择操作',
        title: 'AgentDNA'
    });

    if (selection) {
        const item = selection as any;
        if (item.command) {
            if (item.command === 'agentDna.showSettings') {
                await vscode.commands.executeCommand('agentDna.openSetupWebview');
            } else if (item.command === 'agentDna.quickSetup') {
                await vscode.commands.executeCommand('agentDna.openSetupWebview');
            } else if (item.command === 'agentDna.toggleGitTracking') {
                const current = config.get<boolean>('includeInGit', false);
                await config.update('includeInGit', !current, vscode.ConfigurationTarget.Global);
                // Re-open menu to show updated state
                showMenu();
            } else if (item.command === 'agentDna.showGitIgnoreInfo') {
                vscode.window.showInformationMessage('需要在项目根目录创建 .gitignore 文件，才能配置是否将 AGENT.md 加入版本控制。');
            } else {
                vscode.commands.executeCommand(item.command);
            }
        }
    }
}


