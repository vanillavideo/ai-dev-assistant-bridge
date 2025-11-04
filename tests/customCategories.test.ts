/**
 * Custom Categories Module Tests
 * 
 * Integration tests for custom auto-continue category management
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	getCustomCategories,
	saveCustomCategories,
	addCustomCategory,
	updateCustomCategory,
	deleteCustomCategory,
	toggleCustomCategory
} from '../src/modules/customCategories';
import { CustomCategory } from '../src/modules/types';

suite('Custom Categories Module Tests', () => {
	let originalConfig: CustomCategory[];

	suiteSetup(async () => {
		// Ensure extension is activated
		const ext = vscode.extensions.getExtension('local.ai-dev-assistant-bridge');
		if (ext && !ext.isActive) {
			await ext.activate();
		}
	});

	setup(async () => {
		// Save original custom categories
		originalConfig = getCustomCategories();
		
		// Clear custom categories before each test
		await saveCustomCategories([]);
	});

	teardown(async () => {
		// Restore original categories
		await saveCustomCategories(originalConfig);
	});

	suite('getCustomCategories', () => {
		test('should return empty array when no categories exist', () => {
			const categories = getCustomCategories();
			assert.strictEqual(Array.isArray(categories), true);
			assert.strictEqual(categories.length, 0);
		});

		test('should return all saved categories', async () => {
			const testCategories: CustomCategory[] = [
				{ id: 'cat-1', name: 'Test Cat 1', message: 'Desc 1', interval: 300, enabled: true },
				{ id: 'cat-2', name: 'Test Cat 2', message: 'Desc 2', interval: 600, enabled: false }
			];
			await saveCustomCategories(testCategories);

			const categories = getCustomCategories();
			assert.strictEqual(categories.length, 2);
			assert.strictEqual(categories[0].name, 'Test Cat 1');
			assert.strictEqual(categories[1].name, 'Test Cat 2');
		});
	});

	suite('saveCustomCategories', () => {
		test('should save categories to configuration', async () => {
			const testCategories: CustomCategory[] = [
				{ id: 'cat-1', name: 'Test', message: 'Test desc', interval: 300, enabled: true }
			];

			await saveCustomCategories(testCategories);
			
			const saved = getCustomCategories();
			assert.strictEqual(saved.length, 1);
			assert.strictEqual(saved[0].id, 'cat-1');
			assert.strictEqual(saved[0].name, 'Test');
		});

		test('should save empty array', async () => {
			await saveCustomCategories([]);
			
			const saved = getCustomCategories();
			assert.strictEqual(saved.length, 0);
		});
	});

	suite('addCustomCategory', () => {
		test('should add new category with generated ID', async () => {
			const newCategory = await addCustomCategory({
				name: 'New Category',
				message: 'New Description',
				interval: 300
			});

			assert.ok(newCategory.id);
			assert.strictEqual(newCategory.name, 'New Category');
			assert.strictEqual(newCategory.message, 'New Description');
			assert.strictEqual(newCategory.interval, 300);
			assert.strictEqual(newCategory.enabled, true);

			const categories = getCustomCategories();
			assert.strictEqual(categories.length, 1);
		});

		test('should add multiple categories with unique IDs', async () => {
			const cat1 = await addCustomCategory({
				name: 'Cat 1',
				message: 'Desc 1',
				interval: 300
			});

			const cat2 = await addCustomCategory({
				name: 'Cat 2',
				message: 'Desc 2',
				interval: 600
			});

			assert.notStrictEqual(cat1.id, cat2.id);

			const categories = getCustomCategories();
			assert.strictEqual(categories.length, 2);
		});
	});

	suite('updateCustomCategory', () => {
		test('should update existing category', async () => {
			const added = await addCustomCategory({
				name: 'Original',
				message: 'Original desc',
				interval: 300
			});

			await updateCustomCategory(added.id, {
				name: 'Updated',
				message: 'Updated desc'
			});

			const categories = getCustomCategories();
			assert.strictEqual(categories[0].name, 'Updated');
			assert.strictEqual(categories[0].message, 'Updated desc');
			assert.strictEqual(categories[0].interval, 300); // Unchanged
		});

		test('should update only specified fields', async () => {
			const added = await addCustomCategory({
				name: 'Original',
				message: 'Original desc',
				interval: 300
			});

			await updateCustomCategory(added.id, {
				interval: 600
			});

			const categories = getCustomCategories();
			assert.strictEqual(categories[0].name, 'Original'); // Unchanged
			assert.strictEqual(categories[0].interval, 600); // Changed
		});

		test('should throw error when category not found', async () => {
			await assert.rejects(
				async () => await updateCustomCategory('nonexistent', { name: 'Test' }),
				/Custom category not found: nonexistent/
			);
		});
	});

	suite('deleteCustomCategory', () => {
		test('should delete existing category', async () => {
			const added = await addCustomCategory({
				name: 'To Delete',
				message: 'Will be deleted',
				interval: 300
			});

			await deleteCustomCategory(added.id);

			const categories = getCustomCategories();
			assert.strictEqual(categories.length, 0);
		});

		test('should throw error when category not found', async () => {
			await assert.rejects(
				async () => await deleteCustomCategory('nonexistent'),
				/Custom category not found: nonexistent/
			);
		});

		test('should delete correct category from multiple', async () => {
			const cat1 = await addCustomCategory({
				name: 'Cat 1',
				message: 'Keep',
				interval: 300
			});

			const cat2 = await addCustomCategory({
				name: 'Cat 2',
				message: 'Delete',
				interval: 600
			});

			await deleteCustomCategory(cat2.id);

			const categories = getCustomCategories();
			assert.strictEqual(categories.length, 1);
			assert.strictEqual(categories[0].id, cat1.id);
		});
	});

	suite('toggleCustomCategory', () => {
		test('should toggle enabled state from true to false', async () => {
			const added = await addCustomCategory({
				name: 'Toggle Test',
				message: 'Test toggle',
				interval: 300
			});

			// Default is enabled
			assert.strictEqual(added.enabled, true);

			await toggleCustomCategory(added.id);

			const categories = getCustomCategories();
			assert.strictEqual(categories[0].enabled, false);
		});

		test('should toggle enabled state from false to true', async () => {
			const added = await addCustomCategory({
				name: 'Toggle Test',
				message: 'Test toggle',
				interval: 300
			});

			// Toggle to false
			await toggleCustomCategory(added.id);

			// Toggle back to true
			await toggleCustomCategory(added.id);

			const categories = getCustomCategories();
			assert.strictEqual(categories[0].enabled, true);
		});

		test('should throw error when category not found', async () => {
			await assert.rejects(
				async () => await toggleCustomCategory('nonexistent'),
				/Custom category not found: nonexistent/
			);
		});
	});
});
