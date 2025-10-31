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
// IMPORTANT:
// This script is designed to SKIP:
// - Extension settings (marked with data-auto-approved="skip")
// - VS Code status bar buttons (to prevent toggling extension controls)
// It will NOT accidentally toggle settings in the AI Feedback Bridge extension

(function() {
    'use strict';
    
    // Check if already running
    if (window.__autoApproveInterval) {
        console.log('🔄 Auto-approval already running!');
        console.log('📛 To stop: clearInterval(window.__autoApproveInterval)');
        return;
    }

    console.log('🚀 Starting VS Code Chat Auto-Approval System...');
    
    // Configuration
    const CONFIG = {
        interval: 2000,           // Check every 2 seconds
        safeMode: true,           // Skip dangerous operations
        logClicks: true,          // Log button clicks
        skipSelectors: [
            '[data-auto-approved="skip"]',
            '.setting-item *',
            '.settings-editor *',
            '.status-bar *',
            '.extension-editor *',
            'input[type="checkbox"]',
            '.monaco-checkbox *',
            '.toggle-container *',
            'label *'
        ]
    };

    // Safety patterns to avoid
    const DANGER_PATTERNS = [
        /delete|remove|uninstall|rm\s/i,
        /disable|turn\s+off/i,
        /clear\s+all|reset/i
    ];
    
    // Patterns that indicate extension control buttons (check if in status bar)
    const EXTENSION_CONTROL_PATTERNS = [
        /ai\s+dev/i,
        /start.*auto/i,
        /stop.*auto/i
    ];

    function isElementSafe(element) {
        // Check if element should be skipped
        for (const selector of CONFIG.skipSelectors) {
            if (element.matches(selector) || element.closest(selector.replace(' *', ''))) {
                return false;
            }
        }
        
        // Check text content for dangerous operations
        const text = element.textContent || element.title || element.getAttribute('aria-label') || '';
        if (CONFIG.safeMode && DANGER_PATTERNS.some(pattern => pattern.test(text))) {
            console.log('⚠️ Skipping potentially dangerous button:', text);
            return false;
        }
        
        // Check for extension control buttons (especially in status bar)
        if (element.closest('.status-bar-item') || element.closest('.statusbar-item')) {
            if (EXTENSION_CONTROL_PATTERNS.some(pattern => pattern.test(text))) {
                console.log('⚠️ Skipping extension control button:', text);
                return false;
            }
        }
        
        return true;
    }

    function findAndClickButtons() {
        const targetTexts = ['allow', 'keep', 'accept', 'continue', 'yes', 'ok'];
        const selectors = [
            'button:not([type="checkbox"])',
            '.monaco-button',
            '[role="button"]:not([role="checkbox"])',
            '.action-item:not(.toggle-container)',
            '.quick-pick-item'
        ];
        
        let clickCount = 0;
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Skip if it's a checkbox or inside a checkbox container
                if (element.type === 'checkbox' || 
                    element.getAttribute('role') === 'checkbox' ||
                    element.closest('input[type="checkbox"]') ||
                    element.closest('.monaco-checkbox') ||
                    element.closest('.toggle-container')) {
                    return;
                }
                
                const text = (element.textContent || '').toLowerCase().trim();
                const title = (element.title || '').toLowerCase();
                const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
                
                // Check if this looks like a button we want to click
                const isTarget = targetTexts.some(target => 
                    text.includes(target) || title.includes(target) || ariaLabel.includes(target)
                );
                
                if (isTarget && isElementSafe(element) && element.offsetParent !== null) {
                    try {
                        element.click();
                        clickCount++;
                        
                        if (CONFIG.logClicks) {
                            console.log(`✅ Auto-clicked: "${text || title || ariaLabel}"`);
                        }
                    } catch (error) {
                        console.log('⚠️ Click failed:', error.message);
                    }
                }
            });
        });
        
        return clickCount;
    }

    // Start the auto-approval system
    let totalClicks = 0;
    const startTime = Date.now();
    
    window.__autoApproveInterval = setInterval(() => {
        const clicks = findAndClickButtons();
        totalClicks += clicks;
    }, CONFIG.interval);
    
    // Status logging
    console.log(`🎯 Auto-approval active (checking every ${CONFIG.interval}ms)`);
    console.log('📛 To stop: clearInterval(window.__autoApproveInterval)');
    console.log('📊 To see stats: window.__autoApproveStats()');
    
    // Stats function
    window.__autoApproveStats = function() {
        const runtime = Math.round((Date.now() - startTime) / 1000);
        console.log(`📊 Auto-Approval Stats:`);
        console.log(`   Runtime: ${runtime} seconds`);
        console.log(`   Total clicks: ${totalClicks}`);
        console.log(`   Rate: ${(totalClicks / Math.max(runtime, 1)).toFixed(2)} clicks/sec`);
    };
    
    // Cleanup function
    window.__autoApproveStop = function() {
        if (window.__autoApproveInterval) {
            clearInterval(window.__autoApproveInterval);
            window.__autoApproveInterval = undefined;
            window.__autoApproveStats();
            console.log('🛑 Auto-approval stopped');
        }
    };

})();