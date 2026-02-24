# Plan: Remove Workflows and Consolidate into Skills

This plan details the steps to remove all workflow-related features and documentation from AgentDNA, as workflows have been merged into the skills system.

## Proposed Changes

### Configuration
#### [MODIFY] [package.json](file:///home/hz/ai_rules_tool/AgentDNA/package.json)
- Remove `agentDna.syncWorkflows` from the configuration properties.

### Path Resolution
#### [MODIFY] [PathResolver.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/services/PathResolver.ts)
- Remove `workflows` from `DocumentSetPaths` interface.
- Remove `workflows` from `getGlobalPaths` return object.

### Sync Service
#### [MODIFY] [DocumentSyncService.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/services/DocumentSyncService.ts)
- Remove `workflows` from `DocumentSet` interface.
- Remove `workflows` from `getDocumentSet` return object.
- Remove workflow synchronization logic from `deployToGlobal`, `collectFromGlobal`, and `clearManagedDirectories`.

### Webview UI
#### [MODIFY] [setupWebview.ts](file:///home/hz/ai_rules_tool/AgentDNA/src/commands/setupWebview.ts)
- Remove `syncWorkflows` from `_saveConfiguration` and `_getHtmlForWebview`.
- Remove the checkbox for "Workflows" in the setup UI.

### Cleanup
- No cleanup of global directories is required as per user instruction. The focus is on project-level synchronization logic and UI.

## Checklist
- ✅ ~~Remove `agentDna.syncWorkflows` from `package.json`~~ <!-- id: 10 -->
- ✅ ~~Update `DocumentSetPaths` and `getGlobalPaths` in `PathResolver.ts`~~ <!-- id: 11 -->
- ✅ ~~Update `DocumentSet` and sync logic in `DocumentSyncService.ts`~~ <!-- id: 12 -->
- ✅ ~~Remove workflow options from `setupWebview.ts`~~ <!-- id: 13 -->
- ✅ ~~Update `PROJECT_MAP.md` to remove workflow references~~ <!-- id: 15 -->
- ✅ ~~Update `DEV_LOG.md` with the changes~~ <!-- id: 16 -->

## Verification Plan
### Manual Verification
- [ ] Build the extension and open the Settings webview.
- [ ] Verify that the "Workflows" checkbox is no longer present.
- [ ] Run a sync (Pull/Push) and verify that it no longer attempts to process a `workflows/` directory.
