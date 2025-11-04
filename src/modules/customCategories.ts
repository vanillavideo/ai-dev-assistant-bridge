/**
 * Custom Auto-Continue Categories Management Module
 * 
 * Handles CRUD operations for user-defined auto-continue categories
 */

import * as vscode from 'vscode';
import { CustomCategory, LogLevel } from './types';
import { log } from './logging';

/**
 * Get all custom categories from configuration
 */
export function getCustomCategories(): CustomCategory[] {
	const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
	return config.get<CustomCategory[]>('autoContinue.custom', []);
}

/**
 * Save custom categories to configuration
 */
export async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
	const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
	await config.update('autoContinue.custom', categories, vscode.ConfigurationTarget.Workspace);
	log(LogLevel.INFO, `Saved ${categories.length} custom categories`);
}

/**
 * Add a new custom category
 */
export async function addCustomCategory(category: Omit<CustomCategory, 'id' | 'enabled'>): Promise<CustomCategory> {
	const categories = getCustomCategories();
	
	const newCategory: CustomCategory = {
		id: generateId(),
		...category,
		enabled: true
	};
	
	categories.push(newCategory);
	await saveCustomCategories(categories);
	
	log(LogLevel.INFO, `Added custom category: ${newCategory.name}`);
	return newCategory;
}

/**
 * Update an existing custom category
 */
export async function updateCustomCategory(id: string, updates: Partial<Omit<CustomCategory, 'id'>>): Promise<void> {
	const categories = getCustomCategories();
	const index = categories.findIndex(c => c.id === id);
	
	if (index === -1) {
		throw new Error(`Custom category not found: ${id}`);
	}
	
	categories[index] = { ...categories[index], ...updates };
	await saveCustomCategories(categories);
	
	log(LogLevel.INFO, `Updated custom category: ${id}`);
}

/**
 * Delete a custom category
 */
export async function deleteCustomCategory(id: string): Promise<void> {
	const categories = getCustomCategories();
	const filtered = categories.filter(c => c.id !== id);
	
	if (filtered.length === categories.length) {
		throw new Error(`Custom category not found: ${id}`);
	}
	
	await saveCustomCategories(filtered);
	log(LogLevel.INFO, `Deleted custom category: ${id}`);
}

/**
 * Toggle enabled state of a custom category
 */
export async function toggleCustomCategory(id: string): Promise<void> {
	const categories = getCustomCategories();
	const category = categories.find(c => c.id === id);
	
	if (!category) {
		throw new Error(`Custom category not found: ${id}`);
	}
	
	await updateCustomCategory(id, { enabled: !category.enabled });
}

/**
 * Show UI to add a new custom category
 */
export async function showAddCustomCategoryDialog(): Promise<void> {
	const name = await vscode.window.showInputBox({
		prompt: 'Enter category name (e.g., "Security Review")',
		placeHolder: 'Category name',
		validateInput: (value) => {
			if (!value || value.trim().length === 0) {
				return 'Category name is required';
			}
			if (value.length > 50) {
				return 'Category name must be 50 characters or less';
			}
			return null;
		}
	});
	
	if (!name) {
		return;
	}
	
	const emoji = await vscode.window.showInputBox({
		prompt: 'Enter an emoji for this category (optional)',
		placeHolder: '🔒 (optional)',
		validateInput: (value) => {
			if (value && value.length > 4) {
				return 'Emoji should be a single character or short sequence';
			}
			return null;
		}
	});
	
	const message = await vscode.window.showInputBox({
		prompt: 'Enter the reminder message',
		placeHolder: 'Review code for security vulnerabilities',
		validateInput: (value) => {
			if (!value || value.trim().length === 0) {
				return 'Message is required';
			}
			if (value.length > 200) {
				return 'Message must be 200 characters or less';
			}
			return null;
		}
	});
	
	if (!message) {
		return;
	}
	
	const intervalInput = await vscode.window.showInputBox({
		prompt: 'Enter interval in seconds',
		placeHolder: '600',
		value: '600',
		validateInput: (value) => {
			const num = parseInt(value, 10);
			if (isNaN(num) || num < 60 || num > 86400) {
				return 'Interval must be between 60 and 86400 seconds (1 minute to 24 hours)';
			}
			return null;
		}
	});
	
	if (!intervalInput) {
		return;
	}
	
	const interval = parseInt(intervalInput, 10);
	
	try {
		await addCustomCategory({
			name: name.trim(),
			emoji: emoji?.trim() || undefined,
			message: message.trim(),
			interval
		});
		
		vscode.window.showInformationMessage(`Custom category "${name}" added successfully!`);
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to add custom category: ${error}`);
	}
}

/**
 * Show UI to manage custom categories
 */
export async function showManageCustomCategoriesDialog(): Promise<void> {
	const categories = getCustomCategories();
	
	if (categories.length === 0) {
		const action = await vscode.window.showInformationMessage(
			'No custom categories yet. Would you like to add one?',
			'Add Category',
			'Cancel'
		);
		
		if (action === 'Add Category') {
			await showAddCustomCategoryDialog();
		}
		return;
	}
	
	interface CategoryItem extends vscode.QuickPickItem {
		category: CustomCategory;
	}
	
	const items: CategoryItem[] = categories.map(cat => ({
		label: `${cat.emoji || '📌'} ${cat.name}`,
		description: `${cat.enabled ? '✓' : '✗'} ${cat.message} (${cat.interval}s)`,
		category: cat
	}));
	
	items.push({
		label: '$(add) Add New Category',
		description: 'Create a new custom auto-continue category',
		category: null as any
	});
	
	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select a custom category to manage'
	});
	
	if (!selected) {
		return;
	}
	
	if (!selected.category) {
		// Add new category
		await showAddCustomCategoryDialog();
		return;
	}
	
	// Show actions for selected category
	const actions = ['Toggle Enabled', 'Edit', 'Delete', 'Cancel'];
	const action = await vscode.window.showQuickPick(actions, {
		placeHolder: `Manage "${selected.category.name}"`
	});
	
	if (!action || action === 'Cancel') {
		return;
	}
	
	try {
		switch (action) {
			case 'Toggle Enabled':
				await toggleCustomCategory(selected.category.id);
				vscode.window.showInformationMessage(
					`Category "${selected.category.name}" ${selected.category.enabled ? 'disabled' : 'enabled'}`
				);
				break;
				
			case 'Edit':
				await showEditCustomCategoryDialog(selected.category);
				break;
				
			case 'Delete':
				const confirm = await vscode.window.showWarningMessage(
					`Delete custom category "${selected.category.name}"?`,
					{ modal: true },
					'Delete',
					'Cancel'
				);
				
				if (confirm === 'Delete') {
					await deleteCustomCategory(selected.category.id);
					vscode.window.showInformationMessage(`Category "${selected.category.name}" deleted`);
				}
				break;
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to manage category: ${error}`);
	}
}

/**
 * Show UI to edit a custom category
 */
export async function showEditCustomCategoryDialog(category: CustomCategory): Promise<void> {
	const field = await vscode.window.showQuickPick(
		['Name', 'Emoji', 'Message', 'Interval', 'Cancel'],
		{ placeHolder: 'What would you like to edit?' }
	);
	
	if (!field || field === 'Cancel') {
		return;
	}
	
	try {
		switch (field) {
			case 'Name':
				const name = await vscode.window.showInputBox({
					prompt: 'Enter new category name',
					value: category.name,
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Category name is required';
						}
						if (value.length > 50) {
							return 'Category name must be 50 characters or less';
						}
						return null;
					}
				});
				if (name) {
					await updateCustomCategory(category.id, { name: name.trim() });
					vscode.window.showInformationMessage('Category name updated');
				}
				break;
				
			case 'Emoji':
				const emoji = await vscode.window.showInputBox({
					prompt: 'Enter new emoji (leave empty to remove)',
					value: category.emoji || '',
					validateInput: (value) => {
						if (value && value.length > 4) {
							return 'Emoji should be a single character or short sequence';
						}
						return null;
					}
				});
				if (emoji !== undefined) {
					await updateCustomCategory(category.id, { emoji: emoji.trim() || undefined });
					vscode.window.showInformationMessage('Category emoji updated');
				}
				break;
				
			case 'Message':
				const message = await vscode.window.showInputBox({
					prompt: 'Enter new reminder message',
					value: category.message,
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Message is required';
						}
						if (value.length > 200) {
							return 'Message must be 200 characters or less';
						}
						return null;
					}
				});
				if (message) {
					await updateCustomCategory(category.id, { message: message.trim() });
					vscode.window.showInformationMessage('Category message updated');
				}
				break;
				
			case 'Interval':
				const intervalInput = await vscode.window.showInputBox({
					prompt: 'Enter new interval in seconds',
					value: category.interval.toString(),
					validateInput: (value) => {
						const num = parseInt(value, 10);
						if (isNaN(num) || num < 60 || num > 86400) {
							return 'Interval must be between 60 and 86400 seconds';
						}
						return null;
					}
				});
				if (intervalInput) {
					await updateCustomCategory(category.id, { interval: parseInt(intervalInput, 10) });
					vscode.window.showInformationMessage('Category interval updated');
				}
				break;
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to update category: ${error}`);
	}
}

/**
 * Generate a unique ID for a custom category
 */
function generateId(): string {
	return `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
