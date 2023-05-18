"use strict";

import * as vscode from "vscode";
import { WebResourceTreeProvider } from "./WebResourceTreeProvider";
import { DataverseAuthProvider, AUTH_TYPE } from "./AuthProvider";
import { AuthSessionQuickPickItem } from "./QuickPicks/AuthSessionQuickPickItem";
import { getDiscoServices, getWebResources } from "./DynamicsDataProvider";
import { DiscoService, WebResourceMeta } from "./types";
import { getServiceToken } from "./DynamicsApiAuth";
import { AccountInfo } from "@azure/msal-node";

export async function activate(context: vscode.ExtensionContext) {
  const ap = new DataverseAuthProvider(context);

  const session = await vscode.authentication.getSession(AUTH_TYPE, [], {
    createIfNone: true,
  });

  /*const pick = await vscode.window.showQuickPick([session].map(p => new AuthSessionQuickPickItem(session.id, session.account.label)), {
    title: "Select your login",
    canPickMany: false,
    // any other properties you need
  });*/

  const services = await getDiscoServices(session.accessToken);

  const pick = await vscode.window.showQuickPick(
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
    const token = await getServiceToken(
      service,
      session.account as any as AccountInfo
    );
    const webResources = (await getWebResources(
      token?.accessToken || "",
      service.ApiUrl
    )) as WebResourceMeta[];

    vscode.window.registerTreeDataProvider(
      "nodeDependencies",
      new WebResourceTreeProvider(webResources)
    );
  }
}
