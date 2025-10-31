/**
 * Task management module
 */
import * as vscode from 'vscode';
import { Task } from './types';

/**
 * Get all tasks from workspace state
 */
export async function getTasks(context: vscode.ExtensionContext): Promise<Task[]> {
	try {
		const tasks = context.workspaceState.get<Task[]>('tasks', []);
		// Validate tasks array
		if (!Array.isArray(tasks)) {
			console.error('Invalid tasks data in workspace state, resetting to empty array');
			await context.workspaceState.update('tasks', []);
			return [];
		}
		return tasks;
	} catch (error) {
		console.error('Error reading tasks from workspace state:', error);
		return [];
	}
}

/**
 * Save tasks to workspace state
 */
export async function saveTasks(context: vscode.ExtensionContext, tasks: Task[]): Promise<void> {
	try {
		if (!Array.isArray(tasks)) {
			throw new Error('Tasks must be an array');
		}
		await context.workspaceState.update('tasks', tasks);
	} catch (error) {
		console.error('Error saving tasks to workspace state:', error);
		throw error;
	}
}

/**
 * Add a new task
 */
export async function addTask(
	context: vscode.ExtensionContext,
	title: string,
	description: string = '',
	category: Task['category'] = 'other'
): Promise<Task> {
	// Validate inputs
	if (!title || typeof title !== 'string' || title.trim().length === 0) {
		throw new Error('Task title is required and must be a non-empty string');
	}
	if (title.length > 200) {
		throw new Error('Task title too long (max 200 characters)');
	}
	if (typeof description !== 'string') {
		throw new Error('Task description must be a string');
	}
	if (description.length > 5000) {
		throw new Error('Task description too long (max 5000 characters)');
	}

	const tasks = await getTasks(context);
	const newTask: Task = {
		id: Date.now().toString(),
		title: title.trim(),
		description: description.trim(),
		status: 'pending',
		category,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	tasks.push(newTask);
	await saveTasks(context, tasks);
	return newTask;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
	context: vscode.ExtensionContext,
	taskId: string,
	status: Task['status']
): Promise<void> {
	const tasks = await getTasks(context);
	const task = tasks.find(t => t.id === taskId);
	if (task) {
		task.status = status;
		task.updatedAt = new Date().toISOString();
		await saveTasks(context, tasks);
	}
}

/**
 * Remove a task
 */
export async function removeTask(context: vscode.ExtensionContext, taskId: string): Promise<void> {
	const tasks = await getTasks(context);
	const filtered = tasks.filter(t => t.id !== taskId);
	await saveTasks(context, filtered);
}

/**
 * Update a task field (title or description)
 */
export async function updateTaskField(
	context: vscode.ExtensionContext,
	taskId: string,
	field: 'title' | 'description',
	value: string
): Promise<void> {
	const tasks = await getTasks(context);
	const task = tasks.find(t => t.id === taskId);
	if (task) {
		task[field] = value;
		task.updatedAt = new Date().toISOString();
		await saveTasks(context, tasks);
	}
}

/**
 * Clear completed tasks
 */
export async function clearCompletedTasks(context: vscode.ExtensionContext): Promise<number> {
	const tasks = await getTasks(context);
	const activeTasks = tasks.filter(t => t.status !== 'completed');
	const clearedCount = tasks.length - activeTasks.length;
	await saveTasks(context, activeTasks);
	return clearedCount;
}
