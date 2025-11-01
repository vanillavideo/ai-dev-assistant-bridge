/**
 * Number Validation Module
 * 
 * Pure validation functions for numeric input validation and range checking.
 * Used across the extension for port numbers, intervals, and other numeric config.
 * 
 * All validation functions return ValidationResult with consistent structure:
 * - valid: boolean indicating if validation passed
 * - error?: string with specific error message if invalid
 */

/**
 * Result of a validation operation
 */
export interface ValidationResult {
	/** True if validation passed, false otherwise */
	valid: boolean;
	/** Error message if validation failed, undefined if valid */
	error?: string;
}

/**
 * Validate that a value is a safe integer
 * 
 * @param value - Value to validate (can be any type)
 * @returns ValidationResult with valid=true if value is a safe integer
 * 
 * @remarks
 * - Checks Number.isInteger() for integer validation
 * - Rejects NaN, Infinity, and non-numeric values
 * - Accepts negative integers
 * - Uses JavaScript's Number.MIN_SAFE_INTEGER and Number.MAX_SAFE_INTEGER limits
 * 
 * @example
 * ```typescript
 * const result = validateInteger(42);
 * // { valid: true }
 * 
 * const result2 = validateInteger(3.14);
 * // { valid: false, error: 'Value must be an integer' }
 * 
 * const result3 = validateInteger('hello');
 * // { valid: false, error: 'Value must be a number' }
 * ```
 */
export function validateInteger(value: unknown): ValidationResult {
	if (typeof value !== 'number') {
		return { valid: false, error: 'Value must be a number' };
	}
	
	if (isNaN(value)) {
		return { valid: false, error: 'Value cannot be NaN' };
	}
	
	if (!isFinite(value)) {
		return { valid: false, error: 'Value must be finite' };
	}
	
	if (!Number.isInteger(value)) {
		return { valid: false, error: 'Value must be an integer' };
	}
	
	return { valid: true };
}

/**
 * Validate that a number is within a specified range (inclusive)
 * 
 * @param value - Number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns ValidationResult with valid=true if value is in range [min, max]
 * 
 * @remarks
 * - Both min and max are inclusive bounds
 * - Assumes value is already validated as a number
 * - Returns specific error messages for min/max violations
 * 
 * @example
 * ```typescript
 * const result = validateRange(50, 0, 100);
 * // { valid: true }
 * 
 * const result2 = validateRange(150, 0, 100);
 * // { valid: false, error: 'Value must be at most 100' }
 * 
 * const result3 = validateRange(-10, 0, 100);
 * // { valid: false, error: 'Value must be at least 0' }
 * ```
 */
export function validateRange(value: number, min: number, max: number): ValidationResult {
	if (value < min) {
		return { valid: false, error: `Value must be at least ${min}` };
	}
	
	if (value > max) {
		return { valid: false, error: `Value must be at most ${max}` };
	}
	
	return { valid: true };
}

/**
 * Validate a port number (1024-65535 range, integers only)
 * 
 * @param port - Port number to validate (can be any type)
 * @returns ValidationResult with valid=true if port is valid
 * 
 * @remarks
 * Port validation rules:
 * - Must be an integer
 * - Minimum: 1024 (excludes privileged ports 0-1023)
 * - Maximum: 65535 (TCP/IP limit)
 * - Rejects NaN, Infinity, and non-numeric values
 * - Rejects floating point numbers
 * 
 * @example
 * ```typescript
 * const result = validatePort(3737);
 * // { valid: true }
 * 
 * const result2 = validatePort(80);
 * // { valid: false, error: 'Port must be at least 1024 (privileged ports not allowed)' }
 * 
 * const result3 = validatePort(99999);
 * // { valid: false, error: 'Port must be at most 65535' }
 * 
 * const result4 = validatePort(3737.5);
 * // { valid: false, error: 'Port must be an integer' }
 * ```
 */
export function validatePort(port: unknown): ValidationResult {
	// First validate it's an integer
	const intCheck = validateInteger(port);
	if (!intCheck.valid) {
		return { valid: false, error: intCheck.error };
	}
	
	// Now we know it's a number, check the range
	const portNumber = port as number;
	const rangeCheck = validateRange(portNumber, 1024, 65535);
	
	if (!rangeCheck.valid) {
		// Customize error messages for port-specific context
		if (portNumber < 1024) {
			return { valid: false, error: 'Port must be at least 1024 (privileged ports not allowed)' };
		}
		return { valid: false, error: 'Port must be at most 65535' };
	}
	
	return { valid: true };
}

/**
 * Validate a positive integer (greater than 0)
 * 
 * @param value - Value to validate (can be any type)
 * @returns ValidationResult with valid=true if value is a positive integer
 * 
 * @remarks
 * - Must be an integer (checked via validateInteger)
 * - Must be greater than 0
 * - Zero is NOT considered positive (returns error)
 * - Rejects negative numbers
 * 
 * @example
 * ```typescript
 * const result = validatePositiveInteger(5);
 * // { valid: true }
 * 
 * const result2 = validatePositiveInteger(0);
 * // { valid: false, error: 'Value must be greater than 0' }
 * 
 * const result3 = validatePositiveInteger(-5);
 * // { valid: false, error: 'Value must be greater than 0' }
 * ```
 */
export function validatePositiveInteger(value: unknown): ValidationResult {
	// First validate it's an integer
	const intCheck = validateInteger(value);
	if (!intCheck.valid) {
		return { valid: false, error: intCheck.error };
	}
	
	// Now check if positive
	const num = value as number;
	if (num <= 0) {
		return { valid: false, error: 'Value must be greater than 0' };
	}
	
	return { valid: true };
}

/**
 * Validate a non-negative integer (0 or greater)
 * 
 * @param value - Value to validate (can be any type)
 * @returns ValidationResult with valid=true if value is a non-negative integer
 * 
 * @remarks
 * - Must be an integer (checked via validateInteger)
 * - Must be greater than or equal to 0
 * - Zero IS considered valid (unlike validatePositiveInteger)
 * - Rejects negative numbers
 * 
 * @example
 * ```typescript
 * const result = validateNonNegativeInteger(0);
 * // { valid: true }
 * 
 * const result2 = validateNonNegativeInteger(5);
 * // { valid: true }
 * 
 * const result3 = validateNonNegativeInteger(-5);
 * // { valid: false, error: 'Value must be non-negative (>= 0)' }
 * ```
 */
export function validateNonNegativeInteger(value: unknown): ValidationResult {
	// First validate it's an integer
	const intCheck = validateInteger(value);
	if (!intCheck.valid) {
		return { valid: false, error: intCheck.error };
	}
	
	// Now check if non-negative
	const num = value as number;
	if (num < 0) {
		return { valid: false, error: 'Value must be non-negative (>= 0)' };
	}
	
	return { valid: true };
}

/**
 * Parse a string to an integer with validation
 * 
 * @param value - String value to parse
 * @param radix - Base to use for parsing (default: 10)
 * @returns ValidationResult with parsed integer or error
 * 
 * @remarks
 * - Uses parseInt() internally
 * - Validates the input is a string
 * - Checks if parse result is a valid integer
 * - Returns NaN errors with specific message
 * - Default radix is 10 (decimal)
 * 
 * @example
 * ```typescript
 * const result = parseIntegerString('42');
 * // { valid: true }
 * 
 * const result2 = parseIntegerString('3.14');
 * // { valid: false, error: 'Parsed value must be an integer' }
 * 
 * const result3 = parseIntegerString('hello');
 * // { valid: false, error: 'Cannot parse string to integer (result is NaN)' }
 * 
 * const result4 = parseIntegerString('FF', 16);
 * // { valid: true } // Parses as 255
 * ```
 */
export function parseIntegerString(value: unknown, radix: number = 10): ValidationResult {
	if (typeof value !== 'string') {
		return { valid: false, error: 'Value must be a string' };
	}
	
	if (value.trim().length === 0) {
		return { valid: false, error: 'Value cannot be empty' };
	}
	
	const parsed = parseInt(value, radix);
	
	if (isNaN(parsed)) {
		return { valid: false, error: 'Cannot parse string to integer (result is NaN)' };
	}
	
	// Validate the parsed value is an integer
	const intCheck = validateInteger(parsed);
	if (!intCheck.valid) {
		return { valid: false, error: intCheck.error };
	}
	
	return { valid: true };
}
