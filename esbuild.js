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
			'tests/index.ts',
			'tests/runUnitTests.ts',
			// Integration tests (require VS Code window)
			'tests/extension.test.ts',
			'tests/aiQueue.test.ts',
			'tests/autoContinue.test.ts',
			'tests/statusBar.test.ts',
		'tests/autoApproval.test.ts',
		'tests/chatIntegration.test.ts',
		'tests/commands.test.ts',
		'tests/guidingDocuments.test.ts',
		'tests/portManager.test.ts',
		'tests/server.test.ts',
		'tests/settingsPanel.test.ts',
			'tests/taskManager.test.ts',
			// Unit tests (no VS Code window required)
			'tests/logging.unit.test.ts',
			'tests/messageFormatter.unit.test.ts',
			'tests/taskValidation.unit.test.ts',
			'tests/pathValidation.unit.test.ts',
			'tests/numberValidation.unit.test.ts',
			'tests/timeFormatting.unit.test.ts'
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
