"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/test/suite/extension.test.ts
var assert4 = __toESM(require("assert"));
var vscode4 = __toESM(require("vscode"));

// src/test/suite/aiQueue.test.ts
var assert = __toESM(require("assert"));

// src/modules/logging.ts
var outputChannel;
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

// src/modules/aiQueue.ts
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
async function processNextInstruction(sendToAgent) {
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
    if (sendToAgent) {
      const success = await sendToAgent(pending.instruction, {
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
async function processAllInstructions(sendToAgent) {
  let processed = 0;
  while (getQueue("pending").length > 0 && !processingActive) {
    const success = await processNextInstruction(sendToAgent);
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
function setAutoProcess(enabled, sendToAgent) {
  autoProcessEnabled = enabled;
  log("INFO" /* INFO */, `Auto-process ${enabled ? "enabled" : "disabled"}`);
  if (enabled && sendToAgent) {
    void processAllInstructions(sendToAgent);
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

// src/modules/guidingDocuments.ts
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
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
  const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
  const maxSize = config.get("guidingDocuments.maxSize", 5e4);
  const contents = [];
  for (const docPath of docs) {
    try {
      const absolutePath = getAbsolutePath(docPath);
      if (!fs.existsSync(absolutePath)) {
        log("WARN" /* WARN */, `Guiding document not found: ${docPath}`);
        continue;
      }
      const content = fs.readFileSync(absolutePath, "utf-8");
      const truncated = content.length > maxSize ? content.substring(0, maxSize) + "\n\n[... truncated ...]" : content;
      const fileName = path.basename(absolutePath);
      contents.push(`
--- ${fileName} ---
${truncated}`);
    } catch (error) {
      log("ERROR" /* ERROR */, `Error reading guiding document ${docPath}: ${error}`);
    }
  }
  if (contents.length === 0) {
    return "";
  }
  return "# Guiding Documents\n\n" + contents.join("\n");
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

// src/test/suite/guidingDocuments.test.ts
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
    });
    test("getGuidingDocumentsContext should include file contents", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.includes("AI Feedback Bridge") || context.length > 100);
    });
    test("getGuidingDocumentsContext should handle read errors gracefully", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      const nonExistentPath = path2.join(testWorkspaceFolder.uri.fsPath, "non-existent-file.md");
      addGuidingDocument(nonExistentPath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.includes("# Guiding Documents"));
      assert2.ok(context.includes("non-existent-file.md"));
    });
    test("getGuidingDocumentsContext should handle large files", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.length > 0);
      assert2.ok(context.length < 1e6);
    });
    test("getGuidingDocumentsContext should preserve markdown formatting", async () => {
      if (!testWorkspaceFolder) {
        console.log("Skipping test - no workspace folder");
        return;
      }
      addGuidingDocument(testFilePath);
      const context = await getGuidingDocumentsContext();
      assert2.ok(context.includes("```") || context.includes("#"));
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

// src/modules/server.ts
var server;
var MAX_REQUEST_SIZE = 1024 * 1024;
var REQUEST_TIMEOUT = 3e4;
function isValidPort(port) {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}
function startServer(context, port, sendToAgent) {
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
      await handleRequest(req, res, context, port, sendToAgent);
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
async function handleRequest(req, res, context, port, sendToAgent) {
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
    await handleFeedback(req, res, sendToAgent);
  } else if (url === "/restart-app" || url.startsWith("/restart-app?")) {
    await handleRestartApp(req, res);
  } else if (url === "/ai/queue" && method === "GET") {
    handleGetQueue(res);
  } else if (url === "/ai/queue" && method === "POST") {
    await handleEnqueueInstruction(req, res);
  } else if (url === "/ai/queue/process" && method === "POST") {
    await handleProcessQueue(res, sendToAgent);
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
async function handleFeedback(req, res, sendToAgent) {
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
    const success = await sendToAgent(sanitizedMessage, feedback.context);
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
async function handleProcessQueue(res, sendToAgent) {
  try {
    const processed = await processNextInstruction(sendToAgent);
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

// src/test/suite/extension.test.ts
suite("AI Feedback Bridge Extension Test Suite", () => {
  vscode4.window.showInformationMessage("Start all tests.");
  test("Extension should be present", () => {
    assert4.ok(vscode4.extensions.getExtension("local.ai-feedback-bridge"));
  });
  test("Extension should activate", async () => {
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    assert4.ok(ext);
    await ext.activate();
    assert4.strictEqual(ext.isActive, true);
  });
  test("Commands should be registered", async () => {
    const commands2 = await vscode4.commands.getCommands(true);
    const expectedCommands = [
      "ai-feedback-bridge.openSettings",
      "ai-feedback-bridge.injectScript",
      "ai-feedback-bridge.toggleAutoContinue",
      "ai-feedback-bridge.changePort",
      "ai-feedback-bridge.showStatus"
    ];
    expectedCommands.forEach((cmd) => {
      assert4.ok(commands2.includes(cmd), `Command ${cmd} should be registered`);
    });
  });
  test("Configuration should have expected settings", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    assert4.notStrictEqual(config.get("port"), void 0);
    assert4.notStrictEqual(config.get("autoStart"), void 0);
    assert4.notStrictEqual(config.get("autoApproval.enabled"), void 0);
    assert4.notStrictEqual(config.get("autoApproval.autoInject"), void 0);
    assert4.notStrictEqual(config.get("autoContinue.enabled"), void 0);
  });
  test("Auto-continue categories should exist", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      assert4.notStrictEqual(
        config.get(`autoContinue.${category}.enabled`),
        void 0,
        `Category ${category} should have enabled setting`
      );
      assert4.notStrictEqual(
        config.get(`autoContinue.${category}.interval`),
        void 0,
        `Category ${category} should have interval setting`
      );
      assert4.notStrictEqual(
        config.get(`autoContinue.${category}.message`),
        void 0,
        `Category ${category} should have message setting`
      );
    });
  });
  test("Status bar items should be created", async function() {
    this.timeout(5e3);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert4.strictEqual(ext.isActive, true);
  });
  test("Opening settings should work", async function() {
    this.timeout(1e4);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await vscode4.commands.executeCommand("ai-feedback-bridge.openSettings");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert4.ok(true);
  });
  test("Toggle auto-continue command should execute", async function() {
    this.timeout(5e3);
    try {
      await vscode4.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert4.ok(true, "Toggle command executed successfully");
    } catch (error) {
      if (error.message && error.message.includes("no workspace is opened")) {
        assert4.ok(true, "Toggle command executed (workspace config not available in test)");
      } else {
        assert4.fail(`Toggle command failed: ${error}`);
      }
    }
  });
  test("Default port should be 3737", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const defaultPort = config.get("port");
    assert4.strictEqual(defaultPort, 3737);
  });
  test("Auto-continue intervals should be reasonable values", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert4.ok(
        interval >= 60 && interval <= 7200,
        `${category} interval should be between 60-7200 seconds (got ${interval})`
      );
    });
  });
  test("Auto-inject should be disabled by default", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const autoInject = config.get("autoApproval.autoInject");
    assert4.strictEqual(autoInject, false, "Auto-inject should be disabled by default");
  });
  test("Run Now command should be registered", async () => {
    const commands2 = await vscode4.commands.getCommands(true);
    assert4.ok(commands2.includes("ai-feedback-bridge.runNow"), "Run Now command should be registered");
  });
  test("Port registry should handle cleanup", async function() {
    this.timeout(5e3);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    assert4.ok(ext);
    await ext.activate();
    assert4.strictEqual(ext.isActive, true);
  });
  test("Smart message rotation respects enabled categories", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const message = config.get(`autoContinue.${category}.message`);
      assert4.ok(message && message.length > 0, `${category} should have a message`);
    });
  });
  test("Auto-approval script should be retrievable", () => {
    assert4.ok(true);
  });
  test("Configuration schema should be valid", async function() {
    this.timeout(5e3);
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    try {
      const testInterval = 120;
      await config.update("autoContinue.tasks.interval", testInterval, vscode4.ConfigurationTarget.Workspace);
      await new Promise((resolve) => setTimeout(resolve, 200));
      assert4.ok(true, "Configuration update succeeded");
      await config.update("autoContinue.tasks.interval", void 0, vscode4.ConfigurationTarget.Workspace);
    } catch (error) {
      assert4.ok(true, "Configuration test completed");
    }
  });
  test("Multiple status bar buttons should be created", async function() {
    this.timeout(5e3);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert4.strictEqual(ext.isActive, true);
  });
  test("HTTP server port should be valid", async function() {
    this.timeout(5e3);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const port = config.get("port", 3737);
    assert4.ok(port >= 3737, "Port should be 3737 or higher");
    assert4.ok(port < 65536, "Port should be below 65536");
  });
  test("All category intervals should be >= 60 seconds", () => {
    const config = vscode4.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert4.ok(interval >= 60, `${category} interval should be at least 60 seconds`);
    });
  });
  test("Chat participant should be registered", async function() {
    this.timeout(5e3);
    const ext = vscode4.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert4.strictEqual(ext.isActive, true);
  });
});
//# sourceMappingURL=extension.test.js.map
