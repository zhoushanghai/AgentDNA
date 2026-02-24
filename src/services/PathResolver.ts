import * as os from 'os';
import * as path from 'path';

export interface DocumentSetPaths {
    rules: string;
    skills: string;
}

export class PathResolver {
    /**
     * Get the platform-specific directory for storing the cloned repository cache
     */
    static getCloneDir(): string {
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
     * Get the target paths for the global documents based on the current platform and tool
     */
    static getToolPaths(tool: 'antigravity' | 'claude'): DocumentSetPaths {
        const homeDir = os.homedir();

        if (tool === 'claude') {
            return {
                rules: path.join(homeDir, '.claude', 'CLAUDE.md'),
                skills: path.join(homeDir, '.claude', 'skills')
            };
        } else {
            // Default: Antigravity
            return {
                rules: path.join(homeDir, '.gemini', 'GEMINI.md'),
                skills: path.join(homeDir, '.gemini', 'antigravity', 'skills')
            };
        }
    }

    /**
     * Get the legacy global paths (for backward compatibility during migration)
     */
    static getGlobalPaths(): DocumentSetPaths {
        return this.getToolPaths('antigravity');
    }

    /**
     * Safely resolve a path containing environment variables or tildes 
     */
    static resolve(inputPath: string): string {
        let resolved = inputPath;

        // Expand ~ to home directory
        if (resolved.startsWith('~')) {
            resolved = path.join(os.homedir(), resolved.slice(1));
        }

        // Expand Windows environment variables like %USERPROFILE%
        resolved = resolved.replace(/%([^%]+)%/g, (match, envVar) => {
            return process.env[envVar] || match;
        });

        // Normalize the path
        return path.normalize(resolved);
    }
}
