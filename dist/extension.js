"use strict";var G=Object.create;var L=Object.defineProperty;var K=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var Y=Object.getPrototypeOf,q=Object.prototype.hasOwnProperty;var Q=(e,n)=>{for(var o in n)L(e,o,{get:n[o],enumerable:!0})},B=(e,n,o,a)=>{if(n&&typeof n=="object"||typeof n=="function")for(let d of _(n))!q.call(e,d)&&d!==o&&L(e,d,{get:()=>n[d],enumerable:!(a=K(n,d))||a.enumerable});return e};var P=(e,n,o)=>(o=e!=null?G(Y(e)):{},B(n||!e||!e.__esModule?L(o,"default",{value:e,enumerable:!0}):o,e)),X=e=>B(L({},"__esModule",{value:!0}),e);var me={};Q(me,{activate:()=>ne,deactivate:()=>ge});module.exports=X(me);var t=P(require("vscode")),F=P(require("http")),W=P(require("fs")),H=P(require("path")),C,c,R,w,A,p=3737,b,O;function s(e,n,o){let d=`[${new Date().toISOString()}] [${e}]`,i=o?`${d} ${n} ${JSON.stringify(o)}`:`${d} ${n}`;c.appendLine(i),e==="ERROR"&&console.error(i)}function h(){return t.workspace.getConfiguration("aiFeedbackBridge",null)}async function S(e,n){await h().update(e,n,t.ConfigurationTarget.Global)}var U="aiFeedbackBridge.portRegistry",j=3737,Z=50;async function J(e){return e.globalState.get(U,[])}async function $(e,n){await e.globalState.update(U,n)}async function ee(e){let n=await J(e),o=t.workspace.name||"No Workspace",a=t.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",d=Date.now()-60*60*1e3,i=n.filter(g=>g.timestamp>d),r=i.find(g=>g.workspace===a);if(r)return s("INFO",`Reusing existing port ${r.port} for workspace`),r.timestamp=Date.now(),await $(e,i),r.port;let m=new Set(i.map(g=>g.port)),u=j;for(let g=0;g<Z;g++){let y=j+g;if(!m.has(y)&&await te(y)){u=y;break}}return i.push({port:u,workspace:a,timestamp:Date.now()}),await $(e,i),s("INFO",`Auto-assigned port ${u} for workspace: ${o}`),u}async function te(e){return new Promise(n=>{let o=F.createServer();o.once("error",a=>{a.code==="EADDRINUSE"?n(!1):n(!0)}),o.once("listening",()=>{o.close(),n(!0)}),o.listen(e)})}async function oe(e,n){let o=await J(e),a=t.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",d=o.filter(i=>!(i.port===n&&i.workspace===a));await $(e,d),s("INFO",`Released port ${n}`)}async function ne(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,c=t.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(c),s("INFO","\u{1F680} AI Agent Feedback Bridge activated");let n=h(),o=n.get("port");!o||o===3737?(p=await ee(e),await S("port",p),s("INFO",`Auto-selected port: ${p}`)):(p=o,s("INFO",`Using configured port: ${p}`));let a=t.workspace.name||"No Workspace",d=t.workspace.workspaceFolders?.length||0;s("INFO",`Window context: ${a} (${d} folders)`),w=t.window.createStatusBarItem(t.StatusBarAlignment.Right,100),D(n),w.command={command:"ai-feedback-bridge.statusBarMenu",title:"AI Feedback Bridge Menu"},w.show(),e.subscriptions.push(w);let i=t.commands.registerCommand("ai-feedback-bridge.statusBarMenu",async()=>{let v=h().get("autoContinue.enabled",!1),f=[{label:v?"$(debug-pause) Stop Auto-Continue":"$(play) Start Auto-Continue",description:v?"Stop sending periodic reminders":"Start sending periodic reminders",action:"toggle"},{label:"$(gear) Settings",description:"Configure ports and intervals",action:"settings"}],I=await t.window.showQuickPick(f,{placeHolder:`AI Feedback Bridge - Port ${p}`});if(I)switch(I.action){case"toggle":await t.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue");break;case"settings":await t.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge");break}});e.subscriptions.push(i),ie(e);let r=t.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async l=>{l||(l=await t.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),l&&await re(l,{})});e.subscriptions.push(r);let m=t.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let v=h().get("autoContinue.enabled",!1);await S("autoContinue.enabled",!v),t.window.showInformationMessage(`Auto-Continue ${v?"disabled \u274C":"enabled \u2705"}`)});e.subscriptions.push(m);let u=t.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let l=await t.window.showInputBox({prompt:"Enter new port number",value:p.toString(),validateInput:v=>{let f=parseInt(v);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});l&&(await S("port",parseInt(l)),t.window.showInformationMessage(`Port changed to ${l}. Reload VS Code.`,"Reload").then(v=>v==="Reload"&&t.commands.executeCommand("workbench.action.reloadWindow")))});e.subscriptions.push(u);let g=t.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let l=h(),v=l.get("autoContinue.interval",300),f=l.get("autoContinue.enabled",!1),N=`\u{1F309} AI Feedback Bridge Status

Window: ${t.workspace.name||"No Workspace"}
Port: ${p}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${v}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${p}`;t.window.showInformationMessage(N,"Open Settings","Toggle Auto-Continue").then(M=>{M==="Open Settings"?t.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge"):M==="Toggle Auto-Continue"&&t.commands.executeCommand("ai-feedback-bridge.toggleAutoContinue")}),c.appendLine(N)});e.subscriptions.push(g),z(e),ce(),e.subscriptions.push(t.workspace.onDidChangeConfiguration(l=>{if(l.affectsConfiguration("aiFeedbackBridge")){let v=h();if(s("DEBUG","Configuration changed",{workspace:t.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>l.affectsConfiguration(`aiFeedbackBridge.${f}`))}),l.affectsConfiguration("aiFeedbackBridge.port")){let f=v.get("port",3737);f!==p&&(s("INFO",`Port change detected: ${p} \u2192 ${f}`),t.window.showInformationMessage(`Port changed from ${p} to ${f}. Reload this window to apply.`,"Reload Now","Later").then(I=>{I==="Reload Now"&&t.commands.executeCommand("workbench.action.reloadWindow")}))}w&&D(v),l.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ae(e)}})),R=t.chat.createChatParticipant("ai-agent-feedback-bridge.agent",se),R.iconPath=t.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(R);let y=t.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>le(e));e.subscriptions.push(y);let E=t.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>pe());e.subscriptions.push(E);let k=t.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>x());e.subscriptions.push(k),s("INFO",`Feedback server started on http://localhost:${p}`)}function D(e){if(!w)return;let n=e.get("autoContinue.enabled",!1),o=e.get("autoContinue.interval",300),a="$(radio-tower)",d=n?"$(sync~spin)":"$(debug-pause)";w.text=`${a} ${p} ${d}`,w.tooltip=new t.MarkdownString(`**AI Feedback Bridge**

**Port:** ${p}
**Auto-Continue:** ${n?`ON (every ${o}s)`:"OFF"}

---

\u{1F5B1}\uFE0F **Click for:**
\u2022 Start/Stop Auto-Continue
\u2022 Settings`),w.tooltip.supportHtml=!0}function z(e){let n=h();if(n.get("autoContinue.enabled",!1)){let a=n.get("autoContinue.interval",300)*1e3,d=n.get("autoContinue.message","Continue with tasks, improvements, code coverage, please. Prioritize improvements, code robustness, maintainability. Cleanup unused files if you need to. Periodically commit."),i=t.workspace.name||"No Workspace";s("INFO",`\u2705 Auto-Continue enabled for window: ${i} (every ${a/1e3}s)`),A=setInterval(async()=>{try{s("INFO","[Auto-Continue] Sending periodic reminder"),await T(d,{source:"auto_continue",timestamp:new Date().toISOString(),interval:a/1e3})}catch(r){s("ERROR","[Auto-Continue] Failed to send message",{error:r})}},a)}else s("DEBUG","Auto-Continue is disabled")}function ae(e){A&&(clearInterval(A),A=void 0,c.appendLine("Auto-Continue stopped")),z(e)}async function se(e,n,o,a){c.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[i]=await t.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i){let r=[t.LanguageModelChatMessage.User(e.prompt)],m=await i.sendRequest(r,{},a);for await(let u of m.text)o.markdown(u)}}catch(i){i instanceof t.LanguageModelError&&(c.appendLine(`Language model error: ${i.message}`),o.markdown(`\u26A0\uFE0F Error: ${i.message}

`))}return{metadata:{command:"process-feedback"}}}async function T(e,n){try{let o=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;o+=`**User Feedback:**
${e}

`,n&&Object.keys(n).length>0&&(o+=`**Context:**
`,o+=`\`\`\`json
${JSON.stringify(n,null,2)}
\`\`\`

`),o+=`**Instructions:**
`,o+="Analyze this feedback and provide actionable responses. ",o+="If it's a bug, analyze the root cause. ",o+="If it's a feature request, provide an implementation plan. ",o+=`Make code changes if needed using available tools.

`,c.appendLine("Processing feedback through AI agent..."),c.appendLine(o);try{let[a]=await t.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(a)return c.appendLine("\u2705 AI Agent processing request..."),await t.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await t.commands.executeCommand("workbench.action.chat.submit")}catch{c.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),s("INFO","Feedback sent to AI Agent"),!0}catch(a){c.appendLine(`Could not access language model: ${a}`)}return await t.env.clipboard.writeText(o),t.window.showInformationMessage("Feedback copied to clipboard! Open Copilot Chat (@workspace) and paste it.","Open Chat").then(a=>{a==="Open Chat"&&t.commands.executeCommand("workbench.action.chat.open")}),!0}catch(o){return c.appendLine(`Error sending to agent: ${o}`),t.window.showErrorMessage(`Failed to send to agent: ${o}`),!1}}async function re(e,n){return T(e,n)}function ie(e){C=F.createServer(async(n,o)=>{if(o.setHeader("Access-Control-Allow-Origin","*"),o.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),o.setHeader("Access-Control-Allow-Headers","Content-Type"),n.method==="OPTIONS"){o.writeHead(200),o.end();return}if(n.method!=="POST"){o.writeHead(405,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Method not allowed"}));return}if(n.url==="/restart-app"||n.url?.startsWith("/restart-app?")){let r=n.url.split("?"),m=new URLSearchParams(r[1]||""),u=parseInt(m.get("delay")||"30",10);c.appendLine(`Received restart request for Electron app (delay: ${u}s)`),o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${u}s)`,delay:u})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:y}=require("util"),E=y(g);c.appendLine("Killing Electron process...");try{await E('pkill -f "electron.*Code/AI"')}catch{c.appendLine("Kill command completed (process may not have been running)")}c.appendLine(`Waiting ${u} seconds before restart...`),await new Promise(l=>setTimeout(l,u*1e3));let k=t.workspace.workspaceFolders?.[0]?.uri.fsPath;k&&k.includes("/AI")?(c.appendLine(`Restarting Electron app in: ${k}`),g(`cd "${k}" && npm run dev > /dev/null 2>&1 &`),c.appendLine("Electron app restart command sent")):c.appendLine(`Could not find workspace path: ${k}`)}catch(g){c.appendLine(`Restart error: ${g}`)}},100);return}let a="",d=1024*1024,i=0;n.on("data",r=>{if(i+=r.length,i>d){s("WARN","Request body too large",{size:i}),o.writeHead(413,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Request body too large (max 1MB)"})),n.destroy();return}a+=r.toString()}),n.on("end",async()=>{try{let r=JSON.parse(a);if(!r||typeof r!="object")throw new Error("Invalid feedback structure: must be an object");if(!r.message||typeof r.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let m=r.message.trim();if(m.length===0)throw new Error("Invalid feedback: message cannot be empty");if(m.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");s("INFO","Received feedback",{messageLength:m.length,hasContext:!!r.context});let u=await T(m,r.context);o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:u,message:u?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(r){let m=r instanceof Error?r.message:String(r);s("ERROR","Error processing feedback",{error:m}),r instanceof SyntaxError?(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Invalid JSON format"}))):(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:m})))}})});try{C.listen(p,()=>{s("INFO",`\u2705 Server listening on port ${p}`)}),C.on("error",n=>{n.code==="EADDRINUSE"?(s("ERROR",`Port ${p} is already in use`,{error:n.message}),t.window.showErrorMessage(`Port ${p} is already in use. Please change the port in settings.`,"Open Settings").then(o=>{o==="Open Settings"&&t.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge")})):(s("ERROR","Server error occurred",{error:n.message,code:n.code}),t.window.showErrorMessage(`Server error: ${n.message}`))})}catch(n){s("ERROR","Failed to start server",{error:n}),t.window.showErrorMessage(`Failed to start feedback server: ${n}`)}e.subscriptions.push({dispose:()=>{C&&(s("INFO","Closing server"),C.close())}})}function ce(){h().get("autoApproval.enabled",!1)&&setTimeout(async()=>{try{await t.commands.executeCommand("workbench.action.toggleDevTools"),setTimeout(()=>{t.window.showInformationMessage('Auto-Approval enabled! Developer Tools opened. Click "Auto-Inject Script" to automatically paste and run the script.',"Auto-Inject Script","Manual Copy","Disable").then(o=>{o==="Auto-Inject Script"?de():o==="Manual Copy"?x():o==="Disable"&&S("autoApproval.enabled",!1)})},1e3)}catch{t.window.showInformationMessage("Auto-Approval is enabled! Click to get the console script.","Get Script","Disable").then(a=>{a==="Get Script"?x():a==="Disable"&&S("autoApproval.enabled",!1)})}},2e3)}async function de(){let e=V();await t.env.clipboard.writeText(e);let n=t.window.createWebviewPanel("autoInject","Auto-Approval Auto-Injection",t.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});n.webview.html=`
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
				const script = ${JSON.stringify(e)};
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
	`,n.webview.onDidReceiveMessage(async o=>{switch(o.command){case"injectionSuccess":t.window.showInformationMessage("\u2705 Auto-approval script injected successfully!"),n.dispose(),setTimeout(async()=>{try{await t.commands.executeCommand("workbench.action.toggleDevTools"),s("INFO","Developer Tools auto-closed after successful injection")}catch(a){s("WARN","Could not auto-close Developer Tools",a)}},1e3);break;case"injectionFailed":t.window.showWarningMessage(`\u274C Auto-injection failed: ${o.error}. Use manual copy instead.`,"Manual Copy").then(a=>{a==="Manual Copy"&&x()});break;case"manualCopy":t.window.showInformationMessage("Script copied to clipboard! Paste in Developer Tools Console.");break;case"close":n.dispose();break}})}function V(){try{let e=H.join(O.extensionPath,"auto-approval-script.js");return W.readFileSync(e,"utf8")}catch(e){return s("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function le(e){if(b){c.appendLine("Auto-approval is already enabled");return}let o=h().get("autoApproval.intervalMs",2e3);s("INFO",`Enabling auto-approval with ${o}ms interval`),b=setInterval(async()=>{try{await t.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),t.window.showInformationMessage('Auto-approval enabled. Use "Disable Auto-Approval" command to turn off.',"Inject Script").then(a=>{a==="Inject Script"&&x()})}function pe(){b?(clearInterval(b),b=void 0,c.appendLine("Auto-approval disabled"),t.window.showInformationMessage("Auto-approval disabled")):t.window.showInformationMessage("Auto-approval is not currently enabled")}function x(){let e=V(),n=t.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",t.ViewColumn.One,{enableScripts:!0});n.webview.html=ue(e),t.env.clipboard.writeText(e),t.window.showInformationMessage("Auto-approval script copied to clipboard!")}function ue(e){return`<!DOCTYPE html>
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
    <div class="code-block">${e.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>

    <button class="button" onclick="copyScript()">Copy Script Again</button>

    <script>
        function copyScript() {
            const script = \`${e.replace(/`/g,"\\`").replace(/\$/g,"\\$")}\`;
            navigator.clipboard.writeText(script).then(() => {
                alert('Script copied to clipboard!');
            });
        }
    </script>
</body>
</html>`}async function ge(){C&&(C.close(),s("INFO","HTTP server closed")),A&&(clearInterval(A),A=void 0,s("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,s("INFO","Auto-approval interval cleared")),O&&await oe(O,p),s("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
