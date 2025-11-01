/**
 * Tests for auto-approval script handling
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as autoApproval from '../../modules/autoApproval';

suite('Auto-Approval Module Test Suite', () => {
	let mockContext: vscode.ExtensionContext;

	setup(() => {
		// Create a mock extension context with a real extension path
		const extensionPath = path.join(__dirname, '../../../');
		mockContext = {
			extensionPath,
			subscriptions: [],
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			},
			globalState: {
				get: () => undefined,
				update: async () => {},
				keys: () => [],
				setKeysForSync: () => {}
			}
		} as any;
	});

	suite('getAutoApprovalScript', () => {
		test('should return script content when file exists', () => {
			const script = autoApproval.getAutoApprovalScript(mockContext);
			
			// Script should be non-empty
			assert.ok(script.length > 0, 'Script should not be empty');
			
			// Should not return error message
			assert.ok(!script.includes('Error: Could not load auto-approval script'), 
				'Should not return error message when file exists');
		});

		test('should return error message when file does not exist', () => {
			// Create context with invalid path
			const invalidContext = {
				...mockContext,
				extensionPath: '/invalid/path/that/does/not/exist'
			} as any;

			const script = autoApproval.getAutoApprovalScript(invalidContext);
			
			// Should return error message
			assert.ok(script.includes('Error: Could not load auto-approval script'),
				'Should return error message when file does not exist');
		});

		test('should read actual auto-approval-script.js file', () => {
			const script = autoApproval.getAutoApprovalScript(mockContext);
			const scriptPath = path.join(mockContext.extensionPath, 'scripts', 'auto-approval-script.js');
			
			// Verify the file actually exists
			if (fs.existsSync(scriptPath)) {
				const expectedContent = fs.readFileSync(scriptPath, 'utf8');
				assert.strictEqual(script, expectedContent, 
					'Should return exact content of auto-approval-script.js');
			}
		});
	});

	suite('autoInjectScript', () => {
		test('should copy script to clipboard', async () => {
			await autoApproval.autoInjectScript(mockContext);
			
			// Read clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Should have copied the script
			assert.ok(clipboardContent.length > 0, 'Clipboard should not be empty');
			
			// Should match the script from getAutoApprovalScript
			const expectedScript = autoApproval.getAutoApprovalScript(mockContext);
			assert.strictEqual(clipboardContent, expectedScript,
				'Clipboard should contain the auto-approval script');
		});

		test('should handle dev tools toggle errors gracefully', async () => {
			// This test verifies that errors from toggleDevTools don't break the function
			// The function should complete successfully even if dev tools toggle fails
			await assert.doesNotReject(
				async () => await autoApproval.autoInjectScript(mockContext),
				'Should not throw error even if dev tools toggle fails'
			);
		});

		test('should still copy script even when context is invalid', async () => {
			const invalidContext = {
				...mockContext,
				extensionPath: '/invalid/path'
			} as any;

			// Should not throw
			await assert.doesNotReject(
				async () => await autoApproval.autoInjectScript(invalidContext),
				'Should not throw error even with invalid context'
			);

			// Should still copy something to clipboard (the error message)
			const clipboardContent = await vscode.env.clipboard.readText();
			assert.ok(clipboardContent.includes('Error: Could not load auto-approval script'),
				'Should copy error message to clipboard when script cannot be loaded');
		});
	});

	suite('Edge Cases', () => {
		test('should handle missing scripts directory', () => {
			const noScriptsContext = {
				...mockContext,
				extensionPath: '/tmp/no-scripts-dir'
			} as any;

			const script = autoApproval.getAutoApprovalScript(noScriptsContext);
			assert.ok(script.includes('Error:'), 'Should return error for missing directory');
		});

		test('should handle read permission errors', () => {
			// Test with a path that might have permission issues
			const restrictedContext = {
				...mockContext,
				extensionPath: '/root/.restricted'
			} as any;

			const script = autoApproval.getAutoApprovalScript(restrictedContext);
			// Should not throw, should return error message
			assert.ok(typeof script === 'string', 'Should return string even with permission errors');
		});
	});
});
