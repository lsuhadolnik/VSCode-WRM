import { PublicClientApplication } from "@azure/msal-node";
import fetch from 'node-fetch';
import open from 'open';
import { window,authentication, AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Disposable, EventEmitter, ExtensionContext } from "vscode";

export const AUTH_TYPE = `dataverse`;
const AUTH_NAME = `Dataverse`;
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`;

const clientId = '51f81489-12ee-4a9e-aaae-a2591f45987d'; // Client ID of your registered application
const authority = 'https://login.microsoftonline.com/organizations'; // Authority URL (e.g., https://login.microsoftonline.com/your_tenant_id)
const cloudUrl = 'https://globaldisco.crm.dynamics.com';
const discoUrl = `${cloudUrl}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName`;
const discoScope = cloudUrl + '/.default';

const msalConfig = {
    auth: {
        clientId: clientId,
        authority: authority,
        redirectUri: 'http://localhost',
    },
};

export const msalClient = new PublicClientApplication(msalConfig);

export class DataverseAuthProvider implements AuthenticationProvider, Disposable {
  private _sessionChangeEmitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;

  
  constructor(private readonly context: ExtensionContext) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(AUTH_TYPE, AUTH_NAME, this, { supportsMultipleAccounts: false })
    );
  }

  /*private async getDiscoServices(token: ) {
    const clientId = msalConfig.auth.clientId;
    const req = await fetch(discoUrl, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token.accessToken}`,
        },
    });

    const resp = await req.json();
    console.log(resp);
    if (req.ok) {
        return resp.value;
    } else {
        throw new Error(resp);
    }
}*/

private async getAccessToken() {

    const scopes = [discoScope, "offline_access"];

    try {
        const token = await msalClient.acquireTokenInteractive({
            scopes,
            async openBrowser(url) { open(url); },
            successTemplate:
                '<h1>Successfully signed in!</h1> <p>You can close this window now.</p>',
            errorTemplate:
                '<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>',
        });

        return token;
    } catch (error) {
        console.log('Authentication error:', error);
    }
}

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  /**
   * Get the existing sessions
   * @param scopes 
   * @returns 
   */
  public async getSessions(scopes?: string[]): Promise<readonly AuthenticationSession[]> {
    const allSessions = await this.context.secrets.get(SESSIONS_SECRET_KEY);

    if (allSessions) {
      return JSON.parse(allSessions) as AuthenticationSession[];
    }

    return [];
  }

  /**
   * Create a new auth session
   * @param scopes 
   * @returns 
   */
  public async createSession(scopes: string[]): Promise<AuthenticationSession> {

    try {

        const token = await this.getAccessToken();
    if (!token) {
        throw new Error(`Dataverse login failure`);
      }
        const userinfo: { name: string, email: string } = {email: token.account?.username || '', name: token.account?.name || ''};

      const session: AuthenticationSession = {
        id: token.account?.username + '@' + token.account?.tenantId,
        accessToken: token.accessToken,
        account: {
          label: userinfo.name,
          id: userinfo.email,
          ...token.account
        },
        scopes: []
      };

      await this.context.secrets.store(SESSIONS_SECRET_KEY, JSON.stringify([session]))

      this._sessionChangeEmitter.fire({ added: [session], removed: [], changed: [] });

      return session;
    } catch (e) {
        
        window.showErrorMessage(`Sign in failed: ${e}`);
        throw e;
      }


  }

  

  /**
   * Remove an existing session
   * @param sessionId 
   */
  public async removeSession(sessionId: string): Promise<void> {
    
  }

  /**
   * Dispose the registered services
   */
  public async dispose() {
    this._disposable.dispose();
  }
}