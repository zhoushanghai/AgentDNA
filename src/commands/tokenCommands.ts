import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export async function setToken(): Promise<void> {
    const hasToken = !!(await TokenManager.getInstance().getToken());
    const prompt = hasToken
        ? '⚠️ 当前已设置 Token。输入新 Token 将覆盖原有设置 (留空取消)'
        : '请输入您的 GitHub Personal Access Token (权限: repo)';

    const token = await vscode.window.showInputBox({
        title: hasToken ? '更新 GitHub Token' : '设置 GitHub Token',
        prompt: prompt,
        password: true, // Hide input
        placeHolder: 'ghp_xxxxxxxxxxxxxxxxxxxx'
    });

    if (token) {
        await TokenManager.getInstance().setToken(token);
        vscode.window.showInformationMessage('AgentDNA: GitHub Token 已安全保存');
    }
}

export async function deleteToken(): Promise<void> {
    await TokenManager.getInstance().setToken(undefined);
    vscode.window.showInformationMessage('AgentDNA: GitHub Token 已清除');
}
