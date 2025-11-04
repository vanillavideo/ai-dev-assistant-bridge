import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000
	});

	// Tests are compiled to dist/tests/ (flattened structure)
	const testsRoot = path.resolve(__dirname);

	// Find all *.test.js files (but not *.unit.test.js)
	const files = await glob('*.test.js', { 
		cwd: testsRoot
	});

	// Sort files to ensure extension.test.js runs first (activates the extension)
	// Then run other integration tests
	const sortedFiles = files.sort((a, b) => {
		if (a === 'extension.test.js') {
			return -1;
		}
		if (b === 'extension.test.js') {
			return 1;
		}
		return a.localeCompare(b);
	});

	// Add files to the test suite
	sortedFiles.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

	return new Promise((resolve, reject) => {
		try {
			// Run the mocha test
			mocha.run((failures: number) => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (err) {
			console.error(err);
			reject(err);
		}
	});
}
