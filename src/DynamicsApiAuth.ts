import { AccountInfo } from "@azure/msal-node";
import { msalClient } from "./AuthProvider";
import { DiscoService } from "./types";

export async function getServiceToken(
  disco: DiscoService,
  account: AccountInfo
) {
  const apiUrl = disco.ApiUrl;
  const apiScope = apiUrl + "/.default";

  const tokenRequest = {
    scopes: [apiScope],
    account: account,
  };

  return await msalClient.acquireTokenSilent(tokenRequest);
}
