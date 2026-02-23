import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathResolver, DocumentSetPaths } from './PathResolver';

export interface DocumentSet {
    rules: { enabled: boolean; repoSubPath: string; globalPath: string; };
    workflows: { enabled: boolean; repoSubPath: string; globalPath: string; };
    skills: { enabled: boolean; repoSubPath: string; globalPath: string; };
}

export interface SyncResult {
    success: boolean;
    message: string;
}

export class DocumentSyncService {

    /**
     * Get the current DocumentSet configuration based on user settings
     */
    static getDocumentSet(): DocumentSet {
        const config = vscode.workspace.getConfiguration('agentDna');
        const globalPaths = PathResolver.getGlobalPaths();

        return {
            rules: {
                enabled: config.get<boolean>('syncRules', true),
                repoSubPath: 'rules/GEMINI.md',
                globalPath: globalPaths.rules
            },
            workflows: {
                enabled: config.get<boolean>('syncWorkflows', true),
                repoSubPath: 'workflows',
                globalPath: globalPaths.workflows
            },
            skills: {
                enabled: config.get<boolean>('syncSkills', true),
                repoSubPath: 'skills',
                globalPath: globalPaths.skills
            }
        };
    }

    /**
     * Helper to recursively copy a directory. 
     * Handles creating target directories and preserving existing unique files.
     */
    private async copyDirectory(source: string, target: string): Promise<void> {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            // Skip git directories
            if (entry.name === '.git') continue;

            const srcPath = path.join(source, entry.name);
            const destPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    /**
     * Helper to copy a single file, ensuring the target directory exists
     */
    private copySingleFile(source: string, target: string): void {
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(source, target);
    }

    /**
     * Deploy documents from the cloned repository to the user's global directories (Pull)
     */
    async deployToGlobal(cloneDir: string, docSet: DocumentSet): Promise<SyncResult> {
        try {
            // 1. Rules (Single File)
            if (docSet.rules.enabled) {
                const srcRulePath = path.join(cloneDir, 'rules', 'GEMINI.md');
                // Support legacy AGENT.md for seamless migration during Pull
                const legacySrcPath = path.join(cloneDir, 'AGENT.md');

                if (fs.existsSync(srcRulePath)) {
                    this.copySingleFile(srcRulePath, docSet.rules.globalPath);
                } else if (fs.existsSync(legacySrcPath)) {
                    this.copySingleFile(legacySrcPath, docSet.rules.globalPath);
                }
            }

            // 2. Workflows (Directory)
            if (docSet.workflows.enabled) {
                const srcWorkflowsPath = path.join(cloneDir, 'workflows');
                if (fs.existsSync(srcWorkflowsPath)) {
                    await this.copyDirectory(srcWorkflowsPath, docSet.workflows.globalPath);
                }
            }

            // 3. Skills (Directory)
            if (docSet.skills.enabled) {
                const srcSkillsPath = path.join(cloneDir, 'skills');
                if (fs.existsSync(srcSkillsPath)) {
                    await this.copyDirectory(srcSkillsPath, docSet.skills.globalPath);
                }
            }

            return { success: true, message: '全局文档已部署' };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { success: false, message: `部署失败: ${msg}` };
        }
    }

    /**
     * Collect local documents into the clone directory for pushing (Normal Merge Push)
     */
    async collectFromGlobal(cloneDir: string, docSet: DocumentSet): Promise<void> {
        // Collect Rules
        if (docSet.rules.enabled && fs.existsSync(docSet.rules.globalPath)) {
            this.copySingleFile(docSet.rules.globalPath, path.join(cloneDir, 'rules', 'GEMINI.md'));
        }

        // Collect Workflows
        if (docSet.workflows.enabled && fs.existsSync(docSet.workflows.globalPath)) {
            await this.copyDirectory(docSet.workflows.globalPath, path.join(cloneDir, 'workflows'));
        }

        // Collect Skills
        if (docSet.skills.enabled && fs.existsSync(docSet.skills.globalPath)) {
            await this.copyDirectory(docSet.skills.globalPath, path.join(cloneDir, 'skills'));
        }
    }

    /**
     * Clear specifically managed directories before a force push
     */
    private clearManagedDirectories(cloneDir: string, docSet: DocumentSet): void {
        if (docSet.rules.enabled) {
            const rulesDir = path.join(cloneDir, 'rules');
            if (fs.existsSync(rulesDir)) fs.rmSync(rulesDir, { recursive: true, force: true });

            // Allow cleaning up legacy file if we are force pushing rules
            const legacyPath = path.join(cloneDir, 'AGENT.md');
            if (fs.existsSync(legacyPath)) fs.rmSync(legacyPath, { force: true });
        }

        if (docSet.workflows.enabled) {
            const wfDir = path.join(cloneDir, 'workflows');
            if (fs.existsSync(wfDir)) fs.rmSync(wfDir, { recursive: true, force: true });
        }

        if (docSet.skills.enabled) {
            const skillsDir = path.join(cloneDir, 'skills');
            if (fs.existsSync(skillsDir)) fs.rmSync(skillsDir, { recursive: true, force: true });
        }
    }

    /**
     * Force collect: clears remote content first, then copies local, enabling a true overwrite (Force Push)
     */
    async forceCollectFromGlobal(cloneDir: string, docSet: DocumentSet): Promise<void> {
        // 1. Clear directories FIRST, respecting the 'enabled' state
        this.clearManagedDirectories(cloneDir, docSet);

        // 2. Perform normal collection to populate the newly cleared directories
        await this.collectFromGlobal(cloneDir, docSet);
    }
}
