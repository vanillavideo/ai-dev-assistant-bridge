"use strict";var G=Object.create;var L=Object.defineProperty;var K=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var Y=Object.getPrototypeOf,q=Object.prototype.hasOwnProperty;var Q=(o,n)=>{for(var t in n)L(o,t,{get:n[t],enumerable:!0})},B=(o,n,t,a)=>{if(n&&typeof n=="object"||typeof n=="function")for(let d of _(n))!q.call(o,d)&&d!==t&&L(o,d,{get:()=>n[d],enumerable:!(a=K(n,d))||a.enumerable});return o};var P=(o,n,t)=>(t=o!=null?G(Y(o)):{},B(n||!o||!o.__esModule?L(t,"default",{value:o,enumerable:!0}):t,o)),X=o=>B(L({},"__esModule",{value:!0}),o);var me={};Q(me,{activate:()=>ne,deactivate:()=>ge});module.exports=X(me);var e=P(require("vscode")),F=P(require("http")),W=P(require("fs")),H=P(require("path")),C,c,R,w,A,p=3737,b,O;function s(o,n,t){let d=`[${new Date().toISOString()}] [${o}]`,i=t?`${d} ${n} ${JSON.stringify(t)}`:`${d} ${n}`;c.appendLine(i),o==="ERROR"&&console.error(i)}function h(){return e.workspace.getConfiguration("aiFeedbackBridge",null)}async function S(o,n){await h().update(o,n,e.ConfigurationTarget.Global)}var U="aiFeedbackBridge.portRegistry",j=3737,Z=50;async function J(o){return o.globalState.get(U,[])}async function $(o,n){await o.globalState.update(U,n)}async function ee(o){let n=await J(o),t=e.workspace.name||"No Workspace",a=e.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",d=Date.now()-60*60*1e3,i=n.filter(g=>g.timestamp>d),r=i.find(g=>g.workspace===a);if(r)return s("INFO",`Reusing existing port ${r.port} for workspace`),r.timestamp=Date.now(),await $(o,i),r.port;let m=new Set(i.map(g=>g.port)),u=j;for(let g=0;g<Z;g++){let y=j+g;if(!m.has(y)&&await oe(y)){u=y;break}}return i.push({port:u,workspace:a,timestamp:Date.now()}),await $(o,i),s("INFO",`Auto-assigned port ${u} for workspace: ${t}`),u}async function oe(o){return new Promise(n=>{let t=F.createServer();t.once("error",a=>{a.code==="EADDRINUSE"?n(!1):n(!0)}),t.once("listening",()=>{t.close(),n(!0)}),t.listen(o)})}async function te(o,n){let t=await J(o),a=e.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",d=t.filter(i=>!(i.port===n&&i.workspace===a));await $(o,d),s("INFO",`Released port ${n}`)}async function ne(o){console.log("AI Agent Feedback Bridge is now active!"),O=o,c=e.window.createOutputChannel("AI Agent Feedback"),o.subscriptions.push(c),s("INFO","\u{1F680} AI Agent Feedback Bridge activated");let n=h(),t=n.get("port");!t||t===3737?(p=await ee(o),await S("port",p),s("INFO",`Auto-selected port: ${p}`)):(p=t,s("INFO",`Using configured port: ${p}`));let a=e.workspace.name||"No Workspace",d=e.workspace.workspaceFolders?.length||0;s("INFO",`Window context: ${a} (${d} folders)`),w=e.window.createStatusBarItem(e.StatusBarAlignment.Right,100),D(n),w.command={command:"ai-feedback-bridge.statusBarMenu",title:"AI Feedback Bridge Menu"},w.show(),o.subscriptions.push(w);let i=e.commands.registerCommand("ai-feedback-bridge.statusBarMenu",async()=>{let v=h().get("autoContinue.enabled",!1),f=[{label:v?"$(debug-pause) Stop Auto-Continue":"$(play) Start Auto-Continue",description:v?"Stop sending periodic reminders":"Start sending periodic reminders",action:"toggle"},{label:"$(gear) Settings",description:"Configure ports and intervals",action:"settings"}],I=await e.window.showQuickPick(f,{placeHolder:`AI Feedback Bridge - Port ${p}`});if(I)switch(I.action){case"toggle":await e.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");break;case"settings":await e.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge");break}});o.subscriptions.push(i),ie(o);let r=e.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async l=>{l||(l=await e.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),l&&await re(l,{})});o.subscriptions.push(r);let m=e.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let v=h().get("autoContinue.enabled",!1);await S("autoContinue.enabled",!v),e.window.showInformationMessage(`Auto-Continue ${v?"disabled \u274C":"enabled \u2705"}`)});o.subscriptions.push(m);let u=e.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let l=await e.window.showInputBox({prompt:"Enter new port number",value:p.toString(),validateInput:v=>{let f=parseInt(v);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});l&&(await S("port",parseInt(l)),e.window.showInformationMessage(`Port changed to ${l}. Reload VS Code.`,"Reload").then(v=>v==="Reload"&&e.commands.executeCommand("workbench.action.reloadWindow")))});o.subscriptions.push(u);let g=e.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let l=h(),v=l.get("autoContinue.interval",300),f=l.get("autoContinue.enabled",!1),N=`\u{1F309} AI Feedback Bridge Status

Window: ${e.workspace.name||"No Workspace"}
Port: ${p}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${v}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${p}`;e.window.showInformationMessage(N,"Open Settings","Toggle Auto-Continue").then(M=>{M==="Open Settings"?e.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge"):M==="Toggle Auto-Continue"&&e.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue")}),c.appendLine(N)});o.subscriptions.push(g),z(o),ce(),o.subscriptions.push(e.workspace.onDidChangeConfiguration(l=>{if(l.affectsConfiguration("aiFeedbackBridge")){let v=h();if(s("DEBUG","Configuration changed",{workspace:e.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>l.affectsConfiguration(`aiFeedbackBridge.${f}`))}),l.affectsConfiguration("aiFeedbackBridge.port")){let f=v.get("port",3737);f!==p&&(s("INFO",`Port change detected: ${p} \u2192 ${f}`),e.window.showInformationMessage(`Port changed from ${p} to ${f}. Reload this window to apply.`,"Reload Now","Later").then(I=>{I==="Reload Now"&&e.commands.executeCommand("workbench.action.reloadWindow")}))}w&&D(v),l.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ae(o)}})),R=e.chat.createChatParticipant("ai-agent-feedback-bridge.agent",se),R.iconPath=e.Uri.file(o.asAbsolutePath("icon.png")),o.subscriptions.push(R);let y=e.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>le(o));o.subscriptions.push(y);let E=e.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>pe());o.subscriptions.push(E);let k=e.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>x());o.subscriptions.push(k),e.window.showInformationMessage(`AI Agent Feedback Bridge is listening on http://localhost:${p}`),c.appendLine("Feedback server started on http://localhost:3737")}function D(o){if(!w)return;let n=o.get("autoContinue.enabled",!1),t=o.get("autoContinue.interval",300),a="$(radio-tower)",d=n?"$(sync~spin)":"$(debug-pause)";w.text=`${a} ${p} ${d}`,w.tooltip=new e.MarkdownString(`**AI Feedback Bridge**

**Port:** ${p}
**Auto-Continue:** ${n?`ON (every ${t}s)`:"OFF"}

---

\u{1F5B1}\uFE0F **Click for:**
\u2022 Start/Stop Auto-Continue
\u2022 Settings`),w.tooltip.supportHtml=!0}function z(o){let n=h();if(n.get("autoContinue.enabled",!1)){let a=n.get("autoContinue.interval",300)*1e3,d=n.get("autoContinue.message","Continue with tasks, improvements, code coverage, please. Prioritize improvements, code robustness, maintainability. Cleanup unused files if you need to. Periodically commit."),i=e.workspace.name||"No Workspace";s("INFO",`\u2705 Auto-Continue enabled for window: ${i} (every ${a/1e3}s)`),A=setInterval(async()=>{try{s("INFO","[Auto-Continue] Sending periodic reminder"),await T(d,{source:"auto_continue",timestamp:new Date().toISOString(),interval:a/1e3})}catch(r){s("ERROR","[Auto-Continue] Failed to send message",{error:r})}},a)}else s("DEBUG","Auto-Continue is disabled")}function ae(o){A&&(clearInterval(A),A=void 0,c.appendLine("Auto-Continue stopped")),z(o)}async function se(o,n,t,a){c.appendLine(`Chat request received: ${o.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${o.prompt}

`),o.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[i]=await e.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i){let r=[e.LanguageModelChatMessage.User(o.prompt)],m=await i.sendRequest(r,{},a);for await(let u of m.text)t.markdown(u)}}catch(i){i instanceof e.LanguageModelError&&(c.appendLine(`Language model error: ${i.message}`),t.markdown(`\u26A0\uFE0F Error: ${i.message}

`))}return{metadata:{command:"process-feedback"}}}async function T(o,n){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${o}

`,n&&Object.keys(n).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(n,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,c.appendLine("Processing feedback through AI agent..."),c.appendLine(t);try{let[a]=await e.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(a)return c.appendLine("\u2705 AI Agent processing request..."),await e.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await e.commands.executeCommand("workbench.action.chat.submit")}catch{c.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),e.window.showInformationMessage("\u2705 Feedback sent to AI Agent!"),!0}catch(a){c.appendLine(`Could not access language model: ${a}`)}return await e.env.clipboard.writeText(t),e.window.showInformationMessage("Feedback copied to clipboard! Open Copilot Chat (@workspace) and paste it.","Open Chat").then(a=>{a==="Open Chat"&&e.commands.executeCommand("workbench.action.chat.open")}),!0}catch(t){return c.appendLine(`Error sending to agent: ${t}`),e.window.showErrorMessage(`Failed to send to agent: ${t}`),!1}}async function re(o,n){return T(o,n)}function ie(o){C=F.createServer(async(n,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),n.method==="OPTIONS"){t.writeHead(200),t.end();return}if(n.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(n.url==="/restart-app"||n.url?.startsWith("/restart-app?")){let r=n.url.split("?"),m=new URLSearchParams(r[1]||""),u=parseInt(m.get("delay")||"30",10);c.appendLine(`Received restart request for Electron app (delay: ${u}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${u}s)`,delay:u})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:y}=require("util"),E=y(g);c.appendLine("Killing Electron process...");try{await E('pkill -f "electron.*Code/AI"')}catch{c.appendLine("Kill command completed (process may not have been running)")}c.appendLine(`Waiting ${u} seconds before restart...`),await new Promise(l=>setTimeout(l,u*1e3));let k=e.workspace.workspaceFolders?.[0]?.uri.fsPath;k&&k.includes("/AI")?(c.appendLine(`Restarting Electron app in: ${k}`),g(`cd "${k}" && npm run dev > /dev/null 2>&1 &`),c.appendLine("Electron app restart command sent")):c.appendLine(`Could not find workspace path: ${k}`)}catch(g){c.appendLine(`Restart error: ${g}`)}},100);return}let a="",d=1024*1024,i=0;n.on("data",r=>{if(i+=r.length,i>d){s("WARN","Request body too large",{size:i}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),n.destroy();return}a+=r.toString()}),n.on("end",async()=>{try{let r=JSON.parse(a);if(!r||typeof r!="object")throw new Error("Invalid feedback structure: must be an object");if(!r.message||typeof r.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let m=r.message.trim();if(m.length===0)throw new Error("Invalid feedback: message cannot be empty");if(m.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");s("INFO","Received feedback",{messageLength:m.length,hasContext:!!r.context});let u=await T(m,r.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:u,message:u?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(r){let m=r instanceof Error?r.message:String(r);s("ERROR","Error processing feedback",{error:m}),r instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:m})))}})});try{C.listen(p,()=>{s("INFO",`\u2705 Server listening on port ${p}`),e.window.showInformationMessage(`AI Agent Feedback Bridge is listening on http://localhost:${p}`)}),C.on("error",n=>{n.code==="EADDRINUSE"?(s("ERROR",`Port ${p} is already in use`,{error:n.message}),e.window.showErrorMessage(`Port ${p} is already in use. Please change the port in settings.`,"Open Settings").then(t=>{t==="Open Settings"&&e.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge")})):(s("ERROR","Server error occurred",{error:n.message,code:n.code}),e.window.showErrorMessage(`Server error: ${n.message}`))})}catch(n){s("ERROR","Failed to start server",{error:n}),e.window.showErrorMessage(`Failed to start feedback server: ${n}`)}o.subscriptions.push({dispose:()=>{C&&(s("INFO","Closing server"),C.close())}})}function ce(){h().get("autoApproval.enabled",!1)&&setTimeout(async()=>{try{await e.commands.executeCommand("workbench.action.toggleDevTools"),setTimeout(()=>{e.window.showInformationMessage('Auto-Approval enabled! Developer Tools opened. Click "Auto-Inject Script" to automatically paste and run the script.',"Auto-Inject Script","Manual Copy","Disable").then(t=>{t==="Auto-Inject Script"?de():t==="Manual Copy"?x():t==="Disable"&&S("autoApproval.enabled",!1)})},1e3)}catch{e.window.showInformationMessage("Auto-Approval is enabled! Click to get the console script.","Get Script","Disable").then(a=>{a==="Get Script"?x():a==="Disable"&&S("autoApproval.enabled",!1)})}},2e3)}async function de(){let o=V();await e.env.clipboard.writeText(o);let n=e.window.createWebviewPanel("autoInject","Auto-Approval Auto-Injection",e.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});n.webview.html=`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Auto-Approval Auto-Injection</title>
			<style>
				body { 
					font-family: var(--vscode-font-family); 
					padding: 20px; 
					background: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
				}
				.status { padding: 10px; border-radius: 4px; margin: 10px 0; }
				.success { background: var(--vscode-inputValidation-infoBorder); }
				.warning { background: var(--vscode-inputValidation-warningBorder); }
				.error { background: var(--vscode-inputValidation-errorBorder); }
				button { 
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 8px 16px;
					border-radius: 4px;
					cursor: pointer;
					margin: 5px;
				}
				button:hover { background: var(--vscode-button-hoverBackground); }
				pre { 
					background: var(--vscode-textCodeBlock-background);
					padding: 10px;
					border-radius: 4px;
					overflow-x: auto;
					font-size: 12px;
				}
			</style>
		</head>
		<body>
			<h2>\u{1F680} Auto-Approval Auto-Injection</h2>
			
			<div class="status warning">
				<strong>\u26A1 Attempting Automatic Injection...</strong><br>
				The script is being automatically injected into the developer console.
			</div>
			
			<div id="status">
				<p>Status: <span id="statusText">Initializing...</span></p>
			</div>
			
			<div>
				<button onclick="retryInjection()">\u{1F504} Retry Injection</button>
				<button onclick="manualCopy()">\u{1F4CB} Manual Copy</button>
				<button onclick="closePanel()">\u274C Close</button>
			</div>
			
			<details>
				<summary>\u{1F4DD} Script Contents (Click to expand)</summary>
				<pre id="scriptContent"></pre>
			</details>

			<script>
				const vscode = acquireVsCodeApi();
				
				// Store the script
				const script = ${JSON.stringify(o)};
				document.getElementById('scriptContent').textContent = script;
				
				// Attempt automatic injection
				function attemptAutoInjection() {
					try {
						document.getElementById('statusText').textContent = 'Attempting injection...';
						
						// Try to inject into parent console
						if (window.parent && window.parent.console) {
							window.parent.eval(script);
							document.getElementById('statusText').textContent = '\u2705 Injected successfully!';
							document.getElementById('status').className = 'status success';
							vscode.postMessage({ command: 'injectionSuccess' });
							return true;
						}
						
						// Alternative: try to access the main window
						if (window.top && window.top !== window) {
							window.top.eval(script);
							document.getElementById('statusText').textContent = '\u2705 Injected successfully!';
							document.getElementById('status').className = 'status success';
							vscode.postMessage({ command: 'injectionSuccess' });
							return true;
						}
						
						throw new Error('Cannot access parent console');
					} catch (error) {
						document.getElementById('statusText').textContent = '\u274C Auto-injection failed: ' + error.message;
						document.getElementById('status').className = 'status error';
						vscode.postMessage({ command: 'injectionFailed', error: error.message });
						return false;
					}
				}
				
				function retryInjection() {
					attemptAutoInjection();
				}
				
				function manualCopy() {
					navigator.clipboard.writeText(script).then(() => {
						vscode.postMessage({ command: 'manualCopy' });
					});
				}
				
				function closePanel() {
					vscode.postMessage({ command: 'close' });
				}
				
				// Try injection on load
				setTimeout(attemptAutoInjection, 500);
			</script>
		</body>
		</html>
	`,n.webview.onDidReceiveMessage(async t=>{switch(t.command){case"injectionSuccess":e.window.showInformationMessage("\u2705 Auto-approval script injected successfully!"),n.dispose(),setTimeout(async()=>{try{await e.commands.executeCommand("workbench.action.toggleDevTools"),s("INFO","Developer Tools auto-closed after successful injection")}catch(a){s("WARN","Could not auto-close Developer Tools",a)}},1e3);break;case"injectionFailed":e.window.showWarningMessage(`\u274C Auto-injection failed: ${t.error}. Use manual copy instead.`,"Manual Copy").then(a=>{a==="Manual Copy"&&x()});break;case"manualCopy":e.window.showInformationMessage("Script copied to clipboard! Paste in Developer Tools Console.");break;case"close":n.dispose();break}})}function V(){try{let o=H.join(O.extensionPath,"auto-approval-script.js");return W.readFileSync(o,"utf8")}catch(o){return s("ERROR","Failed to read auto-approval-script.js",o),"// Error: Could not load auto-approval script"}}function le(o){if(b){c.appendLine("Auto-approval is already enabled");return}let t=h().get("autoApproval.intervalMs",2e3);s("INFO",`Enabling auto-approval with ${t}ms interval`),b=setInterval(async()=>{try{await e.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),o.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),e.window.showInformationMessage('Auto-approval enabled. Use "Disable Auto-Approval" command to turn off.',"Inject Script").then(a=>{a==="Inject Script"&&x()})}function pe(){b?(clearInterval(b),b=void 0,c.appendLine("Auto-approval disabled"),e.window.showInformationMessage("Auto-approval disabled")):e.window.showInformationMessage("Auto-approval is not currently enabled")}function x(){let o=V(),n=e.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",e.ViewColumn.One,{enableScripts:!0});n.webview.html=ue(o),e.env.clipboard.writeText(o),e.window.showInformationMessage("Auto-approval script copied to clipboard!")}function ue(o){return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto-Approval Script</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            color: var(--vscode-textLink-foreground);
        }
        .step {
            margin: 20px 0;
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 14px;
            margin: 5px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .warning {
            color: var(--vscode-editorWarning-foreground);
            padding: 10px;
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 3px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>\u{1F9E9} VS Code Chat Auto-Approval System</h1>
    
    <div class="warning">
        \u26A0\uFE0F <strong>Note:</strong> This script auto-clicks "Allow" and "Keep" buttons in the chat interface.
        Make sure you trust the operations being performed!
    </div>

    <div class="step">
        <h2>\u{1F4CB} Step 1: The script is already copied to your clipboard!</h2>
        <p>Just paste it in the next step.</p>
    </div>

    <div class="step">
        <h2>\u{1F527} Step 2: Open VS Code Developer Tools</h2>
        <p>Go to: <strong>Help \u2192 Toggle Developer Tools</strong></p>
        <p>Or use keyboard shortcut: <strong>\u2318\u2325I</strong> (Mac) / <strong>Ctrl+Shift+I</strong> (Windows/Linux)</p>
    </div>

    <div class="step">
        <h2>\u{1F4BB} Step 3: Paste and run the script</h2>
        <p>1. Click on the <strong>Console</strong> tab in Developer Tools</p>
        <p>2. Paste the script (\u2318V / Ctrl+V)</p>
        <p>3. Press <strong>Enter</strong> to execute</p>
    </div>

    <div class="step">
        <h2>\u2705 What happens next?</h2>
        <ul>
            <li>The script will check every 2 seconds for "Allow" or "Keep" buttons</li>
            <li>When found, it automatically clicks them</li>
            <li>You'll see confirmation messages in the console</li>
            <li>The script includes safety checks to skip dangerous operations (delete, remove, rm)</li>
        </ul>
    </div>

    <div class="step">
        <h2>\u{1F6D1} To stop the script:</h2>
        <p>In the Developer Console, run:</p>
        <div class="code-block">clearInterval(window.__autoApproveInterval)</div>
    </div>

    <hr style="margin: 30px 0; border: 1px solid var(--vscode-panel-border);">

    <h2>\u{1F4DC} Full Script (already copied):</h2>
    <div class="code-block">${o.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>

    <button class="button" onclick="copyScript()">Copy Script Again</button>

    <script>
        function copyScript() {
            const script = \`${o.replace(/`/g,"\\`").replace(/\$/g,"\\$")}\`;
            navigator.clipboard.writeText(script).then(() => {
                alert('Script copied to clipboard!');
            });
        }
    </script>
</body>
</html>`}async function ge(){C&&(C.close(),s("INFO","HTTP server closed")),A&&(clearInterval(A),A=void 0,s("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,s("INFO","Auto-approval interval cleared")),O&&await te(O,p),s("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
