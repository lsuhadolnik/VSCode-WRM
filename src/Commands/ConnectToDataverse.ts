import { window, authentication, workspace, commands, Uri } from "vscode";
import { AUTH_TYPE, DataverseAuthProvider } from "../AuthProvider";
import { getDiscoServices } from "../DynamicsDataProvider";
import { AuthSessionQuickPickItem } from "../QuickPicks/AuthSessionQuickPickItem";
import { DiscoService } from "../types";
import { PROTO_NAME } from "../consts";

/** 
    This command does the following:
    - Signs the user in with Azure
    - Retrieves the dataverse instances and allows the user to select an instance
    - Opens a workspace at this instance

    Then the filesystem provider handles the rest.
*/
export default async function connectToDataverse() {
  const session = await authentication.getSession(AUTH_TYPE, [], {
    createIfNone: true,
  });

  const services = await getDiscoServices(session.accessToken);

  const pick = await window.showQuickPick(
    services.map(
      (p) => new AuthSessionQuickPickItem(p.ApiUrl, p.FriendlyName, p)
    ),
    {
      title: "Select your environment",
      canPickMany: false,
      // any other properties you need
    }
  );

  if (pick) {
    const service = pick.item as DiscoService;
    const origin = Uri.parse(service.ApiUrl).authority;
    const url = Uri.parse(`${PROTO_NAME}:///${origin}`);
    debugger;
    commands.executeCommand("vscode.openFolder", url);
  }
}
