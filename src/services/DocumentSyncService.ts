import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathResolver, DocumentSetPaths } from './PathResolver';
import { FormatAdapter } from './FormatAdapter';
import { GitService } from './GitService';

export interface DocumentSet {
    rules: { enabled: boolean; repoSubPath: string; globalPath: string; };
    skills: { enabled: boolean; repoSubPath: string; globalPath: string; };
}

export interface SyncResult {
    success: boolean;
    message: string;
}

export class DocumentSyncService {
    private gitService: GitService;

    constructor() {
        this.gitService = new GitService();
    }

    /**
     * Get the current DocumentSet configuration (Legacy)
     */
    static getDocumentSet(): DocumentSet {
        const config = vscode.workspace.getConfiguration('agentDna');
        const toolPaths = PathResolver.getToolPaths('antigravity'); // Default to antigravity for legacy

        return {
            rules: {
                enabled: config.get<boolean>('agentDna.syncRules', true),
                repoSubPath: 'rules/GEMINI.md',
                globalPath: toolPaths.rules
            },
            skills: {
                enabled: config.get<boolean>('agentDna.syncSkills', true),
                repoSubPath: 'skills',
                globalPath: toolPaths.skills
            }
        };
    }

    /**
     * Deploy to global (Legacy Wrapper)
     */
    async deployToGlobal(repoRoot: string, docSet: DocumentSet): Promise<SyncResult> {
        return this.deployToTools(repoRoot, ['antigravity']);
    }

    /**
     * Collect from global (Legacy Wrapper)
     */
    async collectFromGlobal(repoRoot: string, docSet: DocumentSet): Promise<void> {
        await this.importFromTool(repoRoot, 'antigravity');
    }

    /**
     * Force collect from global (Legacy Wrapper)
     */
    async forceCollectFromGlobal(repoRoot: string, docSet: DocumentSet): Promise<void> {
        // For legacy, we just import normally as the new system handles merging/overwriting via FormatAdapter
        await this.importFromTool(repoRoot, 'antigravity');
    }

    /**
     * Push: Repo -> Tool(s)
     */
    async deployToTools(repoRoot: string, targets: ('antigravity' | 'claude')[]): Promise<SyncResult> {
        try {
            for (const target of targets) {
                const adapter = new FormatAdapter(target);
                const toolPaths = PathResolver.getToolPaths(target);
                await adapter.push(repoRoot, toolPaths.rules, toolPaths.skills);
            }
            return { success: true, message: `已成功部署到: ${targets.join(', ')}` };
        } catch (error) {
            return { success: false, message: `部署失败: ${error}` };
        }
    }

    /**
     * Import: Tool -> Repo
     */
    async importFromTool(repoRoot: string, source: 'antigravity' | 'claude'): Promise<SyncResult> {
        try {
            const adapter = new FormatAdapter(source);
            const toolPaths = PathResolver.getToolPaths(source);
            await adapter.pull(repoRoot, toolPaths.rules, toolPaths.skills);
            return { success: true, message: `已从 ${source} 成功保存改动到仓库` };
        } catch (error) {
            return { success: false, message: `提取失败: ${error}` };
        }
    }

    /**
     * Remote Push: Workspace -> Cache -> GitHub
     */
    async pushToRemote(repoRoot: string, cloneDir: string, force: boolean): Promise<SyncResult> {
        try {
            // 1. Sync current workspace files to cache dir
            await this.syncProjectToCache(repoRoot, cloneDir);

            // 2. Git operations in cache dir
            const status = await this.gitService.getStatus(cloneDir);
            if (!status.isClean()) {
                await this.gitService.commit(cloneDir, `sync: update rules/skills via AgentDNA ${new Date().toLocaleString()}`);
            }

            if (force) {
                await this.gitService.forcePush(cloneDir);
            } else {
                await this.gitService.push(cloneDir);
            }
            return { success: true, message: '已成功归档到云端' };
        } catch (error) {
            return { success: false, message: `推送失败: ${error}` };
        }
    }

    /**
     * Remote Pull: GitHub -> Cache -> Workspace
     */
    async pullFromRemote(repoRoot: string, cloneDir: string): Promise<SyncResult> {
        try {
            // 1. Git pull to cache dir
            await this.gitService.pull(cloneDir);

            // 2. Sync cache files back to workspace
            await this.syncCacheToProject(cloneDir, repoRoot);

            return { success: true, message: '已从云端同步最新数据' };
        } catch (error) {
            return { success: false, message: `拉取失败: ${error}` };
        }
    }

    /**
     * Orchestrator: Local Tool -> Repo -> Remote
     */
    async syncLocalToRemote(repoRoot: string, cloneDir: string, source: 'antigravity' | 'claude', force: boolean): Promise<SyncResult> {
        // 1. Import from tool to repo
        const importResult = await this.importFromTool(repoRoot, source);
        if (!importResult.success) return importResult;

        // 2. Push from repo to remote
        return await this.pushToRemote(repoRoot, cloneDir, force);
    }

    /**
     * Orchestrator: Remote -> Repo -> Local Tools
     */
    async syncRemoteToLocal(repoRoot: string, cloneDir: string, targets: ('antigravity' | 'claude')[]): Promise<SyncResult> {
        // 1. Pull from remote to repo
        const pullResult = await this.pullFromRemote(repoRoot, cloneDir);
        if (!pullResult.success) return pullResult;

        // 2. Deploy from repo to tools
        return await this.deployToTools(repoRoot, targets);
    }

    /**
     * Internal Sync: Project Workspace -> Git Cache
     */
    private async syncProjectToCache(repoRoot: string, cloneDir: string): Promise<void> {
        // We only care about AGENT.md and skills/
        const agentFile = path.join(repoRoot, 'AGENT.md');
        const skillsDir = path.join(repoRoot, 'skills');

        if (fs.existsSync(agentFile)) {
            fs.copyFileSync(agentFile, path.join(cloneDir, 'AGENT.md'));
        }

        if (fs.existsSync(skillsDir)) {
            await this.copyDirectory(skillsDir, path.join(cloneDir, 'skills'));
        }
    }

    /**
     * Internal Sync: Git Cache -> Project Workspace
     */
    private async syncCacheToProject(cloneDir: string, repoRoot: string): Promise<void> {
        const agentFile = path.join(cloneDir, 'AGENT.md');
        const skillsDir = path.join(cloneDir, 'skills');

        if (fs.existsSync(agentFile)) {
            fs.copyFileSync(agentFile, path.join(repoRoot, 'AGENT.md'));
        }

        if (fs.existsSync(skillsDir)) {
            await this.copyDirectory(skillsDir, path.join(repoRoot, 'skills'));
        }
    }

    private async copyDirectory(src: string, dst: string): Promise<void> {
        if (!fs.existsSync(dst)) {
            fs.mkdirSync(dst, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const dstPath = path.join(dst, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, dstPath);
            } else {
                fs.copyFileSync(srcPath, dstPath);
            }
        }
    }
}
