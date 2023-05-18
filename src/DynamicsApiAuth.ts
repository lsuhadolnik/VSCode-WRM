import { AccountInfo } from "@azure/msal-node";
import { AUTH_TYPE, msalClient } from "./AuthProvider";
import { DiscoService } from "./types";
import { authentication, window } from "vscode";
import open from "open";

export async function getServiceToken(org: string) {
  const apiUrl = "https://" + org;
  const apiScope = apiUrl + "/.default";

  try {
    const session = await authentication.getSession(AUTH_TYPE, [], {
      createIfNone: true,
    });

    const tokenRequest = {
      scopes: [apiScope, "offline_access"],
      account: session.account as unknown as AccountInfo,
    };

    try {
      return await msalClient.acquireTokenSilent(tokenRequest);
    } catch (e) {
      return await msalClient.acquireTokenInteractive({
        scopes: tokenRequest.scopes,
        async openBrowser(url) {
          open(url);
        },
        successTemplate:
          "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
        errorTemplate:
          "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
      });
    }
  } catch (e) {
    window.showErrorMessage((e as Error).message);
    return null;
  }
}
