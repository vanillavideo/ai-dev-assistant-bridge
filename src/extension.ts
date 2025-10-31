// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

let server: http.Server | undefined;
let outputChannel: vscode.OutputChannel;
let chatParticipant: vscode.ChatParticipant | undefined;
let statusBarToggle: vscode.StatusBarItem | undefined;
let statusBarSettings: vscode.StatusBarItem | undefined;
let statusBarInject: vscode.StatusBarItem | undefined;
let autoContinueTimer: NodeJS.Timeout | undefined;
let currentPort: number = 3737;
let autoApprovalInterval: NodeJS.Timeout | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Logging levels for structured output
 */
enum LogLevel {
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	DEBUG = 'DEBUG'
}

/**
 * Structured logging helper with timestamps
 */
function log(level: LogLevel, message: string, data?: any) {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [${level}]`;
	const fullMessage = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
	
	outputChannel.appendLine(fullMessage);
	
	// Also log errors to console for debugging
	if (level === LogLevel.ERROR) {
		console.error(fullMessage);
	}
}

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
async function updateConfig(key: string, value: any): Promise<void> {
	const config = getConfig();
	// Use Workspace target so settings are workspace-specific
	await config.update(key, value, vscode.ConfigurationTarget.Workspace);
	
	log(LogLevel.DEBUG, `Config updated: ${key} = ${value}`, {
		scope: 'Workspace',
		newValue: config.get(key)
	});
}

/**
 * Port registry management for automatic port selection
 * Tracks which ports are in use across all VS Code windows
 */
const PORT_REGISTRY_KEY = 'aiFeedbackBridge.portRegistry';
const BASE_PORT = 3737;
const MAX_PORT_SEARCH = 50; // Try up to 50 ports

interface PortRegistryEntry {
	port: number;
	workspace: string;
	timestamp: number;
}

async function getPortRegistry(context: vscode.ExtensionContext): Promise<PortRegistryEntry[]> {
	return context.globalState.get<PortRegistryEntry[]>(PORT_REGISTRY_KEY, []);
}

async function savePortRegistry(context: vscode.ExtensionContext, registry: PortRegistryEntry[]): Promise<void> {
	await context.globalState.update(PORT_REGISTRY_KEY, registry);
}

async function findAvailablePort(context: vscode.ExtensionContext): Promise<number> {
	const registry = await getPortRegistry(context);
	const workspaceName = vscode.workspace.name || 'No Workspace';
	const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
	
	// Clean up stale entries (older than 1 hour - window likely closed)
	const oneHourAgo = Date.now() - (60 * 60 * 1000);
	const activeRegistry = registry.filter(entry => entry.timestamp > oneHourAgo);
	
	// Check if this workspace already has a port assigned
	const existingEntry = activeRegistry.find(entry => entry.workspace === workspaceId);
	if (existingEntry) {
		log(LogLevel.INFO, `Reusing existing port ${existingEntry.port} for workspace`);
		// Update timestamp
		existingEntry.timestamp = Date.now();
		await savePortRegistry(context, activeRegistry);
		return existingEntry.port;
	}
	
	// Find next available port
	const usedPorts = new Set(activeRegistry.map(e => e.port));
	let port = BASE_PORT;
	
	for (let i = 0; i < MAX_PORT_SEARCH; i++) {
		const candidatePort = BASE_PORT + i;
		if (!usedPorts.has(candidatePort)) {
			// Check if port is actually available using a quick bind test
			const isAvailable = await isPortAvailable(candidatePort);
			if (isAvailable) {
				port = candidatePort;
				break;
			}
		}
	}
	
	// Register this port
	activeRegistry.push({
		port,
		workspace: workspaceId,
		timestamp: Date.now()
	});
	
	await savePortRegistry(context, activeRegistry);
	log(LogLevel.INFO, `Auto-assigned port ${port} for workspace: ${workspaceName}`);
	
	return port;
}

async function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const testServer = http.createServer();
		
		testServer.once('error', (err: any) => {
			if (err.code === 'EADDRINUSE') {
				resolve(false);
			} else {
				resolve(true); // Other errors, assume available
			}
		});
		
		testServer.once('listening', () => {
			testServer.close();
			resolve(true);
		});
		
		testServer.listen(port);
	});
}

async function releasePort(context: vscode.ExtensionContext, port: number): Promise<void> {
	const registry = await getPortRegistry(context);
	const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
	
	const filtered = registry.filter(entry => 
		!(entry.port === port && entry.workspace === workspaceId)
	);
	
	await savePortRegistry(context, filtered);
	log(LogLevel.INFO, `Released port ${port}`);
}

/**
 * Show custom settings panel with organized UI
 */
function showSettingsPanel(context: vscode.ExtensionContext) {
	const panel = vscode.window.createWebviewPanel(
		'aiFeedbackBridgeSettings',
		'AI Feedback Bridge Settings',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	const config = getConfig();
	
	panel.webview.html = getSettingsHtml(config, currentPort);
	
	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'updateSetting':
					await updateConfig(message.key, message.value);
					log(LogLevel.INFO, `Setting updated: ${message.key} = ${message.value}`);
					break;
				case 'reload':
					panel.webview.html = getSettingsHtml(getConfig(), currentPort);
					break;
				case 'runNow':
					// Manually trigger reminder check, bypassing interval limits
					try {
						const message = await getSmartAutoContinueMessage(context, true); // force = true
						if (message) {
							await sendToAgent(message, { 
							source: 'manual_trigger', 
							timestamp: new Date().toISOString()
						});
							log(LogLevel.INFO, '[Run Now] Manually triggered all enabled reminders');
						} else {
							vscode.window.showInformationMessage('No enabled categories (check settings)');
						}
					} catch (error) {
						log(LogLevel.ERROR, '[Run Now] Failed to send message', { error });
						vscode.window.showErrorMessage('Failed to send reminders');
					}
					break;
				case 'injectScript':
					// Call the auto-inject function
					autoInjectScript();
					break;
			}
		},
		undefined,
		context.subscriptions
	);
}

/**
 * Generate HTML for settings panel
 */
function getSettingsHtml(config: vscode.WorkspaceConfiguration, actualPort: number): string {
	const categories = [
		{ key: 'tasks', icon: '📋', name: 'Tasks', interval: 300 },
		{ key: 'improvements', icon: '✨', name: 'Improvements', interval: 600 },
		{ key: 'coverage', icon: '🧪', name: 'Coverage', interval: 900 },
		{ key: 'robustness', icon: '🛡️', name: 'Robustness', interval: 600 },
		{ key: 'cleanup', icon: '🧹', name: 'Cleanup', interval: 1200 },
		{ key: 'commits', icon: '💾', name: 'Commits', interval: 900 }
	];

	const autoContinueEnabled = config.get<boolean>('autoContinue.enabled', false);
	const autoApprovalEnabled = config.get<boolean>('autoApproval.enabled', false);
	const autoInjectEnabled = config.get<boolean>('autoApproval.autoInject', false);

	let categoriesRows = '';
	for (const cat of categories) {
		const enabled = config.get<boolean>(`autoContinue.${cat.key}.enabled`, true);
		const interval = config.get<number>(`autoContinue.${cat.key}.interval`, cat.interval);
		
		categoriesRows += `
			<tr class="${enabled ? '' : 'disabled'}">
				<td class="cat-icon">${cat.icon}</td>
				<td class="cat-name">${cat.name}</td>
				<td class="cat-interval">
					<input type="number" value="${interval}" data-key="autoContinue.${cat.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${enabled ? '' : 'disabled'} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${cat.key}.enabled" ${enabled ? 'checked' : ''} 
					       class="toggle-cb" id="cb-${cat.key}" data-auto-approved="skip">
					<label for="cb-${cat.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Settings</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: var(--vscode-font-family);
			font-size: 14px;
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			padding: 16px;
			max-width: 800px;
		}
		
		.header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 16px;
			padding-bottom: 10px;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		.header h1 { font-size: 18px; flex: 1; font-weight: 600; }
		
		.section {
			background: var(--vscode-sideBar-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 10px 12px;
			margin-bottom: 10px;
		}
		.section-title {
			font-weight: 600;
			margin-bottom: 8px;
			font-size: 14px;
		}
		
		.row {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 4px 0;
		}
		.row label { flex: 1; font-size: 14px; }
		
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th {
			text-align: left;
			padding: 6px 4px;
			font-weight: 600;
			font-size: 12px;
			opacity: 0.7;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		td {
			padding: 6px 4px;
			border-bottom: 1px solid rgba(128,128,128,0.1);
		}
		tr.disabled { opacity: 0.5; }
		.cat-icon { width: 28px; font-size: 16px; }
		.cat-name { font-weight: 500; font-size: 14px; }
		.cat-interval { width: 100px; font-size: 14px; }
		.cat-toggle { width: 45px; text-align: right; }
		
		input[type="number"] {
			padding: 3px 5px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-size: 14px;
		}
		
		/* Better toggle switch */
		.toggle-cb { display: none; }
		.toggle-label {
			display: inline-block;
			width: 32px;
			height: 16px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 8px;
			position: relative;
			cursor: pointer;
			transition: all 0.2s;
		}
		.toggle-label:after {
			content: '';
			position: absolute;
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background: var(--vscode-input-foreground);
			top: 2.5px;
			left: 2.5px;
			transition: all 0.2s;
		}
		.toggle-cb:checked + .toggle-label {
			background: var(--vscode-button-background);
			border-color: var(--vscode-button-background);
		}
		.toggle-cb:checked + .toggle-label:after {
			left: 18.5px;
			background: white;
		}
		
		button {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 6px 12px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 13px;
			font-family: var(--vscode-font-family);
		}
		button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		
		.port-display {
			font-family: 'Monaco', 'Courier New', monospace;
			font-weight: 600;
			color: var(--vscode-textLink-foreground);
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>🌉 AI Feedback Bridge</h1>
		<button onclick="runNow()">▶️ Run Now</button>
		<button onclick="injectScript()">📋 Inject Script</button>
	</div>
	
	<div class="section">
		<div class="section-title">Server</div>
		<div class="row">
			<label>Port (auto-assigned)</label>
			<span class="port-display">${actualPort}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${autoApprovalEnabled ? 'checked' : ''} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${autoInjectEnabled ? 'checked' : ''} 
				       class="toggle-cb" id="cb-autoinject" ${autoApprovalEnabled ? '' : 'disabled'} data-auto-approved="skip">
				<label for="cb-autoinject" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${autoContinueEnabled ? 'checked' : ''} 
				       class="toggle-cb" id="cb-autocontinue" data-auto-approved="skip">
				<label for="cb-autocontinue" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Category</th>
					<th>Interval</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				${categoriesRows}
			</tbody>
		</table>
	</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		
		// Handle all input changes
		document.querySelectorAll('input').forEach(el => {
			el.addEventListener('change', (e) => {
				const key = e.target.dataset.key;
				if (!key) return;
				
				let value = e.target.type === 'checkbox' ? e.target.checked : 
				           e.target.type === 'number' ? parseInt(e.target.value) : 
				           e.target.value;
				
				vscode.postMessage({
					command: 'updateSetting',
					key: key,
					value: value
				});
				
				// Update row state for auto-continue categories
				if (key.includes('.enabled')) {
					const row = e.target.closest('tr');
					if (row) {
						row.classList.toggle('disabled', !value);
						const input = row.querySelector('input[type="number"]');
						if (input) input.disabled = !value;
					}
				}
				
				// Handle auto-approval enabled toggle - enable/disable auto-inject
				if (key === 'autoApproval.enabled') {
					const autoInjectCheckbox = document.getElementById('cb-autoinject');
					if (autoInjectCheckbox) {
						autoInjectCheckbox.disabled = !value;
					}
				}
			});
		});
		
		function runNow() {
			vscode.postMessage({ command: 'runNow' });
		}
		
		function injectScript() {
			vscode.postMessage({ command: 'injectScript' });
		}
	</script>
</body>
</html>`;
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Store context globally for deactivation
	extensionContext = context;

	// Create output channel for logs
	outputChannel = vscode.window.createOutputChannel('AI Agent Feedback');
	context.subscriptions.push(outputChannel);
	
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
	currentPort = await findAvailablePort(context);
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
		showSettingsPanel(context);
	});
	context.subscriptions.push(openSettingsCmd);
	
	// Register run now command - manually trigger reminder check
	const runNowCmd = vscode.commands.registerCommand('ai-feedback-bridge.runNow', async () => {
		try {
			const message = await getSmartAutoContinueMessage(context, true); // force=true to ignore intervals
			if (message) {
				log(LogLevel.INFO, '[Run Now] Manually triggered all enabled reminders');
				await sendToAgent(message, { 
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
		autoInjectScript();
	});
	context.subscriptions.push(injectScriptCmd);
	
	// Register get port command - returns the current port for this window
	const getPortCmd = vscode.commands.registerCommand('ai-feedback-bridge.getPort', () => {
		return currentPort;
	});
	context.subscriptions.push(getPortCmd);

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
			await sendToCopilotChat(feedbackText, {});
		}
	});

	context.subscriptions.push(disposable);

	// Register toggle auto-continue command
	const toggleAutoContinueCmd = vscode.commands.registerCommand('ai-feedback-bridge.toggleAutoContinue', async () => {
		const cfg = getConfig();
		const currentState = cfg.get<boolean>('autoContinue.enabled', false);
		await updateConfig('autoContinue.enabled', !currentState);
		log(LogLevel.INFO, `Auto-Continue ${!currentState ? 'enabled' : 'disabled'}`);
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
	chatParticipant = vscode.chat.createChatParticipant('ai-agent-feedback-bridge.agent', handleChatRequest);
	chatParticipant.iconPath = vscode.Uri.file(context.asAbsolutePath('icon.png'));
	context.subscriptions.push(chatParticipant);

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
					await sendToAgent(message, { 
						source: 'auto_continue', 
						timestamp: new Date().toISOString()
					});
				}
			} catch (error) {
				log(LogLevel.ERROR, '[Auto-Continue] Failed to send message', { error });
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
 * Handle chat requests from the agent participant
 */
async function handleChatRequest(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
	
	outputChannel.appendLine(`Chat request received: ${request.prompt}`);
	
	stream.markdown(`### 🔄 Processing Feedback\n\n`);
	stream.markdown(`**Message:** ${request.prompt}\n\n`);
	
	// Parse the prompt to extract structured feedback
	const feedbackMatch = request.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/);
	
	if (feedbackMatch) {
		stream.markdown(`I've received feedback from your external AI agent system. Let me analyze it:\n\n`);
	} else {
		stream.markdown(`Processing your message...\n\n`);
	}
	
	// Use the language model to process the request
	try {
		const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
		
		if (model) {
			const messages = [
				vscode.LanguageModelChatMessage.User(request.prompt)
			];
			
			const response = await model.sendRequest(messages, {}, token);
			
			for await (const fragment of response.text) {
				stream.markdown(fragment);
			}
		}
	} catch (err) {
		if (err instanceof vscode.LanguageModelError) {
			outputChannel.appendLine(`Language model error: ${err.message}`);
			stream.markdown(`⚠️ Error: ${err.message}\n\n`);
		}
	}
	
	return { metadata: { command: 'process-feedback' } };
}

/**
 * Send feedback directly to the AI agent for automatic processing
 */
async function sendToAgent(feedbackMessage: string, appContext: any): Promise<boolean> {
	try {
		// Format the message with context
		let fullMessage = `# 🔄 FEEDBACK FROM EXTERNAL AI SYSTEM\n\n`;
		fullMessage += `**User Feedback:**\n${feedbackMessage}\n\n`;

		if (appContext && Object.keys(appContext).length > 0) {
			fullMessage += `**Context:**\n`;
			fullMessage += `\`\`\`json\n${JSON.stringify(appContext, null, 2)}\n\`\`\`\n\n`;
		}

		fullMessage += `**Instructions:**\n`;
		fullMessage += `Analyze this feedback and provide actionable responses. `;
		fullMessage += `If it's a bug, analyze the root cause. `;
		fullMessage += `If it's a feature request, provide an implementation plan. `;
		fullMessage += `Make code changes if needed using available tools.\n\n`;

		outputChannel.appendLine('Processing feedback through AI agent...');
		outputChannel.appendLine(fullMessage);

		// Process directly using the language model without opening chat UI
		try {
			const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
			
			if (model) {
				outputChannel.appendLine('✅ AI Agent processing request...');
				
				// Send directly to chat with the @agent prefix to use the participant
				await vscode.commands.executeCommand('workbench.action.chat.open', {
					query: `@agent ${fullMessage}`
				});
				
				// Auto-submit by sending the submit command
				// Wait a tiny bit for the text to populate
				setTimeout(async () => {
					try {
						await vscode.commands.executeCommand('workbench.action.chat.submit');
					} catch (e) {
						outputChannel.appendLine('Note: Could not auto-submit. User can press Enter to submit.');
					}
				}, 500);
				
				// Silent success - logged only
				log(LogLevel.INFO, 'Feedback sent to AI Agent');
				return true;
			}
		} catch (modelError) {
			outputChannel.appendLine(`Could not access language model: ${modelError}`);
		}

		// Fallback: copy to clipboard
		await vscode.env.clipboard.writeText(fullMessage);
		log(LogLevel.INFO, 'Feedback copied to clipboard');
		
		return true;

	} catch (error) {
		log(LogLevel.ERROR, `Error sending to agent: ${error}`);
		return false;
	}
}

/**
 * Send feedback to GitHub Copilot Chat (legacy method - kept for manual command)
 */
async function sendToCopilotChat(feedbackMessage: string, appContext: any): Promise<boolean> {
	return sendToAgent(feedbackMessage, appContext);
}

/**
 * Start HTTP server to receive feedback from Electron app
 */
function startFeedbackServer(context: vscode.ExtensionContext) {
	server = http.createServer(async (req, res) => {
		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		// Handle OPTIONS preflight
		if (req.method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		// Only accept POST requests
		if (req.method !== 'POST') {
			res.writeHead(405, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Method not allowed' }));
			return;
		}

		// Handle /restart-app endpoint
		if (req.url === '/restart-app' || req.url?.startsWith('/restart-app?')) {
			// Parse query parameters for delay
			const urlParts = req.url.split('?');
			const queryParams = new URLSearchParams(urlParts[1] || '');
			const delaySeconds = parseInt(queryParams.get('delay') || '30', 10);
			
			outputChannel.appendLine(`Received restart request for Electron app (delay: ${delaySeconds}s)`);
			
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ 
				success: true, 
				message: `App restart initiated (will restart in ${delaySeconds}s)`,
				delay: delaySeconds
			}));
			
			// Restart asynchronously (don't block response)
			setTimeout(async () => {
				try {
					// Kill existing Electron process
					const { exec } = require('child_process');
					const { promisify } = require('util');
					const execAsync = promisify(exec);
					
					outputChannel.appendLine('Killing Electron process...');
					try {
						await execAsync('pkill -f "electron.*Code/AI"');
					} catch (e) {
						// Process might not be running, that's okay
						outputChannel.appendLine('Kill command completed (process may not have been running)');
					}
					
					// Wait configured delay before restart
					outputChannel.appendLine(`Waiting ${delaySeconds} seconds before restart...`);
					await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
					
					const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
					if (workspacePath && workspacePath.includes('/AI')) {
						outputChannel.appendLine(`Restarting Electron app in: ${workspacePath}`);
						exec(`cd "${workspacePath}" && npm run dev > /dev/null 2>&1 &`);
						outputChannel.appendLine('Electron app restart command sent');
					} else {
						outputChannel.appendLine(`Could not find workspace path: ${workspacePath}`);
					}
				} catch (error) {
					outputChannel.appendLine(`Restart error: ${error}`);
				}
			}, 100);
			
			return;
		}

		// Handle /feedback endpoint (default)
		// Read request body with size limit
		let body = '';
		const maxBodySize = 1024 * 1024; // 1MB limit
		let bodySize = 0;
		
		req.on('data', chunk => {
			bodySize += chunk.length;
			if (bodySize > maxBodySize) {
				log(LogLevel.WARN, 'Request body too large', { size: bodySize });
				res.writeHead(413, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Request body too large (max 1MB)' }));
				req.destroy();
				return;
			}
			body += chunk.toString();
		});

		req.on('end', async () => {
			try {
				// Validate JSON structure
				const feedback = JSON.parse(body);
				
				if (!feedback || typeof feedback !== 'object') {
					throw new Error('Invalid feedback structure: must be an object');
				}
				
				if (!feedback.message || typeof feedback.message !== 'string') {
					throw new Error('Invalid feedback: missing or invalid "message" field');
				}
				
				// Sanitize message (basic XSS prevention)
				const sanitizedMessage = feedback.message.trim();
				if (sanitizedMessage.length === 0) {
					throw new Error('Invalid feedback: message cannot be empty');
				}
				
				if (sanitizedMessage.length > 50000) {
					throw new Error('Invalid feedback: message too long (max 50000 characters)');
				}
				
				log(LogLevel.INFO, 'Received feedback', { 
					messageLength: sanitizedMessage.length,
					hasContext: !!feedback.context 
				});

				// Send directly to the chat participant for automatic processing
				const success = await sendToAgent(sanitizedMessage, feedback.context);

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ 
					success, 
					message: success ? 'Feedback sent to AI Agent' : 'Failed to send to AI Agent' 
				}));

			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				log(LogLevel.ERROR, 'Error processing feedback', { error: errorMessage });
				
				if (error instanceof SyntaxError) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid JSON format' }));
				} else {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: errorMessage }));
				}
			}
		});
	});

	// Start server with error handling
	try {
		server.listen(currentPort, () => {
			log(LogLevel.INFO, `✅ Server listening on port ${currentPort}`);
		});

		// Handle server errors
		server.on('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') {
				log(LogLevel.ERROR, `Port ${currentPort} is already in use. Please change the port in settings.`);
			} else {
				log(LogLevel.ERROR, 'Server error occurred', { error: error.message, code: error.code });
			}
		});
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to start server', { error });
	}

	// Clean up server on deactivation
	context.subscriptions.push({
		dispose: () => {
			if (server) {
				log(LogLevel.INFO, 'Closing server');
				server.close();
			}
		}
	});
}

/**
 * Initialize auto-approval if enabled in settings
 */
function initializeAutoApproval() {
	const config = getConfig();
	const autoApprovalEnabled = config.get<boolean>('autoApproval.enabled', false);
	const autoInjectEnabled = config.get<boolean>('autoApproval.autoInject', false);
	
	if (autoApprovalEnabled) {
		log(LogLevel.INFO, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
		
		// Auto-inject if enabled
		if (autoInjectEnabled) {
			log(LogLevel.INFO, 'Auto-inject enabled. Launching quick setup...');
			// Delay slightly to ensure extension is fully initialized
			setTimeout(() => {
				autoInjectScript().catch(err => {
					log(LogLevel.WARN, 'Auto-inject setup failed:', err);
				});
			}, 1500); // Slightly longer delay for better UX
		}
	}
}

/**
 * Copy auto-approval script to clipboard
 * Simple, non-intrusive - just copy and optionally open dev tools
 */
async function autoInjectScript() {
	try {
		const script = getAutoApprovalScript();
		
		// Copy script to clipboard
		await vscode.env.clipboard.writeText(script);
		log(LogLevel.INFO, '📋 Auto-approval script copied to clipboard');
		
		// Optionally open developer tools
		try {
			await vscode.commands.executeCommand('workbench.action.toggleDevTools');
			log(LogLevel.INFO, '🛠️ Developer Tools toggled');
		} catch (error) {
			log(LogLevel.WARN, 'Could not toggle Developer Tools', error);
		}
		
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to copy script', error);
	}
}

/**
 * Get the auto-approval script as a string
 */
function getAutoApprovalScript(): string {
	try {
		// Read the actual auto-approval-script.js file from the extension directory
		const scriptPath = path.join(extensionContext!.extensionPath, 'auto-approval-script.js');
		const scriptContent = fs.readFileSync(scriptPath, 'utf8');
		return scriptContent;
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to read auto-approval-script.js', error);
		return '// Error: Could not load auto-approval script';
	}
}

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
	const script = getAutoApprovalScript();

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
	if (server) {
		server.close();
		log(LogLevel.INFO, 'HTTP server closed');
	}
	
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
	
	// Release port from registry
	if (extensionContext) {
		await releasePort(extensionContext, currentPort);
	}
	
	log(LogLevel.INFO, '👋 AI Agent Feedback Bridge deactivated');
}
