import * as vscode from 'vscode';
import { GitService } from '../services/GitService';
import { DocumentSyncService } from '../services/DocumentSyncService';
import { TokenManager } from '../services/TokenManager';
import { PathResolver } from '../services/PathResolver';

export async function syncRules(): Promise<void> {
    const gitService = new GitService();
    const syncService = new DocumentSyncService();

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

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'AgentDNA',
                cancellable: false
            },
            async (progress) => {
                // 2. Clone or update repository to the intermediate cache
                progress.report({ message: '正在从远端拉取最新配置...' });
                await gitService.syncRepo(repoUrl, githubToken);

                // 3. Validate repository structure
                const { isV3, isLegacy } = gitService.validateRepoStructure();

                if (!isV3 && !isLegacy) {
                    vscode.window.showErrorMessage('AgentDNA: 仓库格式无法识别（既不是 v2 也没有 v3 目录结构）');
                    return;
                }

                if (isLegacy) {
                    vscode.window.showWarningMessage('AgentDNA: 检测到旧版仓库格式 (仅包含 AGENT.md)。你可以使用 "Push" 将其升级为 v3 格式。');
                }

                // 4. Deploy documents from clone cache to global target paths
                progress.report({ message: '正在部署到全局环境...' });
                const cloneDir = PathResolver.getCloneDir();
                const docSet = DocumentSyncService.getDocumentSet();

                const result = await syncService.deployToGlobal(cloneDir, docSet);

                if (result.success) {
                    vscode.window.showInformationMessage(`AgentDNA: ${result.message}`);
                } else {
                    vscode.window.showErrorMessage(`AgentDNA: ${result.message}`);
                }
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AgentDNA Pull 失败: ${errorMessage}`);
    }
}

