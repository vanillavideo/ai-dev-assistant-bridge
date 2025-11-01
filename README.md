# 🌉 AI Feedback Bridge

[![Version](https://img.shields.io/badge/version-0.9.1-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A powerful VS Code extension that creates a seamless bridge between your development environment and AI agents, featuring comprehensive task management and external API integration.

## ✨ Features

### 🤖 AI Agent Integration
- **Auto-Continue System**: Intelligent periodic reminders with live countdown (HH:MM:SS)
- **Smart Categorization**: Tasks, improvements, coverage, robustness, cleanup, commits
- **Guiding Documents**: Include project docs (ARCHITECTURE.md, etc.) in AI context automatically
- **AI Communication Queue**: Async instruction queue for external AI systems to send commands
- **Feedback Bridge**: HTTP server for external app feedback integration
- **Chat Participant**: Dedicated `@ai-feedback-bridge` participant for AI interactions
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

1. **Install the Extension**: Search for "AI Feedback Bridge" in VS Code extensions
2. **Configure Settings**: Open Command Palette → "AI Feedback Bridge: Show Status"
3. **Start Using**: The extension activates automatically and shows port in status bar

## 📊 External Task API

The extension provides a complete REST API for external task management:

### Endpoints

```bash
# List all tasks
GET http://localhost:3737/tasks

# Create new task
POST http://localhost:3737/tasks
Content-Type: application/json
{
  "title": "Fix database issue",
  "description": "Connection timeout on login",
  "category": "bug"
}

# Update task status
PUT http://localhost:3737/tasks/{id}
Content-Type: application/json
{
  "status": "in-progress"
}

# Delete task
DELETE http://localhost:3737/tasks/{id}
```

### Integration Examples

**Python:**
```python
import requests

# Create a task from your Python project
requests.post('http://localhost:3737/tasks', json={
    'title': 'Memory leak in user service',
    'category': 'bug'
})
```

**Node.js:**
```javascript
// Assign task from your Node.js app
await fetch('http://localhost:3737/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: 'Add user authentication',
        category: 'feature'
    })
});
```

**Shell Script:**
```bash
# Create task from CI/CD pipeline
curl -X POST http://localhost:3737/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy failed","category":"bug"}'
```

**📖 Complete API Documentation**: Visit `http://localhost:3737/help` when the extension is running for full API documentation.

## 🤖 AI Communication Queue

The extension provides an asynchronous queue system for external AI systems to send instructions to the VS Code AI agent.

### Queue API Endpoints

```bash
# Enqueue an instruction for the AI agent
POST http://localhost:3737/ai/queue
Content-Type: application/json
{
  "instruction": "Analyze the codebase for performance issues",
  "source": "external-ai-agent",
  "priority": "high",
  "metadata": { "project": "main-app" }
}

# Get all queued instructions
GET http://localhost:3737/ai/queue

# Process next instruction
POST http://localhost:3737/ai/queue/process

# Get queue statistics
GET http://localhost:3737/ai/queue/stats

# Remove instruction by ID
DELETE http://localhost:3737/ai/queue/{id}

# Clear processed instructions
POST http://localhost:3737/ai/queue/clear
```

### Priority Levels
- **`urgent`**: Immediate processing
- **`high`**: Next in line after urgent
- **`normal`**: Standard priority (default)
- **`low`**: Background processing

### Use Cases
- **Multi-Agent Systems**: Coordinate multiple AI agents
- **External Automation**: CI/CD pipelines trigger AI analysis
- **Cross-Application**: Other apps send instructions to VS Code AI
- **Workflow Orchestration**: Queue sequential AI tasks

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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **API Documentation**: Visit `http://localhost:3737/help` when extension is running
- **Demo**: Run `./task-api-demo.sh` for live API demonstration  
- **Discoverability**: Run `./test-discoverability.sh` to test AI agent discovery features
- **Issues**: Use VS Code Command Palette → "AI Feedback Bridge: Show Status"
- **Debug**: Check Output Panel → "AI Agent Feedback" for logs

---

**Made with ❤️ for AI-enhanced development workflows**