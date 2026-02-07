import simpleGit from 'simple-git';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitService {
    private rulesDir: string;

    constructor() {
        this.rulesDir = this.getPlatformSpecificRulesDir();
    }

    /**
     * Get the platform-specific directory for storing rules
     */
    private getPlatformSpecificRulesDir(): string {
        const platform = process.platform;
        const homeDir = os.homedir();

        switch (platform) {
            case 'win32':
                // Windows: %APPDATA%/AgentDNA
                return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'AgentDNA');
            case 'darwin':
                // macOS: ~/Library/Application Support/AgentDNA
                return path.join(homeDir, 'Library', 'Application Support', 'AgentDNA');
            case 'linux':
            default:
                // Linux/Other: ~/.agent_dna
                return path.join(homeDir, '.agent_dna');
        }
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
    async pull(): Promise<void> {
        const git = simpleGit(this.rulesDir);
        await git.pull();
    }

    /**
     * Clone or update the repository
     */
    async syncRepo(repoUrl: string, token?: string): Promise<void> {
        if (this.isRepoExists()) {
            await this.pull();
        } else {
            await this.clone(repoUrl, token);
        }
    }

    /**
     * Check if AGENT.md exists in the rules directory
     */
    hasAgentMd(): boolean {
        return fs.existsSync(path.join(this.rulesDir, 'AGENT.md'));
    }

    /**
     * Get the path to AGENT.md in the rules directory
     */
    getAgentMdPath(): string {
        return path.join(this.rulesDir, 'AGENT.md');
    }
}
