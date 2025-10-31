/**
 * Status Bar Module
 * 
 * Manages all status bar items for the extension including
 * settings, toggle, and inject script buttons.
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import { log } from './logging';

let statusBarToggle: vscode.StatusBarItem | undefined;
let statusBarSettings: vscode.StatusBarItem | undefined;
let statusBarInject: vscode.StatusBarItem | undefined;
let currentPortRef: number = 3737;

/**
 * Initialize all status bar items
 */
export function initializeStatusBar(
	context: vscode.ExtensionContext,
	currentPort: number,
	config: vscode.WorkspaceConfiguration
): void {
	currentPortRef = currentPort;
	
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
	
	log(LogLevel.INFO, 'Status bar items initialized');
}

/**
 * Update status bar items with current configuration
 */
export function updateStatusBar(config: vscode.WorkspaceConfiguration, countdown?: string): void {
	if (!statusBarToggle || !statusBarSettings) {
		return;
	}
	
	const autoEnabled = config.get<boolean>('autoContinue.enabled', false);
	
	// Settings button shows port and bridge name
	statusBarSettings.text = `AI Dev: ${currentPortRef}`;
	statusBarSettings.tooltip = 'Click to configure AI Feedback Bridge';
	
	// Toggle button shows Start/Stop with spinning icon when active
	if (autoEnabled) {
		const countdownText = countdown ? ` (${countdown})` : '';
		statusBarToggle.text = `$(sync~spin) Stop AI Dev${countdownText}`;
		statusBarToggle.tooltip = countdown 
			? `Auto-Continue active\nNext reminder: ${countdown}\nClick to stop`
			: 'Auto-Continue active\nClick to stop';
	} else {
		statusBarToggle.text = '$(play) Start AI Dev';
		statusBarToggle.tooltip = 'Auto-Continue inactive\nClick to start';
	}
}

/**
 * Update the port displayed in status bar
 */
export function updatePort(port: number): void {
	currentPortRef = port;
	if (statusBarSettings) {
		statusBarSettings.text = `AI Dev: ${port}`;
	}
}

/**
 * Dispose all status bar items
 */
export function disposeStatusBar(): void {
	if (statusBarToggle) {
		statusBarToggle.dispose();
		statusBarToggle = undefined;
	}
	if (statusBarSettings) {
		statusBarSettings.dispose();
		statusBarSettings = undefined;
	}
	if (statusBarInject) {
		statusBarInject.dispose();
		statusBarInject = undefined;
	}
	log(LogLevel.INFO, 'Status bar items disposed');
}
