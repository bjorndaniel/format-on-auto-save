import * as vscode from "vscode";
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "format-on-auto-save" is now active!'
  );
  const workspace = vscode.workspace;
  context.subscriptions.push(
    workspace.onWillSaveTextDocument(() => {
      const activeEditor = vscode.window.activeTextEditor;
      const editorConfig = workspace.getConfiguration("editor"),
        languageConfig = workspace.getConfiguration(`[${activeEditor?.document.languageId}]`);
        const shouldFormatLanguage = languageConfig["editor.formatOnSave"] ?? false;
        let shouldFormat = editorConfig.get("formatOnSave") || shouldFormatLanguage;
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
