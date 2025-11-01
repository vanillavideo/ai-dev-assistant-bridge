#!/usr/bin/env node

/**
 * Unified Coverage Improvement Tool
 * 
 * ONE command that:
 * 1. Runs full test coverage
 * 2. Analyzes all files
 * 3. Filters out 100% covered files
 * 4. Sorts by easiest → hardest (or hardest → easiest)
 * 5. Shows EXACT uncovered lines/branches for each file
 * 6. Shows untested files
 * 7. Ready to start testing immediately
 * 
 * Usage:
 *   npm run coverage:improve                       # Top 10 files below 100%
 *   npm run coverage:improve -- --all              # All files needing work
 *   npm run coverage:improve -- --threshold=95     # Files below 95%
 *   npm run coverage:improve -- --limit=5          # Top 5 files
 *   npm run coverage:improve -- --hardest          # Show hardest files first
 *   npm run coverage:improve -- --untested         # Show only untested files
 *   npm run coverage:improve -- --skip-tests       # Use existing coverage
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COVERAGE_DIR = path.join(PROJECT_ROOT, 'coverage');
const COVERAGE_FINAL = path.join(COVERAGE_DIR, 'coverage-final.json');
const COVERAGE_SUMMARY = path.join(COVERAGE_DIR, 'coverage-summary.json');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// Parse command line args
const args = process.argv.slice(2);
const options = {
    all: args.includes('--all'),
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10,
    threshold: parseFloat(args.find(a => a.startsWith('--threshold='))?.split('=')[1]) || 100,
    skipTests: args.includes('--skip-tests'),
    hardest: args.includes('--hardest'),
    untested: args.includes('--untested'),
    showUntested: args.includes('--show-untested'),
    file: args.find(a => a.startsWith('--file='))?.split('=')[1] || null,
    slow: args.includes('--slow'),
    slowThreshold: parseInt(args.find(a => a.startsWith('--slow-threshold='))?.split('=')[1]) || 500,
    pattern: args.find(a => a.startsWith('--pattern='))?.split('=')[1] || null,
    failing: args.includes('--failing'),
    fixFailing: args.includes('--fix-failing'),
    largeFiles: args.includes('--large-files'),
    sizeThreshold: parseInt(args.find(a => a.startsWith('--size-threshold='))?.split('=')[1]) || 1000,
    showMetrics: args.includes('--show-metrics'),
    quickWins: args.includes('--quick-wins')
};

/**
 * Run full test coverage
 */
function runCoverage() {
    console.log(colorize('\n🧪 Running full test suite with coverage...', 'cyan'));
    console.log(colorize('━'.repeat(80), 'gray'));

    try {
        execSync('npm run test:coverage', {
            cwd: PROJECT_ROOT,
            stdio: 'pipe',
            encoding: 'utf-8'
        });
        console.log(colorize('✓ Coverage data generated', 'green'));
    } catch (error) {
        // Tests might fail but coverage is still generated
        console.log(colorize('⚠️  Some tests failed, but coverage data generated', 'yellow'));
    }
}

/**
 * Find all source files (TypeScript)
 */
function findAllJsFiles() {
    const EXCLUDE_PATTERNS = [
        '**/node_modules/**',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        '**/scripts/**',
        '*.config.*',
        'esbuild.js'
    ];

    const allFiles = glob.sync('src/**/*.ts', {
        cwd: PROJECT_ROOT,
        absolute: true,
        ignore: EXCLUDE_PATTERNS
    });

    return allFiles;
}

/**
 * Load coverage data
 */
function loadCoverageData() {
    const summary = fs.existsSync(COVERAGE_SUMMARY)
        ? fs.readJsonSync(COVERAGE_SUMMARY)
        : {};

    const detailed = fs.existsSync(COVERAGE_FINAL)
        ? fs.readJsonSync(COVERAGE_FINAL)
        : {};

    return { summary, detailed };
}

/**
 * Calculate coverage score (weighted)
 */
function calculateScore(coverage) {
    const { statements, branches, functions, lines } = coverage;

    const stmtPct = statements.total > 0 ? (statements.covered / statements.total) * 100 : 100;
    const branchPct = branches.total > 0 ? (branches.covered / branches.total) * 100 : 100;
    const funcPct = functions.total > 0 ? (functions.covered / functions.total) * 100 : 100;
    const linePct = lines.total > 0 ? (lines.covered / lines.total) * 100 : 100;

    return (stmtPct * 0.4) + (branchPct * 0.4) + (funcPct * 0.1) + (linePct * 0.1);
}

/**
 * Get uncovered line numbers
 */
function getUncoveredLines(fileCoverage) {
    const uncoveredLines = [];
    const { statementMap, s } = fileCoverage;

    for (const [id, count] of Object.entries(s)) {
        if (count === 0 && statementMap[id]) {
            const { start, end } = statementMap[id];
            if (start.line === end.line) {
                uncoveredLines.push(start.line);
            } else {
                for (let line = start.line; line <= end.line; line++) {
                    uncoveredLines.push(line);
                }
            }
        }
    }

    return [...new Set(uncoveredLines)].sort((a, b) => a - b);
}

/**
 * Get uncovered branch details
 */
function getUncoveredBranches(fileCoverage, sourceFile) {
    const uncoveredBranches = [];
    const { branchMap, b } = fileCoverage;

    let sourceLines = null;
    if (fs.existsSync(sourceFile)) {
        sourceLines = fs.readFileSync(sourceFile, 'utf-8').split('\n');
    }

    for (const [id, branches] of Object.entries(b)) {
        if (branchMap[id]) {
            const branch = branchMap[id];
            const uncoveredPaths = [];
            const pathDetails = [];

            branches.forEach((count, index) => {
                if (count === 0) {
                    uncoveredPaths.push(index);
                }

                pathDetails.push({
                    index,
                    covered: count > 0
                });
            });

            if (uncoveredPaths.length > 0) {
                const line = branch.line || branch.loc.start.line;
                const code = sourceLines && line <= sourceLines.length
                    ? sourceLines[line - 1].trim()
                    : '';

                uncoveredBranches.push({
                    line,
                    type: branch.type,
                    code,
                    uncoveredPaths: uncoveredPaths.length,
                    totalPaths: branches.length,
                    pathDetails
                });
            }
        }
    }

    return uncoveredBranches.sort((a, b) => a.line - b.line);
}

/**
 * Analyze all files and return sorted list
 */
function analyzeFiles() {
    console.log(colorize('\n📊 Analyzing coverage data...', 'cyan'));
    console.log(colorize('━'.repeat(80), 'gray'));

    const { summary, detailed } = loadCoverageData();

    // Single file mode
    if (options.file) {
        const targetFile = path.resolve(PROJECT_ROOT, options.file);

        if (!fs.existsSync(targetFile)) {
            console.log(colorize(`\n❌ File not found: ${options.file}`, 'red'));
            process.exit(1);
        }

        const summaryData = summary[targetFile];
        const detailedData = detailed[targetFile];

        if (!summaryData && !detailedData) {
            console.log(colorize(`\n⚠️  No coverage data for: ${options.file}`, 'yellow'));
            console.log(colorize('   This file is untested. Create a test file to begin.', 'gray'));
            return { filesNeedingWork: [], untestedFiles: [{ path: options.file, absolutePath: targetFile, untested: true }] };
        }

        const coverage = summaryData || {
            statements: { total: 0, covered: 0, pct: 0 },
            branches: { total: 0, covered: 0, pct: 0 },
            functions: { total: 0, covered: 0, pct: 0 },
            lines: { total: 0, covered: 0, pct: 0 }
        };

        const score = calculateScore(coverage);
        const uncoveredLines = detailedData ? getUncoveredLines(detailedData) : [];
        const uncoveredBranches = detailedData ? getUncoveredBranches(detailedData, targetFile) : [];

        return {
            filesNeedingWork: [{
                path: path.relative(PROJECT_ROOT, targetFile),
                absolutePath: targetFile,
                score,
                coverage,
                uncoveredLines,
                uncoveredBranches,
                totalUncovered: uncoveredLines.length + uncoveredBranches.length
            }],
            untestedFiles: []
        };
    }

    // Multiple files mode
    const allFiles = findAllJsFiles();
    const filesNeedingWork = [];
    const untestedFiles = [];

    for (const filePath of allFiles) {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        const summaryData = summary[filePath];
        const detailedData = detailed[filePath];

        if (!summaryData && !detailedData) {
            // Untested file
            untestedFiles.push({
                path: relativePath,
                absolutePath: filePath,
                score: 0,
                untested: true
            });
            continue;
        }

        const coverage = summaryData || {
            statements: { total: 0, covered: 0, pct: 0 },
            branches: { total: 0, covered: 0, pct: 0 },
            functions: { total: 0, covered: 0, pct: 0 },
            lines: { total: 0, covered: 0, pct: 0 }
        };

        const score = calculateScore(coverage);

        // Skip files at 100% or above threshold (unless showing all)
        if (score >= options.threshold && !options.untested) {
            continue;
        }

        // Get detailed line/branch info
        const uncoveredLines = detailedData ? getUncoveredLines(detailedData) : [];
        const uncoveredBranches = detailedData ? getUncoveredBranches(detailedData, filePath) : [];

        filesNeedingWork.push({
            path: relativePath,
            absolutePath: filePath,
            score,
            coverage,
            uncoveredLines,
            uncoveredBranches,
            totalUncovered: uncoveredLines.length + uncoveredBranches.length
        });
    }

    // Sort: hardest first OR easiest first
    if (options.hardest) {
        filesNeedingWork.sort((a, b) => a.score - b.score);
    } else {
        filesNeedingWork.sort((a, b) => b.score - a.score);
    }

    return { filesNeedingWork, untestedFiles };
}

/**
 * Format coverage percentage with color
 */
function formatPct(pct, threshold = 90) {
    const color = pct >= threshold ? 'green' : pct >= 80 ? 'yellow' : 'red';
    return colorize(`${pct.toFixed(2)}%`.padStart(7), color);
}

/**
 * Group consecutive line numbers
 */
function groupLines(lines) {
    if (lines.length === 0) return [];

    const groups = [];
    let currentGroup = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === lines[i - 1] + 1) {
            currentGroup.push(lines[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [lines[i]];
        }
    }
    groups.push(currentGroup);

    return groups.map(group => {
        if (group.length === 1) return `${group[0]}`;
        if (group.length === 2) return `${group[0]}, ${group[1]}`;
        return `${group[0]}-${group[group.length - 1]}`;
    });
}

/**
 * Display results
 */
function displayResults(result) {
    const { filesNeedingWork, untestedFiles } = result;

    // Quick wins mode - filter to 98%+ coverage
    let displayFiles = filesNeedingWork;
    if (options.quickWins) {
        displayFiles = filesNeedingWork.filter(f => f.score >= 98);
        console.log('\n' + colorize('='.repeat(80), 'cyan'));
        console.log(colorize('🎯 QUICK WINS - Files at 98%+ Coverage', 'bold'));
        console.log(colorize('='.repeat(80), 'cyan'));
        console.log('\n' + colorize('📋 Summary:', 'bold'));
        console.log(`   Quick win candidates (98%+ coverage): ${colorize(displayFiles.length, 'yellow')}`);
        console.log(`   Showing: ${colorize(`Top ${Math.min(options.limit, displayFiles.length)} files`, 'cyan')}`);

        if (displayFiles.length === 0) {
            console.log('\n' + colorize('🎉 No files in 98-99% range - all are either 100% or below 98%!', 'green'));
            console.log(colorize('='.repeat(80), 'cyan'));
            return;
        }

        const filesToShow = displayFiles.slice(0, options.limit);

        console.log('\n' + colorize(`📁 Quick Win Candidates (Sorted: Easiest → Hardest)`, 'bold'));
        console.log(colorize('━'.repeat(80), 'gray'));

        filesToShow.forEach((file, index) => {
            const { coverage, uncoveredLines, uncoveredBranches } = file;
            const gapTo100 = (100 - file.score).toFixed(2);
            const totalUncovered = uncoveredLines.length + uncoveredBranches.length;

            console.log(`\n${colorize(`${index + 1}.`, 'cyan')} ${colorize(file.path, 'bold')}`);
            console.log(`   Score: ${formatPct(file.score)} ${colorize(`(${gapTo100}% to 100%)`, 'gray')}`);
            console.log(`   Coverage: Stmts ${formatPct(coverage.statements.pct)} | Branches ${formatPct(coverage.branches.pct)} | Funcs ${formatPct(coverage.functions.pct)} | Lines ${formatPct(coverage.lines.pct)}`);
            console.log(`   Details: ${coverage.statements.covered}/${coverage.statements.total} stmts, ${coverage.branches.covered}/${coverage.branches.total} branches, ${coverage.functions.covered}/${coverage.functions.total} funcs`);

            if (uncoveredLines.length > 0) {
                console.log(`\n   ${colorize('❌ Uncovered Lines:', 'red')} ${groupLines(uncoveredLines)}`);
            }

            if (uncoveredBranches.length > 0) {
                console.log(`\n   ${colorize('🔀 Uncovered Branches:', 'yellow')} ${uncoveredBranches.length} branch point(s)`);
                uncoveredBranches.forEach(branch => {
                    console.log(`      Line ${branch.line}: ${branch.type} (${branch.detail})`);
                });
            }

            console.log(`\n   ${colorize(`💡 Quick Win! Only ${totalUncovered} item(s) to cover`, 'green')}`);
        });

        console.log('\n' + colorize('='.repeat(80), 'cyan'));
        return;
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('🎯 COVERAGE IMPROVEMENT REPORT', 'bold'));
    console.log(colorize('='.repeat(80), 'cyan'));

    console.log('\n' + colorize('📋 Summary:', 'bold'));

    if (options.untested) {
        // Show only untested files
        console.log(`   Untested files: ${colorize(untestedFiles.length, 'red')}`);
        console.log(`   Showing: ${colorize(options.all ? 'All untested files' : `Top ${options.limit} files`, 'cyan')}`);

        if (untestedFiles.length === 0) {
            console.log('\n' + colorize('🎉 All files have test coverage!', 'green'));
            console.log(colorize('='.repeat(80), 'cyan'));
            return;
        }

        const filesToShow = options.all ? untestedFiles : untestedFiles.slice(0, options.limit);

        console.log('\n' + colorize('❌ Untested Files (0% Coverage)', 'bold'));
        console.log(colorize('━'.repeat(80), 'gray'));

        filesToShow.forEach((file, index) => {
            console.log(`\n${colorize(`${index + 1}.`, 'red')} ${colorize(file.path, 'bold')}`);
            console.log(`   ${colorize('No tests found - needs initial test suite', 'gray')}`);
        });

    } else {
        // Show files needing coverage improvement
        console.log(`   Files needing improvement: ${colorize(filesNeedingWork.length, 'yellow')}`);
        if (options.showUntested || untestedFiles.length > 0) {
            console.log(`   Untested files: ${colorize(untestedFiles.length, 'red')}`);
        }
        console.log(`   Threshold: ${colorize(`${options.threshold}%`, 'cyan')}`);
        console.log(`   Sorting: ${colorize(options.hardest ? 'Hardest → Easiest' : 'Easiest → Hardest', 'cyan')}`);
        console.log(`   Showing: ${colorize(options.all ? 'All files' : `Top ${options.limit} files`, 'cyan')}`);

        const filesToShow = options.all ? filesNeedingWork : filesNeedingWork.slice(0, options.limit);

        if (filesToShow.length === 0) {
            console.log('\n' + colorize('🎉 All files meet the coverage threshold!', 'green'));

            if (untestedFiles.length > 0 && options.showUntested) {
                console.log('\n' + colorize(`⚠️  However, there are ${untestedFiles.length} untested files.`, 'yellow'));
                console.log(colorize(`    Run: npm run coverage:improve -- --untested`, 'gray'));
            }

            console.log(colorize('='.repeat(80), 'cyan'));
            return;
        }

        console.log('\n' + colorize(`📁 Files (Sorted: ${options.hardest ? 'Hardest → Easiest' : 'Easiest → Hardest'})`, 'bold'));
        console.log(colorize('━'.repeat(80), 'gray'));

        filesToShow.forEach((file, index) => {
            const { coverage, uncoveredLines, uncoveredBranches } = file;
            const gapToThreshold = (options.threshold - file.score).toFixed(2);

            console.log(`\n${colorize(`${index + 1}.`, 'cyan')} ${colorize(file.path, 'bold')}`);
            console.log(`   Score: ${formatPct(file.score)} ${colorize(`(${gapToThreshold}% to ${options.threshold}%)`, 'gray')}`);
            console.log(`   Coverage: Stmts ${formatPct(coverage.statements.pct)} | Branches ${formatPct(coverage.branches.pct)} | Funcs ${formatPct(coverage.functions.pct)} | Lines ${formatPct(coverage.lines.pct)}`);
            console.log(`   Details: ${coverage.statements.covered}/${coverage.statements.total} stmts, ${coverage.branches.covered}/${coverage.branches.total} branches, ${coverage.functions.covered}/${coverage.functions.total} funcs`);

            // Show uncovered lines
            if (uncoveredLines.length > 0) {
                const lineGroups = groupLines(uncoveredLines);
                console.log(`\n   ${colorize('❌ Uncovered Lines:', 'red')} ${lineGroups.slice(0, 10).join(', ')}${lineGroups.length > 10 ? colorize(` (+${lineGroups.length - 10} more)`, 'gray') : ''}`);
            }

            // Show uncovered branches with details
            if (uncoveredBranches.length > 0) {
                console.log(`\n   ${colorize('🔀 Uncovered Branches:', 'yellow')} ${uncoveredBranches.length} branch point(s)`);

                uncoveredBranches.slice(0, 5).forEach(branch => {
                    const pathInfo = branch.pathDetails
                        .map((p, i) => p.covered ? null : `path ${i}`)
                        .filter(Boolean)
                        .join(', ');

                    console.log(`      Line ${colorize(branch.line, 'yellow')}: ${branch.type} (${pathInfo} uncovered)`);
                    if (branch.code) {
                        console.log(`        ${colorize('→', 'gray')} ${colorize(branch.code.substring(0, 70), 'cyan')}${branch.code.length > 70 ? '...' : ''}`);
                    }
                });

                if (uncoveredBranches.length > 5) {
                    console.log(`      ${colorize(`... and ${uncoveredBranches.length - 5} more branches`, 'gray')}`);
                }
            }

            // Quick action tip
            if (file.totalUncovered <= 5) {
                console.log(`\n   ${colorize('💡 Quick Win!', 'green')} Only ${file.totalUncovered} item(s) to cover`);
            }
        });
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('💡 Next Steps:', 'bold'));

    if (options.untested) {
        console.log('   1. Pick a file from the list above');
        console.log('   2. Create initial test file: tests/<path>/filename.test.js');
        console.log('   3. Write basic test suite covering main functionality');
        console.log('   4. Run: ' + colorize('npm run coverage:improve -- --untested', 'cyan') + ' to see progress');
    } else {
        console.log(`   1. Start with file #1 (${options.hardest ? 'tackle the hardest' : 'easiest to complete'})`);
        console.log('   2. Write tests for the uncovered lines/branches shown above');
        console.log('   3. Run: ' + colorize('npm run coverage:improve', 'cyan') + ' to see updated progress');

        if (untestedFiles.length > 0 && !options.showUntested) {
            console.log(`\n   ${colorize('ℹ️  Tip:', 'blue')} There are ${untestedFiles.length} untested files. Run with --untested to see them.`);
        }
    }

    console.log(colorize('='.repeat(80), 'cyan') + '\n');
}

/**
 * Run Jest with JSON output for slow test analysis
 */
function runJestJSON(pattern) {
    const { spawnSync } = require('child_process');
    const tempFile = path.join(PROJECT_ROOT, 'tmp.jest.results.json');

    const jestArgs = ['--json', '--outputFile', tempFile];
    if (pattern) jestArgs.push(pattern);

    console.log(colorize('\n🧪 Running tests to analyze performance...', 'cyan'));
    console.log(colorize('━'.repeat(80), 'gray'));

    const res = spawnSync('npx', ['jest', ...jestArgs], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
    });

    return res.status === 0 || res.status === 1; // allow failing tests but still read results
}

/**
 * Read Jest JSON results
 */
function readJestResults() {
    const tempFile = path.join(PROJECT_ROOT, 'tmp.jest.results.json');

    try {
        const json = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
        fs.unlinkSync(tempFile);
        return json;
    } catch (e) {
        console.error(colorize('Failed to read Jest JSON results:', 'red'), e.message);
        process.exit(2);
    }
}

/**
 * Analyze and display slow tests
 */
function analyzeSlowTests() {
    const threshold = options.slowThreshold;
    const pattern = options.pattern;

    const ok = runJestJSON(pattern);
    const data = readJestResults();
    const slow = [];

    for (const suite of data.testResults || []) {
        for (const t of suite.assertionResults || []) {
            // duration is sometimes omitted; guard it
            if (typeof t.duration === 'number' && t.duration >= threshold) {
                slow.push({
                    file: suite.name,
                    title: t.title,
                    duration: t.duration
                });
            }
        }
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('⏱️  SLOW TEST ANALYSIS', 'bold'));
    console.log(colorize('='.repeat(80), 'cyan'));

    console.log(`\n📋 Summary:`);
    console.log(`   Threshold: ${colorize(`${threshold}ms`, 'cyan')}`);
    console.log(`   Slow tests found: ${colorize(slow.length, slow.length > 0 ? 'yellow' : 'green')}`);

    if (slow.length === 0) {
        console.log('\n' + colorize('🎉 No tests exceeded the threshold!', 'green'));
        console.log(colorize('='.repeat(80), 'cyan') + '\n');
        process.exit(ok ? 0 : 1);
    }

    console.log('\n' + colorize('🐌 Slow Tests (sorted by duration):', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    slow.sort((a, b) => b.duration - a.duration).forEach((s, index) => {
        const relativePath = path.relative(PROJECT_ROOT, s.file);
        console.log(`\n${colorize(`${index + 1}.`, 'cyan')} ${colorize(`${s.duration}ms`, 'yellow')} - ${colorize(relativePath, 'bold')}`);
        console.log(`   ${colorize('→', 'gray')} ${s.title}`);
    });

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('💡 Tips:', 'bold'));
    console.log('   • Look for expensive operations (DB queries, API calls, file I/O)');
    console.log('   • Consider mocking external dependencies');
    console.log('   • Use beforeAll/afterAll instead of beforeEach/afterEach when possible');
    console.log('   • Check for unnecessary waits or sleeps');
    console.log(colorize('='.repeat(80), 'cyan') + '\n');

    process.exit(ok ? 0 : 1);
}

/**
 * Count lines in a file
 */
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (e) {
        return 0;
    }
}

/**
 * Calculate complexity metrics for a file
 */
function calculateComplexityMetrics(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Count various metrics
        const metrics = {
            totalLines: lines.length,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            functions: 0,
            classes: 0,
            complexity: 0,
            imports: 0,
            exports: 0
        };

        let inBlockComment = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // Blank lines
            if (trimmed === '') {
                metrics.blankLines++;
                continue;
            }

            // Block comments
            if (trimmed.startsWith('/*')) {
                inBlockComment = true;
                metrics.commentLines++;
                if (trimmed.includes('*/')) {
                    inBlockComment = false;
                }
                continue;
            }

            if (inBlockComment) {
                metrics.commentLines++;
                if (trimmed.includes('*/')) {
                    inBlockComment = false;
                }
                continue;
            }

            // Line comments
            if (trimmed.startsWith('//')) {
                metrics.commentLines++;
                continue;
            }

            // Code lines
            metrics.codeLines++;

            // Functions (various patterns)
            if (trimmed.match(/^(async\s+)?function\s+\w+/) ||
                trimmed.match(/^\w+\s*[:=]\s*(async\s+)?function/) ||
                trimmed.match(/^\w+\s*\([^)]*\)\s*\{/) ||
                trimmed.match(/=>\s*\{?$/)) {
                metrics.functions++;
            }

            // Classes
            if (trimmed.match(/^class\s+\w+/)) {
                metrics.classes++;
            }

            // Complexity indicators (if, for, while, case, catch, &&, ||)
            const complexityKeywords = (trimmed.match(/\b(if|for|while|case|catch)\b/g) || []).length;
            const logicalOperators = (trimmed.match(/&&|\|\|/g) || []).length;
            metrics.complexity += complexityKeywords + logicalOperators;

            // Imports/requires
            if (trimmed.match(/^(import|require)\s/)) {
                metrics.imports++;
            }

            // Exports
            if (trimmed.match(/^(export|module\.exports)/)) {
                metrics.exports++;
            }
        }

        return metrics;
    } catch (e) {
        return null;
    }
}

/**
 * Analyze large files that should be split
 */
function analyzeLargeFiles() {
    console.log(colorize('\n📏 Analyzing File Sizes...', 'cyan'));
    console.log(colorize('━'.repeat(80), 'gray'));

    const threshold = options.sizeThreshold;

    // Single file mode
    if (options.file) {
        const targetFile = path.resolve(PROJECT_ROOT, options.file);

        if (!fs.existsSync(targetFile)) {
            console.log(colorize(`\n❌ File not found: ${options.file}`, 'red'));
            process.exit(1);
        }

        const lineCount = countLines(targetFile);
        const metrics = calculateComplexityMetrics(targetFile);

        console.log(colorize('\n='.repeat(80), 'cyan'));
        console.log(colorize('📏 FILE SIZE ANALYSIS', 'bold'));
        console.log(colorize('='.repeat(80), 'cyan'));

        console.log(`\n${colorize('File:', 'bold')} ${options.file}`);
        console.log(`${colorize('Size:', 'bold')} ${colorize(`${lineCount} lines`, lineCount >= threshold ? 'yellow' : 'green')}`);

        if (lineCount >= threshold) {
            console.log(`${colorize('Status:', 'bold')} ${colorize(`Exceeds threshold by ${lineCount - threshold} lines`, 'yellow')}`);
        } else {
            console.log(`${colorize('Status:', 'bold')} ${colorize(`Below threshold (${threshold - lineCount} lines under)`, 'green')}`);
        }

        if (metrics) {
            console.log(`\n${colorize('Detailed Metrics:', 'bold')}`);
            console.log(`  Total Lines: ${colorize(metrics.totalLines.toLocaleString(), 'cyan')}`);
            console.log(`  Code Lines: ${colorize(metrics.codeLines.toLocaleString(), 'cyan')} (${((metrics.codeLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`  Comment Lines: ${colorize(metrics.commentLines.toLocaleString(), 'gray')} (${((metrics.commentLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`  Blank Lines: ${colorize(metrics.blankLines.toLocaleString(), 'gray')} (${((metrics.blankLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`  Functions: ${colorize(metrics.functions, 'cyan')}`);
            console.log(`  Classes: ${colorize(metrics.classes, 'cyan')}`);
            console.log(`  Complexity Score: ${colorize(metrics.complexity, metrics.complexity > 100 ? 'red' : metrics.complexity > 50 ? 'yellow' : 'green')}`);
            console.log(`  Import Statements: ${colorize(metrics.imports, 'gray')}`);
            console.log(`  Export Statements: ${colorize(metrics.exports, 'gray')}`);

            const splitScore = calculateSplitScore(lineCount, metrics);
            console.log(`\n${colorize('Split Priority:', 'bold')} ${colorize(`${splitScore}/100`, splitScore > 70 ? 'red' : splitScore > 50 ? 'yellow' : 'green')}`);
            console.log(`${colorize('Recommendation:', 'bold')} ${getSplitRecommendation(splitScore)}`);

            if (splitScore > 50) {
                console.log(`\n${colorize('💡 Refactoring Suggestion:', 'yellow')}`);
                console.log(`   ${getSplitSuggestion({ path: options.file }, metrics)}`);
            }
        }

        console.log(colorize('\n' + '='.repeat(80), 'cyan') + '\n');
        return;
    }

    // Multiple files mode
    const allFiles = findAllJsFiles();
    const largeFiles = [];

    console.log(`Scanning ${allFiles.length} files for size > ${threshold} lines...`);

    for (const filePath of allFiles) {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        const lineCount = countLines(filePath);

        if (lineCount >= threshold) {
            const metrics = calculateComplexityMetrics(filePath);

            largeFiles.push({
                path: relativePath,
                absolutePath: filePath,
                lineCount,
                metrics,
                splitScore: calculateSplitScore(lineCount, metrics)
            });
        }
    }

    // Sort by line count (largest first)
    largeFiles.sort((a, b) => b.lineCount - a.lineCount);

    console.log(colorize('\n='.repeat(80), 'cyan'));
    console.log(colorize('📏 LARGE FILE ANALYSIS', 'bold'));
    console.log(colorize('='.repeat(80), 'cyan'));

    console.log('\n' + colorize('📋 Summary:', 'bold'));
    console.log(`   Total files scanned: ${colorize(allFiles.length, 'cyan')}`);
    console.log(`   Large files found (≥${threshold} lines): ${colorize(largeFiles.length, largeFiles.length > 0 ? 'yellow' : 'green')}`);
    console.log(`   Threshold: ${colorize(`${threshold} lines`, 'cyan')}`);

    if (largeFiles.length === 0) {
        console.log('\n' + colorize('🎉 No files exceed the size threshold!', 'green'));
        console.log(colorize('='.repeat(80), 'cyan') + '\n');
        return;
    }

    // Calculate total lines in large files
    const totalLines = largeFiles.reduce((sum, f) => sum + f.lineCount, 0);
    const avgLines = Math.round(totalLines / largeFiles.length);

    console.log(`   Total lines in large files: ${colorize(totalLines.toLocaleString(), 'yellow')}`);
    console.log(`   Average size: ${colorize(`${avgLines} lines`, 'cyan')}`);

    console.log('\n' + colorize('📁 Large Files (Sorted by Size):', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    const filesToShow = options.all ? largeFiles : largeFiles.slice(0, options.limit);

    filesToShow.forEach((file, index) => {
        const { lineCount, metrics, splitScore } = file;
        const sizeColor = lineCount > 2000 ? 'red' : lineCount > 1500 ? 'yellow' : 'cyan';
        const splitColor = splitScore > 70 ? 'red' : splitScore > 50 ? 'yellow' : 'cyan';

        console.log(`\n${colorize(`${index + 1}.`, sizeColor)} ${colorize(file.path, 'bold')}`);
        console.log(`   Size: ${colorize(`${lineCount} lines`, sizeColor)} (${colorize(`${(lineCount - threshold).toLocaleString()}`, 'gray')} over threshold)`);

        if (options.showMetrics && metrics) {
            console.log(`   Metrics:`);
            console.log(`     Code: ${colorize(`${metrics.codeLines} lines`, 'cyan')} (${((metrics.codeLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`     Comments: ${colorize(`${metrics.commentLines} lines`, 'gray')} (${((metrics.commentLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`     Blank: ${colorize(`${metrics.blankLines} lines`, 'gray')} (${((metrics.blankLines / lineCount) * 100).toFixed(1)}%)`);
            console.log(`     Functions: ${colorize(metrics.functions, 'cyan')}`);
            console.log(`     Classes: ${colorize(metrics.classes, 'cyan')}`);
            console.log(`     Complexity: ${colorize(metrics.complexity, metrics.complexity > 100 ? 'red' : 'yellow')}`);
            console.log(`     Imports: ${colorize(metrics.imports, 'gray')}`);
            console.log(`     Exports: ${colorize(metrics.exports, 'gray')}`);
        }

        console.log(`   Split Priority: ${colorize(`${splitScore}/100`, splitColor)} ${getSplitRecommendation(splitScore)}`);

        if (splitScore > 50) {
            console.log(`   ${colorize('💡 Recommendation:', 'yellow')} This file should be considered for splitting`);
            console.log(`      ${getSplitSuggestion(file, metrics)}`);
        }
    });

    if (!options.all && largeFiles.length > options.limit) {
        console.log(`\n   ${colorize(`... and ${largeFiles.length - options.limit} more files`, 'gray')}`);
        console.log(`   ${colorize('Run with --all to see all large files', 'cyan')}`);
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('💡 Refactoring Strategies:', 'bold'));
    console.log('\n   1. Extract Utility Functions');
    console.log('      • Move helper functions to separate utility modules');
    console.log('      • Look for functions that don\'t depend on class state');
    console.log('\n   2. Split by Responsibility');
    console.log('      • Identify distinct responsibilities (SRP)');
    console.log('      • Create separate modules for each responsibility');
    console.log('\n   3. Extract Data/Config');
    console.log('      • Move large data structures to separate files');
    console.log('      • Extract configuration to config files');
    console.log('\n   4. Create Sub-modules');
    console.log('      • Group related functionality into sub-folders');
    console.log('      • Use index.js to re-export public API');
    console.log('\n   5. Use Composition');
    console.log('      • Break large classes into smaller, composable pieces');
    console.log('      • Favor composition over inheritance');

    console.log('\n' + colorize('🔍 Analysis Commands:', 'bold'));
    console.log('   # Show detailed metrics for a specific file:');
    console.log('   ' + colorize(`npm run coverage:improve -- --large-files --file=<path> --show-metrics`, 'cyan'));
    console.log('\n   # Find files over 1500 lines:');
    console.log('   ' + colorize(`npm run coverage:improve -- --large-files --size-threshold=1500`, 'cyan'));
    console.log('\n   # Show all large files with metrics:');
    console.log('   ' + colorize(`npm run coverage:improve -- --large-files --all --show-metrics`, 'cyan'));

    console.log(colorize('\n' + '='.repeat(80), 'cyan') + '\n');
}

/**
 * Calculate a score for how urgently a file should be split (0-100)
 */
function calculateSplitScore(lineCount, metrics) {
    if (!metrics) return Math.min(100, (lineCount / 1000) * 50);

    let score = 0;

    // Size factor (0-40 points)
    if (lineCount > 3000) score += 40;
    else if (lineCount > 2000) score += 30;
    else if (lineCount > 1500) score += 20;
    else score += (lineCount / 1000) * 10;

    // Function count (0-20 points)
    if (metrics.functions > 50) score += 20;
    else if (metrics.functions > 30) score += 15;
    else if (metrics.functions > 20) score += 10;
    else score += (metrics.functions / 20) * 10;

    // Complexity (0-20 points)
    if (metrics.complexity > 200) score += 20;
    else if (metrics.complexity > 150) score += 15;
    else if (metrics.complexity > 100) score += 10;
    else score += (metrics.complexity / 100) * 10;

    // Class count (0-10 points)
    if (metrics.classes > 3) score += 10;
    else if (metrics.classes > 1) score += 5;

    // Low comment ratio penalty (0-10 points)
    const commentRatio = metrics.commentLines / metrics.totalLines;
    if (commentRatio < 0.1 && lineCount > 1500) score += 10;
    else if (commentRatio < 0.05 && lineCount > 1000) score += 5;

    return Math.min(100, Math.round(score));
}

/**
 * Get split recommendation text
 */
function getSplitRecommendation(score) {
    if (score >= 80) return colorize('🔴 URGENT - Should be split immediately', 'red');
    if (score >= 60) return colorize('🟡 HIGH - Strongly recommend splitting', 'yellow');
    if (score >= 40) return colorize('🟠 MEDIUM - Consider splitting', 'yellow');
    return colorize('🟢 LOW - Monitor for growth', 'green');
}

/**
 * Get split suggestion based on file characteristics
 */
function getSplitSuggestion(file, metrics) {
    if (!metrics) return 'Analyze file structure to identify natural split points';

    const suggestions = [];

    if (metrics.functions > 30) {
        suggestions.push(`Has ${metrics.functions} functions - extract utilities to separate modules`);
    }

    if (metrics.classes > 1) {
        suggestions.push(`Contains ${metrics.classes} classes - split into separate files`);
    }

    if (metrics.complexity > 150) {
        suggestions.push(`High complexity (${metrics.complexity}) - simplify or extract logic`);
    }

    if (metrics.imports > 20) {
        suggestions.push(`Many imports (${metrics.imports}) - possible god object, split responsibilities`);
    }

    const commentRatio = metrics.commentLines / metrics.totalLines;
    if (commentRatio < 0.1 && metrics.codeLines > 1000) {
        suggestions.push(`Low documentation (${(commentRatio * 100).toFixed(1)}%) - add docs before refactoring`);
    }

    if (suggestions.length === 0) {
        suggestions.push('Review file for logical groupings of related functionality');
    }

    return colorize(suggestions[0], 'cyan');
}

/**
 * Analyze failing tests
 */
function analyzeFailingTests() {
    console.log(colorize('\n🔴 Analyzing Failing Tests...', 'cyan'));
    console.log(colorize('━'.repeat(80), 'gray'));

    // Run tests and capture output
    const { spawnSync } = require('child_process');

    console.log('Running test suite...\n');

    const result = spawnSync('npm', ['test'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const output = result.stdout + result.stderr;

    // Parse FAIL lines
    const failPattern = /^FAIL\s+(.+)$/gm;
    const failingFiles = new Set();
    let match;

    while ((match = failPattern.exec(output)) !== null) {
        failingFiles.add(match[1].trim());
    }

    const failingArray = Array.from(failingFiles).sort();

    console.log(colorize('='.repeat(80), 'cyan'));
    console.log(`\n📋 Summary:`);
    console.log(`   Total test files: ${colorize('~374', 'cyan')}`);
    console.log(`   Failing test files: ${colorize(failingArray.length, failingArray.length > 0 ? 'red' : 'green')}`);
    console.log(`   Passing test files: ${colorize(374 - failingArray.length, 'green')}`);

    if (failingArray.length === 0) {
        console.log('\n' + colorize('🎉 All tests passing!', 'green'));
        console.log(colorize('='.repeat(80), 'cyan') + '\n');
        return;
    }

    // Parse individual test failures with error details
    const testFailures = [];
    const errorPatterns = {
        'is not a function': [],
        'has already been declared': [],
        'is not defined': [],
        'Cannot read property': [],
        'Cannot read properties of undefined': [],
        'Cannot read properties of null': [],
        'Expected': [],
        'Received': [],
        'Timeout': [],
        'NetworkError': [],
        'other': []
    };

    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match test failure lines (●)
        const testMatch = line.match(/●\s+(.+?)\s+›\s+(.+)/);
        if (testMatch) {
            const failure = {
                suite: testMatch[1].trim(),
                test: testMatch[2].trim(),
                error: '',
                file: '',
                line: 0
            };

            // Look ahead for error type
            for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                const errorLine = lines[j];

                // Capture error message
                if (errorLine.includes('Error:') || errorLine.includes('TypeError:') || errorLine.includes('ReferenceError:')) {
                    failure.error = errorLine.trim();
                }

                // Capture file location
                const fileMatch = errorLine.match(/at\s+(?:Object\.|)(?:<anonymous>|)(?:\w+\s+)?\((.+):(\d+):\d+\)/);
                if (fileMatch && !fileMatch[1].includes('node_modules')) {
                    failure.file = fileMatch[1].replace(PROJECT_ROOT, '').replace(/^\//, '');
                    failure.line = parseInt(fileMatch[2]);
                }

                if (errorLine.trim() === '' && failure.error) {
                    break; // End of error block
                }
            }

            testFailures.push(failure);

            // Categorize by error pattern
            let categorized = false;
            for (const [pattern, arr] of Object.entries(errorPatterns)) {
                if (pattern !== 'other' && failure.error.includes(pattern)) {
                    arr.push(failure);
                    categorized = true;
                    break;
                }
            }
            if (!categorized) {
                errorPatterns.other.push(failure);
            }
        }
    }

    console.log(`   Individual test failures: ${colorize(testFailures.length, 'yellow')}`);

    // Show error pattern breakdown
    console.log('\n' + colorize('📊 Error Pattern Breakdown:', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    const sortedPatterns = Object.entries(errorPatterns)
        .filter(([_, failures]) => failures.length > 0)
        .sort(([_, a], [__, b]) => b.length - a.length);

    for (const [pattern, failures] of sortedPatterns) {
        const count = failures.length;
        const percentage = ((count / testFailures.length) * 100).toFixed(1);
        console.log(`   ${colorize(pattern.padEnd(40), 'cyan')}: ${colorize(count, 'yellow')} (${percentage}%)`);

        // Show example for top patterns
        if (count > 0 && count <= 3) {
            failures.slice(0, 2).forEach(f => {
                console.log(`      ${colorize('→', 'gray')} ${f.test}`);
            });
        } else if (count > 3) {
            console.log(`      ${colorize('→', 'gray')} ${failures[0].test}`);
            console.log(`      ${colorize('→', 'gray')} ... and ${count - 1} more`);
        }
    }

    console.log('\n' + colorize('🔴 Failing Test Files:', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    failingArray.forEach((file, index) => {
        const relativePath = file.replace(/^tests\//, '');
        const category = file.split('/')[1] || 'other';

        console.log(`\n${colorize(`${index + 1}.`, 'red')} ${colorize(file, 'bold')}`);
        console.log(`   ${colorize('Category:', 'gray')} ${category}`);

        // Find failures in this file
        const fileFailures = testFailures.filter(f => {
            return output.includes(file) && output.indexOf(file) < output.indexOf(`● ${f.suite} › ${f.test}`);
        });

        if (fileFailures.length > 0 && fileFailures.length <= 3) {
            console.log(`   ${colorize('Failures:', 'gray')}`);
            fileFailures.slice(0, 3).forEach(f => {
                console.log(`      ${colorize('✗', 'red')} ${f.suite} › ${f.test}`);
            });
        }
    });

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('🤖 AI Agent Action Guide:', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    // Generate specific fix suggestions based on error patterns
    const aiSuggestions = [];

    for (const [pattern, failures] of sortedPatterns) {
        if (failures.length === 0) continue;

        let suggestion = null;

        switch (pattern) {
            case 'is not a function':
                suggestion = {
                    icon: '🔧',
                    title: 'Fix "is not a function" errors',
                    count: failures.length,
                    steps: [
                        '1. Check if method names have changed in the source file',
                        '2. Verify the object/class is properly instantiated',
                        '3. Look for renamed methods (e.g., createFeatureRequest → requestFeature)',
                        '4. Update test to use correct method name',
                        `5. Example: ${failures[0].file}:${failures[0].line}`
                    ],
                    command: `grep -n "${failures[0].test.substring(0, 30)}" ${failures[0].file || failingArray[0]}`
                };
                break;

            case 'has already been declared':
                suggestion = {
                    icon: '📦',
                    title: 'Fix duplicate declarations',
                    count: failures.length,
                    steps: [
                        '1. Search for duplicate function/variable declarations',
                        '2. Remove the duplicate declaration',
                        '3. Keep the first or most complete version',
                        `4. File: ${failures[0].file}:${failures[0].line}`
                    ],
                    command: `grep -n "function.*${failures[0].error.match(/Identifier '(\w+)'/)?.[1] || ''}" ${failures[0].file || 'app/**/*.js'}`
                };
                break;

            case 'Cannot read properties of undefined':
            case 'Cannot read properties of null':
                suggestion = {
                    icon: '🛡️',
                    title: 'Fix null/undefined property access',
                    count: failures.length,
                    steps: [
                        '1. Check if the object is being returned/resolved correctly',
                        '2. Verify mock setup returns expected structure',
                        '3. Add conditional checks or default values',
                        `4. Test: ${failures[0].test}`,
                        `5. Location: ${failures[0].file}:${failures[0].line}`
                    ],
                    command: `npm test -- "${failingArray[0]}" --verbose`
                };
                break;

            case 'Expected':
                suggestion = {
                    icon: '🎯',
                    title: 'Fix assertion mismatches',
                    count: failures.length,
                    steps: [
                        '1. Compare expected vs received values',
                        '2. Check if data structure has changed (e.g., nested objects)',
                        '3. Update test expectations to match current implementation',
                        `4. Examples: ${failures.slice(0, 2).map(f => f.test).join(', ')}`
                    ],
                    command: `npm test -- "${failingArray[0]}" 2>&1 | grep -A 5 "Expected"`
                };
                break;
        }

        if (suggestion) {
            aiSuggestions.push(suggestion);
        }
    }

    // Display AI suggestions
    if (aiSuggestions.length > 0) {
        aiSuggestions.forEach((sug, idx) => {
            console.log(`\n${colorize(`${sug.icon} ${sug.title}`, 'cyan')} (${colorize(sug.count, 'yellow')} occurrences)`);
            console.log(colorize('   ' + '─'.repeat(77), 'gray'));
            sug.steps.forEach(step => {
                console.log(`   ${step}`);
            });
            if (sug.command) {
                console.log(`   ${colorize('Command:', 'gray')} ${colorize(sug.command, 'cyan')}`);
            }
        });
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('💡 Quick Win Opportunities:', 'bold'));
    console.log(colorize('━'.repeat(80), 'gray'));

    // Find files with only 1-2 failures (quick wins)
    const quickWins = failingArray.filter(file => {
        const fileFailCount = testFailures.filter(f =>
            output.includes(file) && output.indexOf(file) < output.indexOf(`● ${f.suite}`)
        ).length;
        return fileFailCount <= 2;
    });

    if (quickWins.length > 0) {
        console.log(`\n   ${colorize('Files with 1-2 failures:', 'green')} ${quickWins.length} files`);
        quickWins.slice(0, 5).forEach((file, idx) => {
            console.log(`   ${idx + 1}. ${file}`);
        });
        if (quickWins.length > 5) {
            console.log(`   ... and ${quickWins.length - 5} more`);
        }
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan'));
    console.log(colorize('🔍 Recommended Commands:', 'bold'));
    console.log('\n   ' + colorize('# Run first failing test to see detailed error:', 'gray'));
    console.log('   ' + colorize(`npm test -- "${failingArray[0]}"`, 'cyan'));

    console.log('\n   ' + colorize('# Run all tests in a specific file:', 'gray'));
    console.log('   ' + colorize(`npm test -- "${failingArray[0]}" --verbose`, 'cyan'));

    console.log('\n   ' + colorize('# Search for method usage in source:', 'gray'));
    if (errorPatterns['is not a function'].length > 0) {
        const methodName = errorPatterns['is not a function'][0].error.match(/(\w+) is not a function/)?.[1];
        if (methodName) {
            console.log('   ' + colorize(`grep -rn "${methodName}" app/core/`, 'cyan'));
        }
    }

    console.log('\n' + colorize('='.repeat(80), 'cyan')); console.log(colorize('\n' + '='.repeat(80), 'cyan') + '\n');

    // If --fix-failing is specified, show detailed fix guidance
    if (options.fixFailing && failingArray.length > 0) {
        console.log(colorize('🔧 Detailed Fix Guidance:', 'bold'));
        console.log(colorize('━'.repeat(80), 'gray'));

        failingArray.forEach((file, index) => {
            console.log(`\n${colorize(`${index + 1}. ${file}`, 'cyan')}`);
            console.log(colorize('   ' + '─'.repeat(77), 'gray'));

            // Run just that test to get detailed output
            const detailedResult = spawnSync('npm', ['test', '--', file], {
                cwd: PROJECT_ROOT,
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024
            });

            const detailedOutput = detailedResult.stdout + detailedResult.stderr;
            const lines = detailedOutput.split('\n');

            // Parse each failing test in this file
            const failureBlocks = [];
            let currentBlock = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Start of a new failure block (● marker)
                if (line.trim().startsWith('●')) {
                    if (currentBlock) {
                        failureBlocks.push(currentBlock);
                    }
                    currentBlock = {
                        testName: line.replace('●', '').trim(),
                        errorType: '',
                        expected: '',
                        received: '',
                        assertion: '',
                        lineNumber: '',
                        codeContext: []
                    };
                    continue;
                }

                if (currentBlock) {
                    // Error type (expect, TypeError, etc.)
                    if (line.includes('expect(received)') || line.includes('TypeError:') || line.includes('ReferenceError:')) {
                        currentBlock.errorType = line.trim();
                    }

                    // Expected value
                    if (line.trim().startsWith('Expected:')) {
                        currentBlock.expected = line.replace('Expected:', '').trim();
                    }

                    // Received value
                    if (line.trim().startsWith('Received:')) {
                        currentBlock.received = line.replace('Received:', '').trim();
                    }

                    // Line number and assertion (the > line with ^ pointer)
                    if (line.includes(file) && line.includes(':')) {
                        const match = line.match(/>?\s*(\d+)\s*\|(.*)/);
                        if (match) {
                            currentBlock.lineNumber = match[1];
                            currentBlock.assertion = match[2].trim();
                        }
                    }

                    // Code context (lines with | markers)
                    if (line.match(/^\s*\d+\s*\|/) && !line.includes('>')) {
                        currentBlock.codeContext.push(line.trim());
                    }

                    // Stop at "at Object." (end of error block)
                    if (line.trim().startsWith('at Object.')) {
                        const locationMatch = line.match(/at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/);
                        if (locationMatch && !currentBlock.lineNumber) {
                            currentBlock.lineNumber = locationMatch[2];
                        }
                        failureBlocks.push(currentBlock);
                        currentBlock = null;
                    }
                }
            }

            if (currentBlock) {
                failureBlocks.push(currentBlock);
            }

            // Display each failure with details
            failureBlocks.forEach((block, idx) => {
                console.log(`\n   ${colorize(`Test ${idx + 1}:`, 'yellow')} ${block.testName}`);

                if (block.errorType) {
                    console.log(`   ${colorize('Error:', 'red')} ${block.errorType}`);
                }

                if (block.expected) {
                    console.log(`   ${colorize('Expected:', 'gray')} ${block.expected}`);
                }

                if (block.received) {
                    console.log(`   ${colorize('Received:', 'gray')} ${block.received}`);
                }

                if (block.lineNumber) {
                    console.log(`   ${colorize('Location:', 'gray')} Line ${block.lineNumber}`);
                }

                if (block.assertion) {
                    console.log(`   ${colorize('Assertion:', 'gray')} ${block.assertion}`);
                }
            });

            if (failureBlocks.length === 0) {
                console.log(`   ${colorize('⚠️  Could not parse error details', 'yellow')}`);
                console.log(`   Run manually: npm test -- ${file}`);
            }

            console.log('');
        });

        console.log(colorize('='.repeat(80), 'cyan') + '\n');
    }
}

/**
 * Main
 */
function main() {
    if (args.includes('--help') || args.includes('-h')) {
        console.log(colorize('\n🎯 Test Analysis Tool', 'bold'));
        console.log('\n' + colorize('Coverage Analysis:', 'bold'));
        console.log('  npm run coverage:improve                       # Top 10 files below 100%');
        console.log('  npm run coverage:improve -- --all              # All files needing work');
        console.log('  npm run coverage:improve -- --threshold=95     # Files below 95%');
        console.log('  npm run coverage:improve -- --limit=5          # Top 5 files');
        console.log('  npm run coverage:improve -- --hardest          # Show hardest files first');
        console.log('  npm run coverage:improve -- --untested         # Show only untested files');
        console.log('  npm run coverage:improve -- --show-untested    # Include untested count');
        console.log('  npm run coverage:improve -- --skip-tests       # Use existing coverage');
        console.log('  npm run coverage:improve -- --file=<path>      # Analyze single file');
        console.log('\n' + colorize('Performance Analysis:', 'bold'));
        console.log('  npm run coverage:improve -- --slow                    # Find slow tests (>500ms)');
        console.log('  npm run coverage:improve -- --slow --slow-threshold=1000  # Custom threshold');
        console.log('  npm run coverage:improve -- --slow --pattern=tests/core   # Specific test path');
        console.log('\n' + colorize('Test Failure Analysis:', 'bold'));
        console.log('  npm run coverage:improve -- --failing                 # Find all failing tests');
        console.log('  npm run coverage:improve -- --failing --fix-failing   # Get detailed fix guidance');
        console.log('\n' + colorize('File Size Analysis:', 'bold'));
        console.log('  npm run coverage:improve -- --large-files                      # Find files >1000 lines');
        console.log('  npm run coverage:improve -- --large-files --size-threshold=1500  # Custom threshold');
        console.log('  npm run coverage:improve -- --large-files --show-metrics       # Show detailed metrics');
        console.log('  npm run coverage:improve -- --large-files --all                # Show all large files');
        console.log('\nCoverage Options:');
        console.log('  --all              Show all files, not just top N');
        console.log('  --threshold=N      Only show files below N% (default: 100)');
        console.log('  --limit=N          Show top N files (default: 10)');
        console.log('  --hardest          Sort hardest → easiest (default: easiest → hardest)');
        console.log('  --untested         Show only untested files (0% coverage)');
        console.log('  --show-untested    Include untested file count in summary');
        console.log('  --skip-tests       Skip running tests, use existing coverage');
        console.log('  --file=<path>      Analyze single file only');
        console.log('\nPerformance Options:');
        console.log('  --slow             Analyze test performance instead of coverage');
        console.log('  --slow-threshold=N Find tests slower than N milliseconds (default: 500)');
        console.log('  --pattern=<path>   Only run tests matching pattern');
        console.log('\nTest Failure Options:');
        console.log('  --failing          Find and list all failing tests');
        console.log('  --fix-failing      Show detailed fix guidance for first failing test');
        console.log('\nFile Size Options:');
        console.log('  --large-files      Analyze files that exceed size threshold');
        console.log('  --size-threshold=N Find files larger than N lines (default: 1000)');
        console.log('  --show-metrics     Show detailed complexity metrics');
        console.log('  --all              Show all large files, not just top N');
        console.log('  --limit=N          Show top N files (default: 10)');
        console.log('\nGeneral:');
        console.log('  --help, -h         Show this help');
        console.log('\nExamples:');
        console.log(colorize('  # Coverage: Quick check of top improvements needed', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --skip-tests --limit=3', 'cyan'));
        console.log(colorize('\n  # Coverage: Deep-dive into specific file', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --file=app/core/AgentManager.js', 'cyan'));
        console.log(colorize('\n  # Coverage: Find quick wins (files very close to 100%)', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --threshold=98 --limit=5', 'cyan'));
        console.log(colorize('\n  # Performance: Find tests slower than 500ms', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --slow', 'cyan'));
        console.log(colorize('\n  # Performance: Find very slow tests (>1s) in core module', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --slow --slow-threshold=1000 --pattern=tests/core', 'cyan'));
        console.log(colorize('\n  # Failing Tests: Find and analyze all failing tests', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --failing', 'cyan'));
        console.log(colorize('\n  # Failing Tests: Get detailed fix guidance for first failing test', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --failing --fix-failing', 'cyan'));
        console.log(colorize('\n  # Large Files: Find files over 1000 lines', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --large-files', 'cyan'));
        console.log(colorize('\n  # Large Files: Find files over 1500 lines with detailed metrics', 'gray'));
        console.log(colorize('  npm run coverage:improve -- --large-files --size-threshold=1500 --show-metrics --all', 'cyan'));
        console.log('');
        return;
    }

    // Failing test analysis mode
    if (options.failing) {
        analyzeFailingTests();
        return;
    }

    // Quick wins mode - show files at 98%+ coverage
    if (options.quickWins) {
        options.threshold = 100;
        options.limit = 20;
        // Will filter to 98%+ after analysis
    }

    // Large files analysis mode
    if (options.largeFiles) {
        analyzeLargeFiles();
        return;
    }

    // Slow test analysis mode
    if (options.slow) {
        analyzeSlowTests();
        return;
    }

    const startTime = Date.now();

    // Step 1: Run coverage (unless skipped)
    if (!options.skipTests) {
        runCoverage();
    } else {
        console.log(colorize('\n⏩ Skipping test run, using existing coverage data', 'yellow'));
    }

    // Step 2: Analyze files
    const files = analyzeFiles();

    // Step 3: Display results
    displayResults(files);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(colorize(`⏱️  Completed in ${duration}s\n`, 'gray'));
}

if (require.main === module) {
    main();
}

module.exports = {
    main,
    analyzeFiles,
    calculateScore,
    getUncoveredLines,
    getUncoveredBranches,
    loadCoverageData,
    findAllJsFiles,
    formatPct,
    groupLines,
    colorize
};
