/**
 * Chat Integration Module
 * 
 * Handles all chat participant and language model interactions
 * including message formatting, auto-submission, and fallback handling.
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import { log, getErrorMessage } from './logging';

let chatParticipant: vscode.ChatParticipant | undefined;
let outputChannel: vscode.OutputChannel;

/**
 * Initialize the chat module with output channel
 */
export function initChat(channel: vscode.OutputChannel): void {
	outputChannel = channel;
}

/**
 * Context object for feedback messages
 */
export interface FeedbackContext {
	source: string;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * Create and register the chat participant
 */
export function createChatParticipant(context: vscode.ExtensionContext): vscode.ChatParticipant {
	chatParticipant = vscode.chat.createChatParticipant(
		'ai-agent-feedback-bridge.agent', 
		handleChatRequest
	);
	chatParticipant.iconPath = vscode.Uri.file(context.asAbsolutePath('icon.png'));
	context.subscriptions.push(chatParticipant);
	
	log(LogLevel.INFO, 'Chat participant registered');
	return chatParticipant;
}

/**
 * Get the active chat participant
 */
export function getChatParticipant(): vscode.ChatParticipant | undefined {
	return chatParticipant;
}

/**
 * Handle chat requests from the participant
 */
async function handleChatRequest(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
	
	outputChannel.appendLine(`Chat request received: ${request.prompt}`);
	
	stream.markdown(`### 🔄 Processing Feedback\n\n`);
	stream.markdown(`**Message:** ${request.prompt}\n\n`);
	
	// Parse the prompt to extract structured feedback
	const feedbackMatch = request.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/);
	
	if (feedbackMatch) {
		stream.markdown(`I've received feedback from your external AI agent system. Let me analyze it:\n\n`);
	} else {
		stream.markdown(`Processing your message...\n\n`);
	}
	
	// Use the language model to process the request
	try {
		const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
		
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
			stream.markdown(`⚠️ Error: ${err.message}\n\n`);
		}
	}
	
	return { metadata: { command: 'process-feedback' } };
}

/**
 * Format feedback message for AI agent processing
 */
function formatFeedbackMessage(feedbackMessage: string, appContext?: unknown): string {
	const context: FeedbackContext = (appContext as FeedbackContext) || { 
		source: "unknown", 
		timestamp: new Date().toISOString() 
	};
	
	// Ultra-concise format to minimize token usage
	let fullMessage = `# 🤖 AI DEV MODE\n\n`;
	fullMessage += `**User Feedback:**\n${feedbackMessage}\n\n`;

	// Only include context if it has meaningful data beyond source/timestamp
	const contextKeys = Object.keys(context).filter(k => k !== 'source' && k !== 'timestamp');
	if (contextKeys.length > 0) {
		fullMessage += `**Context:**\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\n`;
	}

	fullMessage += `**Instructions:**\n`;
	fullMessage += `Analyze feedback, take appropriate action:\n`;
	fullMessage += `• If a bug → find and fix root cause\n`;
	fullMessage += `• If a feature → draft implementation plan\n`;
	fullMessage += `• Apply and commit changes\n`;

	return fullMessage;
}

/**
 * Send feedback directly to the AI agent for automatic processing
 */
export async function sendToAgent(feedbackMessage: string, appContext?: unknown): Promise<boolean> {
	try {
		const fullMessage = formatFeedbackMessage(feedbackMessage, appContext);

		outputChannel.appendLine('Processing feedback through AI agent...');
		outputChannel.appendLine(fullMessage);

		// Process directly using the language model without opening chat UI
		try {
			const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
			
			if (model) {
				outputChannel.appendLine('✅ AI Agent processing request...');
				
				// Send directly to chat with the @agent prefix to use the participant
				await vscode.commands.executeCommand('workbench.action.chat.open', {
					query: `@agent ${fullMessage}`
				});
				
				// Auto-submit by sending the submit command
				// Short delay to allow chat UI to populate (300ms is sufficient)
				setTimeout(async () => {
					try {
						await vscode.commands.executeCommand('workbench.action.chat.submit');
					} catch (e) {
						outputChannel.appendLine('Note: Could not auto-submit. User can press Enter to submit.');
					}
				}, 300);
				
				// Silent success - logged only
				log(LogLevel.INFO, 'Feedback sent to AI Agent');
				return true;
			}
		} catch (modelError) {
			outputChannel.appendLine(`Could not access language model: ${getErrorMessage(modelError)}`);
		}

		// Fallback: copy to clipboard
		await vscode.env.clipboard.writeText(fullMessage);
		log(LogLevel.INFO, 'Feedback copied to clipboard');
		
		return true;

	} catch (error) {
		log(LogLevel.ERROR, `Error sending to agent: ${getErrorMessage(error)}`);
		return false;
	}
}

/**
 * Send feedback to GitHub Copilot Chat (legacy method - kept for manual command)
 */
export async function sendToCopilotChat(feedbackMessage: string, appContext: FeedbackContext): Promise<boolean> {
	return sendToAgent(feedbackMessage, appContext);
}

/**
 * Dispose chat resources
 */
export function disposeChat(): void {
	if (chatParticipant) {
		chatParticipant.dispose();
		chatParticipant = undefined;
		log(LogLevel.INFO, 'Chat participant disposed');
	}
}
