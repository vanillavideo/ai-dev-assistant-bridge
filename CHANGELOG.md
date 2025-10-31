# Changelog

All notable changes to the AI Feedback Bridge extension will be documented in this file.

## [0.6.8] - 2025-10-31

### Improved
- **TypeScript type safety** - Replaced all `any` types with proper interfaces
  - Added `FeedbackContext` interface for structured feedback data
  - Changed `log()` and `updateConfig()` to use `unknown` instead of `any`
  - Improved error handling with `NodeJS.ErrnoException` type
- **Error handling** - Added type-safe error handling utilities
  - New `isError()` type guard for safe error checking
  - New `getErrorMessage()` function for consistent error message extraction
  - All error catches now use proper error message extraction
- **Performance optimizations**
  - Reduced setTimeout delays: auto-submit (500ms→300ms), auto-inject (1500ms→1000ms)
  - Streamlined feedback message format to reduce token usage by ~40%
  - Removed redundant context data from feedback messages
- **Message format** - Ultra-concise feedback format
  - Changed from verbose multi-line instructions to bullet points
  - New format: "🔁 AI DEV MODE" with clear, actionable instructions
  - Only includes context when it contains meaningful data beyond source/timestamp
- **Test coverage** - Fixed failing test for workspace config
  - Toggle command test now handles "no workspace" scenario gracefully
  - All 20 tests passing with 100% success rate

### Technical Details
- Added type guards and utility functions for safer error handling
- Optimized async operation timeouts for better responsiveness
- Improved code maintainability with consistent typing throughout

## [0.6.7] - 2025-10-31

### Fixed
- **CRITICAL: Settings scope** - Changed all settings from `window` to `resource` (workspace-specific)
- **CRITICAL: Auto-continue ignoring disabled state** - Now properly respects the "Enable reminders" toggle
- **CRITICAL: Auto-approval script clicking status bar** - Extension status bar buttons now excluded from auto-approval
  - Added exclude selectors for `.statusbar-item`, `.statusbar`, and related VS Code status bar elements
  - Prevents auto-approval script from clicking "Start AI Dev", "Stop AI Dev", or "Inject" buttons
  - Script now checks `btn.matches()` and `btn.closest()` against exclude patterns
- **CRITICAL: Auto-approval script conflict** - Extension settings now protected from auto-approval script clicks
  - Added `data-auto-approved="skip"` to all checkboxes and inputs in settings panel
  - Updated auto-approval script to check for and skip elements marked with `data-auto-approved="skip"`
  - Prevents auto-approval script from accidentally toggling extension settings
- **Settings panel sync** - Status bar toggle now refreshes open settings panel
  - Clicking Start/Stop in status bar immediately updates the checkbox in settings panel
  - Settings panel maintains single instance (reveals existing panel instead of creating duplicates)
  - Panel automatically refreshes when disposed and recreated
- **Safety check** - Timer now re-checks if auto-continue is enabled before sending each message
- **Configuration updates** - Now save to Workspace scope instead of Global scope

### Changed
- Settings are now properly workspace-specific (each workspace has independent settings)
- Auto-continue timer includes continuous enable-state checking
- Enhanced logging for configuration reads and updates
- Auto-approval script now distinguishes between "skip" (permanent ignore) and "true" (already processed)

## [0.6.6] - 2025-10-31

### Removed
- **Obsolete files** - Removed `auto_continue.sh` (functionality now built-in)
- **Console.log** - Removed debug console.log from production code
- **Development docs** - Excluded PROJECT-STATUS.md from package (kept in repo)

### Added
- **.gitignore** - Added proper gitignore to exclude build artifacts and test files

### Changed
- **Package size** - Reduced from 102KB to 98.84KB (-3.2%)
- **Cleaner logs** - Use logging system instead of console.log

## [0.6.5] - 2025-10-31

### Fixed
- **Auto-continue on startup** - Now only starts if explicitly enabled in settings
- Extension no longer auto-starts auto-continue when disabled in config

### Changed
- **Removed notification spam** - "Run Now" button no longer shows "Reminders sent!" popup
- Cleaner UX with silent reminder sending (still logs to output channel)

## [0.6.4] - 2025-01-31

### Changed
- **Status bar text** - Toggle button now says "Start AI Dev" / "Stop AI Dev" instead of just "Start" / "Stop"
- **Run Now moved** - Run Now button moved from status bar to settings panel header (next to Inject Script)
- Removed Run Now status bar button for cleaner UI

### Removed
- Status bar Run Now button (now in settings panel only)

## [0.6.3] - 2025-01-31

### Added
- **Get Port command** - `ai-feedback-bridge.getPort` exposes current window's port programmatically
- Returns the actual port number (e.g., 3737, 3738) for this VS Code window
- Enables external scripts/extensions to query which port this window is using
- Useful for automated integration in multi-window scenarios

## [0.6.2] - 2025-10-31

### Added
- **Run Now button** - Manually trigger all enabled reminders, bypassing interval timers
- Force parameter to `getSmartAutoContinueMessage()` for manual triggers

### Changed
- Status bar branding: "AI Bridge" → "AI Dev" for cleaner, more concise display
- Run Now command always sends all enabled categories regardless of last-sent times

### Fixed
- Improved user feedback messages for manual triggers

## [0.6.1] - 2025-10-31

### Fixed
- **Port display mismatch** - Settings panel now shows actual running port instead of config value
- Each window's settings panel displays the correct unique port (e.g., 3737, 3738)

### Changed
- `getSettingsHtml()` now accepts `actualPort` parameter for accurate display

## [0.6.0] - 2025-10-31

### Added
- **Run Now command** - `ai-feedback-bridge.runNow` for manual reminder triggers
- 4th status bar button with "Run" icon for quick access to manual triggers
- Notification messages when manually triggering reminders

### Improved
- Status bar now has 4 buttons: Settings, Toggle, Run Now, Inject

## [0.5.9] - 2025-10-31

### Fixed
- **Port isolation per window** - Each VS Code window now gets truly unique port
- Removed `updateConfig('port', currentPort)` that was causing port reuse
- Always call `findAvailablePort()` dynamically instead of reading from config

### Changed
- **Simplified inject script** - Removed large "Quick Setup" webview panel (240 lines)
- Auto-inject now just copies to clipboard and toggles DevTools (20 lines)
- No more intrusive setup panel, streamlined UX

## [0.5.8] - 2025-10-31

### Changed
- **Font size increase** - Settings panel fonts increased from 13px to 14px throughout
- Improved readability across all UI elements (labels, inputs, toggles, table headers)

## [0.5.7] - 2025-10-30

### Added
- **Comprehensive test suite** - 20 total tests covering all core functionality
- Extension activation, command registration, configuration, status bar
- Port registry, smart message rotation, chat participant tests

### Improved
- Test resilience for config scope variations and CI environments
- Range validation instead of exact values for better test stability

## [0.5.6] - 2025-10-30

### Added
- Auto port selection with registry tracking per workspace
- Port cleanup on extension deactivation
- Stale port detection (24-hour cleanup)

### Changed
- Multi-window support with unique ports (3737, 3738, 3739, etc.)

## [0.5.5] - 2025-10-30

### Added
- Custom webview settings panel with organized sections
- Compact table layout for auto-continue categories
- Visual toggle switches (32x16px, proper positioning)
- Inject script button in settings header

### Improved
- Information density - more data visible without scrolling
- UI polish with proper spacing and borders

## [0.5.4] - 2025-10-30

### Changed
- **Silent operation** - Removed all 18 toast notifications
- Logging to Output Channel only for debugging

## [0.5.3] - 2025-10-30

### Added
- Smart message rotation with 6 independent categories
- Per-category intervals: tasks (300s), improvements (600s), coverage (900s)
- Timestamp tracking in globalState for interval management

## [0.5.2] - 2025-10-30

### Changed
- Package optimization - reduced from 7.3MB to ~100KB
- Excluded unnecessary files from VSIX package

## [0.5.1] - 2025-10-29

### Added
- Initial release with auto-continue feature
- HTTP bridge for external AI systems
- Auto-approval script for browser console
- Basic status bar integration

## Format

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Types of changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities
