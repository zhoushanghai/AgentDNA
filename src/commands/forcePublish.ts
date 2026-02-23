import * as vscode from 'vscode';
import { GitService } from '../services/GitService';
import { DocumentSyncService } from '../services/DocumentSyncService';
import { TokenManager } from '../services/TokenManager';
import { PathResolver } from '../services/PathResolver';

export async function forcePublishRules(): Promise<void> {
    const gitService = new GitService();
    const syncService = new DocumentSyncService();

    // 1. DANGER CONFIRMATION
    const confirm = await vscode.window.showWarningMessage(
        'AgentDNA 危险操作: 此操作将以本机全局文档为绝对权威\n\n' +
        '远端仓库中被管理的文档(若本地没有)将被永久删除！\n\n' +
        '你确定要强制覆盖远端仓库吗？',
        { modal: true },
        '确认强制覆盖'
    );

    if (confirm !== '确认强制覆盖') {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'AgentDNA (强制推送)',
                cancellable: false
            },
            async (progress) => {
                // 2. Clone remote to intermediate cache to ensure we have git history
                progress.report({ message: '正在克隆远端仓库...' });
                const token = await TokenManager.getInstance().getToken();
                const repoUrl = vscode.workspace.getConfiguration('agentDna').get<string>('repoUrl') || '';

                await gitService.syncRepo(repoUrl, token);

                // 3. Force collect global documents (Clears clone directories first)
                progress.report({ message: '正在清除缓存并以本地权威覆盖...' });
                const cloneDir = PathResolver.getCloneDir();
                const docSet = DocumentSyncService.getDocumentSet();

                await syncService.forceCollectFromGlobal(cloneDir, docSet);

                // 4. Generate Commit Message
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const commitMsg = `chore: FORCE push AgentDNA global documents from local ${timestamp}`;

                // 5. Push to GitHub
                progress.report({ message: '正在推送到 GitHub...' });
                await gitService.commitAndPush(commitMsg, token);

                vscode.window.showInformationMessage(`AgentDNA: 强制发布成功！远端仓库已被本地文档完全覆盖。`);
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AgentDNA 强制Push失败: ${errorMessage}`);
    }
}
