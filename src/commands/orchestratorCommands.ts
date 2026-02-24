/**
 * orchestratorCommands.ts
 * 整合了“本地到云端”和“云端到本地”两个简化同步操作的命令实现。
 */
import * as vscode from 'vscode';
import { DocumentSyncService } from '../services/DocumentSyncService';
import { PathResolver } from '../services/PathResolver';
import { TokenManager } from '../services/TokenManager';

export async function syncLocalToRemote() {
    const config = vscode.workspace.getConfiguration('agentDna');
    const source = config.get<'antigravity' | 'claude' | 'codex'>('lastSource', 'antigravity');
    const cloneDir = PathResolver.getCloneDir();
    const repoRoot = cloneDir;
    const token = await TokenManager.getInstance().getToken();

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `AgentDNA: 正在将本地 ${source} 更改同步到云端...`,
        cancellable: false
    }, async () => {
        const service = new DocumentSyncService();
        const result = await service.syncLocalToRemote(repoRoot, cloneDir, source, false, token);
        if (result.success) {
            vscode.window.showInformationMessage(result.message);
        } else {
            vscode.window.showErrorMessage(result.message);
        }
    });
}

export async function syncRemoteToLocal() {
    const cloneDir = PathResolver.getCloneDir();
    const repoRoot = cloneDir;
    const token = await TokenManager.getInstance().getToken();

    const targets: ('antigravity' | 'claude' | 'codex')[] = ['antigravity', 'claude', 'codex']; // Default to all or read from config

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "AgentDNA: 正在将云端更新同步到本地工具...",
        cancellable: false
    }, async () => {
        const service = new DocumentSyncService();
        const result = await service.syncRemoteToLocal(repoRoot, cloneDir, targets, token);
        if (result.success) {
            vscode.window.showInformationMessage(result.message);
        } else {
            vscode.window.showErrorMessage(result.message);
        }
    });
}
