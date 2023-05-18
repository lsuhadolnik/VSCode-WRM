import { QuickPickItem } from "vscode";

export class BasicQuickPickItem implements QuickPickItem {
  constructor(public label: string, public id: any) {}
}
