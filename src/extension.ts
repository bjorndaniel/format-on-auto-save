import * as vscode from "vscode";
export function activate(context: vscode.ExtensionContext) {
  const activeEditor = vscode.window.activeTextEditor;
  console.log(
    'Congratulations, your extension "format-on-auto-save" is now active!'
  );
  const workspace = vscode.workspace;
  context.subscriptions.push(
    workspace.onWillSaveTextDocument((e) => {
      const editorConfig = workspace.getConfiguration("editor"),
        shouldFormat = editorConfig.get("formatOnSave");
      if (shouldFormat) {
        //TODO: Refactor to use vscode.executeFormatDocumentProvider
        vscode.commands.executeCommand(
          "editor.action.format",
          activeEditor?.document.uri
        );
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
