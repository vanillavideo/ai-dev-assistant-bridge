/**
 * Message Formatter Module Unit Tests
 * 
 * Tests for pure message formatting functions.
 * No VS Code API dependencies - runs in Node.js for C8 coverage measurement.
 */

import * as assert from 'assert';
import { formatFeedbackMessage, hasRichContext, type FeedbackContext } from '../../src/modules/messageFormatter';

suite('Message Formatter Unit Tests', () => {
	suite('formatFeedbackMessage', () => {
		test('should format message with minimal context (only source and timestamp)', () => {
			const message = 'Test feedback message';
			const context: FeedbackContext = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z'
			};

		const result = formatFeedbackMessage(message, context);

		// Should include header and message
		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('Test feedback message'), 'Should include message');
		assert.ok(result.includes('**Instructions:**'), 'Should include instructions');			// Should NOT include context section (only source/timestamp)
			assert.ok(!result.includes('**Context:**'), 'Should not include context section for minimal context');
			assert.ok(!result.includes('```json'), 'Should not include JSON block');
		});

	test('should format message with rich context (custom fields) - EXPLICIT BRANCH COVERAGE', () => {
		const message = 'Feature request';
		const context = {
			source: 'http_api',
			timestamp: '2024-01-01T00:00:00Z',
			userId: 123,
			page: '/dashboard',
			action: 'click'
		};

		const result = formatFeedbackMessage(message, context);			// Should include all standard sections
			assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
			assert.ok(result.includes('Feature request'), 'Should include message');
			assert.ok(result.includes('**Instructions:**'), 'Should include instructions');
			
			// Should include context section with custom fields
			assert.ok(result.includes('**Context:**'), 'Should include context section');
			assert.ok(result.includes('```json'), 'Should include JSON block');
			assert.ok(result.includes('"userId": 123'), 'Should include userId');
			assert.ok(result.includes('"page": "/dashboard"'), 'Should include page');
			assert.ok(result.includes('"action": "click"'), 'Should include action');
			
			// Should NOT include source/timestamp in JSON (filtered out)
			const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
			assert.ok(jsonMatch, 'Should have JSON block');
			const jsonContent = jsonMatch![1];
			assert.ok(!jsonContent.includes('"source"'), 'Should not include source in JSON');
			assert.ok(!jsonContent.includes('"timestamp"'), 'Should not include timestamp in JSON');
		});

		test('should handle message without context (defaults)', () => {
			const message = 'Bug report';


		const result = formatFeedbackMessage(message);

		// Should include standard sections
		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('Bug report'), 'Should include message');
		assert.ok(result.includes('**Instructions:**'), 'Should include instructions');			// Should NOT include context section (defaults are filtered)
			assert.ok(!result.includes('**Context:**'), 'Should not include context section');
		});

		test('should handle empty message', () => {
		const result = formatFeedbackMessage('');

		// Should still include structure
		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('**Instructions:**'), 'Should include instructions');
	});		test('should handle special characters in message', () => {
			const message = 'Test with special chars: @#$%^&*()_+{}[]|\\:";\'<>?,./\n\t';
			const result = formatFeedbackMessage(message);

			assert.ok(result.includes(message), 'Should include special characters');
		});

		test('should handle very long message', () => {
			const longMessage = 'a'.repeat(10000);
			const result = formatFeedbackMessage(longMessage);

			assert.ok(result.includes(longMessage), 'Should handle long message');
			assert.ok(result.length > 10000, 'Result should include long message');
		});

		test('should handle markdown in message', () => {
			const message = '# Header\n**Bold** and *italic* with `code` and [link](http://example.com)';
			const result = formatFeedbackMessage(message);

			assert.ok(result.includes(message), 'Should preserve markdown syntax');
		});

		test('should include all instruction bullet points', () => {
			const result = formatFeedbackMessage('Test');

			assert.ok(result.includes('• If a bug → find and fix root cause'), 'Should include bug instruction');
			assert.ok(result.includes('• If a feature → draft implementation plan'), 'Should include feature instruction');
			assert.ok(result.includes('• Apply and commit changes'), 'Should include commit instruction');
		});

		test('should handle nested objects in context', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				metadata: {
					nested: {
						deeply: {
							value: 'test'
						}
					}
				}
			};

			const result = formatFeedbackMessage('Test', context);

			assert.ok(result.includes('**Context:**'), 'Should include context');
			assert.ok(result.includes('"metadata"'), 'Should include nested object');
		});

		test('should handle arrays in context', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				tags: ['bug', 'critical', 'ui']
			};

			const result = formatFeedbackMessage('Test', context);

			assert.ok(result.includes('**Context:**'), 'Should include context');
			assert.ok(result.includes('"tags"'), 'Should include array field');
			assert.ok(result.includes('bug'), 'Should include array values');
		});
	});

	suite('hasRichContext', () => {
		test('should return false for context with only source and timestamp', () => {
			const context: FeedbackContext = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z'
			};

			assert.strictEqual(hasRichContext(context), false, 'Should return false for minimal context');
		});

		test('should return true for context with custom fields', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				userId: 123
			};

			assert.strictEqual(hasRichContext(context), true, 'Should return true for rich context');
		});

		test('should return false for null context', () => {
			assert.strictEqual(hasRichContext(null), false, 'Should return false for null');
		});

		test('should return false for undefined context', () => {
			assert.strictEqual(hasRichContext(undefined), false, 'Should return false for undefined');
		});

		test('should return false for non-object context', () => {
			assert.strictEqual(hasRichContext('string'), false, 'Should return false for string');
			assert.strictEqual(hasRichContext(123), false, 'Should return false for number');
			assert.strictEqual(hasRichContext(true), false, 'Should return false for boolean');
		});

		test('should return false for empty object', () => {
			assert.strictEqual(hasRichContext({}), false, 'Should return false for empty object');
		});

		test('should return true for object with any field besides source/timestamp', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				customField: null  // Even null values count as "rich"
			};

			assert.strictEqual(hasRichContext(context), true, 'Should return true even with null values');
		});
	});

	suite('Context Handling Edge Cases', () => {
	test('should handle null context (uses defaults)', () => {
		const result = formatFeedbackMessage('Test message', null);

		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('Test message'), 'Should include message');
		assert.ok(!result.includes('**Context:**'), 'Should not include context section with null');
	});	test('should handle undefined context explicitly', () => {
		const result = formatFeedbackMessage('Test message', undefined);

		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('Test message'), 'Should include message');
			assert.ok(!result.includes('**Context:**'), 'Should not include context section with undefined');
		});

	test('should handle empty object context', () => {
		const result = formatFeedbackMessage('Test message', {});

		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(result.includes('Test message'), 'Should include message');
		assert.ok(!result.includes('**Context:**'), 'Should not include context section with empty object');
	});		test('should handle context with only source (no timestamp)', () => {
			const context = { source: 'test' };
			const result = formatFeedbackMessage('Test message', context);

			assert.ok(result.includes('Test message'), 'Should include message');
			assert.ok(!result.includes('**Context:**'), 'Should not include context with only source');
		});

		test('should handle context with only timestamp (no source)', () => {
			const context = { timestamp: '2024-01-01T00:00:00Z' };
			const result = formatFeedbackMessage('Test message', context);

			assert.ok(result.includes('Test message'), 'Should include message');
			assert.ok(!result.includes('**Context:**'), 'Should not include context with only timestamp');
		});
	});

	suite('Edge Cases', () => {
		test('should handle context with numeric keys', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				'123': 'numeric key'
			};

			const result = formatFeedbackMessage('Test', context);
			assert.ok(result.includes('**Context:**'), 'Should include context with numeric keys');
		});

		test('should handle context with special character keys', () => {
			const context = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				'key-with-dashes': 'value',
				'key.with.dots': 'value'
			};

			const result = formatFeedbackMessage('Test', context);
			assert.ok(result.includes('**Context:**'), 'Should include context with special keys');
		});

		test('should handle very large context object', () => {
			const largeContext: any = {
				source: 'test',
				timestamp: '2024-01-01T00:00:00Z'
			};

			// Add 100 custom fields
			for (let i = 0; i < 100; i++) {
				largeContext[`field${i}`] = `value${i}`;
			}

			const result = formatFeedbackMessage('Test', largeContext);
			assert.ok(result.includes('**Context:**'), 'Should handle large context');
			assert.ok(result.includes('field0'), 'Should include first field');
			assert.ok(result.includes('field99'), 'Should include last field');
		});

		test('should handle context with falsy appContext (triggers OR operator)', () => {
		// Explicitly test the || operator branch
		const result = formatFeedbackMessage('Test', 0);
		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include header');
		assert.ok(!result.includes('**Context:**'), 'Should not include context for falsy value');
	});		test('should handle context with false boolean', () => {
			const result = formatFeedbackMessage('Test', false);
			assert.ok(result.includes('Test'), 'Should include message');
			assert.ok(!result.includes('**Context:**'), 'Should not include context for false');
		});

		test('should handle array as context', () => {
			const result = formatFeedbackMessage('Test', [1, 2, 3]);
			assert.ok(result.includes('Test'), 'Should include message');
			// Arrays are objects, so this tests the object handling path
		});

		test('should handle context with prototype properties', () => {
			const context = Object.create({ inheritedProp: 'inherited' });
			context.source = 'test';
			context.timestamp = '2024-01-01T00:00:00Z';
			context.ownProp = 'own';
			
			const result = formatFeedbackMessage('Test', context);
			assert.ok(result.includes('ownProp'), 'Should include own properties');
		});

	test('should handle empty string as feedback message', () => {
		const result = formatFeedbackMessage('', { userId: 123 });
		assert.ok(result.includes('**AI Dev Instructions:**'), 'Should include AI Dev Instructions section');
			assert.ok(result.includes('**Context:**'), 'Should include context');
			assert.ok(result.includes('userId'), 'Should include context data');
		});

		test('should fall back to default context when input is falsy', () => {
			const originalEntries = Object.entries;
			const seen: Array<Record<string, unknown>> = [];
			// Intercept Object.entries calls to capture the context instance used internally.
			Object.entries = ((value: any) => {
				if (value && typeof value === 'object') {
					seen.push(value);
				}
				return originalEntries(value);
			}) as typeof Object.entries;

			try {
				formatFeedbackMessage('Test message', 0);
			} finally {
				Object.entries = originalEntries;
			}

			assert.ok(seen.length > 0, 'Should inspect at least one context object');
			const fallback = seen[0];
			assert.strictEqual(fallback.source, 'unknown', 'Fallback context should default source');
			assert.ok(typeof fallback.timestamp === 'string' && fallback.timestamp.length > 0, 'Fallback context should include timestamp');
		});

		test('should stringify filtered context without source metadata', () => {
			const context = {
				source: 'cli',
				timestamp: '2024-01-01T00:00:00Z',
				taskId: '42',
				status: 'pending'
			};

			const originalStringify = JSON.stringify;
			let captured: Record<string, unknown> | undefined;
			// Capture the payload passed to JSON.stringify to ensure filtering happens before serialization.
			JSON.stringify = ((value: any, replacer?: any, space?: any) => {
				if (!captured && value && typeof value === 'object') {
					captured = value as Record<string, unknown>;
				}
				return originalStringify(value, replacer, space);
			}) as typeof JSON.stringify;

			try {
				formatFeedbackMessage('Test message', context);
			} finally {
				JSON.stringify = originalStringify;
			}

			assert.ok(captured, 'Should serialize a filtered context payload');
			assert.deepStrictEqual(captured, { taskId: '42', status: 'pending' }, 'Serialized context should exclude source metadata');
		});
	});
});

