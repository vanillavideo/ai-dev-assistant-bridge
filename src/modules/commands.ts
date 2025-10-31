/**
 * Commands Module
 * 
 * Central registry for all VS Code commands used by the extension.
 * Handles command registration, lifecycle management, and context coordination.
 */

import * as vscode from 'vscode';
import { log } from './logging';
import { LogLevel } from './types';
import * as settingsPanelModule from './settingsPanel';
import * as taskManager from './taskManager';
import * as autoContinue from './autoContinue';
import * as chatIntegration from './chatIntegration';
import * as statusBar from './statusBar';
import { Task } from './types';

/**
 * Dependencies required for command execution
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
 * Register all extension commands
 */
export function registerCommands(deps: CommandDependencies): void {
	const { context } = deps;

	// Settings command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-feedback-bridge.openSettings', async () => {
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
		vscode.commands.registerCommand('ai-feedback-bridge.runNow', async () => {
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
		vscode.commands.registerCommand('ai-feedback-bridge.injectScript', async () => {
			deps.autoInjectScript(deps.context);
		})
	);

	// Get port command - returns the current port for this window
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-feedback-bridge.getPort', () => {
			return deps.currentPort;
		})
	);

	// Add task command
	context.subscriptions.push(
		vscode.commands.registerCommand('ai-feedback-bridge.addTask', async () => {
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
		vscode.commands.registerCommand('ai-feedback-bridge.listTasks', async () => {
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
		vscode.commands.registerCommand('ai-feedback-bridge.toggleAutoContinue', async () => {
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
		vscode.commands.registerCommand('ai-feedback-bridge.changePort', async () => {
			const newPort = await vscode.window.showInputBox({
				prompt: 'Enter new port number',
				value: deps.currentPort.toString(),
				validateInput: (value) => {
					const port = parseInt(value);
					return isNaN(port) || port < 1024 || port > 65535
						? 'Invalid port (1024-65535)'
						: null;
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
		vscode.commands.registerCommand('ai-feedback-bridge.showStatus', () => {
			const cfg = deps.getConfig();
			const autoInterval = cfg.get<number>('autoContinue.interval', 300);
			const autoEnabled = cfg.get<boolean>('autoContinue.enabled', false);
			const workspaceName = vscode.workspace.name || 'No Workspace';
			const msg =
				`🌉 AI Feedback Bridge Status\n\n` +
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

	log(LogLevel.INFO, 'All commands registered successfully');
}
