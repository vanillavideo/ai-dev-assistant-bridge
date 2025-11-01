/**
 * Auto-Continue Module Tests
 * 
 * Tests timer management, message generation, and countdown formatting
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
	getSmartAutoContinueMessage, 
	getTimeUntilNextReminder, 
	formatCountdown,
	startAutoContinue,
	stopAutoContinue
} from '../../modules/autoContinue';

suite('Auto-Continue Module Tests', () => {
	let context: vscode.ExtensionContext;

	setup(async () => {
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		assert.ok(ext, 'Extension should be available for testing');
		
		if (!ext!.isActive) {
			await ext!.activate();
		}
		
		context = ext!.exports?.context || {
			globalState: {
				get: () => ({}),
				update: async () => {},
				keys: () => []
			},
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			},
			subscriptions: [],
			extensionPath: ''
		} as any;
	});

	teardown(() => {
		stopAutoContinue();
	});

	test('formatCountdown should format seconds correctly', () => {
		assert.strictEqual(formatCountdown(0), '0s', 'Zero seconds');
		assert.strictEqual(formatCountdown(30), '30s', 'Under a minute');
		assert.strictEqual(formatCountdown(45), '45s', '45 seconds');
	});

	test('formatCountdown should format minutes correctly', () => {
		assert.strictEqual(formatCountdown(60), '1m', 'Exactly 1 minute');
		assert.strictEqual(formatCountdown(90), '1m 30s', '1 minute 30 seconds');
		assert.strictEqual(formatCountdown(150), '2m 30s', '2 minutes 30 seconds');
		assert.strictEqual(formatCountdown(300), '5m', 'Exactly 5 minutes');
	});

	test('formatCountdown should format hours correctly', () => {
		assert.strictEqual(formatCountdown(3600), '1h', 'Exactly 1 hour');
		assert.strictEqual(formatCountdown(3660), '1h 1m', '1 hour 1 minute');
		assert.strictEqual(formatCountdown(3900), '1h 5m', '1 hour 5 minutes');
		assert.strictEqual(formatCountdown(7200), '2h', 'Exactly 2 hours');
		assert.strictEqual(formatCountdown(7320), '2h 2m', '2 hours 2 minutes');
	});

	test('formatCountdown should handle large values', () => {
		assert.strictEqual(formatCountdown(86400), '24h', '24 hours');
		assert.strictEqual(formatCountdown(90000), '25h', '25 hours');
	});

	test('formatCountdown should handle negative values', () => {
		// Negative values should be treated as 0
		assert.strictEqual(formatCountdown(-10), '0s', 'Negative value');
		assert.strictEqual(formatCountdown(-100), '0s', 'Large negative value');
	});

	test('getSmartAutoContinueMessage should return empty string when no categories enabled', async () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key.includes('enabled')) {
					return false; // All disabled
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			false
		);

		assert.strictEqual(message, '', 'Should return empty when no categories enabled');
	});

	test('getSmartAutoContinueMessage should include enabled categories when forced', async () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check pending tasks';
				}
				if (key === 'autoContinue.tasks.interval') {
					return 300;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			true // Force send
		);

		assert.ok(message.includes('Check pending tasks'), 'Should include task message when forced');
	});

	test('getSmartAutoContinueMessage should combine multiple enabled categories', async () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks';
				}
				if (key === 'autoContinue.improvements.enabled') {
					return true;
				}
				if (key === 'autoContinue.improvements.message') {
					return 'Consider improvements';
				}
				if (key.includes('interval')) {
					return 300;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			true // Force send
		);

		assert.ok(message.includes('Check tasks'), 'Should include tasks');
		assert.ok(message.includes('Consider improvements'), 'Should include improvements');
		assert.ok(message.endsWith('.'), 'Should end with period');
	});

	test('getSmartAutoContinueMessage should respect intervals when not forced', async () => {
		// First call with interval that hasn't elapsed
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks';
				}
				if (key === 'autoContinue.tasks.interval') {
					return 9999; // Very long interval
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		// First call should work (no previous send)
		const message1 = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			false
		);
		assert.ok(message1.includes('Check tasks'), 'First call should include message');

		// Immediate second call should be empty (interval not elapsed)
		const message2 = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			false
		);
		assert.strictEqual(message2, '', 'Second call should be empty (interval not elapsed)');
	});

	test('getSmartAutoContinueMessage should skip categories with empty messages', async () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return ''; // Empty message
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			true
		);

		assert.strictEqual(message, '', 'Should skip categories with empty messages');
	});

	test('getTimeUntilNextReminder should return valid seconds', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.interval') {
					return 300;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(context, () => mockConfig);

		assert.ok(typeof seconds === 'number' || seconds === null, 'Should return a number or null');
		if (seconds !== null) {
			assert.ok(seconds >= 0, 'Should return non-negative value');
			assert.ok(seconds <= 300, 'Should not exceed max interval');
		}
	});

	test('getTimeUntilNextReminder should return null when no categories enabled', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key.includes('enabled')) {
					return false; // All disabled
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(context, () => mockConfig);

		assert.strictEqual(seconds, null, 'Should return null when nothing enabled');
	});

	test('startAutoContinue and stopAutoContinue should not throw', () => {
		const mockSendToAgent = async () => true;

		assert.doesNotThrow(() => {
			startAutoContinue(
				context,
				() => vscode.workspace.getConfiguration('aiFeedbackBridge'),
				mockSendToAgent
			);
		}, 'startAutoContinue should not throw');

		assert.doesNotThrow(() => {
			stopAutoContinue();
		}, 'stopAutoContinue should not throw');
	});

	test('stopAutoContinue should be idempotent', () => {
		assert.doesNotThrow(() => {
			stopAutoContinue();
			stopAutoContinue();
			stopAutoContinue();
		}, 'Multiple calls to stopAutoContinue should be safe');
	});

	test('formatCountdown should handle edge case values', () => {
		assert.strictEqual(formatCountdown(1), '1s', 'Single second');
		assert.strictEqual(formatCountdown(59), '59s', 'Just under a minute');
		assert.strictEqual(formatCountdown(61), '1m 1s', 'Just over a minute');
		assert.strictEqual(formatCountdown(3599), '59m 59s', 'Just under an hour');
		assert.strictEqual(formatCountdown(3601), '1h', 'Just over an hour (seconds hidden)');
	});

	test('Message formatting should be consistent', async () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Message without period';
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			true
		);

		// Message should always end with a period
		assert.ok(message.endsWith('.'), 'Combined message should end with period');
	});
});
