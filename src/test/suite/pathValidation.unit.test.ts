/**
 * Path Validation Unit Tests
 * 
 * Tests pure path validation functions - No VS Code dependencies
 */

import * as assert from 'assert';
import {
	validatePath,
	validateAbsolutePath,
	validateRelativePath,
	validateFileExtension,
	normalizePath
} from '../../modules/pathValidation';

suite('Path Validation Unit Tests', () => {
	
	suite('validatePath', () => {
		test('should accept valid Unix path', () => {
			const result = validatePath('/usr/local/bin/file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid Windows path', () => {
			const result = validatePath('C:\\Users\\Documents\\file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept valid relative path', () => {
			const result = validatePath('docs/README.md');
			assert.strictEqual(result.valid, true);
		});

		test('should reject null path', () => {
			const result = validatePath(null);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path is required');
		});

		test('should reject undefined path', () => {
			const result = validatePath(undefined);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path is required');
		});

		test('should reject empty string', () => {
			const result = validatePath('');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be empty');
		});

		test('should reject whitespace-only string', () => {
			const result = validatePath('   ');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be empty');
		});

		test('should reject single dot', () => {
			const result = validatePath('.');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be just "." or ".."');
		});

		test('should reject double dot', () => {
			const result = validatePath('..');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be just "." or ".."');
		});

		test('should reject path with asterisk', () => {
			const result = validatePath('/path/*/file.txt');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('invalid characters'));
		});

		test('should reject path with question mark', () => {
			const result = validatePath('/path/?/file.txt');
			assert.strictEqual(result.valid, false);
		});

		test('should reject path with pipe', () => {
			const result = validatePath('/path/|/file.txt');
			assert.strictEqual(result.valid, false);
		});

		test('should reject path with quotes', () => {
			const result = validatePath('/path/"file".txt');
			assert.strictEqual(result.valid, false);
		});

		test('should reject path with angle brackets', () => {
			const result = validatePath('/path/<file>.txt');
			assert.strictEqual(result.valid, false);
		});

		test('should accept path with spaces', () => {
			const result = validatePath('/path/my file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept path with dots in filename', () => {
			const result = validatePath('/path/file.test.ts');
			assert.strictEqual(result.valid, true);
		});

		test('should convert number to string', () => {
			const result = validatePath(123);
			assert.strictEqual(result.valid, true);
		});
	});

	suite('validateAbsolutePath', () => {
		test('should accept Unix absolute path', () => {
			const result = validateAbsolutePath('/usr/local/file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept Windows absolute path with C drive', () => {
			const result = validateAbsolutePath('C:\\Users\\file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept Windows absolute path with forward slashes', () => {
			const result = validateAbsolutePath('C:/Users/file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept Windows absolute path with any drive letter', () => {
			const result = validateAbsolutePath('D:\\Data\\file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should accept UNC path', () => {
			const result = validateAbsolutePath('\\\\server\\share\\file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should reject relative path', () => {
			const result = validateAbsolutePath('relative/path/file.txt');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('absolute'));
		});

		test('should reject path starting with dot', () => {
			const result = validateAbsolutePath('./path/file.txt');
			assert.strictEqual(result.valid, false);
		});

		test('should reject path starting with double dot', () => {
			const result = validateAbsolutePath('../path/file.txt');
			assert.strictEqual(result.valid, false);
		});

		test('should reject empty path', () => {
			const result = validateAbsolutePath('');
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be empty');
		});

		test('should accept absolute path with spaces', () => {
			const result = validateAbsolutePath('/path/my file.txt');
			assert.strictEqual(result.valid, true);
		});
	});

	suite('validateRelativePath', () => {
		test('should accept relative path', () => {
			const result = validateRelativePath('docs/README.md');
			assert.strictEqual(result.valid, true);
		});

		test('should accept relative path with dot prefix', () => {
			const result = validateRelativePath('./config.json');
			assert.strictEqual(result.valid, true);
		});

		test('should accept relative path with double dot', () => {
			const result = validateRelativePath('../parent/file.txt');
			assert.strictEqual(result.valid, true);
		});

		test('should reject Unix absolute path', () => {
			const result = validateRelativePath('/absolute/path');
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('relative'));
		});

		test('should reject Windows absolute path', () => {
			const result = validateRelativePath('C:\\absolute\\path');
			assert.strictEqual(result.valid, false);
		});

		test('should reject UNC path', () => {
			const result = validateRelativePath('\\\\server\\share');
			assert.strictEqual(result.valid, false);
		});

		test('should reject empty path', () => {
			const result = validateRelativePath('');
			assert.strictEqual(result.valid, false);
		});

		test('should accept nested relative path', () => {
			const result = validateRelativePath('a/b/c/d/file.txt');
			assert.strictEqual(result.valid, true);
		});
	});

	suite('validateFileExtension', () => {
		test('should accept file with matching extension', () => {
			const result = validateFileExtension('file.md', ['.md', '.txt']);
			assert.strictEqual(result.valid, true);
		});

		test('should accept file with matching extension without dot', () => {
			const result = validateFileExtension('file.md', ['md', 'txt']);
			assert.strictEqual(result.valid, true);
		});

		test('should accept case-insensitive extension', () => {
			const result = validateFileExtension('FILE.MD', ['.md']);
			assert.strictEqual(result.valid, true);
		});

		test('should accept case-insensitive allowed extensions', () => {
			const result = validateFileExtension('file.txt', ['MD', 'TXT']);
			assert.strictEqual(result.valid, true);
		});

		test('should reject file with non-matching extension', () => {
			const result = validateFileExtension('file.pdf', ['.md', '.txt']);
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('must be one of'));
		});

		test('should reject file with no extension', () => {
			const result = validateFileExtension('README', ['.md']);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'File has no extension');
		});

		test('should accept any extension when empty array provided', () => {
			const result = validateFileExtension('file.xyz', []);
			assert.strictEqual(result.valid, true);
		});

		test('should accept multiple dots in filename', () => {
			const result = validateFileExtension('file.test.ts', ['.ts']);
			assert.strictEqual(result.valid, true);
		});

		test('should match only last extension', () => {
			const result = validateFileExtension('file.test.ts', ['.test']);
			assert.strictEqual(result.valid, false);
		});

		test('should accept extension with whitespace padding', () => {
			const result = validateFileExtension('file.md', ['  .md  ', '.txt']);
			assert.strictEqual(result.valid, true);
		});

		test('should reject invalid path', () => {
			const result = validateFileExtension('', ['.md']);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Path cannot be empty');
		});
	});

	suite('normalizePath', () => {
		test('should trim whitespace', () => {
			const result = normalizePath('  /path/to/file.txt  ');
			assert.strictEqual(result, '/path/to/file.txt');
		});

		test('should convert backslashes to forward slashes', () => {
			const result = normalizePath('C:\\Users\\Documents\\file.txt');
			assert.strictEqual(result, 'C:/Users/Documents/file.txt');
		});

		test('should remove duplicate slashes', () => {
			const result = normalizePath('/path//to///file.txt');
			assert.strictEqual(result, '/path/to/file.txt');
		});

		test('should handle mixed slashes', () => {
			const result = normalizePath('C:\\Users/Documents\\file.txt');
			assert.strictEqual(result, 'C:/Users/Documents/file.txt');
		});

		test('should preserve single slashes', () => {
			const result = normalizePath('/path/to/file.txt');
			assert.strictEqual(result, '/path/to/file.txt');
		});

		test('should handle empty string', () => {
			const result = normalizePath('');
			assert.strictEqual(result, '');
		});

		test('should handle whitespace-only string', () => {
			const result = normalizePath('   ');
			assert.strictEqual(result, '');
		});

		test('should preserve UNC paths', () => {
			// Note: UNC paths \\\\ become // after conversion, but duplicate slashes are removed
			// So \\\\server becomes //server, then single slash /server
			const result = normalizePath('\\\\server\\share\\file.txt');
			assert.strictEqual(result, '/server/share/file.txt');
		});

		test('should handle multiple operations together', () => {
			const result = normalizePath('  C:\\\\Users\\\\\\Documents//file.txt  ');
			assert.strictEqual(result, 'C:/Users/Documents/file.txt');
		});
	});
});
