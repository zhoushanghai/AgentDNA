# Change Log

All notable changes to the "AgentDNA" extension will be documented in this file.

## [0.2.0]

### Added
- **Copy-based Synchronization**: Replaced symbolic links with file copying for better isolation and stability.
- **Publish Command**: Added `AgentDNA: Publish (Push)` to push local changes to the remote repository.
- **Sync Local Projects**: Added `AgentDNA: Sync Local Projects` to sync changes to other local projects.
- **Quick Setup**: Added `AgentDNA: Quick Setup` command with a webview for easy configuration of Repository URL and Token.
- **Status Bar Integration**: Added status bar item for quick access to Sync/Publish commands.

### Changed
- Updated configuration to use `agentDna.config` for storing sensitive information (token).
- Improved error handling and user notifications.

## [0.1.0]

- Initial release
- Basic sync functionality using symbolic links
