# Troubleshooting Guide

## Auto-Continue Starting When Disabled

### Problem
Auto-continue starts sending reminders even though the "Enable reminders" toggle is OFF.

### Root Causes

#### 1. Workspace Settings File Override
**Symptom:** Toggle shows disabled but auto-continue still runs  
**Cause:** The `.vscode/settings.json` file in your workspace has `"aiFeedbackBridge.autoContinue.enabled": true`

**Solution:**
```bash
# Check your workspace settings
cat .vscode/settings.json

# If it shows "enabled": true, update it:
echo '{"aiFeedbackBridge.autoContinue.enabled": false}' > .vscode/settings.json

# Then reload VS Code
```

#### 2. Auto-Approval Script Clicking Status Bar
**Symptom:** Auto-continue gets enabled after pasting the auto-approval script in console  
**Cause:** The auto-approval script was clicking status bar buttons ("Start AI Dev", "Stop AI Dev", "Inject") that matched the pattern

**Solution (v0.6.7+):**
- Auto-approval script now excludes VS Code status bar elements
- Added exclude selectors: `.statusbar-item`, `.statusbar`, `[id*="status."]`
- Script checks `btn.matches()` and `btn.closest()` against exclude patterns
- Status bar buttons are completely ignored by the auto-approval script

#### 3. Auto-Approval Script Clicking Settings Panel
**Symptom:** Extension checkboxes get toggled when auto-approval script runs  
**Cause:** The auto-approval script was clicking buttons that matched `/Continue/i` pattern, accidentally toggling the "autoContinue.enabled" checkbox

**Solution (v0.6.7+):**
- All extension settings now have `data-auto-approved="skip"` attribute
- Auto-approval script checks for this attribute and ignores these elements
- This prevents the script from accidentally clicking extension settings

### Verification Steps

1. **Check the Output panel:**
   - View → Output → Select "AI Feedback Bridge"
   - Look for lines like: `[INFO] Auto-continue enabled: false`

2. **Inspect configuration values:**
   ```
   [INFO] Config inspection for autoContinue.enabled:
     - default: false
     - global: undefined
     - workspace: false  ← Should be false
     - workspaceFolder: undefined
   ```

3. **Test the auto-approval script:**
   - Open extension settings (gear icon in status bar)
   - Paste auto-approval script in console
   - Verify checkboxes do NOT get clicked
   - Check console for: `[auto-approve] 🔍 Checking X buttons...` (should find 0 in settings panel)

### Settings Hierarchy

VS Code uses this precedence (highest to lowest):
1. **workspaceFolder** - Folder-specific (multi-root)
2. **workspace** - Workspace-specific (current workspace)
3. **global** - User-wide (all workspaces)
4. **default** - Extension defaults

The extension now uses **workspace** scope exclusively (v0.6.7+).

### Migration from Old Versions

If you're upgrading from v0.6.6 or earlier:
1. Old settings were stored in **global** scope
2. v0.6.7+ automatically migrates these to **workspace** scope on first activation
3. Old global settings are cleared automatically
4. Check logs for: `[WARN] Detected old Global settings, clearing...`

### Quick Reset

To completely reset extension settings for current workspace:
```bash
# Remove workspace settings
rm .vscode/settings.json

# Reload VS Code
# Extension will use defaults
```

### Still Having Issues?

1. Enable debug logging (check Output panel)
2. Reload VS Code window (Cmd+R / Ctrl+R)
3. Check for conflicting extensions
4. Verify workspace settings file content
5. Check if auto-approval script is running (`window.__autoApproveInterval`)
