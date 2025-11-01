/**
 * Tests for Server HTTP endpoints
 * 
 * Comprehensive test coverage for REST API endpoints including AI queue
 */

import * as assert from 'assert';
import * as http from 'http';
import * as vscode from 'vscode';
import * as server from '../../modules/server';
import * as aiQueue from '../../modules/aiQueue';
import * as taskManager from '../../modules/taskManager';

suite('Server Validation Tests', () => {
	let mockContext: vscode.ExtensionContext;
	let mockSendToAgent: (message: string, context?: unknown) => Promise<boolean>;

	setup(() => {
		// Mock extension context
		mockContext = {
			subscriptions: [],
			globalState: {
				get: () => undefined,
				update: async () => {},
				keys: () => [],
				setKeysForSync: () => {}
			},
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			}
		} as any;

		// Mock send to agent function
		mockSendToAgent = async (message: string) => {
			return true;
		};
	});

	test('startServer should reject invalid port number (too low)', () => {
		assert.throws(
			() => server.startServer(mockContext, 500, mockSendToAgent),
			/Invalid port number.*Must be between 1024 and 65535/,
			'Should throw error for port < 1024'
		);
	});

	test('startServer should reject invalid port number (too high)', () => {
		assert.throws(
			() => server.startServer(mockContext, 70000, mockSendToAgent),
			/Invalid port number.*Must be between 1024 and 65535/,
			'Should throw error for port > 65535'
		);
	});

	test('startServer should reject invalid port number (negative)', () => {
		assert.throws(
			() => server.startServer(mockContext, -1, mockSendToAgent),
			/Invalid port number.*Must be between 1024 and 65535/,
			'Should throw error for negative port'
		);
	});
});

suite('Server HTTP Endpoints Test Suite', () => {
	let testServer: http.Server;
	let testPort: number;
	let mockContext: vscode.ExtensionContext;
	let mockSendToAgent: (message: string, context?: unknown) => Promise<boolean>;

	// Setup before tests
	suiteSetup(() => {
		// Mock extension context
		mockContext = {
			subscriptions: [],
			globalState: {
				get: () => undefined,
				update: async () => {},
				keys: () => [],
				setKeysForSync: () => {}
			},
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			}
		} as any;

		// Mock send to agent function
		mockSendToAgent = async (message: string) => {
			return true;
		};

		// Find available port and start server
		testPort = 3800 + Math.floor(Math.random() * 100);
		testServer = server.startServer(mockContext, testPort, mockSendToAgent);
	});

	suiteTeardown((done) => {
		// Clean up server
		if (testServer) {
			testServer.close(() => done());
		} else {
			done();
		}
	});

	// Clear AI queue before each test
	setup(() => {
		aiQueue.clearQueue();
	});

	suite('Health Check Endpoints', () => {
		test('GET / should return API documentation', (done) => {
			http.get(`http://localhost:${testPort}/`, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					assert.ok(data.includes('AI Feedback Bridge'));
					assert.ok(data.includes('API Documentation'));
					done();
				});
			}).on('error', done);
		});

		test('GET /help should return API documentation', (done) => {
			http.get(`http://localhost:${testPort}/help`, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					assert.ok(data.includes('API Documentation'));
					done();
				});
			}).on('error', done);
		});
	});

	suite('AI Queue Endpoints', () => {
		test('GET /ai/queue should return empty queue initially', (done) => {
			http.get(`http://localhost:${testPort}/ai/queue`, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(Array.isArray(response.queue));
					assert.strictEqual(response.count, 0);
					done();
				});
			}).on('error', done);
		});

		test('POST /ai/queue should enqueue instruction', (done) => {
			const payload = JSON.stringify({
				instruction: 'Test instruction from API',
				source: 'test-api',
				priority: 'high',
				metadata: { test: true }
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 201);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, true);
					assert.ok(response.queueItem);
					assert.strictEqual(response.queueItem.instruction, 'Test instruction from API');
					assert.strictEqual(response.queueItem.priority, 'high');
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /ai/queue should reject missing instruction', (done) => {
			const payload = JSON.stringify({
				source: 'test-api'
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('GET /ai/queue/stats should return queue statistics', (done) => {
			// Enqueue some test items
			aiQueue.enqueueInstruction('Test 1', 'test', 'normal');
			aiQueue.enqueueInstruction('Test 2', 'test', 'high');

			http.get(`http://localhost:${testPort}/ai/queue/stats`, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const stats = JSON.parse(data);
					assert.strictEqual(stats.total, 2);
					assert.strictEqual(stats.pending, 2);
					assert.strictEqual(stats.processing, 0);
					assert.strictEqual(stats.completed, 0);
					done();
				});
			}).on('error', done);
		});

		test('POST /ai/queue/process should process next instruction', (done) => {
			// Enqueue test instruction
			aiQueue.enqueueInstruction('Test instruction', 'test', 'normal');

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue/process',
				method: 'POST'
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, true);
					done();
				});
			});

			req.on('error', done);
			req.end();
		});

		test('POST /ai/queue/process should return false when queue empty', (done) => {
			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue/process',
				method: 'POST'
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, false);
					assert.ok(response.message.includes('No pending'));
					done();
				});
			});

			req.on('error', done);
			req.end();
		});

		test('DELETE /ai/queue/:id should remove instruction', (done) => {
			// Enqueue test instruction
			const inst = aiQueue.enqueueInstruction('Test instruction', 'test', 'normal');

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: `/ai/queue/${inst.id}`,
				method: 'DELETE'
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, true);
					
					// Verify it's removed
					const remaining = aiQueue.getQueue();
					assert.strictEqual(remaining.length, 0);
					done();
				});
			});

			req.on('error', done);
			req.end();
		});

		test('DELETE /ai/queue/:id should return 404 for non-existent ID', (done) => {
			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue/non-existent-id',
				method: 'DELETE'
			}, (res) => {
				assert.strictEqual(res.statusCode, 404);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.end();
		});

		test('POST /ai/queue/clear should clear processed instructions', (done) => {
			// Enqueue and process instructions
			const inst1 = aiQueue.enqueueInstruction('Test 1', 'test');
			const inst2 = aiQueue.enqueueInstruction('Test 2', 'test');
			
			// Manually mark as completed
			const queue = aiQueue.getQueue();
			queue[0].status = 'completed';

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue/clear',
				method: 'POST'
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, true);
					assert.ok(response.message.includes('Cleared'));
					
					// Should only have pending items left
					const remaining = aiQueue.getQueue();
					assert.strictEqual(remaining.length, 1);
					assert.strictEqual(remaining[0].status, 'pending');
					done();
				});
			});

			req.on('error', done);
			req.end();
		});
	});

	suite('Task Endpoints', () => {
		test('GET /tasks should return tasks array', (done) => {
			http.get(`http://localhost:${testPort}/tasks`, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const tasks = JSON.parse(data);
					assert.ok(Array.isArray(tasks));
					done();
				});
			}).on('error', done);
		});

		test('POST /tasks should create new task', (done) => {
			const payload = JSON.stringify({
				title: 'Test task from API',
				description: 'Test description',
				category: 'feature'
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/tasks',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 201);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const task = JSON.parse(data);
					assert.strictEqual(task.title, 'Test task from API');
					assert.strictEqual(task.category, 'feature');
					assert.ok(task.id);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /tasks should reject empty title', (done) => {
			const payload = JSON.stringify({
				title: '',
				category: 'feature'
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/tasks',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /tasks should reject title over 200 chars', (done) => {
			const payload = JSON.stringify({
				title: 'a'.repeat(201),
				category: 'feature'
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/tasks',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					assert.ok(response.error.includes('too long'));
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /tasks should handle invalid JSON', (done) => {
			const payload = 'invalid json{';

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/tasks',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});
	});

	suite('Feedback Endpoint', () => {
		test('POST /feedback should accept valid feedback', (done) => {
			const payload = JSON.stringify({
				message: 'Test feedback message',
				context: { test: true }
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/feedback',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.strictEqual(response.success, true);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /feedback should reject empty message', (done) => {
			const payload = JSON.stringify({
				message: ''
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/feedback',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});

		test('POST /feedback should reject missing message field', (done) => {
			const payload = JSON.stringify({
				context: { test: true }
			});

			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/feedback',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {
				assert.strictEqual(res.statusCode, 400);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					done();
				});
			});

			req.on('error', done);
			req.write(payload);
			req.end();
		});
	});

	suite('Error Handling', () => {
		test('GET /unknown-endpoint should return 404', (done) => {
			http.get(`http://localhost:${testPort}/unknown-endpoint`, (res) => {
				assert.strictEqual(res.statusCode, 404);
				
				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => {
					const response = JSON.parse(data);
					assert.ok(response.error);
					assert.ok(response.message.includes('Unknown endpoint'));
					done();
				});
			}).on('error', done);
		});

		test('OPTIONS request should return 200 with CORS headers', (done) => {
			const req = http.request({
				hostname: 'localhost',
				port: testPort,
				path: '/ai/queue',
				method: 'OPTIONS'
			}, (res) => {
				assert.strictEqual(res.statusCode, 200);
				assert.ok(res.headers['access-control-allow-origin']);
				assert.ok(res.headers['access-control-allow-methods']);
				done();
			});

			req.on('error', done);
			req.end();
		});
	});
});
