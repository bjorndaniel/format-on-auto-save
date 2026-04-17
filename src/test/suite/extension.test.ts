import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	let tempDirectory: string;
	let originalFormatOnSave: boolean | undefined;

	suiteSetup(async () => {
		tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'format-on-auto-save-'));
		originalFormatOnSave = vscode.workspace
			.getConfiguration('editor')
			.get<boolean>('formatOnSave');
		await vscode.workspace
			.getConfiguration('editor')
			.update('formatOnSave', true, vscode.ConfigurationTarget.Global);
	});

	suiteTeardown(async () => {
		await vscode.workspace
			.getConfiguration('editor')
			.update('formatOnSave', originalFormatOnSave, vscode.ConfigurationTarget.Global);
		await fs.rmdir(tempDirectory, { recursive: true });
	});

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});

	test('does not format when the saved document has a non-empty selection', async () => {
		const { document, editor } = await openTestDocument('const value = { foo: 1, bar: 2 };');
		const formatter = registerFormatter('formatted with selection');
		editor.selection = new vscode.Selection(
			new vscode.Position(0, 14),
			new vscode.Position(0, 22)
		);

		const savedContent = await saveAndReadContent(document);

		formatter.dispose();
		assert.strictEqual(savedContent, 'const value = { foo: 1, bar: 2 };');
	});

	test('formats when the saved document selection is empty', async () => {
		const { document, editor } = await openTestDocument('const value = { foo: 1, bar: 2 };');
		const formatter = registerFormatter('formatted without selection');
		editor.selection = new vscode.Selection(
			new vscode.Position(0, 0),
			new vscode.Position(0, 0)
		);

		const savedContent = await saveAndReadContent(document);

		formatter.dispose();
		assert.strictEqual(savedContent, 'formatted without selection');
	});

	async function openTestDocument(content: string): Promise<{
		document: vscode.TextDocument;
		editor: vscode.TextEditor;
	}> {
		const filePath = path.join(tempDirectory, `test-${Date.now()}-${Math.random()}.ts`);
		await fs.writeFile(filePath, content, 'utf8');

		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
		await vscode.languages.setTextDocumentLanguage(document, 'plaintext');
		const editor = await vscode.window.showTextDocument(document);

		return { document, editor };
	}

	function registerFormatter(formattedContent: string): vscode.Disposable {
		return vscode.languages.registerDocumentFormattingEditProvider('plaintext', {
			provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
				const lastLine = document.lineAt(document.lineCount - 1);
				const fullRange = new vscode.Range(
					new vscode.Position(0, 0),
					new vscode.Position(document.lineCount - 1, lastLine.text.length)
				);

				return [vscode.TextEdit.replace(fullRange, formattedContent)];
			}
		});
	}

	async function saveAndReadContent(document: vscode.TextDocument): Promise<string> {
		await document.save();
		return fs.readFile(document.uri.fsPath, 'utf8');
	}
});
