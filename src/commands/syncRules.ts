import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitService } from '../services/GitService';
import { LinkService } from '../services/LinkService';
import { TokenManager } from '../services/TokenManager';
import { GitIgnoreService } from '../services/GitIgnoreService';

export async function syncRules(): Promise<void> {
    const gitService = new GitService();
    const linkService = new LinkService();

    // 1. Get repo URL from configuration
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl');

    // Get token from secure storage
    const githubToken = await TokenManager.getInstance().getToken();

    if (!repoUrl) {
        const action = await vscode.window.showErrorMessage(
            'AgentDNA: 请先配置仓库 URL',
            '打开设置'
        );
        if (action === '打开设置') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'agentDna.repoUrl');
        }
        return;
    }

    // 2. Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('AgentDNA: 请先打开一个工作区');
        return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Check if current directory is a git repository
    const gitDir = path.join(workspaceRoot, '.git');
    if (!fs.existsSync(gitDir)) {
        const confirm = await vscode.window.showWarningMessage(
            'AgentDNA: 当前目录似乎不是一个 Git 仓库。是否确认在此处导入 AGENT.md？',
            '确认导入',
            '取消'
        );

        if (confirm !== '确认导入') {
            return;
        }
    }

    try {
        // 3. Show progress while syncing
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'AgentDNA',
                cancellable: false
            },
            async (progress) => {
                // Clone or update repository
                progress.report({ message: '正在同步仓库...' });
                await gitService.syncRepo(repoUrl, githubToken);

                // Check if AGENT.md exists in repo
                if (!gitService.hasAgentMd()) {
                    vscode.window.showErrorMessage('AgentDNA: 仓库中未找到 AGENT.md 文件');
                    return;
                }

                // Check if AGENT.md already exists in workspace
                const targetPath = linkService.getWorkspaceAgentMdPath(workspaceRoot);

                if (linkService.fileExists(targetPath)) {
                    // If it's already a symlink pointing to our file, git pull was already done
                    if (linkService.isSymlink(targetPath)) {
                        vscode.window.showInformationMessage('AgentDNA: 同步完成！规则已更新到最新版本');
                        return;
                    }

                    // Ask user to confirm overwrite
                    const confirm = await vscode.window.showWarningMessage(
                        'AGENT.md 已存在，是否覆盖？',
                        '是',
                        '否'
                    );

                    if (confirm !== '是') {
                        vscode.window.showInformationMessage('AgentDNA: 操作已取消');
                        return;
                    }

                    // Remove existing file
                    linkService.remove(targetPath);
                }

                // Create copy (instead of symlink)
                progress.report({ message: '正在复制规则文件...' });
                await linkService.copyFile(gitService.getAgentMdPath(), targetPath);

                // Update .gitignore based on preference
                const includeInGit = config.get<boolean>('includeInGit', false);
                const gitIgnoreService = new GitIgnoreService();
                gitIgnoreService.update(workspaceRoot, includeInGit);

                vscode.window.showInformationMessage('AgentDNA: 同步成功！AGENT.md 已更新 (本地副本模式)');
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AgentDNA 同步失败: ${errorMessage}`);
    }
}
