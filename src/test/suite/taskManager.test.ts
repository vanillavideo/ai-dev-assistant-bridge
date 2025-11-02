/**
 * TaskManager Module Tests
 * 
 * Tests for CRUD operations, validation, error handling, and edge cases
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as taskManager from '../../modules/taskManager';
import { Task } from '../../modules/types';

suite('TaskManager Module Tests', () => {
	let context: vscode.ExtensionContext;

	// Setup: Clear tasks before each test
	suiteSetup(async () => {
		// Get extension context
		const ext = vscode.extensions.getExtension('local.ai-dev-assistant-bridge');
		assert.ok(ext, 'Extension should be available');
		await ext.activate();
		context = (ext.exports as any)?.context || createMockContext();
	});

	setup(async () => {
		// Clear all tasks before each test
		await taskManager.clearCompletedTasks(context);
		const tasks = await taskManager.getTasks(context);
		for (const task of tasks) {
			await taskManager.removeTask(context, task.id);
		}
	});

	suite('getTasks', () => {
		test('should return empty array when no tasks exist', async () => {
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(Array.isArray(tasks), true);
			assert.strictEqual(tasks.length, 0);
		});

		test('should return array even with corrupted state', async () => {
			// Corrupt the state by setting non-array value
			await context.workspaceState.update('tasks', 'invalid' as any);
			
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(Array.isArray(tasks), true);
			assert.strictEqual(tasks.length, 0);
		});

		test('should handle storage read errors gracefully', async () => {
			// Create a context that throws an error on get
			const errorContext = {
				...context,
				workspaceState: {
					get: () => {
						throw new Error('Storage read error');
					},
					update: async () => {},
					keys: () => []
				}
			} as any;

			const tasks = await taskManager.getTasks(errorContext);
			assert.strictEqual(Array.isArray(tasks), true);
			assert.strictEqual(tasks.length, 0);
		});

		test('should return all added tasks', async () => {
			await taskManager.addTask(context, 'Task 1', 'Description 1', 'bug');
			await taskManager.addTask(context, 'Task 2', 'Description 2', 'feature');
			
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(tasks.length, 2);
			assert.strictEqual(tasks[0].title, 'Task 1');
			assert.strictEqual(tasks[1].title, 'Task 2');
		});
	});

	suite('addTask', () => {
		test('should add task with valid data', async () => {
			const task = await taskManager.addTask(context, 'Test Task', 'Test Description', 'bug');
			
			assert.ok(task);
			assert.strictEqual(task.title, 'Test Task');
			assert.strictEqual(task.description, 'Test Description');
			assert.strictEqual(task.category, 'bug');
			assert.strictEqual(task.status, 'pending');
			assert.ok(task.id);
			assert.ok(task.createdAt);
		});

		test('should trim whitespace from title and description', async () => {
			const task = await taskManager.addTask(context, '  Spaced Task  ', '  Spaced Desc  ', 'feature');
			
			assert.strictEqual(task.title, 'Spaced Task');
			assert.strictEqual(task.description, 'Spaced Desc');
		});

		test('should reject empty title', async () => {
			await assert.rejects(
				async () => await taskManager.addTask(context, '', 'Description', 'bug'),
				/Title cannot be empty/
			);
		});

		test('should reject whitespace-only title', async () => {
			await assert.rejects(
				async () => await taskManager.addTask(context, '   ', 'Description', 'bug'),
				/Title cannot be empty/
			);
		});

		test('should reject title longer than 200 characters', async () => {
			const longTitle = 'a'.repeat(201);
			await assert.rejects(
				async () => await taskManager.addTask(context, longTitle, 'Description', 'bug'),
				/Title cannot exceed 200 characters/
			);
		});

		test('should accept title exactly 200 characters', async () => {
			const title = 'a'.repeat(200);
			const task = await taskManager.addTask(context, title, 'Description', 'bug');
			assert.strictEqual(task.title.length, 200);
		});

		test('should reject description longer than 5000 characters', async () => {
			const longDesc = 'a'.repeat(5001);
			await assert.rejects(
				async () => await taskManager.addTask(context, 'Title', longDesc, 'bug'),
				/Description cannot exceed 5000 characters/
			);
		});

		test('should accept empty description', async () => {
			const task = await taskManager.addTask(context, 'Title', '', 'bug');
			assert.strictEqual(task.description, '');
		});

		test('should generate unique IDs for tasks', async () => {
			const task1 = await taskManager.addTask(context, 'Task 1', '', 'bug');
			// Add tiny delay to ensure different timestamp
			await new Promise(resolve => setTimeout(resolve, 2));
			const task2 = await taskManager.addTask(context, 'Task 2', '', 'feature');
			
			assert.notStrictEqual(task1.id, task2.id);
		});

		test('saveTasks should throw when provided non-array', async () => {
			await assert.rejects(async () => {
				await (taskManager as any).saveTasks(context, {} as any);
			}, /Tasks must be an array/);
		});
	});

	suite('updateTaskStatus', () => {
		test('should update task status', async () => {
			const task = await taskManager.addTask(context, 'Test Task', '', 'bug');
			await taskManager.updateTaskStatus(context, task.id, 'in-progress');
			
			const tasks = await taskManager.getTasks(context);
			const updated = tasks.find(t => t.id === task.id);
			assert.strictEqual(updated?.status, 'in-progress');
		});

		test('should update updatedAt timestamp when marked completed', async () => {
			const task = await taskManager.addTask(context, 'Test Task', '', 'bug');
			await taskManager.updateTaskStatus(context, task.id, 'completed');
			
			const tasks = await taskManager.getTasks(context);
			const completed = tasks.find(t => t.id === task.id);
			assert.ok(completed?.updatedAt);
			assert.strictEqual(completed?.status, 'completed');
		});

		test('should handle non-existent task ID gracefully', async () => {
			// Should not throw
			await taskManager.updateTaskStatus(context, 'non-existent-id', 'completed');
		});
	});

	suite('removeTask', () => {
		test('should remove task by ID', async () => {
			const task = await taskManager.addTask(context, 'Test Task', '', 'bug');
			await taskManager.removeTask(context, task.id);
			
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(tasks.length, 0);
		});

		test('should remove only specified task', async () => {
			const task1 = await taskManager.addTask(context, 'Task 1', '', 'bug');
			// Add tiny delay to ensure different IDs
			await new Promise(resolve => setTimeout(resolve, 2));
			const task2 = await taskManager.addTask(context, 'Task 2', '', 'feature');
			
			await taskManager.removeTask(context, task1.id);
			
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(tasks.length, 1);
			assert.strictEqual(tasks[0].id, task2.id);
		});

		test('should handle non-existent task ID gracefully', async () => {
			// Should not throw
			await taskManager.removeTask(context, 'non-existent-id');
		});
	});

	suite('clearCompletedTasks', () => {
		test('should remove only completed tasks', async () => {
			const task1 = await taskManager.addTask(context, 'Task 1', '', 'bug');
			await new Promise(resolve => setTimeout(resolve, 2));
			const task2 = await taskManager.addTask(context, 'Task 2', '', 'feature');
			await new Promise(resolve => setTimeout(resolve, 2));
			const task3 = await taskManager.addTask(context, 'Task 3', '', 'improvement');
			
			await taskManager.updateTaskStatus(context, task1.id, 'completed');
			await taskManager.updateTaskStatus(context, task2.id, 'in-progress');
			
			await taskManager.clearCompletedTasks(context);
			
			const tasks = await taskManager.getTasks(context);
			assert.strictEqual(tasks.length, 2);
			assert.ok(!tasks.find(t => t.id === task1.id));
			assert.ok(tasks.find(t => t.id === task2.id));
			assert.ok(tasks.find(t => t.id === task3.id));
		});
	});

	suite('updateTaskField', () => {
		test('should update task title', async () => {
			const task = await taskManager.addTask(context, 'Original Title', 'Description');
			
			await taskManager.updateTaskField(context, task.id, 'title', 'New Title');
			
			const tasks = await taskManager.getTasks(context);
			const updated = tasks.find(t => t.id === task.id);
			assert.strictEqual(updated?.title, 'New Title');
		});

		test('should update task description', async () => {
			const task = await taskManager.addTask(context, 'Title', 'Original Description');
			
			await taskManager.updateTaskField(context, task.id, 'description', 'New Description');
			
			const tasks = await taskManager.getTasks(context);
			const updated = tasks.find(t => t.id === task.id);
			assert.strictEqual(updated?.description, 'New Description');
		});

		test('should reject empty title (line 226-235 branches)', async () => {
			const task = await taskManager.addTask(context, 'Valid Title', 'Description');
			
			await assert.rejects(
				async () => await taskManager.updateTaskField(context, task.id, 'title', ''),
				/Invalid.*title/i
			);
		});

		test('should reject whitespace-only title', async () => {
			const task = await taskManager.addTask(context, 'Valid Title', 'Description');
			
			await assert.rejects(
				async () => await taskManager.updateTaskField(context, task.id, 'title', '   '),
				/Invalid.*title/i
			);
		});

		test('should reject title longer than 200 characters', async () => {
			const task = await taskManager.addTask(context, 'Valid Title', 'Description');
			const longTitle = 'x'.repeat(201);
			
			await assert.rejects(
				async () => await taskManager.updateTaskField(context, task.id, 'title', longTitle),
				/Invalid.*title/i
			);
		});

		test('should handle non-existent task gracefully', async () => {
			// Should not throw, just do nothing
			await taskManager.updateTaskField(context, 'non-existent-id', 'title', 'New Title');
			// No assertion needed, just verify it doesn't crash
		});
	});
});

/**
 * Create a mock extension context for testing
 */
function createMockContext(): vscode.ExtensionContext {
	const storage = new Map<string, any>();
	
	return {
		workspaceState: {
			get: (key: string) => storage.get(key),
			update: async (key: string, value: any) => { storage.set(key, value); },
			keys: () => Array.from(storage.keys())
		},
		subscriptions: [],
		extensionPath: '',
		extensionUri: vscode.Uri.file(''),
		environmentVariableCollection: {} as any,
		extensionMode: vscode.ExtensionMode.Test,
		globalState: {
			get: (key: string) => undefined,
			update: async (key: string, value: any) => {},
			keys: () => [],
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
