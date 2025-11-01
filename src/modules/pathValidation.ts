/**
 * Path Validation Module
 * 
 * Pure validation functions for file paths.
 * No VS Code API or file system dependencies - fully unit testable.
 */

/**
 * Validation result interface
 */
export interface PathValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate if a path string is valid
 * 
 * @param filePath - Path to validate
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @remarks
 * Validation rules:
 * - Cannot be null or undefined
 * - Cannot be empty after trimming
 * - Cannot contain only whitespace
 * - Cannot contain invalid characters (?, *, |, <, >, ")
 * - Cannot be just a dot or double dot
 * 
 * @example
 * ```typescript
 * const result = validatePath('/path/to/file.md');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePath(filePath: unknown): PathValidationResult {
	// Check if path is provided
	if (filePath === null || filePath === undefined) {
		return { valid: false, error: 'Path is required' };
	}
	
	// Convert to string and trim
	const pathStr = String(filePath).trim();
	
	// Check if empty after trimming
	if (pathStr.length === 0) {
		return { valid: false, error: 'Path cannot be empty' };
	}
	
	// Check for relative path shortcuts
	if (pathStr === '.' || pathStr === '..') {
		return { valid: false, error: 'Path cannot be just "." or ".."' };
	}
	
	// Check for invalid characters (Windows + Unix)
	const invalidChars = /[*?"|<>]/;
	if (invalidChars.test(pathStr)) {
		return { valid: false, error: 'Path contains invalid characters (*, ?, ", |, <, >)' };
	}
	
	return { valid: true };
}

/**
 * Validate if a path looks like an absolute path
 * 
 * @param filePath - Path to check
 * @returns ValidationResult
 * 
 * @remarks
 * Checks for:
 * - Unix absolute paths (start with /)
 * - Windows absolute paths (start with drive letter like C:)
 * - UNC paths (start with \\)
 * 
 * @example
 * ```typescript
 * validateAbsolutePath('/usr/local/file.md');  // valid: true
 * validateAbsolutePath('C:\\Users\\file.md');  // valid: true
 * validateAbsolutePath('relative/path.md');    // valid: false
 * ```
 */
export function validateAbsolutePath(filePath: string): PathValidationResult {
	// First validate it's a valid path
	const pathCheck = validatePath(filePath);
	if (!pathCheck.valid) {
		return pathCheck;
	}
	
	const pathStr = filePath.trim();
	
	// Check for Unix absolute path (starts with /)
	if (pathStr.startsWith('/')) {
		return { valid: true };
	}
	
	// Check for Windows absolute path (starts with drive letter)
	if (/^[a-zA-Z]:[\\/]/.test(pathStr)) {
		return { valid: true };
	}
	
	// Check for UNC path (starts with \\)
	if (pathStr.startsWith('\\\\')) {
		return { valid: true };
	}
	
	return { valid: false, error: 'Path must be absolute (start with /, drive letter, or \\\\)' };
}

/**
 * Validate if a path looks like a relative path
 * 
 * @param filePath - Path to check
 * @returns ValidationResult
 * 
 * @remarks
 * A relative path is any valid path that is NOT absolute
 * 
 * @example
 * ```typescript
 * validateRelativePath('docs/README.md');    // valid: true
 * validateRelativePath('./config.json');     // valid: true
 * validateRelativePath('/absolute/path');    // valid: false
 * ```
 */
export function validateRelativePath(filePath: string): PathValidationResult {
	// First validate it's a valid path
	const pathCheck = validatePath(filePath);
	if (!pathCheck.valid) {
		return pathCheck;
	}
	
	// Check if it's NOT absolute
	const absoluteCheck = validateAbsolutePath(filePath);
	if (absoluteCheck.valid) {
		return { valid: false, error: 'Path must be relative (not absolute)' };
	}
	
	return { valid: true };
}

/**
 * Validate file extension
 * 
 * @param filePath - Path to validate
 * @param allowedExtensions - Array of allowed extensions (with or without dot)
 * @returns ValidationResult
 * 
 * @remarks
 * - Case-insensitive matching
 * - Extensions can be provided with or without leading dot
 * - Empty allowedExtensions array means any extension is valid
 * 
 * @example
 * ```typescript
 * validateFileExtension('file.md', ['.md', '.txt']);     // valid: true
 * validateFileExtension('file.MD', ['md', 'txt']);       // valid: true (case-insensitive)
 * validateFileExtension('file.pdf', ['.md', '.txt']);    // valid: false
 * validateFileExtension('file.txt', []);                 // valid: true (any extension)
 * ```
 */
export function validateFileExtension(
	filePath: string, 
	allowedExtensions: string[]
): PathValidationResult {
	// First validate it's a valid path
	const pathCheck = validatePath(filePath);
	if (!pathCheck.valid) {
		return pathCheck;
	}
	
	// If no extensions specified, any is valid
	if (allowedExtensions.length === 0) {
		return { valid: true };
	}
	
	const pathStr = filePath.trim();
	
	// Extract extension (everything after last dot)
	const lastDot = pathStr.lastIndexOf('.');
	if (lastDot === -1) {
		return { valid: false, error: 'File has no extension' };
	}
	
	const ext = pathStr.substring(lastDot).toLowerCase();
	
	// Normalize allowed extensions (add dot if missing, lowercase)
	const normalizedAllowed = allowedExtensions.map(e => {
		const normalized = e.trim().toLowerCase();
		return normalized.startsWith('.') ? normalized : `.${normalized}`;
	});
	
	if (!normalizedAllowed.includes(ext)) {
		return { 
			valid: false, 
			error: `File extension must be one of: ${normalizedAllowed.join(', ')}` 
		};
	}
	
	return { valid: true };
}

/**
 * Normalize a path string
 * 
 * @param filePath - Path to normalize
 * @returns Normalized path string
 * 
 * @remarks
 * - Trims whitespace
 * - Converts backslashes to forward slashes
 * - Removes duplicate slashes
 * - Does NOT resolve relative paths (use path.resolve for that)
 * 
 * @example
 * ```typescript
 * normalizePath('  C:\\Users\\file.txt  ');   // 'C:/Users/file.txt'
 * normalizePath('path//to///file.md');        // 'path/to/file.md'
 * ```
 */
export function normalizePath(filePath: string): string {
	return filePath
		.trim()
		.replace(/\\/g, '/')           // Convert backslashes to forward slashes
		.replace(/\/+/g, '/');         // Remove duplicate slashes
}
