import * as os from 'os';
import * as path from 'path';

export interface DocumentSetPaths {
    rules: string;
    workflows: string;
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
     * Get the target paths for the global documents based on the current platform
     */
    static getGlobalPaths(): DocumentSetPaths {
        const platform = process.platform;
        const homeDir = os.homedir();

        let geminiRoot: string;

        switch (platform) {
            case 'win32':
                // Windows: %USERPROFILE%/.gemini
                // Note: user profile directory is effectively homedir in Node
                geminiRoot = path.join(homeDir, '.gemini');
                break;
            case 'darwin':
            case 'linux':
            default:
                // Unix-like: ~/.gemini
                geminiRoot = path.join(homeDir, '.gemini');
                break;
        }

        return {
            rules: path.join(geminiRoot, 'GEMINI.md'),
            workflows: path.join(geminiRoot, 'antigravity', 'global_workflows'),
            skills: path.join(geminiRoot, 'antigravity', 'skills')
        };
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
