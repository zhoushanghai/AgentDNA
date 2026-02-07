import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectRegistry {
    private static readonly STORAGE_KEY = 'agentDna.knownProjects';
    private static instance: ProjectRegistry;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    static init(context: vscode.ExtensionContext) {
        ProjectRegistry.instance = new ProjectRegistry(context);
    }

    static getInstance(): ProjectRegistry {
        if (!ProjectRegistry.instance) {
            throw new Error('ProjectRegistry not initialized');
        }
        return ProjectRegistry.instance;
    }

    /**
     * Add a project path to the registry
     */
    async addProject(projectPath: string): Promise<void> {
        const existing = this.getProjects();
        if (!existing.includes(projectPath)) {
            existing.push(projectPath);
            await this.context.globalState.update(ProjectRegistry.STORAGE_KEY, existing);
        }
    }

    /**
     * Get all registered project paths
     */
    getProjects(): string[] {
        return this.context.globalState.get<string[]>(ProjectRegistry.STORAGE_KEY, []);
    }

    /**
     * Remove invalid paths
     */
    async cleanRegistry(): Promise<void> {
        const existing = this.getProjects();
        const valid = existing.filter(p => fs.existsSync(p));
        if (valid.length !== existing.length) {
            await this.context.globalState.update(ProjectRegistry.STORAGE_KEY, valid);
        }
    }
}
