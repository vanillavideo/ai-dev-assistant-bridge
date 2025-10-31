/**
 * Task management module
 */
import * as vscode from 'vscode';
import { Task } from './types';

/**
 * Get all tasks from workspace state
 */
export async function getTasks(context: vscode.ExtensionContext): Promise<Task[]> {
	return context.workspaceState.get<Task[]>('tasks', []);
}

/**
 * Save tasks to workspace state
 */
export async function saveTasks(context: vscode.ExtensionContext, tasks: Task[]): Promise<void> {
	await context.workspaceState.update('tasks', tasks);
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
	const tasks = await getTasks(context);
	const newTask: Task = {
		id: Date.now().toString(),
		title,
		description,
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
