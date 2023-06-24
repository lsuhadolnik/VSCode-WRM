"use strict";

import * as vscode from "vscode";
import { DataverseAuthProvider } from "./AuthProvider";
import connectToDataverse from "./Commands/ConnectToDataverse";
import { DynamicsWebresourceFilesystemProvider } from "./FileSystem/DataverseFilesystemProvider";
import { PROTO_NAME } from "./consts";

let authProvider: DataverseAuthProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
  if (!authProvider) {
    authProvider = new DataverseAuthProvider(context);
  }

  const fs = new DynamicsWebresourceFilesystemProvider();

  if (vscode.workspace.workspaceFolders) {
    const uri = vscode.workspace.workspaceFolders[0].uri;
    vscode.window.showInformationMessage("Current URI: " + uri.toString());
    if (uri.scheme === PROTO_NAME) {
      try {
        await fs.init(uri);
      } catch (e) {
        debugger;
      }
    }
  }

  context.subscriptions.push(
    ...[
      vscode.commands.registerCommand(
        "wrmgr.connectToDataverse",
        connectToDataverse
      ),
      vscode.workspace.registerFileSystemProvider(PROTO_NAME, fs, {
        isCaseSensitive: true,
      }),
    ]
  );
}

const v = async function (context: vscode.ExtensionContext) {
  /*const pick = await vscode.window.showQuickPick([session].map(p => new AuthSessionQuickPickItem(session.id, session.account.label)), {
    title: "Select your login",
    canPickMany: false,
    // any other properties you need
  });*/
  /*const token = await getServiceToken(
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
  );*/
};
