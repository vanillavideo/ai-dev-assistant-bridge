"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var http = __toESM(require("http"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var server;
var outputChannel;
var chatParticipant;
var statusBarToggle;
var statusBarSettings;
var statusBarInject;
var autoContinueTimer;
var currentPort = 3737;
var autoApprovalInterval;
var extensionContext;
function log(level, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  const fullMessage = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  outputChannel.appendLine(fullMessage);
  if (level === "ERROR" /* ERROR */) {
    console.error(fullMessage);
  }
}
function getConfig() {
  return vscode.workspace.getConfiguration("aiFeedbackBridge", null);
}
async function updateConfig(key, value) {
  const config = getConfig();
  await config.update(key, value, vscode.ConfigurationTarget.Global);
}
var PORT_REGISTRY_KEY = "aiFeedbackBridge.portRegistry";
var BASE_PORT = 3737;
var MAX_PORT_SEARCH = 50;
async function getPortRegistry(context) {
  return context.globalState.get(PORT_REGISTRY_KEY, []);
}
async function savePortRegistry(context, registry) {
  await context.globalState.update(PORT_REGISTRY_KEY, registry);
}
async function findAvailablePort(context) {
  const registry = await getPortRegistry(context);
  const workspaceName = vscode.workspace.name || "No Workspace";
  const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "no-workspace";
  const oneHourAgo = Date.now() - 60 * 60 * 1e3;
  const activeRegistry = registry.filter((entry) => entry.timestamp > oneHourAgo);
  const existingEntry = activeRegistry.find((entry) => entry.workspace === workspaceId);
  if (existingEntry) {
    log("INFO" /* INFO */, `Reusing existing port ${existingEntry.port} for workspace`);
    existingEntry.timestamp = Date.now();
    await savePortRegistry(context, activeRegistry);
    return existingEntry.port;
  }
  const usedPorts = new Set(activeRegistry.map((e) => e.port));
  let port = BASE_PORT;
  for (let i = 0; i < MAX_PORT_SEARCH; i++) {
    const candidatePort = BASE_PORT + i;
    if (!usedPorts.has(candidatePort)) {
      const isAvailable = await isPortAvailable(candidatePort);
      if (isAvailable) {
        port = candidatePort;
        break;
      }
    }
  }
  activeRegistry.push({
    port,
    workspace: workspaceId,
    timestamp: Date.now()
  });
  await savePortRegistry(context, activeRegistry);
  log("INFO" /* INFO */, `Auto-assigned port ${port} for workspace: ${workspaceName}`);
  return port;
}
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    testServer.once("listening", () => {
      testServer.close();
      resolve(true);
    });
    testServer.listen(port);
  });
}
async function releasePort(context, port) {
  const registry = await getPortRegistry(context);
  const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "no-workspace";
  const filtered = registry.filter(
    (entry) => !(entry.port === port && entry.workspace === workspaceId)
  );
  await savePortRegistry(context, filtered);
  log("INFO" /* INFO */, `Released port ${port}`);
}
function showSettingsPanel(context) {
  const panel = vscode.window.createWebviewPanel(
    "aiFeedbackBridgeSettings",
    "AI Feedback Bridge Settings",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  const config = getConfig();
  panel.webview.html = getSettingsHtml(config);
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "updateSetting":
          await updateConfig(message.key, message.value);
          log("INFO" /* INFO */, `Setting updated: ${message.key} = ${message.value}`);
          break;
        case "reload":
          panel.webview.html = getSettingsHtml(getConfig());
          break;
        case "injectScript":
          autoInjectScript();
          break;
      }
    },
    void 0,
    context.subscriptions
  );
}
function getSettingsHtml(config) {
  const categories = [
    { key: "tasks", icon: "\u{1F4CB}", name: "Tasks", interval: 300 },
    { key: "improvements", icon: "\u2728", name: "Improvements", interval: 600 },
    { key: "coverage", icon: "\u{1F9EA}", name: "Coverage", interval: 900 },
    { key: "robustness", icon: "\u{1F6E1}\uFE0F", name: "Robustness", interval: 600 },
    { key: "cleanup", icon: "\u{1F9F9}", name: "Cleanup", interval: 1200 },
    { key: "commits", icon: "\u{1F4BE}", name: "Commits", interval: 900 }
  ];
  const autoContinueEnabled = config.get("autoContinue.enabled", false);
  const autoApprovalEnabled = config.get("autoApproval.enabled", false);
  const autoInjectEnabled = config.get("autoApproval.autoInject", false);
  const port = config.get("port", 3737);
  let categoriesRows = "";
  for (const cat of categories) {
    const enabled = config.get(`autoContinue.${cat.key}.enabled`, true);
    const interval = config.get(`autoContinue.${cat.key}.interval`, cat.interval);
    categoriesRows += `
			<tr class="${enabled ? "" : "disabled"}">
				<td class="cat-icon">${cat.icon}</td>
				<td class="cat-name">${cat.name}</td>
				<td class="cat-interval">
					<input type="number" value="${interval}" data-key="autoContinue.${cat.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${enabled ? "" : "disabled"}>s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${cat.key}.enabled" ${enabled ? "checked" : ""} 
					       class="toggle-cb" id="cb-${cat.key}">
					<label for="cb-${cat.key}" class="toggle-label"></label>
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
			font-size: 13px;
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
		.header h1 { font-size: 16px; flex: 1; font-weight: 600; }
		
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
			font-size: 13px;
		}
		
		.row {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 4px 0;
		}
		.row label { flex: 1; font-size: 12px; }
		
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th {
			text-align: left;
			padding: 6px 4px;
			font-weight: 600;
			font-size: 11px;
			opacity: 0.7;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		td {
			padding: 6px 4px;
			border-bottom: 1px solid rgba(128,128,128,0.1);
		}
		tr.disabled { opacity: 0.5; }
		.cat-icon { width: 28px; font-size: 15px; }
		.cat-name { font-weight: 500; font-size: 12px; }
		.cat-interval { width: 100px; font-size: 12px; }
		.cat-toggle { width: 45px; text-align: right; }
		
		input[type="number"] {
			padding: 3px 5px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-size: 11px;
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
			padding: 5px 10px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
			font-family: var(--vscode-font-family);
		}
		button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		
		.port-display {
			font-family: 'Monaco', 'Courier New', monospace;
			font-weight: 600;
			color: var(--vscode-textLink-foreground);
			font-size: 13px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>\u{1F309} AI Feedback Bridge</h1>
		<button onclick="injectScript()">\u{1F4CB} Inject Script</button>
	</div>
	
	<div class="section">
		<div class="section-title">Server</div>
		<div class="row">
			<label>Port (auto-assigned)</label>
			<span class="port-display">${port}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${autoApprovalEnabled ? "checked" : ""} 
				       class="toggle-cb" id="cb-approval">
				<label for="cb-approval" class="toggle-label"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${autoInjectEnabled ? "checked" : ""} 
				       class="toggle-cb" id="cb-autoinject" ${autoApprovalEnabled ? "" : "disabled"}>
				<label for="cb-autoinject" class="toggle-label"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${autoContinueEnabled ? "checked" : ""} 
				       class="toggle-cb" id="cb-autocontinue">
				<label for="cb-autocontinue" class="toggle-label"></label>
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
		
		function injectScript() {
			vscode.postMessage({ command: 'injectScript' });
		}
	</script>
</body>
</html>`;
}
async function activate(context) {
  console.log("AI Agent Feedback Bridge is now active!");
  extensionContext = context;
  outputChannel = vscode.window.createOutputChannel("AI Agent Feedback");
  context.subscriptions.push(outputChannel);
  log("INFO" /* INFO */, "\u{1F680} AI Agent Feedback Bridge activated");
  const config = getConfig();
  const configuredPort = config.get("port");
  if (!configuredPort || configuredPort === 3737) {
    currentPort = await findAvailablePort(context);
    await updateConfig("port", currentPort);
    log("INFO" /* INFO */, `Auto-selected port: ${currentPort}`);
  } else {
    currentPort = configuredPort;
    log("INFO" /* INFO */, `Using configured port: ${currentPort}`);
  }
  const workspaceName = vscode.workspace.name || "No Workspace";
  const workspaceFolders = vscode.workspace.workspaceFolders?.length || 0;
  log("INFO" /* INFO */, `Window context: ${workspaceName} (${workspaceFolders} folders)`);
  statusBarSettings = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarSettings.command = "ai-feedback-bridge.openSettings";
  statusBarSettings.show();
  context.subscriptions.push(statusBarSettings);
  statusBarToggle = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  statusBarToggle.command = "ai-feedback-bridge.toggleAutoContinue";
  statusBarToggle.show();
  context.subscriptions.push(statusBarToggle);
  statusBarInject = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
  statusBarInject.command = "ai-feedback-bridge.injectScript";
  statusBarInject.text = "$(clippy) Inject";
  statusBarInject.tooltip = "Copy auto-approval script to clipboard";
  statusBarInject.show();
  context.subscriptions.push(statusBarInject);
  updateStatusBar(config);
  const openSettingsCmd = vscode.commands.registerCommand("ai-feedback-bridge.openSettings", async () => {
    showSettingsPanel(context);
  });
  context.subscriptions.push(openSettingsCmd);
  const injectScriptCmd = vscode.commands.registerCommand("ai-feedback-bridge.injectScript", async () => {
    autoInjectScript();
  });
  context.subscriptions.push(injectScriptCmd);
  startFeedbackServer(context);
  const disposable = vscode.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat", async (feedbackText) => {
    if (!feedbackText) {
      feedbackText = await vscode.window.showInputBox({
        prompt: "Enter feedback to send to Copilot Chat",
        placeHolder: "Describe the issue or request..."
      });
    }
    if (feedbackText) {
      await sendToCopilotChat(feedbackText, {});
    }
  });
  context.subscriptions.push(disposable);
  const toggleAutoContinueCmd = vscode.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue", async () => {
    const cfg = getConfig();
    const currentState = cfg.get("autoContinue.enabled", false);
    await updateConfig("autoContinue.enabled", !currentState);
    log("INFO" /* INFO */, `Auto-Continue ${!currentState ? "enabled" : "disabled"}`);
  });
  context.subscriptions.push(toggleAutoContinueCmd);
  const changePortCmd = vscode.commands.registerCommand("ai-feedback-bridge.changePort", async () => {
    const newPort = await vscode.window.showInputBox({
      prompt: "Enter new port number",
      value: currentPort.toString(),
      validateInput: (value) => {
        const port = parseInt(value);
        return isNaN(port) || port < 1024 || port > 65535 ? "Invalid port (1024-65535)" : null;
      }
    });
    if (newPort) {
      await updateConfig("port", parseInt(newPort));
      log("INFO" /* INFO */, `Port changed to ${newPort}. Reloading VS Code...`);
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  });
  context.subscriptions.push(changePortCmd);
  const showStatusCmd = vscode.commands.registerCommand("ai-feedback-bridge.showStatus", () => {
    const cfg = getConfig();
    const autoInterval = cfg.get("autoContinue.interval", 300);
    const autoEnabled = cfg.get("autoContinue.enabled", false);
    const workspaceName2 = vscode.workspace.name || "No Workspace";
    const msg = `\u{1F309} AI Feedback Bridge Status

Window: ${workspaceName2}
Port: ${currentPort}
Server: ${server ? "Running \u2705" : "Stopped \u274C"}
Auto-Continue: ${autoEnabled ? `Enabled \u2705 (every ${autoInterval}s)` : "Disabled \u274C"}
Endpoint: http://localhost:${currentPort}`;
    outputChannel.appendLine(msg);
    outputChannel.show();
  });
  context.subscriptions.push(showStatusCmd);
  startAutoContinue(context);
  initializeAutoApproval();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("aiFeedbackBridge")) {
        const cfg = getConfig();
        log("DEBUG" /* DEBUG */, "Configuration changed", {
          workspace: vscode.workspace.name,
          affectedKeys: ["port", "autoContinue"].filter(
            (k) => e.affectsConfiguration(`aiFeedbackBridge.${k}`)
          )
        });
        if (e.affectsConfiguration("aiFeedbackBridge.port")) {
          const newPort = cfg.get("port", 3737);
          if (newPort !== currentPort) {
            log("INFO" /* INFO */, `Port change detected: ${currentPort} \u2192 ${newPort}. Reloading window...`);
            vscode.commands.executeCommand("workbench.action.reloadWindow");
          }
        }
        updateStatusBar(cfg);
        if (e.affectsConfiguration("aiFeedbackBridge.autoContinue")) {
          restartAutoContinue(context);
        }
      }
    })
  );
  chatParticipant = vscode.chat.createChatParticipant("ai-agent-feedback-bridge.agent", handleChatRequest);
  chatParticipant.iconPath = vscode.Uri.file(context.asAbsolutePath("icon.png"));
  context.subscriptions.push(chatParticipant);
  const enableAutoApprovalCommand = vscode.commands.registerCommand(
    "ai-agent-feedback-bridge.enableAutoApproval",
    () => enableAutoApproval(context)
  );
  context.subscriptions.push(enableAutoApprovalCommand);
  const disableAutoApprovalCommand = vscode.commands.registerCommand(
    "ai-agent-feedback-bridge.disableAutoApproval",
    () => disableAutoApproval()
  );
  context.subscriptions.push(disableAutoApprovalCommand);
  const injectAutoApprovalScriptCommand = vscode.commands.registerCommand(
    "ai-agent-feedback-bridge.injectAutoApprovalScript",
    () => injectAutoApprovalScript()
  );
  context.subscriptions.push(injectAutoApprovalScriptCommand);
  log("INFO" /* INFO */, `Feedback server started on http://localhost:${currentPort}`);
}
function updateStatusBar(config) {
  if (!statusBarToggle || !statusBarSettings) {
    return;
  }
  const autoEnabled = config.get("autoContinue.enabled", false);
  statusBarSettings.text = `AI Bridge: ${currentPort}`;
  statusBarSettings.tooltip = "Click to configure AI Feedback Bridge";
  if (autoEnabled) {
    statusBarToggle.text = "$(sync~spin) Stop";
    statusBarToggle.tooltip = "Auto-Continue active\nClick to stop";
  } else {
    statusBarToggle.text = "$(play) Start";
    statusBarToggle.tooltip = "Auto-Continue inactive\nClick to start";
  }
}
async function getSmartAutoContinueMessage(context) {
  const config = getConfig();
  const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
  const now = Date.now();
  const messages = [];
  const lastSentKey = "autoContinue.lastSent";
  const lastSent = context.globalState.get(lastSentKey, {});
  const newLastSent = { ...lastSent };
  for (const category of categories) {
    const enabled = config.get(`autoContinue.${category}.enabled`, true);
    const interval = config.get(`autoContinue.${category}.interval`, 300);
    const message = config.get(`autoContinue.${category}.message`, "");
    if (!enabled || !message) {
      continue;
    }
    const lastSentTime = lastSent[category] || 0;
    const elapsed = (now - lastSentTime) / 1e3;
    if (elapsed >= interval) {
      messages.push(message);
      newLastSent[category] = now;
    }
  }
  await context.globalState.update(lastSentKey, newLastSent);
  if (messages.length === 0) {
    return "";
  }
  return messages.join(". ") + ".";
}
function startAutoContinue(context) {
  const config = getConfig();
  const enabled = config.get("autoContinue.enabled", false);
  if (enabled) {
    const checkInterval = 500;
    const workspaceName = vscode.workspace.name || "No Workspace";
    log("INFO" /* INFO */, `\u2705 Auto-Continue enabled for window: ${workspaceName}`);
    autoContinueTimer = setInterval(async () => {
      try {
        const message = await getSmartAutoContinueMessage(context);
        if (message) {
          log("INFO" /* INFO */, "[Auto-Continue] Sending periodic reminder");
          await sendToAgent(message, {
            source: "auto_continue",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (error) {
        log("ERROR" /* ERROR */, "[Auto-Continue] Failed to send message", { error });
      }
    }, checkInterval);
  } else {
    log("DEBUG" /* DEBUG */, "Auto-Continue is disabled");
  }
}
function restartAutoContinue(context) {
  if (autoContinueTimer) {
    clearInterval(autoContinueTimer);
    autoContinueTimer = void 0;
    outputChannel.appendLine("Auto-Continue stopped");
  }
  startAutoContinue(context);
}
async function handleChatRequest(request, context, stream, token) {
  outputChannel.appendLine(`Chat request received: ${request.prompt}`);
  stream.markdown(`### \u{1F504} Processing Feedback

`);
  stream.markdown(`**Message:** ${request.prompt}

`);
  const feedbackMatch = request.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/);
  if (feedbackMatch) {
    stream.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`);
  } else {
    stream.markdown(`Processing your message...

`);
  }
  try {
    const [model] = await vscode.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
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
      stream.markdown(`\u26A0\uFE0F Error: ${err.message}

`);
    }
  }
  return { metadata: { command: "process-feedback" } };
}
async function sendToAgent(feedbackMessage, appContext) {
  try {
    let fullMessage = `# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;
    fullMessage += `**User Feedback:**
${feedbackMessage}

`;
    if (appContext && Object.keys(appContext).length > 0) {
      fullMessage += `**Context:**
`;
      fullMessage += `\`\`\`json
${JSON.stringify(appContext, null, 2)}
\`\`\`

`;
    }
    fullMessage += `**Instructions:**
`;
    fullMessage += `Analyze this feedback and provide actionable responses. `;
    fullMessage += `If it's a bug, analyze the root cause. `;
    fullMessage += `If it's a feature request, provide an implementation plan. `;
    fullMessage += `Make code changes if needed using available tools.

`;
    outputChannel.appendLine("Processing feedback through AI agent...");
    outputChannel.appendLine(fullMessage);
    try {
      const [model] = await vscode.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
      if (model) {
        outputChannel.appendLine("\u2705 AI Agent processing request...");
        await vscode.commands.executeCommand("workbench.action.chat.open", {
          query: `@agent ${fullMessage}`
        });
        setTimeout(async () => {
          try {
            await vscode.commands.executeCommand("workbench.action.chat.submit");
          } catch (e) {
            outputChannel.appendLine("Note: Could not auto-submit. User can press Enter to submit.");
          }
        }, 500);
        log("INFO" /* INFO */, "Feedback sent to AI Agent");
        return true;
      }
    } catch (modelError) {
      outputChannel.appendLine(`Could not access language model: ${modelError}`);
    }
    await vscode.env.clipboard.writeText(fullMessage);
    log("INFO" /* INFO */, "Feedback copied to clipboard");
    return true;
  } catch (error) {
    log("ERROR" /* ERROR */, `Error sending to agent: ${error}`);
    return false;
  }
}
async function sendToCopilotChat(feedbackMessage, appContext) {
  return sendToAgent(feedbackMessage, appContext);
}
function startFeedbackServer(context) {
  server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    if (req.url === "/restart-app" || req.url?.startsWith("/restart-app?")) {
      const urlParts = req.url.split("?");
      const queryParams = new URLSearchParams(urlParts[1] || "");
      const delaySeconds = parseInt(queryParams.get("delay") || "30", 10);
      outputChannel.appendLine(`Received restart request for Electron app (delay: ${delaySeconds}s)`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: true,
        message: `App restart initiated (will restart in ${delaySeconds}s)`,
        delay: delaySeconds
      }));
      setTimeout(async () => {
        try {
          const { exec } = require("child_process");
          const { promisify } = require("util");
          const execAsync = promisify(exec);
          outputChannel.appendLine("Killing Electron process...");
          try {
            await execAsync('pkill -f "electron.*Code/AI"');
          } catch (e) {
            outputChannel.appendLine("Kill command completed (process may not have been running)");
          }
          outputChannel.appendLine(`Waiting ${delaySeconds} seconds before restart...`);
          await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1e3));
          const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          if (workspacePath && workspacePath.includes("/AI")) {
            outputChannel.appendLine(`Restarting Electron app in: ${workspacePath}`);
            exec(`cd "${workspacePath}" && npm run dev > /dev/null 2>&1 &`);
            outputChannel.appendLine("Electron app restart command sent");
          } else {
            outputChannel.appendLine(`Could not find workspace path: ${workspacePath}`);
          }
        } catch (error) {
          outputChannel.appendLine(`Restart error: ${error}`);
        }
      }, 100);
      return;
    }
    let body = "";
    const maxBodySize = 1024 * 1024;
    let bodySize = 0;
    req.on("data", (chunk) => {
      bodySize += chunk.length;
      if (bodySize > maxBodySize) {
        log("WARN" /* WARN */, "Request body too large", { size: bodySize });
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request body too large (max 1MB)" }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const feedback = JSON.parse(body);
        if (!feedback || typeof feedback !== "object") {
          throw new Error("Invalid feedback structure: must be an object");
        }
        if (!feedback.message || typeof feedback.message !== "string") {
          throw new Error('Invalid feedback: missing or invalid "message" field');
        }
        const sanitizedMessage = feedback.message.trim();
        if (sanitizedMessage.length === 0) {
          throw new Error("Invalid feedback: message cannot be empty");
        }
        if (sanitizedMessage.length > 5e4) {
          throw new Error("Invalid feedback: message too long (max 50000 characters)");
        }
        log("INFO" /* INFO */, "Received feedback", {
          messageLength: sanitizedMessage.length,
          hasContext: !!feedback.context
        });
        const success = await sendToAgent(sanitizedMessage, feedback.context);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success,
          message: success ? "Feedback sent to AI Agent" : "Failed to send to AI Agent"
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log("ERROR" /* ERROR */, "Error processing feedback", { error: errorMessage });
        if (error instanceof SyntaxError) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON format" }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: errorMessage }));
        }
      }
    });
  });
  try {
    server.listen(currentPort, () => {
      log("INFO" /* INFO */, `\u2705 Server listening on port ${currentPort}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        log("ERROR" /* ERROR */, `Port ${currentPort} is already in use. Please change the port in settings.`);
      } else {
        log("ERROR" /* ERROR */, "Server error occurred", { error: error.message, code: error.code });
      }
    });
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to start server", { error });
  }
  context.subscriptions.push({
    dispose: () => {
      if (server) {
        log("INFO" /* INFO */, "Closing server");
        server.close();
      }
    }
  });
}
function initializeAutoApproval() {
  const config = getConfig();
  const autoApprovalEnabled = config.get("autoApproval.enabled", false);
  const autoInjectEnabled = config.get("autoApproval.autoInject", false);
  if (autoApprovalEnabled) {
    log("INFO" /* INFO */, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
    if (autoInjectEnabled) {
      log("INFO" /* INFO */, "Auto-inject enabled. Launching quick setup...");
      setTimeout(() => {
        autoInjectScript().catch((err) => {
          log("WARN" /* WARN */, "Auto-inject setup failed:", err);
        });
      }, 1500);
    }
  }
}
async function autoInjectScript() {
  try {
    const script = getAutoApprovalScript();
    await vscode.env.clipboard.writeText(script);
    log("INFO" /* INFO */, "\u{1F4CB} Auto-approval script copied to clipboard");
    try {
      await vscode.commands.executeCommand("workbench.action.toggleDevTools");
      log("INFO" /* INFO */, "\u{1F6E0}\uFE0F Developer Tools opened");
    } catch (error) {
      log("WARN" /* WARN */, "Could not auto-open Developer Tools. Please open manually with Cmd+Option+I", error);
    }
    const panel = vscode.window.createWebviewPanel(
      "autoInject",
      "\u{1F680} Quick Setup - Ready to Paste!",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: false
      }
    );
    panel.webview.html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Quick Setup</title>
				<style>
					* { box-sizing: border-box; margin: 0; padding: 0; }
					body { 
						font-family: var(--vscode-font-family); 
						padding: 30px; 
						background: var(--vscode-editor-background);
						color: var(--vscode-editor-foreground);
						line-height: 1.6;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						min-height: 100vh;
					}
					.hero {
						text-align: center;
						margin-bottom: 30px;
					}
					.hero h1 {
						font-size: 32px;
						color: var(--vscode-textLink-foreground);
						margin-bottom: 15px;
					}
					.big-message {
						background: linear-gradient(135deg, var(--vscode-button-background), var(--vscode-textLink-foreground));
						color: white;
						padding: 25px 40px;
						border-radius: 12px;
						font-size: 24px;
						font-weight: bold;
						margin: 20px 0;
						box-shadow: 0 4px 12px rgba(0,0,0,0.3);
						animation: pulse 2s ease-in-out infinite;
					}
					@keyframes pulse {
						0%, 100% { transform: scale(1); }
						50% { transform: scale(1.05); }
					}
					.quick-steps {
						background: var(--vscode-textCodeBlock-background);
						padding: 25px;
						border-radius: 8px;
						max-width: 600px;
						margin: 20px 0;
					}
					.quick-step {
						display: flex;
						gap: 15px;
						margin: 15px 0;
						align-items: center;
						font-size: 16px;
					}
					.step-icon {
						font-size: 28px;
						min-width: 40px;
						text-align: center;
					}
					.kbd {
						background: var(--vscode-input-background);
						border: 1px solid var(--vscode-input-border);
						padding: 4px 8px;
						border-radius: 4px;
						font-family: monospace;
						font-weight: bold;
						font-size: 14px;
						white-space: nowrap;
					}
					button { 
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 12px 24px;
						border-radius: 6px;
						cursor: pointer;
						margin: 8px;
						font-size: 14px;
						font-weight: 600;
						font-family: var(--vscode-font-family);
						transition: all 0.2s;
					}
					button:hover { 
						background: var(--vscode-button-hoverBackground);
						transform: translateY(-1px);
					}
					.actions {
						margin-top: 30px;
						text-align: center;
					}
					.success-msg {
						background: rgba(0, 200, 0, 0.15);
						border: 2px solid #0c0;
						padding: 15px 20px;
						margin: 20px 0;
						border-radius: 6px;
						font-size: 14px;
						max-width: 600px;
					}
					details {
						margin-top: 30px;
						max-width: 600px;
					}
					summary {
						cursor: pointer;
						user-select: none;
						padding: 10px;
						background: var(--vscode-textCodeBlock-background);
						border-radius: 4px;
						font-weight: 600;
					}
					.code-box {
						background: var(--vscode-editor-background);
						border: 1px solid var(--vscode-panel-border);
						padding: 15px;
						border-radius: 4px;
						margin-top: 10px;
						max-height: 300px;
						overflow-y: auto;
						font-family: 'Monaco', 'Courier New', monospace;
						font-size: 11px;
						white-space: pre-wrap;
						word-break: break-all;
					}
				</style>
			</head>
			<body>
				<div class="hero">
					<h1>\u{1F680} Auto-Approval Setup</h1>
				</div>

				<div class="big-message">
					\u2705 Script Copied! Ready to Paste
				</div>

				<div class="success-msg">
					<strong>\u{1F389} Everything is ready!</strong> The script is in your clipboard.<br>
					Just paste it into the browser console and press Enter.
				</div>

				<div class="quick-steps">
					<div class="quick-step">
						<div class="step-icon">\u{1F6E0}\uFE0F</div>
						<div>Open browser DevTools: <span class="kbd">Cmd+Option+I</span> or <span class="kbd">F12</span></div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u{1F4CB}</div>
						<div>Click <strong>Console</strong> tab</div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u2328\uFE0F</div>
						<div>Paste with <span class="kbd">Cmd+V</span> or <span class="kbd">Ctrl+V</span></div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u23CE</div>
						<div>Press <span class="kbd">Enter</span> to run</div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u2705</div>
						<div>Look for success message in console</div>
					</div>
				</div>

				<div class="actions">
					<button onclick="copyAgain()">\u{1F4CB} Copy Script Again</button>
					<button onclick="openDevTools()">\u{1F6E0}\uFE0F Toggle DevTools</button>
					<button onclick="done()" style="background: rgba(0, 200, 0, 0.3);">\u2705 Done - Close This</button>
				</div>

				<details>
					<summary>\u{1F4DD} View Script Contents</summary>
					<div class="code-box" id="scriptContent"></div>
				</details>

				<script>
					const vscode = acquireVsCodeApi();
					const script = ${JSON.stringify(script)};
					document.getElementById('scriptContent').textContent = script;
					
					function copyAgain() {
						navigator.clipboard.writeText(script).then(() => {
							vscode.postMessage({ command: 'copied' });
						});
					}
					
					function openDevTools() {
						vscode.postMessage({ command: 'openDevTools' });
					}
					
					function done() {
						vscode.postMessage({ command: 'close' });
					}
				</script>
			</body>
			</html>
		`;
    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "copied":
          log("INFO" /* INFO */, "\u{1F4CB} Script copied to clipboard again");
          break;
        case "openDevTools":
          try {
            await vscode.commands.executeCommand("workbench.action.toggleDevTools");
            log("INFO" /* INFO */, "\u{1F6E0}\uFE0F Developer Tools toggled");
          } catch (error) {
            log("WARN" /* WARN */, "Could not toggle Developer Tools", error);
          }
          break;
        case "close":
          panel.dispose();
          log("INFO" /* INFO */, "\u2705 Auto-inject setup completed");
          break;
      }
    });
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to auto-inject script", error);
  }
}
function getAutoApprovalScript() {
  try {
    const scriptPath = path.join(extensionContext.extensionPath, "auto-approval-script.js");
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    return scriptContent;
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to read auto-approval-script.js", error);
    return "// Error: Could not load auto-approval script";
  }
}
function enableAutoApproval(context) {
  if (autoApprovalInterval) {
    outputChannel.appendLine("Auto-approval is already enabled");
    return;
  }
  const config = getConfig();
  const intervalMs = config.get("autoApproval.intervalMs", 2e3);
  log("INFO" /* INFO */, `Enabling auto-approval with ${intervalMs}ms interval`);
  autoApprovalInterval = setInterval(async () => {
    try {
      await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
    } catch (error) {
    }
  }, intervalMs);
  context.subscriptions.push({
    dispose: () => {
      if (autoApprovalInterval) {
        clearInterval(autoApprovalInterval);
        autoApprovalInterval = void 0;
      }
    }
  });
  log("INFO" /* INFO */, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
}
function disableAutoApproval() {
  if (autoApprovalInterval) {
    clearInterval(autoApprovalInterval);
    autoApprovalInterval = void 0;
    outputChannel.appendLine("Auto-approval disabled");
    log("INFO" /* INFO */, "Auto-approval disabled");
  } else {
    log("INFO" /* INFO */, "Auto-approval is not currently enabled");
  }
}
function injectAutoApprovalScript() {
  const script = getAutoApprovalScript();
  const panel = vscode.window.createWebviewPanel(
    "autoApprovalScript",
    "Auto-Approval Script",
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );
  panel.webview.html = getAutoApprovalInstructionsHtml(script);
  vscode.env.clipboard.writeText(script);
  log("INFO" /* INFO */, "Auto-approval script copied to clipboard");
}
function getAutoApprovalInstructionsHtml(script) {
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
    <h1>\u{1F9E9} VS Code Chat Auto-Approval System</h1>
    
    <div class="warning">
        \u26A0\uFE0F <strong>Note:</strong> This script auto-clicks "Allow" and "Keep" buttons in the chat interface.
        Make sure you trust the operations being performed!
    </div>

    <div class="step">
        <h2>\u{1F4CB} Step 1: The script is already copied to your clipboard!</h2>
        <p>Just paste it in the next step.</p>
    </div>

    <div class="step">
        <h2>\u{1F527} Step 2: Open VS Code Developer Tools</h2>
        <p>Go to: <strong>Help \u2192 Toggle Developer Tools</strong></p>
        <p>Or use keyboard shortcut: <strong>\u2318\u2325I</strong> (Mac) / <strong>Ctrl+Shift+I</strong> (Windows/Linux)</p>
    </div>

    <div class="step">
        <h2>\u{1F4BB} Step 3: Paste and run the script</h2>
        <p>1. Click on the <strong>Console</strong> tab in Developer Tools</p>
        <p>2. Paste the script (\u2318V / Ctrl+V)</p>
        <p>3. Press <strong>Enter</strong> to execute</p>
    </div>

    <div class="step">
        <h2>\u2705 What happens next?</h2>
        <ul>
            <li>The script will check every 2 seconds for "Allow" or "Keep" buttons</li>
            <li>When found, it automatically clicks them</li>
            <li>You'll see confirmation messages in the console</li>
            <li>The script includes safety checks to skip dangerous operations (delete, remove, rm)</li>
        </ul>
    </div>

    <div class="step">
        <h2>\u{1F6D1} To stop the script:</h2>
        <p>In the Developer Console, run:</p>
        <div class="code-block">clearInterval(window.__autoApproveInterval)</div>
    </div>

    <hr style="margin: 30px 0; border: 1px solid var(--vscode-panel-border);">

    <h2>\u{1F4DC} Full Script (already copied):</h2>
    <div class="code-block">${script.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

    <button class="button" onclick="copyScript()">Copy Script Again</button>

    <script>
        function copyScript() {
            const script = \`${script.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
            navigator.clipboard.writeText(script).then(() => {
                alert('Script copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;
}
async function deactivate() {
  if (server) {
    server.close();
    log("INFO" /* INFO */, "HTTP server closed");
  }
  if (autoContinueTimer) {
    clearInterval(autoContinueTimer);
    autoContinueTimer = void 0;
    log("INFO" /* INFO */, "Auto-continue timer cleared");
  }
  if (autoApprovalInterval) {
    clearInterval(autoApprovalInterval);
    autoApprovalInterval = void 0;
    log("INFO" /* INFO */, "Auto-approval interval cleared");
  }
  if (extensionContext) {
    await releasePort(extensionContext, currentPort);
  }
  log("INFO" /* INFO */, "\u{1F44B} AI Agent Feedback Bridge deactivated");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
