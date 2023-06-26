import "reflect-metadata";

import * as path from "path";
import * as vscode from "vscode";
import { FindFileResult, WebResourceMeta, WebresourceType } from "../types";
import {
  flatTree,
  getDatavserseUrlFromUri,
  getWebResourceNameFromUri,
  placeTreeItem,
} from "./DataverseFsUtil";
import { TextDecoder, TextEncoder } from "util";
import { buildTree, findItemInTree } from "./BuildTree";
import { BasicQuickPickItem } from "../QuickPicks/BasicQuickPickItem";
import { DataverseAuthProvider } from "../Auth/DiscoveryServiceAuthProvider";
import Container, { Inject, Service } from "typedi";
import { DynamicsDataProvider } from "../Dynamics/DynamicsDataProvider";

export class File implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  data?: Uint8Array;

  constructor(name: string) {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}

export class Directory implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  entries: Map<string, File | Directory>;

  constructor(name: string) {
    this.type = vscode.FileType.Directory;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
    this.entries = new Map();
  }
}

export type Entry = File | Directory;

export class DynamicsWebresourceFilesystemProvider
  implements vscode.FileSystemProvider
{
  private webresources: WebResourceMeta[] = [];
  private tree = null as any;

  public async init(uri: vscode.Uri) {
    const organisation = getDatavserseUrlFromUri(uri);
    if (this.webresources.length > 0) {
      return true;
    } else {
      this.webresources = await this.loadWebResources(organisation);
    }
  }

  private loadWebResources(org: string) {
    return Container.get(DynamicsDataProvider).getWebResources(org);
  }

  root = new Directory("");

  // --- manage file metadata

  /**
   * Works already
   * @param uri
   * @returns
   */
  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    await this.init(uri);

    const item = this.find(uri);
    if (item) {
      return item.stat;
    }

    throw vscode.FileSystemError.FileNotFound();
  }

  /**
   *  Works already
   * @param uri
   * @returns
   */
  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    await this.init(uri);

    const item = this.find(uri);
    if (item) {
      return item.children || [];
    }

    throw vscode.FileSystemError.FileNotFound();
  }

  // --- manage file contents
  /**
   * Works already
   * @param uri
   * @returns
   */
  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    await this.init(uri);

    const org = getDatavserseUrlFromUri(uri);

    const item = this.find(uri);
    if (item) {
      const content = await Container.get(
        DynamicsDataProvider
      ).getWebresourceContent(org, item.meta?.webresourceid || "");

      if (content) {
        return Uint8Array.from(
          Buffer.from((content as any).content || "", "base64").toString(
            "utf-8"
          ),
          (c) => c.charCodeAt(0)
        );
      }
    }

    throw vscode.FileSystemError.FileNotFound();
  }

  private find(uri: vscode.Uri): FindFileResult | null {
    const filename = getWebResourceNameFromUri(uri);
    const org = getDatavserseUrlFromUri(uri);

    const newStat = (type: vscode.FileType) => ({
      type,
      ctime: 0,
      mtime: 0,
      size: 100,
    });

    if (filename === "") {
      return {
        name: filename,
        children: flatTree(this.tree),
        stat: newStat(vscode.FileType.Directory),
        type: vscode.FileType.Directory,
      };
    }

    const folder = this.webresources.filter((w) => w.name.startsWith(filename));

    const meta = this.webresources.find((f) => f.name === filename);
    if (folder.length > 0) {
      if (meta) {
        return {
          name: filename,
          meta,
          stat: newStat(vscode.FileType.File),
          type: vscode.FileType.File,
        };
      } else {
        return {
          name: filename,
          stat: newStat(vscode.FileType.Directory),
          type: vscode.FileType.Directory,
          children: flatTree(findItemInTree(filename, this.tree)),
        };
      }
    }

    return null;
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    await this.init(uri);

    const org = getDatavserseUrlFromUri(uri);
    const filename = getWebResourceNameFromUri(uri);

    const item = this.find(uri);

    if (item?.type === vscode.FileType.Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    if (!item && !options.create) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    if (item && options.create && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    const stringContent = new TextDecoder().decode(content);

    if (!item) {
      // CREATE FILE

      const type = await vscode.window.showQuickPick(
        [
          new BasicQuickPickItem("CSS", WebresourceType.CSS),
          new BasicQuickPickItem("JS", WebresourceType.JavaScript),
          new BasicQuickPickItem("HTML", WebresourceType.HTML),
          new BasicQuickPickItem("PNG", WebresourceType.PNG),
          new BasicQuickPickItem("SVG", WebresourceType.SVG),
        ],
        { title: "Select WebResource type", ignoreFocusOut: false }
      );
      if (!type) {
        throw Error("Please select a type");
      }

      let newId = "";
      if (stringContent !== "") {
        newId = await Container.get(DynamicsDataProvider).createWebResource(
          org,
          filename,
          stringContent,
          type.id
        );
      }

      /*placeTreeItem(this.tree, {
        webresourcetype: type.id,
        displayname: filename,
        name: filename,
        webresourceid: newId,
      } as WebResourceMeta);*/

      this._fireSoon({ type: vscode.FileChangeType.Created, uri });
    } else {
      // UPDATE FILE

      await Container.get(DynamicsDataProvider).updateWebResource(
        org,
        item.meta?.webresourceid || "",
        new TextDecoder().decode(content)
      );
      this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }
  }

  // --- manage files/folders

  async rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    await this.init(oldUri);

    /*if (!options.overwrite && this._lookup(newUri, true)) {
      throw vscode.FileSystemError.FileExists(newUri);
    }

    const entry = this._lookup(oldUri, false);
    const oldParent = this._lookupParentDirectory(oldUri);

    const newParent = this._lookupParentDirectory(newUri);
    const newName = path.posix.basename(newUri.path);

    oldParent.entries.delete(entry.name);
    entry.name = newName;
    newParent.entries.set(newName, entry);

    this._fireSoon(
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri }
    );*/

    throw new Error("NOT IMPLEMENTED");
  }

  async delete(uri: vscode.Uri): Promise<void> {
    await this.init(uri);

    /*const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    const basename = path.posix.basename(uri.path);
    const parent = this._lookupAsDirectory(dirname, false);
    if (!parent.entries.has(basename)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    parent.entries.delete(basename);
    parent.mtime = Date.now();
    parent.size -= 1;
    this._fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { uri, type: vscode.FileChangeType.Deleted }
    );*/

    throw new Error("NOT IMPLEMENTED");
  }

  async createDirectory(uri: vscode.Uri): Promise<void> {
    await this.init(uri);
    /*const basename = path.posix.basename(uri.path);
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    const parent = this._lookupAsDirectory(dirname, false);

    const entry = new Directory(basename);
    parent.entries.set(entry.name, entry);
    parent.mtime = Date.now();
    parent.size += 1;
    this._fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { type: vscode.FileChangeType.Created, uri }
    );*/
    throw new Error("NOT IMPLEMENTED");
  }

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle?: NodeJS.Timer;

  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    this._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => {});
  }

  private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    this._bufferedEvents.push(...events);

    if (this._fireSoonHandle) {
      clearTimeout(this._fireSoonHandle);
    }

    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }
}
