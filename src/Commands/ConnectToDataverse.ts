import { window, authentication, workspace, commands, Uri } from "vscode";
import { DataverseAuthProvider } from "../Auth/DiscoveryServiceAuthProvider";
import { AuthSessionQuickPickItem } from "../QuickPicks/AuthSessionQuickPickItem";
import { DiscoService } from "../types";
import { PROTO_NAME } from "../consts";
import { DATAVERSE_AUTH_TYPE, discoScopes } from "../Auth/AuthConst";
import Container from "typedi";
import { DynamicsDataProvider } from "../Dynamics/DynamicsDataProvider";

/** 
    This command does the following:
    - Signs the user in with Azure
    - Retrieves the dataverse instances and allows the user to select an instance
    - Opens a workspace at this instance

    Then the filesystem provider handles the rest.
*/
export default async function connectToDataverse() {
  const session = await selectAuthSession();

  const dataProvider = Container.get(DynamicsDataProvider);

  const services = await dataProvider.getDiscoServices();

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
    const url = Uri.parse(`${PROTO_NAME}:/${origin}`);
    commands.executeCommand("vscode.openFolder", url);
  }
}

async function selectAuthSession() {
  const authProvider = Container.get(DataverseAuthProvider);
  const sessions = await authProvider.getSessions(discoScopes);

  const pick = await window.showQuickPick(
    sessions.map((p) => new AuthSessionQuickPickItem(p.account.label, p.id, p)),
    {
      title: "Select your account",
      canPickMany: false,
      // any other properties you need
    }
  );

  if (pick) {
    // authProvider.selectSession(pick);
  }

  return pick;
}
