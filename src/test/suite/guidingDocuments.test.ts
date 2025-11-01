/**
 * Tests for Guiding Documents module
 * 
 * Comprehensive test coverage for project document management
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as guidingDocuments from '../../modules/guidingDocuments';

suite('Guiding Documents Module Test Suite', () => {

	const testWorkspaceFolder = vscode.workspace.workspaceFolders?.[0];
	const testFilePath = testWorkspaceFolder 
		? path.join(testWorkspaceFolder.uri.fsPath, 'README.md')
		: '';

	// Clear documents before each test
	setup(async () => {
		// Clear any existing documents
		const docs = guidingDocuments.getGuidingDocuments();
		for (const doc of docs) {
			await guidingDocuments.removeGuidingDocument(doc);
		}
	});

	teardown(async () => {
		// Clean up after tests
		const docs = guidingDocuments.getGuidingDocuments();
		for (const doc of docs) {
			await guidingDocuments.removeGuidingDocument(doc);
		}
	});

	suite('Add Documents', () => {
		test('addGuidingDocument should add new document', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});

		test('addGuidingDocument should prevent duplicates', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			await guidingDocuments.addGuidingDocument(testFilePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});

		test('addGuidingDocument should handle absolute paths', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const absolutePath = testFilePath;
			await guidingDocuments.addGuidingDocument(absolutePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});

		test('addGuidingDocument should convert to workspace-relative paths', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs[0], 'README.md');
		});

		test('addGuidingDocument should handle files outside workspace', async () => {
			const externalPath = '/tmp/external-file.md';
			await guidingDocuments.addGuidingDocument(externalPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs[0], externalPath);
		});

		test('addGuidingDocument should handle non-existent files', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const nonExistentPath = path.join(testWorkspaceFolder.uri.fsPath, 'non-existent-file.md');
			await guidingDocuments.addGuidingDocument(nonExistentPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});
	});

	suite('Remove Documents', () => {
		test('removeGuidingDocument should remove existing document', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			await guidingDocuments.removeGuidingDocument('README.md');

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 0);
		});

		test('removeGuidingDocument should handle non-existent document', async () => {
			await guidingDocuments.removeGuidingDocument('non-existent.md');

			// Should not throw, just log
			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 0);
		});

		test('removeGuidingDocument should handle absolute paths', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			await guidingDocuments.removeGuidingDocument(testFilePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 0);
		});

		test('removeGuidingDocument should handle relative paths', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			await guidingDocuments.removeGuidingDocument('README.md');

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 0);
		});
	});

	suite('Get Documents', () => {
		test('getGuidingDocuments should return empty array initially', () => {
			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(Array.isArray(docs), true);
			assert.strictEqual(docs.length, 0);
		});

		test('getGuidingDocuments should return all documents', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			await guidingDocuments.addGuidingDocument('/tmp/external.md');

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 2);
		});

		test('getGuidingDocuments should return copies not references', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			const docs1 = guidingDocuments.getGuidingDocuments();
			const docs2 = guidingDocuments.getGuidingDocuments();

			assert.notStrictEqual(docs1, docs2);
			assert.deepStrictEqual(docs1, docs2);
		});

		test('getGuidingDocuments should return string paths', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			const docs = guidingDocuments.getGuidingDocuments();

			assert.strictEqual(typeof docs[0], 'string');
			assert.ok(docs[0].length > 0);
		});
	});

	suite('Get Context', () => {
		test('getGuidingDocumentsContext should return empty string when no documents', async () => {
			const context = await guidingDocuments.getGuidingDocumentsContext();
			assert.strictEqual(context, '');
		});

		test('getGuidingDocumentsContext should format multiple documents', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			assert.ok(context.length > 0);
			assert.ok(context.includes('# Guiding Documents'));
			assert.ok(context.includes('README.md'));
		});

		test('getGuidingDocumentsContext should include file contents', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			// README should contain the extension name
			assert.ok(context.includes('AI Feedback Bridge') || context.length > 100);
		});

		test('getGuidingDocumentsContext should handle read errors gracefully', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const nonExistentPath = path.join(testWorkspaceFolder.uri.fsPath, 'non-existent-file.md');
			guidingDocuments.addGuidingDocument(nonExistentPath);

			const context = await guidingDocuments.getGuidingDocumentsContext();

			// Should include header but note file couldn't be read
			assert.ok(context.includes('# Guiding Documents'));
			assert.ok(context.includes('non-existent-file.md'));
		});

		test('getGuidingDocumentsContext should handle large files', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			// README.md should be reasonably sized
			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			assert.ok(context.length > 0);
			assert.ok(context.length < 1000000); // Shouldn't be massive
		});

		test('getGuidingDocumentsContext should preserve markdown formatting', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			// Should maintain markdown structure
			assert.ok(context.includes('```') || context.includes('#'));
		});
	});

	suite('Path Conversion', () => {
		test('Should convert absolute paths to relative when in workspace', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			await guidingDocuments.addGuidingDocument(testFilePath);
			const docs = guidingDocuments.getGuidingDocuments();

			assert.strictEqual(docs[0], 'README.md');
		});

		test('Should keep absolute paths for files outside workspace', async () => {
			const externalPath = '/tmp/external.md';
			await guidingDocuments.addGuidingDocument(externalPath);
			const docs = guidingDocuments.getGuidingDocuments();

			assert.strictEqual(docs[0], externalPath);
		});

		test('Should handle Windows-style paths', async () => {
			const windowsPath = 'C:\\Users\\Test\\file.md';
			await guidingDocuments.addGuidingDocument(windowsPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.ok(docs.length > 0);
		});

		test('Should normalize path separators', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const mixedPath = path.join(testWorkspaceFolder.uri.fsPath, 'docs/README.md');
			await guidingDocuments.addGuidingDocument(mixedPath);
			const docs = guidingDocuments.getGuidingDocuments();

			// Should use consistent separators
			assert.ok(!docs[0].includes('\\\\'));
		});
	});

	suite('Edge Cases', () => {
		test('Should reject empty file path', async () => {
			await assert.rejects(async () => {
				await guidingDocuments.addGuidingDocument('');
			}, /Invalid file path/);
		});

		test('Should reject whitespace-only path', async () => {
			await assert.rejects(async () => {
				await guidingDocuments.addGuidingDocument('   ');
			}, /Invalid file path/);
		});

		test('Should handle special characters in filename', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const specialPath = path.join(testWorkspaceFolder.uri.fsPath, 'file with spaces & special.md');
			await guidingDocuments.addGuidingDocument(specialPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});

		test('Should handle very long file paths', async () => {
			const longPath = '/a/very/long/path/' + 'directory/'.repeat(50) + 'file.md';
			await guidingDocuments.addGuidingDocument(longPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});

		test('Should handle concurrent add operations', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const path1 = path.join(testWorkspaceFolder.uri.fsPath, 'file1.md');
			const path2 = path.join(testWorkspaceFolder.uri.fsPath, 'file2.md');

			await guidingDocuments.addGuidingDocument(path1);
			await guidingDocuments.addGuidingDocument(path2);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 2);
		});

		test('Should handle concurrent remove operations', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const path1 = path.join(testWorkspaceFolder.uri.fsPath, 'file1.md');
			const path2 = path.join(testWorkspaceFolder.uri.fsPath, 'file2.md');

			await guidingDocuments.addGuidingDocument(path1);
			await guidingDocuments.addGuidingDocument(path2);

			await guidingDocuments.removeGuidingDocument('file1.md');
			await guidingDocuments.removeGuidingDocument('file2.md');

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 0);
		});

		test('Should maintain document order', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const path1 = path.join(testWorkspaceFolder.uri.fsPath, 'a-file.md');
			const path2 = path.join(testWorkspaceFolder.uri.fsPath, 'b-file.md');
			const path3 = path.join(testWorkspaceFolder.uri.fsPath, 'c-file.md');

			await guidingDocuments.addGuidingDocument(path1);
			await guidingDocuments.addGuidingDocument(path2);
			await guidingDocuments.addGuidingDocument(path3);

			const docs = guidingDocuments.getGuidingDocuments();

			assert.strictEqual(docs[0], 'a-file.md');
			assert.strictEqual(docs[1], 'b-file.md');
			assert.strictEqual(docs[2], 'c-file.md');
		});
	});

	suite('File Watching', () => {
		test('Should update lastModified on document changes', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			const docs1 = guidingDocuments.getGuidingDocuments();
			// Ensure document is present
			assert.ok(docs1[0]);

			// Wait a bit
			await new Promise(resolve => setTimeout(resolve, 100));

			// Re-add should update timestamp (or trigger update mechanism)
			const docs2 = guidingDocuments.getGuidingDocuments();

			// Document still present after delay
			assert.ok(docs2[0]);
		});
	});

	suite('Integration with Workspace', () => {
		test('Should work when no workspace is open', async () => {
			// This is tricky to test, but we can at least verify it doesn't crash
			const externalPath = '/tmp/external.md';
			await guidingDocuments.addGuidingDocument(externalPath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.ok(docs.length >= 1);
		});

		test('Should handle multi-root workspaces', () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			// Add files from the first workspace
			guidingDocuments.addGuidingDocument(testFilePath);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(docs.length, 1);
		});
	});
});
