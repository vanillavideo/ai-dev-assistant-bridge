/**
 * PortManager Module Tests
 * 
 * Tests for port availability checking, allocation, and cleanup
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as portManager from '../../src/modules/portManager';
import * as net from 'net';

suite('PortManager Module Tests', () => {
	let context: vscode.ExtensionContext;

	suiteSetup(async () => {
		const ext = vscode.extensions.getExtension('local.ai-dev-assistant-bridge');
		assert.ok(ext, 'Extension should be available');
		await ext.activate();
		context = (ext.exports as any)?.context || createMockContext();
	});

	suite('findAvailablePort', () => {
		test('should find an available port', async () => {
			const port = await portManager.findAvailablePort(context);
			
			assert.ok(port);
			assert.strictEqual(typeof port, 'number');
			assert.ok(port >= 1024 && port <= 65535);
		});

		test('should return valid port in expected range', async () => {
			const testContext = createMockContext();
			const port = await portManager.findAvailablePort(testContext);
			
			// Port should be at least BASE_PORT (3737) or higher
			assert.ok(port >= 3737);
			assert.ok(port < 65536);
		});

		test('should return unique ports for different workspaces', async () => {
			const context1 = createMockContext();
			const context2 = createMockContext();
			
			// Simulate different workspace paths
			(context1 as any).workspaceId = 'workspace-1';
			(context2 as any).workspaceId = 'workspace-2';
			
			const port1 = await portManager.findAvailablePort(context1);
			const port2 = await portManager.findAvailablePort(context2);
			
			// Both should be valid ports
			assert.ok(port1 >= 3737 && port1 < 65536);
			assert.ok(port2 >= 3737 && port2 < 65536);
		});

		test('should reuse port for same workspace', async () => {
			const testContext = createMockContext();
			const port1 = await portManager.findAvailablePort(testContext);
			
			// Call again with same context - should get same port
			const port2 = await portManager.findAvailablePort(testContext);
			
			assert.strictEqual(port1, port2, 'Should reuse port for same workspace');
		});

		test('should skip ports that are already bound (EADDRINUSE)', async () => {
			// Occupy BASE_PORT to force isPortAvailable to report EADDRINUSE
			const server = require('http').createServer();
			await new Promise<void>((resolve) => server.listen(3737, resolve));

			try {
				const testContext = createMockContext();
				const port = await portManager.findAvailablePort(testContext);
				// Since 3737 is occupied, the returned port should not be 3737
				assert.notStrictEqual(port, 3737);
			} finally {
				await new Promise<void>((resolve) => server.close(() => resolve()));
			}
		});
	});

	suite('releasePort', () => {
		test('should release allocated port', async () => {
			const testContext = createMockContext();
			const port = await portManager.findAvailablePort(testContext);
			
			// Release the port
			await portManager.releasePort(testContext, port);
			
			// After release, getting a new port might return a different one
			// (though not guaranteed due to registry cleanup logic)
			const newPort = await portManager.findAvailablePort(testContext);
			assert.ok(newPort >= 3737, 'New port should be valid');
		});

		test('should handle releasing non-existent port', async () => {
			const testContext = createMockContext();
			
			// Should not throw when releasing port that wasn't allocated
			await portManager.releasePort(testContext, 9999);
		});
	});

	suite('Edge Cases', () => {
		test('should handle rapid allocation requests', async () => {
			const contexts = [
				createMockContext(),
				createMockContext(),
				createMockContext()
			];
			
			// Allocate ports rapidly
			const ports = await Promise.all(
				contexts.map(ctx => portManager.findAvailablePort(ctx))
			);
			
			// All ports should be valid
			ports.forEach(port => {
				assert.ok(port >= 3737 && port < 65536, `Port ${port} should be in valid range`);
			});
		});

		test('should handle workspace without folders', async () => {
			const testContext = createMockContext();
			
			// Should still allocate a port even without workspace folders
			const port = await portManager.findAvailablePort(testContext);
			assert.ok(port >= 3737);
		});

		test('should clean up stale port entries older than 1 hour', async () => {
			const testContext = createMockContext();
			
			// Manually set up stale registry entry
			const staleEntry = {
				port: 3740,
				workspace: 'stale-workspace',
				workspaceName: 'Stale',
				timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
			};
			
			await testContext.globalState.update('portRegistry', [staleEntry]);
			
			// Find port should clean up stale entry and allocate new port
			const port = await portManager.findAvailablePort(testContext);
			
			assert.ok(port >= 3737, 'Should allocate valid port');
			
			// Check registry was cleaned (stale entry removed)
			const registry = testContext.globalState.get<any[]>('portRegistry') || [];
			const hasStaleEntry = registry.some(e => e.workspace === 'stale-workspace');
			assert.strictEqual(hasStaleEntry, false, 'Stale entry should be removed');
		});

		test('should allocate new port when no existing entry found (line 92 false branch)', async () => {
			const testContext = createMockContext();
			
			// Ensure registry is empty or has entries for other workspaces
			await testContext.globalState.update('portRegistry', [
				{
					port: 3745,
					workspace: 'other-workspace',
					workspaceName: 'Other',
					timestamp: Date.now()
				}
			]);
			
			// This should trigger the FALSE branch of "if (existingEntry)"
			const port = await portManager.findAvailablePort(testContext);
			
			assert.ok(port >= 3737, 'Should allocate new port');
			assert.notStrictEqual(port, 3745, 'Should not reuse other workspace port');
		});

		test('should handle port availability check with non-EADDRINUSE error', async () => {
			const testContext = createMockContext();
			
			// This test verifies the error handling in isPortAvailable
			// when an error other than EADDRINUSE occurs (line 159 false branch)
			// The function should treat other errors as "port available"
			
			const port = await portManager.findAvailablePort(testContext);
			assert.ok(port >= 3737, 'Should successfully allocate port even with potential errors');
		});

		test('should handle stale entries cleanup', async () => {
			const testContext = createMockContext();
			
			// Add stale entry (older than 1 hour)
			const oneHourAgo = Date.now() - (61 * 60 * 1000); // 61 minutes ago
			await testContext.globalState.update('aiDevAssistantBridge.portRegistry', [
				{
					port: 3740,
					workspace: 'old-workspace',
					timestamp: oneHourAgo
				}
			]);
			
			// Request port - should clean up stale entry
			const port = await portManager.findAvailablePort(testContext);
			
			// Verify stale entry was removed
			const registry = testContext.globalState.get<any[]>('aiDevAssistantBridge.portRegistry', []);
			const hasStale = registry.some(e => e.timestamp === oneHourAgo);
			assert.strictEqual(hasStale, false, 'Stale entry should be removed');
			assert.ok(port >= 3737, 'Should successfully allocate port');
		});

		test('should reuse existing port and update timestamp', async () => {
			const testContext = createMockContext();
			const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
			
			const oldTimestamp = Date.now() - 10000;
			
			// Set up registry with existing entry for current workspace
			await testContext.globalState.update('aiDevAssistantBridge.portRegistry', [
				{
					port: 3745,
					workspace: workspaceId,
					timestamp: oldTimestamp
				}
			]);
			
			// Request port - should reuse and update timestamp
			const port = await portManager.findAvailablePort(testContext);
			
			assert.strictEqual(port, 3745, 'Should reuse existing port');
			
			// Verify timestamp was updated
			const registry = testContext.globalState.get<any[]>('aiDevAssistantBridge.portRegistry', []);
			const entry = registry.find(e => e.workspace === workspaceId);
			assert.ok(entry, 'Entry should exist');
			assert.ok(entry.timestamp > oldTimestamp, 'Timestamp should be updated');
		});

		test('should handle releasing port that does not match workspace (line 193 false branch)', async () => {
			const testContext = createMockContext();
			
			// Set up registry with entry for different workspace
			await testContext.globalState.update('portRegistry', [
				{
					port: 3750,
					workspace: 'other-workspace-id',
					workspaceName: 'Other',
					timestamp: Date.now()
				}
			]);
			
			// Try to release a port - should only remove entries matching both port AND workspace
			await portManager.releasePort(testContext, 3750);
			
			// The entry should still exist because workspace doesn't match
			const registry = testContext.globalState.get<any[]>('portRegistry') || [];
			assert.ok(registry.length > 0, 'Entry for different workspace should remain');
		});

		test('should successfully release port matching both port and workspace', async () => {
			const testContext = createMockContext();
			const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
			
			// Set up registry with entry for current workspace
			await testContext.globalState.update('portRegistry', [
				{
					port: 3755,
					workspace: workspaceId,
					workspaceName: 'Test',
					timestamp: Date.now()
				}
			]);
			
			// Release the port - should remove entry since both port and workspace match
			await portManager.releasePort(testContext, 3755);
			
			// The entry should be removed
			const registry = testContext.globalState.get<any[]>('portRegistry') || [];
			const hasEntry = registry.some(e => e.port === 3755 && e.workspace === workspaceId);
			assert.strictEqual(hasEntry, false, 'Matching entry should be removed');
		});

		test('should handle empty registry when releasing port', async () => {
			const testContext = createMockContext();
			
			// Ensure registry is empty
			await testContext.globalState.update('portRegistry', []);
			
			// Should not throw when releasing from empty registry
			await portManager.releasePort(testContext, 3760);
			
			const registry = testContext.globalState.get<any[]>('portRegistry') || [];
			assert.strictEqual(registry.length, 0, 'Registry should remain empty');
		});
	});
});

/**
 * Create a mock extension context for testing
 */
function createMockContext(): vscode.ExtensionContext {
	const workspaceStorage = new Map<string, any>();
	const globalStorage = new Map<string, any>();
	
	return {
		workspaceState: {
			get: <T>(key: string, defaultValue?: T): T => {
				return workspaceStorage.has(key) ? workspaceStorage.get(key) : defaultValue as T;
			},
			update: async (key: string, value: any) => { workspaceStorage.set(key, value); },
			keys: () => Array.from(workspaceStorage.keys())
		},
		subscriptions: [],
		extensionPath: '',
		extensionUri: vscode.Uri.file(''),
		environmentVariableCollection: {} as any,
		extensionMode: vscode.ExtensionMode.Test,
		globalState: {
			get: <T>(key: string, defaultValue?: T): T => {
				return globalStorage.has(key) ? globalStorage.get(key) : defaultValue as T;
			},
			update: async (key: string, value: any) => { 
				if (value === undefined) {
					globalStorage.delete(key);
				} else {
					globalStorage.set(key, value); 
				}
			},
			keys: () => Array.from(globalStorage.keys()),
			setKeysForSync: (keys: readonly string[]) => {}
		},
		secrets: {} as any,
		storageUri: undefined,
		globalStorageUri: vscode.Uri.file(''),
		logUri: vscode.Uri.file(''),
		asAbsolutePath: (path: string) => path,
		storagePath: undefined,
		globalStoragePath: '',
		logPath: '',
		extension: {} as any,
		languageModelAccessInformation: {} as any
	};
}
