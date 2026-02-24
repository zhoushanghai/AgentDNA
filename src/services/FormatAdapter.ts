/**
 * FormatAdapter.ts
 * 
 * Handles bidirectional format translation between Open Source Standard
 * and specific AI tool formats (Antigravity, Claude Code).
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FormatMapping {
    repoPath: string;
    toolPath: string;
}

export class FormatAdapter {
    constructor(private tool: 'antigravity' | 'claude') { }

    /**
     * Map skill subdirectories based on the target tool
     */
    private getSkillMappings(skillName: string, repoRoot: string, toolSkillsRoot: string): FormatMapping[] {
        const repoSkillPath = path.join(repoRoot, 'skills', skillName);
        const toolSkillPath = path.join(toolSkillsRoot, skillName);

        const mappings: FormatMapping[] = [
            { repoPath: path.join(repoSkillPath, 'SKILL.md'), toolPath: path.join(toolSkillPath, 'SKILL.md') },
            { repoPath: path.join(repoSkillPath, 'scripts'), toolPath: path.join(toolSkillPath, 'scripts') },
            { repoPath: path.join(repoSkillPath, 'references'), toolPath: path.join(toolSkillPath, 'examples') },
        ];

        // Asset mapping differs by tool
        if (this.tool === 'antigravity') {
            mappings.push({
                repoPath: path.join(repoSkillPath, 'assets'),
                toolPath: path.join(toolSkillPath, 'resources')
            });
        } else if (this.tool === 'claude') {
            // Note: template.md in Claude is handled specially in push/pull logic
            mappings.push({
                repoPath: path.join(repoSkillPath, 'assets'),
                toolPath: path.join(toolSkillPath, 'resources')
            });
        }

        return mappings;
    }

    /**
     * Push: Repository (OS Standard) -> Tool Local Path
     */
    async push(repoRoot: string, toolRulesPath: string, toolSkillsRoot: string): Promise<void> {
        // 1. Agent file (AGENT.md -> GEMINI.md/CLAUDE.md)
        const agentSrc = path.join(repoRoot, 'AGENT.md');
        if (fs.existsSync(agentSrc)) {
            this.copyFile(agentSrc, toolRulesPath);
        }

        // 2. Skills
        const skillsDir = path.join(repoRoot, 'skills');
        if (!fs.existsSync(skillsDir)) return;

        const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const skill of skills) {
            const mappings = this.getSkillMappings(skill, repoRoot, toolSkillsRoot);
            const toolSkillPath = path.join(toolSkillsRoot, skill);

            for (const mapping of mappings) {
                if (fs.existsSync(mapping.repoPath)) {
                    if (fs.lstatSync(mapping.repoPath).isDirectory()) {
                        await this.copyDirectory(mapping.repoPath, mapping.toolPath);
                    } else {
                        this.copyFile(mapping.repoPath, mapping.toolPath);
                    }
                }
            }

            // Claude specific: assets/template.md -> root/template.md
            if (this.tool === 'claude') {
                const templateSrc = path.join(repoRoot, 'skills', skill, 'assets', 'template.md');
                if (fs.existsSync(templateSrc)) {
                    this.copyFile(templateSrc, path.join(toolSkillPath, 'template.md'));
                }
            }
        }
    }

    /**
     * Pull: Tool Local Path -> Repository (OS Standard)
     */
    async pull(repoRoot: string, toolRulesPath: string, toolSkillsRoot: string): Promise<void> {
        // 1. Agent file (GEMINI.md/CLAUDE.md -> AGENT.md)
        if (fs.existsSync(toolRulesPath)) {
            this.copyFile(toolRulesPath, path.join(repoRoot, 'AGENT.md'));
        }

        // 2. Skills
        if (!fs.existsSync(toolSkillsRoot)) return;

        const skills = fs.readdirSync(toolSkillsRoot, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const skill of skills) {
            const mappings = this.getSkillMappings(skill, repoRoot, toolSkillsRoot);

            for (const mapping of mappings) {
                // Reverse mapping: toolPath is source here
                if (fs.existsSync(mapping.toolPath)) {
                    if (fs.lstatSync(mapping.toolPath).isDirectory()) {
                        await this.copyDirectory(mapping.toolPath, mapping.repoPath);
                    } else {
                        this.copyFile(mapping.toolPath, mapping.repoPath);
                    }
                }
            }

            // Claude specific: root/template.md -> assets/template.md
            if (this.tool === 'claude') {
                const templateSrc = path.join(toolSkillsRoot, skill, 'template.md');
                if (fs.existsSync(templateSrc)) {
                    this.copyFile(templateSrc, path.join(repoRoot, 'skills', skill, 'assets', 'template.md'));
                }
            }
        }
    }

    private copyFile(src: string, dst: string) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
    }

    private async copyDirectory(src: string, dst: string): Promise<void> {
        fs.mkdirSync(dst, { recursive: true });
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
