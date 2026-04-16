import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { shouldFormatDocument } from '../../extension';

// Minimal WorkspaceConfiguration mock factory.
function makeEditorConfig(formatOnSave: boolean): vscode.WorkspaceConfiguration {
	return {
		get: <T>(section: string): T | undefined =>
			(section === 'formatOnSave' ? formatOnSave : undefined) as unknown as T,
		has: () => false,
		inspect: () => undefined,
		update: () => Promise.resolve(),
	} as unknown as vscode.WorkspaceConfiguration;
}

function makeLanguageConfig(formatOnSave?: boolean): vscode.WorkspaceConfiguration {
	const cfg: Record<string, unknown> = {
		get: () => undefined,
		has: () => false,
		inspect: () => undefined,
		update: () => Promise.resolve(),
	};
	if (formatOnSave !== undefined) {
		cfg['editor.formatOnSave'] = formatOnSave;
	}
	return cfg as unknown as vscode.WorkspaceConfiguration;
}

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});

	// shouldFormatDocument logic tests
	test('shouldFormatDocument returns true when editor.formatOnSave is true', () => {
		assert.strictEqual(
			shouldFormatDocument(makeEditorConfig(true), makeLanguageConfig()),
			true
		);
	});

	test('shouldFormatDocument returns false when editor.formatOnSave is false', () => {
		assert.strictEqual(
			shouldFormatDocument(makeEditorConfig(false), makeLanguageConfig()),
			false
		);
	});

	test('Language-specific formatOnSave true overrides global false', () => {
		assert.strictEqual(
			shouldFormatDocument(makeEditorConfig(false), makeLanguageConfig(true)),
			true
		);
	});

	test('Language-specific formatOnSave false overrides global true', () => {
		assert.strictEqual(
			shouldFormatDocument(makeEditorConfig(true), makeLanguageConfig(false)),
			false
		);
	});

	// Regression test: verify that the extension uses editor.action.formatDocument
	// (not editor.action.format).  When editor.action.format is used while text is
	// selected VS Code delegates to "Format Selection", which formatters like ESLint
	// do not support, causing an error dialog.
	test('executeCommand is called with editor.action.formatDocument, not editor.action.format', async () => {
		const capturedCommands: string[] = [];

		type CommandsWithWritableExecute = {
			executeCommand: (command: string, ...rest: unknown[]) => Thenable<unknown>;
		};
		const cmds = vscode.commands as unknown as CommandsWithWritableExecute;
		const originalExecuteCommand = cmds.executeCommand;

		// Temporarily replace executeCommand with a spy.
		cmds.executeCommand = (command: string, ...rest: unknown[]): Thenable<unknown> => {
			capturedCommands.push(command);
			return Promise.resolve();
		};

		try {
			// Open a temporary untitled document and trigger a save event so that
			// the extension's onWillSaveTextDocument listener fires.
			const doc = await vscode.workspace.openTextDocument({
				content: 'const x = 1',
				language: 'javascript',
			});
			await vscode.window.showTextDocument(doc);
			// Trigger the will-save flow via the built-in save command.
			await cmds.executeCommand('workbench.action.files.save');
		} finally {
			cmds.executeCommand = originalExecuteCommand;
		}

		// The extension must never invoke the generic "editor.action.format"
		// command (which would format only the selection when text is selected).
		assert.ok(
			!capturedCommands.includes('editor.action.format'),
			'editor.action.format must not be called (causes ESLint selection-format error when text is selected)'
		);

		// The extension must invoke "editor.action.formatDocument" to always
		// format the whole document regardless of any active selection.
		assert.ok(
			capturedCommands.includes('editor.action.formatDocument'),
			'editor.action.formatDocument must be called to format the whole document'
		);
	});
});
