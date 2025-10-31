// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// Import modules
import { Task, LogLevel } from './modules/types';
import { initLogging, log, getErrorMessage } from './modules/logging';
import * as taskManager from './modules/taskManager';
import * as portManager from './modules/portManager';
import * as server from './modules/server';
import { autoInjectScript } from './modules/autoApproval';
import * as settingsPanelModule from './modules/settingsPanel';
import * as chatIntegration from './modules/chatIntegration';

let outputChannel: vscode.OutputChannel;
let statusBarToggle: vscode.StatusBarItem | undefined;
let statusBarSettings: vscode.StatusBarItem | undefined;
let statusBarInject: vscode.StatusBarItem | undefined;
let autoContinueTimer: NodeJS.Timeout | undefined;
let currentPort: number = 3737;
let autoApprovalInterval: NodeJS.Timeout | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Get configuration with proper scope for window isolation
 * This ensures each VS Code window can have independent settings
 */
function getConfig(): vscode.WorkspaceConfiguration {
	// Get workspace-specific configuration
	return vscode.workspace.getConfiguration('aiFeedbackBridge');
}

/**
 * Update configuration for workspace scope
 */
async function updateConfig(key: string, value: unknown): Promise<void> {
	const config = getConfig();
	// Use Workspace target so settings are workspace-specific
	await config.update(key, value, vscode.ConfigurationTarget.Workspace);
	
	log(LogLevel.DEBUG, `Config updated: ${key} = ${value}`, {
		scope: 'Workspace',
		newValue: config.get(key)
	});
}

export async function activate(context: vscode.ExtensionContext) {
	// Store context globally for deactivation
	extensionContext = context;

	// Create output channel for logs
	outputChannel = vscode.window.createOutputChannel('AI Agent Feedback');
	context.subscriptions.push(outputChannel);
	
	// Initialize logging module
	initLogging(outputChannel);
	
	// Initialize chat integration module
	chatIntegration.initChat(outputChannel);
	
	log(LogLevel.INFO, '🚀 AI Agent Feedback Bridge activated');

	// Auto-select available port (or use configured port if valid)
	const config = getConfig();
	
	// MIGRATION: Clear any old Global settings to force workspace scope
	const globalConfig = vscode.workspace.getConfiguration('aiFeedbackBridge');
	const globalEnabled = globalConfig.inspect<boolean>('autoContinue.enabled');
	if (globalEnabled?.globalValue !== undefined) {
		log(LogLevel.WARN, 'Detected old Global settings, clearing to use Workspace scope');
		await globalConfig.update('autoContinue.enabled', undefined, vscode.ConfigurationTarget.Global);
	}
	
	const configuredPort = config.get<number>('port');
	
	// Always use auto-selection to ensure each window gets unique port
	// Don't save back to config - let each window find its own port
	currentPort = await portManager.findAvailablePort(context);
	log(LogLevel.INFO, `Auto-selected port: ${currentPort} for this window`);
	
	// Log window identification to help debug multi-window scenarios
	const workspaceName = vscode.workspace.name || 'No Workspace';
	const workspaceFolders = vscode.workspace.workspaceFolders?.length || 0;
	log(LogLevel.INFO, `Window context: ${workspaceName} (${workspaceFolders} folders)`);

	// Create 3 separate status bar buttons (adjacent with same priority base)
	// Button 1: Settings/Info - shows port and opens settings
	statusBarSettings = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarSettings.command = 'ai-feedback-bridge.openSettings';
	statusBarSettings.show();
	context.subscriptions.push(statusBarSettings);
	
	// Button 2: Toggle Auto-Continue (Start/Stop) - right next to settings
	statusBarToggle = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
	statusBarToggle.command = 'ai-feedback-bridge.toggleAutoContinue';
	statusBarToggle.show();
	context.subscriptions.push(statusBarToggle);
	
	// Button 3: Inject Script - quick access to copy script
	statusBarInject = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
	statusBarInject.command = 'ai-feedback-bridge.injectScript';
	statusBarInject.text = '$(clippy) Inject';
	statusBarInject.tooltip = 'Copy auto-approval script to clipboard';
	statusBarInject.show();
	context.subscriptions.push(statusBarInject);
	
	// Update buttons with current state
	updateStatusBar(config);

	// Register open settings command with custom webview
	const openSettingsCmd = vscode.commands.registerCommand('ai-feedback-bridge.openSettings', async () => {
		settingsPanelModule.showSettingsPanel(context, currentPort, getConfig, updateConfig, chatIntegration.sendToAgent, getSmartAutoContinueMessage);
	});
	context.subscriptions.push(openSettingsCmd);
	
	// Register run now command - manually trigger reminder check
	const runNowCmd = vscode.commands.registerCommand('ai-feedback-bridge.runNow', async () => {
		try {
			const message = await getSmartAutoContinueMessage(context, true); // force=true to ignore intervals
			if (message) {
				log(LogLevel.INFO, '[Run Now] Manually triggered all enabled reminders');
				await chatIntegration.sendToAgent(message, { 
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
	});
	context.subscriptions.push(runNowCmd);
	
	// Register inject script command
	const injectScriptCmd = vscode.commands.registerCommand('ai-feedback-bridge.injectScript', async () => {
		autoInjectScript(extensionContext!);
	});
	context.subscriptions.push(injectScriptCmd);
	
	// Register get port command - returns the current port for this window
	const getPortCmd = vscode.commands.registerCommand('ai-feedback-bridge.getPort', () => {
		return currentPort;
	});
	context.subscriptions.push(getPortCmd);

	// Register task management commands
	const addTaskCmd = vscode.commands.registerCommand('ai-feedback-bridge.addTask', async () => {
		const title = await vscode.window.showInputBox({ prompt: 'Task title' });
		if (!title) {
			return;
		}
		
		const description = await vscode.window.showInputBox({ prompt: 'Task description (optional)' });
		const category = await vscode.window.showQuickPick(
			['bug', 'feature', 'improvement', 'documentation', 'testing', 'other'],
			{ placeHolder: 'Select category' }
		) as Task['category'] | undefined;
		
		await taskManager.addTask(context, title, description || '', category || 'other');
		await settingsPanelModule.refreshSettingsPanel(extensionContext!, getConfig, currentPort);
	});
	context.subscriptions.push(addTaskCmd);

	const listTasksCmd = vscode.commands.registerCommand('ai-feedback-bridge.listTasks', async () => {
		const tasks = await taskManager.getTasks(context);
		if (tasks.length === 0) {
			vscode.window.showInformationMessage('No tasks found');
			return;
		}
		
		const items = tasks.map(t => ({
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
				await taskManager.removeTask(context, selected.task.id);
			} else if (action === 'Mark as In Progress') {
				await taskManager.updateTaskStatus(context, selected.task.id, 'in-progress');
			} else if (action === 'Mark as Completed') {
				await taskManager.updateTaskStatus(context, selected.task.id, 'completed');
			} else if (action === 'Mark as Pending') {
				await taskManager.updateTaskStatus(context, selected.task.id, 'pending');
			}
			
			await settingsPanelModule.refreshSettingsPanel(extensionContext!, getConfig, currentPort);
		}
	});
	context.subscriptions.push(listTasksCmd);

	// Start HTTP server to receive feedback
	startFeedbackServer(context);

	// Register command to manually open chat with feedback
	const disposable = vscode.commands.registerCommand('ai-agent-feedback-bridge.sendToCopilotChat', async (feedbackText?: string) => {
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
	});

	context.subscriptions.push(disposable);

	// Register toggle auto-continue command
	const toggleAutoContinueCmd = vscode.commands.registerCommand('ai-feedback-bridge.toggleAutoContinue', async () => {
		const cfg = getConfig();
		const currentState = cfg.get<boolean>('autoContinue.enabled', false);
		await updateConfig('autoContinue.enabled', !currentState);
		log(LogLevel.INFO, `Auto-Continue ${!currentState ? 'enabled' : 'disabled'}`);
		
		// Refresh settings panel if it's open
		settingsPanelModule.refreshSettingsPanel(extensionContext!, getConfig, currentPort);
	});
	context.subscriptions.push(toggleAutoContinueCmd);

	// Register change port command
	const changePortCmd = vscode.commands.registerCommand('ai-feedback-bridge.changePort', async () => {
		const newPort = await vscode.window.showInputBox({
			prompt: 'Enter new port number',
			value: currentPort.toString(),
			validateInput: (value) => {
				const port = parseInt(value);
				return (isNaN(port) || port < 1024 || port > 65535) ? 'Invalid port (1024-65535)' : null;
			}
		});
		if (newPort) {
			await updateConfig('port', parseInt(newPort));
			log(LogLevel.INFO, `Port changed to ${newPort}. Reloading VS Code...`);
			vscode.commands.executeCommand('workbench.action.reloadWindow');
		}
	});
	context.subscriptions.push(changePortCmd);

	// Register show status command
	const showStatusCmd = vscode.commands.registerCommand('ai-feedback-bridge.showStatus', () => {
		const cfg = getConfig();
		const autoInterval = cfg.get<number>('autoContinue.interval', 300);
		const autoEnabled = cfg.get<boolean>('autoContinue.enabled', false);
		const workspaceName = vscode.workspace.name || 'No Workspace';
		const msg = `🌉 AI Feedback Bridge Status\n\n` +
			`Window: ${workspaceName}\n` +
			`Port: ${currentPort}\n` +
			`Server: ${server ? 'Running ✅' : 'Stopped ❌'}\n` +
			`Auto-Continue: ${autoEnabled ? `Enabled ✅ (every ${autoInterval}s)` : 'Disabled ❌'}\n` +
			`Endpoint: http://localhost:${currentPort}`;
		outputChannel.appendLine(msg);
		outputChannel.show();
	});
	context.subscriptions.push(showStatusCmd);

	// Start auto-continue only if enabled in config
	const autoEnabled = config.get<boolean>('autoContinue.enabled', false);
	const inspectValue = config.inspect<boolean>('autoContinue.enabled');
	
	log(LogLevel.INFO, `[STARTUP] Auto-Continue check:`, {
		enabled: autoEnabled,
		defaultValue: inspectValue?.defaultValue,
		globalValue: inspectValue?.globalValue,
		workspaceValue: inspectValue?.workspaceValue,
		workspaceFolderValue: inspectValue?.workspaceFolderValue
	});
	
	if (autoEnabled) {
		startAutoContinue(context);
	} else {
		log(LogLevel.INFO, '[STARTUP] Auto-Continue is disabled, not starting');
	}

	// Initialize auto-approval if enabled
	initializeAutoApproval();

	// Watch for configuration changes (window-scoped)
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('aiFeedbackBridge')) {
				const cfg = getConfig();
				
				log(LogLevel.DEBUG, 'Configuration changed', { 
					workspace: vscode.workspace.name,
					affectedKeys: ['port', 'autoContinue'].filter(k => 
						e.affectsConfiguration(`aiFeedbackBridge.${k}`)
					)
				});
				
				// Check for port change
				if (e.affectsConfiguration('aiFeedbackBridge.port')) {
					const newPort = cfg.get<number>('port', 3737);
					if (newPort !== currentPort) {
						log(LogLevel.INFO, `Port change detected: ${currentPort} → ${newPort}. Reloading window...`);
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				}
				
				// Update status bar buttons
				updateStatusBar(cfg);
				
				if (e.affectsConfiguration('aiFeedbackBridge.autoContinue')) {
					restartAutoContinue(context);
				}
			}
		})
	);

	// Register chat participant for automatic processing
	chatIntegration.createChatParticipant(context);

	// Register auto-approval commands
	const enableAutoApprovalCommand = vscode.commands.registerCommand(
		'ai-agent-feedback-bridge.enableAutoApproval',
		() => enableAutoApproval(context)
	);
	context.subscriptions.push(enableAutoApprovalCommand);

	const disableAutoApprovalCommand = vscode.commands.registerCommand(
		'ai-agent-feedback-bridge.disableAutoApproval',
		() => disableAutoApproval()
	);
	context.subscriptions.push(disableAutoApprovalCommand);

	const injectAutoApprovalScriptCommand = vscode.commands.registerCommand(
		'ai-agent-feedback-bridge.injectAutoApprovalScript',
		() => injectAutoApprovalScript()
	);
	context.subscriptions.push(injectAutoApprovalScriptCommand);

	// Log server status (no popup notification)
	log(LogLevel.INFO, `Feedback server started on http://localhost:${currentPort}`);
}

/**
 * Update status bar with current configuration
 */
function updateStatusBar(config: vscode.WorkspaceConfiguration) {
	if (!statusBarToggle || !statusBarSettings) {
		return;
	}
	
	const autoEnabled = config.get<boolean>('autoContinue.enabled', false);
	
	// Settings button shows port and bridge name
	statusBarSettings.text = `AI Dev: ${currentPort}`;
	statusBarSettings.tooltip = 'Click to configure AI Feedback Bridge';
	
	// Toggle button shows Start/Stop with spinning icon when active
	if (autoEnabled) {
		statusBarToggle.text = '$(sync~spin) Stop AI Dev';
		statusBarToggle.tooltip = 'Auto-Continue active\nClick to stop';
	} else {
		statusBarToggle.text = '$(play) Start AI Dev';
		statusBarToggle.tooltip = 'Auto-Continue inactive\nClick to start';
	}
}

/**
 * Get smart auto-continue message by rotating through enabled categories
 * based on elapsed time since last sent
 */
async function getSmartAutoContinueMessage(context: vscode.ExtensionContext, force: boolean = false): Promise<string> {
	const config = getConfig();
	const categories = ['tasks', 'improvements', 'coverage', 'robustness', 'cleanup', 'commits'];
	const now = Date.now();
	const messages: string[] = [];
	
	// Track last sent times in global state
	const lastSentKey = 'autoContinue.lastSent';
	const lastSent = context.globalState.get<Record<string, number>>(lastSentKey, {});
	const newLastSent: Record<string, number> = { ...lastSent };
	
	for (const category of categories) {
		const enabled = config.get<boolean>(`autoContinue.${category}.enabled`, true);
		const interval = config.get<number>(`autoContinue.${category}.interval`, 300);
		const message = config.get<string>(`autoContinue.${category}.message`, '');
		
		if (!enabled || !message) {
			continue;
		}
		
		const lastSentTime = lastSent[category] || 0;
		const elapsed = (now - lastSentTime) / 1000; // seconds
		
		// Include message if enough time has elapsed OR if force=true (manual trigger)
		if (force || elapsed >= interval) {
			messages.push(message);
			newLastSent[category] = now;
		}
	}
	
	// Save updated last sent times
	await context.globalState.update(lastSentKey, newLastSent);
	
	// If no messages due yet, return empty (don't send)
	if (messages.length === 0) {
		return '';
	}
	
	// Combine messages with proper formatting
	return messages.join('. ') + '.';
}

/**
 * Start auto-continue feature if enabled
 */
function startAutoContinue(context: vscode.ExtensionContext) {
	const config = getConfig();
	const enabled = config.get<boolean>('autoContinue.enabled', false);
	
	if (enabled) {
		// Fixed 500ms check interval for responsiveness
		const checkInterval = 500;
		
		const workspaceName = vscode.workspace.name || 'No Workspace';
		log(LogLevel.INFO, `✅ Auto-Continue enabled for window: ${workspaceName}`);
		
		autoContinueTimer = setInterval(async () => {
			try {
				// Re-check if still enabled before sending
				const currentConfig = getConfig();
				const stillEnabled = currentConfig.get<boolean>('autoContinue.enabled', false);
				
				if (!stillEnabled) {
					log(LogLevel.INFO, '[Auto-Continue] Detected disabled state, stopping timer');
					if (autoContinueTimer) {
						clearInterval(autoContinueTimer);
						autoContinueTimer = undefined;
					}
					return;
				}
				
				const message = await getSmartAutoContinueMessage(context);
				if (message) {
					log(LogLevel.INFO, '[Auto-Continue] Sending periodic reminder');
					await chatIntegration.sendToAgent(message, { 
						source: 'auto_continue', 
						timestamp: new Date().toISOString()
					});
				}
			} catch (error) {
				log(LogLevel.ERROR, '[Auto-Continue] Failed to send message', { 
					error: getErrorMessage(error)
				});
			}
		}, checkInterval);
	} else {
		log(LogLevel.DEBUG, 'Auto-Continue is disabled');
	}
}

/**
 * Restart auto-continue with new configuration
 */
function restartAutoContinue(context: vscode.ExtensionContext) {
	// Stop existing timer if running
	if (autoContinueTimer) {
		clearInterval(autoContinueTimer);
		autoContinueTimer = undefined;
		log(LogLevel.INFO, 'Auto-Continue timer stopped');
	}
	
	// Start auto-continue (will check if enabled internally)
	startAutoContinue(context);
}

/**
 * Start HTTP server to receive feedback from Electron app
 */
function startFeedbackServer(context: vscode.ExtensionContext) {
	server.startServer(context, currentPort, chatIntegration.sendToAgent);
}

/**
 * Initialize auto-approval if enabled in settings
 */
function initializeAutoApproval() {
	const config = getConfig();
	const autoApprovalEnabled = config.get<boolean>('autoApproval.enabled', true);
	const autoInjectEnabled = config.get<boolean>('autoApproval.autoInject', false);
	
	if (autoApprovalEnabled) {
		log(LogLevel.INFO, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
		
		// Auto-inject if enabled
		if (autoInjectEnabled) {
			// Only auto-inject if the setting was explicitly enabled at workspace scope.
			// This prevents user-level/global settings from causing auto-inject in brand-new windows.
			const inspect = config.inspect<boolean>('autoApproval.autoInject');
			const workspaceHasValue = !!(inspect && (inspect.workspaceValue || inspect.workspaceFolderValue));
			if (!workspaceHasValue) {
				log(LogLevel.INFO, 'Skipping auto-inject because autoApproval.autoInject is not set at workspace scope.');
				log(LogLevel.INFO, 'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');
				return;
			}

			log(LogLevel.INFO, 'Auto-inject enabled at workspace scope. Launching quick setup...');
			// Minimal delay to ensure extension is fully initialized (1s is sufficient)
			setTimeout(() => {
				autoInjectScript(extensionContext!).catch(err => {
					log(LogLevel.WARN, 'Auto-inject setup failed:', getErrorMessage(err));
				});
			}, 1000);
		}
	}
}

/**
 * Copy auto-approval script to clipboard
 * Simple, non-intrusive - just copy and optionally open dev tools
 */
/**
 * Enable automatic approval of chat buttons
 */
function enableAutoApproval(context: vscode.ExtensionContext) {
	if (autoApprovalInterval) {
		outputChannel.appendLine('Auto-approval is already enabled');
		return;
	}

	const config = getConfig();
	const intervalMs = config.get<number>('autoApproval.intervalMs', 2000);
	
	log(LogLevel.INFO, `Enabling auto-approval with ${intervalMs}ms interval`);
	
	// Note: This uses the executeCommand API to simulate key presses
	// The actual DOM manipulation needs to be done via developer console
	autoApprovalInterval = setInterval(async () => {
		try {
			// Try to accept any pending quick pick items (for "Allow" buttons)
			await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
		} catch (error) {
			// Silently ignore - this is expected when there's nothing to approve
		}
	}, intervalMs);

	// Store interval in context for cleanup
	context.subscriptions.push({
		dispose: () => {
			if (autoApprovalInterval) {
				clearInterval(autoApprovalInterval);
				autoApprovalInterval = undefined;
			}
		}
	});

	log(LogLevel.INFO, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
}

/**
 * Disable automatic approval
 */
function disableAutoApproval() {
	if (autoApprovalInterval) {
		clearInterval(autoApprovalInterval);
		autoApprovalInterval = undefined;
		outputChannel.appendLine('Auto-approval disabled');
		log(LogLevel.INFO, 'Auto-approval disabled');
	} else {
		log(LogLevel.INFO, 'Auto-approval is not currently enabled');
	}
}

/**
 * Show instructions for injecting the DOM manipulation script
 */
function injectAutoApprovalScript() {
	// Import the function from autoApproval module
	const { getAutoApprovalScript } = require('./modules/autoApproval');
	const script = getAutoApprovalScript(extensionContext!);

	const panel = vscode.window.createWebviewPanel(
		'autoApprovalScript',
		'Auto-Approval Script',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);

	panel.webview.html = getAutoApprovalInstructionsHtml(script);

	// Also copy to clipboard
	vscode.env.clipboard.writeText(script);
	log(LogLevel.INFO, 'Auto-approval script copied to clipboard');
}

/**
 * Generate HTML for the auto-approval instructions webview
 */
function getAutoApprovalInstructionsHtml(script: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto-Approval Script</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            color: var(--vscode-textLink-foreground);
        }
        .step {
            margin: 20px 0;
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 14px;
            margin: 5px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .warning {
            color: var(--vscode-editorWarning-foreground);
            padding: 10px;
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 3px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>🧩 VS Code Chat Auto-Approval System</h1>
    
    <div class="warning">
        ⚠️ <strong>Note:</strong> This script auto-clicks "Allow" and "Keep" buttons in the chat interface.
        Make sure you trust the operations being performed!
    </div>

    <div class="step">
        <h2>📋 Step 1: The script is already copied to your clipboard!</h2>
        <p>Just paste it in the next step.</p>
    </div>

    <div class="step">
        <h2>🔧 Step 2: Open VS Code Developer Tools</h2>
        <p>Go to: <strong>Help → Toggle Developer Tools</strong></p>
        <p>Or use keyboard shortcut: <strong>⌘⌥I</strong> (Mac) / <strong>Ctrl+Shift+I</strong> (Windows/Linux)</p>
    </div>

    <div class="step">
        <h2>💻 Step 3: Paste and run the script</h2>
        <p>1. Click on the <strong>Console</strong> tab in Developer Tools</p>
        <p>2. Paste the script (⌘V / Ctrl+V)</p>
        <p>3. Press <strong>Enter</strong> to execute</p>
    </div>

    <div class="step">
        <h2>✅ What happens next?</h2>
        <ul>
            <li>The script will check every 2 seconds for "Allow" or "Keep" buttons</li>
            <li>When found, it automatically clicks them</li>
            <li>You'll see confirmation messages in the console</li>
            <li>The script includes safety checks to skip dangerous operations (delete, remove, rm)</li>
        </ul>
    </div>

    <div class="step">
        <h2>🛑 To stop the script:</h2>
        <p>In the Developer Console, run:</p>
        <div class="code-block">clearInterval(window.__autoApproveInterval)</div>
    </div>

    <hr style="margin: 30px 0; border: 1px solid var(--vscode-panel-border);">

    <h2>📜 Full Script (already copied):</h2>
    <div class="code-block">${script.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

    <button class="button" onclick="copyScript()">Copy Script Again</button>

    <script>
        function copyScript() {
            const script = \`${script.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            navigator.clipboard.writeText(script).then(() => {
                alert('Script copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;
}

// This method is called when your extension is deactivated
export async function deactivate() {
	// Clean up HTTP server
	server.stopServer();
	log(LogLevel.INFO, 'HTTP server closed');
	
	// Clean up auto-continue timer
	if (autoContinueTimer) {
		clearInterval(autoContinueTimer);
		autoContinueTimer = undefined;
		log(LogLevel.INFO, 'Auto-continue timer cleared');
	}
	
	// Clean up auto-approval interval
	if (autoApprovalInterval) {
		clearInterval(autoApprovalInterval);
		autoApprovalInterval = undefined;
		log(LogLevel.INFO, 'Auto-approval interval cleared');
	}
	
	// Dispose chat integration
	chatIntegration.disposeChat();
	
	// Release port from registry
	if (extensionContext) {
		await portManager.releasePort(extensionContext, currentPort);
	}
	
	log(LogLevel.INFO, '👋 AI Agent Feedback Bridge deactivated');
}
