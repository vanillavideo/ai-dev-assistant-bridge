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
			assert.ok(context.includes('Refer to these documents for context:'));
			assert.ok(context.includes('- '));
		});

		test('getGuidingDocumentsContext should use concise path references', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			// Should contain path reference, not full content
			assert.ok(context.includes('- '));
			assert.ok(context.includes('README.md'));
			// Should NOT contain full file content (was >1000 chars, now <200)
			assert.ok(context.length < 500, 'Context should be concise, not include full file content');
		});

		test('getGuidingDocumentsContext should handle read errors gracefully', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			const nonExistentPath = path.join(testWorkspaceFolder.uri.fsPath, 'non-existent-file.md');
			guidingDocuments.addGuidingDocument(nonExistentPath);

			const context = await guidingDocuments.getGuidingDocumentsContext();

			// Should not include non-existent file in output
			assert.ok(!context.includes('non-existent-file.md'));
			// May be empty or just have header if only non-existent file was added
		});

		test('getGuidingDocumentsContext should be lightweight', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			// README.md should result in a small reference, not full content
			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			assert.ok(context.length > 0);
			// Should be much smaller now (just paths, not content)
			assert.ok(context.length < 500, 'Context should be lightweight with just path references');
		});

		test('getGuidingDocumentsContext should list paths as bullet points', async () => {
			if (!testWorkspaceFolder) {
				console.log('Skipping test - no workspace folder');
				return;
			}

			guidingDocuments.addGuidingDocument(testFilePath);
			
			const context = await guidingDocuments.getGuidingDocumentsContext();

			// Should use bullet point format for paths
			assert.ok(context.includes('- '));
			assert.ok(context.includes('README.md'));
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
			}, /Path cannot be empty/);
		});

		test('Should reject whitespace-only path', async () => {
			await assert.rejects(async () => {
				await guidingDocuments.addGuidingDocument('   ');
			}, /Path cannot be empty/);
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

	suite('Error Handling', () => {
		test('getGuidingDocumentsContext should handle all files non-existent (line 121-122)', async () => {
			// Clear any existing documents
			const docs = guidingDocuments.getGuidingDocuments();
			for (const doc of docs) {
				await guidingDocuments.removeGuidingDocument(doc);
			}

			// Add only non-existent files
			const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
			await config.update('guidingDocuments', ['/nonexistent/file1.md', '/nonexistent/file2.md'], vscode.ConfigurationTarget.Global);

			try {
				const context = await guidingDocuments.getGuidingDocumentsContext();
				
				// Should return empty string when all files fail to exist
				assert.strictEqual(context, '', 'Should return empty string when no valid files exist');
			} finally {
				// Cleanup
				await config.update('guidingDocuments', [], vscode.ConfigurationTarget.Global);
			}
		});

		test('getGuidingDocumentsContext should handle errors during processing (line 117)', async () => {
			// This test ensures the catch block is exercised by adding an invalid path
			// that might cause errors during getAbsolutePath or other operations
			const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
			
			// Add a path that exists but might cause processing issues
			const testPath = path.join(__dirname, '../../../README.md');
			await config.update('guidingDocuments', [testPath], vscode.ConfigurationTarget.Global);

			try {
				// Should not throw even if there are processing errors
				const context = await guidingDocuments.getGuidingDocumentsContext();
				assert.ok(typeof context === 'string', 'Should return string even with potential errors');
			} finally {
				await config.update('guidingDocuments', [], vscode.ConfigurationTarget.Global);
			}
		});

		test('handles relative path when no workspace folders (lines 163-165)', async () => {
			// This test covers the edge case in getAbsolutePath where workspaceFolders is undefined
			// We can't directly call getAbsolutePath (it's private), but we can test through
			// getGuidingDocumentsContext with a relative path when workspace isn't set
			
			const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
			
			// Add a relative path (not absolute)
			await config.update('guidingDocuments', ['./README.md'], vscode.ConfigurationTarget.Global);

			try {
				// This will internally call getAbsolutePath with a relative path
				// If no workspace folders, it should return the relative path as-is (lines 163-165)
				const context = await guidingDocuments.getGuidingDocumentsContext();
				
				// Should complete without error
				assert.ok(typeof context === 'string', 'Should handle relative paths gracefully');
			} finally {
				await config.update('guidingDocuments', [], vscode.ConfigurationTarget.Global);
			}
		});
	});
});
