# AI Feedback Bridge# AI Feedback Bridge



A VS Code extension that provides automation features for GitHub Copilot development workflows.A VS Code extension that supercharges your development workflow with GitHub Copilot by providing **two powerful automation features**:



## Features1. **🔄 Auto-Continue** - Keep AI development momentum going with periodic reminders

2. **✅ Auto-Approval** - Eliminate manual clicking on Allow/Keep/Proceed buttons

### 🔄 Auto-Continue

Automatically sends periodic reminders to Copilot Chat to maintain development momentum.Plus an HTTP bridge server for external AI agent integration.



- **Enable**: Click status bar icon (bottom-right) or set `aiFeedbackBridge.autoContinue.enabled` to `true`---

- **Configure**: Adjust interval and message in settings

## ✨ Feature 1: Auto-Continue (Extension-Based)

### ✅ Auto-Approval  

Automatically clicks Allow/Keep/Proceed buttons in Copilot Chat.**Automatically send periodic reminders to Copilot Chat to maintain development momentum.**



- **Setup**: Run command "AI Feedback Bridge: Show Auto-Approval Script"This feature runs **inside the VS Code extension** and periodically sends your custom message to `@github` chat, keeping the AI focused on your development goals.

- **Install**: Copy script to VS Code Developer Tools Console

- **Safety**: Skips dangerous operations automatically### Quick Start



### 🌐 HTTP Bridge1. **Enable via Status Bar**: Click the status bar icon (bottom-right) → Select "Start Auto-Continue"

Provides HTTP server for external AI agent integration.2. **Or via Settings**: Set `aiFeedbackBridge.autoContinue.enabled` to `true`

3. **Customize**: Configure interval and message in settings

- **Default Port**: 3737 (auto-assigned)

- **Auto-Start**: Enabled by default### Configuration



## Usage```json

{

The extension includes two helper scripts:  "aiFeedbackBridge.autoContinue.enabled": false,  // Toggle on/off

  "aiFeedbackBridge.autoContinue.interval": 300,   // Seconds (5 minutes)

- `auto_continue.sh` - External script for continuous prompting  "aiFeedbackBridge.autoContinue.message": "Continue with tasks..."

- `auto-approval-script.js` - Browser console script for auto-approval}

```

## Commands

### Use Cases

- `AI Feedback Bridge: Start Server`

- `AI Feedback Bridge: Stop Server` - 🎯 **Active Development**: "Continue with tasks, run tests, commit when ready" (every 5 min)

- `AI Feedback Bridge: Show Status`- 🧪 **Test-Driven Development**: "Run tests and fix failures" (every 3 min)

- `AI Feedback Bridge: Toggle Auto-Continue`- 🔧 **Refactoring**: "Continue refactoring, improve code quality" (every 10 min)

- `AI Feedback Bridge: Change Port`- � **Documentation**: "Update docs and add examples" (every 15 min)



## Installation### Tips



1. Install the extension- **Per-Window Control**: Enable in your main development window, disable in reference windows

2. Configure settings as needed- **Status Bar**: Shows spinning icon when enabled, pause icon when disabled

3. Use status bar controls or commands to activate features- **Quick Toggle**: Click status bar menu for instant start/stop



## License---



See LICENSE file.## ✅ Feature 2: Auto-Approval (Console Script)

**Automatically click Allow/Keep/Proceed buttons in Copilot Chat.**

This feature runs **in the browser via a JavaScript console script** and automatically clicks approval buttons when Copilot wants to edit files, run commands, or create files.

### Setup (One-Time)

1. Run command: **`AI Feedback Bridge: Show Auto-Approval Script`**
2. Copy the displayed JavaScript code
3. Open **VS Code Developer Tools Console**:
   - Mac: `Help` → `Toggle Developer Tools`
   - Windows/Linux: `Help` → `Toggle Developer Tools`
4. Paste the script into the Console tab and press Enter
5. You'll see: `✅ Auto-approval script started`

### Safety Features

- 🛡️ **Dangerous Operation Protection**: Automatically skips operations containing:
  - `delete`, `remove`, `rm`, `drop`, `truncate`, `destroy`
- ⏸️ **Manual Review Pause**: Press button to review before proceeding
- 📊 **Statistics Tracking**: Monitor auto-approval activity

### Console Commands

```javascript
// View statistics
__autoApproveStats()

// Stop auto-approval
clearInterval(window.__autoApproveInterval)

// Check if running
window.__autoApproveInterval  // Returns interval ID if running
```

### Configuration

```json
{
  "aiFeedbackBridge.autoApproval.enabled": false,     // Enable feature
  "aiFeedbackBridge.autoApproval.intervalMs": 2000   // Check every 2 seconds
}
```

### Use Cases

- 🚀 **Rapid Development**: Auto-approve file edits during active coding sessions
- 🔁 **Iterative Testing**: Auto-approve test runs and fixes
- 📦 **Batch Operations**: Auto-approve multiple file creation/updates
- ⚡ **High-Speed Workflows**: Eliminate clicking bottleneck

### Safety Notes

- ⚠️ **Review First**: Watch what Copilot suggests before enabling
- 🛑 **Stop Anytime**: Clear interval in console to stop immediately
- 🔍 **Monitor Output**: Check console for what's being approved
- 📋 **Dangerous Ops**: Script automatically pauses on risky operations

---

## 🌉 Feature 3: HTTP Bridge Server (Advanced)

**Receive feedback from external AI agents and route to Copilot Chat.**

The extension runs an HTTP server that external applications can use to send feedback messages to Copilot Chat.

### Configuration

```json
{
  "aiFeedbackBridge.port": 3737,        // Auto-assigned by default
  "aiFeedbackBridge.autoStart": true    // Start server on launch
}
```

### Sending Feedback via HTTP

**POST** to `http://localhost:3737` with JSON payload:

```json
{
  "message": "The user reported that the login button is not working",
  "context": {
    "userId": "user123",
    "page": "login",
    "timestamp": "2025-10-25T10:30:00Z"
  }
}
```

### Example Integration

#### From Node.js/Electron

```javascript
const feedback = {
  message: "User reported slow performance on dashboard",
  context: {
    userId: "123",
    screen: "dashboard",
    loadTime: "5.2s"
  }
};

fetch('http://localhost:3737', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feedback)
})
  .then(res => res.json())
  .then(data => console.log('Feedback sent:', data));
```

#### From Python

```python
import requests

feedback = {
    "message": "API endpoint returning 500 error",
    "context": {
        "endpoint": "/api/users",
        "method": "GET",
        "error": "Internal Server Error"
    }
}

response = requests.post('http://localhost:3737', json=feedback)
print(response.json())
```

---

## 📋 Commands

- **`AI Feedback Bridge: Start Server`** - Manually start HTTP server
- **`AI Feedback Bridge: Stop Server`** - Stop HTTP server
- **`AI Feedback Bridge: Show Status`** - View current configuration
- **`AI Feedback Bridge: Toggle Auto-Continue`** - Start/pause periodic reminders
- **`AI Feedback Bridge: Change Port`** - Manually change server port
- **`AI Feedback Bridge: Show Auto-Approval Script`** - Get console script

---

## 🚀 Quick Start Guide

### For Auto-Continue Only

1. Click status bar icon (bottom-right)
2. Select "Start Auto-Continue"
3. Customize message in settings if desired

### For Auto-Approval Only

1. Run command: **`AI Feedback Bridge: Show Auto-Approval Script`**
2. Open Developer Tools Console
3. Paste and run the script

### For Both Features

1. Set up Auto-Approval first (one-time setup)
2. Enable Auto-Continue via status bar
3. Watch Copilot work automatically with minimal interaction!

---

## ⚙️ Advanced Configuration

### Multi-Window Support

Each VS Code window can have different settings. For example:

- **Main Development Window**: Auto-Continue enabled (5 min interval)
- **Reference Window**: Auto-Continue disabled
- **Testing Window**: Auto-Continue enabled (3 min interval, "Run tests" message)

### Port Management

The extension automatically selects an available port (3737, 3738, 3739, etc.). You can:

- Let it auto-assign (recommended)
- Set a specific port in settings (advanced)
- Change port via command palette

### Status Bar

The status bar shows:

- 📡 Server port number
- 🔄 Auto-Continue status (spinning = on, paused = off)
- Click for menu with quick actions

---

## 📦 Requirements

- VS Code **1.96.0** or higher
- **GitHub Copilot** extension

---

## 🔧 Development

### Setup

```bash
npm install
```

### Compile

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Package Extension

```bash
npm run package
# Creates ai-feedback-bridge-<version>.vsix
```

### Run Extension

Press **F5** to open Extension Development Host.

---

## 📝 Release Notes

### 0.4.0 - Clarity & Polish

- 🎨 **Reorganized Settings**: Clear separation between Auto-Continue and Auto-Approval features
- 🖱️ **Enhanced Status Bar**: Click for menu with quick actions (toggle, settings, script, status)
- 📚 **Improved Documentation**: Comprehensive README with clear feature explanations
- 🔧 **Better Tooltips**: Rich markdown tooltips showing all menu options

### 0.3.0 - Auto-Port & Enhanced UX

- ✨ **Clickable Status Bar**: Toggle auto-continue with single click
- 🔌 **Automatic Port Selection**: Finds available ports automatically across multiple windows
- 📝 **Enhanced Settings UI**: Rich markdown descriptions with emojis and formatting
- 🗑️ **Cleanup**: Removed redundant settings

### 0.2.0 - Multi-Window Support

- 🪟 **Window-Scoped Configuration**: Different settings per VS Code window
- 🔧 **Port Registry**: Track ports across all workspace instances
- 📋 **Per-Window Auto-Continue**: Enable/disable independently per window

### 0.1.0 - Robustness & Quality

- 🛡️ **Error Handling**: Comprehensive error handling and validation
- 📊 **Structured Logging**: LogLevel enum with detailed debug information
- 🧪 **Unit Tests**: Basic test infrastructure
- 🔧 **Input Validation**: Validate all configuration values

### 0.0.1 - Initial Release

- 🌉 **HTTP Bridge Server**: Receive feedback from external AI agents
- 🤖 **Copilot Chat Integration**: Route messages to GitHub Copilot
- 📝 **Context Preservation**: Include app context with feedback
- 🔄 **Auto-Continue**: Periodic task reminders to Copilot Chat
- ✅ **Auto-Approval**: Console script for auto-clicking buttons

---

## 📄 License

MIT

---

## 🤝 Contributing

Issues and pull requests welcome! This extension is designed to enhance AI-assisted development workflows.

---

## 💡 Tips & Tricks

### Optimal Auto-Continue Intervals

- **Rapid Development**: 180s (3 min) - Fast iteration cycles
- **Standard Development**: 300s (5 min) - Balanced momentum
- **Background Monitoring**: 600s (10 min) - Periodic check-ins
- **Long-Running Tasks**: 900s (15 min) - For slower workflows

### Custom Auto-Continue Messages

```json
// Testing workflow
"Continue running tests and fixing failures. Commit when all pass."

// Refactoring workflow
"Continue refactoring. Focus on code quality, maintainability, and reducing complexity."

// Documentation workflow
"Update documentation, add examples, ensure clarity. Commit docs updates."

// Feature development
"Continue implementing [feature name]. Write tests, handle edge cases, commit when ready."
```

### Auto-Approval Best Practices

1. **Start with observation**: Let it run and watch what it approves
2. **Review console logs**: Check `__autoApproveStats()` regularly
3. **Pause for reviews**: Stop before major operations
4. **Combine with Auto-Continue**: Maximum automation for rapid development

---

**Made with ❤️ for enhancing AI-assisted development workflows**
