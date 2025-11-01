#!/usr/bin/env node

/**
 * Unit Test Runner Script - No VS Code Window!
 */

const path = require('path');

async function main() {
	try {
		const runner = require(path.resolve(__dirname, './suite/runUnitTests'));
		await runner.run();
		process.exit(0);
	} catch (err) {
		console.error('Unit tests failed:', err.message);
		process.exit(1);
	}
}

main();
