import * as vscode from 'vscode';
import { ProjectRegistry } from '../services/ProjectRegistry';
import { LinkService } from '../services/LinkService';
import { GitService } from '../services/GitService';

export async function syncToLocalProjects(): Promise<void> {
    const registry = ProjectRegistry.getInstance();
    const linkService = new LinkService();
    const gitService = new GitService();
    const sourcePath = gitService.getAgentMdPath();

    await registry.cleanRegistry();
    const projects = registry.getProjects();

    if (projects.length === 0) {
        vscode.window.showInformationMessage('AgentDNA: 没有其他已知的项目需要同步。');
        return;
    }

    let updatedCount = 0;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: '正在同步到本地项目...',
            cancellable: false
        },
        async (progress) => {
            for (const projectRoot of projects) {
                const targetPath = linkService.getWorkspaceAgentMdPath(projectRoot);

                // Only update if AGENT.md exists (meaning it's an active AgentDNA project)
                if (linkService.fileExists(targetPath)) {
                    try {
                        // We assumes isolation mode (copy), so we overwrite.
                        // If it was a symlink, copyFile will overwrite it with a file copy? 
                        // fs.copyFile follows symlinks by default for source, but for target?
                        // If target is symlink, it overwrites the link or the target?
                        // Node's copyFile overwrites the target file. If target is symlink, it writes to the destination of the link?
                        // We should probably check and unlink first to be safe and ensure it breaks the link.

                        // BUT: We want to break symlinks anyway based on new design.
                        if (linkService.isSymlink(targetPath)) {
                            linkService.remove(targetPath);
                        }

                        await linkService.copyFile(sourcePath, targetPath);
                        updatedCount++;
                    } catch (e) {
                        console.error(`Failed to update project ${projectRoot}: ${e}`);
                    }
                }
            }
        }
    );

    vscode.window.showInformationMessage(`AgentDNA: 已将规则同步到 ${updatedCount} 个本地项目。`);
}
