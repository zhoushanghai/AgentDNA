import simpleGit from 'simple-git';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PathResolver } from './PathResolver';

const execAsync = promisify(exec);

export class GitService {
    private rulesDir: string;

    constructor() {
        this.rulesDir = PathResolver.getCloneDir();
    }

    /**
     * Get the rules directory path
     */
    getRulesDir(): string {
        return this.rulesDir;
    }

    /**
     * Check if the rules repository already exists locally
     */
    isRepoExists(): boolean {
        return fs.existsSync(path.join(this.rulesDir, '.git'));
    }

    /**
     * Convert HTTPS URL to include token for authentication
     * https://github.com/user/repo.git -> https://TOKEN@github.com/user/repo.git
     */
    private getAuthenticatedUrl(repoUrl: string, token?: string): string {
        if (!token) {
            return repoUrl;
        }

        // Only process HTTPS URLs
        if (repoUrl.startsWith('https://')) {
            return repoUrl.replace('https://', `https://${token}@`);
        }

        return repoUrl;
    }

    /**
     * Clone the repository using shell command
     */
    async clone(repoUrl: string, token?: string): Promise<void> {
        // Remove existing directory
        if (fs.existsSync(this.rulesDir)) {
            fs.rmSync(this.rulesDir, { recursive: true, force: true });
        }

        // Get authenticated URL if token is provided
        const cloneUrl = this.getAuthenticatedUrl(repoUrl, token);

        // Use git command directly with GIT_TERMINAL_PROMPT=0 to avoid password prompts
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

        try {
            await execAsync(`git clone "${cloneUrl}" "${this.rulesDir}"`, { env });
        } catch (error: any) {
            // Provide helpful error messages
            const errMsg = error.message || error.stderr || '';

            if (errMsg.includes('could not read Username') ||
                errMsg.includes('Authentication failed') ||
                errMsg.includes('terminal prompts disabled')) {
                throw new Error(
                    '无法访问仓库。请检查:\n' +
                    '1. 仓库 URL 是否正确\n' +
                    '2. 如果是私有仓库，请在设置中配置 GitHub Token'
                );
            }

            if (errMsg.includes('Repository not found')) {
                throw new Error('仓库不存在或无访问权限');
            }

            throw new Error(errMsg);
        }
    }

    /**
     * Pull latest changes from remote
     */
    async pull(repoUrl?: string, token?: string): Promise<void> {
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

        try {
            // Update remote URL if repoUrl and token are provided
            if (repoUrl) {
                const authenticatedUrl = this.getAuthenticatedUrl(repoUrl, token);
                await execAsync(`git -C "${this.rulesDir}" remote set-url origin "${authenticatedUrl}"`, { env });
            }

            // Pull
            // Use --rebase to avoid merge commits and handle divergent histories cleaner
            // Use --autostash to temporarily stash local changes if any appear (though usually we commit them)
            await execAsync(`git -C "${this.rulesDir}" pull --rebase --autostash`, { env });
        } catch (error: any) {
            const errMsg = error.message || error.stderr || '';

            if (errMsg.includes('ould not read Password') ||
                errMsg.includes('Authentication failed') ||
                errMsg.includes('Permission denied')) {
                throw new Error('认证失败。请检查 GitHub Token 是否正确且未过期。');
            }
            throw new Error(`Pull Failed: ${errMsg}`);
        }
    }

    /**
     * Get the status of the repository
     */
    async getStatus(dir: string): Promise<{ isClean: () => boolean }> {
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
        const status = await execAsync(`git -C "${dir}" status --porcelain`, { env });
        return {
            isClean: () => !status.stdout || status.stdout.trim() === ''
        };
    }

    /**
     * Commit changes in the repository
     */
    async commit(dir: string, message: string): Promise<void> {
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
        await execAsync(`git -C "${dir}" add .`, { env });
        await execAsync(`git -C "${dir}" commit -m "${message}"`, { env });
    }

    /**
     * Push changes to remote
     */
    async push(dir: string): Promise<void> {
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
        await execAsync(`git -C "${dir}" push`, { env });
    }

    /**
     * Force push changes to remote
     */
    async forcePush(dir: string): Promise<void> {
        const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
        await execAsync(`git -C "${dir}" push --force`, { env });
    }

    /**
     * Clone or update the repository
     */
    async syncRepo(repoUrl: string, token?: string): Promise<void> {
        if (this.isRepoExists()) {
            await this.pull(repoUrl, token);
        } else {
            await this.clone(repoUrl, token);
        }
    }

    /**
     * Check if the repository has the v3 structure (contains rules/ or skills/ directories)
     */
    validateRepoStructure(dir: string = this.rulesDir): { isV3: boolean; isLegacy: boolean } {
        const hasRulesDir = fs.existsSync(path.join(dir, 'rules'));
        const hasSkillsDir = fs.existsSync(path.join(dir, 'skills'));
        // Legacy AGENT.md check at root
        const hasAgentMd = fs.existsSync(path.join(dir, 'AGENT.md'));

        const isV3 = hasRulesDir || hasSkillsDir;

        return {
            isV3,
            isLegacy: hasAgentMd && !isV3
        };
    }

    /**
     * Commit and push changes to the repository (legacy helper)
     */
    async commitAndPush(message: string, token?: string): Promise<void> {
        await this.commit(this.rulesDir, message);
        await this.push(this.rulesDir);
    }
}
