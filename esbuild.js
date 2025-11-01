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
			'src/test/runTest.ts',
			'src/test/runUnitTests.js',
			'src/test/suite/index.ts',
			'src/test/suite/runUnitTests.ts',
			// Integration tests (require VS Code window)
			'src/test/suite/extension.test.ts',
			'src/test/suite/aiQueue.test.ts',
			'src/test/suite/autoContinue.test.ts',
			'src/test/suite/statusBar.test.ts',
			'src/test/suite/autoApproval.test.ts',
			'src/test/suite/chatIntegration.test.ts',
			'src/test/suite/commands.integration.test.ts',
			'src/test/suite/guidingDocuments.test.ts',
			'src/test/suite/portManager.test.ts',
			'src/test/suite/server.test.ts',
			'src/test/suite/settingsPanel.test.ts',
			'src/test/suite/taskManager.test.ts',
			// Unit tests (no VS Code window required)
			'src/test/suite/aiQueue.unit.test.ts',
			'src/test/suite/logging.unit.test.ts',
			'src/test/suite/messageFormatter.unit.test.ts',
			'src/test/suite/taskValidation.unit.test.ts',
			'src/test/suite/pathValidation.unit.test.ts',
			'src/test/suite/numberValidation.unit.test.ts',
			'src/test/suite/timeFormatting.unit.test.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: false,
		sourcemap: true,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		outbase: 'src',
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
