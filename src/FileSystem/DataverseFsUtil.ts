import * as vscode from "vscode";
import { WebResourceMeta } from "../types";

export function getDatavserseUrlFromUri(uri: vscode.Uri): string {
  const path = uri.path;
  return path.split("/")[1];
}

export function getWebResourceNameFromUri(uri: vscode.Uri): string {
  const path = uri.path;
  return path.split("/").slice(2).join("/");
}

export interface FileTreeItem {
  [key: string]: FileTreeItem | WebResourceMeta;
}

export function flatTree(item: FileTreeItem): [string, vscode.FileType][] {
  return Object.keys(item).map((filename) => [
    filename,
    item[filename].webresourceid
      ? vscode.FileType.File
      : vscode.FileType.Directory,
  ]);
}

export function placeTreeItem(
  tree: FileTreeItem,
  wr: WebResourceMeta,
  path: string
) {
  placeSubtreeTreeItem;
}

function placeSubtreeTreeItem(
  tree: FileTreeItem,
  wr: WebResourceMeta,
  parts: string[]
) {
  const file = parts[0];
  const isFolder = parts.length > 1;

  if (!tree[file]) {
    tree[file] = {};
  }

  if (isFolder) {
    const subtree = tree[file] as FileTreeItem;
    placeTreeItem(subtree, wr, parts.slice(1).join("/"));
  } else {
    tree[file] = wr;
  }

  /**
   * {
   *  a: {
   *    b: {name: test},
   *    c: {
   *      d: {name: }
   *      e: {name}
   *    }
   *  }
   * }
   */
}
