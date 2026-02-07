import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitService } from '../services/GitService';
import { LinkService } from '../services/LinkService';
import { TokenManager } from '../services/TokenManager';

export async function publishRules(): Promise<void> {
    const gitService = new GitService();
    const linkService = new LinkService();

    // 1. Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('AgentDNA: 请先打开一个工作区');
        return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const localAgentMd = linkService.getWorkspaceAgentMdPath(workspaceRoot);

    // 2. Check if local file exists
    if (!linkService.fileExists(localAgentMd)) {
        vscode.window.showErrorMessage('AgentDNA: 当前项目未找到 AGENT.md 文件');
        return;
    }

    // 3. Confirm Publish
    const confirm = await vscode.window.showInformationMessage(
        '即将把本地 AGENT.md 的修改推送到中央仓库并同步到 GitHub。确定继续吗？',
        '确定发布',
        '取消'
    );

    if (confirm !== '确定发布') {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'AgentDNA 发布中',
                cancellable: false
            },
            async (progress) => {
                // 4. Overwrite central copy
                progress.report({ message: '正在更新中央仓库文件...' });
                const token = await TokenManager.getInstance().getToken();

                // Ensure repo is up to date first (avoid conflicts if possible, though we are overwriting)
                await gitService.syncRepo(vscode.workspace.getConfiguration('agentDna').get('repoUrl') || '', token);

                // Copy local -> central
                await linkService.copyFile(localAgentMd, gitService.getAgentMdPath());

                // 5. Generate Commit Message (Prompt User)
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const defaultMsg = `Update rules: ${timestamp}`;

                let commitMsg = await vscode.window.showInputBox({
                    prompt: '输入 Commit Message (留空则默认使用时间戳)',
                    placeHolder: defaultMsg,
                    value: defaultMsg // Pre-fill with default
                });

                if (!commitMsg) {
                    commitMsg = defaultMsg;
                }

                // 6. Push to GitHub
                progress.report({ message: '正在推送到 GitHub...' });
                await gitService.commitAndPush(commitMsg, token);

                // 7. Sync to other local projects (Placeholder for now)
                // Since we don't strictly track all other projects, we can't easily push to them yet without scanning.
                // We'll prompt the user about this limitation or implementation feature later if needed.
                // For now, the user's primary requirement "Sync modification to other local copies" is best served by 
                // simply letting them know the source is updated. Other projects will get it on next "Sync".

                vscode.window.showInformationMessage(`AgentDNA: 发布成功！已推送到 GitHub (${commitMsg})`);
            }
        );

        // 7. Prompt to sync to other local projects
        const syncOthers = await vscode.window.showInformationMessage(
            '是否将更改同步到本机其他已知的 AgentDNA 项目？',
            '是',
            '否'
        );

        if (syncOthers === '是') {
            // Implementation for syncing to other projects
            // We need a Project Registry service. For now, we'll just show a placeholder message
            // indicating this feature needs the registry to be implemented.
            // OR, better, we can iterate over recently opened workspaces if possible? No.
            // We will implement a `ProjectRegistry` service next.
            await vscode.commands.executeCommand('agentDna.syncToLocalProjects');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AgentDNA 发布失败: ${errorMessage}`);
    }
}
