import { FileStat, FileType } from "vscode";

/* eslint-disable @typescript-eslint/naming-convention */
export interface DiscoService {
  ApiUrl: string;
  FriendlyName: string;
}

export interface WebResourceMeta {
  /**
   * The name as displayed in UI
   */
  displayname: string;

  /**
   * Base64 content of the webresource
   */
  content: string;

  /**
   * Type of Webresource
   */
  webresourcetype: WebresourceType;

  /**
   * The path
   */
  name: string;

  /**
   * The ID
   */
  webresourceid: string;
}

/**
 * https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/webresource?view=dataverse-latest
 */
export enum WebresourceType {
  HTML = 1,
  CSS = 2,
  JavaScript = 3,
  XML = 4,
  PNG = 5,
  JPG = 6,
  GIF = 7,
  XAP = 8,
  XSL = 9,
  ICO = 10,
  SVG = 11,
  RESX = 12,
}

export interface FindFileResult {
  name: string;
  meta?: WebResourceMeta;
  children?: [string, FileType][];
  type: FileType;
  stat: FileStat;
}
