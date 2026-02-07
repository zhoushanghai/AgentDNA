import * as fs from 'fs';
import * as path from 'path';

export class GitIgnoreService {
    private readonly ignoreFileName = '.gitignore';
    private readonly targetFile = 'AGENT.md';

    /**
     * Check if .gitignore exists in the workspace
     */
    hasGitIgnore(workspaceRoot: string): boolean {
        const ignorePath = path.join(workspaceRoot, this.ignoreFileName);
        return fs.existsSync(ignorePath);
    }

    /**
     * Update .gitignore based on preference
     * @param workspaceRoot The root directory of the workspace
     * @param includeInGit If true, remove AGENT.md from .gitignore (track it). 
     *                     If false, add AGENT.md to .gitignore (ignore it).
     */
    update(workspaceRoot: string, includeInGit: boolean): void {
        const ignorePath = path.join(workspaceRoot, this.ignoreFileName);

        if (!fs.existsSync(ignorePath)) {
            return;
        }

        let content = fs.readFileSync(ignorePath, 'utf8');
        const lines = content.split(/\r?\n/);

        const isIgnored = lines.some(line => line.trim() === this.targetFile);

        if (includeInGit) {
            // User wants to track it, so REMOVE from .gitignore
            if (isIgnored) {
                // Filter out the line, preserving other content
                const newLines = lines.filter(line => line.trim() !== this.targetFile);
                const newContent = newLines.join('\n');
                fs.writeFileSync(ignorePath, newContent, 'utf8');
            }
        } else {
            // User wants to ignore it, so ADD to .gitignore
            if (!isIgnored) {
                // Determine if we need a newline prefix
                // If file is not empty and doesn't end with newline, add one
                const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
                fs.appendFileSync(ignorePath, `${prefix}${this.targetFile}\n`, 'utf8');
            }
        }
    }
}
