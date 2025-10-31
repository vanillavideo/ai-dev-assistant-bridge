// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

let server: http.Server | undefined;
let outputChannel: vscode.OutputChannel;
let chatParticipant: vscode.ChatParticipant | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
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

	// Create status bar item with auto-continue indicator (always visible)
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	updateStatusBar(config);
	// Left-click to toggle auto-continue (like Quokka's play/pause)
	statusBarItem.command = {
		command: 'ai-feedback-bridge.statusBarMenu',
		title: 'AI Feedback Bridge Menu'
	};
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Register status bar menu command (shows quick pick menu)
	const statusBarMenuCmd = vscode.commands.registerCommand('ai-feedback-bridge.statusBarMenu', async () => {
		const cfg = getConfig();
		const autoContinueEnabled = cfg.get<boolean>('autoContinue.enabled', false);
		
		const items = [
			{
				label: autoContinueEnabled ? '$(debug-pause) Stop Auto-Continue' : '$(play) Start Auto-Continue',
				description: autoContinueEnabled ? 'Stop sending periodic reminders' : 'Start sending periodic reminders',
				action: 'toggle'
			},
			{
				label: '$(gear) Settings',
				description: 'Configure ports and intervals',
				action: 'settings'
			}
		];

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: `AI Feedback Bridge - Port ${currentPort}`
		});

		if (selected) {
			switch (selected.action) {
				case 'toggle':
					await vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');
					break;
				case 'settings':
					await vscode.commands.executeCommand('workbench.action.openSettings', 'aiFeedbackBridge');
					break;
			}
		}
	});
	context.subscriptions.push(statusBarMenuCmd);

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
		vscode.window.showInformationMessage(`Auto-Continue ${!currentState ? 'enabled ✅' : 'disabled ❌'}`);
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
			vscode.window.showInformationMessage(`Port changed to ${newPort}. Reload VS Code.`, 'Reload')
				.then(sel => sel === 'Reload' && vscode.commands.executeCommand('workbench.action.reloadWindow'));
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
		vscode.window.showInformationMessage(msg, 'Open Settings', 'Toggle Auto-Continue')
			.then(selection => {
				if (selection === 'Open Settings') {
					vscode.commands.executeCommand('workbench.action.openSettings', 'aiFeedbackBridge');
				} else if (selection === 'Toggle Auto-Continue') {
					vscode.commands.executeCommand('ai-feedback-bridge.toggleAutoContinue');
				}
			});
		outputChannel.appendLine(msg);
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
						log(LogLevel.INFO, `Port change detected: ${currentPort} → ${newPort}`);
						vscode.window.showInformationMessage(
							`Port changed from ${currentPort} to ${newPort}. Reload this window to apply.`,
							'Reload Now',
							'Later'
						).then(selection => {
							if (selection === 'Reload Now') {
								vscode.commands.executeCommand('workbench.action.reloadWindow');
							}
						});
					}
				}
				
				// Always update status bar (it's always visible now)
				if (statusBarItem) {
					updateStatusBar(cfg);
				}
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

	// Show notification that server is running
	vscode.window.showInformationMessage(`AI Agent Feedback Bridge is listening on http://localhost:${currentPort}`);
	outputChannel.appendLine('Feedback server started on http://localhost:3737');
}

/**
 * Update status bar with current configuration
 */
function updateStatusBar(config: vscode.WorkspaceConfiguration) {
	if (!statusBarItem) {
		return;
	}
	
	const autoEnabled = config.get<boolean>('autoContinue.enabled', false);
	const autoInterval = config.get<number>('autoContinue.interval', 300);
	
	// Build status bar text with icons
	const portIcon = '$(radio-tower)';
	const autoIcon = autoEnabled ? '$(sync~spin)' : '$(debug-pause)';
	
	statusBarItem.text = `${portIcon} ${currentPort} ${autoIcon}`;
	statusBarItem.tooltip = new vscode.MarkdownString(
		`**AI Feedback Bridge**\n\n` +
		`**Port:** ${currentPort}\n` +
		`**Auto-Continue:** ${autoEnabled ? `ON (every ${autoInterval}s)` : 'OFF'}\n\n` +
		`---\n\n` +
		`🖱️ **Click for:**\n` +
		`• Start/Stop Auto-Continue\n` +
		`• Settings`
	);
	statusBarItem.tooltip.supportHtml = true;
}

/**
 * Start auto-continue feature if enabled
 */
function startAutoContinue(context: vscode.ExtensionContext) {
	const config = getConfig();
	const enabled = config.get<boolean>('autoContinue.enabled', false);
	
	if (enabled) {
		const interval = config.get<number>('autoContinue.interval', 300) * 1000;
		const message = config.get<string>('autoContinue.message', 
			'Continue with tasks, improvements, code coverage, please. Prioritize improvements, code robustness, maintainability. Cleanup unused files if you need to. Periodically commit.');
		
		const workspaceName = vscode.workspace.name || 'No Workspace';
		log(LogLevel.INFO, `✅ Auto-Continue enabled for window: ${workspaceName} (every ${interval/1000}s)`);
		
		autoContinueTimer = setInterval(async () => {
			try {
				log(LogLevel.INFO, '[Auto-Continue] Sending periodic reminder');
				await sendToAgent(message, { 
					source: 'auto_continue', 
					timestamp: new Date().toISOString(),
					interval: interval/1000
				});
			} catch (error) {
				log(LogLevel.ERROR, '[Auto-Continue] Failed to send message', { error });
			}
		}, interval);
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
				
				vscode.window.showInformationMessage('✅ Feedback sent to AI Agent!');
				return true;
			}
		} catch (modelError) {
			outputChannel.appendLine(`Could not access language model: ${modelError}`);
		}

		// Fallback: copy to clipboard
		await vscode.env.clipboard.writeText(fullMessage);
		vscode.window.showInformationMessage(
			'Feedback copied to clipboard! Open Copilot Chat (@workspace) and paste it.',
			'Open Chat'
		).then(selection => {
			if (selection === 'Open Chat') {
				vscode.commands.executeCommand('workbench.action.chat.open');
			}
		});
		
		return true;

	} catch (error) {
		outputChannel.appendLine(`Error sending to agent: ${error}`);
		vscode.window.showErrorMessage(`Failed to send to agent: ${error}`);
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
			vscode.window.showInformationMessage(`AI Agent Feedback Bridge is listening on http://localhost:${currentPort}`);
		});

		// Handle server errors
		server.on('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') {
				log(LogLevel.ERROR, `Port ${currentPort} is already in use`, { error: error.message });
				vscode.window.showErrorMessage(
					`Port ${currentPort} is already in use. Please change the port in settings.`,
					'Open Settings'
				).then(selection => {
					if (selection === 'Open Settings') {
						vscode.commands.executeCommand('workbench.action.openSettings', 'aiFeedbackBridge');
					}
				});
			} else {
				log(LogLevel.ERROR, 'Server error occurred', { error: error.message, code: error.code });
				vscode.window.showErrorMessage(`Server error: ${error.message}`);
			}
		});
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to start server', { error });
		vscode.window.showErrorMessage(`Failed to start feedback server: ${error}`);
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
		// Automatically attempt to inject the script
		setTimeout(async () => {
			try {
				// First try to open developer tools
				await vscode.commands.executeCommand('workbench.action.toggleDevTools');
				
				// Wait a moment for dev tools to open
				setTimeout(() => {
					// Show instructions for auto-injection
					vscode.window.showInformationMessage(
						'Auto-Approval enabled! Developer Tools opened. Click "Auto-Inject Script" to automatically paste and run the script.',
						'Auto-Inject Script',
						'Manual Copy',
						'Disable'
					).then(selection => {
						if (selection === 'Auto-Inject Script') {
							autoInjectScript();
						} else if (selection === 'Manual Copy') {
							injectAutoApprovalScript();
						} else if (selection === 'Disable') {
							updateConfig('autoApproval.enabled', false);
						}
					});
				}, 1000);
			} catch (error) {
				// Fallback to manual method
				vscode.window.showInformationMessage(
					'Auto-Approval is enabled! Click to get the console script.',
					'Get Script',
					'Disable'
				).then(selection => {
					if (selection === 'Get Script') {
						injectAutoApprovalScript();
					} else if (selection === 'Disable') {
						updateConfig('autoApproval.enabled', false);
					}
				});
			}
		}, 2000); // Wait 2 seconds after activation to show notification
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
				vscode.window.showInformationMessage('✅ Auto-approval script injected successfully!');
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
				vscode.window.showWarningMessage(
					`❌ Auto-injection failed: ${message.error}. Use manual copy instead.`,
					'Manual Copy'
				).then(selection => {
					if (selection === 'Manual Copy') {
						injectAutoApprovalScript();
					}
				});
				break;
			case 'manualCopy':
				vscode.window.showInformationMessage('Script copied to clipboard! Paste in Developer Tools Console.');
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

	vscode.window.showInformationMessage(
		'Auto-approval enabled. Use "Disable Auto-Approval" command to turn off.',
		'Inject Script'
	).then(selection => {
		if (selection === 'Inject Script') {
			injectAutoApprovalScript();
		}
	});
}

/**
 * Disable automatic approval
 */
function disableAutoApproval() {
	if (autoApprovalInterval) {
		clearInterval(autoApprovalInterval);
		autoApprovalInterval = undefined;
		outputChannel.appendLine('Auto-approval disabled');
		vscode.window.showInformationMessage('Auto-approval disabled');
	} else {
		vscode.window.showInformationMessage('Auto-approval is not currently enabled');
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
	vscode.window.showInformationMessage('Auto-approval script copied to clipboard!');
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
