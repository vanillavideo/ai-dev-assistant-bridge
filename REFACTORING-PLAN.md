# Extension.ts Refactoring Plan

## Current Status
- **File Size**: 1936 lines
- **Issue**: Too large for efficient development and AI assistance
- **Goal**: Break into focused, maintainable modules

## Module Structure

### ✅ Created Modules

1. **`modules/types.ts`** (46 lines)
   - Task interface
   - LogLevel enum
   - ExtensionConfig interface
   - Shared type definitions

2. **`modules/logging.ts`** (49 lines)
   - log() function
   - getErrorMessage() function
   - initLogging() function
   - Output channel management

3. **`modules/taskManager.ts`** (101 lines)
   - getTasks()
   - saveTasks()
   - addTask()
   - updateTaskStatus()
   - removeTask()
   - updateTaskField()
   - clearCompletedTasks()

4. **`modules/autoApproval.ts`** (42 lines)
   - autoInjectScript()
   - getAutoApprovalScript()

### 📋 Pending Modules

5. **`modules/server.ts`** (~300 lines)
   - startServer()
   - stopServer()
   - All HTTP request handlers (GET/POST/PUT)
   - Port finding logic
   - Server status management

6. **`modules/settingsPanel.ts`** (~600 lines)
   - showSettingsPanel()
   - getSettingsHtml()
   - All webview message handlers
   - HTML/CSS generation
   - Panel state management

7. **`modules/chatIntegration.ts`** (~200 lines)
   - sendToAgent()
   - Chat participant creation
   - Message formatting
   - Chat request handling

8. **`modules/autoContinue.ts`** (~150 lines)
   - startAutoContinue()
   - stopAutoContinue()
   - runAllReminders()
   - Timer management

9. **`modules/statusBar.ts`** (~100 lines)
   - createStatusBarItems()
   - updateStatusBarItems()
   - Status bar click handlers

10. **`modules/commands.ts`** (~150 lines)
    - Command registration
    - Command handlers (addTask, listTasks, etc.)

## Implementation Steps

### Phase 1: Core Infrastructure (DONE)
- [x] Create modules directory
- [x] Extract types to types.ts
- [x] Extract logging to logging.ts
- [x] Extract task management to taskManager.ts
- [x] Extract auto-approval to autoApproval.ts

### Phase 2: Server Module (NEXT)
- [ ] Create server.ts
- [ ] Move HTTP server logic
- [ ] Move all endpoint handlers
- [ ] Update imports in extension.ts
- [ ] Test server functionality

### Phase 3: Settings Panel Module
- [ ] Create settingsPanel.ts
- [ ] Move webview creation
- [ ] Move HTML generation
- [ ] Move message handlers
- [ ] Update imports
- [ ] Test settings panel

### Phase 4: Remaining Modules
- [ ] Create chatIntegration.ts
- [ ] Create autoContinue.ts
- [ ] Create statusBar.ts
- [ ] Create commands.ts
- [ ] Update all imports
- [ ] Test all functionality

### Phase 5: Clean Up extension.ts
- [ ] Remove extracted code
- [ ] Keep only activation/deactivation logic
- [ ] Import all modules
- [ ] Verify all features work
- [ ] Update tests

## Benefits

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Easier to write unit tests for isolated modules
3. **AI Assistance**: Smaller files are easier for AI to understand and modify
4. **Collaboration**: Multiple developers can work on different modules
5. **Code Reuse**: Functions can be imported across modules
6. **Debugging**: Easier to locate and fix bugs in specific areas

## Estimated Final Sizes

- extension.ts: ~200 lines (activation/deactivation only)
- types.ts: 46 lines
- logging.ts: 49 lines
- taskManager.ts: 101 lines
- autoApproval.ts: 42 lines
- server.ts: ~300 lines
- settingsPanel.ts: ~600 lines
- chatIntegration.ts: ~200 lines
- autoContinue.ts: ~150 lines
- statusBar.ts: ~100 lines
- commands.ts: ~150 lines

**Total**: ~1,938 lines (same functionality, better organization)

## Testing Strategy

After each phase:
1. Compile with `npm run compile`
2. Package with `npx @vscode/vsce package`
3. Install and test in VS Code
4. Verify all features work as expected
5. Commit changes with descriptive message

## Rollback Plan

If any refactoring breaks functionality:
1. Use git to revert to last working commit
2. Identify the issue
3. Fix incrementally
4. Test thoroughly before proceeding
