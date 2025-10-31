"use strict";var G=Object.create;var E=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var X=Object.getPrototypeOf,Q=Object.prototype.hasOwnProperty;var Z=(e,t)=>{for(var o in t)E(e,o,{get:t[o],enumerable:!0})},j=(e,t,o,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let l of Y(t))!Q.call(e,l)&&l!==o&&E(e,l,{get:()=>t[l],enumerable:!(r=_(t,l))||r.enumerable});return e};var R=(e,t,o)=>(o=e!=null?G(X(e)):{},j(t||!e||!e.__esModule?E(o,"default",{value:e,enumerable:!0}):o,e)),ee=e=>j(E({},"__esModule",{value:!0}),e);var he={};Z(he,{activate:()=>ie,deactivate:()=>fe});module.exports=ee(he);var n=R(require("vscode")),P=R(require("http")),z=R(require("fs")),H=R(require("path")),C,p,$,y,x,I,S,v=3737,b,O;function a(e,t,o){let l=`[${new Date().toISOString()}] [${e}]`,i=o?`${l} ${t} ${JSON.stringify(o)}`:`${l} ${t}`;p.appendLine(i),e==="ERROR"&&console.error(i)}function m(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function F(e,t){await m().update(e,t,n.ConfigurationTarget.Global)}var U="aiFeedbackBridge.portRegistry",M=3737,te=50;async function J(e){return e.globalState.get(U,[])}async function N(e,t){await e.globalState.update(U,t)}async function oe(e){let t=await J(e),o=n.workspace.name||"No Workspace",r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=Date.now()-60*60*1e3,i=t.filter(u=>u.timestamp>l),s=i.find(u=>u.workspace===r);if(s)return a("INFO",`Reusing existing port ${s.port} for workspace`),s.timestamp=Date.now(),await N(e,i),s.port;let c=new Set(i.map(u=>u.port)),d=M;for(let u=0;u<te;u++){let h=M+u;if(!c.has(h)&&await ne(h)){d=h;break}}return i.push({port:d,workspace:r,timestamp:Date.now()}),await N(e,i),a("INFO",`Auto-assigned port ${d} for workspace: ${o}`),d}async function ne(e){return new Promise(t=>{let o=P.createServer();o.once("error",r=>{r.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function ae(e,t){let o=await J(e),r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=o.filter(i=>!(i.port===t&&i.workspace===r));await N(e,l),a("INFO",`Released port ${t}`)}function re(e){let t=n.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),o=m();t.webview.html=D(o),t.webview.onDidReceiveMessage(async r=>{switch(r.command){case"updateSetting":await F(r.key,r.value),a("INFO",`Setting updated: ${r.key} = ${r.value}`);break;case"reload":t.webview.html=D(m());break;case"injectScript":B();break}},void 0,e.subscriptions)}function D(e){let t=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],o=e.get("autoContinue.enabled",!1),r=e.get("autoApproval.enabled",!1),l=e.get("autoApproval.autoInject",!1),i=e.get("port",3737),s="";for(let c of t){let d=e.get(`autoContinue.${c.key}.enabled`,!0),u=e.get(`autoContinue.${c.key}.interval`,c.interval);s+=`
			<tr class="${d?"":"disabled"}">
				<td class="cat-icon">${c.icon}</td>
				<td class="cat-name">${c.name}</td>
				<td class="cat-interval">
					<input type="number" value="${u}" data-key="autoContinue.${c.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${d?"":"disabled"}>s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${c.key}.enabled" ${d?"checked":""} 
					       class="toggle-cb" id="cb-${c.key}">
					<label for="cb-${c.key}" class="toggle-label"></label>
				</td>
			</tr>
		`}return`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Settings</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: var(--vscode-font-family);
			font-size: 14px;
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			padding: 16px;
			max-width: 800px;
		}
		
		.header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 16px;
			padding-bottom: 10px;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		.header h1 { font-size: 18px; flex: 1; font-weight: 600; }
		
		.section {
			background: var(--vscode-sideBar-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 10px 12px;
			margin-bottom: 10px;
		}
		.section-title {
			font-weight: 600;
			margin-bottom: 8px;
			font-size: 14px;
		}
		
		.row {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 4px 0;
		}
		.row label { flex: 1; font-size: 14px; }
		
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th {
			text-align: left;
			padding: 6px 4px;
			font-weight: 600;
			font-size: 12px;
			opacity: 0.7;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		td {
			padding: 6px 4px;
			border-bottom: 1px solid rgba(128,128,128,0.1);
		}
		tr.disabled { opacity: 0.5; }
		.cat-icon { width: 28px; font-size: 16px; }
		.cat-name { font-weight: 500; font-size: 14px; }
		.cat-interval { width: 100px; font-size: 14px; }
		.cat-toggle { width: 45px; text-align: right; }
		
		input[type="number"] {
			padding: 3px 5px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-size: 13px;
		}
		
		/* Better toggle switch */
		.toggle-cb { display: none; }
		.toggle-label {
			display: inline-block;
			width: 32px;
			height: 16px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 8px;
			position: relative;
			cursor: pointer;
			transition: all 0.2s;
		}
		.toggle-label:after {
			content: '';
			position: absolute;
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background: var(--vscode-input-foreground);
			top: 2.5px;
			left: 2.5px;
			transition: all 0.2s;
		}
		.toggle-cb:checked + .toggle-label {
			background: var(--vscode-button-background);
			border-color: var(--vscode-button-background);
		}
		.toggle-cb:checked + .toggle-label:after {
			left: 18.5px;
			background: white;
		}
		
		button {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 6px 12px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 13px;
			font-family: var(--vscode-font-family);
		}
		button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		
		.port-display {
			font-family: 'Monaco', 'Courier New', monospace;
			font-weight: 600;
			color: var(--vscode-textLink-foreground);
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>\u{1F309} AI Feedback Bridge</h1>
		<button onclick="injectScript()">\u{1F4CB} Inject Script</button>
	</div>
	
	<div class="section">
		<div class="section-title">Server</div>
		<div class="row">
			<label>Port (auto-assigned)</label>
			<span class="port-display">${i}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${r?"checked":""} 
				       class="toggle-cb" id="cb-approval">
				<label for="cb-approval" class="toggle-label"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${l?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${r?"":"disabled"}>
				<label for="cb-autoinject" class="toggle-label"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${o?"checked":""} 
				       class="toggle-cb" id="cb-autocontinue">
				<label for="cb-autocontinue" class="toggle-label"></label>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Category</th>
					<th>Interval</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				${s}
			</tbody>
		</table>
	</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		
		// Handle all input changes
		document.querySelectorAll('input').forEach(el => {
			el.addEventListener('change', (e) => {
				const key = e.target.dataset.key;
				if (!key) return;
				
				let value = e.target.type === 'checkbox' ? e.target.checked : 
				           e.target.type === 'number' ? parseInt(e.target.value) : 
				           e.target.value;
				
				vscode.postMessage({
					command: 'updateSetting',
					key: key,
					value: value
				});
				
				// Update row state for auto-continue categories
				if (key.includes('.enabled')) {
					const row = e.target.closest('tr');
					if (row) {
						row.classList.toggle('disabled', !value);
						const input = row.querySelector('input[type="number"]');
						if (input) input.disabled = !value;
					}
				}
				
				// Handle auto-approval enabled toggle - enable/disable auto-inject
				if (key === 'autoApproval.enabled') {
					const autoInjectCheckbox = document.getElementById('cb-autoinject');
					if (autoInjectCheckbox) {
						autoInjectCheckbox.disabled = !value;
					}
				}
			});
		});
		
		function injectScript() {
			vscode.postMessage({ command: 'injectScript' });
		}
	</script>
</body>
</html>`}async function ie(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,p=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(p),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=m(),o=t.get("port");v=await oe(e),a("INFO",`Auto-selected port: ${v} for this window`);let r=n.workspace.name||"No Workspace",l=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${r} (${l} folders)`),x=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),x.command="ai-feedback-bridge.openSettings",x.show(),e.subscriptions.push(x),y=n.window.createStatusBarItem(n.StatusBarAlignment.Right,99),y.command="ai-feedback-bridge.toggleAutoContinue",y.show(),e.subscriptions.push(y),I=n.window.createStatusBarItem(n.StatusBarAlignment.Right,98),I.command="ai-feedback-bridge.injectScript",I.text="$(clippy) Inject",I.tooltip="Copy auto-approval script to clipboard",I.show(),e.subscriptions.push(I),W(t);let i=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{re(e)});e.subscriptions.push(i);let s=n.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{B()});e.subscriptions.push(s),pe(e);let c=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async g=>{g||(g=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),g&&await le(g,{})});e.subscriptions.push(c);let d=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let k=m().get("autoContinue.enabled",!1);await F("autoContinue.enabled",!k),a("INFO",`Auto-Continue ${k?"disabled":"enabled"}`)});e.subscriptions.push(d);let u=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let g=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:k=>{let f=parseInt(k);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});g&&(await F("port",parseInt(g)),a("INFO",`Port changed to ${g}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(u);let h=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let g=m(),k=g.get("autoContinue.interval",300),f=g.get("autoContinue.enabled",!1),q=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${k}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;p.appendLine(q),p.show()});e.subscriptions.push(h),V(e),ue(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(g=>{if(g.affectsConfiguration("aiFeedbackBridge")){let k=m();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>g.affectsConfiguration(`aiFeedbackBridge.${f}`))}),g.affectsConfiguration("aiFeedbackBridge.port")){let f=k.get("port",3737);f!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${f}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}W(k),g.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ce(e)}})),$=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",de),$.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push($);let A=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>ge(e));e.subscriptions.push(A);let w=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>ve());e.subscriptions.push(w);let L=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>be());e.subscriptions.push(L),a("INFO",`Feedback server started on http://localhost:${v}`)}function W(e){if(!y||!x)return;let t=e.get("autoContinue.enabled",!1);x.text=`AI Bridge: ${v}`,x.tooltip="Click to configure AI Feedback Bridge",t?(y.text="$(sync~spin) Stop",y.tooltip=`Auto-Continue active
Click to stop`):(y.text="$(play) Start",y.tooltip=`Auto-Continue inactive
Click to start`)}async function se(e){let t=m(),o=["tasks","improvements","coverage","robustness","cleanup","commits"],r=Date.now(),l=[],i="autoContinue.lastSent",s=e.globalState.get(i,{}),c={...s};for(let d of o){let u=t.get(`autoContinue.${d}.enabled`,!0),h=t.get(`autoContinue.${d}.interval`,300),A=t.get(`autoContinue.${d}.message`,"");if(!u||!A)continue;let w=s[d]||0;(r-w)/1e3>=h&&(l.push(A),c[d]=r)}return await e.globalState.update(i,c),l.length===0?"":l.join(". ")+"."}function V(e){if(m().get("autoContinue.enabled",!1)){let l=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${l}`),S=setInterval(async()=>{try{let i=await se(e);i&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await T(i,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(i){a("ERROR","[Auto-Continue] Failed to send message",{error:i})}},500)}else a("DEBUG","Auto-Continue is disabled")}function ce(e){S&&(clearInterval(S),S=void 0,p.appendLine("Auto-Continue stopped")),V(e)}async function de(e,t,o,r){p.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[i]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i){let s=[n.LanguageModelChatMessage.User(e.prompt)],c=await i.sendRequest(s,{},r);for await(let d of c.text)o.markdown(d)}}catch(i){i instanceof n.LanguageModelError&&(p.appendLine(`Language model error: ${i.message}`),o.markdown(`\u26A0\uFE0F Error: ${i.message}

`))}return{metadata:{command:"process-feedback"}}}async function T(e,t){try{let o=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;o+=`**User Feedback:**
${e}

`,t&&Object.keys(t).length>0&&(o+=`**Context:**
`,o+=`\`\`\`json
${JSON.stringify(t,null,2)}
\`\`\`

`),o+=`**Instructions:**
`,o+="Analyze this feedback and provide actionable responses. ",o+="If it's a bug, analyze the root cause. ",o+="If it's a feature request, provide an implementation plan. ",o+=`Make code changes if needed using available tools.

`,p.appendLine("Processing feedback through AI agent..."),p.appendLine(o);try{let[r]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r)return p.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{p.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(r){p.appendLine(`Could not access language model: ${r}`)}return await n.env.clipboard.writeText(o),a("INFO","Feedback copied to clipboard"),!0}catch(o){return a("ERROR",`Error sending to agent: ${o}`),!1}}async function le(e,t){return T(e,t)}function pe(e){C=P.createServer(async(t,o)=>{if(o.setHeader("Access-Control-Allow-Origin","*"),o.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),o.setHeader("Access-Control-Allow-Headers","Content-Type"),t.method==="OPTIONS"){o.writeHead(200),o.end();return}if(t.method!=="POST"){o.writeHead(405,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Method not allowed"}));return}if(t.url==="/restart-app"||t.url?.startsWith("/restart-app?")){let s=t.url.split("?"),c=new URLSearchParams(s[1]||""),d=parseInt(c.get("delay")||"30",10);p.appendLine(`Received restart request for Electron app (delay: ${d}s)`),o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${d}s)`,delay:d})),setTimeout(async()=>{try{let{exec:u}=require("child_process"),{promisify:h}=require("util"),A=h(u);p.appendLine("Killing Electron process...");try{await A('pkill -f "electron.*Code/AI"')}catch{p.appendLine("Kill command completed (process may not have been running)")}p.appendLine(`Waiting ${d} seconds before restart...`),await new Promise(L=>setTimeout(L,d*1e3));let w=n.workspace.workspaceFolders?.[0]?.uri.fsPath;w&&w.includes("/AI")?(p.appendLine(`Restarting Electron app in: ${w}`),u(`cd "${w}" && npm run dev > /dev/null 2>&1 &`),p.appendLine("Electron app restart command sent")):p.appendLine(`Could not find workspace path: ${w}`)}catch(u){p.appendLine(`Restart error: ${u}`)}},100);return}let r="",l=1024*1024,i=0;t.on("data",s=>{if(i+=s.length,i>l){a("WARN","Request body too large",{size:i}),o.writeHead(413,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Request body too large (max 1MB)"})),t.destroy();return}r+=s.toString()}),t.on("end",async()=>{try{let s=JSON.parse(r);if(!s||typeof s!="object")throw new Error("Invalid feedback structure: must be an object");if(!s.message||typeof s.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let c=s.message.trim();if(c.length===0)throw new Error("Invalid feedback: message cannot be empty");if(c.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:c.length,hasContext:!!s.context});let d=await T(c,s.context);o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:d,message:d?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(s){let c=s instanceof Error?s.message:String(s);a("ERROR","Error processing feedback",{error:c}),s instanceof SyntaxError?(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Invalid JSON format"}))):(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:c})))}})});try{C.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),C.on("error",t=>{t.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:t.message,code:t.code})})}catch(t){a("ERROR","Failed to start server",{error:t})}e.subscriptions.push({dispose:()=>{C&&(a("INFO","Closing server"),C.close())}})}function ue(){let e=m(),t=e.get("autoApproval.enabled",!1),o=e.get("autoApproval.autoInject",!1);t&&(a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o&&(a("INFO","Auto-inject enabled. Launching quick setup..."),setTimeout(()=>{B().catch(r=>{a("WARN","Auto-inject setup failed:",r)})},1500)))}async function B(){try{let e=K();await n.env.clipboard.writeText(e),a("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(t){a("WARN","Could not toggle Developer Tools",t)}}catch(e){a("ERROR","Failed to copy script",e)}}function K(){try{let e=H.join(O.extensionPath,"auto-approval-script.js");return z.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function ge(e){if(b){p.appendLine("Auto-approval is already enabled");return}let o=m().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${o}ms interval`),b=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function ve(){b?(clearInterval(b),b=void 0,p.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function be(){let e=K(),t=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});t.webview.html=me(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function me(e){return`<!DOCTYPE html>
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
</html>`}async function fe(){C&&(C.close(),a("INFO","HTTP server closed")),S&&(clearInterval(S),S=void 0,a("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,a("INFO","Auto-approval interval cleared")),O&&await ae(O,v),a("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
