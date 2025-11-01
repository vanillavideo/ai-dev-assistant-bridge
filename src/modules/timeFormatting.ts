/**
 * Time Formatting Module
 * 
 * Pure time formatting functions for countdown displays and duration strings.
 * Used by autoContinue module for status bar countdown display.
 * 
 * All functions are pure (no side effects, no external dependencies).
 */

/**
 * Format seconds into human-readable countdown string
 * 
 * @param seconds - Number of seconds to format
 * @returns Formatted string (e.g., "5m 30s", "2h 15m", "45s")
 * 
 * @remarks
 * Formatting rules:
 * - Negative values clamped to "0s"
 * - 0-59 seconds: Shows seconds only (e.g., "30s")
 * - 60-3599 seconds: Shows minutes and seconds (e.g., "5m 30s")
 *   - Hides seconds if 0 for cleaner output (e.g., "5m" not "5m 0s")
 * - 3600+ seconds: Shows hours and minutes (e.g., "2h 30m")
 *   - Hides minutes if 0 for cleaner output (e.g., "2h" not "2h 0m")
 *   - Ignores seconds completely in hour range
 * - All values floored to integers (e.g., 45.9s → "45s")
 * 
 * @example
 * ```typescript
 * formatCountdown(45);     // "45s"
 * formatCountdown(90);     // "1m 30s"
 * formatCountdown(300);    // "5m" (no seconds shown)
 * formatCountdown(301);    // "5m 1s"
 * formatCountdown(3600);   // "1h" (no minutes shown)
 * formatCountdown(5400);   // "1h 30m"
 * formatCountdown(-10);    // "0s" (negative clamped)
 * ```
 */
export function formatCountdown(seconds: number): string {
	// Clamp negative values to 0
	if (seconds < 0) {
		return '0s';
	}
	
	if (seconds < 60) {
		return `${Math.floor(seconds)}s`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		// Hide seconds if 0 for cleaner output
		return secs === 0 ? `${minutes}m` : `${minutes}m ${secs}s`;
	} else {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		// Hide minutes if 0 for cleaner output
		return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
	}
}
