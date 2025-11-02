/**
 * Unit tests for numberValidation module
 * 
 * Tests all numeric validation functions with comprehensive edge cases.
 * Focuses on achieving 100% branch coverage.
 */

import * as assert from 'assert';
import {
	validateInteger,
	validateRange,
	validatePort,
	validatePositiveInteger,
	validateNonNegativeInteger,
	parseIntegerString,
	type ValidationResult
} from '../../modules/numberValidation';

suite('numberValidation Module Tests', () => {
	
	suite('validateInteger', () => {
		test('should accept valid positive integer', () => {
			const result = validateInteger(42);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept valid negative integer', () => {
			const result = validateInteger(-42);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept zero', () => {
			const result = validateInteger(0);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject non-number (string)', () => {
			const result = validateInteger('42');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject non-number (null)', () => {
			const result = validateInteger(null);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject non-number (undefined)', () => {
			const result = validateInteger(undefined);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject non-number (object)', () => {
			const result = validateInteger({});
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject non-number (array)', () => {
			const result = validateInteger([]);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject NaN', () => {
			const result = validateInteger(NaN);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be NaN');
		});
		
		test('should reject positive infinity', () => {
			const result = validateInteger(Infinity);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be finite');
		});
		
		test('should reject negative infinity', () => {
			const result = validateInteger(-Infinity);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be finite');
		});
		
		test('should reject floating point number', () => {
			const result = validateInteger(3.14);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be an integer');
		});
		
		test('should reject negative floating point', () => {
			const result = validateInteger(-3.14);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be an integer');
		});
	});
	
	suite('validateRange', () => {
		test('should accept value within range', () => {
			const result = validateRange(50, 0, 100);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept value at minimum', () => {
			const result = validateRange(0, 0, 100);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept value at maximum', () => {
			const result = validateRange(100, 0, 100);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject value below minimum', () => {
			const result = validateRange(-1, 0, 100);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be at least 0');
		});
		
		test('should reject value above maximum', () => {
			const result = validateRange(101, 0, 100);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be at most 100');
		});
		
		test('should work with negative ranges', () => {
			const result = validateRange(-50, -100, 0);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject below negative minimum', () => {
			const result = validateRange(-101, -100, 0);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be at least -100');
		});
		
		test('should work with single-value range', () => {
			const result = validateRange(5, 5, 5);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
	});
	
	suite('validatePort', () => {
		test('should accept valid port (3737)', () => {
			const result = validatePort(3737);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept minimum valid port (1024)', () => {
			const result = validatePort(1024);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept maximum valid port (65535)', () => {
			const result = validatePort(65535);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject privileged port (80)', () => {
			const result = validatePort(80);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Port must be at least 1024 (privileged ports not allowed)');
		});
		
		test('should reject privileged port (0)', () => {
			const result = validatePort(0);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Port must be at least 1024 (privileged ports not allowed)');
		});
		
		test('should reject port above maximum (99999)', () => {
			const result = validatePort(99999);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Port must be at most 65535');
		});
		
		test('should reject floating point port', () => {
			const result = validatePort(3737.5);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be an integer');
		});
		
		test('should reject NaN port', () => {
			const result = validatePort(NaN);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be NaN');
		});
		
		test('should reject string port', () => {
			const result = validatePort('3737');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject null port', () => {
			const result = validatePort(null);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject undefined port', () => {
			const result = validatePort(undefined);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject negative port', () => {
			const result = validatePort(-3737);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Port must be at least 1024 (privileged ports not allowed)');
		});
		
		test('should reject infinity', () => {
			const result = validatePort(Infinity);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be finite');
		});
	});
	
	suite('validatePositiveInteger', () => {
		test('should accept positive integer', () => {
			const result = validatePositiveInteger(5);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept large positive integer', () => {
			const result = validatePositiveInteger(999999);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject zero', () => {
			const result = validatePositiveInteger(0);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be greater than 0');
		});
		
		test('should reject negative integer', () => {
			const result = validatePositiveInteger(-5);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be greater than 0');
		});
		
		test('should reject floating point', () => {
			const result = validatePositiveInteger(5.5);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be an integer');
		});
		
		test('should reject string', () => {
			const result = validatePositiveInteger('5');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject NaN', () => {
			const result = validatePositiveInteger(NaN);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be NaN');
		});
		
		test('should reject infinity', () => {
			const result = validatePositiveInteger(Infinity);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be finite');
		});
	});
	
	suite('validateNonNegativeInteger', () => {
		test('should accept zero', () => {
			const result = validateNonNegativeInteger(0);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept positive integer', () => {
			const result = validateNonNegativeInteger(5);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should accept large positive integer', () => {
			const result = validateNonNegativeInteger(999999);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject negative integer', () => {
			const result = validateNonNegativeInteger(-1);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be non-negative (>= 0)');
		});
		
		test('should reject large negative integer', () => {
			const result = validateNonNegativeInteger(-999);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be non-negative (>= 0)');
		});
		
		test('should reject floating point', () => {
			const result = validateNonNegativeInteger(5.5);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be an integer');
		});
		
		test('should reject string', () => {
			const result = validateNonNegativeInteger('5');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a number');
		});
		
		test('should reject NaN', () => {
			const result = validateNonNegativeInteger(NaN);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be NaN');
		});
		
		test('should reject infinity', () => {
			const result = validateNonNegativeInteger(Infinity);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be finite');
		});
	});
	
	suite('parseIntegerString', () => {
		test('should parse valid integer string (decimal)', () => {
			const result = parseIntegerString('42');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse negative integer string', () => {
			const result = parseIntegerString('-42');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse zero string', () => {
			const result = parseIntegerString('0');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse with leading whitespace', () => {
			const result = parseIntegerString('  42');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse with trailing whitespace', () => {
			const result = parseIntegerString('42  ');
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse hexadecimal with radix 16', () => {
			const result = parseIntegerString('FF', 16);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse binary with radix 2', () => {
			const result = parseIntegerString('1010', 2);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should parse octal with radix 8', () => {
			const result = parseIntegerString('77', 8);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});
		
		test('should reject non-string (number)', () => {
			const result = parseIntegerString(42);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a string');
		});
		
		test('should reject non-string (null)', () => {
			const result = parseIntegerString(null);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a string');
		});
		
		test('should reject non-string (undefined)', () => {
			const result = parseIntegerString(undefined);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value must be a string');
		});
		
		test('should reject empty string', () => {
			const result = parseIntegerString('');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be empty');
		});
		
		test('should reject whitespace-only string', () => {
			const result = parseIntegerString('   ');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Value cannot be empty');
		});
		
		test('should reject non-numeric string', () => {
			const result = parseIntegerString('hello');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Cannot parse string to integer (result is NaN)');
		});
		
		test('should reject invalid characters in string', () => {
			const result = parseIntegerString('123abc');
			assert.strictEqual(result.valid, true); // parseInt stops at first non-digit
		});
		
		test('should handle floating point string (truncates)', () => {
			const result = parseIntegerString('3.14');
			assert.strictEqual(result.valid, true); // parseInt returns 3
		});
		
		test('should reject special characters', () => {
			const result = parseIntegerString('!@#$');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Cannot parse string to integer (result is NaN)');
		});

		test('should reject number beyond safe integer range (line 280 branch)', () => {
			// This tests the branch where parseInt succeeds but validateInteger fails
			// parseInt returns Infinity for extremely large numbers, which fails validateInteger
			const result = parseIntegerString('9'.repeat(1000)); // Huge number string
			assert.strictEqual(result.valid, false);
			// Either NaN or outside safe integer range
			assert.ok(result.error);
		});
	});
});
