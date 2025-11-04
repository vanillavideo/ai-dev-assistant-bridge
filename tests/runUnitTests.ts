/**
 * Fast Unit Test Runner (No VS Code Window!)
 * 
 * Tests pure logic modules without spawning VS Code Electron.
 * Much faster for TDD workflow.
 */

import Mocha from 'mocha';
import * as path from 'path';
import { glob } from 'glob';

async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000,
		reporter: 'spec'
	});

	const testsRoot = path.resolve(__dirname, '.');

	try {
		// Find all unit test files (*.unit.test.js)
		const files = await glob('**/*.unit.test.js', { cwd: testsRoot });

		if (files.length === 0) {
			console.log('No unit tests found. Run integration tests with: npm run test:integration');
			return;
		}

		// Add files to the test suite
		files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

		// Run the mocha test
		return new Promise<void>((resolve, reject) => {
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		});
	} catch (err) {
		console.error('Failed to run unit tests:', err);
		throw err;
	}
}

export { run };

// Run if executed directly
if (require.main === module) {
	run().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
