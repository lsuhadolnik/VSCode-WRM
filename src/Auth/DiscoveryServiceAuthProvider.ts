import { AccountInfo, PublicClientApplication } from "@azure/msal-node";
import fetch from "node-fetch";
import open from "open";
import {
  window,
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  EventEmitter,
  ExtensionContext,
} from "vscode";
import {
  DATAVERSE_AUTH_NAME,
  DATAVERSE_AUTH_TYPE,
  DATAVERSE_SESSIONS_SECRET_KEY,
  discoScopes,
  msalConfig,
} from "./AuthConst";
import { Service } from "typedi";

@Service()
export class DataverseAuthProvider
  implements AuthenticationProvider, Disposable
{
  private context!: ExtensionContext;
  private msalClient = new PublicClientApplication(msalConfig);

  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;

  public configure(context: ExtensionContext) {
    this.context = context;
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        DATAVERSE_AUTH_TYPE,
        DATAVERSE_AUTH_NAME,
        this,
        { supportsMultipleAccounts: false }
      )
    );
  }

  public async getAvailableDiscoSessions() {}

  public async getDiscoveryAuthHeader(): Promise<string> {
    const session = await authentication.getSession(
      DATAVERSE_AUTH_TYPE,
      discoScopes,
      { createIfNone: true }
    );
    const token = session.accessToken;
    return `Bearer ${token}`;
  }

  public async getDataverseAuthHeader(org: string) {
    const apiUrl = "https://" + org;
    const apiScope = apiUrl + "/.default";
    const scopes = [apiScope, "offline_access"];

    const token = await this.getAccessToken(scopes);
    return `Bearer ${token}`;
  }

  private async getAccessToken(scopes: string[]) {
    try {
      const session = await authentication.getSession(
        DATAVERSE_AUTH_TYPE,
        scopes,
        {
          createIfNone: false,
        }
      );
      if (!session) {
        throw new Error("Session not available");
      }

      return await this.msalClient.acquireTokenSilent({
        scopes,
        account: session.account as unknown as AccountInfo,
      });
    } catch (e) {
      const session = await authentication.getSession(
        DATAVERSE_AUTH_TYPE,
        scopes,
        {
          createIfNone: true,
        }
      );
      return session.accessToken;
    }
  }

  private async getTokenInteractive(scopes: string[]) {
    return this.msalClient.acquireTokenInteractive({
      scopes,
      async openBrowser(url) {
        open(url);
      },
      successTemplate: `<html>
<head>
      <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      }
      </style>
</head>
<body>
<h1>Successfully signed in!</h1> <p>You can close this window now.</p>
</body>
</html>`,
      errorTemplate:
        "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
    });
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  /**
   * Get the existing sessions
   * @param scopes
   * @returns
   */
  public async getSessions(
    scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    const allSessions = await this.context.secrets.get(
      DATAVERSE_SESSIONS_SECRET_KEY + JSON.stringify(scopes)
    );

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
      const token = await this.getTokenInteractive(scopes);
      if (!token) {
        throw new Error(`Dataverse login failure`);
      }
      const userinfo: { name: string; email: string } = {
        email: token.account?.username || "",
        name: token.account?.name || "",
      };

      const session: AuthenticationSession = {
        id: token.account?.username + "@" + token.account?.tenantId,
        accessToken: token.accessToken,
        account: {
          label: userinfo.name,
          id: userinfo.email,
          ...token.account,
        },
        scopes: [],
      };

      await this.context.secrets.store(
        DATAVERSE_SESSIONS_SECRET_KEY + JSON.stringify(scopes),
        JSON.stringify([session])
      );

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

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
    debugger;
  }

  /**
   * Dispose the registered services
   */
  public async dispose() {
    this._disposable.dispose();
  }
}

export class AuthRequestBuilder {
  constructor(private _msalInstance: PublicClientApplication) {}
}
