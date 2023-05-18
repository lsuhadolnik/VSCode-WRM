import { QuickPickItem } from "vscode";

export class AuthSessionQuickPickItem implements QuickPickItem {
    label: string;
    description = '';
    item: any;
    
    constructor(public detail: string, name: string, item: any) {
      this.label = `${name}`;
      this.item = item;
    }
  }