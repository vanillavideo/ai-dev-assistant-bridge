/**
 * Task Validation Unit Tests
 * 
 * Tests pure validation functions - No VS Code dependencies
 */

import * as assert from 'assert';
import {
	validateTaskTitle,
	validateTaskDescription,
	validateTaskCategory,
	validateTaskData,
	normalizeTaskData
} from '../../modules/taskValidation';

suite('Task Validation Unit Tests', () => {
	
	suite('validateTaskTitle', () => {
		test('should accept valid title', () => {
			const result = validateTaskTitle('Valid Task Title');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});

		test('should reject null title', () => {
			const result = validateTaskTitle(null);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title is required');
		});

		test('should reject undefined title', () => {
			const result = validateTaskTitle(undefined);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title is required');
		});

		test('should reject empty string title', () => {
			const result = validateTaskTitle('');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title cannot be empty');
		});

		test('should reject whitespace-only title', () => {
			const result = validateTaskTitle('   ');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title cannot be empty');
		});

		test('should accept title with leading/trailing whitespace', () => {
			const result = validateTaskTitle('  Valid Title  ');
			assert.strictEqual(result.valid, true);
		});

		test('should reject title exceeding 200 characters', () => {
			const longTitle = 'a'.repeat(201);
			const result = validateTaskTitle(longTitle);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title cannot exceed 200 characters');
		});

		test('should accept title with exactly 200 characters', () => {
			const maxTitle = 'a'.repeat(200);
			const result = validateTaskTitle(maxTitle);
			assert.strictEqual(result.valid, true);
		});

		test('should convert non-string to string', () => {
			const result = validateTaskTitle(123);
			assert.strictEqual(result.valid, true);
		});

		test('should accept title with special characters', () => {
			const result = validateTaskTitle('Task @#$% with symbols!');
			assert.strictEqual(result.valid, true);
		});
	});

	suite('validateTaskDescription', () => {
		test('should accept valid description', () => {
			const result = validateTaskDescription('Valid description');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});

		test('should accept null description (optional)', () => {
			const result = validateTaskDescription(null);
			assert.strictEqual(result.valid, true);
		});

		test('should accept undefined description (optional)', () => {
			const result = validateTaskDescription(undefined);
			assert.strictEqual(result.valid, true);
		});

		test('should accept empty string description', () => {
			const result = validateTaskDescription('');
			assert.strictEqual(result.valid, true);
		});

		test('should accept whitespace-only description', () => {
			const result = validateTaskDescription('   ');
			assert.strictEqual(result.valid, true);
		});

		test('should reject description exceeding 5000 characters', () => {
			const longDesc = 'a'.repeat(5001);
			const result = validateTaskDescription(longDesc);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Description cannot exceed 5000 characters');
		});

		test('should accept description with exactly 5000 characters', () => {
			const maxDesc = 'a'.repeat(5000);
			const result = validateTaskDescription(maxDesc);
			assert.strictEqual(result.valid, true);
		});

		test('should convert non-string to string', () => {
			const result = validateTaskDescription(12345);
			assert.strictEqual(result.valid, true);
		});

		test('should accept description with newlines', () => {
			const result = validateTaskDescription('Line 1\nLine 2\nLine 3');
			assert.strictEqual(result.valid, true);
		});

		test('should accept description with special characters', () => {
			const result = validateTaskDescription('Description with @#$% symbols!');
			assert.strictEqual(result.valid, true);
		});
	});

	suite('validateTaskCategory', () => {
		test('should accept valid category: bug', () => {
			const result = validateTaskCategory('bug');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid category: feature', () => {
			const result = validateTaskCategory('feature');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid category: improvement', () => {
			const result = validateTaskCategory('improvement');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid category: documentation', () => {
			const result = validateTaskCategory('documentation');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid category: test', () => {
			const result = validateTaskCategory('test');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid category: other', () => {
			const result = validateTaskCategory('other');
			assert.strictEqual(result.valid, true);
		});

		test('should accept null category (defaults to other)', () => {
			const result = validateTaskCategory(null);
			assert.strictEqual(result.valid, true);
		});

		test('should accept undefined category (defaults to other)', () => {
			const result = validateTaskCategory(undefined);
			assert.strictEqual(result.valid, true);
		});

		test('should accept empty string category (defaults to other)', () => {
			const result = validateTaskCategory('');
			assert.strictEqual(result.valid, true);
		});

		test('should accept uppercase category', () => {
			const result = validateTaskCategory('BUG');
			assert.strictEqual(result.valid, true);
		});

		test('should accept mixed case category', () => {
			const result = validateTaskCategory('Feature');
			assert.strictEqual(result.valid, true);
		});

		test('should accept category with whitespace', () => {
			const result = validateTaskCategory('  bug  ');
			assert.strictEqual(result.valid, true);
		});

		test('should reject invalid category', () => {
			const result = validateTaskCategory('invalid');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('Invalid category'));
		});

		test('should reject category with typo', () => {
			const result = validateTaskCategory('bugg');
			assert.strictEqual(result.valid, false);
		});
	});

	suite('validateTaskData', () => {
		test('should accept valid complete task data', () => {
			const result = validateTaskData('Task Title', 'Task description', 'bug');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid task with only title', () => {
			const result = validateTaskData('Task Title');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid task with title and description', () => {
			const result = validateTaskData('Task Title', 'Description');
			assert.strictEqual(result.valid, true);
		});

		test('should reject task with invalid title', () => {
			const result = validateTaskData('', 'Description', 'bug');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('empty'));
		});

		test('should reject task with title too long', () => {
			const longTitle = 'a'.repeat(201);
			const result = validateTaskData(longTitle, 'Description', 'bug');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('200 characters'));
		});

		test('should reject task with description too long', () => {
			const longDesc = 'a'.repeat(5001);
			const result = validateTaskData('Valid Title', longDesc, 'bug');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('5000 characters'));
		});

		test('should reject task with invalid category', () => {
			const result = validateTaskData('Valid Title', 'Description', 'invalid-cat');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('Invalid category'));
		});

		test('should accept task with null description', () => {
			const result = validateTaskData('Valid Title', null, 'bug');
			assert.strictEqual(result.valid, true);
		});

		test('should accept task with undefined category', () => {
			const result = validateTaskData('Valid Title', 'Description', undefined);
			assert.strictEqual(result.valid, true);
		});

		test('should return first validation error (title)', () => {
			const result = validateTaskData(null, 'x'.repeat(5001), 'invalid');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Title is required');
		});

		test('should return description error if title valid', () => {
			const longDesc = 'x'.repeat(5001);
			const result = validateTaskData('Valid', longDesc, 'invalid');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('5000 characters'));
		});

		test('should return category error if title and description valid', () => {
			const result = validateTaskData('Valid', 'Valid desc', 'invalid');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('Invalid category'));
		});
	});

	suite('normalizeTaskData', () => {
		test('should trim title', () => {
			const result = normalizeTaskData('  Task Title  ');
			assert.strictEqual(result.title, 'Task Title');
		});

		test('should trim description', () => {
			const result = normalizeTaskData('Title', '  Description  ');
			assert.strictEqual(result.description, 'Description');
		});

		test('should default description to empty string', () => {
			const result = normalizeTaskData('Title');
			assert.strictEqual(result.description, '');
		});

		test('should default category to other', () => {
			const result = normalizeTaskData('Title');
			assert.strictEqual(result.category, 'other');
		});

		test('should lowercase category', () => {
			const result = normalizeTaskData('Title', 'Desc', 'BUG');
			assert.strictEqual(result.category, 'bug');
		});

		test('should trim category', () => {
			const result = normalizeTaskData('Title', 'Desc', '  bug  ');
			assert.strictEqual(result.category, 'bug');
		});

		test('should handle undefined description', () => {
			const result = normalizeTaskData('Title', undefined, 'bug');
			assert.strictEqual(result.description, '');
		});

		test('should handle undefined category', () => {
			const result = normalizeTaskData('Title', 'Desc', undefined);
			assert.strictEqual(result.category, 'other');
		});

		test('should handle empty description', () => {
			const result = normalizeTaskData('Title', '', 'bug');
			assert.strictEqual(result.description, '');
		});

		test('should handle empty category', () => {
			const result = normalizeTaskData('Title', 'Desc', '');
			assert.strictEqual(result.category, 'other');
		});

		test('should preserve description newlines', () => {
			const result = normalizeTaskData('Title', 'Line 1\nLine 2');
			assert.ok(result.description.includes('\n'));
		});

		test('should normalize all fields together', () => {
			const result = normalizeTaskData('  Title  ', '  Description  ', '  FEATURE  ');
			assert.strictEqual(result.title, 'Title');
			assert.strictEqual(result.description, 'Description');
			assert.strictEqual(result.category, 'feature');
		});
	});
});
