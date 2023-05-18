import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { WebResourceMeta } from "./types";

export class WebResourceTreeProvider
  implements vscode.TreeDataProvider<WebResourceItem>
{
  constructor(private webresources: WebResourceMeta[]) {}

  getTreeItem(element: WebResourceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WebResourceItem): Promise<WebResourceItem[]> {
    if (element) {
      return [];
    } else {
      // root

      return this.webresources.map((w) => new WebResourceItem(w.name, []));
    }
  }
}

class WebResourceItem extends vscode.TreeItem {
  children: WebResourceItem[] | undefined;

  constructor(label: string, children?: WebResourceItem[]) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.children = children;
  }
}
