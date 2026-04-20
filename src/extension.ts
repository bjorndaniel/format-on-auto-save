import * as vscode from "vscode";

function hasSelectedText(document: vscode.TextDocument): boolean {
  const editor = vscode.window.visibleTextEditors.find(
    (candidate) => candidate.document.uri.toString() === document.uri.toString()
  );

  if (!editor) {
    return false;
  }

  return editor.selections.some((selection) => !selection.isEmpty);
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "format-on-auto-save" is now active!'
  );
  const workspace = vscode.workspace;
  context.subscriptions.push(
    workspace.onWillSaveTextDocument((event: vscode.TextDocumentWillSaveEvent) => {
      const document = event.document;
      const resource = document.uri;
      const editorConfig = workspace.getConfiguration("editor", resource);
      const languageConfig = workspace.getConfiguration(
        `[${document.languageId}]`,
        resource
      );
      const shouldFormatLanguage = languageConfig["editor.formatOnSave"];
      let shouldFormat = editorConfig.get("formatOnSave");
      if (shouldFormatLanguage !== undefined && shouldFormatLanguage !== null) {
        shouldFormat = shouldFormatLanguage;
      }
      if (shouldFormat && !hasSelectedText(document)) {
        // TODO: Refactor to use vscode.executeFormatDocumentProvider
        vscode.commands.executeCommand("editor.action.format", resource);
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
