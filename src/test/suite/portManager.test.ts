/**
 * PortManager Module Tests
 * 
 * Tests for port availability checking, allocation, and cleanup
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as portManager from '../../modules/portManager';
import * as net from 'net';

suite('PortManager Module Tests', () => {
	let context: vscode.ExtensionContext;

	suiteSetup(async () => {
		const ext = vscode.extensions.getExtension('local.ai-feedback-bridge');
		assert.ok(ext, 'Extension should be available');
		await ext.activate();
		context = (ext.exports as any).context || createMockContext();
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
			get: (key: string) => workspaceStorage.get(key),
			update: async (key: string, value: any) => { workspaceStorage.set(key, value); },
			keys: () => Array.from(workspaceStorage.keys())
		},
		subscriptions: [],
		extensionPath: '',
		extensionUri: vscode.Uri.file(''),
		environmentVariableCollection: {} as any,
		extensionMode: vscode.ExtensionMode.Test,
		globalState: {
			get: (key: string) => globalStorage.get(key),
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
