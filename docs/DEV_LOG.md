# DEV_LOG.md - 开发日志

## 1. 关键变更

- **[2026-02-23]** 重构 AgentDNA v3 架构：
    - 引入 `DocumentSyncService` 核心同步逻辑，支持多文档类型（Rules, Workflows, Skills）。
    - 引入 `PathResolver` 统一跨平台路径管理。
    - 移除 v2 时代的冗余服务（`LinkService`, `GitIgnoreService`, `ProjectRegistry`）。
    - 重载 `syncRules`, `publishRules` 状态机以支持全局同步模式。
    - 新增 `forcePublish` 命令，支持强制覆盖远程仓库。
    - 更新 `README.md` 和 `PROJECT_MAP.md` 以匹配 v3 设计。

## 2. 关键命令

- **[2026-02-23]** `git commit`: refactor(core): 重构 AgentDNA v3 架构，实现多文档同步与路径解析 / refactor AgentDNA v3 architecture for multi-document sync and path resolution
