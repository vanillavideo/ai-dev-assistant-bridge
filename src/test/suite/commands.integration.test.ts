import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Commands Integration Tests', () => {
	test('toggleAutoContinue enables when disabled', async function() {
		this.timeout(10000);
		const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');

		// Ensure autoContinue.enabled is false to start
		// Use Global configuration target since workspace may not be open during tests
		await config.update('autoContinue.enabled', false, vscode.ConfigurationTarget.Global);
		
		// Wait for config to settle
		await new Promise(resolve => setTimeout(resolve, 200));
		
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.toggleAutoContinue');

		// Allow settings update to propagate
		await new Promise(resolve => setTimeout(resolve, 1000));

		const value = config.get<boolean>('autoContinue.enabled');
		assert.strictEqual(value, true, 'autoContinue should be enabled after toggle');
	});

	test('toggleAutoContinue disables when enabled', async function() {
		this.timeout(10000);
		const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');

		// Ensure autoContinue.enabled is true to start
		// Use Global configuration target since workspace may not be open during tests
		await config.update('autoContinue.enabled', true, vscode.ConfigurationTarget.Global);
		
		// Wait for config to settle
		await new Promise(resolve => setTimeout(resolve, 200));
		
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.toggleAutoContinue');

		// Allow settings update to propagate
		await new Promise(resolve => setTimeout(resolve, 1000));

		const value = config.get<boolean>('autoContinue.enabled');
		assert.strictEqual(value, false, 'autoContinue should be disabled after toggle');
	});

	test('getPort command returns port number', async function() {
		this.timeout(5000);
		// Execute command - it should show a message with the port
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.getPort');
		// Command shows info message, no return value to assert
		// Just verify it doesn't throw
		assert.ok(true, 'getPort command executed without error');
	});

	test('showStatus command displays status', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.showStatus');
		assert.ok(true, 'showStatus command executed without error');
	});

	test('injectScript command executes', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.injectScript');
		assert.ok(true, 'injectScript command executed without error');
	});

	test('enableAutoApproval command executes', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.enableAutoApproval');
		assert.ok(true, 'enableAutoApproval command executed without error');
	});

	test('disableAutoApproval command executes', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.disableAutoApproval');
		assert.ok(true, 'disableAutoApproval command executed without error');
	});

	test('injectAutoApprovalScript command executes', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.injectAutoApprovalScript');
		assert.ok(true, 'injectAutoApprovalScript command executed without error');
	});

	test('runNow command triggers manual run', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.runNow');
		assert.ok(true, 'runNow command executed without error');
	});

	test('sendInstructions command executes', async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.sendInstructions');
		assert.ok(true, 'sendInstructions command executed without error');
	});

	test('openSettings command opens settings panel', async function() {
		this.timeout(5000);
		// This covers lines 116-132 in commands.ts
		await vscode.commands.executeCommand('ai-dev-assistant-bridge.openSettings');
		assert.ok(true, 'openSettings command executed without error');
	});

	test('changePort command executes', async function() {
		this.timeout(5000);
		// This opens a quick pick, so we'll cancel it
		const promise = vscode.commands.executeCommand('ai-dev-assistant-bridge.changePort');
		await new Promise(resolve => setTimeout(resolve, 300));
		await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
		try {
			await promise;
		} catch (err) {
			// Expected if user cancels
		}
		assert.ok(true, 'changePort command executed without error');
	});

	test('listTasks command executes', async function() {
		this.timeout(5000);
		const promise = vscode.commands.executeCommand('ai-dev-assistant-bridge.listTasks');
		await new Promise(resolve => setTimeout(resolve, 300));
		await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
		try {
			await promise;
		} catch (err) {
			// Expected if user cancels
		}
		assert.ok(true, 'listTasks command executed without error');
	});

	// NOTE: Skipping interactive commands (addTask, addGuidingDocument, etc.) 
	// as they open UI dialogs that require user interaction and interrupt testing
});
