/**
 * Auto-Continue Module
 * 
 * Manages periodic reminder system that automatically sends messages
 * to the AI agent based on category-specific intervals and configurations.
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import { log, getErrorMessage } from './logging';

let autoContinueTimer: NodeJS.Timeout | undefined;

/**
 * Get smart auto-continue message by rotating through enabled categories
 * based on elapsed time since last sent
 */
export async function getSmartAutoContinueMessage(
	context: vscode.ExtensionContext,
	getConfig: () => vscode.WorkspaceConfiguration,
	force: boolean = false
): Promise<string> {
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
export function startAutoContinue(
	context: vscode.ExtensionContext,
	getConfig: () => vscode.WorkspaceConfiguration,
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): void {
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
				
				const message = await getSmartAutoContinueMessage(context, getConfig);
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
 * Stop auto-continue timer
 */
export function stopAutoContinue(): void {
	if (autoContinueTimer) {
		clearInterval(autoContinueTimer);
		autoContinueTimer = undefined;
		log(LogLevel.INFO, 'Auto-Continue timer stopped');
	}
}

/**
 * Restart auto-continue with new configuration
 */
export function restartAutoContinue(
	context: vscode.ExtensionContext,
	getConfig: () => vscode.WorkspaceConfiguration,
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): void {
	// Stop existing timer if running
	stopAutoContinue();
	
	// Start auto-continue (will check if enabled internally)
	startAutoContinue(context, getConfig, sendToAgent);
}

/**
 * Get timer status for debugging
 */
export function isAutoContinueActive(): boolean {
	return autoContinueTimer !== undefined;
}
