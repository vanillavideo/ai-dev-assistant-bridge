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

let outputChannel: vscode.OutputChannel;
let chatParticipant: vscode.ChatParticipant | undefined;
let statusBarToggle: vscode.StatusBarItem | undefined;
let statusBarSettings: vscode.StatusBarItem | undefined;
let statusBarInject: vscode.StatusBarItem | undefined;
let autoContinueTimer: NodeJS.Timeout | undefined;
let currentPort: number = 3737;
let autoApprovalInterval: NodeJS.Timeout | undefined;
let extensionContext: vscode.ExtensionContext | undefined;
let settingsPanel: vscode.WebviewPanel | undefined;

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

/**
 * Refresh settings panel if it's open
 */
async function refreshSettingsPanel() {
	if (settingsPanel && extensionContext) {
		const tasks = await taskManager.getTasks(extensionContext);
		settingsPanel.webview.html = await getSettingsHtml(getConfig(), currentPort, tasks);
		log(LogLevel.DEBUG, 'Settings panel refreshed');
	}
}

/**
 * Show custom settings panel with organized UI
 */
async function showSettingsPanel(context: vscode.ExtensionContext) {
	// If panel already exists, just reveal it
	if (settingsPanel) {
		settingsPanel.reveal(vscode.ViewColumn.One);
		// Refresh with current config and tasks
		const tasks = await taskManager.getTasks(context);
		settingsPanel.webview.html = await getSettingsHtml(getConfig(), currentPort, tasks);
		return;
	}
	
	const panel = vscode.window.createWebviewPanel(
		'aiFeedbackBridgeSettings',
		'AI Feedback Bridge Settings',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);
	
	// Store reference globally
	settingsPanel = panel;
	
	// Clear reference when panel is disposed
	panel.onDidDispose(() => {
		settingsPanel = undefined;
	}, null, context.subscriptions);

	const config = getConfig();
	const tasks = await taskManager.getTasks(context);
	
	panel.webview.html = await getSettingsHtml(config, currentPort, tasks);
	
	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'updateSetting':
					await updateConfig(message.key, message.value);
					log(LogLevel.INFO, `Setting updated: ${message.key} = ${message.value}`);
					break;
				case 'reload':
					const reloadTasks = await taskManager.getTasks(context); panel.webview.html = await getSettingsHtml(getConfig(), currentPort, reloadTasks);
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
						log(LogLevel.ERROR, '[Run Now] Failed to send message', { 
							error: getErrorMessage(error)
						});
						vscode.window.showErrorMessage('Failed to send reminders');
					}
					break;
				case 'injectScript':
					// Call the auto-inject function
					autoInjectScript(extensionContext!);
					break;
				case 'sendInstructions':
					try {
						const instructions = '📋 AI Feedback Bridge - Usage Instructions\\n\\n' +
							'This extension helps coordinate between external apps and AI agents in VS Code.\\n\\n' +
							'🎯 Key Features:\\n' +
							'1. **Task Management** - Create and track workspace-specific tasks\\n' +
							'   - Click any title/description to edit inline\\n' +
							'   - Click status icon (⏳/🔄) to cycle status\\n' +
							'   - Tasks auto-sync with external API at http://localhost:' + currentPort + '/tasks\\n\\n' +
							'2. **Auto-Continue System** - Periodic AI reminders\\n' +
							'   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n' +
							'   - Customize messages and intervals\\n' +
							'   - "Run Now" button triggers all reminders immediately\\n\\n' +
							'3. **External API** - HTTP endpoints for automation\\n' +
							'   - GET /tasks - List all workspace tasks\\n' +
							'   - POST /tasks - Create new task\\n' +
							'   - PUT /tasks/:id - Update task status\\n' +
							'   - GET /help - Full API documentation\\n' +
							'   - Server auto-starts on port ' + currentPort + '\\n\\n' +
							'4. **Auto-Approval Script** - Browser dev tools automation\\n' +
							'   - "Inject Script" copies script to clipboard\\n' +
							'   - Paste in VS Code Developer Tools console\\n' +
							'   - Auto-clicks "Allow" and "Keep" buttons\\n\\n' +
							'💡 Quick Start:\\n' +
							'- Add tasks inline by clicking "Add Task"\\n' +
							'- Configure auto-continue in settings below\\n' +
							'- External apps can POST to http://localhost:' + currentPort + '/tasks\\n' +
							'- Check Command Palette for "AI Feedback Bridge" commands\\n\\n' +
							'📖 For full API docs, visit: http://localhost:' + currentPort + '/help';
						
						await sendToAgent(instructions, {
							source: 'instructions',
							timestamp: new Date().toISOString()
						});
					} catch (error) {
						vscode.window.showErrorMessage('Failed to send instructions');
					}
					break;
				case 'saveNewTask':
					try {
						const newTask = await taskManager.addTask(context, message.title, message.description, message.category);
						const createdTasks = await taskManager.getTasks(context);
						panel.webview.html = await getSettingsHtml(getConfig(), currentPort, createdTasks);
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to create task: ${getErrorMessage(error)}`);
					}
					break;
				case 'updateTaskField':
					try {
						const allTasks = await taskManager.getTasks(context);
						const task = allTasks.find(t => t.id === message.taskId);
						if (task) {
							if (message.field === 'title') {
								task.title = message.value;
							} else if (message.field === 'description') {
								task.description = message.value;
							}
							task.updatedAt = new Date().toISOString();
							await taskManager.saveTasks(context, allTasks);
							const updatedTasks = await taskManager.getTasks(context);
							panel.webview.html = await getSettingsHtml(getConfig(), currentPort, updatedTasks);
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to update task: ${getErrorMessage(error)}`);
					}
					break;
				case 'updateTaskStatus':
					try {
						await taskManager.updateTaskStatus(context, message.taskId, message.status);
						const statusTasks = await taskManager.getTasks(context);
						panel.webview.html = await getSettingsHtml(getConfig(), currentPort, statusTasks);
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to update status: ${getErrorMessage(error)}`);
					}
					break;
				case 'createTask':
					await vscode.commands.executeCommand('ai-feedback-bridge.addTask');
					const taskListAfterCreate = await taskManager.getTasks(context);
					panel.webview.html = await getSettingsHtml(getConfig(), currentPort, taskListAfterCreate);
					break;
				case 'openTaskManager':
					await vscode.commands.executeCommand('ai-feedback-bridge.listTasks');
					break;
				case 'clearCompleted':
					try {
						const allTasksForClear = await taskManager.getTasks(context);
						const completedTasks = allTasksForClear.filter(t => t.status === 'completed');
						for (const task of completedTasks) {
							await taskManager.removeTask(context, task.id);
						}
						const remainingTasks = await taskManager.getTasks(context);
						panel.webview.html = await getSettingsHtml(getConfig(), currentPort, remainingTasks);
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to clear completed tasks: ${getErrorMessage(error)}`);
					}
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
async function getSettingsHtml(config: vscode.WorkspaceConfiguration, actualPort: number, tasks: Task[]): Promise<string> {
	const categories = [
		{ key: 'tasks', icon: '📋', name: 'Tasks', interval: 300 },
		{ key: 'improvements', icon: '✨', name: 'Improvements', interval: 600 },
		{ key: 'coverage', icon: '🧪', name: 'Coverage', interval: 900 },
		{ key: 'robustness', icon: '🛡️', name: 'Robustness', interval: 600 },
		{ key: 'cleanup', icon: '🧹', name: 'Cleanup', interval: 1200 },
		{ key: 'commits', icon: '💾', name: 'Commits', interval: 900 }
	];

	const autoContinueEnabled = config.get<boolean>('autoContinue.enabled', false);
	const autoApprovalEnabled = config.get<boolean>('autoApproval.enabled', true);
	const autoInjectEnabled = config.get<boolean>('autoApproval.autoInject', false);

	let categoriesRows = '';
	for (const cat of categories) {
		const enabled = config.get<boolean>(`autoContinue.${cat.key}.enabled`, true);
		const interval = config.get<number>(`autoContinue.${cat.key}.interval`, cat.interval);
		const message = config.get<string>(`autoContinue.${cat.key}.message`, '');
		
		categoriesRows += `
			<tr class="${enabled ? '' : 'disabled'}">
				<td class="cat-icon">${cat.icon}</td>
				<td class="cat-name">${cat.name}</td>
				<td class="cat-message">
					<input type="text" value="${message}" data-key="autoContinue.${cat.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${enabled ? '' : 'disabled'} data-auto-approved="skip">
				</td>
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
		.cat-name { width: 120px; font-weight: 500; font-size: 14px; }
		.cat-message { min-width: 250px; max-width: 400px; font-size: 14px; }
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
		<button onclick="runNow()">Run Now</button>
		<button onclick="injectScript()">Inject Script</button>
		<button onclick="sendInstructions()">Send Instructions</button>
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
					<th>Message</th>
					<th>Interval</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				${categoriesRows}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${(() => {
			const activeTasks = tasks.filter(t => t.status !== 'completed').reverse();
			const completedCount = tasks.filter(t => t.status === 'completed').length;
			return activeTasks.length === 0 ? `
			<div class="row">
				<label style="color: var(--vscode-descriptionForeground); font-style: italic;">No active tasks for this workspace</label>
				<button onclick="createTask()">Add Task</button>
			</div>
			${completedCount > 0 ? `
			<div class="row" style="margin-top: 8px;">
				<label style="font-size: 12px; color: var(--vscode-descriptionForeground);">${completedCount} completed task${completedCount > 1 ? 's' : ''}</label>
				<button onclick="clearCompleted()">Clear Completed</button>
			</div>
			` : ''}
		` : `
			<table id="task-table">
				<thead>
					<tr>
						<th style="width: 40px;"></th>
						<th>Title</th>
						<th>Description</th>
						<th style="width: 120px;">Category</th>
						<th style="width: 100px;">Status</th>
					</tr>
				</thead>
				<tbody id="task-tbody">
					${activeTasks.map(t => {
						const statusIcon = t.status === 'pending' ? '⏳' : t.status === 'in-progress' ? '🔄' : '✅';
						const statusText = t.status === 'pending' ? 'Pending' : t.status === 'in-progress' ? 'In Progress' : 'Completed';
						const statusColor = t.status === 'pending' ? '#cca700' : t.status === 'in-progress' ? '#3794ff' : '#89d185';
						return `
						<tr>
							<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${t.id}', '${t.status}')" title="Click to cycle status">${statusIcon}</td>
							<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${t.id}', 'title')">${t.title}</td>
							<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${t.id}', 'description')">${t.description || '<span style="opacity: 0.5;">(click to add description)</span>'}</td>
							<td style="font-size: 12px; opacity: 0.7;">${t.category}</td>
							<td style="color: ${statusColor}; font-size: 12px;">${statusText}</td>
						</tr>
					`;}).join('')}
				</tbody>
			</table>
			<div class="row" style="margin-top: 8px;">
				<button onclick="createTask()">Add Task</button>
				<button onclick="openTaskManager()">Manage Tasks</button>
				${completedCount > 0 ? `<button onclick="clearCompleted()">Clear Completed (${completedCount})</button>` : ''}
			</div>
		`;})()} 
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
						// Toggle message input in current row
						const messageInput = row.querySelector('input[type="text"]');
						if (messageInput) messageInput.disabled = !value;
						// Toggle interval input in current row
						const intervalInput = row.querySelector('input[type="number"]');
						if (intervalInput) intervalInput.disabled = !value;
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
		
	function createTask() {
		const tbody = document.getElementById('task-tbody');
		if (!tbody) {
			vscode.postMessage({ command: 'createTask' });
			return;
		}
		
		// Check if there's already a new task row
		if (document.getElementById('new-task-row')) {
			return;
		}
		
		const newRow = document.createElement('tr');
		newRow.id = 'new-task-row';
		newRow.style.opacity = '0.7';
		newRow.innerHTML = \`
			<td>⏳</td>
			<td><input type="text" id="new-title" placeholder="Task title..." style="width: 100%; padding: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" autofocus></td>
			<td><input type="text" id="new-description" placeholder="Description (optional)..." style="width: 100%; padding: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);"></td>
			<td>
				<select id="new-category" style="padding: 4px; font-size: 12px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
					<option value="bug">bug</option>
					<option value="feature">feature</option>
					<option value="improvement">improvement</option>
					<option value="documentation">documentation</option>
					<option value="testing">testing</option>
					<option value="other">other</option>
				</select>
			</td>
			<td>
				<button onclick="saveNewTask()" style="padding: 4px 12px; font-size: 12px;">Save</button>
			</td>
		\`;
		
		tbody.insertBefore(newRow, tbody.firstChild);
		document.getElementById('new-title').focus();
		
		// Handle Enter key to save, Escape to cancel
		document.getElementById('new-title').addEventListener('keydown', (e) => {
			if (e.key === 'Enter') saveNewTask();
			if (e.key === 'Escape') cancelNewTask();
		});
		document.getElementById('new-description').addEventListener('keydown', (e) => {
			if (e.key === 'Enter') saveNewTask();
			if (e.key === 'Escape') cancelNewTask();
		});
	}
	
	function saveNewTask() {
		const title = document.getElementById('new-title')?.value.trim();
		const description = document.getElementById('new-description')?.value.trim();
		const category = document.getElementById('new-category')?.value;
		
		if (!title) {
			cancelNewTask();
			return;
		}
		
		vscode.postMessage({ 
			command: 'saveNewTask',
			title: title,
			description: description || '',
			category: category || 'other'
		});
	}
	
	function cancelNewTask() {
		const row = document.getElementById('new-task-row');
		if (row) row.remove();
	}
			function editField(cell, taskId, field) {
			const currentValue = cell.textContent.trim();
			const input = document.createElement('input');
			input.type = 'text';
			input.value = currentValue.includes('click to add') ? '' : currentValue;
			input.style.cssText = 'width:100%;padding:4px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)';
			
			const save = () => {
				const newValue = input.value.trim();
				if (newValue && newValue !== currentValue) {
					vscode.postMessage({ command: 'updateTaskField', taskId, field, value: newValue });
				} else {
					cell.textContent = currentValue;
				}
			};
			
			input.addEventListener('blur', save);
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') save();
				else if (e.key === 'Escape') cell.textContent = currentValue;
			});
			
			cell.textContent = '';
			cell.appendChild(input);
			input.focus();
			input.select();
		}
		
		function cycleStatus(taskId, currentStatus) {
			const nextStatus = currentStatus === 'pending' ? 'in-progress' : 
			                   currentStatus === 'in-progress' ? 'completed' : 'pending';
			vscode.postMessage({ command: 'updateTaskStatus', taskId, status: nextStatus });
		}
		
		function openTaskManager() {
			vscode.postMessage({ command: 'openTaskManager' });
		}
		
		function clearCompleted() {
			vscode.postMessage({ command: 'clearCompleted' });
		}
		
		function sendInstructions() {
			vscode.postMessage({ command: 'sendInstructions' });
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
	
	// Initialize logging module
	initLogging(outputChannel);
	
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
		await refreshSettingsPanel();
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
			
			await refreshSettingsPanel();
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
			await sendToCopilotChat(feedbackText, {
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
		refreshSettingsPanel();
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
 * Context object for feedback messages
 */
interface FeedbackContext {
	source: string;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * Send feedback directly to the AI agent for automatic processing
 */
async function sendToAgent(feedbackMessage: string, appContext?: unknown): Promise<boolean> {
	const context: FeedbackContext = (appContext as FeedbackContext) || { source: "unknown", timestamp: new Date().toISOString() };
	try {
		// Ultra-concise format to minimize token usage
		let fullMessage = `# � AI DEV MODE\n\n`;
		fullMessage += `**User Feedback:**\n${feedbackMessage}\n\n`;

		// Only include context if it has meaningful data beyond source/timestamp
		const contextKeys = Object.keys(context).filter(k => k !== 'source' && k !== 'timestamp');
		if (contextKeys.length > 0) {
			fullMessage += `**Context:**\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\n`;
		}

		fullMessage += `**Instructions:**\n`;
		fullMessage += `Analyze feedback, take appropriate action:\n`;
		fullMessage += `• If a bug → find and fix root cause\n`;
		fullMessage += `• If a feature → draft implementation plan\n`;
		fullMessage += `• Apply and commit changes\n`;

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
				// Short delay to allow chat UI to populate (300ms is sufficient)
				setTimeout(async () => {
					try {
						await vscode.commands.executeCommand('workbench.action.chat.submit');
					} catch (e) {
						outputChannel.appendLine('Note: Could not auto-submit. User can press Enter to submit.');
					}
				}, 300);
				
				// Silent success - logged only
				log(LogLevel.INFO, 'Feedback sent to AI Agent');
				return true;
			}
		} catch (modelError) {
			outputChannel.appendLine(`Could not access language model: ${getErrorMessage(modelError)}`);
		}

		// Fallback: copy to clipboard
		await vscode.env.clipboard.writeText(fullMessage);
		log(LogLevel.INFO, 'Feedback copied to clipboard');
		
		return true;

	} catch (error) {
		log(LogLevel.ERROR, `Error sending to agent: ${getErrorMessage(error)}`);
		return false;
	}
}

/**
 * Send feedback to GitHub Copilot Chat (legacy method - kept for manual command)
 */
async function sendToCopilotChat(feedbackMessage: string, appContext: FeedbackContext): Promise<boolean> {
	return sendToAgent(feedbackMessage, appContext);
}

/**
 * Start HTTP server to receive feedback from Electron app
 */
function startFeedbackServer(context: vscode.ExtensionContext) {
	server.startServer(context, currentPort, sendToAgent);
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
	
	// Release port from registry
	if (extensionContext) {
		await portManager.releasePort(extensionContext, currentPort);
	}
	
	log(LogLevel.INFO, '👋 AI Agent Feedback Bridge deactivated');
}
