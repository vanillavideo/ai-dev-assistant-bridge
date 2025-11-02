/**
 * Commands Module Unit Tests
 * 
 * Tests command registration and execution paths with mocked dependencies
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { registerCommands, CommandDependencies } from '../../modules/commands';

suite('Commands Module Unit Tests', () => {
	let mockContext: vscode.ExtensionContext;
	let commandsRegistered: Map<string, (...args: any[]) => any>;

	setup(() => {
		// Create mock context that captures registered commands
		commandsRegistered = new Map();
		
		mockContext = {
			subscriptions: [],
			globalState: {
				get: () => ({}),
				update: async () => {},
				keys: () => []
			},
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			},
			extensionPath: '/test/path'
		} as any;

		// Override vscode.commands.registerCommand to capture registrations
		const originalRegister = vscode.commands.registerCommand;
		vscode.commands.registerCommand = ((commandId: string, callback: (...args: any[]) => any) => {
			commandsRegistered.set(commandId, callback);
			const disposable = originalRegister(commandId, callback);
			mockContext.subscriptions.push(disposable);
			return disposable;
		}) as any;
	});

	test('registerCommands should register all 16 commands', () => {
		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: {
				appendLine: () => {},
				show: () => {}
			} as any,
			server: { listening: true }
		};

		registerCommands(deps);

		// Verify all commands registered
		assert.strictEqual(commandsRegistered.size, 16, 'Should register 16 commands');
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.openSettings'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.runNow'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.injectScript'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.getPort'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.addTask'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.listTasks'));
		assert.ok(commandsRegistered.has('ai-agent-feedback-bridge.sendToCopilotChat'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.toggleAutoContinue'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.changePort'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.showStatus'));
		assert.ok(commandsRegistered.has('ai-agent-feedback-bridge.enableAutoApproval'));
		assert.ok(commandsRegistered.has('ai-agent-feedback-bridge.disableAutoApproval'));
		assert.ok(commandsRegistered.has('ai-agent-feedback-bridge.injectAutoApprovalScript'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.addGuidingDocument'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.removeGuidingDocument'));
		assert.ok(commandsRegistered.has('ai-dev-assistant-bridge.listGuidingDocuments'));
	});

	test('getPort command should return current port', async () => {
		const testPort = 4545;
		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: testPort,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const getPortCmd = commandsRegistered.get('ai-dev-assistant-bridge.getPort');
		assert.ok(getPortCmd, 'getPort command should be registered');

		const port = getPortCmd!();
		assert.strictEqual(port, testPort, 'Should return correct port');
	});

	test('showStatus command should display status information', () => {
		let outputLines: string[] = [];
		let showCalled = false;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.interval') {
					return 600;
				}
				if (key === 'autoContinue.enabled') {
					return true;
				}
				return defaultValue;
			}
		} as any;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => mockConfig,
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: {
				appendLine: (line: string) => outputLines.push(line),
				show: () => { showCalled = true; }
			} as any,
			server: { listening: true }
		};

		registerCommands(deps);

		const showStatusCmd = commandsRegistered.get('ai-dev-assistant-bridge.showStatus');
		assert.ok(showStatusCmd, 'showStatus command should be registered');

		showStatusCmd!();

		assert.ok(outputLines.length > 0, 'Should output status lines');
		assert.ok(showCalled, 'Should show output channel');
		assert.ok(outputLines[0].includes('AI Dev Assistant Bridge Status'), 'Should include header');
		assert.ok(outputLines[0].includes('3737'), 'Should include port');
	});

	test('showStatus should handle null server', () => {
		let outputLines: string[] = [];

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: {
				appendLine: (line: string) => outputLines.push(line),
				show: () => {}
			} as any,
			server: null // No server
		};

		registerCommands(deps);

		const showStatusCmd = commandsRegistered.get('ai-dev-assistant-bridge.showStatus');
		showStatusCmd!();

		assert.ok(outputLines[0].includes('Stopped ❌'), 'Should show server stopped');
	});

	test('toggleAutoContinue should toggle from enabled to disabled', async () => {
		let currentValue = true;
		let stopCalled = false;
		let startCalled = false;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return currentValue;
				}
				return defaultValue;
			}
		} as any;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => mockConfig,
			updateConfig: async (key: string, value: any) => {
				if (key === 'autoContinue.enabled') {
					currentValue = value;
				}
			},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => { startCalled = true; },
			stopCountdownUpdates: () => { stopCalled = true; },
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const toggleCmd = commandsRegistered.get('ai-dev-assistant-bridge.toggleAutoContinue');
		await toggleCmd!();

		assert.strictEqual(currentValue, false, 'Should toggle to disabled');
		assert.strictEqual(stopCalled, true, 'Should call stopCountdownUpdates');
		assert.strictEqual(startCalled, false, 'Should not call startCountdownUpdates when disabling');
	});

	test('toggleAutoContinue should toggle from disabled to enabled', async () => {
		let currentValue = false;
		let stopCalled = false;
		let startCalled = false;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return currentValue;
				}
				return defaultValue;
			}
		} as any;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => mockConfig,
			updateConfig: async (key: string, value: any) => {
				if (key === 'autoContinue.enabled') {
					currentValue = value;
				}
			},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => { startCalled = true; },
			stopCountdownUpdates: () => { stopCalled = true; },
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const toggleCmd = commandsRegistered.get('ai-dev-assistant-bridge.toggleAutoContinue');
		await toggleCmd!();

		assert.strictEqual(currentValue, true, 'Should toggle to enabled');
		assert.strictEqual(startCalled, true, 'Should call startCountdownUpdates');
		assert.strictEqual(stopCalled, false, 'Should not call stopCountdownUpdates when enabling');
	});

	test('injectScript command should call autoInjectScript', () => {
		let injected = false;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => { injected = true; },
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const injectCmd = commandsRegistered.get('ai-dev-assistant-bridge.injectScript');
		injectCmd!();

		assert.strictEqual(injected, true, 'Should call autoInjectScript');
	});

	test('enableAutoApproval command should call enableAutoApproval', () => {
		let enabled = false;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => { enabled = true; },
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const enableCmd = commandsRegistered.get('ai-agent-feedback-bridge.enableAutoApproval');
		enableCmd!();

		assert.strictEqual(enabled, true, 'Should call enableAutoApproval');
	});

	test('disableAutoApproval command should call disableAutoApproval', () => {
		let disabled = false;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => { disabled = true; },
			injectAutoApprovalScript: () => {},
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const disableCmd = commandsRegistered.get('ai-agent-feedback-bridge.disableAutoApproval');
		disableCmd!();

		assert.strictEqual(disabled, true, 'Should call disableAutoApproval');
	});

	test('injectAutoApprovalScript command should call injectAutoApprovalScript', () => {
		let injected = false;

		const deps: CommandDependencies = {
			context: mockContext,
			currentPort: 3737,
			getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
			updateConfig: async () => {},
			sendToAgent: async () => true,
			autoInjectScript: () => {},
			enableAutoApproval: () => {},
			disableAutoApproval: () => {},
			injectAutoApprovalScript: () => { injected = true; },
			startCountdownUpdates: () => {},
			stopCountdownUpdates: () => {},
			outputChannel: { appendLine: () => {}, show: () => {} } as any,
			server: null
		};

		registerCommands(deps);

		const injectCmd = commandsRegistered.get('ai-agent-feedback-bridge.injectAutoApprovalScript');
		injectCmd!();

		assert.strictEqual(injected, true, 'Should call injectAutoApprovalScript');
	});
});
