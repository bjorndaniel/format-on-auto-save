import * as vscode from "vscode";

export function shouldFormatDocument(
  editorConfig: vscode.WorkspaceConfiguration,
  languageConfig: vscode.WorkspaceConfiguration
): boolean {
  const shouldFormatLanguage = languageConfig["editor.formatOnSave"];
  let shouldFormat = editorConfig.get<boolean>("formatOnSave");
  if (shouldFormatLanguage !== undefined && shouldFormatLanguage !== null) {
    shouldFormat = shouldFormatLanguage;
  }
  return !!shouldFormat;
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "format-on-auto-save" is now active!'
  );
  const workspace = vscode.workspace;
  context.subscriptions.push(
    workspace.onWillSaveTextDocument((event: { document: any }) => {
      const document = event.document;
      const resource = document.uri;
      const editorConfig = workspace.getConfiguration("editor", resource);
      const languageConfig = workspace.getConfiguration(
        `[${document.languageId}]`,
        resource
      );
      if (shouldFormatDocument(editorConfig, languageConfig)) {
        // Use formatDocument (not format) so that any active text selection is
        // ignored and the whole document is always formatted.  The generic
        // "editor.action.format" command formats only the selection when text
        // is selected, which causes an error with formatters (e.g. ESLint) that
        // do not support range/selection formatting.
        vscode.commands.executeCommand("editor.action.formatDocument");
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
