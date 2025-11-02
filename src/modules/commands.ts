/**
 * Commands Module
 * 
 * Central registry for all VS Code commands used by the extension.
 * Provides dependency injection pattern for command registration.
 * 
 * Commands (13 total):
 * - openSettings: Show settings webview panel
 * - runNow: Manually trigger auto-continue check
 * - injectScript: Open inject script input box
 * - getPort: Show current server port
 * - addTask: Create new task via input
 * - listTasks: Show all tasks in webview
 * - sendToCopilotChat: Send arbitrary message to chat
 * - toggleAutoContinue: Enable/disable auto-continue feature
 * - changePort: Update server port via input
 * - showStatus: Display extension status info
 * - enableAutoApproval: Turn on auto-approval
 * - disableAutoApproval: Turn off auto-approval
 * - injectAutoApprovalScript: Manually inject approval script
 * 
 * Architecture:
 * - Dependency injection via CommandDependencies interface
 * - All commands registered in single function call
 * - Proper cleanup via context.subscriptions
 * - Separation of concerns (commands don't implement logic)
 */

import * as vscode from 'vscode';
import { log } from './logging';
import { LogLevel } from './types';
import * as settingsPanelModule from './settingsPanel';
import * as taskManager from './taskManager';
import * as autoContinue from './autoContinue';
import * as chatIntegration from './chatIntegration';
import * as statusBar from './statusBar';
import * as guidingDocuments from './guidingDocuments';
import { Task } from './types';
import { validatePort, parseIntegerString } from './numberValidation';

/**
 * Dependencies required for command execution
 * 
 * @property context - VS Code extension context for subscriptions and state
 * @property currentPort - Current HTTP server port number
 * @property getConfig - Function to get current workspace configuration
 * @property updateConfig - Function to update configuration values
 * @property sendToAgent - Function to send messages to Copilot Chat
 * @property autoInjectScript - Function to auto-inject custom scripts
 * @property enableAutoApproval - Function to enable auto-approval feature
 * @property disableAutoApproval - Function to disable auto-approval feature
 * @property injectAutoApprovalScript - Function to manually inject approval script
 * @property startCountdownUpdates - Function to start countdown timer updates
 * @property stopCountdownUpdates - Function to stop countdown timer updates
 * @property outputChannel - Output channel for logging
 * @property server - HTTP server instance for status checks
 */
export interface CommandDependencies {
	context: vscode.ExtensionContext;
	currentPort: number;
	getConfig: () => vscode.WorkspaceConfiguration;
	updateConfig: (key: string, value: any) => Promise<void>;
	sendToAgent: (message: string, metadata?: any) => Promise<boolean>;
	autoInjectScript: (context: vscode.ExtensionContext) => void;
	enableAutoApproval: (context: vscode.ExtensionContext) => void;
	disableAutoApproval: () => void;
	injectAutoApprovalScript: () => void;
	startCountdownUpdates: (context: vscode.ExtensionContext) => void;
	stopCountdownUpdates: () => void;
	outputChannel: vscode.OutputChannel;
	server: any; // HTTP server instance
}

/**
 * Register all extension commands with dependency injection
 * 
 * @param deps - Command dependencies object containing all required functions and state
 * 
 * @remarks
 * Registers 13 commands total:
 * 1. openSettings - Shows settings webview with configuration UI
 * 2. runNow - Manually triggers auto-continue reminder check (force=true)
 * 3. injectScript - Opens input box for custom script injection
 * 4. getPort - Displays current HTTP server port in message
 * 5. addTask - Creates new task via input dialogs (title, description, category)
 * 6. listTasks - Shows all tasks in webview panel
 * 7. sendToCopilotChat - Sends arbitrary message to Copilot Chat
 * 8. toggleAutoContinue - Enables/disables auto-continue with status bar updates
 * 9. changePort - Updates server port via input box
 * 10. showStatus - Displays extension status (port, auto-continue, chat)
 * 11. enableAutoApproval - Turns on auto-approval feature
 * 12. disableAutoApproval - Turns off auto-approval feature
 * 13. injectAutoApprovalScript - Manually injects approval script into chat UI
 * 
 * All commands are:
 * - Registered with context.subscriptions for automatic cleanup
 * - Implemented using dependency injection (no direct module coupling)
 * - Wrapped with try-catch for error handling
 * - Logged for debugging and audit trail
 * 
 * @example
 * ```typescript
 * const deps: CommandDependencies = {
 *   context,
 *   currentPort: 3737,
 *   getConfig: () => vscode.workspace.getConfiguration('aiDevAssistantBridge'),
 *   updateConfig: async (key, value) => { ... },
 *   sendToAgent: async (msg) => { ... },
 *   // ... other dependencies
 * };
 * registerCommands(deps);
 * // All 13 commands now registered and ready
 * ```
 */
export function registerCommands(deps: CommandDependencies): void {
	const { context } = deps;

	// Settings command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.openSettings', async () => {
			settingsPanelModule.showSettingsPanel(
				deps.context,
				deps.currentPort,
				deps.getConfig,
				deps.updateConfig,
				deps.sendToAgent,
				(ctx: vscode.ExtensionContext, force?: boolean) =>
					autoContinue.getSmartAutoContinueMessage(ctx, deps.getConfig, force)
			);
		})
	);

	// Run now command - manually trigger reminder check
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.runNow', async () => {
			try {
				const message = await autoContinue.getSmartAutoContinueMessage(
					deps.context,
					deps.getConfig,
					true // force=true to ignore intervals
				);
				if (message) {
					log(LogLevel.INFO, '[Run Now] Manually triggered all enabled reminders');
					await deps.sendToAgent(message, {
						source: 'manual_trigger',
						timestamp: new Date().toISOString()
					});
				} else {
					vscode.window.showInformationMessage('No enabled categories (check settings)');
				}
			} catch (error) {
				log(LogLevel.ERROR, '[Run Now] Failed to send message', { error });
				vscode.window.showErrorMessage('Failed to send reminders');
			}
		})
	);

	// Inject script command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.injectScript', async () => {
			deps.autoInjectScript(deps.context);
		})
	);

	// Get port command - returns the current port for this window
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.getPort', () => {
			return deps.currentPort;
		})
	);

	// Add task command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.addTask', async () => {
			const title = await vscode.window.showInputBox({ prompt: 'Task title' });
			if (!title) {
				return;
			}

			const description = await vscode.window.showInputBox({
				prompt: 'Task description (optional)'
			});
			const category = (await vscode.window.showQuickPick(
				['bug', 'feature', 'improvement', 'documentation', 'testing', 'other'],
				{ placeHolder: 'Select category' }
			)) as Task['category'] | undefined;

			await taskManager.addTask(
				deps.context,
				title,
				description || '',
				category || 'other'
			);
			await settingsPanelModule.refreshSettingsPanel(
				deps.context,
				deps.getConfig,
				deps.currentPort
			);
		})
	);

	// List tasks command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.listTasks', async () => {
			const tasks = await taskManager.getTasks(deps.context);
			if (tasks.length === 0) {
				vscode.window.showInformationMessage('No tasks found');
				return;
			}

			const items = tasks.map((t) => ({
				label: `${t.status === 'completed' ? '✅' : t.status === 'in-progress' ? '🔄' : '⏳'} ${t.title}`,
				description: t.description,
				task: t
			}));

			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: 'Select a task to update'
			});

			if (selected) {
				const action = await vscode.window.showQuickPick(
					['Mark as In Progress', 'Mark as Completed', 'Mark as Pending', 'Delete'],
					{ placeHolder: 'What do you want to do?' }
				);

				if (action === 'Delete') {
					await taskManager.removeTask(deps.context, selected.task.id);
				} else if (action === 'Mark as In Progress') {
					await taskManager.updateTaskStatus(deps.context, selected.task.id, 'in-progress');
				} else if (action === 'Mark as Completed') {
					await taskManager.updateTaskStatus(deps.context, selected.task.id, 'completed');
				} else if (action === 'Mark as Pending') {
					await taskManager.updateTaskStatus(deps.context, selected.task.id, 'pending');
				}

				await settingsPanelModule.refreshSettingsPanel(
					deps.context,
					deps.getConfig,
					deps.currentPort
				);
			}
		})
	);

	// Send to Copilot Chat command
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-agent-feedback-bridge.sendToCopilotChat',
			async (feedbackText?: string) => {
				if (!feedbackText) {
					feedbackText = await vscode.window.showInputBox({
						prompt: 'Enter feedback to send to Copilot Chat',
						placeHolder: 'Describe the issue or request...'
					});
				}

				if (feedbackText) {
					await chatIntegration.sendToCopilotChat(feedbackText, {
						source: 'manual_command',
						timestamp: new Date().toISOString()
					});
				}
			}
		)
	);

	// Toggle auto-continue command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.toggleAutoContinue', async () => {
			const cfg = deps.getConfig();
			const currentState = cfg.get<boolean>('autoContinue.enabled', false);
			await deps.updateConfig('autoContinue.enabled', !currentState);
			log(LogLevel.INFO, `Auto-Continue ${!currentState ? 'enabled' : 'disabled'}`);

			// Start or stop countdown updates based on new state
			if (!currentState) {
				deps.startCountdownUpdates(deps.context);
			} else {
				deps.stopCountdownUpdates();
			}

			// Refresh settings panel if it's open
			settingsPanelModule.refreshSettingsPanel(
				deps.context,
				deps.getConfig,
				deps.currentPort
			);
		})
	);

	// Change port command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.changePort', async () => {
			const newPort = await vscode.window.showInputBox({
				prompt: 'Enter new port number',
				value: deps.currentPort.toString(),
				validateInput: (value) => {
					// Parse the string to integer
					const parseResult = parseIntegerString(value);
					if (!parseResult.valid) {
						return 'Invalid port (must be an integer)';
					}
					
					// Validate the port range
					const portResult = validatePort(parseInt(value));
					if (!portResult.valid) {
						return portResult.error || 'Invalid port (1024-65535)';
					}
					
					return null;
				}
			});
			if (newPort) {
				await deps.updateConfig('port', parseInt(newPort));
				log(LogLevel.INFO, `Port changed to ${newPort}. Reloading VS Code...`);
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}
		})
	);

	// Show status command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-dev-assistant-bridge.showStatus', () => {
			const cfg = deps.getConfig();
			const autoInterval = cfg.get<number>('autoContinue.interval', 300);
			const autoEnabled = cfg.get<boolean>('autoContinue.enabled', false);
			const workspaceName = vscode.workspace.name || 'No Workspace';
			const msg =
				`🌉 AI Dev Assistant Bridge Status\n\n` +
				`Window: ${workspaceName}\n` +
				`Port: ${deps.currentPort}\n` +
				`Server: ${deps.server ? 'Running ✅' : 'Stopped ❌'}\n` +
				`Auto-Continue: ${autoEnabled ? `Enabled ✅ (every ${autoInterval}s)` : 'Disabled ❌'}\n` +
				`Endpoint: http://localhost:${deps.currentPort}`;
			deps.outputChannel.appendLine(msg);
			deps.outputChannel.show();
		})
	);

	// Auto-approval commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-agent-feedback-bridge.enableAutoApproval',
			() => deps.enableAutoApproval(deps.context)
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-agent-feedback-bridge.disableAutoApproval',
			() => deps.disableAutoApproval()
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-agent-feedback-bridge.injectAutoApprovalScript',
			() => deps.injectAutoApprovalScript()
		)
	);

	// Guiding documents commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-dev-assistant-bridge.addGuidingDocument',
			() => guidingDocuments.showAddDocumentPicker()
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-dev-assistant-bridge.removeGuidingDocument',
			() => guidingDocuments.showRemoveDocumentPicker()
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'ai-dev-assistant-bridge.listGuidingDocuments',
			() => guidingDocuments.showGuidingDocumentsList()
		)
	);

	log(LogLevel.INFO, 'All commands registered successfully');
}
