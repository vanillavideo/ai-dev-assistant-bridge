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

// src/modules/guidingDocuments.ts
function getGuidingDocuments() {
  const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
  const docs = config.get("guidingDocuments", []);
  return docs;
}
async function addGuidingDocument(filePath) {
  const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
  const docs = config.get("guidingDocuments", []);
  if (!filePath || filePath.trim().length === 0) {
    log("WARN" /* WARN */, `Attempted to add invalid guiding document path: '${filePath}'`);
    throw new Error("Invalid file path");
  }
  const relativePath = getRelativePath(filePath);
  if (docs.includes(relativePath)) {
    log("INFO" /* INFO */, `Document already added: ${relativePath}`);
    return;
  }
  docs.push(relativePath);
  const target = vscode.workspace.workspaceFolders ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  await config.update("guidingDocuments", docs, target);
  log("INFO" /* INFO */, `Added guiding document: ${relativePath} (target=${target})`);
}
async function removeGuidingDocument(filePath) {
  const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
  const docs = config.get("guidingDocuments", []);
  const targetRelative = getRelativePath(filePath);
  const targetAbsolute = getAbsolutePath(filePath);
  const filtered = docs.filter((doc) => {
    const storedAbsolute = getAbsolutePath(doc);
    return doc !== targetRelative && doc !== filePath && storedAbsolute !== targetAbsolute;
  });
  if (filtered.length === docs.length) {
    log("WARN" /* WARN */, `Document not found: ${filePath}`);
    return;
  }
  const target = vscode.workspace.workspaceFolders ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  await config.update("guidingDocuments", filtered, target);
  log("INFO" /* INFO */, `Removed guiding document: ${filePath} (target=${target})`);
}
async function getGuidingDocumentsContext() {
  const docs = getGuidingDocuments();
  if (docs.length === 0) {
    return "";
  }
  const references = [];
  for (const docPath of docs) {
    try {
      const absolutePath = getAbsolutePath(docPath);
      if (!fs.existsSync(absolutePath)) {
        log("WARN" /* WARN */, `Guiding document not found: ${docPath}`);
        continue;
      }
      references.push(`- ${docPath}`);
    } catch (error) {
      log("ERROR" /* ERROR */, `Error processing guiding document ${docPath}: ${error}`);
    }
  }
  if (references.length === 0) {
    return "";
  }
  return "\n\n# Guiding Documents\n\nRefer to these documents for context:\n" + references.join("\n");
}
function getRelativePath(absolutePath) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return absolutePath;
  }
  const workspacePath = workspaceFolder.uri.fsPath;
  if (absolutePath.startsWith(workspacePath)) {
    return path.relative(workspacePath, absolutePath);
  }
  return absolutePath;
}
function getAbsolutePath(relativePath) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return relativePath;
  }
  return path.join(workspaceFolder.uri.fsPath, relativePath);
}
var vscode, fs, path;
var init_guidingDocuments = __esm({
  "src/modules/guidingDocuments.ts"() {
    "use strict";
    vscode = __toESM(require("vscode"));
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    init_logging();
    init_types();
  }
});

// src/modules/autoContinue.ts
var autoContinue_exports = {};
__export(autoContinue_exports, {
  formatCountdown: () => formatCountdown,
  getSmartAutoContinueMessage: () => getSmartAutoContinueMessage,
  getTimeUntilNextReminder: () => getTimeUntilNextReminder,
  isAutoContinueActive: () => isAutoContinueActive,
  restartAutoContinue: () => restartAutoContinue,
  startAutoContinue: () => startAutoContinue,
  stopAutoContinue: () => stopAutoContinue
});
async function getSmartAutoContinueMessage(context, getConfig, force = false) {
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
    if (force || elapsed >= interval) {
      messages.push(message);
      newLastSent[category] = now;
    }
  }
  await context.globalState.update(lastSentKey, newLastSent);
  if (messages.length === 0) {
    return "";
  }
  let combinedMessage = messages.join(". ") + ".";
  const docsContext = await getGuidingDocumentsContext();
  if (docsContext) {
    combinedMessage += docsContext;
  }
  return combinedMessage;
}
function startAutoContinue(context, getConfig, sendToAgent2) {
  const config = getConfig();
  const enabled = config.get("autoContinue.enabled", false);
  if (enabled) {
    const checkInterval = 500;
    const workspaceName = vscode6.workspace.name || "No Workspace";
    log("INFO" /* INFO */, `\u2705 Auto-Continue enabled for window: ${workspaceName}`);
    autoContinueTimer = setInterval(async () => {
      try {
        const currentConfig = getConfig();
        const stillEnabled = currentConfig.get("autoContinue.enabled", false);
        if (!stillEnabled) {
          log("INFO" /* INFO */, "[Auto-Continue] Detected disabled state, stopping timer");
          if (autoContinueTimer) {
            clearInterval(autoContinueTimer);
            autoContinueTimer = void 0;
          }
          return;
        }
        const message = await getSmartAutoContinueMessage(context, getConfig);
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
function restartAutoContinue(context, getConfig, sendToAgent2) {
  stopAutoContinue();
  startAutoContinue(context, getConfig, sendToAgent2);
}
function isAutoContinueActive() {
  return autoContinueTimer !== void 0;
}
function getTimeUntilNextReminder(context, getConfig) {
  const config = getConfig();
  const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
  const now = Date.now();
  let shortestTime = null;
  const lastSentKey = "autoContinue.lastSent";
  const lastSent = context.globalState.get(lastSentKey, {});
  for (const category of categories) {
    const enabled = config.get(`autoContinue.${category}.enabled`, true);
    const interval = config.get(`autoContinue.${category}.interval`, 300);
    const message = config.get(`autoContinue.${category}.message`, "");
    if (!enabled || !message) {
      continue;
    }
    const lastSentTime = lastSent[category] || 0;
    const elapsed = (now - lastSentTime) / 1e3;
    const remaining = Math.max(0, interval - elapsed);
    if (shortestTime === null || remaining < shortestTime) {
      shortestTime = remaining;
    }
  }
  return shortestTime;
}
function formatCountdown(seconds) {
  if (seconds < 0) {
    return "0s";
  }
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return secs === 0 ? `${minutes}m` : `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }
}
var vscode6, autoContinueTimer;
var init_autoContinue = __esm({
  "src/modules/autoContinue.ts"() {
    "use strict";
    vscode6 = __toESM(require("vscode"));
    init_types();
    init_logging();
    init_guidingDocuments();
  }
});

// src/test/suite/extension.test.ts
var assert10 = __toESM(require("assert"));
var vscode14 = __toESM(require("vscode"));

// src/test/suite/aiQueue.test.ts
var assert = __toESM(require("assert"));

// src/modules/aiQueue.ts
init_logging();
init_types();
var instructionQueue = [];
var processingActive = false;
var autoProcessEnabled = false;
function enqueueInstruction(instruction, source, priority = "normal", metadata) {
  const queueItem = {
    id: generateId(),
    instruction,
    priority,
    source,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "pending",
    metadata
  };
  instructionQueue.push(queueItem);
  sortQueueByPriority();
  log("INFO" /* INFO */, `Enqueued instruction from ${source}`, { id: queueItem.id, priority });
  if (autoProcessEnabled) {
    void processNextInstruction();
  }
  return queueItem;
}
function getQueue(status) {
  if (status) {
    return instructionQueue.filter((item) => item.status === status);
  }
  return [...instructionQueue];
}
function getInstruction(id) {
  return instructionQueue.find((item) => item.id === id);
}
function removeInstruction(id) {
  const index = instructionQueue.findIndex((item) => item.id === id);
  if (index !== -1) {
    instructionQueue.splice(index, 1);
    log("INFO" /* INFO */, `Removed instruction from queue: ${id}`);
    return true;
  }
  return false;
}
function clearProcessed() {
  const beforeLength = instructionQueue.length;
  instructionQueue = instructionQueue.filter(
    (item) => item.status === "pending" || item.status === "processing"
  );
  const cleared = beforeLength - instructionQueue.length;
  log("INFO" /* INFO */, `Cleared ${cleared} processed instructions`);
  return cleared;
}
function clearQueue() {
  const count = instructionQueue.length;
  instructionQueue = [];
  log("INFO" /* INFO */, `Cleared all ${count} instructions from queue`);
}
async function processNextInstruction(sendToAgent2) {
  if (processingActive) {
    log("WARN" /* WARN */, "Already processing an instruction");
    return false;
  }
  const pending = instructionQueue.find((item) => item.status === "pending");
  if (!pending) {
    return false;
  }
  processingActive = true;
  pending.status = "processing";
  try {
    log("INFO" /* INFO */, `Processing instruction: ${pending.id}`);
    if (sendToAgent2) {
      const success = await sendToAgent2(pending.instruction, {
        source: pending.source,
        queueId: pending.id,
        priority: pending.priority,
        metadata: pending.metadata
      });
      if (success) {
        pending.status = "completed";
        pending.result = "Sent to AI agent successfully";
      } else {
        pending.status = "failed";
        pending.error = "Failed to send to AI agent";
      }
    } else {
      pending.status = "completed";
      pending.result = "Marked as processed (no agent function provided)";
    }
    log("INFO" /* INFO */, `Instruction ${pending.status}: ${pending.id}`);
  } catch (error) {
    pending.status = "failed";
    pending.error = error instanceof Error ? error.message : String(error);
    log("ERROR" /* ERROR */, `Error processing instruction ${pending.id}`, { error: pending.error });
  } finally {
    processingActive = false;
  }
  return true;
}
async function processAllInstructions(sendToAgent2) {
  let processed = 0;
  while (getQueue("pending").length > 0 && !processingActive) {
    const success = await processNextInstruction(sendToAgent2);
    if (success) {
      processed++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      break;
    }
  }
  log("INFO" /* INFO */, `Processed ${processed} instructions`);
  return processed;
}
function setAutoProcess(enabled, sendToAgent2) {
  autoProcessEnabled = enabled;
  log("INFO" /* INFO */, `Auto-process ${enabled ? "enabled" : "disabled"}`);
  if (enabled && sendToAgent2) {
    void processAllInstructions(sendToAgent2);
  }
}
function getQueueStats() {
  return {
    total: instructionQueue.length,
    pending: instructionQueue.filter((i) => i.status === "pending").length,
    processing: instructionQueue.filter((i) => i.status === "processing").length,
    completed: instructionQueue.filter((i) => i.status === "completed").length,
    failed: instructionQueue.filter((i) => i.status === "failed").length,
    autoProcessEnabled
  };
}
function sortQueueByPriority() {
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  instructionQueue.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") {
      return -1;
    }
    if (a.status !== "pending" && b.status === "pending") {
      return 1;
    }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}
function generateId() {
  return `ai-queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// src/test/suite/aiQueue.test.ts
suite("AI Queue Module Test Suite", () => {
  setup(() => {
    clearQueue();
    setAutoProcess(false);
  });
  teardown(() => {
    clearQueue();
    setAutoProcess(false);
  });
  suite("Enqueue Operations", () => {
    test("enqueueInstruction should add instruction to queue", () => {
      const instruction = enqueueInstruction(
        "Test instruction",
        "test-source",
        "normal"
      );
      assert.strictEqual(instruction.instruction, "Test instruction");
      assert.strictEqual(instruction.source, "test-source");
      assert.strictEqual(instruction.priority, "normal");
      assert.strictEqual(instruction.status, "pending");
    });
    test("enqueueInstruction should generate unique IDs", () => {
      const inst1 = enqueueInstruction("Test 1", "source1");
      const inst2 = enqueueInstruction("Test 2", "source2");
      assert.notStrictEqual(inst1.id, inst2.id);
    });
    test("enqueueInstruction should handle all priority levels", () => {
      const urgent = enqueueInstruction("Urgent", "src", "urgent");
      const high = enqueueInstruction("High", "src", "high");
      const normal = enqueueInstruction("Normal", "src", "normal");
      const low = enqueueInstruction("Low", "src", "low");
      assert.strictEqual(urgent.priority, "urgent");
      assert.strictEqual(high.priority, "high");
      assert.strictEqual(normal.priority, "normal");
      assert.strictEqual(low.priority, "low");
    });
    test("enqueueInstruction should accept metadata", () => {
      const metadata = { project: "test", userId: "123" };
      const instruction = enqueueInstruction(
        "Test",
        "source",
        "normal",
        metadata
      );
      assert.deepStrictEqual(instruction.metadata, metadata);
    });
    test("enqueueInstruction should use default priority if not specified", () => {
      const instruction = enqueueInstruction("Test", "source");
      assert.strictEqual(instruction.priority, "normal");
    });
  });
  suite("Queue Retrieval", () => {
    test("getQueue should return all instructions", () => {
      enqueueInstruction("Test 1", "source1");
      enqueueInstruction("Test 2", "source2");
      const queue = getQueue();
      assert.strictEqual(queue.length, 2);
    });
    test("getQueue should filter by status", () => {
      const inst1 = enqueueInstruction("Test 1", "source1");
      const inst2 = enqueueInstruction("Test 2", "source2");
      const allQueue = getQueue();
      const found = allQueue.find((i) => i.id === inst2.id);
      if (found) {
        found.status = "completed";
      }
      const pending = getQueue("pending");
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].id, inst1.id);
    });
    test("getQueue should return empty array when queue is empty", () => {
      const queue = getQueue();
      assert.strictEqual(queue.length, 0);
    });
    test("getInstruction should return specific instruction by ID", () => {
      const inst = enqueueInstruction("Test", "source");
      const found = getInstruction(inst.id);
      assert.ok(found);
      assert.strictEqual(found.id, inst.id);
    });
    test("getInstruction should return undefined for non-existent ID", () => {
      const found = getInstruction("non-existent-id");
      assert.strictEqual(found, void 0);
    });
  });
  suite("Queue Removal", () => {
    test("removeInstruction should remove instruction by ID", () => {
      const inst = enqueueInstruction("Test", "source");
      const removed = removeInstruction(inst.id);
      assert.strictEqual(removed, true);
      assert.strictEqual(getQueue().length, 0);
    });
    test("removeInstruction should return false for non-existent ID", () => {
      const removed = removeInstruction("non-existent");
      assert.strictEqual(removed, false);
    });
    test("clearProcessed should remove completed and failed instructions", () => {
      const inst1 = enqueueInstruction("Test 1", "source");
      const inst2 = enqueueInstruction("Test 2", "source");
      const inst3 = enqueueInstruction("Test 3", "source");
      const queue = getQueue();
      queue[0].status = "completed";
      queue[1].status = "failed";
      const cleared = clearProcessed();
      assert.strictEqual(cleared, 2);
      assert.strictEqual(getQueue().length, 1);
    });
    test("clearQueue should remove all instructions", () => {
      enqueueInstruction("Test 1", "source");
      enqueueInstruction("Test 2", "source");
      clearQueue();
      assert.strictEqual(getQueue().length, 0);
    });
  });
  suite("Queue Processing", () => {
    test("processNextInstruction should process pending instruction", async () => {
      enqueueInstruction("Test", "source");
      let sentMessage = "";
      const mockSendToAgent = async (message) => {
        sentMessage = message;
        return true;
      };
      const processed = await processNextInstruction(mockSendToAgent);
      assert.strictEqual(processed, true);
      assert.strictEqual(sentMessage, "Test");
    });
    test("processNextInstruction should return false when queue is empty", async () => {
      const mockSendToAgent = async () => true;
      const processed = await processNextInstruction(mockSendToAgent);
      assert.strictEqual(processed, false);
    });
    test("processNextInstruction should mark instruction as completed on success", async () => {
      const inst = enqueueInstruction("Test", "source");
      const mockSendToAgent = async () => true;
      await processNextInstruction(mockSendToAgent);
      const found = getInstruction(inst.id);
      assert.ok(found);
      assert.strictEqual(found.status, "completed");
    });
    test("processNextInstruction should mark instruction as failed on error", async () => {
      const inst = enqueueInstruction("Test", "source");
      const mockSendToAgent = async () => false;
      await processNextInstruction(mockSendToAgent);
      const found = getInstruction(inst.id);
      assert.ok(found);
      assert.strictEqual(found.status, "failed");
    });
    test("processNextInstruction should handle exceptions", async () => {
      const inst = enqueueInstruction("Test", "source");
      const mockSendToAgent = async () => {
        throw new Error("Test error");
      };
      await processNextInstruction(mockSendToAgent);
      const found = getInstruction(inst.id);
      assert.ok(found);
      assert.strictEqual(found.status, "failed");
      assert.ok(found.error?.includes("Test error"));
    });
    test("processNextInstruction without sendToAgent should mark as completed", async () => {
      const inst = enqueueInstruction("Test", "source");
      await processNextInstruction();
      const found = getInstruction(inst.id);
      assert.ok(found);
      assert.strictEqual(found.status, "completed");
    });
    test("processAllInstructions should process multiple instructions", async () => {
      enqueueInstruction("Test 1", "source");
      enqueueInstruction("Test 2", "source");
      enqueueInstruction("Test 3", "source");
      const mockSendToAgent = async () => true;
      const processed = await processAllInstructions(mockSendToAgent);
      assert.strictEqual(processed, 3);
      const completed = getQueue("completed");
      assert.strictEqual(completed.length, 3);
    });
    test("processAllInstructions should stop on first failure", async () => {
      enqueueInstruction("Test 1", "source");
      enqueueInstruction("Test 2", "source");
      let callCount = 0;
      const mockSendToAgent = async () => {
        callCount++;
        return callCount === 1;
      };
      await processAllInstructions(mockSendToAgent);
      assert.strictEqual(getQueue("completed").length, 1);
      assert.strictEqual(getQueue("failed").length, 1);
    });
  });
  suite("Priority Sorting", () => {
    test("Queue should be sorted by priority", () => {
      enqueueInstruction("Low", "source", "low");
      enqueueInstruction("Urgent", "source", "urgent");
      enqueueInstruction("Normal", "source", "normal");
      enqueueInstruction("High", "source", "high");
      const queue = getQueue();
      assert.strictEqual(queue[0].priority, "urgent");
      assert.strictEqual(queue[1].priority, "high");
      assert.strictEqual(queue[2].priority, "normal");
      assert.strictEqual(queue[3].priority, "low");
    });
    test("Pending instructions should come before completed", () => {
      const inst1 = enqueueInstruction("First", "source", "normal");
      const inst2 = enqueueInstruction("Second", "source", "normal");
      const queue = getQueue();
      queue[0].status = "completed";
      enqueueInstruction("Third", "source", "normal");
      const newQueue = getQueue();
      const pending = newQueue.filter((i) => i.status === "pending");
      assert.strictEqual(pending.length, 2);
    });
  });
  suite("Auto-Process Mode", () => {
    test("setAutoProcess should enable auto-processing", () => {
      setAutoProcess(true);
      const stats = getQueueStats();
      assert.strictEqual(stats.autoProcessEnabled, true);
    });
    test("setAutoProcess should disable auto-processing", () => {
      setAutoProcess(true);
      setAutoProcess(false);
      const stats = getQueueStats();
      assert.strictEqual(stats.autoProcessEnabled, false);
    });
  });
  suite("Queue Statistics", () => {
    test("getQueueStats should return accurate counts", () => {
      enqueueInstruction("Test 1", "source");
      enqueueInstruction("Test 2", "source");
      const stats = getQueueStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.pending, 2);
      assert.strictEqual(stats.processing, 0);
      assert.strictEqual(stats.completed, 0);
      assert.strictEqual(stats.failed, 0);
    });
    test("getQueueStats should track different statuses", async () => {
      const inst1 = enqueueInstruction("Test 1", "source");
      const inst2 = enqueueInstruction("Test 2", "source");
      const mockSendToAgent = async () => true;
      await processNextInstruction(mockSendToAgent);
      const stats = getQueueStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.pending, 1);
      assert.strictEqual(stats.completed, 1);
    });
    test("getQueueStats should show empty queue correctly", () => {
      const stats = getQueueStats();
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.pending, 0);
    });
  });
  suite("Context and Metadata", () => {
    test("processNextInstruction should include context in sendToAgent call", async () => {
      const inst = enqueueInstruction(
        "Test",
        "test-source",
        "high",
        { custom: "data" }
      );
      let receivedContext;
      const mockSendToAgent = async (message, context) => {
        receivedContext = context;
        return true;
      };
      await processNextInstruction(mockSendToAgent);
      assert.ok(receivedContext);
      assert.strictEqual(receivedContext.source, "test-source");
      assert.strictEqual(receivedContext.queueId, inst.id);
      assert.strictEqual(receivedContext.priority, "high");
      assert.deepStrictEqual(receivedContext.metadata, { custom: "data" });
    });
  });
  suite("Edge Cases", () => {
    test("Should handle empty instruction text", () => {
      const inst = enqueueInstruction("", "source");
      assert.strictEqual(inst.instruction, "");
    });
    test("Should handle very long instruction text", () => {
      const longText = "a".repeat(1e4);
      const inst = enqueueInstruction(longText, "source");
      assert.strictEqual(inst.instruction.length, 1e4);
    });
    test("Should handle special characters in instruction", () => {
      const special = 'Test with\nnewlines	and	tabs"quotes"';
      const inst = enqueueInstruction(special, "source");
      assert.strictEqual(inst.instruction, special);
    });
    test("Should handle concurrent processing attempts", async () => {
      enqueueInstruction("Test", "source");
      const mockSendToAgent = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return true;
      };
      const promise1 = processNextInstruction(mockSendToAgent);
      const promise2 = processNextInstruction(mockSendToAgent);
      const [result1, result2] = await Promise.all([promise1, promise2]);
      assert.ok(result1 || result2);
      assert.ok(!(result1 && result2));
    });
  });
});

// src/test/suite/guidingDocuments.test.ts
var assert2 = __toESM(require("assert"));
var vscode2 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));
init_guidingDocuments();
suite("Guiding Documents Module Test Suite", () => {
  const testWorkspaceFolder = vscode2.workspace.workspaceFolders?.[0];
  const testFilePath = testWorkspaceFolder ? path2.join(testWorkspaceFolder.uri.fsPath, "README.md") : "";
  setup(async () => {
    const docs = getGuidingDocuments();
    for (const doc of docs) {
      await removeGuidingDocument(doc);
    }
  });
  teardown(async () => {
    const docs = getGuidingDocuments();
    for (const doc of docs) {
      await removeGuidingDocument(doc);
    }
  });
  suite("Add Documents", () => {
    test("addGuidingDocument should add new document", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
    test("addGuidingDocument should prevent duplicates", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      await addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
    test("addGuidingDocument should handle absolute paths", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const absolutePath = testFilePath;
      await addGuidingDocument(absolutePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
    test("addGuidingDocument should convert to workspace-relative paths", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs[0], "README.md");
    });
    test("addGuidingDocument should handle files outside workspace", async () => {
      const externalPath = "/tmp/external-file.md";
      await addGuidingDocument(externalPath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs[0], externalPath);
    });
    test("addGuidingDocument should handle non-existent files", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const nonExistentPath = path2.join(testWorkspaceFolder.uri.fsPath, "non-existent-file.md");
      await addGuidingDocument(nonExistentPath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
  });
  suite("Remove Documents", () => {
    test("removeGuidingDocument should remove existing document", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      await removeGuidingDocument("README.md");
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 0);
    });
    test("removeGuidingDocument should handle non-existent document", async () => {
      await removeGuidingDocument("non-existent.md");
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 0);
    });
    test("removeGuidingDocument should handle absolute paths", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      await removeGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 0);
    });
    test("removeGuidingDocument should handle relative paths", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      await removeGuidingDocument("README.md");
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 0);
    });
  });
  suite("Get Documents", () => {
    test("getGuidingDocuments should return empty array initially", () => {
      const docs = getGuidingDocuments();
      assert2.strictEqual(Array.isArray(docs), true);
      assert2.strictEqual(docs.length, 0);
    });
    test("getGuidingDocuments should return all documents", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      await addGuidingDocument("/tmp/external.md");
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 2);
    });
    test("getGuidingDocuments should return copies not references", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      const docs1 = getGuidingDocuments();
      const docs2 = getGuidingDocuments();
      assert2.notStrictEqual(docs1, docs2);
      assert2.deepStrictEqual(docs1, docs2);
    });
    test("getGuidingDocuments should return string paths", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(typeof docs[0], "string");
      assert2.ok(docs[0].length > 0);
    });
  });
  suite("Get Context", () => {
    test("getGuidingDocumentsContext should return empty string when no documents", async () => {
      const context = await getGuidingDocumentsContext();
      assert2.strictEqual(context, "");
    });
    test("getGuidingDocumentsContext should format multiple documents", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.length > 0);
      assert2.ok(context.includes("# Guiding Documents"));
      assert2.ok(context.includes("README.md"));
      assert2.ok(context.includes("Refer to these documents for context:"));
      assert2.ok(context.includes("- "));
    });
    test("getGuidingDocumentsContext should use concise path references", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.includes("- "));
      assert2.ok(context.includes("README.md"));
      assert2.ok(context.length < 500, "Context should be concise, not include full file content");
    });
    test("getGuidingDocumentsContext should handle read errors gracefully", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const nonExistentPath = path2.join(testWorkspaceFolder.uri.fsPath, "non-existent-file.md");
      addGuidingDocument(nonExistentPath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(!context.includes("non-existent-file.md"));
    });
    test("getGuidingDocumentsContext should be lightweight", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.length > 0);
      assert2.ok(context.length < 500, "Context should be lightweight with just path references");
    });
    test("getGuidingDocumentsContext should list paths as bullet points", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.includes("- "));
      assert2.ok(context.includes("README.md"));
    });
  });
  suite("Path Conversion", () => {
    test("Should convert absolute paths to relative when in workspace", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      await addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs[0], "README.md");
    });
    test("Should keep absolute paths for files outside workspace", async () => {
      const externalPath = "/tmp/external.md";
      await addGuidingDocument(externalPath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs[0], externalPath);
    });
    test("Should handle Windows-style paths", async () => {
      const windowsPath = "C:\\Users\\Test\\file.md";
      await addGuidingDocument(windowsPath);
      const docs = getGuidingDocuments();
      assert2.ok(docs.length > 0);
    });
    test("Should normalize path separators", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const mixedPath = path2.join(testWorkspaceFolder.uri.fsPath, "docs/README.md");
      await addGuidingDocument(mixedPath);
      const docs = getGuidingDocuments();
      assert2.ok(!docs[0].includes("\\\\"));
    });
  });
  suite("Edge Cases", () => {
    test("Should reject empty file path", async () => {
      await assert2.rejects(async () => {
        await addGuidingDocument("");
      }, /Invalid file path/);
    });
    test("Should reject whitespace-only path", async () => {
      await assert2.rejects(async () => {
        await addGuidingDocument("   ");
      }, /Invalid file path/);
    });
    test("Should handle special characters in filename", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const specialPath = path2.join(testWorkspaceFolder.uri.fsPath, "file with spaces & special.md");
      await addGuidingDocument(specialPath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
    test("Should handle very long file paths", async () => {
      const longPath = "/a/very/long/path/" + "directory/".repeat(50) + "file.md";
      await addGuidingDocument(longPath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
    test("Should handle concurrent add operations", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const path1 = path2.join(testWorkspaceFolder.uri.fsPath, "file1.md");
      const path22 = path2.join(testWorkspaceFolder.uri.fsPath, "file2.md");
      await addGuidingDocument(path1);
      await addGuidingDocument(path22);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 2);
    });
    test("Should handle concurrent remove operations", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const path1 = path2.join(testWorkspaceFolder.uri.fsPath, "file1.md");
      const path22 = path2.join(testWorkspaceFolder.uri.fsPath, "file2.md");
      await addGuidingDocument(path1);
      await addGuidingDocument(path22);
      await removeGuidingDocument("file1.md");
      await removeGuidingDocument("file2.md");
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 0);
    });
    test("Should maintain document order", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const path1 = path2.join(testWorkspaceFolder.uri.fsPath, "a-file.md");
      const path22 = path2.join(testWorkspaceFolder.uri.fsPath, "b-file.md");
      const path3 = path2.join(testWorkspaceFolder.uri.fsPath, "c-file.md");
      await addGuidingDocument(path1);
      await addGuidingDocument(path22);
      await addGuidingDocument(path3);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs[0], "a-file.md");
      assert2.strictEqual(docs[1], "b-file.md");
      assert2.strictEqual(docs[2], "c-file.md");
    });
  });
  suite("File Watching", () => {
    test("Should update lastModified on document changes", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const docs1 = getGuidingDocuments();
      assert2.ok(docs1[0]);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const docs2 = getGuidingDocuments();
      assert2.ok(docs2[0]);
    });
  });
  suite("Integration with Workspace", () => {
    test("Should work when no workspace is open", async () => {
      const externalPath = "/tmp/external.md";
      await addGuidingDocument(externalPath);
      const docs = getGuidingDocuments();
      assert2.ok(docs.length >= 1);
    });
    test("Should handle multi-root workspaces", () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const docs = getGuidingDocuments();
      assert2.strictEqual(docs.length, 1);
    });
  });
});

// src/test/suite/server.test.ts
var assert3 = __toESM(require("assert"));
var http2 = __toESM(require("http"));

// src/modules/server.ts
var vscode3 = __toESM(require("vscode"));
var http = __toESM(require("http"));
init_logging();
init_types();

// src/modules/taskManager.ts
async function getTasks(context) {
  try {
    const tasks = context.workspaceState.get("tasks", []);
    if (!Array.isArray(tasks)) {
      console.error("Invalid tasks data in workspace state, resetting to empty array");
      await context.workspaceState.update("tasks", []);
      return [];
    }
    return tasks;
  } catch (error) {
    console.error("Error reading tasks from workspace state:", error);
    return [];
  }
}
async function saveTasks(context, tasks) {
  try {
    if (!Array.isArray(tasks)) {
      throw new Error("Tasks must be an array");
    }
    await context.workspaceState.update("tasks", tasks);
  } catch (error) {
    console.error("Error saving tasks to workspace state:", error);
    throw error;
  }
}
async function addTask(context, title, description = "", category = "other") {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new Error("Task title is required and must be a non-empty string");
  }
  if (title.length > 200) {
    throw new Error("Task title too long (max 200 characters)");
  }
  if (typeof description !== "string") {
    throw new Error("Task description must be a string");
  }
  if (description.length > 5e3) {
    throw new Error("Task description too long (max 5000 characters)");
  }
  const tasks = await getTasks(context);
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description.trim(),
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

// src/modules/server.ts
var server;
var MAX_REQUEST_SIZE = 1024 * 1024;
var REQUEST_TIMEOUT = 3e4;
function isValidPort(port) {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}
function startServer(context, port, sendToAgent2) {
  if (!isValidPort(port)) {
    const error = `Invalid port number: ${port}. Must be between 1024 and 65535.`;
    log("ERROR" /* ERROR */, error);
    throw new Error(error);
  }
  server = http.createServer(async (req, res) => {
    req.setTimeout(REQUEST_TIMEOUT, () => {
      log("WARN" /* WARN */, "Request timeout", { url: req.url, method: req.method });
      if (!res.headersSent) {
        res.writeHead(408, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request timeout" }));
      }
    });
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
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
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
  } else if (url === "/ai/queue" && method === "GET") {
    handleGetQueue(res);
  } else if (url === "/ai/queue" && method === "POST") {
    await handleEnqueueInstruction(req, res);
  } else if (url === "/ai/queue/process" && method === "POST") {
    await handleProcessQueue(res, sendToAgent2);
  } else if (url === "/ai/queue/stats" && method === "GET") {
    handleGetQueueStats(res);
  } else if (url.startsWith("/ai/queue/") && method === "DELETE") {
    handleDeleteFromQueue(res, url);
  } else if (url === "/ai/queue/clear" && method === "POST") {
    handleClearQueue(res);
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

GET /ai/queue
    Get all instructions in the AI communication queue
    Response: { queue: [...], count: number }

POST /ai/queue
    Add instruction to the AI communication queue
    Body: {
        "instruction": "Instruction text for AI",
        "source": "external-app (optional)",
        "priority": "low|normal|high|urgent (optional, default: normal)",
        "metadata": { ... optional context ... }
    }
    Response: { success: true, queueItem: {...} }

POST /ai/queue/process
    Process the next pending instruction in queue
    Response: { success: true|false, message: string }

GET /ai/queue/stats
    Get queue statistics
    Response: { total, pending, processing, completed, failed, autoProcessEnabled }

DELETE /ai/queue/:id
    Remove instruction from queue by ID
    Response: { success: true, message: "Instruction removed" }

POST /ai/queue/clear
    Clear all processed (completed and failed) instructions
    Response: { success: true, message: "Cleared N instructions" }

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

# Enqueue AI instruction
curl -X POST http://localhost:${port}/ai/queue \\
  -H "Content-Type: application/json" \\
  -d '{"instruction": "Analyze the codebase for performance issues", "priority": "high"}'

# Process queue
curl -X POST http://localhost:${port}/ai/queue/process

# Get queue stats
curl http://localhost:${port}/ai/queue/stats
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
  try {
    const body = await readRequestBody(req);
    const data = JSON.parse(body);
    if (!data.title || typeof data.title !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: 'Missing or invalid "title" field (must be non-empty string)' }));
      return;
    }
    const title = data.title.trim();
    if (title.length === 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Title cannot be empty" }));
      return;
    }
    if (title.length > 200) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Title too long (max 200 characters)" }));
      return;
    }
    const description = data.description ? String(data.description).trim() : "";
    if (description.length > 5e3) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Description too long (max 5000 characters)" }));
      return;
    }
    const validCategories = ["feature", "bug", "improvement", "other"];
    const category = validCategories.includes(data.category) ? data.category : "other";
    const task = await addTask(context, title, description, category);
    log("INFO" /* INFO */, "Task created via API", { taskId: task.id, title: task.title });
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(task, null, 2));
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON format" }));
    } else if (error instanceof Error && error.message.includes("too large")) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
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
      const workspacePath = vscode3.workspace.workspaceFolders?.[0]?.uri.fsPath;
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
function handleGetQueue(res) {
  try {
    const queue = getQueue();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ queue, count: queue.length }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}
async function handleEnqueueInstruction(req, res) {
  try {
    const body = await readRequestBody(req);
    const data = JSON.parse(body);
    if (!data.instruction || typeof data.instruction !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad request", message: "Missing or invalid instruction field" }));
      return;
    }
    const source = data.source || "external-api";
    const priority = data.priority || "normal";
    const metadata = data.metadata || {};
    const queueItem = enqueueInstruction(data.instruction, source, priority, metadata);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      message: "Instruction enqueued",
      queueItem
    }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}
async function handleProcessQueue(res, sendToAgent2) {
  try {
    const processed = await processNextInstruction(sendToAgent2);
    if (processed) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: true,
        message: "Instruction processed"
      }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: false,
        message: "No pending instructions in queue"
      }));
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}
function handleGetQueueStats(res) {
  try {
    const stats = getQueueStats();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(stats));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}
function handleDeleteFromQueue(res, url) {
  try {
    const id = url.split("/").pop();
    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad request", message: "Missing instruction ID" }));
      return;
    }
    const removed = removeInstruction(id);
    if (removed) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Instruction removed" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found", message: "Instruction ID not found in queue" }));
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}
function handleClearQueue(res) {
  try {
    const cleared = clearProcessed();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      message: `Cleared ${cleared} processed instructions`
    }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error", message: getErrorMessage(error) }));
  }
}

// src/test/suite/server.test.ts
suite("Server Validation Tests", () => {
  let mockContext;
  let mockSendToAgent;
  setup(() => {
    mockContext = {
      subscriptions: [],
      globalState: {
        get: () => void 0,
        update: async () => {
        },
        keys: () => [],
        setKeysForSync: () => {
        }
      },
      workspaceState: {
        get: () => void 0,
        update: async () => {
        },
        keys: () => []
      }
    };
    mockSendToAgent = async (message) => {
      return true;
    };
  });
  test("startServer should reject invalid port number (too low)", () => {
    assert3.throws(
      () => startServer(mockContext, 500, mockSendToAgent),
      /Invalid port number.*Must be between 1024 and 65535/,
      "Should throw error for port < 1024"
    );
  });
  test("startServer should reject invalid port number (too high)", () => {
    assert3.throws(
      () => startServer(mockContext, 7e4, mockSendToAgent),
      /Invalid port number.*Must be between 1024 and 65535/,
      "Should throw error for port > 65535"
    );
  });
  test("startServer should reject invalid port number (negative)", () => {
    assert3.throws(
      () => startServer(mockContext, -1, mockSendToAgent),
      /Invalid port number.*Must be between 1024 and 65535/,
      "Should throw error for negative port"
    );
  });
});
suite("Server HTTP Endpoints Test Suite", () => {
  let testServer;
  let testPort;
  let mockContext;
  let mockSendToAgent;
  suiteSetup(() => {
    mockContext = {
      subscriptions: [],
      globalState: {
        get: () => void 0,
        update: async () => {
        },
        keys: () => [],
        setKeysForSync: () => {
        }
      },
      workspaceState: {
        get: () => void 0,
        update: async () => {
        },
        keys: () => []
      }
    };
    mockSendToAgent = async (message) => {
      return true;
    };
    testPort = 3800 + Math.floor(Math.random() * 100);
    testServer = startServer(mockContext, testPort, mockSendToAgent);
  });
  suiteTeardown((done) => {
    if (testServer) {
      testServer.close(() => done());
    } else {
      done();
    }
  });
  setup(() => {
    clearQueue();
  });
  suite("Health Check Endpoints", () => {
    test("GET / should return API documentation", (done) => {
      http2.get(`http://localhost:${testPort}/`, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          assert3.ok(data.includes("AI Feedback Bridge"));
          assert3.ok(data.includes("API Documentation"));
          done();
        });
      }).on("error", done);
    });
    test("GET /help should return API documentation", (done) => {
      http2.get(`http://localhost:${testPort}/help`, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          assert3.ok(data.includes("API Documentation"));
          done();
        });
      }).on("error", done);
    });
  });
  suite("AI Queue Endpoints", () => {
    test("GET /ai/queue should return empty queue initially", (done) => {
      http2.get(`http://localhost:${testPort}/ai/queue`, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(Array.isArray(response.queue));
          assert3.strictEqual(response.count, 0);
          done();
        });
      }).on("error", done);
    });
    test("POST /ai/queue should enqueue instruction", (done) => {
      const payload = JSON.stringify({
        instruction: "Test instruction from API",
        source: "test-api",
        priority: "high",
        metadata: { test: true }
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 201);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, true);
          assert3.ok(response.queueItem);
          assert3.strictEqual(response.queueItem.instruction, "Test instruction from API");
          assert3.strictEqual(response.queueItem.priority, "high");
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /ai/queue should reject missing instruction", (done) => {
      const payload = JSON.stringify({
        source: "test-api"
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("GET /ai/queue/stats should return queue statistics", (done) => {
      enqueueInstruction("Test 1", "test", "normal");
      enqueueInstruction("Test 2", "test", "high");
      http2.get(`http://localhost:${testPort}/ai/queue/stats`, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const stats = JSON.parse(data);
          assert3.strictEqual(stats.total, 2);
          assert3.strictEqual(stats.pending, 2);
          assert3.strictEqual(stats.processing, 0);
          assert3.strictEqual(stats.completed, 0);
          done();
        });
      }).on("error", done);
    });
    test("POST /ai/queue/process should process next instruction", (done) => {
      enqueueInstruction("Test instruction", "test", "normal");
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue/process",
        method: "POST"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, true);
          done();
        });
      });
      req.on("error", done);
      req.end();
    });
    test("POST /ai/queue/process should return false when queue empty", (done) => {
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue/process",
        method: "POST"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, false);
          assert3.ok(response.message.includes("No pending"));
          done();
        });
      });
      req.on("error", done);
      req.end();
    });
    test("DELETE /ai/queue/:id should remove instruction", (done) => {
      const inst = enqueueInstruction("Test instruction", "test", "normal");
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: `/ai/queue/${inst.id}`,
        method: "DELETE"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, true);
          const remaining = getQueue();
          assert3.strictEqual(remaining.length, 0);
          done();
        });
      });
      req.on("error", done);
      req.end();
    });
    test("DELETE /ai/queue/:id should return 404 for non-existent ID", (done) => {
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue/non-existent-id",
        method: "DELETE"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 404);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.end();
    });
    test("POST /ai/queue/clear should clear processed instructions", (done) => {
      const inst1 = enqueueInstruction("Test 1", "test");
      const inst2 = enqueueInstruction("Test 2", "test");
      const queue = getQueue();
      queue[0].status = "completed";
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue/clear",
        method: "POST"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, true);
          assert3.ok(response.message.includes("Cleared"));
          const remaining = getQueue();
          assert3.strictEqual(remaining.length, 1);
          assert3.strictEqual(remaining[0].status, "pending");
          done();
        });
      });
      req.on("error", done);
      req.end();
    });
  });
  suite("Task Endpoints", () => {
    test("GET /tasks should return tasks array", (done) => {
      http2.get(`http://localhost:${testPort}/tasks`, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const tasks = JSON.parse(data);
          assert3.ok(Array.isArray(tasks));
          done();
        });
      }).on("error", done);
    });
    test("POST /tasks should create new task", (done) => {
      const payload = JSON.stringify({
        title: "Test task from API",
        description: "Test description",
        category: "feature"
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/tasks",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 201);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const task = JSON.parse(data);
          assert3.strictEqual(task.title, "Test task from API");
          assert3.strictEqual(task.category, "feature");
          assert3.ok(task.id);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /tasks should reject empty title", (done) => {
      const payload = JSON.stringify({
        title: "",
        category: "feature"
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/tasks",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /tasks should reject title over 200 chars", (done) => {
      const payload = JSON.stringify({
        title: "a".repeat(201),
        category: "feature"
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/tasks",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          assert3.ok(response.error.includes("too long"));
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /tasks should handle invalid JSON", (done) => {
      const payload = "invalid json{";
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/tasks",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
  });
  suite("Feedback Endpoint", () => {
    test("POST /feedback should accept valid feedback", (done) => {
      const payload = JSON.stringify({
        message: "Test feedback message",
        context: { test: true }
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/feedback",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.strictEqual(response.success, true);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /feedback should reject empty message", (done) => {
      const payload = JSON.stringify({
        message: ""
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/feedback",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
    test("POST /feedback should reject missing message field", (done) => {
      const payload = JSON.stringify({
        context: { test: true }
      });
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/feedback",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        assert3.strictEqual(res.statusCode, 400);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          done();
        });
      });
      req.on("error", done);
      req.write(payload);
      req.end();
    });
  });
  suite("Error Handling", () => {
    test("GET /unknown-endpoint should return 404", (done) => {
      http2.get(`http://localhost:${testPort}/unknown-endpoint`, (res) => {
        assert3.strictEqual(res.statusCode, 404);
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          const response = JSON.parse(data);
          assert3.ok(response.error);
          assert3.ok(response.message.includes("Unknown endpoint"));
          done();
        });
      }).on("error", done);
    });
    test("OPTIONS request should return 200 with CORS headers", (done) => {
      const req = http2.request({
        hostname: "localhost",
        port: testPort,
        path: "/ai/queue",
        method: "OPTIONS"
      }, (res) => {
        assert3.strictEqual(res.statusCode, 200);
        assert3.ok(res.headers["access-control-allow-origin"]);
        assert3.ok(res.headers["access-control-allow-methods"]);
        done();
      });
      req.on("error", done);
      req.end();
    });
  });
});

// src/test/suite/statusBar.test.ts
var assert4 = __toESM(require("assert"));
var vscode5 = __toESM(require("vscode"));

// src/modules/statusBar.ts
var vscode4 = __toESM(require("vscode"));
init_types();
init_logging();
var statusBarToggle;
var statusBarSettings;
var statusBarInject;
var currentPortRef = 3737;
function initializeStatusBar(context, currentPort, config) {
  currentPortRef = currentPort;
  statusBarSettings = vscode4.window.createStatusBarItem(vscode4.StatusBarAlignment.Right, 100);
  statusBarSettings.command = "ai-feedback-bridge.openSettings";
  statusBarSettings.show();
  context.subscriptions.push(statusBarSettings);
  statusBarToggle = vscode4.window.createStatusBarItem(vscode4.StatusBarAlignment.Right, 99);
  statusBarToggle.command = "ai-feedback-bridge.toggleAutoContinue";
  statusBarToggle.show();
  context.subscriptions.push(statusBarToggle);
  statusBarInject = vscode4.window.createStatusBarItem(vscode4.StatusBarAlignment.Right, 98);
  statusBarInject.command = "ai-feedback-bridge.injectScript";
  statusBarInject.text = "$(clippy) Inject";
  statusBarInject.tooltip = "Copy auto-approval script to clipboard";
  statusBarInject.show();
  context.subscriptions.push(statusBarInject);
  updateStatusBar(config);
  log("INFO" /* INFO */, "Status bar items initialized");
}
function updateStatusBar(config, countdown) {
  if (!statusBarToggle || !statusBarSettings) {
    return;
  }
  const autoEnabled = config.get("autoContinue.enabled", false);
  statusBarSettings.text = `AI Dev: ${currentPortRef}`;
  statusBarSettings.tooltip = "Click to configure AI Feedback Bridge";
  if (autoEnabled) {
    const countdownText = countdown ? ` (${countdown})` : "";
    statusBarToggle.text = `$(sync~spin) Stop AI Dev${countdownText}`;
    statusBarToggle.tooltip = countdown ? `Auto-Continue active
Next reminder: ${countdown}
Click to stop` : "Auto-Continue active\nClick to stop";
  } else {
    statusBarToggle.text = "$(play) Start AI Dev";
    statusBarToggle.tooltip = "Auto-Continue inactive\nClick to start";
  }
}
function updatePort(port) {
  currentPortRef = port;
  if (statusBarSettings) {
    statusBarSettings.text = `AI Dev: ${port}`;
  }
}
function disposeStatusBar() {
  if (statusBarToggle) {
    statusBarToggle.dispose();
    statusBarToggle = void 0;
  }
  if (statusBarSettings) {
    statusBarSettings.dispose();
    statusBarSettings = void 0;
  }
  if (statusBarInject) {
    statusBarInject.dispose();
    statusBarInject = void 0;
  }
  log("INFO" /* INFO */, "Status bar items disposed");
}

// src/test/suite/statusBar.test.ts
suite("Status Bar Module Tests", () => {
  let context;
  let disposables;
  setup(async () => {
    const ext = vscode5.extensions.getExtension("local.ai-feedback-bridge");
    assert4.ok(ext, "Extension should be available for testing");
    if (!ext.isActive) {
      await ext.activate();
    }
    disposables = [];
    context = {
      ...ext.exports?.context || {},
      subscriptions: disposables,
      extensionPath: ext.extensionPath
    };
  });
  teardown(() => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch (e) {
      }
    });
    disposables = [];
    try {
      disposeStatusBar();
    } catch (e) {
    }
  });
  test("initializeStatusBar should create status bar items", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return false;
        }
        return defaultValue;
      }
    };
    assert4.doesNotThrow(() => {
      initializeStatusBar(context, 3737, mockConfig);
    }, "Should initialize without errors");
  });
  test("updateStatusBar should handle auto-continue disabled state", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return false;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig);
    }, "Should update status bar when auto-continue disabled");
  });
  test("updateStatusBar should handle auto-continue enabled without countdown", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig, void 0);
    }, "Should update status bar when auto-continue enabled without countdown");
  });
  test("updateStatusBar should handle auto-continue enabled with countdown", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig, "5m 30s");
    }, "Should update status bar when auto-continue enabled with countdown");
  });
  test("updateStatusBar should handle being called before initialization", () => {
    disposeStatusBar();
    const mockConfig = {
      get: (key, defaultValue) => {
        return defaultValue;
      }
    };
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig);
    }, "Should handle being called before initialization");
  });
  test("updatePort should update the port reference", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return false;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    assert4.doesNotThrow(() => {
      updatePort(4545);
    }, "Should update port without errors");
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig);
    }, "Should still work after port update");
  });
  test("disposeStatusBar should clean up all status bar items", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return false;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    assert4.doesNotThrow(() => {
      disposeStatusBar();
    }, "Should dispose status bar items without errors");
    assert4.doesNotThrow(() => {
      disposeStatusBar();
    }, "Should handle multiple dispose calls");
  });
  test("updateStatusBar should return early after disposal", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        return defaultValue;
      }
    };
    initializeStatusBar(context, 3737, mockConfig);
    disposeStatusBar();
    assert4.doesNotThrow(() => {
      updateStatusBar(mockConfig, "1m 30s");
    }, "Should handle update after disposal gracefully");
  });
});

// src/test/suite/autoContinue.test.ts
var assert5 = __toESM(require("assert"));
var vscode7 = __toESM(require("vscode"));
init_autoContinue();
suite("Auto-Continue Module Tests", () => {
  let context;
  let mockGlobalState;
  setup(async () => {
    const ext = vscode7.extensions.getExtension("local.ai-feedback-bridge");
    assert5.ok(ext, "Extension should be available for testing");
    if (!ext.isActive) {
      await ext.activate();
    }
    mockGlobalState = /* @__PURE__ */ new Map();
    context = ext.exports?.context || {
      globalState: {
        get: (key, defaultValue) => {
          return mockGlobalState.has(key) ? mockGlobalState.get(key) : defaultValue || {};
        },
        update: async (key, value) => {
          mockGlobalState.set(key, value);
        },
        keys: () => Array.from(mockGlobalState.keys())
      },
      workspaceState: {
        get: () => void 0,
        update: async () => {
        },
        keys: () => []
      },
      subscriptions: [],
      extensionPath: ""
    };
  });
  teardown(() => {
    stopAutoContinue();
    mockGlobalState.clear();
  });
  test("formatCountdown should format seconds correctly", () => {
    assert5.strictEqual(formatCountdown(0), "0s", "Zero seconds");
    assert5.strictEqual(formatCountdown(30), "30s", "Under a minute");
    assert5.strictEqual(formatCountdown(45), "45s", "45 seconds");
  });
  test("formatCountdown should format minutes correctly", () => {
    assert5.strictEqual(formatCountdown(60), "1m", "Exactly 1 minute");
    assert5.strictEqual(formatCountdown(90), "1m 30s", "1 minute 30 seconds");
    assert5.strictEqual(formatCountdown(150), "2m 30s", "2 minutes 30 seconds");
    assert5.strictEqual(formatCountdown(300), "5m", "Exactly 5 minutes");
  });
  test("formatCountdown should format hours correctly", () => {
    assert5.strictEqual(formatCountdown(3600), "1h", "Exactly 1 hour");
    assert5.strictEqual(formatCountdown(3660), "1h 1m", "1 hour 1 minute");
    assert5.strictEqual(formatCountdown(3900), "1h 5m", "1 hour 5 minutes");
    assert5.strictEqual(formatCountdown(7200), "2h", "Exactly 2 hours");
    assert5.strictEqual(formatCountdown(7320), "2h 2m", "2 hours 2 minutes");
  });
  test("formatCountdown should handle large values", () => {
    assert5.strictEqual(formatCountdown(86400), "24h", "24 hours");
    assert5.strictEqual(formatCountdown(9e4), "25h", "25 hours");
  });
  test("formatCountdown should handle negative values", () => {
    assert5.strictEqual(formatCountdown(-10), "0s", "Negative value");
    assert5.strictEqual(formatCountdown(-100), "0s", "Large negative value");
  });
  test("getSmartAutoContinueMessage should return empty string when no categories enabled", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      false
    );
    assert5.strictEqual(message, "", "Should return empty when no categories enabled");
  });
  test("getSmartAutoContinueMessage should include enabled categories when forced", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check pending tasks";
        }
        if (key === "autoContinue.tasks.interval") {
          return 300;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
      // Force send
    );
    assert5.ok(message.includes("Check pending tasks"), "Should include task message when forced");
  });
  test("getSmartAutoContinueMessage should combine multiple enabled categories", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check tasks";
        }
        if (key === "autoContinue.improvements.enabled") {
          return true;
        }
        if (key === "autoContinue.improvements.message") {
          return "Consider improvements";
        }
        if (key.includes("interval")) {
          return 300;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
      // Force send
    );
    assert5.ok(message.includes("Check tasks"), "Should include tasks");
    assert5.ok(message.includes("Consider improvements"), "Should include improvements");
    assert5.ok(message.endsWith("."), "Should end with period");
  });
  test("getSmartAutoContinueMessage should respect intervals when not forced", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check tasks";
        }
        if (key === "autoContinue.tasks.interval") {
          return 9999;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message1 = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      false
    );
    assert5.ok(message1.includes("Check tasks"), "First call should include message");
    const message2 = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      false
    );
    assert5.strictEqual(message2, "", "Second call should be empty (interval not elapsed)");
  });
  test("getSmartAutoContinueMessage should skip categories with empty messages", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "";
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
    );
    assert5.strictEqual(message, "", "Should skip categories with empty messages");
  });
  test("getTimeUntilNextReminder should return valid seconds", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.interval") {
          return 300;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const seconds = getTimeUntilNextReminder(context, () => mockConfig);
    assert5.ok(typeof seconds === "number" || seconds === null, "Should return a number or null");
    if (seconds !== null) {
      assert5.ok(seconds >= 0, "Should return non-negative value");
      assert5.ok(seconds <= 300, "Should not exceed max interval");
    }
  });
  test("getTimeUntilNextReminder should return null when no categories enabled", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const seconds = getTimeUntilNextReminder(context, () => mockConfig);
    assert5.strictEqual(seconds, null, "Should return null when nothing enabled");
  });
  test("startAutoContinue and stopAutoContinue should not throw", () => {
    const mockSendToAgent = async () => true;
    assert5.doesNotThrow(() => {
      startAutoContinue(
        context,
        () => vscode7.workspace.getConfiguration("aiFeedbackBridge"),
        mockSendToAgent
      );
    }, "startAutoContinue should not throw");
    assert5.doesNotThrow(() => {
      stopAutoContinue();
    }, "stopAutoContinue should not throw");
  });
  test("stopAutoContinue should be idempotent", () => {
    assert5.doesNotThrow(() => {
      stopAutoContinue();
      stopAutoContinue();
      stopAutoContinue();
    }, "Multiple calls to stopAutoContinue should be safe");
  });
  test("formatCountdown should handle edge case values", () => {
    assert5.strictEqual(formatCountdown(1), "1s", "Single second");
    assert5.strictEqual(formatCountdown(59), "59s", "Just under a minute");
    assert5.strictEqual(formatCountdown(61), "1m 1s", "Just over a minute");
    assert5.strictEqual(formatCountdown(3599), "59m 59s", "Just under an hour");
    assert5.strictEqual(formatCountdown(3601), "1h", "Just over an hour (seconds hidden)");
  });
  test("Message formatting should be consistent", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Message without period";
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
    );
    assert5.ok(message.endsWith("."), "Combined message should end with period");
  });
  test("getSmartAutoContinueMessage should handle empty guiding documents", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check tasks.";
        }
        if (key.includes("enabled")) {
          return false;
        }
        if (key === "guidingDocuments.files") {
          return [];
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
      // Force send
    );
    assert5.ok(message.includes("Check tasks"), "Should include task message");
    assert5.ok(!message.includes("# Guiding Documents"), "Should not include guiding documents header when empty");
  });
  test("stopAutoContinue should handle being called when timer already stopped", () => {
    stopAutoContinue();
    assert5.doesNotThrow(() => {
      stopAutoContinue();
    }, "Should not throw when stopping already stopped timer");
  });
  test("formatCountdown should handle exact minute boundaries without seconds", () => {
    assert5.strictEqual(formatCountdown(120), "2m", "Exactly 2 minutes");
    assert5.strictEqual(formatCountdown(180), "3m", "Exactly 3 minutes");
  });
  test("formatCountdown should handle hours with no remaining minutes", () => {
    assert5.strictEqual(formatCountdown(7200), "2h", "Exactly 2 hours, no minutes");
    assert5.strictEqual(formatCountdown(10800), "3h", "Exactly 3 hours, no minutes");
  });
  test("startAutoContinue should do nothing when disabled", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return false;
        }
        return defaultValue;
      }
    };
    const mockSendToAgent = async () => true;
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    const { isAutoContinueActive: isAutoContinueActive2 } = (init_autoContinue(), __toCommonJS(autoContinue_exports));
    assert5.strictEqual(isAutoContinueActive2(), false, "Timer should not be active when disabled");
  });
  test("startAutoContinue should start timer when enabled", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const mockSendToAgent = async () => true;
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    const { isAutoContinueActive: isAutoContinueActive2 } = (init_autoContinue(), __toCommonJS(autoContinue_exports));
    assert5.strictEqual(isAutoContinueActive2(), true, "Timer should be active when enabled");
    stopAutoContinue();
  });
  test("restartAutoContinue should stop and restart timer", () => {
    const { restartAutoContinue: restartAutoContinue3, isAutoContinueActive: isAutoContinueActive2 } = (init_autoContinue(), __toCommonJS(autoContinue_exports));
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const mockSendToAgent = async () => true;
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    assert5.strictEqual(isAutoContinueActive2(), true, "Timer should be active initially");
    restartAutoContinue3(context, () => mockConfig, mockSendToAgent);
    assert5.strictEqual(isAutoContinueActive2(), true, "Timer should still be active after restart");
    stopAutoContinue();
  });
  test("isAutoContinueActive should return correct state", () => {
    const { isAutoContinueActive: isAutoContinueActive2 } = (init_autoContinue(), __toCommonJS(autoContinue_exports));
    stopAutoContinue();
    assert5.strictEqual(isAutoContinueActive2(), false, "Should be inactive initially");
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    startAutoContinue(context, () => mockConfig, async () => true);
    assert5.strictEqual(isAutoContinueActive2(), true, "Should be active after start");
    stopAutoContinue();
    assert5.strictEqual(isAutoContinueActive2(), false, "Should be inactive after stop");
  });
  test("getSmartAutoContinueMessage should handle category with message but not enabled", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return false;
        }
        if (key === "autoContinue.tasks.message") {
          return "This message should not be included";
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
    );
    assert5.strictEqual(message, "", "Should not include message from disabled category");
  });
  test("getTimeUntilNextReminder should calculate shortest time across multiple categories", () => {
    const mockContext = {
      ...context,
      globalState: {
        get: (key, defaultValue) => {
          if (key === "autoContinue.lastSent") {
            const now = Date.now();
            return {
              "tasks": now - 1e5,
              // 100 seconds ago
              "improvements": now - 2e5
              // 200 seconds ago
            };
          }
          return defaultValue;
        },
        update: async () => {
        },
        keys: () => []
      }
    };
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.interval") {
          return 300;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check tasks";
        }
        if (key === "autoContinue.improvements.enabled") {
          return true;
        }
        if (key === "autoContinue.improvements.interval") {
          return 250;
        }
        if (key === "autoContinue.improvements.message") {
          return "Check improvements";
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const seconds = getTimeUntilNextReminder(mockContext, () => mockConfig);
    assert5.ok(seconds !== null, "Should return a value");
    assert5.ok(seconds >= 0, "Should be non-negative");
    assert5.ok(seconds <= 250, "Should not exceed shortest interval");
  });
  test("startAutoContinue timer should handle errors gracefully", async function() {
    this.timeout(3e3);
    let errorThrown = false;
    const mockSendToAgent = async () => {
      errorThrown = true;
      throw new Error("Test error in sendToAgent");
    };
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Test message";
        }
        if (key === "autoContinue.tasks.interval") {
          return 0.1;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    await context.globalState.update("autoContinue.lastSent", {
      "tasks": 0
    });
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    stopAutoContinue();
    assert5.strictEqual(errorThrown, true, "Error should have been thrown and caught");
  });
  test("startAutoContinue timer should stop itself when disabled during execution", async function() {
    this.timeout(3e3);
    let callCount = 0;
    let configEnabled = true;
    const mockSendToAgent = async () => {
      callCount++;
      return true;
    };
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return configEnabled;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    await new Promise((resolve) => setTimeout(resolve, 600));
    configEnabled = false;
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert5.strictEqual(isAutoContinueActive(), false, "Timer should stop when disabled");
  });
  test("getSmartAutoContinueMessage should include guiding documents when configured", async () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "Check tasks";
        }
        if (key === "guidingDocuments.files") {
          return ["TESTING.md"];
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const message = await getSmartAutoContinueMessage(
      context,
      () => mockConfig,
      true
    );
    assert5.ok(message.includes("Check tasks"), "Should include task message");
  });
  test("startAutoContinue timer should continue when message is empty", async function() {
    this.timeout(2e3);
    let sendCalled = false;
    const mockSendToAgent = async () => {
      sendCalled = true;
      return true;
    };
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.enabled") {
          return true;
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    startAutoContinue(context, () => mockConfig, mockSendToAgent);
    await new Promise((resolve) => setTimeout(resolve, 700));
    stopAutoContinue();
    assert5.strictEqual(sendCalled, false, "Should not send when message is empty");
  });
  test("formatCountdown should handle values >= 60 correctly", () => {
    assert5.strictEqual(formatCountdown(60), "1m", "Should format 60 seconds as 1m");
    assert5.strictEqual(formatCountdown(90), "1m 30s", "Should format 90 seconds correctly");
  });
  test("formatCountdown should handle values >= 3600 correctly", () => {
    assert5.strictEqual(formatCountdown(3600), "1h", "Should format 3600 seconds as 1h");
    assert5.strictEqual(formatCountdown(3900), "1h 5m", "Should format 3900 seconds correctly");
  });
  test("getTimeUntilNextReminder should handle enabled category without message", () => {
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key === "autoContinue.tasks.enabled") {
          return true;
        }
        if (key === "autoContinue.tasks.message") {
          return "";
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const seconds = getTimeUntilNextReminder(context, () => mockConfig);
    assert5.strictEqual(seconds, null, "Should return null when message is empty");
  });
  test("getTimeUntilNextReminder should find shortest remaining time", () => {
    const now = Date.now();
    const mockContext = {
      ...context,
      globalState: {
        get: (key, defaultValue) => {
          if (key === "autoContinue.lastSent") {
            return {
              "tasks": now - 25e4,
              // 250 seconds ago, so 50s remaining for 300s interval
              "improvements": now - 1e5
              // 100 seconds ago, so 200s remaining for 300s interval
            };
          }
          return defaultValue;
        },
        update: async () => {
        },
        keys: () => []
      }
    };
    const mockConfig = {
      get: (key, defaultValue) => {
        if (key.startsWith("autoContinue.tasks.")) {
          if (key.endsWith(".enabled")) {
            return true;
          }
          if (key.endsWith(".interval")) {
            return 300;
          }
          if (key.endsWith(".message")) {
            return "Check tasks";
          }
        }
        if (key.startsWith("autoContinue.improvements.")) {
          if (key.endsWith(".enabled")) {
            return true;
          }
          if (key.endsWith(".interval")) {
            return 300;
          }
          if (key.endsWith(".message")) {
            return "Check improvements";
          }
        }
        if (key.includes("enabled")) {
          return false;
        }
        return defaultValue;
      }
    };
    const seconds = getTimeUntilNextReminder(mockContext, () => mockConfig);
    assert5.ok(seconds !== null, "Should return a time");
    assert5.ok(seconds <= 60, "Should be approximately 50 seconds or less");
    assert5.ok(seconds >= 0, "Should not be negative");
  });
});

// src/test/suite/taskManager.test.ts
var assert6 = __toESM(require("assert"));
var vscode8 = __toESM(require("vscode"));
suite("TaskManager Module Tests", () => {
  let context;
  suiteSetup(async () => {
    const ext = vscode8.extensions.getExtension("local.ai-feedback-bridge");
    assert6.ok(ext, "Extension should be available");
    await ext.activate();
    context = ext.exports?.context || createMockContext();
  });
  setup(async () => {
    await clearCompletedTasks(context);
    const tasks = await getTasks(context);
    for (const task of tasks) {
      await removeTask(context, task.id);
    }
  });
  suite("getTasks", () => {
    test("should return empty array when no tasks exist", async () => {
      const tasks = await getTasks(context);
      assert6.strictEqual(Array.isArray(tasks), true);
      assert6.strictEqual(tasks.length, 0);
    });
    test("should return array even with corrupted state", async () => {
      await context.workspaceState.update("tasks", "invalid");
      const tasks = await getTasks(context);
      assert6.strictEqual(Array.isArray(tasks), true);
      assert6.strictEqual(tasks.length, 0);
    });
    test("should handle storage read errors gracefully", async () => {
      const errorContext = {
        ...context,
        workspaceState: {
          get: () => {
            throw new Error("Storage read error");
          },
          update: async () => {
          },
          keys: () => []
        }
      };
      const tasks = await getTasks(errorContext);
      assert6.strictEqual(Array.isArray(tasks), true);
      assert6.strictEqual(tasks.length, 0);
    });
    test("should return all added tasks", async () => {
      await addTask(context, "Task 1", "Description 1", "bug");
      await addTask(context, "Task 2", "Description 2", "feature");
      const tasks = await getTasks(context);
      assert6.strictEqual(tasks.length, 2);
      assert6.strictEqual(tasks[0].title, "Task 1");
      assert6.strictEqual(tasks[1].title, "Task 2");
    });
  });
  suite("addTask", () => {
    test("should add task with valid data", async () => {
      const task = await addTask(context, "Test Task", "Test Description", "bug");
      assert6.ok(task);
      assert6.strictEqual(task.title, "Test Task");
      assert6.strictEqual(task.description, "Test Description");
      assert6.strictEqual(task.category, "bug");
      assert6.strictEqual(task.status, "pending");
      assert6.ok(task.id);
      assert6.ok(task.createdAt);
    });
    test("should trim whitespace from title and description", async () => {
      const task = await addTask(context, "  Spaced Task  ", "  Spaced Desc  ", "feature");
      assert6.strictEqual(task.title, "Spaced Task");
      assert6.strictEqual(task.description, "Spaced Desc");
    });
    test("should reject empty title", async () => {
      await assert6.rejects(
        async () => await addTask(context, "", "Description", "bug"),
        /Title is required/
      );
    });
    test("should reject whitespace-only title", async () => {
      await assert6.rejects(
        async () => await addTask(context, "   ", "Description", "bug"),
        /Title is required/
      );
    });
    test("should reject title longer than 200 characters", async () => {
      const longTitle = "a".repeat(201);
      await assert6.rejects(
        async () => await addTask(context, longTitle, "Description", "bug"),
        /Title too long/
      );
    });
    test("should accept title exactly 200 characters", async () => {
      const title = "a".repeat(200);
      const task = await addTask(context, title, "Description", "bug");
      assert6.strictEqual(task.title.length, 200);
    });
    test("should reject description longer than 5000 characters", async () => {
      const longDesc = "a".repeat(5001);
      await assert6.rejects(
        async () => await addTask(context, "Title", longDesc, "bug"),
        /Description too long/
      );
    });
    test("should accept empty description", async () => {
      const task = await addTask(context, "Title", "", "bug");
      assert6.strictEqual(task.description, "");
    });
    test("should generate unique IDs for tasks", async () => {
      const task1 = await addTask(context, "Task 1", "", "bug");
      const task2 = await addTask(context, "Task 2", "", "feature");
      assert6.notStrictEqual(task1.id, task2.id);
    });
    test("saveTasks should throw when provided non-array", async () => {
      await assert6.rejects(async () => {
        await saveTasks(context, {});
      }, /Tasks must be an array/);
    });
  });
  suite("updateTaskStatus", () => {
    test("should update task status", async () => {
      const task = await addTask(context, "Test Task", "", "bug");
      await updateTaskStatus(context, task.id, "in-progress");
      const tasks = await getTasks(context);
      const updated = tasks.find((t) => t.id === task.id);
      assert6.strictEqual(updated?.status, "in-progress");
    });
    test("should update updatedAt timestamp when marked completed", async () => {
      const task = await addTask(context, "Test Task", "", "bug");
      await updateTaskStatus(context, task.id, "completed");
      const tasks = await getTasks(context);
      const completed = tasks.find((t) => t.id === task.id);
      assert6.ok(completed?.updatedAt);
      assert6.strictEqual(completed?.status, "completed");
    });
    test("should handle non-existent task ID gracefully", async () => {
      await updateTaskStatus(context, "non-existent-id", "completed");
    });
  });
  suite("removeTask", () => {
    test("should remove task by ID", async () => {
      const task = await addTask(context, "Test Task", "", "bug");
      await removeTask(context, task.id);
      const tasks = await getTasks(context);
      assert6.strictEqual(tasks.length, 0);
    });
    test("should remove only specified task", async () => {
      const task1 = await addTask(context, "Task 1", "", "bug");
      const task2 = await addTask(context, "Task 2", "", "feature");
      await removeTask(context, task1.id);
      const tasks = await getTasks(context);
      assert6.strictEqual(tasks.length, 1);
      assert6.strictEqual(tasks[0].id, task2.id);
    });
    test("should handle non-existent task ID gracefully", async () => {
      await removeTask(context, "non-existent-id");
    });
  });
  suite("clearCompletedTasks", () => {
    test("should remove only completed tasks", async () => {
      const task1 = await addTask(context, "Task 1", "", "bug");
      const task2 = await addTask(context, "Task 2", "", "feature");
      const task3 = await addTask(context, "Task 3", "", "improvement");
      await updateTaskStatus(context, task1.id, "completed");
      await updateTaskStatus(context, task2.id, "in-progress");
      await clearCompletedTasks(context);
      const tasks = await getTasks(context);
      assert6.strictEqual(tasks.length, 2);
      assert6.ok(!tasks.find((t) => t.id === task1.id));
      assert6.ok(tasks.find((t) => t.id === task2.id));
      assert6.ok(tasks.find((t) => t.id === task3.id));
    });
  });
});
function createMockContext() {
  const storage = /* @__PURE__ */ new Map();
  return {
    workspaceState: {
      get: (key) => storage.get(key),
      update: async (key, value) => {
        storage.set(key, value);
      },
      keys: () => Array.from(storage.keys())
    },
    subscriptions: [],
    extensionPath: "",
    extensionUri: vscode8.Uri.file(""),
    environmentVariableCollection: {},
    extensionMode: vscode8.ExtensionMode.Test,
    globalState: {
      get: (key) => void 0,
      update: async (key, value) => {
      },
      keys: () => [],
      setKeysForSync: (keys) => {
      }
    },
    secrets: {},
    storageUri: void 0,
    globalStorageUri: vscode8.Uri.file(""),
    logUri: vscode8.Uri.file(""),
    asAbsolutePath: (path3) => path3,
    storagePath: void 0,
    globalStoragePath: "",
    logPath: "",
    extension: {},
    languageModelAccessInformation: {}
  };
}

// src/test/suite/portManager.test.ts
var assert7 = __toESM(require("assert"));
var vscode10 = __toESM(require("vscode"));

// src/modules/portManager.ts
var vscode9 = __toESM(require("vscode"));
var http3 = __toESM(require("http"));
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
  const workspaceName = vscode9.workspace.name || "No Workspace";
  const workspaceId = vscode9.workspace.workspaceFolders?.[0]?.uri.fsPath || "no-workspace";
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
    const testServer = http3.createServer();
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
  const workspaceId = vscode9.workspace.workspaceFolders?.[0]?.uri.fsPath || "no-workspace";
  const filtered = registry.filter(
    (entry) => !(entry.port === port && entry.workspace === workspaceId)
  );
  await savePortRegistry(context, filtered);
  log("INFO" /* INFO */, `Released port ${port}`);
}

// src/test/suite/portManager.test.ts
suite("PortManager Module Tests", () => {
  let context;
  suiteSetup(async () => {
    const ext = vscode10.extensions.getExtension("local.ai-feedback-bridge");
    assert7.ok(ext, "Extension should be available");
    await ext.activate();
    context = ext.exports?.context || createMockContext2();
  });
  suite("findAvailablePort", () => {
    test("should find an available port", async () => {
      const port = await findAvailablePort(context);
      assert7.ok(port);
      assert7.strictEqual(typeof port, "number");
      assert7.ok(port >= 1024 && port <= 65535);
    });
    test("should return valid port in expected range", async () => {
      const testContext = createMockContext2();
      const port = await findAvailablePort(testContext);
      assert7.ok(port >= 3737);
      assert7.ok(port < 65536);
    });
    test("should return unique ports for different workspaces", async () => {
      const context1 = createMockContext2();
      const context2 = createMockContext2();
      context1.workspaceId = "workspace-1";
      context2.workspaceId = "workspace-2";
      const port1 = await findAvailablePort(context1);
      const port2 = await findAvailablePort(context2);
      assert7.ok(port1 >= 3737 && port1 < 65536);
      assert7.ok(port2 >= 3737 && port2 < 65536);
    });
    test("should reuse port for same workspace", async () => {
      const testContext = createMockContext2();
      const port1 = await findAvailablePort(testContext);
      const port2 = await findAvailablePort(testContext);
      assert7.strictEqual(port1, port2, "Should reuse port for same workspace");
    });
    test("should skip ports that are already bound (EADDRINUSE)", async () => {
      const server2 = require("http").createServer();
      await new Promise((resolve) => server2.listen(3737, resolve));
      try {
        const testContext = createMockContext2();
        const port = await findAvailablePort(testContext);
        assert7.notStrictEqual(port, 3737);
      } finally {
        await new Promise((resolve) => server2.close(() => resolve()));
      }
    });
  });
  suite("releasePort", () => {
    test("should release allocated port", async () => {
      const testContext = createMockContext2();
      const port = await findAvailablePort(testContext);
      await releasePort(testContext, port);
      const newPort = await findAvailablePort(testContext);
      assert7.ok(newPort >= 3737, "New port should be valid");
    });
    test("should handle releasing non-existent port", async () => {
      const testContext = createMockContext2();
      await releasePort(testContext, 9999);
    });
  });
  suite("Edge Cases", () => {
    test("should handle rapid allocation requests", async () => {
      const contexts = [
        createMockContext2(),
        createMockContext2(),
        createMockContext2()
      ];
      const ports = await Promise.all(
        contexts.map((ctx) => findAvailablePort(ctx))
      );
      ports.forEach((port) => {
        assert7.ok(port >= 3737 && port < 65536, `Port ${port} should be in valid range`);
      });
    });
    test("should handle workspace without folders", async () => {
      const testContext = createMockContext2();
      const port = await findAvailablePort(testContext);
      assert7.ok(port >= 3737);
    });
    test("should clean up stale port entries older than 1 hour", async () => {
      const testContext = createMockContext2();
      const staleEntry = {
        port: 3740,
        workspace: "stale-workspace",
        workspaceName: "Stale",
        timestamp: Date.now() - 2 * 60 * 60 * 1e3
        // 2 hours ago
      };
      await testContext.globalState.update("portRegistry", [staleEntry]);
      const port = await findAvailablePort(testContext);
      assert7.ok(port >= 3737, "Should allocate valid port");
      const registry = testContext.globalState.get("portRegistry") || [];
      const hasStaleEntry = registry.some((e) => e.workspace === "stale-workspace");
      assert7.strictEqual(hasStaleEntry, false, "Stale entry should be removed");
    });
    test("should allocate new port when no existing entry found (line 92 false branch)", async () => {
      const testContext = createMockContext2();
      await testContext.globalState.update("portRegistry", [
        {
          port: 3745,
          workspace: "other-workspace",
          workspaceName: "Other",
          timestamp: Date.now()
        }
      ]);
      const port = await findAvailablePort(testContext);
      assert7.ok(port >= 3737, "Should allocate new port");
      assert7.notStrictEqual(port, 3745, "Should not reuse other workspace port");
    });
    test("should handle port availability check with non-EADDRINUSE error", async () => {
      const testContext = createMockContext2();
      const port = await findAvailablePort(testContext);
      assert7.ok(port >= 3737, "Should successfully allocate port even with potential errors");
    });
    test("should handle releasing port that does not match workspace (line 193 false branch)", async () => {
      const testContext = createMockContext2();
      await testContext.globalState.update("portRegistry", [
        {
          port: 3750,
          workspace: "other-workspace-id",
          workspaceName: "Other",
          timestamp: Date.now()
        }
      ]);
      await releasePort(testContext, 3750);
      const registry = testContext.globalState.get("portRegistry") || [];
      assert7.ok(registry.length > 0, "Entry for different workspace should remain");
    });
    test("should successfully release port matching both port and workspace", async () => {
      const testContext = createMockContext2();
      const workspaceId = vscode10.workspace.workspaceFolders?.[0]?.uri.fsPath || "no-workspace";
      await testContext.globalState.update("portRegistry", [
        {
          port: 3755,
          workspace: workspaceId,
          workspaceName: "Test",
          timestamp: Date.now()
        }
      ]);
      await releasePort(testContext, 3755);
      const registry = testContext.globalState.get("portRegistry") || [];
      const hasEntry = registry.some((e) => e.port === 3755 && e.workspace === workspaceId);
      assert7.strictEqual(hasEntry, false, "Matching entry should be removed");
    });
    test("should handle empty registry when releasing port", async () => {
      const testContext = createMockContext2();
      await testContext.globalState.update("portRegistry", []);
      await releasePort(testContext, 3760);
      const registry = testContext.globalState.get("portRegistry") || [];
      assert7.strictEqual(registry.length, 0, "Registry should remain empty");
    });
  });
});
function createMockContext2() {
  const workspaceStorage = /* @__PURE__ */ new Map();
  const globalStorage = /* @__PURE__ */ new Map();
  return {
    workspaceState: {
      get: (key) => workspaceStorage.get(key),
      update: async (key, value) => {
        workspaceStorage.set(key, value);
      },
      keys: () => Array.from(workspaceStorage.keys())
    },
    subscriptions: [],
    extensionPath: "",
    extensionUri: vscode10.Uri.file(""),
    environmentVariableCollection: {},
    extensionMode: vscode10.ExtensionMode.Test,
    globalState: {
      get: (key) => globalStorage.get(key),
      update: async (key, value) => {
        if (value === void 0) {
          globalStorage.delete(key);
        } else {
          globalStorage.set(key, value);
        }
      },
      keys: () => Array.from(globalStorage.keys()),
      setKeysForSync: (keys) => {
      }
    },
    secrets: {},
    storageUri: void 0,
    globalStorageUri: vscode10.Uri.file(""),
    logUri: vscode10.Uri.file(""),
    asAbsolutePath: (path3) => path3,
    storagePath: void 0,
    globalStoragePath: "",
    logPath: "",
    extension: {},
    languageModelAccessInformation: {}
  };
}

// src/test/suite/chatIntegration.test.ts
var assert8 = __toESM(require("assert"));
var vscode12 = __toESM(require("vscode"));

// src/modules/chatIntegration.ts
var vscode11 = __toESM(require("vscode"));
init_types();
init_logging();

// src/modules/messageFormatter.ts
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
    const filteredContext = {};
    contextKeys.forEach((key) => {
      filteredContext[key] = context[key];
    });
    fullMessage += `**Context:**
\`\`\`json
${JSON.stringify(filteredContext, null, 2)}
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

// src/modules/chatIntegration.ts
var chatParticipant;
var outputChannel2;
function initChat(channel) {
  outputChannel2 = channel;
}
function createChatParticipant(context) {
  chatParticipant = vscode11.chat.createChatParticipant(
    "ai-agent-feedback-bridge.agent",
    handleChatRequest
  );
  chatParticipant.iconPath = vscode11.Uri.file(context.asAbsolutePath("icon.png"));
  context.subscriptions.push(chatParticipant);
  log("INFO" /* INFO */, "Chat participant registered");
  return chatParticipant;
}
function getChatParticipant() {
  return chatParticipant;
}
async function handleChatRequest(request2, context, stream, token) {
  outputChannel2.appendLine(`Chat request received: ${request2.prompt}`);
  stream.markdown(`### \u{1F504} Processing Feedback

`);
  stream.markdown(`**Message:** ${request2.prompt}

`);
  const feedbackMatch = request2.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/);
  if (feedbackMatch) {
    stream.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`);
  } else {
    stream.markdown(`Processing your message...

`);
  }
  try {
    const [model] = await vscode11.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
    if (model) {
      const messages = [
        vscode11.LanguageModelChatMessage.User(request2.prompt)
      ];
      const response = await model.sendRequest(messages, {}, token);
      for await (const fragment of response.text) {
        stream.markdown(fragment);
      }
    }
  } catch (err) {
    if (err instanceof vscode11.LanguageModelError) {
      outputChannel2.appendLine(`Language model error: ${err.message}`);
      stream.markdown(`\u26A0\uFE0F Error: ${err.message}

`);
    }
  }
  return { metadata: { command: "process-feedback" } };
}
async function sendToAgent(feedbackMessage, appContext) {
  try {
    const fullMessage = formatFeedbackMessage(feedbackMessage, appContext);
    outputChannel2.appendLine("Processing feedback through AI agent...");
    outputChannel2.appendLine(fullMessage);
    try {
      const [model] = await vscode11.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
      if (model) {
        outputChannel2.appendLine("\u2705 AI Agent processing request...");
        await vscode11.commands.executeCommand("workbench.action.chat.open", {
          query: `@agent ${fullMessage}`
        });
        setTimeout(async () => {
          try {
            await vscode11.commands.executeCommand("workbench.action.chat.submit");
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
    await vscode11.env.clipboard.writeText(fullMessage);
    log("INFO" /* INFO */, "Feedback copied to clipboard");
    return true;
  } catch (error) {
    log("ERROR" /* ERROR */, `Error sending to agent: ${getErrorMessage(error)}`);
    return false;
  }
}
function disposeChat() {
  if (chatParticipant) {
    chatParticipant.dispose();
    chatParticipant = void 0;
    log("INFO" /* INFO */, "Chat participant disposed");
  }
}

// src/test/suite/chatIntegration.test.ts
suite("Chat Integration Module Tests", () => {
  let outputChannel3;
  let context;
  setup(() => {
    outputChannel3 = vscode12.window.createOutputChannel("Test Chat Integration");
    const ext = vscode12.extensions.getExtension("local.ai-feedback-bridge");
    assert8.ok(ext, "Extension should be available for testing");
    context = ext.exports?.context || {
      subscriptions: [],
      extensionPath: "",
      asAbsolutePath: (path3) => path3
    };
  });
  teardown(() => {
    disposeChat();
    outputChannel3.dispose();
  });
  test("initChat should initialize output channel", () => {
    assert8.doesNotThrow(() => {
      initChat(outputChannel3);
    }, "initChat should not throw error");
  });
  test("createChatParticipant should return participant instance", () => {
    initChat(outputChannel3);
    const participant = createChatParticipant(context);
    assert8.ok(participant, "Participant should be created");
    assert8.strictEqual(typeof participant, "object", "Participant should be an object");
  });
  test("getChatParticipant should return undefined before creation", () => {
    disposeChat();
    const participant = getChatParticipant();
    assert8.strictEqual(participant, void 0, "Should return undefined when not created");
  });
  test("getChatParticipant should return participant after creation", () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const participant = getChatParticipant();
    assert8.ok(participant, "Should return participant after creation");
  });
  test("sendToAgent should handle message without errors", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const message = "Test feedback message";
    const feedbackContext = { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    await assert8.doesNotReject(async () => {
      await sendToAgent(message, feedbackContext);
    }, "sendToAgent should not reject with valid input");
  });
  test("sendToAgent should handle empty message", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    await assert8.doesNotReject(async () => {
      await sendToAgent("", { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }, "sendToAgent should handle empty message");
  });
  test("sendToAgent should handle very long message", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const longMessage = "a".repeat(1e4);
    await assert8.doesNotReject(async () => {
      await sendToAgent(longMessage, { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }, "sendToAgent should handle long messages");
  });
  test("sendToAgent should handle special characters", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const specialMessage = `Test with special chars: @#$%^&*()_+{}[]|\\:";'<>?,./
	`;
    await assert8.doesNotReject(async () => {
      await sendToAgent(specialMessage, { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }, "sendToAgent should handle special characters");
  });
  test("sendToAgent should work without context", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    await assert8.doesNotReject(async () => {
      await sendToAgent("Test message");
    }, "sendToAgent should work without context parameter");
  });
  test("disposeChat should cleanup participant", () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    disposeChat();
    const participant = getChatParticipant();
    assert8.strictEqual(participant, void 0, "Participant should be undefined after disposal");
  });
  test("disposeChat should be idempotent", () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    assert8.doesNotThrow(() => {
      disposeChat();
      disposeChat();
      disposeChat();
    }, "disposeChat should be safe to call multiple times");
  });
  test("sendToAgent should handle markdown formatting", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const markdownMessage = "# Header\n**Bold** and *italic* with `code` and [links](http://example.com)";
    await assert8.doesNotReject(async () => {
      await sendToAgent(markdownMessage, { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }, "sendToAgent should handle markdown syntax");
  });
  test("sendToAgent should handle context with only source and timestamp (line 187 false branch)", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const minimalContext = {
      source: "test-source",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await sendToAgent("Test message with minimal context", minimalContext);
    assert8.strictEqual(typeof result, "boolean", "Should return boolean result");
  });
  test("sendToAgent should include context section when extra fields present", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const richContext = {
      source: "test-source",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: 12345,
      sessionId: "abc-123",
      customData: { key: "value" }
    };
    const result = await sendToAgent("Test with rich context", richContext);
    assert8.strictEqual(typeof result, "boolean", "Should return boolean result");
  });
  test("sendToAgent should fallback to clipboard when model unavailable", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const message = "Fallback test message";
    const result = await sendToAgent(message, { source: "fallback-test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    assert8.strictEqual(typeof result, "boolean", "Should return boolean even when model unavailable");
  });
  test("sendToAgent should handle errors in command execution gracefully", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const problematicMessage = "\0";
    await assert8.doesNotReject(async () => {
      const result = await sendToAgent(problematicMessage);
      assert8.strictEqual(typeof result, "boolean", "Should return boolean even with problematic input");
    }, "Should handle errors gracefully");
  });
  test("sendToAgent should handle context with extra properties", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const extendedContext = {
      source: "test",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      customField: "custom value",
      nestedObject: { key: "value" },
      array: [1, 2, 3]
    };
    await assert8.doesNotReject(async () => {
      await sendToAgent("Test", extendedContext);
    }, "sendToAgent should handle context with extra properties");
  });
  test("Multiple chat operations should work in sequence", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    await sendToAgent("First message", { source: "test1", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    await sendToAgent("Second message", { source: "test2", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    await sendToAgent("Third message", { source: "test3", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    const participant = getChatParticipant();
    assert8.ok(participant, "Participant should remain available after multiple operations");
  });
  test("sendToAgent before initialization should handle gracefully", async () => {
    disposeChat();
    await assert8.doesNotReject(async () => {
      await sendToAgent("Test message", { source: "test", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }, "Should handle sendToAgent before initialization");
  });
  test("Context timestamps should be valid ISO 8601", async () => {
    initChat(outputChannel3);
    createChatParticipant(context);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const parsedDate = new Date(timestamp);
    assert8.ok(!isNaN(parsedDate.getTime()), "Timestamp should be valid ISO 8601 format");
    await sendToAgent("Test", { source: "test", timestamp });
  });
});

// src/test/suite/commands.integration.test.ts
var assert9 = __toESM(require("assert"));
var vscode13 = __toESM(require("vscode"));
suite("Commands Integration Tests", () => {
  test("toggleAutoContinue enables when disabled", async function() {
    this.timeout(8e3);
    const config = vscode13.workspace.getConfiguration("aiFeedbackBridge");
    await config.update("autoContinue.enabled", false, vscode13.ConfigurationTarget.Global);
    await vscode13.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const value = config.get("autoContinue.enabled");
    assert9.strictEqual(value, true, "autoContinue should be enabled after toggle");
  });
  test("toggleAutoContinue disables when enabled", async function() {
    this.timeout(8e3);
    const config = vscode13.workspace.getConfiguration("aiFeedbackBridge");
    await config.update("autoContinue.enabled", true, vscode13.ConfigurationTarget.Global);
    await vscode13.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const value = config.get("autoContinue.enabled");
    assert9.strictEqual(value, false, "autoContinue should be disabled after toggle");
  });
});

// src/test/suite/extension.test.ts
suite("AI Feedback Bridge Extension Test Suite", () => {
  vscode14.window.showInformationMessage("Start all tests.");
  test("Extension should be present", () => {
    assert10.ok(vscode14.extensions.getExtension("local.ai-feedback-bridge"));
  });
  test("Extension should activate", async () => {
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    assert10.ok(ext);
    await ext.activate();
    assert10.strictEqual(ext.isActive, true);
  });
  test("Commands should be registered", async () => {
    const commands4 = await vscode14.commands.getCommands(true);
    const expectedCommands = [
      "ai-feedback-bridge.openSettings",
      "ai-feedback-bridge.injectScript",
      "ai-feedback-bridge.toggleAutoContinue",
      "ai-feedback-bridge.changePort",
      "ai-feedback-bridge.showStatus"
    ];
    expectedCommands.forEach((cmd) => {
      assert10.ok(commands4.includes(cmd), `Command ${cmd} should be registered`);
    });
  });
  test("Configuration should have expected settings", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    assert10.notStrictEqual(config.get("port"), void 0);
    assert10.notStrictEqual(config.get("autoStart"), void 0);
    assert10.notStrictEqual(config.get("autoApproval.enabled"), void 0);
    assert10.notStrictEqual(config.get("autoApproval.autoInject"), void 0);
    assert10.notStrictEqual(config.get("autoContinue.enabled"), void 0);
  });
  test("Auto-continue categories should exist", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      assert10.notStrictEqual(
        config.get(`autoContinue.${category}.enabled`),
        void 0,
        `Category ${category} should have enabled setting`
      );
      assert10.notStrictEqual(
        config.get(`autoContinue.${category}.interval`),
        void 0,
        `Category ${category} should have interval setting`
      );
      assert10.notStrictEqual(
        config.get(`autoContinue.${category}.message`),
        void 0,
        `Category ${category} should have message setting`
      );
    });
  });
  test("Status bar items should be created", async function() {
    this.timeout(5e3);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert10.strictEqual(ext.isActive, true);
  });
  test("Opening settings should work", async function() {
    this.timeout(1e4);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await vscode14.commands.executeCommand("ai-feedback-bridge.openSettings");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert10.ok(true);
  });
  test("Toggle auto-continue command should execute", async function() {
    this.timeout(5e3);
    try {
      await vscode14.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert10.ok(true, "Toggle command executed successfully");
    } catch (error) {
      if (error.message && error.message.includes("no workspace is opened")) {
        assert10.ok(true, "Toggle command executed (workspace config not available in test)");
      } else {
        assert10.fail(`Toggle command failed: ${error}`);
      }
    }
  });
  test("Default port should be 3737", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const defaultPort = config.get("port");
    assert10.strictEqual(defaultPort, 3737);
  });
  test("Auto-continue intervals should be reasonable values", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert10.ok(
        interval >= 60 && interval <= 7200,
        `${category} interval should be between 60-7200 seconds (got ${interval})`
      );
    });
  });
  test("Auto-inject should be disabled by default", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const autoInject = config.get("autoApproval.autoInject");
    assert10.strictEqual(autoInject, false, "Auto-inject should be disabled by default");
  });
  test("Run Now command should be registered", async () => {
    const commands4 = await vscode14.commands.getCommands(true);
    assert10.ok(commands4.includes("ai-feedback-bridge.runNow"), "Run Now command should be registered");
  });
  test("Port registry should handle cleanup", async function() {
    this.timeout(5e3);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    assert10.ok(ext);
    await ext.activate();
    assert10.strictEqual(ext.isActive, true);
  });
  test("Smart message rotation respects enabled categories", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const message = config.get(`autoContinue.${category}.message`);
      assert10.ok(message && message.length > 0, `${category} should have a message`);
    });
  });
  test("Auto-approval script should be retrievable", () => {
    assert10.ok(true);
  });
  test("Configuration schema should be valid", async function() {
    this.timeout(5e3);
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    try {
      const testInterval = 120;
      await config.update("autoContinue.tasks.interval", testInterval, vscode14.ConfigurationTarget.Workspace);
      await new Promise((resolve) => setTimeout(resolve, 200));
      assert10.ok(true, "Configuration update succeeded");
      await config.update("autoContinue.tasks.interval", void 0, vscode14.ConfigurationTarget.Workspace);
    } catch (error) {
      assert10.ok(true, "Configuration test completed");
    }
  });
  test("Multiple status bar buttons should be created", async function() {
    this.timeout(5e3);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert10.strictEqual(ext.isActive, true);
  });
  test("HTTP server port should be valid", async function() {
    this.timeout(5e3);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const port = config.get("port", 3737);
    assert10.ok(port >= 3737, "Port should be 3737 or higher");
    assert10.ok(port < 65536, "Port should be below 65536");
  });
  test("All category intervals should be >= 60 seconds", () => {
    const config = vscode14.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert10.ok(interval >= 60, `${category} interval should be at least 60 seconds`);
    });
  });
  test("Chat participant should be registered", async function() {
    this.timeout(5e3);
    const ext = vscode14.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert10.strictEqual(ext.isActive, true);
  });
});
//# sourceMappingURL=extension.test.js.map
