/**
 * Status Bar Module Tests
 * 
 * Tests status bar initialization, updates, and branch coverage
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { initializeStatusBar, updateStatusBar } from '../../modules/statusBar';

suite('Status Bar Module Tests', () => {
	let context: vscode.ExtensionContext;

	setup(async () => {
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		assert.ok(ext, 'Extension should be available for testing');
		
		if (!ext!.isActive) {
			await ext!.activate();
		}
		
		context = ext!.exports?.context || {
			subscriptions: [],
			extensionPath: ''
		} as any;
	});

	test('initializeStatusBar should create status bar items', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return false;
				}
				return defaultValue;
			}
		} as any;

		// Should not throw
		assert.doesNotThrow(() => {
			initializeStatusBar(context, 3737, mockConfig);
		}, 'Should initialize without errors');
	});

	test('updateStatusBar should handle auto-continue disabled state', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return false; // Test the else branch at line 69
				}
				return defaultValue;
			}
		} as any;

		// Initialize first
		initializeStatusBar(context, 3737, mockConfig);

		// Update with disabled state - tests else branch
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig);
		}, 'Should update status bar when auto-continue disabled');
	});

	test('updateStatusBar should handle auto-continue enabled without countdown', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				return defaultValue;
			}
		} as any;

		// Initialize first
		initializeStatusBar(context, 3737, mockConfig);

		// Update with enabled state but no countdown - tests else branch at line 58
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig, undefined);
		}, 'Should update status bar when auto-continue enabled without countdown');
	});

	test('updateStatusBar should handle auto-continue enabled with countdown', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				return defaultValue;
			}
		} as any;

		// Initialize first
		initializeStatusBar(context, 3737, mockConfig);

		// Update with enabled state and countdown - tests the if branch
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig, '5m 30s');
		}, 'Should update status bar when auto-continue enabled with countdown');
	});

	test('updateStatusBar should handle being called before initialization', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				return defaultValue;
			}
		} as any;

		// Call updateStatusBar without initializing first
		// Should return early without errors (line 58 return branch)
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig);
		}, 'Should handle being called before initialization');
	});
});
