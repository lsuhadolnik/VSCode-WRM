// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "wrmgr" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('wrmgr.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from WRMGR!');
	});

	const treeDataProvider = new MyTreeDataProvider(); // Your custom data provider for the sidebar
const view = vscode.window.createTreeView('mySidebarView', {
  treeDataProvider: treeDataProvider as any,
  showCollapseAll: true,
});

	context.subscriptions.push(disposable);
}

class MyTreeDataProvider {
	public onDidChangeTreeData: any = new vscode.EventEmitter();
	
	getChildren(element: any) {
	  // Return the child elements for the given parent element
	  // If `element` is null, return the root level elements
	}
	
	getTreeItem(element: any) {
	  // Return a `TreeItem` object representing the provided element
	}
  }

// This method is called when your extension is deactivated
export function deactivate() {}
