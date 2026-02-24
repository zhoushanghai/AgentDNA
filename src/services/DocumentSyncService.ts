import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from './PathResolver';
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

    private async resolveRepoUrl(cloneDir: string): Promise<string | undefined> {
        const config = vscode.workspace.getConfiguration('agentDna');
        const configuredUrl = (config.get<string>('repoUrl') || '').trim();
        if (configuredUrl) {
            return configuredUrl;
        }

        return await this.gitService.getRemoteUrl(cloneDir);
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
                repoSubPath: 'AGENT.md',
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
    async deployToTools(repoRoot: string, targets: ('antigravity' | 'claude' | 'codex')[]): Promise<SyncResult> {
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
    async importFromTool(repoRoot: string, source: 'antigravity' | 'claude' | 'codex'): Promise<SyncResult> {
        try {
            const adapter = new FormatAdapter(source);
            const toolPaths = PathResolver.getToolPaths(source);

            const hasRules = fs.existsSync(toolPaths.rules);
            const hasSkills = fs.existsSync(toolPaths.skills);
            if (!hasRules && !hasSkills) {
                return {
                    success: false,
                    message: `未找到 ${source} 的全局文档，请检查路径:\n- ${toolPaths.rules}\n- ${toolPaths.skills}`
                };
            }

            await adapter.pull(repoRoot, toolPaths.rules, toolPaths.skills);
            return { success: true, message: `已从 ${source} 成功保存改动到仓库` };
        } catch (error) {
            return { success: false, message: `提取失败: ${error}` };
        }
    }

    /**
     * Remote Push: Local OSS Cache -> GitHub
     */
    async pushToRemote(repoRoot: string, cloneDir: string, force: boolean, token?: string): Promise<SyncResult> {
        try {
            const repoUrl = await this.resolveRepoUrl(cloneDir);

            if (!repoUrl) {
                return { success: false, message: '请先配置仓库地址（agentDna.repoUrl）' };
            }

            // 1. Clone or sync the repository first
            await this.gitService.syncRepo(repoUrl, token);

            // 2. Sync local OSS-standard files to cache dir
            await this.syncProjectToCache(repoRoot, cloneDir);

            // 3. Git operations in cache dir
            const status = await this.gitService.getStatus(cloneDir);
            if (status.isClean()) {
                return { success: true, message: '检测到无变更，已跳过上传' };
            }

            await this.gitService.commit(cloneDir, `sync: update rules/skills via AgentDNA ${new Date().toLocaleString()}`);

            // 4. Push to remote with token
            if (force) {
                await this.gitService.forcePush(cloneDir, token);
            } else {
                await this.gitService.push(cloneDir, token);
            }
            return { success: true, message: '已成功归档到云端' };
        } catch (error) {
            return { success: false, message: `推送失败: ${error}` };
        }
    }

    /**
     * Remote Pull: GitHub -> Local OSS Cache
     */
    async pullFromRemote(repoRoot: string, cloneDir: string, token?: string): Promise<SyncResult> {
        try {
            const repoUrl = await this.resolveRepoUrl(cloneDir);

            if (!repoUrl) {
                return { success: false, message: '请先配置仓库地址（agentDna.repoUrl）' };
            }

            // 1. Clone or sync the repository first
            await this.gitService.syncRepo(repoUrl, token);

            // 2. Git pull to cache dir
            await this.gitService.pull(cloneDir, token);

            // 3. Sync cache files back to local OSS-standard files
            await this.syncCacheToProject(cloneDir, repoRoot);

            return { success: true, message: '已从云端同步最新数据' };
        } catch (error) {
            return { success: false, message: `拉取失败: ${error}` };
        }
    }

    /**
     * Orchestrator: Local Tool -> Repo -> Remote
     */
    async syncLocalToRemote(repoRoot: string, cloneDir: string, source: 'antigravity' | 'claude' | 'codex', force: boolean, token?: string): Promise<SyncResult> {
        // 1. Import from tool to repo
        const importResult = await this.importFromTool(repoRoot, source);
        if (!importResult.success) return importResult;

        // 2. Push from repo to remote
        return await this.pushToRemote(repoRoot, cloneDir, force, token);
    }

    /**
     * Orchestrator: Remote -> Repo -> Local Tools
     */
    async syncRemoteToLocal(repoRoot: string, cloneDir: string, targets: ('antigravity' | 'claude' | 'codex')[], token?: string): Promise<SyncResult> {
        // 1. Pull from remote to repo
        const pullResult = await this.pullFromRemote(repoRoot, cloneDir, token);
        if (!pullResult.success) return pullResult;

        // 2. Deploy from repo to tools
        return await this.deployToTools(repoRoot, targets);
    }

    /**
     * Internal Sync: Local OSS files -> Git Cache
     */
    private async syncProjectToCache(repoRoot: string, cloneDir: string): Promise<void> {
        // If source root and cache root are the same, no copy is needed.
        if (path.resolve(repoRoot) === path.resolve(cloneDir)) {
            return;
        }

        // OSS standard: AGENT.md and skills/
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
     * Internal Sync: Git Cache -> Local OSS files
     */
    private async syncCacheToProject(cloneDir: string, repoRoot: string): Promise<void> {
        // If cache root and destination root are the same, no copy is needed.
        if (path.resolve(repoRoot) === path.resolve(cloneDir)) {
            return;
        }

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
