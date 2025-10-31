/**
 * Auto-approval script handling
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { log, getErrorMessage } from './logging';
import { LogLevel } from './types';

/**
 * Copy auto-approval script to clipboard and optionally toggle dev tools
 */
export async function autoInjectScript(extensionContext: vscode.ExtensionContext): Promise<void> {
	try {
		const script = getAutoApprovalScript(extensionContext);
		
		// Copy script to clipboard
		await vscode.env.clipboard.writeText(script);
		log(LogLevel.INFO, '📋 Auto-approval script copied to clipboard');
		
		// Optionally open developer tools
		try {
			await vscode.commands.executeCommand('workbench.action.toggleDevTools');
			log(LogLevel.INFO, '🛠️ Developer Tools toggled');
		} catch (error) {
			log(LogLevel.WARN, 'Could not toggle Developer Tools', getErrorMessage(error));
		}
		
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to copy script', getErrorMessage(error));
	}
}

/**
 * Get the auto-approval script as a string
 */
export function getAutoApprovalScript(extensionContext: vscode.ExtensionContext): string {
	try {
		// Read the actual auto-approval-script.js file from the extension directory
		const scriptPath = path.join(extensionContext.extensionPath, 'scripts', 'auto-approval-script.js');
		const scriptContent = fs.readFileSync(scriptPath, 'utf8');
		return scriptContent;
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to read auto-approval-script.js', getErrorMessage(error));
		return '// Error: Could not load auto-approval script';
	}
}
