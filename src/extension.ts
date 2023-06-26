"use strict";

import "reflect-metadata";
import * as vscode from "vscode";
import { DataverseAuthProvider } from "./Auth/DiscoveryServiceAuthProvider";
import connectToDataverse from "./Commands/ConnectToDataverse";
import { DynamicsWebresourceFilesystemProvider } from "./FileSystem/DataverseFilesystemProvider";
import { PROTO_NAME } from "./consts";
import Container from "typedi";

export async function activate(context: vscode.ExtensionContext) {
  const authProvider = Container.get(DataverseAuthProvider);
  authProvider.configure(context);

  const fs = new DynamicsWebresourceFilesystemProvider();

  // If there's at leas one folder open in VSCode Window
  if (vscode.workspace.workspaceFolders) {
    const uri = vscode.workspace.workspaceFolders[0].uri;
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
