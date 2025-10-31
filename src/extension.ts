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
	// Use null as the resource URI to get window-level settings
	// This ensures settings are window-specific, not workspace-specific
	return vscode.workspace.getConfiguration('aiFeedbackBridge', null);
}

/**
 * Update configuration with proper scope for window isolation
 */
async function updateConfig(key: string, value: any): Promise<void> {
	const config = getConfig();
	// Use Global target for window-level settings that persist across workspaces
	// This allows different windows to have different settings
	await config.update(key, value, vscode.ConfigurationTarget.Global);
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
	
	panel.webview.html = getSettingsHtml(config);
	
	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'updateSetting':
					await updateConfig(message.key, message.value);
					log(LogLevel.INFO, `Setting updated: ${message.key} = ${message.value}`);
					break;
				case 'reload':
					panel.webview.html = getSettingsHtml(getConfig());
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
function getSettingsHtml(config: vscode.WorkspaceConfiguration): string {
	const categories = [
		{ key: 'tasks', icon: '📋', name: 'Tasks', desc: 'Continue with current tasks' },
		{ key: 'improvements', icon: '✨', name: 'Improvements', desc: 'Code quality and optimizations' },
		{ key: 'coverage', icon: '🧪', name: 'Coverage', desc: 'Testing and validation' },
		{ key: 'robustness', icon: '🛡️', name: 'Robustness', desc: 'Error handling and stability' },
		{ key: 'cleanup', icon: '🧹', name: 'Cleanup', desc: 'Remove unused code' },
		{ key: 'commits', icon: '💾', name: 'Commits', desc: 'Save progress regularly' }
	];

	const autoContinueEnabled = config.get<boolean>('autoContinue.enabled', false);
	const autoApprovalEnabled = config.get<boolean>('autoApproval.enabled', false);
	const port = config.get<number>('port', 3737);
	const autoStart = config.get<boolean>('autoStart', true);

	let categoriesHtml = '';
	for (const cat of categories) {
		const enabled = config.get<boolean>(`autoContinue.${cat.key}.enabled`, true);
		const interval = config.get<number>(`autoContinue.${cat.key}.interval`, 300);
		const message = config.get<string>(`autoContinue.${cat.key}.message`, '');
		
		categoriesHtml += `
			<div class="category ${enabled ? 'enabled' : 'disabled'}">
				<div class="category-header">
					<span class="icon">${cat.icon}</span>
					<span class="name">${cat.name}</span>
					<label class="toggle">
						<input type="checkbox" data-key="autoContinue.${cat.key}.enabled" ${enabled ? 'checked' : ''}>
						<span class="slider"></span>
					</label>
				</div>
				<div class="category-body ${enabled ? '' : 'hidden'}">
					<div class="field">
						<label>Interval (seconds)</label>
						<input type="number" value="${interval}" data-key="autoContinue.${cat.key}.interval" min="60" step="60">
					</div>
					<div class="field">
						<label>Message</label>
						<textarea data-key="autoContinue.${cat.key}.message" rows="2">${message}</textarea>
					</div>
				</div>
			</div>
		`;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AI Feedback Bridge Settings</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			padding: 20px;
		}
		h1 { margin-bottom: 20px; font-size: 24px; }
		h2 { margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
		
		.section { margin-bottom: 30px; }
		.field { margin-bottom: 15px; }
		.field label { display: block; margin-bottom: 5px; font-weight: 500; }
		.field input[type="number"], .field input[type="text"] {
			width: 200px;
			padding: 6px 10px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
		}
		.field textarea {
			width: 100%;
			max-width: 600px;
			padding: 8px 10px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-family: var(--vscode-font-family);
			resize: vertical;
		}
		
		.toggle { position: relative; display: inline-block; width: 42px; height: 24px; }
		.toggle input { opacity: 0; width: 0; height: 0; }
		.slider {
			position: absolute; cursor: pointer; inset: 0;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 24px;
			transition: .3s;
		}
		.slider:before {
			position: absolute; content: ""; height: 16px; width: 16px;
			left: 3px; bottom: 3px;
			background-color: var(--vscode-input-foreground);
			border-radius: 50%;
			transition: .3s;
		}
		input:checked + .slider { background-color: var(--vscode-button-background); border-color: var(--vscode-button-background); }
		input:checked + .slider:before { transform: translateX(18px); background-color: white; }
		
		.category {
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			margin-bottom: 12px;
			background: var(--vscode-sideBar-background);
		}
		.category.disabled { opacity: 0.6; }
		.category-header {
			padding: 12px 15px;
			display: flex;
			align-items: center;
			gap: 12px;
			cursor: pointer;
		}
		.category-header .icon { font-size: 20px; }
		.category-header .name { flex: 1; font-weight: 500; font-size: 15px; }
		.category-body {
			padding: 0 15px 15px;
			border-top: 1px solid var(--vscode-panel-border);
		}
		.category-body.hidden { display: none; }
		.category-body .field { margin-top: 12px; }
		
		.main-toggle {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 15px;
			background: var(--vscode-editor-background);
			border: 2px solid var(--vscode-panel-border);
			border-radius: 6px;
			margin-bottom: 20px;
		}
		.main-toggle .label { flex: 1; font-size: 16px; font-weight: 600; }
	</style>
</head>
<body>
	<h1>🌉 AI Feedback Bridge Settings</h1>
	
	<div class="section">
		<h2>Server</h2>
		<div class="field">
			<label>Port (auto-assigned per window)</label>
			<input type="number" value="${port}" data-key="port" min="1024" max="65535" readonly>
			<p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">Port is automatically selected for each window</p>
		</div>
		<div class="field">
			<label class="toggle">
				<input type="checkbox" data-key="autoStart" ${autoStart ? 'checked' : ''}>
				<span class="slider"></span>
			</label>
			<label style="display: inline; margin-left: 10px;">Auto-start server on launch</label>
		</div>
	</div>
	
	<div class="section">
		<h2>Auto-Approval</h2>
		<div class="field">
			<label class="toggle">
				<input type="checkbox" data-key="autoApproval.enabled" ${autoApprovalEnabled ? 'checked' : ''}>
				<span class="slider"></span>
			</label>
			<label style="display: inline; margin-left: 10px;">Enable auto-approval (requires manual console script)</label>
		</div>
	</div>
	
	<div class="section">
		<h2>Auto-Continue</h2>
		<div class="main-toggle">
			<span class="label">Enable Auto-Continue</span>
			<label class="toggle">
				<input type="checkbox" data-key="autoContinue.enabled" ${autoContinueEnabled ? 'checked' : ''}>
				<span class="slider"></span>
			</label>
		</div>
		
		<p style="margin-bottom: 15px; opacity: 0.8;">Configure which reminders to send and how often:</p>
		${categoriesHtml}
	</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		
		// Handle all input changes
		document.querySelectorAll('input, textarea').forEach(el => {
			el.addEventListener('change', (e) => {
				const key = e.target.dataset.key;
				let value = e.target.type === 'checkbox' ? e.target.checked : 
				           e.target.type === 'number' ? parseInt(e.target.value) : 
				           e.target.value;
				
				vscode.postMessage({
					command: 'updateSetting',
					key: key,
					value: value
				});
				
				// Toggle category body visibility
				if (key.includes('.enabled')) {
					const category = e.target.closest('.category');
					if (category) {
						const body = category.querySelector('.category-body');
						if (body) {
							body.classList.toggle('hidden', !value);
						}
						category.classList.toggle('enabled', value);
						category.classList.toggle('disabled', !value);
					}
				}
			});
		});
		
		// Make category headers clickable
		document.querySelectorAll('.category-header').forEach(header => {
			header.addEventListener('click', (e) => {
				if (e.target.type !== 'checkbox' && !e.target.classList.contains('slider')) {
					const toggle = header.querySelector('input[type="checkbox"]');
					toggle.click();
				}
			});
		});
	</script>
</body>
</html>`;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('AI Agent Feedback Bridge is now active!');
	
	// Store context globally for deactivation
	extensionContext = context;

	// Create output channel for logs
	outputChannel = vscode.window.createOutputChannel('AI Agent Feedback');
	context.subscriptions.push(outputChannel);
	
	log(LogLevel.INFO, '🚀 AI Agent Feedback Bridge activated');

	// Auto-select available port (or use configured port if valid)
	const config = getConfig();
	const configuredPort = config.get<number>('port');
	
	// If no port configured, or port is the default, use auto-selection
	if (!configuredPort || configuredPort === 3737) {
		currentPort = await findAvailablePort(context);
		// Save the auto-selected port
		await updateConfig('port', currentPort);
		log(LogLevel.INFO, `Auto-selected port: ${currentPort}`);
	} else {
		currentPort = configuredPort;
		log(LogLevel.INFO, `Using configured port: ${currentPort}`);
	}
	
	// Log window identification to help debug multi-window scenarios
	const workspaceName = vscode.workspace.name || 'No Workspace';
	const workspaceFolders = vscode.workspace.workspaceFolders?.length || 0;
	log(LogLevel.INFO, `Window context: ${workspaceName} (${workspaceFolders} folders)`);

	// Create 2 separate status bar buttons (adjacent with same priority base)
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
	
	// Update both buttons with current state
	updateStatusBar(config);

	// Register open settings command with custom webview
	const openSettingsCmd = vscode.commands.registerCommand('ai-feedback-bridge.openSettings', async () => {
		showSettingsPanel(context);
	});
	context.subscriptions.push(openSettingsCmd);

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

	// Start auto-continue if enabled
	startAutoContinue(context);

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
	statusBarSettings.text = `AI Bridge: ${currentPort}`;
	statusBarSettings.tooltip = 'Click to configure AI Feedback Bridge';
	
	// Toggle button shows Start/Stop with spinning icon when active
	if (autoEnabled) {
		statusBarToggle.text = '$(sync~spin) Stop';
		statusBarToggle.tooltip = 'Auto-Continue active\nClick to stop';
	} else {
		statusBarToggle.text = '$(play) Start';
		statusBarToggle.tooltip = 'Auto-Continue inactive\nClick to start';
	}
}

/**
 * Get smart auto-continue message by rotating through enabled categories
 * based on elapsed time since last sent
 */
async function getSmartAutoContinueMessage(context: vscode.ExtensionContext): Promise<string> {
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
		
		// Include message if enough time has elapsed
		if (elapsed >= interval) {
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
	if (autoContinueTimer) {
		clearInterval(autoContinueTimer);
		autoContinueTimer = undefined;
		outputChannel.appendLine('Auto-Continue stopped');
	}
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
	
	if (autoApprovalEnabled) {
		log(LogLevel.INFO, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
	}
}

/**
 * Attempt to automatically inject the script into the console
 */
async function autoInjectScript() {
	const script = getAutoApprovalScript();
	
	// Copy script to clipboard
	await vscode.env.clipboard.writeText(script);
	
	// Create a webview panel that can inject the script
	const panel = vscode.window.createWebviewPanel(
		'autoInject',
		'Auto-Approval Auto-Injection',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	panel.webview.html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Auto-Approval Auto-Injection</title>
			<style>
				body { 
					font-family: var(--vscode-font-family); 
					padding: 20px; 
					background: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
				}
				.status { padding: 10px; border-radius: 4px; margin: 10px 0; }
				.success { background: var(--vscode-inputValidation-infoBorder); }
				.warning { background: var(--vscode-inputValidation-warningBorder); }
				.error { background: var(--vscode-inputValidation-errorBorder); }
				button { 
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 8px 16px;
					border-radius: 4px;
					cursor: pointer;
					margin: 5px;
				}
				button:hover { background: var(--vscode-button-hoverBackground); }
				pre { 
					background: var(--vscode-textCodeBlock-background);
					padding: 10px;
					border-radius: 4px;
					overflow-x: auto;
					font-size: 12px;
				}
			</style>
		</head>
		<body>
			<h2>🚀 Auto-Approval Auto-Injection</h2>
			
			<div class="status warning">
				<strong>⚡ Attempting Automatic Injection...</strong><br>
				The script is being automatically injected into the developer console.
			</div>
			
			<div id="status">
				<p>Status: <span id="statusText">Initializing...</span></p>
			</div>
			
			<div>
				<button onclick="retryInjection()">🔄 Retry Injection</button>
				<button onclick="manualCopy()">📋 Manual Copy</button>
				<button onclick="closePanel()">❌ Close</button>
			</div>
			
			<details>
				<summary>📝 Script Contents (Click to expand)</summary>
				<pre id="scriptContent"></pre>
			</details>

			<script>
				const vscode = acquireVsCodeApi();
				
				// Store the script
				const script = ${JSON.stringify(script)};
				document.getElementById('scriptContent').textContent = script;
				
				// Attempt automatic injection
				function attemptAutoInjection() {
					try {
						document.getElementById('statusText').textContent = 'Attempting injection...';
						
						// Try to inject into parent console
						if (window.parent && window.parent.console) {
							window.parent.eval(script);
							document.getElementById('statusText').textContent = '✅ Injected successfully!';
							document.getElementById('status').className = 'status success';
							vscode.postMessage({ command: 'injectionSuccess' });
							return true;
						}
						
						// Alternative: try to access the main window
						if (window.top && window.top !== window) {
							window.top.eval(script);
							document.getElementById('statusText').textContent = '✅ Injected successfully!';
							document.getElementById('status').className = 'status success';
							vscode.postMessage({ command: 'injectionSuccess' });
							return true;
						}
						
						throw new Error('Cannot access parent console');
					} catch (error) {
						document.getElementById('statusText').textContent = '❌ Auto-injection failed: ' + error.message;
						document.getElementById('status').className = 'status error';
						vscode.postMessage({ command: 'injectionFailed', error: error.message });
						return false;
					}
				}
				
				function retryInjection() {
					attemptAutoInjection();
				}
				
				function manualCopy() {
					navigator.clipboard.writeText(script).then(() => {
						vscode.postMessage({ command: 'manualCopy' });
					});
				}
				
				function closePanel() {
					vscode.postMessage({ command: 'close' });
				}
				
				// Try injection on load
				setTimeout(attemptAutoInjection, 500);
			</script>
		</body>
		</html>
	`;

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case 'injectionSuccess':
				log(LogLevel.INFO, 'Auto-approval script injected successfully');
				panel.dispose();
				// Auto-close developer tools after successful injection
				setTimeout(async () => {
					try {
						await vscode.commands.executeCommand('workbench.action.toggleDevTools');
						log(LogLevel.INFO, 'Developer Tools auto-closed after successful injection');
					} catch (error) {
						log(LogLevel.WARN, 'Could not auto-close Developer Tools', error);
					}
				}, 1000);
				break;
			case 'injectionFailed':
				log(LogLevel.WARN, `Auto-injection failed: ${message.error}. Use manual copy instead.`);
				break;
			case 'manualCopy':
				log(LogLevel.INFO, 'Script copied to clipboard');
				break;
			case 'close':
				panel.dispose();
				break;
		}
	});
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
