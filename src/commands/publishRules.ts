import * as vscode from 'vscode';
import { GitService } from '../services/GitService';
import { DocumentSyncService } from '../services/DocumentSyncService';
import { TokenManager } from '../services/TokenManager';
import { PathResolver } from '../services/PathResolver';

export async function publishRules(): Promise<void> {
    const gitService = new GitService();
    const syncService = new DocumentSyncService();

    // 1. Confirm Publish
    const confirm = await vscode.window.showInformationMessage(
        'AgentDNA: 即将把本机全局文档 (Rules, Workflows, Skills) 的更改推送到远端仓库。确定继续吗？\n(注意: 此操作不会删除远端独有的文件)',
        { modal: true },
        '确定发布'
    );

    if (confirm !== '确定发布') {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'AgentDNA',
                cancellable: false
            },
            async (progress) => {
                // 2. Sync latest remote first to avoid simple conflicts
                progress.report({ message: '正在同步远端最新配置...' });
                const token = await TokenManager.getInstance().getToken();
                const repoUrl = vscode.workspace.getConfiguration('agentDna').get<string>('repoUrl') || '';

                await gitService.syncRepo(repoUrl, token);

                // 3. Collect local global documents into the clone cache
                progress.report({ message: '正在收集本地全局文档...' });
                const cloneDir = PathResolver.getCloneDir();
                const docSet = DocumentSyncService.getDocumentSet();

                await syncService.collectFromGlobal(cloneDir, docSet);

                // 4. Generate Commit Message (Prompt User)
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const defaultMsg = `chore: update AgentDNA global documents ${timestamp}`;

                let commitMsg = await vscode.window.showInputBox({
                    prompt: '输入 Commit Message (留空则默认使用时间戳)',
                    placeHolder: defaultMsg,
                    value: defaultMsg // Pre-fill with default
                });

                if (!commitMsg) {
                    commitMsg = defaultMsg;
                }

                // 5. Push to GitHub
                progress.report({ message: '正在推送到 GitHub...' });
                await gitService.commitAndPush(commitMsg, token);

                vscode.window.showInformationMessage(`AgentDNA: 发布成功！文档已同步至 GitHub.`);
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AgentDNA Push 失败: ${errorMessage}`);
    }
}

