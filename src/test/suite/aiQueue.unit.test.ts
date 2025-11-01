/**
 * Unit tests for aiQueue - Pure logic, no VS Code window
 * These run FAST without spawning Electron!
 */

import * as assert from 'assert';
import * as aiQueue from '../../modules/aiQueue';

suite('AI Queue Unit Tests (Fast)', () => {
	setup(() => {
		aiQueue.clearQueue();
	});

	suite('Basic Queue Operations', () => {
		test('enqueue creates instruction with ID', () => {
			const inst = aiQueue.enqueueInstruction('test', 'source');
			assert.ok(inst.id);
			assert.strictEqual(inst.instruction, 'test');
		});

		test('getQueue returns all instructions', () => {
			aiQueue.enqueueInstruction('test1', 'source');
			aiQueue.enqueueInstruction('test2', 'source');
			const queue = aiQueue.getQueue();
			assert.strictEqual(queue.length, 2);
		});

		test('removeInstruction removes by ID', () => {
			const inst = aiQueue.enqueueInstruction('test', 'source');
			const removed = aiQueue.removeInstruction(inst.id);
			assert.strictEqual(removed, true);
			assert.strictEqual(aiQueue.getQueue().length, 0);
		});

		test('clearQueue removes all', () => {
			aiQueue.enqueueInstruction('test1', 'source');
			aiQueue.enqueueInstruction('test2', 'source');
			aiQueue.clearQueue();
			assert.strictEqual(aiQueue.getQueue().length, 0);
		});
	});

	suite('Priority Handling', () => {
		test('sorts by priority correctly', () => {
			aiQueue.enqueueInstruction('low', 'src', 'low');
			aiQueue.enqueueInstruction('urgent', 'src', 'urgent');
			aiQueue.enqueueInstruction('normal', 'src', 'normal');
			aiQueue.enqueueInstruction('high', 'src', 'high');
			
			const queue = aiQueue.getQueue();
			assert.strictEqual(queue[0].priority, 'urgent');
			assert.strictEqual(queue[1].priority, 'high');
			assert.strictEqual(queue[2].priority, 'normal');
			assert.strictEqual(queue[3].priority, 'low');
		});

		test('defaults to normal priority', () => {
			const inst = aiQueue.enqueueInstruction('test', 'src');
			assert.strictEqual(inst.priority, 'normal');
		});
	});

	suite('Queue Processing', () => {
		test('processNextInstruction marks completed on success', async () => {
			const inst = aiQueue.enqueueInstruction('test', 'src');
			await aiQueue.processNextInstruction(async () => true);
			
			const item = aiQueue.getInstruction(inst.id);
			assert.strictEqual(item?.status, 'completed');
		});

		test('processNextInstruction marks failed on error', async () => {
			const inst = aiQueue.enqueueInstruction('test', 'src');
			await aiQueue.processNextInstruction(async () => false);
			
			const item = aiQueue.getInstruction(inst.id);
			assert.strictEqual(item?.status, 'failed');
		});

		test('processNextInstruction returns false when empty', async () => {
			const result = await aiQueue.processNextInstruction(async () => true);
			assert.strictEqual(result, false);
		});

		test('processAllInstructions processes multiple items', async () => {
			aiQueue.enqueueInstruction('test1', 'src');
			aiQueue.enqueueInstruction('test2', 'src');
			aiQueue.enqueueInstruction('test3', 'src');
			
			await aiQueue.processAllInstructions(async () => true);
			
			const completed = aiQueue.getQueue('completed');
			assert.strictEqual(completed.length, 3);
		});

		test('processAllInstructions processes all regardless of failures', async () => {
			aiQueue.enqueueInstruction('test1', 'src');
			aiQueue.enqueueInstruction('test2', 'src');
			aiQueue.enqueueInstruction('test3', 'src');
			
			let callCount = 0;
			const processed = await aiQueue.processAllInstructions(async () => {
				callCount++;
				return callCount !== 2; // Fail on second
			});
			
			// All 3 get processed (returns 3), but statuses differ
			const completed = aiQueue.getQueue('completed');
			const failed = aiQueue.getQueue('failed');
			
			assert.strictEqual(processed, 3, 'Should process all 3');
			assert.strictEqual(completed.length, 2, 'Should have 2 completed');
			assert.strictEqual(failed.length, 1, 'Should have 1 failed');
		});
	});

	suite('Auto-process Mode', () => {
		test('setAutoProcess enables auto-processing', () => {
			aiQueue.setAutoProcess(true, async () => true);
			// Just verify it doesn't throw
			assert.ok(true);
			aiQueue.setAutoProcess(false); // Clean up
		});

		test('setAutoProcess with callback processes pending items', async function() {
			this.timeout(2000);
			
			aiQueue.enqueueInstruction('test', 'src');
			
			let processed = false;
			aiQueue.setAutoProcess(true, async () => {
				processed = true;
				return true;
			});
			
			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 600));
			
			aiQueue.setAutoProcess(false);
			assert.strictEqual(processed, true);
		});
	});

	suite('Queue Statistics', () => {
		test('getQueueStats returns correct counts', () => {
			aiQueue.enqueueInstruction('test1', 'src');
			aiQueue.enqueueInstruction('test2', 'src');
			const queue = aiQueue.getQueue();
			queue[0].status = 'completed';
			
			const stats = aiQueue.getQueueStats();
			assert.strictEqual(stats.total, 2);
			assert.strictEqual(stats.pending, 1);
			assert.strictEqual(stats.completed, 1);
		});

		test('getQueueStats handles empty queue', () => {
			const stats = aiQueue.getQueueStats();
			assert.strictEqual(stats.total, 0);
			assert.strictEqual(stats.pending, 0);
		});
	});

	suite('Clear Operations', () => {
		test('clearProcessed removes only completed/failed', () => {
			aiQueue.enqueueInstruction('test1', 'src');
			aiQueue.enqueueInstruction('test2', 'src');
			aiQueue.enqueueInstruction('test3', 'src');
			
			const queue = aiQueue.getQueue();
			queue[0].status = 'completed';
			queue[1].status = 'failed';
			// queue[2] stays pending
			
			aiQueue.clearProcessed();
			const remaining = aiQueue.getQueue();
			assert.strictEqual(remaining.length, 1);
			assert.strictEqual(remaining[0].status, 'pending');
		});
	});

	suite('Metadata Handling', () => {
		test('stores metadata with instruction', () => {
			const metadata = { key: 'value', number: 42 };
			const inst = aiQueue.enqueueInstruction('test', 'src', 'normal', metadata);
			assert.deepStrictEqual(inst.metadata, metadata);
		});

		test('retrieves instruction with metadata', () => {
			const metadata = { test: true };
			const inst = aiQueue.enqueueInstruction('test', 'src', 'normal', metadata);
			const retrieved = aiQueue.getInstruction(inst.id);
			assert.deepStrictEqual(retrieved?.metadata, metadata);
		});
	});

	suite('Edge Cases', () => {
		test('handles empty instruction text', () => {
			const inst = aiQueue.enqueueInstruction('', 'src');
			assert.strictEqual(inst.instruction, '');
		});

		test('handles very long instruction text', () => {
			const longText = 'a'.repeat(10000);
			const inst = aiQueue.enqueueInstruction(longText, 'src');
			assert.strictEqual(inst.instruction.length, 10000);
		});

		test('handles special characters in instruction', () => {
			const special = '!@#$%^&*()_+{}:"<>?[];\',./`~';
			const inst = aiQueue.enqueueInstruction(special, 'src');
			assert.strictEqual(inst.instruction, special);
		});

		test('getInstruction returns undefined for non-existent ID', () => {
			const item = aiQueue.getInstruction('non-existent-id');
			assert.strictEqual(item, undefined);
		});

		test('removeInstruction returns false for non-existent ID', () => {
			const removed = aiQueue.removeInstruction('non-existent-id');
			assert.strictEqual(removed, false);
		});
	});
});
