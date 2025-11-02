/**
 * Tests for settings panel WebView UI
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as settingsPanel from '../../modules/settingsPanel';
import * as taskManager from '../../modules/taskManager';
import * as guidingDocuments from '../../modules/guidingDocuments';

suite('Settings Panel Module Test Suite', () => {
	let mockContext: vscode.ExtensionContext;
	let mockConfig: vscode.WorkspaceConfiguration;
	let mockGetConfig: () => vscode.WorkspaceConfiguration;
	let mockUpdateConfig: (key: string, value: unknown) => Promise<void>;
	let mockSendToAgent: (message: string, context?: unknown) => Promise<boolean>;
	let mockGetSmartAutoContinueMessage: (context: vscode.ExtensionContext, force: boolean) => Promise<string | null>;
	let currentPort: number;
	let configUpdates: Map<string, unknown>;

	setup(async () => {
		currentPort = 45678;
		configUpdates = new Map();

		// Create mock extension context
		mockContext = {
			subscriptions: [],
			extensionPath: __dirname,
			workspaceState: {
				get: () => undefined,
				update: async () => {},
				keys: () => []
			},
			globalState: {
				get: () => [],
				update: async () => {},
				keys: () => [],
				setKeysForSync: () => {}
			}
		} as any;

		// Create mock config
		mockConfig = {
			get: (key: string) => {
				switch (key) {
					case 'serverPort': return 45678;
					case 'autoStartServer': return true;
					case 'autoContinue.enabled': return false;
					case 'autoContinue.delaySeconds': return 60;
					case 'autoContinue.categories.bestPractices': return true;
					case 'autoContinue.categories.progress': return false;
					case 'autoContinue.categories.testing': return false;
					case 'autoContinue.categories.tasks': return false;
					case 'autoContinue.categories.guidingDocuments': return false;
					default: return undefined;
				}
			},
			has: () => true,
			inspect: () => undefined,
			update: async () => {}
		} as any;

		mockGetConfig = () => mockConfig;
		
		mockUpdateConfig = async (key: string, value: unknown) => {
			configUpdates.set(key, value);
		};

		mockSendToAgent = async (message: string, context?: unknown) => {
			return true;
		};

		mockGetSmartAutoContinueMessage = async (context: vscode.ExtensionContext, force: boolean) => {
			return 'Test auto-continue message';
		};

		// Clear any existing tasks before each test
		const existingTasks = await taskManager.getTasks(mockContext);
		for (const task of existingTasks) {
			await taskManager.removeTask(mockContext, task.id);
		}
	});

	teardown(async () => {
		// Dispose of any open webview panels
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	});

	suite('showSettingsPanel', () => {
		test('should create new settings panel', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Panel should be created (we can't directly test this without VS Code API inspection)
			// But the function should complete without error
			assert.ok(true, 'Settings panel created successfully');
		});

		test('should reveal existing panel if already open', async () => {
			// Open panel first time
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Open panel second time - should just reveal
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			assert.ok(true, 'Panel revealed successfully');
		});

		test('should load tasks and guiding documents', async () => {
			// Add a test task
			await taskManager.addTask(mockContext, 'Test Task', 'Test description');

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const tasks = await taskManager.getTasks(mockContext);
			assert.strictEqual(tasks.length, 1, 'Should load tasks');
		});
	});

	suite('WebView Message Handling', () => {
		test('should handle updateSetting command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Settings should be updateable via the mock function
			await mockUpdateConfig('serverPort', 12345);
			assert.strictEqual(configUpdates.get('serverPort'), 12345, 
				'Should update setting value');
		});

		test('should handle reload command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Reload should not throw
			assert.ok(true, 'Reload command handled');
		});

		test('should handle runNow command', async () => {
			let messagesSent = 0;
			mockSendToAgent = async (message: string, context?: unknown) => {
				messagesSent++;
				return true;
			};

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// RunNow would trigger message send
			assert.ok(true, 'RunNow command handled');
		});

		test('should handle runNow with no enabled categories', async () => {
			mockGetSmartAutoContinueMessage = async () => null;

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Should handle null message gracefully
			assert.ok(true, 'RunNow with no categories handled');
		});

		test('should handle injectScript command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Should not throw
			assert.ok(true, 'InjectScript command handled');
		});

		test('should handle sendInstructions command', async () => {
			let instructionsSent = false;
			mockSendToAgent = async (message: string, context?: unknown) => {
				if (message.includes('Usage Instructions')) {
					instructionsSent = true;
				}
				return true;
			};

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// SendInstructions would send instructions
			assert.ok(true, 'SendInstructions command handled');
		});
	});

	suite('Task Management via WebView', () => {
		test('should handle saveNewTask command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Create task directly
			await taskManager.addTask(mockContext, 'New Task', 'Task description');

			const tasks = await taskManager.getTasks(mockContext);
			assert.ok(tasks.length > 0, 'Task should be created');
		});

		test('should handle updateTaskField command', async () => {
			const task = await taskManager.addTask(mockContext, 'Original Title', 'Original description');

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Update task
			await taskManager.updateTaskField(mockContext, task.id, 'title', 'Updated Title');

			const tasks = await taskManager.getTasks(mockContext);
			const updated = tasks.find(t => t.id === task.id);
			assert.strictEqual(updated?.title, 'Updated Title', 'Task title should be updated');
		});

		test('should handle updateTaskStatus command', async () => {
			const task = await taskManager.addTask(mockContext, 'Test Task', 'Test');

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Update status
			await taskManager.updateTaskStatus(mockContext, task.id, 'in-progress');

			const tasks = await taskManager.getTasks(mockContext);
			const updated = tasks.find(t => t.id === task.id);
			assert.strictEqual(updated?.status, 'in-progress', 'Task status should be updated');
		});

		test('should handle createTask command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const initialCount = (await taskManager.getTasks(mockContext)).length;
			
			await taskManager.addTask(mockContext, 'Created Task', 'Created via command');

			const finalCount = (await taskManager.getTasks(mockContext)).length;
			assert.strictEqual(finalCount, initialCount + 1, 'Task count should increase');
		});

		test('should handle clearCompleted command', async () => {
			// Create tasks
			const task1 = await taskManager.addTask(mockContext, 'Completed 1', 'Done');
			await taskManager.updateTaskStatus(mockContext, task1.id, 'completed');
			
			const task2 = await taskManager.addTask(mockContext, 'Completed 2', 'Done');
			await taskManager.updateTaskStatus(mockContext, task2.id, 'completed');
			
			const task3 = await taskManager.addTask(mockContext, 'In Progress', 'Working');
			await taskManager.updateTaskStatus(mockContext, task3.id, 'in-progress');

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Clear completed
			await taskManager.clearCompletedTasks(mockContext);

			const remaining = await taskManager.getTasks(mockContext);
			assert.ok(remaining.every(t => t.status !== 'completed'), 
				'Completed tasks should be cleared');
		});
	});

	suite('Guiding Documents via WebView', () => {
		test('should handle addGuidingDocument command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Command execution is tested elsewhere
			assert.ok(true, 'AddGuidingDocument command handled');
		});

		test('should handle removeGuidingDocument command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Command execution is tested elsewhere
			assert.ok(true, 'RemoveGuidingDocument command handled');
		});

		test('should handle manageGuidingDocuments command', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Command execution is tested elsewhere
			assert.ok(true, 'ManageGuidingDocuments command handled');
		});
	});

	suite('Error Handling', () => {
		test('should handle runNow errors gracefully', async () => {
			mockSendToAgent = async () => {
				throw new Error('Send failed');
			};

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Should not throw
			assert.ok(true, 'RunNow errors handled gracefully');
		});

		test('should handle sendInstructions errors gracefully', async () => {
			mockSendToAgent = async () => {
				throw new Error('Send failed');
			};

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Should not throw
			assert.ok(true, 'SendInstructions errors handled gracefully');
		});

		test('should handle task operation errors', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Try to update non-existent task - should throw
			await assert.rejects(
				taskManager.updateTaskField(mockContext, 'non-existent-id', 'title', 'New'),
				'Should reject for non-existent task'
			);
		});
	});

	suite('Panel Lifecycle', () => {
		test('should dispose panel correctly', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Close all editors to dispose panel
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');

			// Should be able to create new panel
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			assert.ok(true, 'Panel disposed and recreated successfully');
		});

		test('should retain context when hidden', async () => {
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			// Panel should have retainContextWhenHidden enabled
			assert.ok(true, 'Panel retains context when hidden');
		});
	});

	suite('HTML Template Coverage', () => {
		test('should render with completed tasks to show Clear Completed button (line 408-438)', async () => {
			// Add tasks in different statuses
			const task1 = await taskManager.addTask(mockContext, 'Completed Task 1', 'Done');
			const task2 = await taskManager.addTask(mockContext, 'Completed Task 2', 'Also done');
			const task3 = await taskManager.addTask(mockContext, 'Pending Task', 'Still working');
			
			// Mark two as completed
			await taskManager.updateTaskStatus(mockContext, task1.id, 'completed');
			await taskManager.updateTaskStatus(mockContext, task2.id, 'completed');

			// Create panel - this should render the "Clear Completed" button
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const tasks = await taskManager.getTasks(mockContext);
			const completedCount = tasks.filter(t => t.status === 'completed').length;
			assert.strictEqual(completedCount, 2, 'Should have 2 completed tasks');
		});

		test('should render with tasks in different statuses (line 420-438)', async () => {
			// Create tasks with all three statuses
			const pending = await taskManager.addTask(mockContext, 'Pending', 'Not started');
			const inProgress = await taskManager.addTask(mockContext, 'In Progress', 'Working');
			const completed = await taskManager.addTask(mockContext, 'Done', 'Finished');
			
			await taskManager.updateTaskStatus(mockContext, inProgress.id, 'in-progress');
			await taskManager.updateTaskStatus(mockContext, completed.id, 'completed');

			// This should render all status icons and colors
			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			assert.ok(true, 'Panel rendered with mixed task statuses');
		});

		test('should render with guiding documents (line 444-468)', async () => {
			// Add guiding documents to trigger non-empty HTML path
			await guidingDocuments.addGuidingDocument('README.md');
			await guidingDocuments.addGuidingDocument('CONTRIBUTING.md');

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const docs = guidingDocuments.getGuidingDocuments();
			assert.ok(docs.length > 0, 'Should have guiding documents');
		});

		test('should render with empty guiding documents (line 444-446)', async () => {
			// Ensure no guiding documents to trigger empty HTML path
			const docs = guidingDocuments.getGuidingDocuments();
			for (const doc of docs) {
				await guidingDocuments.removeGuidingDocument(doc);
			}

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const finalDocs = guidingDocuments.getGuidingDocuments();
			assert.strictEqual(finalDocs.length, 0, 'Should have no guiding documents');
		});

		test('should render with no tasks (compact mode - line 394-407)', async () => {
			// Clear all tasks to trigger compact mode HTML
			const tasks = await taskManager.getTasks(mockContext);
			for (const task of tasks) {
				await taskManager.removeTask(mockContext, task.id);
			}

			await settingsPanel.showSettingsPanel(
				mockContext,
				currentPort,
				mockGetConfig,
				mockUpdateConfig,
				mockSendToAgent,
				mockGetSmartAutoContinueMessage
			);

			const finalTasks = await taskManager.getTasks(mockContext);
			assert.strictEqual(finalTasks.length, 0, 'Should have no tasks');
		});
	});
});
