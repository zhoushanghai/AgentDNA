import * as vscode from 'vscode';

export class TokenManager {
    private static _instance: TokenManager;
    private context: vscode.ExtensionContext;
    private readonly secretKey = 'agentDna.githubToken';

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    static init(context: vscode.ExtensionContext): void {
        TokenManager._instance = new TokenManager(context);
    }

    static getInstance(): TokenManager {
        if (!TokenManager._instance) {
            throw new Error('TokenManager not initialized');
        }
        return TokenManager._instance;
    }

    async setToken(token: string | undefined): Promise<void> {
        if (!token) {
            await this.context.secrets.delete(this.secretKey);
        } else {
            await this.context.secrets.store(this.secretKey, token);
        }
    }

    async getToken(): Promise<string | undefined> {
        return await this.context.secrets.get(this.secretKey);
    }
}
