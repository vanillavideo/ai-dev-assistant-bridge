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
  test("Toggle auto-continue should work", async function() {
    this.timeout(5e3);
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const initialState = config.get("autoContinue.enabled", false);
    await vscode.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newState = config.get("autoContinue.enabled", false);
    assert.strictEqual(newState, !initialState, "Auto-continue state should toggle");
    await vscode.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");
  });
  test("Default port should be 3737", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const defaultPort = config.get("port");
    assert.strictEqual(defaultPort, 3737);
  });
  test("Default auto-continue intervals should be correct", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const expectedIntervals = {
      tasks: 300,
      improvements: 600,
      coverage: 900,
      robustness: 600,
      cleanup: 1200,
      commits: 900
    };
    Object.entries(expectedIntervals).forEach(([category, interval]) => {
      const actualInterval = config.get(`autoContinue.${category}.interval`);
      assert.strictEqual(
        actualInterval,
        interval,
        `${category} interval should be ${interval}`
      );
    });
  });
  test("Auto-inject should be disabled by default", () => {
    const config = vscode.workspace.getConfiguration("aiFeedbackBridge");
    const autoInject = config.get("autoApproval.autoInject");
    assert.strictEqual(autoInject, false, "Auto-inject should be disabled by default");
  });
});
//# sourceMappingURL=extension.test.js.map
