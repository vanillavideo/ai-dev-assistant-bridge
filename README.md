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
code --install-extension ai-feedback-bridge-0.6.2.vsix
\`\`\`

### 2. Configure Auto-Continue
1. Look for **\`AI Dev: 3737\`** in bottom-right status bar
2. Click it to open the compact settings panel
3. Toggle categories on/off, adjust intervals, customize messages
4. Click **\`$(play) Start\`** button to enable

### 3. Manual Trigger
- Click **\`$(run) Run Now\`** to immediately send all enabled reminders
- Bypasses interval timers - perfect for testing or forcing updates

### 4. Setup Auto-Approval (Optional)
1. Click **\`$(clippy) Inject\`** button in status bar
2. Paste script in browser Developer Tools Console
3. Done! It will auto-click approval buttons safely

---

## 📋 Status Bar Controls

Four buttons in bottom-right corner:

| Button | Function |
|--------|----------|
| **\`AI Dev: 3737\`** | Shows port, click to open settings panel |
| **\`$(play) Start\`** | Toggle auto-continue (spinning icon when active) |
| **\`$(run) Run Now\`** | Manually trigger all enabled reminders (ignores intervals) |
| **\`$(clippy) Inject\`** | Copy auto-approval script to clipboard |

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

Click **\`AI Dev: 3737\`** to customize in the settings panel.

---

## 🎯 Key Benefits

✅ **Silent Operation** - Zero popup notifications  
✅ **Smart Timing** - Only sends when intervals elapse  
✅ **Manual Trigger** - "Run Now" button bypasses timers  
✅ **Compact UI** - Custom settings panel (14px fonts, organized tables)  
✅ **Multi-Window** - Independent configs & unique ports per window  
✅ **Lightweight** - ~100KB package with full test suite  
✅ **Safe Automation** - Prevents dangerous operations  
✅ **One-Click Inject** - Auto-approval script copied to clipboard  

---

## 🔧 Advanced: HTTP Bridge API

Send messages from external systems to Copilot Chat.

### Endpoint
```
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
