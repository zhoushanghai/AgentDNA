/**
 * orchestratorCommands.ts
 * 整合了“本地到云端”和“云端到本地”两个简化同步操作的命令实现。
 */
import * as vscode from 'vscode';
import { DocumentSyncService } from '../services/DocumentSyncService';
import { PathResolver } from '../services/PathResolver';

export async function syncLocalToRemote() {
    const config = vscode.workspace.getConfiguration('agentDna');
    const source = config.get<'antigravity' | 'claude'>('lastSource', 'antigravity');
    const repoRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const cloneDir = PathResolver.getCloneDir();

    if (!repoRoot) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `AgentDNA: 正在将本地 ${source} 更改同步到云端...`,
        cancellable: false
    }, async () => {
        const service = new DocumentSyncService();
        const result = await service.syncLocalToRemote(repoRoot, cloneDir, source, false);
        if (result.success) {
            vscode.window.showInformationMessage(result.message);
        } else {
            vscode.window.showErrorMessage(result.message);
        }
    });
}

export async function syncRemoteToLocal() {
    const repoRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const cloneDir = PathResolver.getCloneDir();

    if (!repoRoot) return;

    const targets: ('antigravity' | 'claude')[] = ['antigravity', 'claude']; // Default to both or read from config

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "AgentDNA: 正在将云端更新同步到本地工具...",
        cancellable: false
    }, async () => {
        const service = new DocumentSyncService();
        const result = await service.syncRemoteToLocal(repoRoot, cloneDir, targets);
        if (result.success) {
            vscode.window.showInformationMessage(result.message);
        } else {
            vscode.window.showErrorMessage(result.message);
        }
    });
}
