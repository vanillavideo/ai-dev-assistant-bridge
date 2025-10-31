// ============================================================================
// 🧩 VS Code Chat Auto-Approval System
// ============================================================================
// 
// PURPOSE:
// Automatically click "Allow" and "Keep" buttons in VS Code Chat/Agent interface
// 
// USAGE:
// 1. Open VS Code Developer Tools: Help → Toggle Developer Tools
// 2. Go to Console tab
// 3. Paste this entire script and press Enter
// 
// TO STOP:
// Run: clearInterval(window.__autoApproveInterval)
// 
// ============================================================================

(function() {
  console.log('[auto-approve] 🚀 Starting auto-approval script...');
  
  // Configuration
  const config = {
    interval: 1500, // Check every 1.5 seconds for faster response
    
    // CSS selectors for buttons
    selectors: {
      allButtons: [
        '.chat-buttons a',
        'a.monaco-button',
        'a.monaco-text-button',
        'button.monaco-button',
        '.action-label',
        '[role="button"]',
        '.chat-request-widget button',
        '.interactive-session button',
        '.quick-input-action button'
      ].join(', ')
    },
    
    // Regex patterns for matching button text
    patterns: {
      allow: /Allow|Keep|Proceed|Accept|Confirm|Continue|Yes|OK/i,
      dangerous: /delete|remove|rm\s|destroy|drop|uninstall/i // Safety: skip dangerous operations
    },
    
    // Track statistics
    stats: {
      totalClicks: 0,
      clicksByLabel: {},
      startTime: new Date(),
      lastCheck: new Date()
    }
  };

  /**
   * Main auto-approval function
   */
  const autoApprove = () => {
    let clickedThisRound = 0;
    config.stats.lastCheck = new Date();
    
    // Find all potential buttons
    const buttons = document.querySelectorAll(config.selectors.allButtons);
    
    console.log('[auto-approve] 🔍 Checking', buttons.length, 'buttons...');
    
    buttons.forEach(btn => {
      // Skip if already processed
      if (btn.hasAttribute('data-auto-approved')) {
        return;
      }
      
      // Get button label from aria-label, title, or text content
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const title = btn.getAttribute('title') || '';
      const textContent = btn.textContent || '';
      const innerText = btn.innerText || '';
      const label = (ariaLabel + ' ' + title + ' ' + textContent + ' ' + innerText).trim();
      
      // Skip if no label
      if (!label) {
        return;
      }
      
      // Safety check: skip dangerous operations
      if (config.patterns.dangerous.test(label)) {
        console.log('[auto-approve] ⚠️  Skipping dangerous operation:', label);
        return;
      }
      
      // Check if button matches approval pattern
      if (config.patterns.allow.test(label)) {
        try {
          // Log before clicking
          console.log('[auto-approve] 🎯 Found approval button:', label);
          
          // Click the button using multiple methods
          btn.click();
          
          // Alternative: dispatch click event for better compatibility
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          btn.dispatchEvent(clickEvent);
          
          // Mark as processed
          btn.setAttribute('data-auto-approved', 'true');
          
          // Update statistics
          config.stats.totalClicks++;
          config.stats.clicksByLabel[label] = (config.stats.clicksByLabel[label] || 0) + 1;
          clickedThisRound++;
          
          console.log(
            `✅ [auto-approve] Clicked: "${label}" (total: ${config.stats.totalClicks})`
          );
        } catch (error) {
          console.error('[auto-approve] ❌ Error clicking button:', error);
        }
      }
    });
    
    // Log summary if any buttons were clicked this round
    if (clickedThisRound > 0) {
      console.log(`[auto-approve] 📊 Round complete: ${clickedThisRound} click(s) - Total: ${config.stats.totalClicks}`);
    }
  };

  /**
   * Show statistics
   */
  window.__autoApproveStats = () => {
    const runtime = Math.floor((new Date() - config.stats.startTime) / 1000);
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Auto-Approval Statistics');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total Clicks: ${config.stats.totalClicks}`);
    console.log(`Runtime: ${runtime}s`);
    console.log('Clicks by Label:');
    Object.entries(config.stats.clicksByLabel).forEach(([label, count]) => {
      console.log(`  • ${label}: ${count}`);
    });
    console.log('═══════════════════════════════════════════════════');
  };

  /**
   * Update configuration
   */
  window.__autoApproveConfig = (key, value) => {
    if (key === 'interval') {
      // Restart with new interval
      clearInterval(window.__autoApproveInterval);
      config.interval = value;
      window.__autoApproveInterval = setInterval(autoApprove, config.interval);
      console.log(`[auto-approve] ⚙️  Interval updated to ${value}ms`);
    } else if (key in config) {
      config[key] = value;
      console.log(`[auto-approve] ⚙️  ${key} updated to`, value);
    } else {
      console.log('[auto-approve] ❌ Unknown config key:', key);
    }
  };

  // Run immediately on first load
  autoApprove();
  
  // Set up interval
  const intervalId = setInterval(autoApprove, config.interval);
  
  // Store interval ID globally for easy stopping
  window.__autoApproveInterval = intervalId;
  
  // Success message
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Auto-Approval Script Active!');
  console.log('═══════════════════════════════════════════════════');
  console.log('Commands:');
  console.log('  • Stop:   clearInterval(window.__autoApproveInterval)');
  console.log('  • Stats:  __autoApproveStats()');
  console.log('  • Config: __autoApproveConfig("interval", 3000)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Checking every ${config.interval}ms for approval buttons...`);
  
  return intervalId;
})();

// Optional: Add keyboard shortcut to toggle on/off
// Press Ctrl+Shift+A to toggle auto-approval
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    if (window.__autoApproveInterval) {
      clearInterval(window.__autoApproveInterval);
      window.__autoApproveInterval = null;
      console.log('[auto-approve] ⏸️  Paused (press Ctrl+Shift+A to resume)');
    } else {
      // Restart
      location.reload(); // Simple way to restart - or paste the script again
    }
  }
});
