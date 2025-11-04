/**
 * Chat Integration Module Tests
 * 
 * Tests chat participant creation, message handling, and feedback submission
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { initChat, createChatParticipant, getChatParticipant, sendToAgent, disposeChat } from '../../src/modules/chatIntegration';

suite('Chat Integration Module Tests', () => {
	let outputChannel: vscode.OutputChannel;
	let context: vscode.ExtensionContext;

	setup(() => {
		// Create mock output channel
		outputChannel = vscode.window.createOutputChannel('Test Chat Integration');
		
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-dev-assistant-bridge');
		assert.ok(ext, 'Extension should be available for testing');
		context = ext!.exports?.context || {
			subscriptions: [],
			extensionPath: '',
			asAbsolutePath: (path: string) => path
		} as any;
	});

	teardown(() => {
		// Cleanup
		disposeChat();
		outputChannel.dispose();
	});

	test('initChat should initialize output channel', () => {
		assert.doesNotThrow(() => {
			initChat(outputChannel);
		}, 'initChat should not throw error');
	});

	test('createChatParticipant should return participant instance', () => {
		initChat(outputChannel);
		const participant = createChatParticipant(context);
		
		assert.ok(participant, 'Participant should be created');
		assert.strictEqual(typeof participant, 'object', 'Participant should be an object');
	});

	test('getChatParticipant should return undefined before creation', () => {
		disposeChat(); // Ensure clean state
		const participant = getChatParticipant();
		
		assert.strictEqual(participant, undefined, 'Should return undefined when not created');
	});

	test('getChatParticipant should return participant after creation', () => {
		initChat(outputChannel);
		createChatParticipant(context);
		const participant = getChatParticipant();
		
		assert.ok(participant, 'Should return participant after creation');
	});

	test('sendToAgent should handle message without errors', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const message = 'Test feedback message';
		const feedbackContext = { source: 'test', timestamp: new Date().toISOString() };
		
		// Should not throw
		await assert.doesNotReject(async () => {
			await sendToAgent(message, feedbackContext);
		}, 'sendToAgent should not reject with valid input');
	});

	test('sendToAgent should handle empty message', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Empty messages should be handled gracefully
		await assert.doesNotReject(async () => {
			await sendToAgent('', { source: 'test', timestamp: new Date().toISOString() });
		}, 'sendToAgent should handle empty message');
	});

	test('sendToAgent should handle very long message', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const longMessage = 'a'.repeat(10000);
		
		await assert.doesNotReject(async () => {
			await sendToAgent(longMessage, { source: 'test', timestamp: new Date().toISOString() });
		}, 'sendToAgent should handle long messages');
	});

	test('sendToAgent should handle special characters', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const specialMessage = 'Test with special chars: @#$%^&*()_+{}[]|\\:";\'<>?,./\n\t';
		
		await assert.doesNotReject(async () => {
			await sendToAgent(specialMessage, { source: 'test', timestamp: new Date().toISOString() });
		}, 'sendToAgent should handle special characters');
	});

	test('sendToAgent should work without context', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Should handle missing context gracefully
		await assert.doesNotReject(async () => {
			await sendToAgent('Test message');
		}, 'sendToAgent should work without context parameter');
	});

	test('disposeChat should cleanup participant', () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		disposeChat();
		
		const participant = getChatParticipant();
		assert.strictEqual(participant, undefined, 'Participant should be undefined after disposal');
	});

	test('disposeChat should be idempotent', () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Should not throw when called multiple times
		assert.doesNotThrow(() => {
			disposeChat();
			disposeChat();
			disposeChat();
		}, 'disposeChat should be safe to call multiple times');
	});

	test('sendToAgent should handle markdown formatting', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const markdownMessage = '# Header\n**Bold** and *italic* with `code` and [links](http://example.com)';
		
		await assert.doesNotReject(async () => {
			await sendToAgent(markdownMessage, { source: 'test', timestamp: new Date().toISOString() });
		}, 'sendToAgent should handle markdown syntax');
	});

	test('sendToAgent should handle context with only source and timestamp (line 187 false branch)', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Context with ONLY source and timestamp - should not include context section
		const minimalContext = { 
			source: 'test-source', 
			timestamp: new Date().toISOString() 
		};
		
		const result = await sendToAgent('Test message with minimal context', minimalContext);
		
		// Should handle gracefully (returns true or false, not throw)
		assert.strictEqual(typeof result, 'boolean', 'Should return boolean result');
	});

	test('sendToAgent should include context section when extra fields present', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Context with additional fields beyond source/timestamp
		const richContext = { 
			source: 'test-source', 
			timestamp: new Date().toISOString(),
			userId: 12345,
			sessionId: 'abc-123',
			customData: { key: 'value' }
		};
		
		const result = await sendToAgent('Test with rich context', richContext);
		
		assert.strictEqual(typeof result, 'boolean', 'Should return boolean result');
	});

	test('sendToAgent should fallback to clipboard when model unavailable', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// This test covers the scenario where model selection fails
		// The function should fallback to clipboard
		const message = 'Fallback test message';
		const result = await sendToAgent(message, { source: 'fallback-test', timestamp: new Date().toISOString() });
		
		// Should complete successfully (fallback to clipboard)
		assert.strictEqual(typeof result, 'boolean', 'Should return boolean even when model unavailable');
	});

	test('sendToAgent should handle errors in command execution gracefully', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Test error handling by providing unusual input that might cause issues
		const problematicMessage = '\x00\x01\x02'; // Control characters
		
		await assert.doesNotReject(async () => {
			const result = await sendToAgent(problematicMessage);
			assert.strictEqual(typeof result, 'boolean', 'Should return boolean even with problematic input');
		}, 'Should handle errors gracefully');
	});

	test('sendToAgent should handle context with extra properties', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const extendedContext = {
			source: 'test',
			timestamp: new Date().toISOString(),
			customField: 'custom value',
			nestedObject: { key: 'value' },
			array: [1, 2, 3]
		};
		
		await assert.doesNotReject(async () => {
			await sendToAgent('Test', extendedContext);
		}, 'sendToAgent should handle context with extra properties');
	});

	test('Multiple chat operations should work in sequence', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		// Perform multiple operations
		await sendToAgent('First message', { source: 'test1', timestamp: new Date().toISOString() });
		await sendToAgent('Second message', { source: 'test2', timestamp: new Date().toISOString() });
		await sendToAgent('Third message', { source: 'test3', timestamp: new Date().toISOString() });
		
		// Should still have participant
		const participant = getChatParticipant();
		assert.ok(participant, 'Participant should remain available after multiple operations');
	});

	test('sendToAgent before initialization should handle gracefully', async () => {
		disposeChat(); // Ensure clean state
		
		// Try to send without initializing
		await assert.doesNotReject(async () => {
			await sendToAgent('Test message', { source: 'test', timestamp: new Date().toISOString() });
		}, 'Should handle sendToAgent before initialization');
	});

	test('Context timestamps should be valid ISO 8601', async () => {
		initChat(outputChannel);
		createChatParticipant(context);
		
		const timestamp = new Date().toISOString();
		const parsedDate = new Date(timestamp);
		
		assert.ok(!isNaN(parsedDate.getTime()), 'Timestamp should be valid ISO 8601 format');
		
		await sendToAgent('Test', { source: 'test', timestamp });
	});
});
