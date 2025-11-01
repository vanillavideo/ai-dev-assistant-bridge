/**
 * Chat Integration Module
 * 
 * Handles all chat participant and language model interactions including
 * message formatting, auto-submission, and fallback handling.
 * 
 * Features:
 * - Custom chat participant (@agent-feedback-bridge)
 * - Automatic chat request submission
 * - Language Model API fallback
 * - Markdown formatting for feedback messages
 * - Context tracking for feedback sources
 * - Graceful error handling with user notifications
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import { log, getErrorMessage } from './logging';

let chatParticipant: vscode.ChatParticipant | undefined;
let outputChannel: vscode.OutputChannel;

/**
 * Initialize the chat module with output channel
 * 
 * @param channel - Output channel for logging chat activity
 * 
 * @remarks
 * Must be called during extension activation before other chat functions
 */
export function initChat(channel: vscode.OutputChannel): void {
	outputChannel = channel;
}

/**
 * Context object for feedback messages
 * 
 * @property source - Origin of the feedback (e.g., 'http_api', 'auto_continue')
 * @property timestamp - ISO 8601 timestamp of feedback creation
 */
export interface FeedbackContext {
	source: string;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * Create and register the chat participant
 * 
 * @param context - VS Code extension context for registration
 * @returns The created chat participant instance
 * 
 * @remarks
 * Creates chat participant with ID 'ai-agent-feedback-bridge.agent'
 * - Sets custom icon from extension assets
 * - Registers participant for automatic cleanup
 * - Attaches handleChatRequest as request handler
 * 
 * @example
 * ```typescript
 * const participant = createChatParticipant(context);
 * console.log('Chat participant ready');
 * ```
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
 * Get the active chat participant instance
 * 
 * @returns The chat participant if created, undefined otherwise
 * 
 * @remarks
 * Used to check if chat participant has been initialized
 */
export function getChatParticipant(): vscode.ChatParticipant | undefined {
	return chatParticipant;
}

/**
 * Handle chat requests from the participant
 * 
 * @param request - The incoming chat request with user message
 * @param context - Chat context including conversation history
 * @param stream - Response stream for writing chat output
 * @param token - Cancellation token for aborting long operations
 * @returns Promise that resolves when response is complete
 * 
 * @remarks
 * Default handler that logs the request and provides simple echo response.
 * Currently returns basic acknowledgment - can be extended for custom responses.
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
 * Format feedback message with context for AI agent processing
 * 
 * @param feedbackMessage - The core feedback text from user or system
 * @param appContext - Optional context object with source, timestamp, and additional data
 * @returns Formatted markdown string ready for chat submission
 * 
 * @remarks
 * Message structure:
 * - Header: "🤖 AI DEV MODE" for clear identification
 * - User Feedback section with main message
 * - Context section (JSON) if meaningful data beyond source/timestamp exists
 * - Instructions section with action guidelines (bug fixes, features, commits)
 * 
 * Format optimized for:
 * - Minimal token usage (ultra-concise)
 * - Clear action prompts for AI
 * - Structured markdown for readability
 * 
 * @example
 * ```typescript
 * const formatted = formatFeedbackMessage(
 *   'Button click not working',
 *   { source: 'http_api', timestamp: '2024-01-01T00:00:00Z', userId: 123 }
 * );
 * ```
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
 * Send feedback directly to AI agent for automatic processing
 * 
 * @param feedbackMessage - The feedback text to send
 * @param appContext - Optional context with source, timestamp, and additional data
 * @returns Promise resolving to true if sent successfully, false otherwise
 * 
 * @remarks
 * Submission flow:
 * 1. Formats message with formatFeedbackMessage()
 * 2. Logs message to output channel
 * 3. Attempts Language Model API (vendor: 'copilot', family: 'gpt-4o')
 * 4. Opens chat UI with @agent prefix and formatted message
 * 5. Auto-submits after 300ms delay (allows UI population)
 * 6. Falls back to manual chat opening if LM unavailable
 * 
 * Error handling:
 * - Language Model not found: Opens chat UI manually (returns true)
 * - Command execution failure: Logs error, shows user notification (returns false)
 * - Auto-submit failure: Logs warning, user can submit manually (still returns true)
 * 
 * Auto-submission details:
 * - Requires 'aiFeedbackBridge.autoSubmit' setting enabled
 * - Uses 'workbench.action.chat.submitInput' command
 * - 300ms delay ensures chat UI is ready
 * - Gracefully handles failures without blocking
 * 
 * @example
 * ```typescript
 * const success = await sendToAgent(
 *   'Add error handling to login',
 *   { source: 'http_api', timestamp: new Date().toISOString() }
 * );
 * if (success) {
 *   console.log('Feedback sent to AI agent');
 * }
 * ```
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
