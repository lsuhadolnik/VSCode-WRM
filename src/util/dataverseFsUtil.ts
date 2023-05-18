import * as vscode from "vscode";

export function getDatavserseUrlFromUri(uri: vscode.Uri): string {
  const path = uri.path;
  return path.split("/")[1];
}

export function getWebResourceNameFromUri(uri: vscode.Uri): string {
  const path = uri.path;
  return path.split("/").slice(2).join("/");
}

export function flatTree(item: {
  [key: string]: any;
}): [string, vscode.FileType][] {
  return Object.keys(item).map((f) => [
    f,
    item[f].webresourceid ? vscode.FileType.File : vscode.FileType.Directory,
  ]);
}
