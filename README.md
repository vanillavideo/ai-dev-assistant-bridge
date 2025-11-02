# 🌉 AI Dev Assistant Bridge

[![Version](https://img.shields.io/badge/version-0.9.6-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎸 Super Vibe Coding Mode

**Tired of clicking "Allow" 47 times while your AI codes?** Yeah, us too.

This extension auto-approves everything so you can just vibe while GitHub Copilot/Claude/ChatGPT does the work. Your AI gets periodic reminders to keep coding (because even AI needs a nudge sometimes), and you get to feel like a tech CEO who "manages" instead of "works."

**TL;DR:** Click nothing. Code everything. Maximum vibes. 😎

---

## 💡 Why This Extension?

**Problem:** AI assistants (GitHub Copilot, Claude, ChatGPT) lose focus during long coding sessions, forget pending tasks, and require constant manual approval clicks.

**Solution:** AI Dev Assistant Bridge keeps your AI coding assistant on track with:
- ⏰ **Auto-reminders** that nudge AI to continue working every 5-15 minutes
- 🤖 **Auto-approval** that eliminates "Allow"/"Keep" button clicking
- 📋 **Task management** so AI always knows what to work on next
- 🔌 **HTTP API** for external tools to control your AI workflow
- 📄 **Context injection** that feeds project guidelines to every AI prompt

**Result:** Your AI assistant stays focused, productive, and aligned with your project goals—without constant babysitting.

---

## ✨ Core Features

### 🤖 AI Workflow Automation
- **Auto-Continue System**: Intelligent periodic reminders with live countdown (HH:MM:SS)
- **Smart Categorization**: Tasks, improvements, coverage, robustness, cleanup, commits
- **Guiding Documents**: Include project docs (ARCHITECTURE.md, etc.) in AI context automatically
- **AI Communication Queue**: Async instruction queue for external AI systems to send commands
- **Chat Participant**: Dedicated `@ai-dev-assistant-bridge` participant for AI interactions
- **Auto-Approval**: Browser script auto-clicks "Allow"/"Keep" buttons (Chat panel scoped)

### 📋 Task Management System
- **Internal Task Registry**: Create, manage, and track tasks within VS Code
- **External REST API**: Complete task management API for other projects
- **Input Validation**: Title ≤200 chars, description ≤5000 chars
- **Status Tracking**: Pending, in-progress, completed status workflow
- **Category Organization**: Bug, feature, improvement, documentation, testing, other
- **Real-time Sync**: Changes sync between internal UI and external API

### 🔧 Auto-Approval System
- **Chat Panel Scoped**: Only clicks in Copilot Chat (not status bar, settings, etc.)
- **Code Widget Exclusions**: Skips file diffs, attachments, toolbars
- **Safety Checks**: Prevents dangerous operations (delete, remove, rm)
- **95% Accuracy**: Targets approval buttons with minimal false positives
- **Configurable**: Enable/disable per workspace, adjustable interval

### 🌐 HTTP Server
- **Auto-assigned Ports**: Range 1024-65535, unique per workspace
- **Security**: Request size limit (1MB), timeout (30s), CORS enabled
- **8 REST Endpoints**: Tasks, feedback, restart, comprehensive CRUD
- **Request Validation**: JSON parsing, error handling, input sanitization

## 🚀 Quick Start

### Installation

1. **Download the Extension**: Get the latest `.vsix` file from the releases
2. **Install in VS Code**: 
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX" and select the command
   - Choose the downloaded `.vsix` file
3. **Automatic Activation**: The extension starts automatically and shows the server port in the status bar
4. **Access Settings**: Click the status bar item or run "AI Dev Assistant Bridge: Show Status" command

### First Steps

1. **Check Status**: Click the status bar (shows port like `🌉 3737`) or run `AI Dev Assistant Bridge: Show Status`
2. **Configure Auto-Continue**: Enable categories you want (Tasks, Improvements, Coverage, etc.)
3. **Add Guiding Documents**: Include project documentation for better AI context
4. **Create Tasks**: Use the command palette or REST API to add tasks
5. **Enable Auto-Approval**: (Optional) Let the extension auto-approve AI suggestions in Chat

### Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Show Status**: View server status, port, and configuration
- **Toggle Auto-Continue**: Enable/disable periodic AI reminders
- **Run Now**: Manually trigger auto-continue immediately
- **Get Current Port**: Display the active HTTP server port
- **Change Port**: Assign a different port for the HTTP server
- **Add Task**: Create a new task interactively
- **Manage Tasks**: View, update, and delete tasks
- **Add Guiding Document**: Include project documentation for AI context
- **Remove Guiding Document**: Remove a document from AI context
- **List Guiding Documents**: View all included documents

## 📊 REST API Reference

The extension provides a complete REST API for external integration. All endpoints are available at `http://localhost:<port>` (default port shown in status bar).

### Task Management Endpoints

#### List All Tasks
```bash
GET /tasks
```
Returns array of all tasks with their current status.

#### Create Task
```bash
POST /tasks
Content-Type: application/json

{
  "title": "Fix authentication bug",           # Required, max 200 chars
  "description": "Users unable to login",      # Optional, max 5000 chars
  "category": "bug"                            # Optional: bug|feature|improvement|documentation|testing|other
}
```

#### Get Single Task
```bash
GET /tasks/:id
```

#### Update Task
```bash
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Updated title",                    # Optional
  "description": "Updated description",        # Optional
  "status": "in-progress",                     # Optional: pending|in-progress|completed
  "category": "feature"                        # Optional
}
```

#### Delete Task
```bash
DELETE /tasks/:id
```

### AI Communication Queue Endpoints

#### Add Instruction to Queue
```bash
POST /ai/queue
Content-Type: application/json

{
  "instruction": "Analyze code for performance issues",  # Required
  "source": "external-agent",                            # Optional, identifies sender
  "priority": "high",                                     # Optional: urgent|high|normal|low
  "metadata": { "project": "main-app" }                  # Optional, any JSON data
}
```

#### Get Queue Contents
```bash
GET /ai/queue
```
Returns all pending and processed instructions.

#### Process Next Instruction
```bash
POST /ai/queue/process
```
Marks next instruction as processed and returns it.

#### Get Queue Statistics
```bash
GET /ai/queue/stats
```
Returns counts by status and priority.

#### Remove Specific Instruction
```bash
DELETE /ai/queue/:id
```

#### Clear Processed Instructions
```bash
POST /ai/queue/clear
```
Removes all processed instructions from queue.

### Utility Endpoints

#### Server Status
```bash
GET /status
```
Returns server health, uptime, and configuration.

#### Restart Server
```bash
POST /restart
```
Restarts the HTTP server (useful after configuration changes).

#### API Documentation
```bash
GET /help
```
Returns complete API documentation in HTML format.

### Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message description"
}
```

### Status Codes

- `200` - Success
- `201` - Created (new resource)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

### Security Features

- **Request Size Limit**: 1MB maximum payload
- **Timeout**: 30 second request timeout
- **CORS Enabled**: Cross-origin requests allowed
- **Input Validation**: All inputs sanitized and validated
- **Rate Limiting**: Connection limits per workspace

### Integration Examples

**Python:**
```python
import requests

BASE_URL = 'http://localhost:3737'

# Create a task
response = requests.post(f'{BASE_URL}/tasks', json={
    'title': 'Memory leak in user service',
    'description': 'Investigation required',
    'category': 'bug'
})
task = response.json()['data']
print(f"Created task: {task['id']}")

# Queue AI instruction
requests.post(f'{BASE_URL}/ai/queue', json={
    'instruction': 'Review the user service for memory leaks',
    'priority': 'high',
    'source': 'python-monitor'
})
```

**Node.js:**
```javascript
const BASE_URL = 'http://localhost:3737';

// Create and track a task
async function createTask() {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: 'Add user authentication',
            category: 'feature',
            description: 'Implement OAuth2 flow'
        })
    });
    const { data } = await response.json();
    console.log(`Task created: ${data.id}`);
    return data.id;
}

// Update task status
async function updateTask(id, status) {
    await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
}
```

**Shell Script / CI/CD:**
```bash
#!/bin/bash
BASE_URL="http://localhost:3737"

# Create task from CI/CD pipeline
create_task() {
    curl -X POST "${BASE_URL}/tasks" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Build failed on commit $CI_COMMIT_SHA\",
            \"description\": \"Check logs at $CI_JOB_URL\",
            \"category\": \"bug\"
        }"
}

# Queue AI analysis
queue_analysis() {
    curl -X POST "${BASE_URL}/ai/queue" \
        -H "Content-Type: application/json" \
        -d "{
            \"instruction\": \"Analyze failed build and suggest fixes\",
            \"priority\": \"urgent\",
            \"metadata\": {\"commit\": \"$CI_COMMIT_SHA\", \"job\": \"$CI_JOB_ID\"}
        }"
}

# Check if build failed and create task
if [ "$CI_BUILD_STATUS" != "success" ]; then
    create_task
    queue_analysis
fi
```

**Go:**
```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

const baseURL = "http://localhost:3737"

type Task struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    Category    string `json:"category"`
}

func createTask(task Task) error {
    body, _ := json.Marshal(task)
    resp, err := http.Post(
        baseURL+"/tasks",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return nil
}

func main() {
    task := Task{
        Title:       "Database connection pool exhausted",
        Description: "Investigate connection leaks",
        Category:    "bug",
    }
    createTask(task)
}
```

## 🤖 AI Communication Queue

The extension provides an asynchronous queue system for coordinating multiple AI agents and external automation systems.

### Use Cases

**Multi-Agent Coordination**
- Orchestrate multiple AI agents working on different aspects
- Queue sequential tasks with priority ordering
- Track instruction execution and results

**CI/CD Integration**
- Failed builds trigger AI analysis automatically
- Security scans queue vulnerability reviews
- Performance tests request optimization suggestions

**Cross-Application Workflows**
- External apps send instructions to VS Code AI
- Background services queue periodic analysis
- Project management tools assign AI tasks

**Development Automation**
- Queue code reviews after commits
- Schedule periodic refactoring suggestions
- Automate documentation updates

### Priority System

Instructions are processed in priority order:

1. **`urgent`** - Immediate attention (e.g., production issues, security alerts)
2. **`high`** - Next in queue after urgent (e.g., failed builds, critical bugs)
3. **`normal`** - Standard priority (default, e.g., feature requests, reviews)
4. **`low`** - Background processing (e.g., cleanup, optimization suggestions)

### Workflow Example

```bash
# 1. External service detects issue
curl -X POST http://localhost:3737/ai/queue \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Investigate authentication failures in production",
    "priority": "urgent",
    "source": "monitoring-system",
    "metadata": {"incident": "INC-12345", "service": "auth-api"}
  }'

# 2. Check queue status
curl http://localhost:3737/ai/queue/stats
# Returns: {"pending": 5, "processed": 12, "by_priority": {"urgent": 1, "high": 2, "normal": 2}}

# 3. AI agent processes next instruction
curl -X POST http://localhost:3737/ai/queue/process
# Returns the urgent instruction for processing

# 4. After completion, create task for tracking
curl -X POST http://localhost:3737/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix auth API timeouts",
    "category": "bug",
    "description": "Related to INC-12345"
  }'

# 5. Clean up processed instructions periodically
curl -X POST http://localhost:3737/ai/queue/clear
```

## 🎯 Use Cases

### Development Workflow
1. **External System** creates task via API
2. **VS Code** shows task in internal UI
3. **AI Agent** works on task with auto-continue reminders
4. **Developer** monitors progress and updates status
5. **External System** receives status updates

### CI/CD Integration
- Failed builds create tasks automatically
- Deployment issues assign debugging tasks
- Test failures generate improvement tasks
- Security scans create vulnerability tasks

### Project Management
- Issue tracking systems sync tasks
- Project managers assign work
- Team leads track progress
- Automated workflows trigger tasks

## ⚙️ Configuration

### Auto-Continue Categories
Configure in VS Code Settings (`aiFeedbackBridge.*`):

- **Tasks** (300s): Pull in external tasks and pending work
- **Improvements** (600s): Code quality and performance suggestions
- **Coverage** (900s): Test coverage and robustness checks
- **Robustness** (600s): Error handling and edge cases
- **Cleanup** (1200s): Code cleanup and refactoring
- **Commits** (900s): Commit suggestions and documentation

### Guiding Documents
- **Project Context**: Add documents (ARCHITECTURE.md, CONVENTIONS.md, etc.)
- **Automatic Inclusion**: Documents included in AI prompts for context-aware responses
- **File Picker**: Easy document management through VS Code UI
- **Configurable Size**: Limit document size to prevent context overflow

### Auto-Approval
- **Monitor Chat**: Auto-approve AI agent suggestions
- **Safety First**: Prevents dangerous operations
- **Workspace Scoped**: Enable per project

## 📁 Project Structure

```
├── src/
│   ├── extension.ts (495 lines)        # Activation, coordination, lifecycle
│   ├── modules/                         # Modular architecture (13 modules)
│   │   ├── types.ts (50)               # Shared interfaces, enums
│   │   ├── logging.ts (46)             # Centralized logging
│   │   ├── taskManager.ts (255)        # Task CRUD + validation
│   │   ├── autoApproval.ts (47)        # Script injection
│   │   ├── portManager.ts (201)        # Port allocation (1024-65535)
│   │   ├── server.ts (762)             # HTTP API + security + AI queue endpoints
│   │   ├── settingsPanel.ts (878)      # Settings webview UI
│   │   ├── chatIntegration.ts (303)    # Copilot Chat agent
│   │   ├── autoContinue.ts (358)       # Reminders + countdown
│   │   ├── statusBar.ts (108)          # Status bar UI
│   │   ├── commands.ts (380)           # Command registration (16 commands)
│   │   ├── guidingDocuments.ts (258)   # Project context documents
│   │   └── aiQueue.ts (281)            # AI communication queue
│   └── test/
│       └── suite/
│           ├── taskManager.test.ts (218)  # 11 test cases
│           └── portManager.test.ts (171)  # 12 test cases
├── scripts/
│   └── auto-approval-script.js (205)    # Browser auto-click script
├── docs/
│   ├── REFACTORING-PLAN.md             # Architecture roadmap
│   └── REFACTORING-SUMMARY.md          # Complete journey metrics
├── README.md                            # This file
└── LICENSE                              # MIT License
```

### Architecture Highlights

- **89% Modularized**: 3,974 lines across 13 focused modules (avg 306 lines)
- **74% Reduction**: Main file reduced from 1936 → 495 lines
- **Comprehensive Testing**: 389 lines of unit tests (23 scenarios)
- **Production Security**: Input validation, request limits, timeouts
- **Complete Documentation**: JSDoc on 20+ public APIs

## �️ Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests (opens VS Code window - integration tests)
npm test

# Run tests with coverage report
npm run test:coverage

# Analyze coverage without re-running tests
npm run coverage:analyze

# Find quick wins (files near 100% coverage)
npm run coverage:quick-wins

# View detailed testing guide
See TESTING.md for comprehensive testing documentation

# Package extension
npx vsce package
```

For detailed testing instructions, coverage analysis tools, and best practices, see **[TESTING.md](TESTING.md)**.

## 📈 Roadmap

- [ ] Task templates and automation
- [ ] GitHub/GitLab issue sync
- [ ] Slack/Teams notifications
- [ ] Task analytics and reporting
- [ ] Multi-workspace task sharing
- [ ] Advanced AI model integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📦 Distribution

### For End Users

**Option 1: Direct VSIX Installation**
1. Download the `.vsix` file from releases
2. In VS Code: Extensions view → `...` menu → "Install from VSIX..."
3. Select the downloaded file

**Option 2: Command Line**
```bash
code --install-extension ai-dev-assistant-bridge-0.9.4.vsix
```

### For Developers

**Building from Source:**
```bash
# Clone repository
git clone https://github.com/coreyolson/vscode-extension.git
cd vscode-extension

# Install dependencies
npm install

# Compile and package
npm run compile
npx @vscode/vsce package

# Install locally
code --install-extension ai-dev-assistant-bridge-0.9.4.vsix
```

**Publishing to VS Code Marketplace:**
```bash
# Create publisher account at https://marketplace.visualstudio.com/manage
# Get Personal Access Token from Azure DevOps

# Login with vsce
npx @vscode/vsce login <your-publisher-name>

# Publish (requires updating 'publisher' field in package.json)
npx @vscode/vsce publish

# Or publish with version bump
npx @vscode/vsce publish patch  # 0.9.4 → 0.9.5
npx @vscode/vsce publish minor  # 0.9.4 → 0.10.0
npx @vscode/vsce publish major  # 0.9.4 → 1.0.0
```

**Sharing via GitHub Releases:**
1. Create a new release on GitHub
2. Upload the `.vsix` file as a release asset
3. Users can download and install from the release page

**Enterprise Distribution:**
- Host the `.vsix` file on internal servers
- Use VS Code's `extensions.json` for workspace recommendations
- Deploy via Group Policy or configuration management tools

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Status Check**: Run `AI Dev Assistant Bridge: Show Status` command to see server status and configuration
- **API Documentation**: Visit `http://localhost:3737/help` when extension is running for complete API reference
- **Debug Logs**: Open Output Panel (View → Output) → Select "AI Agent Feedback" channel
- **Demo Scripts**: 
  - `./task-api-demo.sh` - Interactive API demonstration
  - `./test-discoverability.sh` - Test AI agent discovery features

### Common Issues

**Server Not Starting?**
- Check Output panel for error messages
- Try changing port: `AI Dev Assistant Bridge: Change Port`
- Ensure no port conflicts (check other running services)

**Auto-Approval Not Working?**
- Ensure GitHub Copilot Chat is open
- Check that auto-approval is enabled in settings
- Verify the Chat panel is visible (not minimized)
- Review safety filters in auto-approval logs

**Tasks Not Syncing?**
- Verify server is running (check status bar)
- Test API endpoint: `curl http://localhost:3737/tasks`
- Check request body format matches API documentation

**Guiding Documents Not Loading?**
- Ensure files exist in workspace
- Check file paths are relative to workspace root
- Verify files are within configured size limits

### Reporting Issues

When reporting issues, please include:
1. VS Code version (`Help → About`)
2. Extension version (from status bar or settings)
3. Relevant logs from Output panel
4. Steps to reproduce
5. Expected vs actual behavior

---

**Made with ❤️ for AI-enhanced development workflows**