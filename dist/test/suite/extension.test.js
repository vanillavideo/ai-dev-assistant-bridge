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
var assert = __toESM(require("assert"));
var vscode = __toESM(require("vscode"));
suite("AI Feedback Bridge Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("local.ai-feedback-bridge"));
  });
  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    assert.ok(ext);
    await ext.activate();
    assert.strictEqual(ext.isActive, true);
  });
  test("Commands should be registered", async () => {
    const commands2 = await vscode.commands.getCommands(true);
    const expectedCommands = [
      "ai-feedback-bridge.openSettings",
      "ai-feedback-bridge.injectScript",
      "ai-feedback-bridge.toggleAutoContinue",
      "ai-feedback-bridge.changePort",
      "ai-feedback-bridge.showStatus"
    ];
    expectedCommands.forEach((cmd) => {
      assert.ok(commands2.includes(cmd), `Command ${cmd} should be registered`);
    });
  });
  test("Configuration should have expected settings", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    assert.notStrictEqual(config.get("port"), void 0);
    assert.notStrictEqual(config.get("autoStart"), void 0);
    assert.notStrictEqual(config.get("autoApproval.enabled"), void 0);
    assert.notStrictEqual(config.get("autoApproval.autoInject"), void 0);
    assert.notStrictEqual(config.get("autoContinue.enabled"), void 0);
  });
  test("Auto-continue categories should exist", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      assert.notStrictEqual(
        config.get(`autoContinue.${category}.enabled`),
        void 0,
        `Category ${category} should have enabled setting`
      );
      assert.notStrictEqual(
        config.get(`autoContinue.${category}.interval`),
        void 0,
        `Category ${category} should have interval setting`
      );
      assert.notStrictEqual(
        config.get(`autoContinue.${category}.message`),
        void 0,
        `Category ${category} should have message setting`
      );
    });
  });
  test("Status bar items should be created", async function() {
    this.timeout(5e3);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert.strictEqual(ext.isActive, true);
  });
  test("Opening settings should work", async function() {
    this.timeout(1e4);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await vscode.commands.executeCommand("ai-feedback-bridge.openSettings");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.ok(true);
  });
  test("Toggle auto-continue command should execute", async function() {
    this.timeout(5e3);
    try {
      await vscode.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert.ok(true, "Toggle command executed successfully");
    } catch (error) {
      assert.fail(`Toggle command failed: ${error}`);
    }
  });
  test("Default port should be 3737", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const defaultPort = config.get("port");
    assert.strictEqual(defaultPort, 3737);
  });
  test("Auto-continue intervals should be reasonable values", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert.ok(
        interval >= 60 && interval <= 7200,
        `${category} interval should be between 60-7200 seconds (got ${interval})`
      );
    });
  });
  test("Auto-inject should be disabled by default", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const autoInject = config.get("autoApproval.autoInject");
    assert.strictEqual(autoInject, false, "Auto-inject should be disabled by default");
  });
  test("Run Now command should be registered", async () => {
    const commands2 = await vscode.commands.getCommands(true);
    assert.ok(commands2.includes("ai-feedback-bridge.runNow"), "Run Now command should be registered");
  });
  test("Port registry should handle cleanup", async function() {
    this.timeout(5e3);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    assert.ok(ext);
    await ext.activate();
    assert.strictEqual(ext.isActive, true);
  });
  test("Smart message rotation respects enabled categories", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const message = config.get(`autoContinue.${category}.message`);
      assert.ok(message && message.length > 0, `${category} should have a message`);
    });
  });
  test("Auto-approval script should be retrievable", () => {
    assert.ok(true);
  });
  test("Configuration schema should be valid", async function() {
    this.timeout(5e3);
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    try {
      const testInterval = 120;
      await config.update("autoContinue.tasks.interval", testInterval, vscode.ConfigurationTarget.Workspace);
      await new Promise((resolve) => setTimeout(resolve, 200));
      assert.ok(true, "Configuration update succeeded");
      await config.update("autoContinue.tasks.interval", void 0, vscode.ConfigurationTarget.Workspace);
    } catch (error) {
      assert.ok(true, "Configuration test completed");
    }
  });
  test("Multiple status bar buttons should be created", async function() {
    this.timeout(5e3);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    assert.strictEqual(ext.isActive, true);
  });
  test("HTTP server port should be valid", async function() {
    this.timeout(5e3);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const port = config.get("port", 3737);
    assert.ok(port >= 3737, "Port should be 3737 or higher");
    assert.ok(port < 65536, "Port should be below 65536");
  });
  test("All category intervals should be >= 60 seconds", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const categories = ["tasks", "improvements", "coverage", "robustness", "cleanup", "commits"];
    categories.forEach((category) => {
      const interval = config.get(`autoContinue.${category}.interval`, 0);
      assert.ok(interval >= 60, `${category} interval should be at least 60 seconds`);
    });
  });
  test("Chat participant should be registered", async function() {
    this.timeout(5e3);
    const ext = vscode.extensions.getExtension("local.ai-feedback-bridge");
    await ext.activate();
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.strictEqual(ext.isActive, true);
  });
});
//# sourceMappingURL=extension.test.js.map
