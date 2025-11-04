const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// Build extension
	const extensionCtx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	
	// Build test files
	const testCtx = await esbuild.context({
		entryPoints: [
			'tests/runTest.ts',
			'tests/runUnitTests.js',
			'tests/suite/index.ts',
			'tests/suite/runUnitTests.ts',
			// Integration tests (require VS Code window)
			'tests/suite/extension.test.ts',
			'tests/suite/aiQueue.test.ts',
			'tests/suite/autoContinue.test.ts',
			'tests/suite/statusBar.test.ts',
			'tests/suite/autoApproval.test.ts',
			'tests/suite/chatIntegration.test.ts',
			'tests/suite/commands.test.ts',
			'tests/suite/guidingDocuments.test.ts',
			'tests/suite/portManager.test.ts',
			'tests/suite/server.test.ts',
			'tests/suite/settingsPanel.test.ts',
			'tests/suite/taskManager.test.ts',
			// Unit tests (no VS Code window required)
			'tests/suite/logging.unit.test.ts',
			'tests/suite/messageFormatter.unit.test.ts',
			'tests/suite/taskValidation.unit.test.ts',
			'tests/suite/pathValidation.unit.test.ts',
			'tests/suite/numberValidation.unit.test.ts',
			'tests/suite/timeFormatting.unit.test.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: false,
		sourcemap: true,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		outbase: '.',
		external: ['vscode', 'mocha', '@vscode/test-electron'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
	});
	
	if (watch) {
		await extensionCtx.watch();
		await testCtx.watch();
	} else {
		await extensionCtx.rebuild();
		await testCtx.rebuild();
		await extensionCtx.dispose();
		await testCtx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
