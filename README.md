# 🌉 AI Feedback Bridge

Supercharge your GitHub Copilot workflow with intelligent automation and zero interruptions.

## ✨ Features

### 🔄 Smart Auto-Continue
Intelligent, category-based reminders that keep AI development momentum going:
- **6 Smart Categories**: Tasks (5m), Improvements (10m), Coverage (15m), Robustness (10m), Cleanup (20m), Commits (15m)
- **Intelligent Rotation**: Only sends messages when category intervals have elapsed
- **Zero Popups**: Completely silent operation, all logs to output channel
- **Per-Window**: Independent settings for each VS Code window

### ✅ Auto-Approval
Eliminate manual clicking on Allow/Keep/Proceed buttons:
- **Browser Console Script**: Auto-clicks approval buttons in Copilot Chat
- **Safety Checks**: Automatically skips dangerous operations (delete, remove, rm)
- **Statistics**: Track how many approvals were automated
- **One-Time Setup**: Copy script to Developer Tools console once

### 🌐 HTTP Bridge
Integration endpoint for external AI systems (optional):
- **Auto Port Selection**: Each window gets unique port (3737, 3738, etc.)
- **Multi-Window**: Run multiple VS Code instances simultaneously
- **RESTful API**: Simple POST endpoint for external agents

---

## 🚀 Quick Start

### 1. Install
\`\`\`bash
code --install-extension ai-feedback-bridge-0.5.1.vsix
\`\`\`

### 2. Configure Auto-Continue
1. Look for **\`AI Bridge: 3738\`** in bottom-right status bar
2. Click it to open the beautiful settings panel
3. Toggle categories on/off, adjust intervals, customize messages
4. Click **\`$(play) Start\`** button to enable

### 3. Setup Auto-Approval (Optional)
1. Run command: **\`AI Feedback Bridge: Show Auto-Approval Script\`**
2. Open Developer Tools (\`Help\` → \`Toggle Developer Tools\`)
3. Paste script in Console tab and press Enter
4. Done! It will auto-click approval buttons safely

---

## 📋 Status Bar Controls

Two buttons in bottom-right corner:

| Button | Function |
|--------|----------|
| **\`AI Bridge: 3738\`** | Shows port, click to open settings panel |
| **\`$(play) Start\`** | Toggle auto-continue (spinning icon when active) |

---

## ⚙️ Category Configuration

Each category has independent settings:

| Category | Purpose | Default Interval |
|----------|---------|------------------|
| 📋 **Tasks** | Continue with current work | 5 minutes |
| ✨ **Improvements** | Code quality & optimizations | 10 minutes |
| 🧪 **Coverage** | Testing & validation | 15 minutes |
| 🛡️ **Robustness** | Error handling & stability | 10 minutes |
| 🧹 **Cleanup** | Remove unused code | 20 minutes |
| 💾 **Commits** | Save progress regularly | 15 minutes |

Click **\`AI Bridge: 3738\`** to customize in the settings panel.

---

## 🎯 Key Benefits

✅ **Silent Operation** - Zero popup notifications  
✅ **Smart Timing** - Only sends when intervals elapse  
✅ **Beautiful UI** - Custom settings panel with organized sections  
✅ **Multi-Window** - Independent configs per window  
✅ **Lightweight** - Only 24KB package size  
✅ **Safe Automation** - Prevents dangerous operations  

---

## 🔧 Advanced: HTTP Bridge API

Send messages from external systems to Copilot Chat.

### Endpoint
\`\`\`
POST http://localhost:3738
Content-Type: application/json
\`\`\`

### Payload
\`\`\`json
{
  "message": "User reported login button not working",
  "context": {
    "userId": "123",
    "page": "login"
  }
}
\`\`\`

### Example (Node.js)
\`\`\`javascript
fetch('http://localhost:3738', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Performance issue detected",
    context: { loadTime: "5.2s" }
  })
});
\`\`\`

---

## 📦 Requirements

- VS Code **1.96.0+**
- **GitHub Copilot** extension

---

## 📝 Version History

### 0.5.1 - Beautiful Settings UI
- Custom webview settings panel with organized sections
- Status bar shows port number: \`AI Bridge: 3738\`
- Buttons grouped together for clarity
- 99.7% package size reduction (7.3MB → 24KB)

### 0.5.0 - Smart Message Rotation
- 6 intelligent message categories with emoji
- Independent intervals per category
- Zero notification popups (all silent)
- Timestamp tracking for smart rotation

### 0.4.0 - Polish & Clarity
- Enhanced status bar with menu
- Improved documentation
- Better tooltips and descriptions

---

## 📄 License

MIT

---

**Made for AI-assisted development workflows** 🤖✨
