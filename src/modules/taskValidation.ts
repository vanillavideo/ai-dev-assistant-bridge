/**
 * Task Validation Module
 * 
 * Pure validation functions for task data.
 * No VS Code API dependencies - fully unit testable.
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate task title
 * 
 * @param title - Title to validate
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @remarks
 * Validation rules:
 * - Required: Cannot be null, undefined, or empty after trimming
 * - Maximum length: 200 characters after trimming
 * - Automatically trims whitespace for validation
 * 
 * @example
 * ```typescript
 * const result = validateTaskTitle('  My Task  ');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateTaskTitle(title: unknown): ValidationResult {
	// Check if title is provided
	if (title === null || title === undefined) {
		return { valid: false, error: 'Title is required' };
	}
	
	// Convert to string and trim
	const titleStr = String(title).trim();
	
	// Check if empty after trimming
	if (titleStr.length === 0) {
		return { valid: false, error: 'Title cannot be empty' };
	}
	
	// Check maximum length
	if (titleStr.length > 200) {
		return { valid: false, error: 'Title cannot exceed 200 characters' };
	}
	
	return { valid: true };
}

/**
 * Validate task description
 * 
 * @param description - Description to validate
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @remarks
 * Validation rules:
 * - Optional: Can be null, undefined, or empty
 * - Maximum length: 5000 characters after trimming
 * - Automatically trims whitespace for validation
 * 
 * @example
 * ```typescript
 * const result = validateTaskDescription('  Description  ');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateTaskDescription(description: unknown): ValidationResult {
	// Description is optional - null/undefined is valid
	if (description === null || description === undefined) {
		return { valid: true };
	}
	
	// Convert to string and trim
	const descStr = String(description).trim();
	
	// Empty string is valid (optional field)
	if (descStr.length === 0) {
		return { valid: true };
	}
	
	// Check maximum length
	if (descStr.length > 5000) {
		return { valid: false, error: 'Description cannot exceed 5000 characters' };
	}
	
	return { valid: true };
}

/**
 * Validate task category
 * 
 * @param category - Category to validate
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @remarks
 * Validation rules:
 * - Optional: Can be null, undefined, or empty (defaults to 'other')
 * - Allowed values: 'bug', 'feature', 'improvement', 'documentation', 'test', 'other'
 * - Case-insensitive matching
 * 
 * @example
 * ```typescript
 * const result = validateTaskCategory('BUG');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateTaskCategory(category: unknown): ValidationResult {
	// Category is optional - null/undefined/empty defaults to 'other'
	if (category === null || category === undefined || category === '') {
		return { valid: true };
	}
	
	// Convert to lowercase string for comparison
	const categoryStr = String(category).toLowerCase().trim();
	
	// Check if it's a valid category
	const validCategories = ['bug', 'feature', 'improvement', 'documentation', 'test', 'other'];
	if (!validCategories.includes(categoryStr)) {
		return { 
			valid: false, 
			error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
		};
	}
	
	return { valid: true };
}

/**
 * Validate complete task data
 * 
 * @param title - Task title
 * @param description - Task description (optional)
 * @param category - Task category (optional)
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @remarks
 * Combines all validation rules:
 * - Title is required and must be valid
 * - Description is optional but must be valid if provided
 * - Category is optional but must be valid if provided
 * - Returns first validation error encountered
 * 
 * @example
 * ```typescript
 * const result = validateTaskData('My Task', 'Description', 'bug');
 * if (result.valid) {
 *   // Proceed with task creation
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateTaskData(
	title: unknown, 
	description?: unknown, 
	category?: unknown
): ValidationResult {
	// Validate title first (required)
	const titleResult = validateTaskTitle(title);
	if (!titleResult.valid) {
		return titleResult;
	}
	
	// Validate description (optional)
	const descResult = validateTaskDescription(description);
	if (!descResult.valid) {
		return descResult;
	}
	
	// Validate category (optional)
	const catResult = validateTaskCategory(category);
	if (!catResult.valid) {
		return catResult;
	}
	
	return { valid: true };
}

/**
 * Normalize task data by trimming whitespace and setting defaults
 * 
 * @param title - Task title (will be trimmed)
 * @param description - Task description (will be trimmed, defaults to empty)
 * @param category - Task category (will be normalized, defaults to 'other')
 * @returns Normalized task data object
 * 
 * @remarks
 * - Trims whitespace from all string fields
 * - Sets default values for optional fields
 * - Normalizes category to lowercase
 * - Should be called AFTER validation
 * 
 * @example
 * ```typescript
 * const normalized = normalizeTaskData('  My Task  ', '  Desc  ', 'BUG');
 * // Result: { title: 'My Task', description: 'Desc', category: 'bug' }
 * ```
 */
export function normalizeTaskData(
	title: string, 
	description?: string, 
	category?: string
): { title: string; description: string; category: string } {
	return {
		title: title.trim(),
		description: (description || '').trim(),
		category: (category || 'other').toLowerCase().trim()
	};
}
