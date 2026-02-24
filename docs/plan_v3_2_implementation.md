# Implementation Plan - AgentDNA v3.2 Multi-Format Sync

This plan details the technical implementation of the v3.2 multi-format sync architecture, including the format adapter, the control panel UI, and the repository restructure.

## Proposed Changes

### 1. Repository Restructure (Standardization)
- Move all files from `rules/` to the repository root.
- Rename `skills/<name>/examples/` to `skills/<name>/references/`.
- Rename `skills/<name>/resources/` to `skills/<name>/assets/`.
- Ensure `AGENT.md` is at the root.

### 2. Path & Configuration (`PathResolver.ts`, `TokenManager.ts`)
- Use `os.homedir()` to resolve `~/.gemini` and `~/.claude` paths reliably.
- Update `PathResolver` to handle the new root-level Open Source Standard structure.

### 3. Logic Layer (`FormatAdapter.ts`)
#### [NEW] `src/services/FormatAdapter.ts`
- Implement mapping logic:
    - `references/` <-> `examples/`
    - `assets/` <-> `resources/` (Antigravity)
    - `assets/template.md` <-> root `template.md` (Claude)
- Implement `push(target)` and `pull(source)` with lazy conversion (skip missing optional folders).

### 4. UI Layer (Control Panel Webview)
#### [NEW] `src/webview/controlPanel/`
- Create a modern, reactive control panel using HTML/CSS/JS.
- Sections: Source selection (Dropdown), Target selection (Checkboxes), Local Actions (Sync from Repo, Transfer from Source), Remote Actions (Push/Pull/Force).
- Settings block: Collapse/Expand for Git Remote and PAT.
- State persistence: Save user selections to `globalState`.

### 5. Service Layer (`DocumentSyncService.ts`)
- Update `push` and `pull` methods to call `FormatAdapter`.
- Integrate with the Webview to report progress and status.
- Implement "Silent Commit" logic for Push: `git add .` -> `git commit -m "sync: update"` -> `git push`.

## Checklist

### Phase 1: Preparation
- [ ] Move existing files to root and rename subdirectories according to the standard.
- [ ] Update `PathResolver.ts` to reflect the new structure.

### Phase 2: Core Logic
- [ ] Create `FormatAdapter.ts`.
- [ ] Add unit tests or verification scripts for conversion logic.

### Phase 3: Control Panel
- [ ] Implement the Webview provider and HTML/CSS template.
- [ ] Update Status Bar button command to open the panel.
- [ ] Integrate formatting logic into panel buttons.

### Phase 4: Final Integration
- [ ] Update `DocumentSyncService.ts` to use the new flow.
- [ ] Final end-to-end verification.

## Verification Plan

### Automated Tests
- Run `npm run compile` to ensure no regression.
- Create a test script `scripts/test_conversion.ts` to verify `FormatAdapter` mappings.

### Manual Verification
- Open the new Control Panel via Status Bar.
- Verify "Source" and "Target" selections are saved after reload.
- Click "Sync from Repo" and check if `~/.gemini` and `~/.claude` paths are updated correctly.
- Click "Save Changes" from a tool path and check if the repo root/skills folders are updated.
- Verify Git Push works without manual commit.
