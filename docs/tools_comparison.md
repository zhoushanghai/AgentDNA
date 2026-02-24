"""
This document compares the directory structures and specifications of different AI Agent programming tools.
It covers:
- Open Source Standard (Official)
- Antigravity (Gemini Ecosystem)
- Claude Code (Anthropic Ecosystem)
"""

# Programming Tools Comparison: Agent Skill Standards

This document outlines the differences in directory structures and technical specifications between various AI tool ecosystems for developing Agent Skills.

## 1. Specification Overview

| Feature | Open Source Standard (Official) | Antigravity (Gemini) |   (Anthropic) |
| :--- | :--- | :--- | :--- |
| **Project Path** | Flexible (Usually in project) | `.agent/skills/` | `.claude/skills/` |
| **Global Path** | N/A | `~/.gemini/antigravity/skills/` | `~/.claude/skills/` |
| **Agent File** | `AGENT.md` (Project) | `~/.gemini/GEMINI.md` (Global) | `~/.claude/CLAUDE.md` (Global) |
| **Entry Point** | `SKILL.md` | `SKILL.md` | `SKILL.md` |
| **Reference Dir** | `references/` | `examples/` | `examples/` |
| **Resource Dir** | `assets/` | `resources/` | `template.md` (Root) |


---

## 2. Detailed Structure Comparison

### 2.1 Open Source Standard (Official Agent Skills)
The most general industry specification (Open Source Standard), emphasizing formal documentation and property-based naming.

```text
my-skill/
├── SKILL.md          # Core: Metadata + Instructions
├── scripts/          # Scripts: Executable code
├── references/       # References: Manuals, detailed docs
└── assets/           # Assets: Templates, images, static resources
```

### 2.2 Antigravity Version (Gemini Ecosystem)
Google's implementation, tailored for developer habits by reinterpreting "references" as "examples".

```text
.agent/skills/my-skill/
├── SKILL.md       # Main instructions (required)
├── scripts/       # Helper scripts (optional)
├── examples/      # Reference implementations (optional)
└── resources/     # Templates and other assets (optional)
```

### 2.3 Claude Code Version (Anthropic Ecosystem)
The most feature-rich format, optimizing for efficiency by exposing key templates at the root level.

```text
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill in
├── examples/
│   └── sample.md      # Example output showing expected format
└── scripts/
    └── validate.sh    # Script Claude can execute
```

---

## 3. Summary of Key Differences

- **Naming Philosophy**: Official Standard is formal, Antigravity is developer-centric, and Claude Code is performance-oriented.
- **Complexity**: Claude Code provides the highest flexibility with dynamic execution and deep metadata support.
- **Organization**: Antigravity and Claude Code group reference materials under `examples/`, while the Official Standard uses `references/`.

---

## 3. Agent Definition Files

Agent definition files (or "Instruction files") provide the high-level identity and behavioral rules for the AI.

| Tool | File Path | Scope |
| :--- | :--- | :--- |
| **Open Source** | `AGENT.md` | Project-level instructions |
| **Antigravity** | `~/.gemini/GEMINI.md` | Global user-defined rules & identity |
| **Claude Code** | `~/.claude/CLAUDE.md` | Global personal rules & configuration |

---

## 4. Data Sources

- **Claude Code**: [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- **Open Source Standard**: [What are skills? - Agent Skills](https://agentskills.io/what-are-skills)
- **Antigravity**: [Google Antigravity Documentation](https://antigravity.google/docs/skills)
