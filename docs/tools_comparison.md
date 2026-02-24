"""
This document compares the directory structures and specifications of different AI agent tooling ecosystems.
It covers:
- Open Source Standard (official agent skills specification)
- Antigravity (Gemini ecosystem)
- Claude Code (Anthropic ecosystem)
- Codex (OpenAI ecosystem)
"""

# Programming Tools Comparison: Agent Standards

## 1. Specification Overview

| Feature | Open Source Standard (Official) | Antigravity (Gemini) | Claude Code (Anthropic) | Codex (OpenAI) |
| :--- | :--- | :--- | :--- | :--- |
| **Core instruction file** | `AGENT.md` | `~/.gemini/GEMINI.md` | `~/.claude/CLAUDE.md` | `AGENTS.md` / `AGENTS.override.md` |
| **Instruction scope** | Usually project-level | Global | Global | Global + project chain merge |
| **Skill entry file** | `SKILL.md` | `SKILL.md` | `SKILL.md` | `SKILL.md` |
| **References dir** | `references/` | `examples/` | `examples/` | `references/` |
| **Assets/resources dir** | `assets/` | `resources/` | often `template.md` + resources | `assets/` |

---

## 2. Skill Structure Comparison

### 2.1 Open Source Standard

```text
my-skill/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

### 2.2 Antigravity (Gemini)

```text
.agent/skills/my-skill/
├── SKILL.md
├── scripts/
├── examples/
└── resources/
```

### 2.3 Claude Code

```text
~/.claude/skills/my-skill/
├── SKILL.md
├── template.md
├── examples/
└── scripts/
```

### 2.4 Codex

```text
my-skill/
├── SKILL.md                # required, with name + description frontmatter
├── scripts/                # optional
├── references/             # optional
├── assets/                 # optional
└── agents/openai.yaml      # optional metadata
```

---

## 3. Codex Instruction Discovery (AGENTS.md)

Codex builds an instruction chain in this order:

1. Global: `~/.codex/AGENTS.override.md` or `~/.codex/AGENTS.md` (first non-empty).
2. Project path walk: from repo root to current directory, one file per directory with priority:
   `AGENTS.override.md` -> `AGENTS.md` -> fallback filenames from config.
3. Merge order: root to leaf; closer files override earlier guidance by appearing later.

Key config:

- `project_doc_fallback_filenames`
- `project_doc_max_bytes` (default 32 KiB)
- `CODEX_HOME` (changes Codex home from default `~/.codex`)

---

## 4. Codex Skills Scope and Installation

Codex supports skills from multiple scopes:

- REPO: `.agents/skills` from current directory up to repo root
- USER: `~/.agents/skills`
- ADMIN: `/etc/codex/skills`
- SYSTEM: built-in skills

Skill installation helper behavior (skill-installer):

- Default install target: `$CODEX_HOME/skills` (usually `~/.codex/skills`)
- Supports curated skills, experimental skills, and GitHub path install
- Supports private repos via existing git credentials or `GITHUB_TOKEN` / `GH_TOKEN`

---

## 5. Agent Definition Files

| Tool | File Path | Scope |
| :--- | :--- | :--- |
| Open Source Standard | `AGENT.md` | Project-level |
| Antigravity | `~/.gemini/GEMINI.md` | Global |
| Claude Code | `~/.claude/CLAUDE.md` | Global |
| Codex | `~/.codex/AGENTS.md` (global) + project `AGENTS*.md` chain | Global + project merged |

---

## 6. Summary

- Open Source Standard is the neutral storage format (`AGENT.md` + `skills/` style).
- Antigravity and Claude Code mainly differ in naming/path conventions.
- Codex adds a hierarchical instruction system (`AGENTS.md`) and multi-scope skill loading.
- For cross-tool sync products, use Open Source Standard as hub, and adapt per tool on import/export.
