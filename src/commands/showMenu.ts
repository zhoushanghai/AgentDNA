import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';
import { GitIgnoreService } from '../services/GitIgnoreService';

export async function showMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl');

    // Main Menu Items
    const items: vscode.QuickPickItem[] = [];

    if (repoUrl) {
        items.push({
            label: '$(sync) 立即同步',
            description: '从 GitHub 同步 AGENT.md',
            detail: `Repo: ${repoUrl}`,
            command: 'agentDna.sync'
        } as any);
    } else {
        items.push({
            label: '$(alert) 立即同步 (未配置)',
            description: '点击进行初始配置',
            detail: '设置仓库地址后才能开始同步',
            command: 'agentDna.quickSetup'
        } as any);
    }

    items.push({
        label: '$(gear) 设置',
        description: '配置仓库地址和 Token',
        command: 'agentDna.showSettings'
    } as any);

    // Git Tracking Option
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitIgnoreService = new GitIgnoreService();

        if (gitIgnoreService.hasGitIgnore(workspaceRoot)) {
            const includeInGit = config.get<boolean>('includeInGit', false);
            items.push({
                label: includeInGit ? '$(check) Git 追踪: 已启用' : '$(circle-slash) Git 追踪: 已禁用',
                description: includeInGit ? 'AGENT.md 将被提交到仓库' : 'AGENT.md 被忽略 (推荐)',
                detail: '点击切换是否将规则文件加入版本控制',
                command: 'agentDna.toggleGitTracking' // Custom command handled below
            } as any);
        } else {
            items.push({
                label: '$(circle-slash) Git 追踪: 不可用',
                description: '当前目录未找到 .gitignore 文件',
                detail: '请先创建 .gitignore 文件以启用此功能',
                command: 'agentDna.showGitIgnoreInfo'
            } as any);
        }
    }

    // Show menu
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'AgentDNA 控制台 - 选择操作',
        title: 'AgentDNA'
    });

    if (selection) {
        const item = selection as any;
        if (item.command) {
            if (item.command === 'agentDna.showSettings') {
                await showSettingsSubMenu();
            } else if (item.command === 'agentDna.quickSetup') {
                await quickSetup();
            } else if (item.command === 'agentDna.toggleGitTracking') {
                const current = config.get<boolean>('includeInGit', false);
                await config.update('includeInGit', !current, vscode.ConfigurationTarget.Global);
                // Re-open menu to show updated state
                showMenu();
            } else if (item.command === 'agentDna.showGitIgnoreInfo') {
                vscode.window.showInformationMessage('需要在项目根目录创建 .gitignore 文件，才能配置是否将 AGENT.md 加入版本控制。');
            } else {
                vscode.commands.executeCommand(item.command);
            }
        }
    }
}

async function showSettingsSubMenu(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const repoUrl = config.get<string>('repoUrl') || '';
    const hasToken = !!(await TokenManager.getInstance().getToken());

    const items: vscode.QuickPickItem[] = [
        {
            label: '$(wand) 配置向导',
            description: '重新运行初始配置',
            detail: '一步配置仓库地址和 Token',
            command: 'agentDna.quickSetup'
        } as any,
        {
            label: '$(link) 修改仓库地址',
            description: repoUrl || '未配置',
            detail: '单独修改仓库 URL',
            command: 'agentDna.setRepoUrl'
        } as any,
        {
            label: hasToken ? '$(check) 修改 GitHub Token' : '$(key) 配置 GitHub Token',
            description: hasToken ? '已设置' : '未设置',
            detail: '单独修改访问令牌',
            command: 'agentDna.setToken'
        } as any
    ];

    // Add Delete Configuration section separator or group
    items.push({
        label: '$(trash) 删除所有配置',
        description: '清除仓库地址和 Token',
        detail: '重置插件到初始状态',
        command: 'agentDna.deleteConfiguration'
    } as any);

    // Add Back option
    items.push({
        label: '$(arrow-left) 返回主菜单',
        command: 'agentDna.showMenu'
    } as any);

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: '设置 - 选择配置项',
        title: 'AgentDNA 设置'
    });

    if (selection) {
        const item = selection as any;
        if (item.command === 'agentDna.showMenu') {
            showMenu();
        } else if (item.command === 'agentDna.setRepoUrl') {
            await setRepoUrl();
        } else if (item.command === 'agentDna.quickSetup') {
            await quickSetup();
        } else if (item.command === 'agentDna.deleteConfiguration') {
            await deleteConfiguration();
        } else {
            await vscode.commands.executeCommand(item.command);
            // Re-open submenu to show updated state
            if (item.command !== 'agentDna.showMenu') {
                showSettingsSubMenu();
            }
        }
    }
}

async function setRepoUrl(): Promise<void> {
    const config = vscode.workspace.getConfiguration('agentDna');
    const currentUrl = config.get<string>('repoUrl') || '';

    const newUrl = await vscode.window.showInputBox({
        title: '设置规则仓库地址',
        prompt: '请输入 GitHub 仓库 URL (例如 git@github.com:user/rules.git)',
        value: currentUrl,
        placeHolder: 'https://github.com/user/rules.git'
    });

    if (newUrl !== undefined) {
        await config.update('repoUrl', newUrl, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`AgentDNA: 仓库地址已更新`);
        showSettingsSubMenu();
    } else {
        showSettingsSubMenu();
    }
}

async function quickSetup(): Promise<void> {
    await vscode.commands.executeCommand('agentDna.openSetupWebview');
}

async function deleteConfiguration(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
        '确定要删除所有配置吗？(仓库地址和 Token 将被清除)',
        '确定删除',
        '取消'
    );

    if (confirm === '确定删除') {
        const config = vscode.workspace.getConfiguration('agentDna');
        await config.update('repoUrl', undefined, vscode.ConfigurationTarget.Global);
        await TokenManager.getInstance().setToken(undefined);

        vscode.window.showInformationMessage('AgentDNA: 所有配置已清除');
        showMenu(); // Return to main menu (which should now show "Not Configured")
    } else {
        showSettingsSubMenu();
    }
}


