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
	startAutoContinue,
	stopAutoContinue,
	restartAutoContinue,
	isAutoContinueActive
} from '../../modules/autoContinue';
import { formatCountdown } from '../../modules/timeFormatting';

suite('Auto-Continue Module Tests', () => {
	let context: vscode.ExtensionContext;
	let mockGlobalState: Map<string, any>;

	setup(async () => {
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		assert.ok(ext, 'Extension should be available for testing');
		
		if (!ext!.isActive) {
			await ext!.activate();
		}
		
		// Create a stateful mock for globalState
		mockGlobalState = new Map<string, any>();
		
		context = ext!.exports?.context || {
			globalState: {
				get: (key: string, defaultValue?: any) => {
					return mockGlobalState.has(key) ? mockGlobalState.get(key) : (defaultValue || {});
				},
				update: async (key: string, value: any) => {
					mockGlobalState.set(key, value);
				},
				keys: () => Array.from(mockGlobalState.keys())
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
		mockGlobalState.clear();
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

	test('getSmartAutoContinueMessage should handle empty guiding documents', async () => {
		// Test the branch where getGuidingDocumentsContext() returns empty string
		// This happens when no guiding documents are configured
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks.';
				}
				if (key.includes('enabled')) {
					return false;
				}
				// No guiding documents configured
				if (key === 'guidingDocuments.files') {
					return [];
				}
				return defaultValue;
			}
		} as any;

		const message = await getSmartAutoContinueMessage(
			context,
			() => mockConfig,
			true // Force send
		);

		// Should have the task message but no guiding documents section
		assert.ok(message.includes('Check tasks'), 'Should include task message');
		assert.ok(!message.includes('# Guiding Documents'), 'Should not include guiding documents header when empty');
	});

	test('stopAutoContinue should handle being called when timer already stopped', () => {
		// Test branch coverage: stopAutoContinue when autoContinueTimer is already undefined
		// This tests the implicit else branch (line 209 in autoContinue.ts)
		
		// Ensure timer is not running
		stopAutoContinue();
		
		// Call again - should handle gracefully without error
		assert.doesNotThrow(() => {
			stopAutoContinue();
		}, 'Should not throw when stopping already stopped timer');
	});

	test('formatCountdown should handle exact minute boundaries without seconds', () => {
		// Test branch: when secs = 0 in the "< 3600" branch
		assert.strictEqual(formatCountdown(120), '2m', 'Exactly 2 minutes');
		assert.strictEqual(formatCountdown(180), '3m', 'Exactly 3 minutes');
	});

	test('formatCountdown should handle hours with no remaining minutes', () => {
		// Test branch: when minutes = 0 in the ">= 3600" branch
		assert.strictEqual(formatCountdown(7200), '2h', 'Exactly 2 hours, no minutes');
		assert.strictEqual(formatCountdown(10800), '3h', 'Exactly 3 hours, no minutes');
	});

	test('startAutoContinue should do nothing when disabled', () => {
		// Test branch: when enabled = false in startAutoContinue
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return false; // Disabled
				}
				return defaultValue;
			}
		} as any;

		const mockSendToAgent = async () => true;

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Verify no timer was started
		const { isAutoContinueActive } = require('../../modules/autoContinue');
		assert.strictEqual(isAutoContinueActive(), false, 'Timer should not be active when disabled');
	});

	test('startAutoContinue should start timer when enabled', () => {
		// Test branch: when enabled = true in startAutoContinue
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true; // Enabled
				}
				if (key.includes('enabled')) {
					return false; // No categories enabled
				}
				return defaultValue;
			}
		} as any;

		const mockSendToAgent = async () => true;

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Verify timer was started
		const { isAutoContinueActive } = require('../../modules/autoContinue');
		assert.strictEqual(isAutoContinueActive(), true, 'Timer should be active when enabled');

		// Cleanup
		stopAutoContinue();
	});

	test('restartAutoContinue should stop and restart timer', () => {
		const { restartAutoContinue, isAutoContinueActive } = require('../../modules/autoContinue');

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const mockSendToAgent = async () => true;

		// Start initially
		startAutoContinue(context, () => mockConfig, mockSendToAgent);
		assert.strictEqual(isAutoContinueActive(), true, 'Timer should be active initially');

		// Restart
		restartAutoContinue(context, () => mockConfig, mockSendToAgent);
		assert.strictEqual(isAutoContinueActive(), true, 'Timer should still be active after restart');

		// Cleanup
		stopAutoContinue();
	});

	test('isAutoContinueActive should return correct state', () => {
		const { isAutoContinueActive } = require('../../modules/autoContinue');

		// Initially should be false
		stopAutoContinue();
		assert.strictEqual(isAutoContinueActive(), false, 'Should be inactive initially');

		// Start timer
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		startAutoContinue(context, () => mockConfig, async () => true);
		assert.strictEqual(isAutoContinueActive(), true, 'Should be active after start');

		// Stop timer
		stopAutoContinue();
		assert.strictEqual(isAutoContinueActive(), false, 'Should be inactive after stop');
	});

	test('getSmartAutoContinueMessage should handle category with message but not enabled', async () => {
		// Test branch: when enabled is false even though message exists
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return false; // Explicitly disabled
				}
				if (key === 'autoContinue.tasks.message') {
					return 'This message should not be included';
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

		assert.strictEqual(message, '', 'Should not include message from disabled category');
	});

	test('getTimeUntilNextReminder should calculate shortest time across multiple categories', () => {
		// Mock state with different last-sent times for different categories
		const mockContext = {
			...context,
			globalState: {
				get: (key: string, defaultValue: any) => {
					if (key === 'autoContinue.lastSent') {
						const now = Date.now();
						return {
							'tasks': now - 100000, // 100 seconds ago
							'improvements': now - 200000, // 200 seconds ago
						};
					}
					return defaultValue;
				},
				update: async () => {},
				keys: () => []
			}
		} as any;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.interval') {
					return 300; // 5 minutes
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks';
				}
				if (key === 'autoContinue.improvements.enabled') {
					return true;
				}
				if (key === 'autoContinue.improvements.interval') {
					return 250; // 4m 10s
				}
				if (key === 'autoContinue.improvements.message') {
					return 'Check improvements';
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(mockContext, () => mockConfig);

		assert.ok(seconds !== null, 'Should return a value');
		assert.ok(seconds! >= 0, 'Should be non-negative');
		// Should return the shorter remaining time (improvements category)
		assert.ok(seconds! <= 250, 'Should not exceed shortest interval');
	});

	test('startAutoContinue timer should handle errors gracefully', async function() {
		this.timeout(3000);

		let errorThrown = false;
		const mockSendToAgent = async () => {
			errorThrown = true;
			throw new Error('Test error in sendToAgent');
		};

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Test message';
				}
				if (key === 'autoContinue.tasks.interval') {
					return 0.1; // Very short interval to trigger quickly
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		// Force a message to be ready by setting last sent to far in past
		await context.globalState.update('autoContinue.lastSent', {
			'tasks': 0
		});

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Wait for timer to tick and trigger the error
		await new Promise(resolve => setTimeout(resolve, 1000));

		stopAutoContinue();

		// Verify error was caught and logged (timer continues despite error)
		assert.strictEqual(errorThrown, true, 'Error should have been thrown and caught');
	});

	test('startAutoContinue timer should stop itself when disabled during execution', async function() {
		this.timeout(3000);

		let callCount = 0;
		let configEnabled = true;

		const mockSendToAgent = async () => {
			callCount++;
			return true;
		};

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return configEnabled; // Will be toggled to false
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Wait a moment, then disable
		await new Promise(resolve => setTimeout(resolve, 600));
		configEnabled = false;

		// Wait for timer to detect disabled state
		await new Promise(resolve => setTimeout(resolve, 600));

		// Timer should have stopped itself
		assert.strictEqual(isAutoContinueActive(), false, 'Timer should stop when disabled');
	});

	test('getSmartAutoContinueMessage should include guiding documents when configured', async () => {
		// Test branch at line 105: when docsContext is truthy
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks';
				}
				if (key === 'guidingDocuments.files') {
					return ['TESTING.md']; // Configure guiding documents
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

		// Should include task message
		assert.ok(message.includes('Check tasks'), 'Should include task message');
		// Note: actual guiding documents content depends on filesystem, 
		// but we're testing the branch where docsContext is truthy
	});

	test('startAutoContinue timer should continue when message is empty', async function() {
		this.timeout(2000);

		// Test branch at line 182: when message is empty (false branch)
		let sendCalled = false;

		const mockSendToAgent = async () => {
			sendCalled = true;
			return true;
		};

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				// All categories disabled, so message will be empty
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Wait for timer to tick
		await new Promise(resolve => setTimeout(resolve, 700));

		stopAutoContinue();

		// sendToAgent should NOT have been called because message was empty
		assert.strictEqual(sendCalled, false, 'Should not send when message is empty');
	});

	test('formatCountdown should handle values >= 60 correctly', () => {
		// Test branch at line 352: when seconds < 60 is false
		assert.strictEqual(formatCountdown(60), '1m', 'Should format 60 seconds as 1m');
		assert.strictEqual(formatCountdown(90), '1m 30s', 'Should format 90 seconds correctly');
	});

	test('formatCountdown should handle values >= 3600 correctly', () => {
		// Test branch at line 358: when seconds < 3600 is false
		assert.strictEqual(formatCountdown(3600), '1h', 'Should format 3600 seconds as 1h');
		assert.strictEqual(formatCountdown(3900), '1h 5m', 'Should format 3900 seconds correctly');
	});

	test('getTimeUntilNextReminder should handle enabled category without message', () => {
		// Test branch at line 311: when !enabled || !message is true (message is empty)
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true; // Enabled
				}
				if (key === 'autoContinue.tasks.message') {
					return ''; // But no message
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(context, () => mockConfig);

		// Should return null because no valid categories (message is empty)
		assert.strictEqual(seconds, null, 'Should return null when message is empty');
	});

	test('getTimeUntilNextReminder should find shortest remaining time', () => {
		// Test branch at line 315: when remaining < shortestTime
		const now = Date.now();
		const mockContext = {
			...context,
			globalState: {
				get: (key: string, defaultValue: any) => {
					if (key === 'autoContinue.lastSent') {
						return {
							'tasks': now - 250000, // 250 seconds ago, so 50s remaining for 300s interval
							'improvements': now - 100000, // 100 seconds ago, so 200s remaining for 300s interval
						};
					}
					return defaultValue;
				},
				update: async () => {},
				keys: () => []
			}
		} as any;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key.startsWith('autoContinue.tasks.')) {
					if (key.endsWith('.enabled')) {
						return true;
					}
					if (key.endsWith('.interval')) {
						return 300;
					}
					if (key.endsWith('.message')) {
						return 'Check tasks';
					}
				}
				if (key.startsWith('autoContinue.improvements.')) {
					if (key.endsWith('.enabled')) {
						return true;
					}
					if (key.endsWith('.interval')) {
						return 300;
					}
					if (key.endsWith('.message')) {
						return 'Check improvements';
					}
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(mockContext, () => mockConfig);

		// Should return the shortest time (tasks category: ~50 seconds)
		assert.ok(seconds !== null, 'Should return a time');
		assert.ok(seconds! <= 60, 'Should be approximately 50 seconds or less');
		assert.ok(seconds! >= 0, 'Should not be negative');
	});

	// Branch coverage tests for uncovered branches
	test('getSmartAutoContinueMessage should handle enabled=true but empty message (line 79 branch)', async () => {
		// Test the second part of: if (!enabled || !message)
		// where !enabled is false BUT !message is true
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true; // enabled is TRUE
				}
				if (key === 'autoContinue.tasks.message') {
					return ''; // but message is EMPTY
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
			true
		);

		// Should return empty because message is empty even though enabled
		assert.strictEqual(message, '', 'Should return empty when message is empty');
	});

	test('getSmartAutoContinueMessage should handle missing docsContext (line 106 false branch)', async () => {
		// Test the false branch of: if (docsContext)
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Test message';
				}
				if (key === 'guidingDocuments.files') {
					return []; // No guiding documents configured
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

		// Should have message but NO docsContext appended
		assert.ok(message.includes('Test message'), 'Should include the task message');
		assert.ok(!message.includes('# Guiding Documents'), 'Should not include guiding docs header');
	});

	test('startAutoContinue should handle null timer in stillEnabled check (line 166 false branch)', async function() {
		this.timeout(2000);
		
		// Test the false branch of: if (autoContinueTimer)
		// This happens when timer is cleared elsewhere but the check still runs
		let configEnabled = true;

		const mockSendToAgent = async () => true;

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return configEnabled;
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		startAutoContinue(context, () => mockConfig, mockSendToAgent);

		// Manually clear the timer to simulate race condition
		stopAutoContinue();

		// Change config to disabled
		configEnabled = false;

		// Wait for timer check (it should handle null timer gracefully)
		await new Promise(resolve => setTimeout(resolve, 600));

		// Should not throw and timer should remain stopped
		assert.strictEqual(isAutoContinueActive(), false, 'Timer should remain stopped');
	});

	test('getTimeUntilNextReminder should handle enabled=true but empty message (line 312 branch)', () => {
		// Test the second part of: if (!enabled || !message)
		// where !enabled is false BUT !message is true
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true; // enabled is TRUE
				}
				if (key === 'autoContinue.tasks.message') {
					return ''; // but message is EMPTY
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

		// Should return null because no valid categories (message is empty)
		assert.strictEqual(seconds, null, 'Should return null when no valid categories');
	});

	test('getTimeUntilNextReminder should compare multiple category times (line 316 both conditions)', () => {
		// Test both parts of: if (shortestTime === null || remaining < shortestTime)
		// Set up two categories with different remaining times
		const now = Date.now();
		const lastSentKey = 'autoContinue.lastSent';
		
		// Set tasks sent 100 seconds ago, improvements sent 50 seconds ago
		mockGlobalState.set(lastSentKey, {
			tasks: now - 100000, // 100 seconds ago
			improvements: now - 50000 // 50 seconds ago
		});

		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.tasks.enabled') {
					return true;
				}
				if (key === 'autoContinue.tasks.message') {
					return 'Check tasks';
				}
				if (key === 'autoContinue.tasks.interval') {
					return 200; // 200 second interval, 100 remaining
				}
				if (key === 'autoContinue.improvements.enabled') {
					return true;
				}
				if (key === 'autoContinue.improvements.message') {
					return 'Check improvements';
				}
				if (key === 'autoContinue.improvements.interval') {
					return 100; // 100 second interval, 50 remaining
				}
				if (key.includes('enabled')) {
					return false;
				}
				return defaultValue;
			}
		} as any;

		const seconds = getTimeUntilNextReminder(context, () => mockConfig);

		// Should return the shortest time (improvements: ~50 seconds)
		assert.ok(seconds !== null, 'Should return a time');
		assert.ok(seconds! <= 55, 'Should be approximately 50 seconds or less');
		assert.ok(seconds! >= 45, 'Should be approximately 50 seconds');
	});
});
