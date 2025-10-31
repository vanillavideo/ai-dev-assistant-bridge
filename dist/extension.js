"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// src/modules/types.ts
var init_types = __esm({
  "src/modules/types.ts"() {
    "use strict";
  }
});

// src/modules/logging.ts
function initLogging(channel) {
  outputChannel = channel;
}
function log(level, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  const fullMessage = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  if (outputChannel) {
    outputChannel.appendLine(fullMessage);
  }
  if (level === "ERROR" /* ERROR */) {
    console.error(fullMessage);
  } else if (level === "WARN" /* WARN */) {
    console.warn(fullMessage);
  } else {
    console.log(fullMessage);
  }
}
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
var outputChannel;
var init_logging = __esm({
  "src/modules/logging.ts"() {
    "use strict";
    init_types();
  }
});

// src/modules/autoApproval.ts
var autoApproval_exports = {};
__export(autoApproval_exports, {
  autoInjectScript: () => autoInjectScript,
  getAutoApprovalScript: () => getAutoApprovalScript
});
async function autoInjectScript(extensionContext2) {
  try {
    const script = getAutoApprovalScript(extensionContext2);
    await vscode3.env.clipboard.writeText(script);
    log("INFO" /* INFO */, "\u{1F4CB} Auto-approval script copied to clipboard");
    try {
      await vscode3.commands.executeCommand("workbench.action.toggleDevTools");
      log("INFO" /* INFO */, "\u{1F6E0}\uFE0F Developer Tools toggled");
    } catch (error) {
      log("WARN" /* WARN */, "Could not toggle Developer Tools", getErrorMessage(error));
    }
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to copy script", getErrorMessage(error));
  }
}
function getAutoApprovalScript(extensionContext2) {
  try {
    const scriptPath = path.join(extensionContext2.extensionPath, "scripts", "auto-approval-script.js");
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    return scriptContent;
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to read auto-approval-script.js", getErrorMessage(error));
    return "// Error: Could not load auto-approval script";
  }
}
var vscode3, fs, path;
var init_autoApproval = __esm({
  "src/modules/autoApproval.ts"() {
    "use strict";
    vscode3 = __toESM(require("vscode"));
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    init_logging();
    init_types();
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode8 = __toESM(require("vscode"));
init_types();
init_logging();

// src/modules/taskManager.ts
async function getTasks(context) {
  return context.workspaceState.get("tasks", []);
}
async function saveTasks(context, tasks) {
  await context.workspaceState.update("tasks", tasks);
}
async function addTask(context, title, description = "", category = "other") {
  const tasks = await getTasks(context);
  const newTask = {
    id: Date.now().toString(),
    title,
    description,
    status: "pending",
    category,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  tasks.push(newTask);
  await saveTasks(context, tasks);
  return newTask;
}
async function updateTaskStatus(context, taskId, status) {
  const tasks = await getTasks(context);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await saveTasks(context, tasks);
  }
}
async function removeTask(context, taskId) {
  const tasks = await getTasks(context);
  const filtered = tasks.filter((t) => t.id !== taskId);
  await saveTasks(context, filtered);
}
async function clearCompletedTasks(context) {
  const tasks = await getTasks(context);
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const clearedCount = tasks.length - activeTasks.length;
  await saveTasks(context, activeTasks);
  return clearedCount;
}

// src/modules/portManager.ts
var vscode = __toESM(require("vscode"));
var http = __toESM(require("http"));
init_logging();
init_types();
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

// src/modules/server.ts
var server_exports = {};
__export(server_exports, {
  startServer: () => startServer,
  stopServer: () => stopServer
});
var vscode2 = __toESM(require("vscode"));
var http2 = __toESM(require("http"));
init_logging();
init_types();
var server;
function startServer(context, port, sendToAgent2) {
  server = http2.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }
    try {
      await handleRequest(req, res, context, port, sendToAgent2);
    } catch (error) {
      log("ERROR" /* ERROR */, "Request handler error", getErrorMessage(error));
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });
  server.listen(port, () => {
    log("INFO" /* INFO */, `\u2705 Server listening on port ${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      log("ERROR" /* ERROR */, `Port ${port} is already in use. Please change the port in settings.`);
    } else {
      log("ERROR" /* ERROR */, "Server error occurred", { error: error.message, code: error.code });
    }
  });
  context.subscriptions.push({
    dispose: () => {
      stopServer();
    }
  });
  return server;
}
function stopServer() {
  if (server) {
    log("INFO" /* INFO */, "Closing server");
    server.close();
    server = void 0;
  }
}
async function handleRequest(req, res, context, port, sendToAgent2) {
  const url = req.url || "/";
  const method = req.method || "GET";
  log("DEBUG" /* DEBUG */, `${method} ${url}`);
  if (url === "/help" || url === "/") {
    handleHelp(res, port);
  } else if (url === "/tasks" && method === "GET") {
    await handleGetTasks(res, context);
  } else if (url === "/tasks" && method === "POST") {
    await handleCreateTask(req, res, context);
  } else if (url.startsWith("/tasks/") && method === "PUT") {
    await handleUpdateTask(req, res, context, url);
  } else if (url.startsWith("/tasks/") && method === "DELETE") {
    await handleDeleteTask(res, context, url);
  } else if (url === "/feedback" && method === "POST") {
    await handleFeedback(req, res, sendToAgent2);
  } else if (url === "/restart-app" || url.startsWith("/restart-app?")) {
    await handleRestartApp(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found", message: `Unknown endpoint: ${method} ${url}` }));
  }
}
function handleHelp(res, port) {
  const helpText = `
AI Feedback Bridge - API Documentation
=======================================

Base URL: http://localhost:${port}

Endpoints:
----------

GET /
GET /help
    Returns this API documentation

GET /tasks
    List all workspace tasks
    Response: Array of task objects

POST /tasks
    Create a new task
    Body: {
        "title": "Task title",
        "description": "Optional description",
        "category": "bug|feature|improvement|documentation|testing|other"
    }
    Response: Created task object

PUT /tasks/:id
    Update a task status
    Body: {
        "status": "pending|in-progress|completed"
    }
    Response: { success: true }

DELETE /tasks/:id
    Delete a task
    Response: { success: true }

POST /feedback
    Send feedback to AI agent
    Body: {
        "message": "Feedback message",
        "context": { ... optional context ... }
    }
    Response: { success: true, message: "Feedback sent to AI Agent" }

POST /restart-app?delay=30
    Restart the Electron app (if applicable)
    Query params: delay (seconds, default 30)
    Response: { success: true, message: "App restart initiated" }

Examples:
---------

# List all tasks
curl http://localhost:${port}/tasks

# Create a task
curl -X POST http://localhost:${port}/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Fix bug", "category": "bug"}'

# Update task status
curl -X PUT http://localhost:${port}/tasks/12345 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "in-progress"}'

# Send feedback
curl -X POST http://localhost:${port}/feedback \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Please review this code"}'
`;
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(helpText);
}
async function handleGetTasks(res, context) {
  try {
    const tasks = await getTasks(context);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tasks, null, 2));
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to get tasks", getErrorMessage(error));
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to retrieve tasks" }));
  }
}
async function handleCreateTask(req, res, context) {
  const body = await readRequestBody(req);
  try {
    const data = JSON.parse(body);
    if (!data.title || typeof data.title !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: 'Missing or invalid "title" field' }));
      return;
    }
    const title = data.title.trim();
    const description = (data.description || "").trim();
    const category = data.category || "other";
    const task = await addTask(context, title, description, category);
    log("INFO" /* INFO */, "Task created via API", { taskId: task.id, title: task.title });
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(task, null, 2));
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON format" }));
    } else {
      log("ERROR" /* ERROR */, "Failed to create task", getErrorMessage(error));
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create task" }));
    }
  }
}
async function handleUpdateTask(req, res, context, url) {
  const taskId = url.split("/")[2];
  const body = await readRequestBody(req);
  try {
    const data = JSON.parse(body);
    if (!data.status || !["pending", "in-progress", "completed"].includes(data.status)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: 'Invalid or missing "status" field',
        valid: ["pending", "in-progress", "completed"]
      }));
      return;
    }
    await updateTaskStatus(context, taskId, data.status);
    log("INFO" /* INFO */, "Task updated via API", { taskId, status: data.status });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, taskId, status: data.status }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON format" }));
    } else {
      log("ERROR" /* ERROR */, "Failed to update task", getErrorMessage(error));
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to update task" }));
    }
  }
}
async function handleDeleteTask(res, context, url) {
  const taskId = url.split("/")[2];
  try {
    await removeTask(context, taskId);
    log("INFO" /* INFO */, "Task deleted via API", { taskId });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, taskId }));
  } catch (error) {
    log("ERROR" /* ERROR */, "Failed to delete task", getErrorMessage(error));
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to delete task" }));
  }
}
async function handleFeedback(req, res, sendToAgent2) {
  const body = await readRequestBody(req, 1024 * 1024);
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
    const success = await sendToAgent2(sanitizedMessage, feedback.context);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success,
      message: success ? "Feedback sent to AI Agent" : "Failed to send to AI Agent"
    }));
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    log("ERROR" /* ERROR */, "Error processing feedback", { error: errorMessage });
    if (error instanceof SyntaxError) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON format" }));
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: errorMessage }));
    }
  }
}
async function handleRestartApp(req, res) {
  const urlParts = (req.url || "").split("?");
  const queryParams = new URLSearchParams(urlParts[1] || "");
  const delaySeconds = parseInt(queryParams.get("delay") || "30", 10);
  log("INFO" /* INFO */, `Received restart request for Electron app (delay: ${delaySeconds}s)`);
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
      log("INFO" /* INFO */, "Killing Electron process...");
      try {
        await execAsync('pkill -f "electron.*Code/AI"');
      } catch (e) {
        log("INFO" /* INFO */, "Kill command completed (process may not have been running)");
      }
      log("INFO" /* INFO */, `Waiting ${delaySeconds} seconds before restart...`);
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1e3));
      const workspacePath = vscode2.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspacePath && workspacePath.includes("/AI")) {
        log("INFO" /* INFO */, `Restarting Electron app in: ${workspacePath}`);
        exec(`cd "${workspacePath}" && npm run dev > /dev/null 2>&1 &`);
        log("INFO" /* INFO */, "Electron app restart command sent");
      } else {
        log("WARN" /* WARN */, `Could not find workspace path: ${workspacePath}`);
      }
    } catch (error) {
      log("ERROR" /* ERROR */, "Restart error", getErrorMessage(error));
    }
  }, 100);
}
async function readRequestBody(req, maxSize = 10 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bodySize = 0;
    req.on("data", (chunk) => {
      bodySize += chunk.length;
      if (bodySize > maxSize) {
        reject(new Error(`Request body too large (max ${maxSize} bytes)`));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (error) => {
      reject(error);
    });
  });
}

// src/extension.ts
init_autoApproval();

// src/modules/settingsPanel.ts
var vscode4 = __toESM(require("vscode"));
init_types();
init_logging();
init_autoApproval();
var settingsPanel;
async function showSettingsPanel(context, currentPort2, getConfig2, updateConfig2, sendToAgent2, getSmartAutoContinueMessage2) {
  if (settingsPanel) {
    settingsPanel.reveal(vscode4.ViewColumn.One);
    const tasks2 = await getTasks(context);
    settingsPanel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, tasks2);
    return;
  }
  const panel = vscode4.window.createWebviewPanel(
    "aiFeedbackBridgeSettings",
    "AI Feedback Bridge Settings",
    vscode4.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  settingsPanel = panel;
  panel.onDidDispose(() => {
    settingsPanel = void 0;
  }, null, context.subscriptions);
  const config = getConfig2();
  const tasks = await getTasks(context);
  panel.webview.html = await getSettingsHtml(config, currentPort2, tasks);
  panel.webview.onDidReceiveMessage(
    async (message) => {
      await handleWebviewMessage(
        message,
        panel,
        context,
        currentPort2,
        getConfig2,
        updateConfig2,
        sendToAgent2,
        getSmartAutoContinueMessage2
      );
    },
    void 0,
    context.subscriptions
  );
}
async function handleWebviewMessage(message, panel, context, currentPort2, getConfig2, updateConfig2, sendToAgent2, getSmartAutoContinueMessage2) {
  switch (message.command) {
    case "updateSetting":
      await updateConfig2(message.key, message.value);
      log("INFO" /* INFO */, `Setting updated: ${message.key} = ${message.value}`);
      break;
    case "reload":
      const reloadTasks = await getTasks(context);
      panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, reloadTasks);
      break;
    case "runNow":
      await handleRunNow(context, sendToAgent2, getSmartAutoContinueMessage2);
      break;
    case "injectScript":
      autoInjectScript(context);
      break;
    case "sendInstructions":
      await handleSendInstructions(currentPort2, sendToAgent2);
      break;
    case "saveNewTask":
      await handleSaveNewTask(message, panel, context, currentPort2, getConfig2);
      break;
    case "updateTaskField":
      await handleUpdateTaskField(message, panel, context, currentPort2, getConfig2);
      break;
    case "updateTaskStatus":
      await handleUpdateTaskStatus(message, panel, context, currentPort2, getConfig2);
      break;
    case "createTask":
      await handleCreateTask2(panel, context, currentPort2, getConfig2);
      break;
    case "openTaskManager":
      await vscode4.commands.executeCommand("ai-feedback-bridge.listTasks");
      break;
    case "clearCompleted":
      await handleClearCompleted(panel, context, currentPort2, getConfig2);
      break;
  }
}
async function handleRunNow(context, sendToAgent2, getSmartAutoContinueMessage2) {
  try {
    const message = await getSmartAutoContinueMessage2(context, true);
    if (message) {
      await sendToAgent2(message, {
        source: "manual_trigger",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      log("INFO" /* INFO */, "[Run Now] Manually triggered all enabled reminders");
    } else {
      vscode4.window.showInformationMessage("No enabled categories (check settings)");
    }
  } catch (error) {
    log("ERROR" /* ERROR */, "[Run Now] Failed to send message", {
      error: getErrorMessage(error)
    });
    vscode4.window.showErrorMessage("Failed to send reminders");
  }
}
async function handleSendInstructions(currentPort2, sendToAgent2) {
  try {
    const instructions = "\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:" + currentPort2 + '/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port ' + currentPort2 + '\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:' + currentPort2 + '/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:' + currentPort2 + "/help";
    await sendToAgent2(instructions, {
      source: "instructions",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    vscode4.window.showErrorMessage("Failed to send instructions");
  }
}
async function handleSaveNewTask(message, panel, context, currentPort2, getConfig2) {
  try {
    await addTask(context, message.title, message.description, message.category);
    const createdTasks = await getTasks(context);
    panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, createdTasks);
  } catch (error) {
    vscode4.window.showErrorMessage(`Failed to create task: ${getErrorMessage(error)}`);
  }
}
async function handleUpdateTaskField(message, panel, context, currentPort2, getConfig2) {
  try {
    const allTasks = await getTasks(context);
    const task = allTasks.find((t) => t.id === message.taskId);
    if (task) {
      if (message.field === "title") {
        task.title = message.value;
      } else if (message.field === "description") {
        task.description = message.value;
      }
      task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await saveTasks(context, allTasks);
      const updatedTasks = await getTasks(context);
      panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, updatedTasks);
    }
  } catch (error) {
    vscode4.window.showErrorMessage(`Failed to update task: ${getErrorMessage(error)}`);
  }
}
async function handleUpdateTaskStatus(message, panel, context, currentPort2, getConfig2) {
  try {
    await updateTaskStatus(context, message.taskId, message.status);
    const statusTasks = await getTasks(context);
    panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, statusTasks);
  } catch (error) {
    vscode4.window.showErrorMessage(`Failed to update status: ${getErrorMessage(error)}`);
  }
}
async function handleCreateTask2(panel, context, currentPort2, getConfig2) {
  await vscode4.commands.executeCommand("ai-feedback-bridge.addTask");
  const taskListAfterCreate = await getTasks(context);
  panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, taskListAfterCreate);
}
async function handleClearCompleted(panel, context, currentPort2, getConfig2) {
  try {
    const clearedCount = await clearCompletedTasks(context);
    const remainingTasks = await getTasks(context);
    panel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, remainingTasks);
    log("DEBUG" /* DEBUG */, `Cleared ${clearedCount} completed tasks`);
  } catch (error) {
    vscode4.window.showErrorMessage(`Failed to clear completed tasks: ${getErrorMessage(error)}`);
  }
}
async function getSettingsHtml(config, actualPort, tasks) {
  const categories = [
    { key: "tasks", icon: "\u{1F4CB}", name: "Tasks", interval: 300 },
    { key: "improvements", icon: "\u2728", name: "Improvements", interval: 600 },
    { key: "coverage", icon: "\u{1F9EA}", name: "Coverage", interval: 900 },
    { key: "robustness", icon: "\u{1F6E1}\uFE0F", name: "Robustness", interval: 600 },
    { key: "cleanup", icon: "\u{1F9F9}", name: "Cleanup", interval: 1200 },
    { key: "commits", icon: "\u{1F4BE}", name: "Commits", interval: 900 }
  ];
  const autoContinueEnabled = config.get("autoContinue.enabled", false);
  const autoApprovalEnabled = config.get("autoApproval.enabled", true);
  const autoInjectEnabled = config.get("autoApproval.autoInject", false);
  let categoriesRows = "";
  for (const cat of categories) {
    const enabled = config.get(`autoContinue.${cat.key}.enabled`, true);
    const interval = config.get(`autoContinue.${cat.key}.interval`, cat.interval);
    const message = config.get(`autoContinue.${cat.key}.message`, "");
    categoriesRows += `
			<tr class="${enabled ? "" : "disabled"}">
				<td class="cat-icon">${cat.icon}</td>
				<td class="cat-name">${cat.name}</td>
				<td class="cat-message">
					<input type="text" value="${message}" data-key="autoContinue.${cat.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${enabled ? "" : "disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${interval}" data-key="autoContinue.${cat.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${enabled ? "" : "disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${cat.key}.enabled" ${enabled ? "checked" : ""} 
					       class="toggle-cb" id="cb-${cat.key}" data-auto-approved="skip">
					<label for="cb-${cat.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`;
  }
  const activeTasks = tasks.filter((t) => t.status !== "completed").reverse();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const taskSectionHtml = activeTasks.length === 0 ? `
		<div class="row">
			<label style="color: var(--vscode-descriptionForeground); font-style: italic;">No active tasks for this workspace</label>
			<button onclick="createTask()">Add Task</button>
		</div>
		${completedCount > 0 ? `
		<div class="row" style="margin-top: 8px;">
			<label style="font-size: 12px; color: var(--vscode-descriptionForeground);">${completedCount} completed task${completedCount > 1 ? "s" : ""}</label>
			<button onclick="clearCompleted()">Clear Completed</button>
		</div>
		` : ""}
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
				${activeTasks.map((t) => {
    const statusIcon = t.status === "pending" ? "\u23F3" : t.status === "in-progress" ? "\u{1F504}" : "\u2705";
    const statusText = t.status === "pending" ? "Pending" : t.status === "in-progress" ? "In Progress" : "Completed";
    const statusColor = t.status === "pending" ? "#cca700" : t.status === "in-progress" ? "#3794ff" : "#89d185";
    return `
					<tr>
						<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${t.id}', '${t.status}')" title="Click to cycle status">${statusIcon}</td>
						<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${t.id}', 'title')">${t.title}</td>
						<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${t.id}', 'description')">${t.description || '<span style="opacity: 0.5;">(click to add description)</span>'}</td>
						<td style="font-size: 12px; opacity: 0.7;">${t.category}</td>
						<td style="color: ${statusColor}; font-size: 12px;">${statusText}</td>
					</tr>
				`;
  }).join("")}
			</tbody>
		</table>
		<div class="row" style="margin-top: 8px;">
			<button onclick="createTask()">Add Task</button>
			<button onclick="openTaskManager()">Manage Tasks</button>
			${completedCount > 0 ? `<button onclick="clearCompleted()">Clear Completed (${completedCount})</button>` : ""}
		</div>
	`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Settings</title>
	<style>
		${getSettingsStyles()}
	</style>
</head>
<body>
	<div class="header">
		<h1>\u{1F309} AI Feedback Bridge</h1>
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
				<input type="checkbox" data-key="autoApproval.enabled" ${autoApprovalEnabled ? "checked" : ""} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${autoInjectEnabled ? "checked" : ""} 
				       class="toggle-cb" id="cb-autoinject" ${autoApprovalEnabled ? "" : "disabled"} data-auto-approved="skip">
				<label for="cb-autoinject" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${autoContinueEnabled ? "checked" : ""} 
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
		${taskSectionHtml}
	</div>
	
	<script>
		${getSettingsScript()}
	</script>
</body>
</html>`;
}
function getSettingsStyles() {
  return `
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
	`;
}
function getSettingsScript() {
  return `
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
						const messageInput = row.querySelector('input[type="text"]');
						if (messageInput) messageInput.disabled = !value;
						const intervalInput = row.querySelector('input[type="number"]');
						if (intervalInput) intervalInput.disabled = !value;
					}
				}
				
				// Handle auto-approval enabled toggle
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
			
			if (document.getElementById('new-task-row')) {
				return;
			}
			
			const newRow = document.createElement('tr');
			newRow.id = 'new-task-row';
			newRow.style.opacity = '0.7';
			newRow.innerHTML = \`
				<td>\u23F3</td>
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
	`;
}
async function refreshSettingsPanel(context, getConfig2, currentPort2) {
  if (settingsPanel) {
    const tasks = await getTasks(context);
    settingsPanel.webview.html = await getSettingsHtml(getConfig2(), currentPort2, tasks);
    log("DEBUG" /* DEBUG */, "Settings panel refreshed");
  }
}

// src/modules/chatIntegration.ts
var vscode5 = __toESM(require("vscode"));
init_types();
init_logging();
var chatParticipant;
var outputChannel2;
function initChat(channel) {
  outputChannel2 = channel;
}
function createChatParticipant(context) {
  chatParticipant = vscode5.chat.createChatParticipant(
    "ai-agent-feedback-bridge.agent",
    handleChatRequest
  );
  chatParticipant.iconPath = vscode5.Uri.file(context.asAbsolutePath("icon.png"));
  context.subscriptions.push(chatParticipant);
  log("INFO" /* INFO */, "Chat participant registered");
  return chatParticipant;
}
async function handleChatRequest(request, context, stream, token) {
  outputChannel2.appendLine(`Chat request received: ${request.prompt}`);
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
    const [model] = await vscode5.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
    if (model) {
      const messages = [
        vscode5.LanguageModelChatMessage.User(request.prompt)
      ];
      const response = await model.sendRequest(messages, {}, token);
      for await (const fragment of response.text) {
        stream.markdown(fragment);
      }
    }
  } catch (err) {
    if (err instanceof vscode5.LanguageModelError) {
      outputChannel2.appendLine(`Language model error: ${err.message}`);
      stream.markdown(`\u26A0\uFE0F Error: ${err.message}

`);
    }
  }
  return { metadata: { command: "process-feedback" } };
}
function formatFeedbackMessage(feedbackMessage, appContext) {
  const context = appContext || {
    source: "unknown",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  let fullMessage = `# \u{1F916} AI DEV MODE

`;
  fullMessage += `**User Feedback:**
${feedbackMessage}

`;
  const contextKeys = Object.keys(context).filter((k) => k !== "source" && k !== "timestamp");
  if (contextKeys.length > 0) {
    fullMessage += `**Context:**
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

`;
  }
  fullMessage += `**Instructions:**
`;
  fullMessage += `Analyze feedback, take appropriate action:
`;
  fullMessage += `\u2022 If a bug \u2192 find and fix root cause
`;
  fullMessage += `\u2022 If a feature \u2192 draft implementation plan
`;
  fullMessage += `\u2022 Apply and commit changes
`;
  return fullMessage;
}
async function sendToAgent(feedbackMessage, appContext) {
  try {
    const fullMessage = formatFeedbackMessage(feedbackMessage, appContext);
    outputChannel2.appendLine("Processing feedback through AI agent...");
    outputChannel2.appendLine(fullMessage);
    try {
      const [model] = await vscode5.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
      if (model) {
        outputChannel2.appendLine("\u2705 AI Agent processing request...");
        await vscode5.commands.executeCommand("workbench.action.chat.open", {
          query: `@agent ${fullMessage}`
        });
        setTimeout(async () => {
          try {
            await vscode5.commands.executeCommand("workbench.action.chat.submit");
          } catch (e) {
            outputChannel2.appendLine("Note: Could not auto-submit. User can press Enter to submit.");
          }
        }, 300);
        log("INFO" /* INFO */, "Feedback sent to AI Agent");
        return true;
      }
    } catch (modelError) {
      outputChannel2.appendLine(`Could not access language model: ${getErrorMessage(modelError)}`);
    }
    await vscode5.env.clipboard.writeText(fullMessage);
    log("INFO" /* INFO */, "Feedback copied to clipboard");
    return true;
  } catch (error) {
    log("ERROR" /* ERROR */, `Error sending to agent: ${getErrorMessage(error)}`);
    return false;
  }
}
async function sendToCopilotChat(feedbackMessage, appContext) {
  return sendToAgent(feedbackMessage, appContext);
}
function disposeChat() {
  if (chatParticipant) {
    chatParticipant.dispose();
    chatParticipant = void 0;
    log("INFO" /* INFO */, "Chat participant disposed");
  }
}

// src/modules/autoContinue.ts
var vscode6 = __toESM(require("vscode"));
init_types();
init_logging();
var autoContinueTimer;
async function getSmartAutoContinueMessage(context, getConfig2, force = false) {
  const config = getConfig2();
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
    if (force || elapsed >= interval) {
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
function startAutoContinue(context, getConfig2, sendToAgent2) {
  const config = getConfig2();
  const enabled = config.get("autoContinue.enabled", false);
  if (enabled) {
    const checkInterval = 500;
    const workspaceName = vscode6.workspace.name || "No Workspace";
    log("INFO" /* INFO */, `\u2705 Auto-Continue enabled for window: ${workspaceName}`);
    autoContinueTimer = setInterval(async () => {
      try {
        const currentConfig = getConfig2();
        const stillEnabled = currentConfig.get("autoContinue.enabled", false);
        if (!stillEnabled) {
          log("INFO" /* INFO */, "[Auto-Continue] Detected disabled state, stopping timer");
          if (autoContinueTimer) {
            clearInterval(autoContinueTimer);
            autoContinueTimer = void 0;
          }
          return;
        }
        const message = await getSmartAutoContinueMessage(context, getConfig2);
        if (message) {
          log("INFO" /* INFO */, "[Auto-Continue] Sending periodic reminder");
          await sendToAgent2(message, {
            source: "auto_continue",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (error) {
        log("ERROR" /* ERROR */, "[Auto-Continue] Failed to send message", {
          error: getErrorMessage(error)
        });
      }
    }, checkInterval);
  } else {
    log("DEBUG" /* DEBUG */, "Auto-Continue is disabled");
  }
}
function stopAutoContinue() {
  if (autoContinueTimer) {
    clearInterval(autoContinueTimer);
    autoContinueTimer = void 0;
    log("INFO" /* INFO */, "Auto-Continue timer stopped");
  }
}
function restartAutoContinue(context, getConfig2, sendToAgent2) {
  stopAutoContinue();
  startAutoContinue(context, getConfig2, sendToAgent2);
}

// src/modules/statusBar.ts
var vscode7 = __toESM(require("vscode"));
init_types();
init_logging();
var statusBarToggle;
var statusBarSettings;
var statusBarInject;
var currentPortRef = 3737;
function initializeStatusBar(context, currentPort2, config) {
  currentPortRef = currentPort2;
  statusBarSettings = vscode7.window.createStatusBarItem(vscode7.StatusBarAlignment.Right, 100);
  statusBarSettings.command = "ai-feedback-bridge.openSettings";
  statusBarSettings.show();
  context.subscriptions.push(statusBarSettings);
  statusBarToggle = vscode7.window.createStatusBarItem(vscode7.StatusBarAlignment.Right, 99);
  statusBarToggle.command = "ai-feedback-bridge.toggleAutoContinue";
  statusBarToggle.show();
  context.subscriptions.push(statusBarToggle);
  statusBarInject = vscode7.window.createStatusBarItem(vscode7.StatusBarAlignment.Right, 98);
  statusBarInject.command = "ai-feedback-bridge.injectScript";
  statusBarInject.text = "$(clippy) Inject";
  statusBarInject.tooltip = "Copy auto-approval script to clipboard";
  statusBarInject.show();
  context.subscriptions.push(statusBarInject);
  updateStatusBar(config);
  log("INFO" /* INFO */, "Status bar items initialized");
}
function updateStatusBar(config) {
  if (!statusBarToggle || !statusBarSettings) {
    return;
  }
  const autoEnabled = config.get("autoContinue.enabled", false);
  statusBarSettings.text = `AI Dev: ${currentPortRef}`;
  statusBarSettings.tooltip = "Click to configure AI Feedback Bridge";
  if (autoEnabled) {
    statusBarToggle.text = "$(sync~spin) Stop AI Dev";
    statusBarToggle.tooltip = "Auto-Continue active\nClick to stop";
  } else {
    statusBarToggle.text = "$(play) Start AI Dev";
    statusBarToggle.tooltip = "Auto-Continue inactive\nClick to start";
  }
}

// src/extension.ts
var outputChannel3;
var currentPort = 3737;
var autoApprovalInterval;
var extensionContext;
function getConfig() {
  return vscode8.workspace.getConfiguration("aiFeedbackBridge");
}
async function updateConfig(key, value) {
  const config = getConfig();
  await config.update(key, value, vscode8.ConfigurationTarget.Workspace);
  log("DEBUG" /* DEBUG */, `Config updated: ${key} = ${value}`, {
    scope: "Workspace",
    newValue: config.get(key)
  });
}
async function activate(context) {
  extensionContext = context;
  outputChannel3 = vscode8.window.createOutputChannel("AI Agent Feedback");
  context.subscriptions.push(outputChannel3);
  initLogging(outputChannel3);
  initChat(outputChannel3);
  log("INFO" /* INFO */, "\u{1F680} AI Agent Feedback Bridge activated");
  const config = getConfig();
  const globalConfig = vscode8.workspace.getConfiguration("aiFeedbackBridge");
  const globalEnabled = globalConfig.inspect("autoContinue.enabled");
  if (globalEnabled?.globalValue !== void 0) {
    log("WARN" /* WARN */, "Detected old Global settings, clearing to use Workspace scope");
    await globalConfig.update("autoContinue.enabled", void 0, vscode8.ConfigurationTarget.Global);
  }
  const configuredPort = config.get("port");
  currentPort = await findAvailablePort(context);
  log("INFO" /* INFO */, `Auto-selected port: ${currentPort} for this window`);
  const workspaceName = vscode8.workspace.name || "No Workspace";
  const workspaceFolders = vscode8.workspace.workspaceFolders?.length || 0;
  log("INFO" /* INFO */, `Window context: ${workspaceName} (${workspaceFolders} folders)`);
  initializeStatusBar(context, currentPort, config);
  const openSettingsCmd = vscode8.commands.registerCommand("ai-feedback-bridge.openSettings", async () => {
    showSettingsPanel(
      context,
      currentPort,
      getConfig,
      updateConfig,
      sendToAgent,
      (ctx, force) => getSmartAutoContinueMessage(ctx, getConfig, force)
    );
  });
  context.subscriptions.push(openSettingsCmd);
  const runNowCmd = vscode8.commands.registerCommand("ai-feedback-bridge.runNow", async () => {
    try {
      const message = await getSmartAutoContinueMessage(context, getConfig, true);
      if (message) {
        log("INFO" /* INFO */, "[Run Now] Manually triggered all enabled reminders");
        await sendToAgent(message, {
          source: "manual_trigger",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        vscode8.window.showInformationMessage("No enabled categories (check settings)");
      }
    } catch (error) {
      log("ERROR" /* ERROR */, "[Run Now] Failed to send message", { error });
      vscode8.window.showErrorMessage("Failed to send reminders");
    }
  });
  context.subscriptions.push(runNowCmd);
  const injectScriptCmd = vscode8.commands.registerCommand("ai-feedback-bridge.injectScript", async () => {
    autoInjectScript(extensionContext);
  });
  context.subscriptions.push(injectScriptCmd);
  const getPortCmd = vscode8.commands.registerCommand("ai-feedback-bridge.getPort", () => {
    return currentPort;
  });
  context.subscriptions.push(getPortCmd);
  const addTaskCmd = vscode8.commands.registerCommand("ai-feedback-bridge.addTask", async () => {
    const title = await vscode8.window.showInputBox({ prompt: "Task title" });
    if (!title) {
      return;
    }
    const description = await vscode8.window.showInputBox({ prompt: "Task description (optional)" });
    const category = await vscode8.window.showQuickPick(
      ["bug", "feature", "improvement", "documentation", "testing", "other"],
      { placeHolder: "Select category" }
    );
    await addTask(context, title, description || "", category || "other");
    await refreshSettingsPanel(extensionContext, getConfig, currentPort);
  });
  context.subscriptions.push(addTaskCmd);
  const listTasksCmd = vscode8.commands.registerCommand("ai-feedback-bridge.listTasks", async () => {
    const tasks = await getTasks(context);
    if (tasks.length === 0) {
      vscode8.window.showInformationMessage("No tasks found");
      return;
    }
    const items = tasks.map((t) => ({
      label: `${t.status === "completed" ? "\u2705" : t.status === "in-progress" ? "\u{1F504}" : "\u23F3"} ${t.title}`,
      description: t.description,
      task: t
    }));
    const selected = await vscode8.window.showQuickPick(items, {
      placeHolder: "Select a task to update"
    });
    if (selected) {
      const action = await vscode8.window.showQuickPick(
        ["Mark as In Progress", "Mark as Completed", "Mark as Pending", "Delete"],
        { placeHolder: "What do you want to do?" }
      );
      if (action === "Delete") {
        await removeTask(context, selected.task.id);
      } else if (action === "Mark as In Progress") {
        await updateTaskStatus(context, selected.task.id, "in-progress");
      } else if (action === "Mark as Completed") {
        await updateTaskStatus(context, selected.task.id, "completed");
      } else if (action === "Mark as Pending") {
        await updateTaskStatus(context, selected.task.id, "pending");
      }
      await refreshSettingsPanel(extensionContext, getConfig, currentPort);
    }
  });
  context.subscriptions.push(listTasksCmd);
  startFeedbackServer(context);
  const disposable = vscode8.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat", async (feedbackText) => {
    if (!feedbackText) {
      feedbackText = await vscode8.window.showInputBox({
        prompt: "Enter feedback to send to Copilot Chat",
        placeHolder: "Describe the issue or request..."
      });
    }
    if (feedbackText) {
      await sendToCopilotChat(feedbackText, {
        source: "manual_command",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  context.subscriptions.push(disposable);
  const toggleAutoContinueCmd = vscode8.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue", async () => {
    const cfg = getConfig();
    const currentState = cfg.get("autoContinue.enabled", false);
    await updateConfig("autoContinue.enabled", !currentState);
    log("INFO" /* INFO */, `Auto-Continue ${!currentState ? "enabled" : "disabled"}`);
    refreshSettingsPanel(extensionContext, getConfig, currentPort);
  });
  context.subscriptions.push(toggleAutoContinueCmd);
  const changePortCmd = vscode8.commands.registerCommand("ai-feedback-bridge.changePort", async () => {
    const newPort = await vscode8.window.showInputBox({
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
      vscode8.commands.executeCommand("workbench.action.reloadWindow");
    }
  });
  context.subscriptions.push(changePortCmd);
  const showStatusCmd = vscode8.commands.registerCommand("ai-feedback-bridge.showStatus", () => {
    const cfg = getConfig();
    const autoInterval = cfg.get("autoContinue.interval", 300);
    const autoEnabled2 = cfg.get("autoContinue.enabled", false);
    const workspaceName2 = vscode8.workspace.name || "No Workspace";
    const msg = `\u{1F309} AI Feedback Bridge Status

Window: ${workspaceName2}
Port: ${currentPort}
Server: ${server_exports ? "Running \u2705" : "Stopped \u274C"}
Auto-Continue: ${autoEnabled2 ? `Enabled \u2705 (every ${autoInterval}s)` : "Disabled \u274C"}
Endpoint: http://localhost:${currentPort}`;
    outputChannel3.appendLine(msg);
    outputChannel3.show();
  });
  context.subscriptions.push(showStatusCmd);
  const autoEnabled = config.get("autoContinue.enabled", false);
  const inspectValue = config.inspect("autoContinue.enabled");
  log("INFO" /* INFO */, `[STARTUP] Auto-Continue check:`, {
    enabled: autoEnabled,
    defaultValue: inspectValue?.defaultValue,
    globalValue: inspectValue?.globalValue,
    workspaceValue: inspectValue?.workspaceValue,
    workspaceFolderValue: inspectValue?.workspaceFolderValue
  });
  if (autoEnabled) {
    startAutoContinue(context, getConfig, sendToAgent);
  } else {
    log("INFO" /* INFO */, "[STARTUP] Auto-Continue is disabled, not starting");
  }
  initializeAutoApproval();
  context.subscriptions.push(
    vscode8.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("aiFeedbackBridge")) {
        const cfg = getConfig();
        log("DEBUG" /* DEBUG */, "Configuration changed", {
          workspace: vscode8.workspace.name,
          affectedKeys: ["port", "autoContinue"].filter(
            (k) => e.affectsConfiguration(`aiFeedbackBridge.${k}`)
          )
        });
        if (e.affectsConfiguration("aiFeedbackBridge.port")) {
          const newPort = cfg.get("port", 3737);
          if (newPort !== currentPort) {
            log("INFO" /* INFO */, `Port change detected: ${currentPort} \u2192 ${newPort}. Reloading window...`);
            vscode8.commands.executeCommand("workbench.action.reloadWindow");
          }
        }
        updateStatusBar(cfg);
        if (e.affectsConfiguration("aiFeedbackBridge.autoContinue")) {
          restartAutoContinue(context, getConfig, sendToAgent);
        }
      }
    })
  );
  createChatParticipant(context);
  const enableAutoApprovalCommand = vscode8.commands.registerCommand(
    "ai-agent-feedback-bridge.enableAutoApproval",
    () => enableAutoApproval(context)
  );
  context.subscriptions.push(enableAutoApprovalCommand);
  const disableAutoApprovalCommand = vscode8.commands.registerCommand(
    "ai-agent-feedback-bridge.disableAutoApproval",
    () => disableAutoApproval()
  );
  context.subscriptions.push(disableAutoApprovalCommand);
  const injectAutoApprovalScriptCommand = vscode8.commands.registerCommand(
    "ai-agent-feedback-bridge.injectAutoApprovalScript",
    () => injectAutoApprovalScript()
  );
  context.subscriptions.push(injectAutoApprovalScriptCommand);
  log("INFO" /* INFO */, `Feedback server started on http://localhost:${currentPort}`);
}
function startFeedbackServer(context) {
  startServer(context, currentPort, sendToAgent);
}
function initializeAutoApproval() {
  const config = getConfig();
  const autoApprovalEnabled = config.get("autoApproval.enabled", true);
  const autoInjectEnabled = config.get("autoApproval.autoInject", false);
  if (autoApprovalEnabled) {
    log("INFO" /* INFO */, 'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.');
    if (autoInjectEnabled) {
      const inspect = config.inspect("autoApproval.autoInject");
      const workspaceHasValue = !!(inspect && (inspect.workspaceValue || inspect.workspaceFolderValue));
      if (!workspaceHasValue) {
        log("INFO" /* INFO */, "Skipping auto-inject because autoApproval.autoInject is not set at workspace scope.");
        log("INFO" /* INFO */, 'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');
        return;
      }
      log("INFO" /* INFO */, "Auto-inject enabled at workspace scope. Launching quick setup...");
      setTimeout(() => {
        autoInjectScript(extensionContext).catch((err) => {
          log("WARN" /* WARN */, "Auto-inject setup failed:", getErrorMessage(err));
        });
      }, 1e3);
    }
  }
}
function enableAutoApproval(context) {
  if (autoApprovalInterval) {
    outputChannel3.appendLine("Auto-approval is already enabled");
    return;
  }
  const config = getConfig();
  const intervalMs = config.get("autoApproval.intervalMs", 2e3);
  log("INFO" /* INFO */, `Enabling auto-approval with ${intervalMs}ms interval`);
  autoApprovalInterval = setInterval(async () => {
    try {
      await vscode8.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
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
    outputChannel3.appendLine("Auto-approval disabled");
    log("INFO" /* INFO */, "Auto-approval disabled");
  } else {
    log("INFO" /* INFO */, "Auto-approval is not currently enabled");
  }
}
function injectAutoApprovalScript() {
  const { getAutoApprovalScript: getAutoApprovalScript2 } = (init_autoApproval(), __toCommonJS(autoApproval_exports));
  const script = getAutoApprovalScript2(extensionContext);
  const panel = vscode8.window.createWebviewPanel(
    "autoApprovalScript",
    "Auto-Approval Script",
    vscode8.ViewColumn.One,
    {
      enableScripts: true
    }
  );
  panel.webview.html = getAutoApprovalInstructionsHtml(script);
  vscode8.env.clipboard.writeText(script);
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
  stopServer();
  log("INFO" /* INFO */, "HTTP server closed");
  stopAutoContinue();
  if (autoApprovalInterval) {
    clearInterval(autoApprovalInterval);
    autoApprovalInterval = void 0;
    log("INFO" /* INFO */, "Auto-approval interval cleared");
  }
  disposeChat();
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
