# Extension.ts Refactoring Plan

## Current Status (After Phase 2)
- **extension.ts**: 1536 lines (down from 1936)
- **Modules created**: 6 files, 810 lines
- **Issue**: Still need to extract settings panel, chat integration, auto-continue, status bar, commands
- **Goal**: Reduce extension.ts to ~200 lines (activation/deactivation only)

## Module Structure

### ✅ Created Modules (Phase 1 & 2 Complete)

1. **`modules/types.ts`** (50 lines)
   - Task interface
   - LogLevel enum
   - ExtensionConfig interface
   - Shared type definitions

2. **`modules/logging.ts`** (46 lines)
   - log() function
   - getErrorMessage() function
   - initLogging() function
   - Output channel management

3. **`modules/taskManager.ts`** (98 lines)
   - getTasks()
   - saveTasks()
   - addTask()
   - updateTaskStatus()
   - removeTask()
   - updateTaskField()
   - clearCompletedTasks()

4. **`modules/autoApproval.ts`** (47 lines)
   - autoInjectScript()
   - getAutoApprovalScript()

5. **`modules/portManager.ts`** (122 lines) ✅ NEW
   - findAvailablePort()
   - releasePort()
   - isPortAvailable()
   - Port registry management

6. **`modules/server.ts`** (447 lines) ✅ NEW
   - startServer()
   - stopServer()
   - All HTTP request handlers:
     * GET / and GET /help - API documentation
     * GET /tasks - List all tasks
     * POST /tasks - Create task
     * PUT /tasks/:id - Update task status
     * DELETE /tasks/:id - Delete task
     * POST /feedback - Send to AI agent
     * POST /restart-app - Restart Electron app
   - CORS handling
   - Request body parsing

### 📋 Pending Modules

7. **`modules/settingsPanel.ts`** (~600 lines)
   - showSettingsPanel()
   - getSettingsHtml()
   - All webview message handlers
   - HTML/CSS generation
   - Panel state management

8. **`modules/chatIntegration.ts`** (~200 lines)
   - sendToAgent()
   - Chat participant creation
   - Message formatting
   - Chat request handling

9. **`modules/autoContinue.ts`** (~150 lines)
   - startAutoContinue()
   - stopAutoContinue()
   - runAllReminders()
   - Timer management

10. **`modules/statusBar.ts`** (~100 lines)
    - createStatusBarItems()
    - updateStatusBarItems()
    - Status bar click handlers

11. **`modules/commands.ts`** (~150 lines)
    - Command registration
    - Command handlers (addTask, listTasks, etc.)

## Implementation Steps

### Phase 1: Core Infrastructure ✅ DONE
- [x] Create modules directory
- [x] Extract types to types.ts
- [x] Extract logging to logging.ts
- [x] Extract task management to taskManager.ts
- [x] Extract auto-approval to autoApproval.ts

### Phase 2: Server Module ✅ DONE
- [x] Create server.ts
- [x] Move HTTP server logic
- [x] Move all endpoint handlers
- [x] Create portManager.ts
- [x] Move port registry logic
- [x] Update imports in extension.ts
- [x] Test server functionality
- [x] Add comprehensive task API endpoints
- [x] Compile and package successfully

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

## Estimated Final Sizes (Updated)

- extension.ts: ~200 lines (activation/deactivation only)  [Current: 1536]
- types.ts: 50 lines ✅
- logging.ts: 46 lines ✅
- taskManager.ts: 98 lines ✅
- autoApproval.ts: 47 lines ✅
- portManager.ts: 122 lines ✅
- server.ts: 447 lines ✅
- settingsPanel.ts: ~600 lines
- chatIntegration.ts: ~200 lines
- autoContinue.ts: ~150 lines
- statusBar.ts: ~100 lines
- commands.ts: ~150 lines

**Total**: ~2,210 lines (better organization, same functionality)
**Progress**: 810/2,210 lines extracted (37% complete)

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
