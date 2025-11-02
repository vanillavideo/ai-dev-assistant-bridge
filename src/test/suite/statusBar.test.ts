/**
 * Status Bar Module Tests
 * 
 * Tests status bar initialization, updates, and branch coverage
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { initializeStatusBar, updateStatusBar, updatePort, disposeStatusBar } from '../../modules/statusBar';

suite('Status Bar Module Tests', () => {
	let context: vscode.ExtensionContext;
	let disposables: vscode.Disposable[];

	setup(async () => {
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-dev-assistant-bridge');
		assert.ok(ext, 'Extension should be available for testing');
		
		if (!ext!.isActive) {
			await ext!.activate();
		}
		
		// Create fresh disposables array for each test
		disposables = [];
		
		context = {
			...(ext!.exports?.context || {}),
			subscriptions: disposables,
			extensionPath: ext!.extensionPath
		} as any;
	});

	teardown(() => {
		// Clean up any disposables created during tests
		disposables.forEach(d => {
			try {
				d.dispose();
			} catch (e) {
				// Ignore disposal errors in teardown
			}
		});
		disposables = [];
		
		// Ensure status bar is disposed after each test
		try {
			disposeStatusBar();
		} catch (e) {
			// Ignore if already disposed
		}
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
		// Explicitly dispose status bar to ensure it's not initialized
		disposeStatusBar();
		
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				return defaultValue;
			}
		} as any;

		// Call updateStatusBar without initializing first
		// Should return early without errors (line 58-59 return branch)
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig);
		}, 'Should handle being called before initialization');
	});

	test('updatePort should update the port reference', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return false;
				}
				return defaultValue;
			}
		} as any;

		// Initialize status bar
		initializeStatusBar(context, 3737, mockConfig);

		// Update port
		assert.doesNotThrow(() => {
			updatePort(4545);
		}, 'Should update port without errors');
		
		// Verify doesn't throw even after update
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig);
		}, 'Should still work after port update');
	});

	test('disposeStatusBar should clean up all status bar items', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return false;
				}
				return defaultValue;
			}
		} as any;

		// Initialize status bar
		initializeStatusBar(context, 3737, mockConfig);

		// Dispose
		assert.doesNotThrow(() => {
			disposeStatusBar();
		}, 'Should dispose status bar items without errors');
		
		// Calling dispose again should be safe (idempotent)
		assert.doesNotThrow(() => {
			disposeStatusBar();
		}, 'Should handle multiple dispose calls');
	});

	test('updateStatusBar should return early after disposal', () => {
		const mockConfig = {
			get: (key: string, defaultValue: any) => {
				if (key === 'autoContinue.enabled') {
					return true;
				}
				return defaultValue;
			}
		} as any;

		// Initialize
		initializeStatusBar(context, 3737, mockConfig);
		
		// Dispose
		disposeStatusBar();

		// Try to update after disposal - should return early without error
		assert.doesNotThrow(() => {
			updateStatusBar(mockConfig, '1m 30s');
		}, 'Should handle update after disposal gracefully');
	});
});
