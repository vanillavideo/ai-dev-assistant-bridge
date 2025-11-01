import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Commands Integration Tests', () => {
	test('toggleAutoContinue enables when disabled', async function() {
		this.timeout(8000);
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');

		// Ensure autoContinue.enabled is false to start
		// Use Global configuration target since workspace may not be open during tests
		await config.update('autoContinue.enabled', false, vscode.ConfigurationTarget.Global);
		await vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');

		// Allow settings update to propagate
		await new Promise(resolve => setTimeout(resolve, 500));

		const value = config.get<boolean>('autoContinue.enabled');
		assert.strictEqual(value, true, 'autoContinue should be enabled after toggle');
	});

	test('toggleAutoContinue disables when enabled', async function() {
		this.timeout(8000);
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');

		// Ensure autoContinue.enabled is true to start
		// Use Global configuration target since workspace may not be open during tests
		await config.update('autoContinue.enabled', true, vscode.ConfigurationTarget.Global);
		await vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');

		// Allow settings update to propagate
		await new Promise(resolve => setTimeout(resolve, 500));

		const value = config.get<boolean>('autoContinue.enabled');
		assert.strictEqual(value, false, 'autoContinue should be disabled after toggle');
	});
});
