import * as vscode from 'vscode';
import { TokenManager } from '../services/TokenManager';

export async function setToken(): Promise<void> {
    const token = await vscode.window.showInputBox({
        title: '设置 GitHub Token',
        prompt: '请输入您的 GitHub Personal Access Token (权限: repo)',
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
