/**
 * Unit tests for logging module - No VS Code window
 */

import * as assert from 'assert';
import * as logging from '../../modules/logging';
import { LogLevel } from '../../modules/types';

suite('Logging Unit Tests (Fast)', () => {
	// Mock output channel
	const mockChannel = {
		name: 'test-channel',
		lines: [] as string[],
		appendLine(value: string) {
			this.lines.push(value);
		},
		append() {},
		replace() {},
		clear() {
			this.lines = [];
		},
		show() {},
		hide() {},
		dispose() {}
	};

	// Track console calls for coverage
	let consoleErrorCalled = false;
	let consoleWarnCalled = false;
	let consoleLogCalled = false;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;
	const originalConsoleLog = console.log;

	setup(() => {
		mockChannel.clear();
		logging.initLogging(mockChannel as any);
		
		// Reset tracking flags
		consoleErrorCalled = false;
		consoleWarnCalled = false;
		consoleLogCalled = false;
		
		// Mock console methods to track calls
		console.error = (...args: any[]) => { consoleErrorCalled = true; };
		console.warn = (...args: any[]) => { consoleWarnCalled = true; };
		console.log = (...args: any[]) => { consoleLogCalled = true; };
	});

	teardown(() => {
		// Restore console methods
		console.error = originalConsoleError;
		console.warn = originalConsoleWarn;
		console.log = originalConsoleLog;
		
		// Restore logging module to valid state
		logging.initLogging(mockChannel as any);
	});

	suite('Basic Logging', () => {
		test('log with INFO level', () => {
			logging.log(LogLevel.INFO, 'Test message');
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('[INFO]'));
			assert.ok(mockChannel.lines[0].includes('Test message'));
			assert.ok(consoleLogCalled, 'console.log should be called for INFO');
		});

		test('log with ERROR level', () => {
			logging.log(LogLevel.ERROR, 'Error message');
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('[ERROR]'));
			assert.ok(mockChannel.lines[0].includes('Error message'));
			assert.ok(consoleErrorCalled, 'console.error should be called for ERROR');
		});

		test('log with WARN level', () => {
			logging.log(LogLevel.WARN, 'Warning message');
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('[WARN]'));
			assert.ok(mockChannel.lines[0].includes('Warning message'));
			assert.ok(consoleWarnCalled, 'console.warn should be called for WARN');
		});

		test('log with DEBUG level', () => {
			logging.log(LogLevel.DEBUG, 'Debug message');
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('[DEBUG]'));
			assert.ok(mockChannel.lines[0].includes('Debug message'));
			assert.ok(consoleLogCalled, 'console.log should be called for DEBUG');
		});
	});

	suite('Logging with Data', () => {
		test('log with object data', () => {
			const data = { key: 'value', num: 42 };
			logging.log(LogLevel.INFO, 'Message with data', data);
			
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('Message with data'));
			assert.ok(mockChannel.lines[0].includes('"key":"value"'));
			assert.ok(mockChannel.lines[0].includes('"num":42'));
		});

		test('log with array data', () => {
			const data = [1, 2, 3];
			logging.log(LogLevel.INFO, 'Array data', data);
			
			assert.ok(mockChannel.lines[0].includes('[1,2,3]'));
		});

		test('log with nested object', () => {
			const data = { outer: { inner: 'value' } };
			logging.log(LogLevel.INFO, 'Nested data', data);
			
			assert.ok(mockChannel.lines[0].includes('"outer"'));
			assert.ok(mockChannel.lines[0].includes('"inner":"value"'));
		});
	});

	suite('Error Message Extraction', () => {
		test('getErrorMessage from Error instance', () => {
			const error = new Error('Test error');
			const message = logging.getErrorMessage(error);
			assert.strictEqual(message, 'Test error');
		});

		test('getErrorMessage from string', () => {
			const message = logging.getErrorMessage('String error');
			assert.strictEqual(message, 'String error');
		});

		test('getErrorMessage from number', () => {
			const message = logging.getErrorMessage(404);
			assert.strictEqual(message, '404');
		});

		test('getErrorMessage from object', () => {
			const message = logging.getErrorMessage({ code: 'ERROR' });
			// Objects are converted using String() which returns "[object Object]"
			assert.strictEqual(message, '[object Object]');
		});

		test('getErrorMessage from null', () => {
			const message = logging.getErrorMessage(null);
			assert.strictEqual(message, 'null');
		});

		test('getErrorMessage from undefined', () => {
			const message = logging.getErrorMessage(undefined);
			assert.strictEqual(message, 'undefined');
		});
	});

	suite('Timestamps', () => {
		test('log includes ISO timestamp', () => {
			logging.log(LogLevel.INFO, 'Timestamped');
			const logLine = mockChannel.lines[0];
			
			// Should match ISO format: [2025-10-31T...]
			assert.ok(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/.test(logLine));
		});
	});

	suite('Edge Cases', () => {
		test('log with empty message', () => {
			logging.log(LogLevel.INFO, '');
			assert.strictEqual(mockChannel.lines.length, 1);
			assert.ok(mockChannel.lines[0].includes('[INFO]'));
		});

		test('log with very long message', () => {
			const longMessage = 'a'.repeat(10000);
			logging.log(LogLevel.INFO, longMessage);
			assert.ok(mockChannel.lines[0].includes(longMessage));
		});

		test('log with special characters', () => {
			const special = '!@#$%^&*(){}[]|\'"<>?/\\';
			logging.log(LogLevel.INFO, special);
			assert.ok(mockChannel.lines[0].includes(special));
		});

		test('log with unicode characters', () => {
			const unicode = '你好 🚀 Привет';
			logging.log(LogLevel.INFO, unicode);
			assert.ok(mockChannel.lines[0].includes(unicode));
		});
	});

	suite('Multiple Logs', () => {
		test('multiple sequential logs', () => {
			logging.log(LogLevel.INFO, 'First');
			logging.log(LogLevel.WARN, 'Second');
			logging.log(LogLevel.ERROR, 'Third');
			
			assert.strictEqual(mockChannel.lines.length, 3);
			assert.ok(mockChannel.lines[0].includes('First'));
			assert.ok(mockChannel.lines[1].includes('Second'));
			assert.ok(mockChannel.lines[2].includes('Third'));
		});
	});

	suite('Without Output Channel', () => {
		test('log without initialized channel (ERROR level)', () => {
			// Reset to undefined by passing null
			logging.initLogging(null as any);
			
			// Should not throw, only logs to console
			logging.log(LogLevel.ERROR, 'Error without channel');
			assert.ok(true, 'No error thrown');
		});

		test('log without initialized channel (WARN level)', () => {
			logging.initLogging(null as any);
			logging.log(LogLevel.WARN, 'Warning without channel');
			assert.ok(true, 'No error thrown');
		});

		test('log without initialized channel (INFO level)', () => {
			logging.initLogging(null as any);
			logging.log(LogLevel.INFO, 'Info without channel');
			assert.ok(true, 'No error thrown');
		});

		test('log without initialized channel with data', () => {
			logging.initLogging(null as any);
			logging.log(LogLevel.DEBUG, 'Debug with data', { test: true });
			assert.ok(true, 'No error thrown');
		});
	});
});
