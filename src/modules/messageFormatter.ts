/**
 * Message Formatting Module
 * 
 * Pure functions for formatting feedback messages and context.
 * No VS Code API dependencies - fully unit testable.
 */

/**
 * Context data structure for feedback messages
 */
export interface FeedbackContext {
	source: string;
	timestamp: string;
	[key: string]: unknown;
}

/**
 * Format a feedback message with optional context for AI processing
 * 
 * Creates a structured markdown message that includes:
 * - User feedback text
 * - Optional context data (excluding source/timestamp if no other fields)
 * - Standard instructions for AI processing
 * 
 * @param feedbackMessage - The user's feedback text
 * @param appContext - Optional context object with source, timestamp, and custom fields
 * @returns Formatted markdown string ready for AI consumption
 * 
 * @example
 * ```typescript
 * // Minimal context (only source/timestamp)
 * const msg1 = formatFeedbackMessage('Bug in login', {
 *   source: 'http_api',
 *   timestamp: '2024-01-01T00:00:00Z'
 * });
 * // Result: No context section included
 * 
 * // Rich context (includes custom fields)
 * const msg2 = formatFeedbackMessage('Feature request', {
 *   source: 'http_api',
 *   timestamp: '2024-01-01T00:00:00Z',
 *   userId: 123,
 *   page: '/dashboard'
 * });
 * // Result: Context section with userId and page fields
 * ```
 */
export function formatFeedbackMessage(feedbackMessage: string, appContext?: unknown): string {
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
		// Create filtered context object without source/timestamp
		const filteredContext: Record<string, unknown> = {};
		contextKeys.forEach(key => {
			filteredContext[key] = context[key as keyof FeedbackContext];
		});
		fullMessage += `**Context:**\n\`\`\`json\n${JSON.stringify(filteredContext, null, 2)}\n\`\`\`\n\n`;
	}

	fullMessage += `**Instructions:**\n`;
	fullMessage += `Analyze feedback, take appropriate action:\n`;
	fullMessage += `• If a bug → find and fix root cause\n`;
	fullMessage += `• If a feature → draft implementation plan\n`;
	fullMessage += `• Apply and commit changes\n`;

	return fullMessage;
}

/**
 * Check if context has meaningful data beyond source and timestamp
 * 
 * @param context - Context object to check
 * @returns True if context has custom fields, false otherwise
 */
export function hasRichContext(context: unknown): boolean {
	if (!context || typeof context !== 'object') {
		return false;
	}
	
	const contextObj = context as Record<string, unknown>;
	const keys = Object.keys(contextObj).filter(k => k !== 'source' && k !== 'timestamp');
	return keys.length > 0;
}
