# AgentDNA 插件打包与发布指南

本文档详细介绍了如何将 AgentDNA 插件打包成 `.vsix` 文件以及发布到 Visual Studio Code 插件市场的流程。

## 1. 环境准备 (Prerequisites)

在开始之前，请确保你已经安装了 `vsce` (Visual Studio Code Extensions) 命令行工具。这是官方提供的打包和发布工具。

你可以全局安装：

```bash
npm install -g @vscode/vsce
```

或者使用 `npx` 直接运行（推荐）：

```bash
npx vsce --version
```

## 2. 打包 (Packaging)

如果你需要生成 `.vsix` 文件进行本地安装、测试或分享给他人，请按照以下步骤操作：

### 2.1 更新版本号
在 `package.json` 文件中，根据 [SemVer](https://semver.org/) 规范更新 `version` 字段。例如，从 `0.1.0` 更新到 `0.1.1`。

### 2.2 运行打包命令
在项目根目录下运行：

```bash
npx vsce package
```

此命令会自动执行 `npm run compile` 进行编译。成功后，根目录下会生成一个名为 `agent-dna-x.x.x.vsix` 的文件（其中 `x.x.x` 是你的版本号）。

### 2.3 本地安装测试
你可以通过以下命令直接安装生成的 `.vsix` 文件：

```bash
code --install-extension agent-dna-0.1.0.vsix
```
（请将 `0.1.0` 替换为你实际打包的版本号）

或者在 VS Code 的扩展视图中，点击右上角的 `...` 菜单，选择 "Install from VSIX..."。

## 3. 发布到插件市场 (Publishing)

要让所有用户都能在 VS Code 插件商店中搜索并安装你的插件，你需要将其发布到 Visual Studio Marketplace。

### 3.1 创建发布者 (Publisher)
当前 `package.json` 中的 `publisher` 为 `HaizhouWang`。如果你还没有创建该 Publisher，请前往 [Marketplace Management Portal](https://marketplace.visualstudio.com/manage) 创建一个 ID 为 `HaizhouWang` 的发布者。

### 3.2 获取 Personal Access Token (PAT)
`vsce` 需要 Azure DevOps 的 Personal Access Token 来验证身份。

1. 登录 [Azure DevOps](https://dev.azure.com/)（如果没有组织，创建一个默认的即可）。
2. 进入 User Settings（右上角头像旁边的齿轮图标） -> **Personal access tokens**。
3. 点击 **+ New Token**。
4. **Name**: 随便起个名字，例如 "VS Code Marketplace"。
5. **Organization**: 选择 "All accessible organizations"。
6. **Scopes**: 选择 **Custom defined**。
7. 在下方点击 **Show all scopes**，找到 **Marketplace** 并勾选 **Manage**。
8. 点击 **Create**。
9. **复制生成的 Token**（请妥善保存，关闭页面后将无法再次查看）。

### 3.3 登录
在终端中使用 `vsce` 登录：

```bash
npx vsce login HaizhouWang
```
系统会提示你输入刚才获取的 Personal Access Token。

### 3.4 发布
登录成功后，运行以下命令发布插件：

```bash
npx vsce publish
```

或者，你可以在发布时指定版本提升（这会自动更新 `package.json` 中的版本）：

```bash
npx vsce publish patch  # 自动增加修订号 (0.1.0 -> 0.1.1)
npx vsce publish minor  # 自动增加次版本号 (0.1.0 -> 0.2.0)
npx vsce publish major  # 自动增加主版本号 (1.0.0 -> 2.0.0)
```

发布成功后，通常需要几分钟时间验证，验证通过后即可在市场中搜索到。

## 4. 重要注意事项

### `.vscodeignore`
打包时，`vsce` 会根据 `.vscodeignore` 文件排除不需要的文件。请确保以下文件/目录 **不会** 被忽略（即不要在 `.vscodeignore` 中列出）：
- `dist/` (编译后的代码)
- `README.md`
- `LICENSE`
- `package.json`
- `images/` (如果 README 中使用了图片)

常见的应被忽略（Exclude）的文件：
- `src/` (源码)
- `.git/`
- `.vscode/`
- `node_modules/` (如果使用了 Webpack/esbuild 打包。但在本项目中，如果没有使用打包工具且 `simple-git` 是运行时依赖，则 **不要** 忽略 `node_modules`，或者确保配置正确)

### README.md
插件市场的展示页面直接使用项目的 `README.md`。发布前请确保文档清晰、美观，包含功能介绍、GIF 演示和使用说明。

### Repository
建议在 `package.json` 中添加代码仓库地址，方便用户提交 Issue：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/zhoushanghai/AgentDNA.git"
}
```
