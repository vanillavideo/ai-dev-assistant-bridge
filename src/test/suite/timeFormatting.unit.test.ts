/**
 * Unit tests for time formatting functions
 * 
 * Tests formatCountdown function from timeFormatting module.
 * Focuses on achieving 100% branch coverage for countdown formatting.
 */

import * as assert from 'assert';
import { formatCountdown } from '../../modules/timeFormatting';

suite('Time Formatting Unit Tests', () => {
	
	suite('formatCountdown', () => {
		
		suite('Negative values', () => {
			test('should clamp negative value to 0s', () => {
				const result = formatCountdown(-1);
				assert.strictEqual(result, '0s');
			});
			
			test('should clamp large negative value to 0s', () => {
				const result = formatCountdown(-999);
				assert.strictEqual(result, '0s');
			});
			
			test('should handle negative decimal', () => {
				const result = formatCountdown(-0.5);
				assert.strictEqual(result, '0s');
			});
		});
		
		suite('Seconds only (0-59)', () => {
			test('should format 0 seconds', () => {
				const result = formatCountdown(0);
				assert.strictEqual(result, '0s');
			});
			
			test('should format 1 second', () => {
				const result = formatCountdown(1);
				assert.strictEqual(result, '1s');
			});
			
			test('should format 30 seconds', () => {
				const result = formatCountdown(30);
				assert.strictEqual(result, '30s');
			});
			
			test('should format 59 seconds', () => {
				const result = formatCountdown(59);
				assert.strictEqual(result, '59s');
			});
			
			test('should floor decimal seconds', () => {
				const result = formatCountdown(45.7);
				assert.strictEqual(result, '45s');
			});
			
			test('should handle very small positive value', () => {
				const result = formatCountdown(0.1);
				assert.strictEqual(result, '0s');
			});
		});
		
		suite('Minutes and seconds (60-3599)', () => {
			test('should format exactly 1 minute', () => {
				const result = formatCountdown(60);
				assert.strictEqual(result, '1m');
			});
			
			test('should format 1 minute 30 seconds', () => {
				const result = formatCountdown(90);
				assert.strictEqual(result, '1m 30s');
			});
			
			test('should format 2 minutes', () => {
				const result = formatCountdown(120);
				assert.strictEqual(result, '2m');
			});
			
			test('should format 5 minutes 45 seconds', () => {
				const result = formatCountdown(345);
				assert.strictEqual(result, '5m 45s');
			});
			
			test('should format 59 minutes', () => {
				const result = formatCountdown(3540);
				assert.strictEqual(result, '59m');
			});
			
			test('should format 59 minutes 59 seconds', () => {
				const result = formatCountdown(3599);
				assert.strictEqual(result, '59m 59s');
			});
			
			test('should hide 0 seconds for clean output', () => {
				const result = formatCountdown(300); // 5 minutes exactly
				assert.strictEqual(result, '5m');
			});
			
			test('should show seconds when non-zero', () => {
				const result = formatCountdown(301); // 5 minutes 1 second
				assert.strictEqual(result, '5m 1s');
			});
			
			test('should floor minutes and seconds', () => {
				const result = formatCountdown(125.9); // 2m 5.9s
				assert.strictEqual(result, '2m 5s');
			});
		});
		
		suite('Hours and minutes (3600+)', () => {
			test('should format exactly 1 hour', () => {
				const result = formatCountdown(3600);
				assert.strictEqual(result, '1h');
			});
			
			test('should format 1 hour 30 minutes', () => {
				const result = formatCountdown(5400);
				assert.strictEqual(result, '1h 30m');
			});
			
			test('should format 2 hours', () => {
				const result = formatCountdown(7200);
				assert.strictEqual(result, '2h');
			});
			
			test('should format 5 hours 45 minutes', () => {
				const result = formatCountdown(20700);
				assert.strictEqual(result, '5h 45m');
			});
			
			test('should format 24 hours', () => {
				const result = formatCountdown(86400);
				assert.strictEqual(result, '24h');
			});
			
			test('should format large hours value', () => {
				const result = formatCountdown(360000); // 100 hours
				assert.strictEqual(result, '100h');
			});
			
			test('should hide 0 minutes for clean output', () => {
				const result = formatCountdown(10800); // 3 hours exactly
				assert.strictEqual(result, '3h');
			});
			
			test('should show minutes when non-zero', () => {
				const result = formatCountdown(10860); // 3 hours 1 minute
				assert.strictEqual(result, '3h 1m');
			});
			
			test('should floor hours and minutes', () => {
				const result = formatCountdown(7380.9); // 2h 3m 0.9s (seconds ignored)
				assert.strictEqual(result, '2h 3m');
			});
			
			test('should ignore seconds in hour range', () => {
				const result = formatCountdown(7259); // 2h 0m 59s
				assert.strictEqual(result, '2h');
			});
			
			test('should format with seconds ignored', () => {
				const result = formatCountdown(7319); // 2h 1m 59s
				assert.strictEqual(result, '2h 1m');
			});
		});
		
		suite('Edge cases', () => {
			test('should handle boundary at 60 seconds', () => {
				const result59 = formatCountdown(59);
				const result60 = formatCountdown(60);
				assert.strictEqual(result59, '59s');
				assert.strictEqual(result60, '1m');
			});
			
			test('should handle boundary at 3600 seconds', () => {
				const result3599 = formatCountdown(3599);
				const result3600 = formatCountdown(3600);
				assert.strictEqual(result3599, '59m 59s');
				assert.strictEqual(result3600, '1h');
			});
			
			test('should handle very large values', () => {
				const result = formatCountdown(999999);
				assert.strictEqual(result, '277h 46m');
			});
			
			test('should handle infinity (produces Infinityh NaNm)', () => {
				const result = formatCountdown(Infinity);
				// Infinity / 3600 = Infinity hours
				// Infinity % 3600 = NaN, then NaN / 60 = NaN minutes
				assert.strictEqual(result, 'Infinityh NaNm');
			});
			
			test('should handle NaN (produces NaNh NaNm)', () => {
				const result = formatCountdown(NaN);
				// NaN is not < 0, not < 60, not < 3600, so goes to hours branch
				// Math.floor(NaN / 3600) = NaN hours
				// Math.floor((NaN % 3600) / 60) = NaN minutes
				assert.strictEqual(result, 'NaNh NaNm');
			});
		});
		
		suite('Branch coverage verification', () => {
			test('should hit negative branch (< 0)', () => {
				const result = formatCountdown(-5);
				assert.strictEqual(result, '0s');
			});
			
			test('should hit seconds-only branch (< 60)', () => {
				const result = formatCountdown(30);
				assert.strictEqual(result, '30s');
			});
			
			test('should hit minutes branch (< 3600)', () => {
				const result = formatCountdown(300);
				assert.strictEqual(result, '5m');
			});
			
			test('should hit minutes with seconds branch (secs !== 0)', () => {
				const result = formatCountdown(301);
				assert.strictEqual(result, '5m 1s');
			});
			
			test('should hit minutes without seconds branch (secs === 0)', () => {
				const result = formatCountdown(300);
				assert.strictEqual(result, '5m');
			});
			
			test('should hit hours branch (>= 3600)', () => {
				const result = formatCountdown(7200);
				assert.strictEqual(result, '2h');
			});
			
			test('should hit hours with minutes branch (minutes !== 0)', () => {
				const result = formatCountdown(7260);
				assert.strictEqual(result, '2h 1m');
			});
			
			test('should hit hours without minutes branch (minutes === 0)', () => {
				const result = formatCountdown(7200);
				assert.strictEqual(result, '2h');
			});
		});
	});
});
