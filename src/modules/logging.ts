/**
 * Logging utilities for the extension
 */
import * as vscode from 'vscode';
import { LogLevel } from './types';

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Initialize the output channel
 */
export function initLogging(channel: vscode.OutputChannel) {
	outputChannel = channel;
}

/**
 * Structured logging helper with timestamps
 */
export function log(level: LogLevel, message: string, data?: unknown) {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [${level}]`;
	const fullMessage = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
	
	if (outputChannel) {
		outputChannel.appendLine(fullMessage);
	}
	
	// Console logging for debugging
	if (level === LogLevel.ERROR) {
		console.error(fullMessage);
	} else if (level === LogLevel.WARN) {
		console.warn(fullMessage);
	} else {
		console.log(fullMessage);
	}
}

/**
 * Get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
