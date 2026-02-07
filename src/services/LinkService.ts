import * as fs from 'fs';
import * as path from 'path';

export class LinkService {
    /**
     * Check if a file exists at the given path
     */
    fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Check if a path is a symlink
     */
    isSymlink(filePath: string): boolean {
        try {
            const stats = fs.lstatSync(filePath);
            return stats.isSymbolicLink();
        } catch {
            return false;
        }
    }

    /**
     * Remove a file or symlink
     */
    remove(filePath: string): void {
        if (this.fileExists(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    /**
     * Create a symlink from source to target
     * @param sourcePath The actual file location (e.g., ~/.agent_dna/AGENT.md)
     * @param targetPath The symlink location (e.g., project/AGENT.md)
     */
    async createSymlink(sourcePath: string, targetPath: string): Promise<void> {
        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Create symlink
        await fs.promises.symlink(sourcePath, targetPath);
    }

    /**
     * Create a copy of the file from source to target
     * @param sourcePath The actual file location
     * @param targetPath The destination location
     */
    async copyFile(sourcePath: string, targetPath: string): Promise<void> {
        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy file
        await fs.promises.copyFile(sourcePath, targetPath);
    }

    /**
     * Get the target path for AGENT.md in the workspace
     */
    getWorkspaceAgentMdPath(workspaceRoot: string): string {
        return path.join(workspaceRoot, 'AGENT.md');
    }
}
