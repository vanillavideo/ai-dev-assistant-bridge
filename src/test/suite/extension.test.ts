import * as assert from 'assert';
import * as vscode from 'vscode';

suite('AI Feedback Bridge Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('local.ai-feedback-bridge'));
	});

	test('Extension should activate', async () => {
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		assert.ok(ext);
		await ext!.activate();
		assert.strictEqual(ext!.isActive, true);
	});

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		
		const expectedCommands = [
			'ai-feedback-bridge.openSettings',
			'ai-feedback-bridge.injectScript',
			'ai-feedback-bridge.toggleAutoContinue',
			'ai-feedback-bridge.changePort',
			'ai-feedback-bridge.showStatus'
		];

		expectedCommands.forEach(cmd => {
			assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
		});
	});

	test('Configuration should have expected settings', () => {
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		
		// Check that key settings exist (they'll have default values)
		assert.notStrictEqual(config.get('port'), undefined);
		assert.notStrictEqual(config.get('autoStart'), undefined);
		assert.notStrictEqual(config.get('autoApproval.enabled'), undefined);
		assert.notStrictEqual(config.get('autoApproval.autoInject'), undefined);
		assert.notStrictEqual(config.get('autoContinue.enabled'), undefined);
	});

	test('Auto-continue categories should exist', () => {
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		const categories = ['tasks', 'improvements', 'coverage', 'robustness', 'cleanup', 'commits'];
		
		categories.forEach(category => {
			assert.notStrictEqual(
				config.get(`autoContinue.${category}.enabled`), 
				undefined,
				`Category ${category} should have enabled setting`
			);
			assert.notStrictEqual(
				config.get(`autoContinue.${category}.interval`), 
				undefined,
				`Category ${category} should have interval setting`
			);
			assert.notStrictEqual(
				config.get(`autoContinue.${category}.message`), 
				undefined,
				`Category ${category} should have message setting`
			);
		});
	});

	test('Status bar items should be created', async function() {
		this.timeout(5000);
		
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		await ext!.activate();
		
		// Give status bar items time to be created
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// We can't directly test status bar items visibility, but we can verify
		// the extension activated without errors
		assert.strictEqual(ext!.isActive, true);
	});

	test('Opening settings should work', async function() {
		this.timeout(10000);
		
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		await ext!.activate();
		
		// Execute the openSettings command
		await vscode.commands.executeCommand('ai-feedback-bridge.openSettings');
		
		// Give it time to create the webview
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// If we got here without errors, the command worked
		assert.ok(true);
	});

	test('Toggle auto-continue should work', async function() {
		this.timeout(5000);
		
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		const initialState = config.get<boolean>('autoContinue.enabled', false);
		
		// Toggle the setting
		await vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');
		
		// Wait a bit for the setting to update
		await new Promise(resolve => setTimeout(resolve, 500));
		
		const newState = config.get<boolean>('autoContinue.enabled', false);
		assert.strictEqual(newState, !initialState, 'Auto-continue state should toggle');
		
		// Toggle back to restore original state
		await vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');
	});

	test('Default port should be 3737', () => {
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		const defaultPort = config.get<number>('port');
		assert.strictEqual(defaultPort, 3737);
	});

	test('Default auto-continue intervals should be correct', () => {
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		
		const expectedIntervals = {
			tasks: 300,
			improvements: 600,
			coverage: 900,
			robustness: 600,
			cleanup: 1200,
			commits: 900
		};
		
		Object.entries(expectedIntervals).forEach(([category, interval]) => {
			const actualInterval = config.get<number>(`autoContinue.${category}.interval`);
			assert.strictEqual(
				actualInterval, 
				interval, 
				`${category} interval should be ${interval}`
			);
		});
	});

	test('Auto-inject should be disabled by default', () => {
		const config = vscode.workspace.getConfiguration('aiFeedbackBridge');
		const autoInject = config.get<boolean>('autoApproval.autoInject');
		assert.strictEqual(autoInject, false, 'Auto-inject should be disabled by default');
	});
});
