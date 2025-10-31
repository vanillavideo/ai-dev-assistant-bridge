"use strict";var X=Object.create;var E=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var Z=Object.getOwnPropertyNames;var ee=Object.getPrototypeOf,te=Object.prototype.hasOwnProperty;var oe=(e,o)=>{for(var t in o)E(e,t,{get:o[t],enumerable:!0})},D=(e,o,t,r)=>{if(o&&typeof o=="object"||typeof o=="function")for(let c of Z(o))!te.call(e,c)&&c!==t&&E(e,c,{get:()=>o[c],enumerable:!(r=Q(o,c))||r.enumerable});return e};var N=(e,o,t)=>(t=e!=null?X(ee(e)):{},D(o||!e||!e.__esModule?E(t,"default",{value:e,enumerable:!0}):t,e)),ne=e=>D(E({},"__esModule",{value:!0}),e);var ke={};oe(ke,{activate:()=>de,deactivate:()=>we});module.exports=ne(ke);var n=N(require("vscode")),B=N(require("http")),U=N(require("fs")),J=N(require("path")),C,u,$,y,A,L,x,v=3737,b,O;function a(e,o,t){let c=`[${new Date().toISOString()}] [${e}]`,s=t?`${c} ${o} ${JSON.stringify(t)}`:`${c} ${o}`;u.appendLine(s),e==="ERROR"&&console.error(s)}function m(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function P(e,o){await m().update(e,o,n.ConfigurationTarget.Global)}var V="aiFeedbackBridge.portRegistry",W=3737,ae=50;async function _(e){return e.globalState.get(V,[])}async function T(e,o){await e.globalState.update(V,o)}async function re(e){let o=await _(e),t=n.workspace.name||"No Workspace",r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=Date.now()-60*60*1e3,s=o.filter(p=>p.timestamp>c),i=s.find(p=>p.workspace===r);if(i)return a("INFO",`Reusing existing port ${i.port} for workspace`),i.timestamp=Date.now(),await T(e,s),i.port;let d=new Set(s.map(p=>p.port)),l=W;for(let p=0;p<ae;p++){let w=W+p;if(!d.has(w)&&await se(w)){l=w;break}}return s.push({port:l,workspace:r,timestamp:Date.now()}),await T(e,s),a("INFO",`Auto-assigned port ${l} for workspace: ${t}`),l}async function se(e){return new Promise(o=>{let t=B.createServer();t.once("error",r=>{r.code==="EADDRINUSE"?o(!1):o(!0)}),t.once("listening",()=>{t.close(),o(!0)}),t.listen(e)})}async function ie(e,o){let t=await _(e),r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=t.filter(s=>!(s.port===o&&s.workspace===r));await T(e,c),a("INFO",`Released port ${o}`)}function ce(e){let o=n.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=m();o.webview.html=z(t,v),o.webview.onDidReceiveMessage(async r=>{switch(r.command){case"updateSetting":await P(r.key,r.value),a("INFO",`Setting updated: ${r.key} = ${r.value}`);break;case"reload":o.webview.html=z(m(),v);break;case"runNow":try{let c=await j(e,!0);c?(await R(c,{source:"manual_trigger",timestamp:new Date().toISOString()}),a("INFO","[Run Now] Manually triggered all enabled reminders"),n.window.showInformationMessage("\u2705 Reminders sent!")):n.window.showInformationMessage("\u26A0\uFE0F No enabled categories (check settings)")}catch(c){a("ERROR","[Run Now] Failed to send message",{error:c}),n.window.showErrorMessage("\u274C Failed to send reminders")}break;case"injectScript":M();break}},void 0,e.subscriptions)}function z(e,o){let t=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],r=e.get("autoContinue.enabled",!1),c=e.get("autoApproval.enabled",!1),s=e.get("autoApproval.autoInject",!1),i="";for(let d of t){let l=e.get(`autoContinue.${d.key}.enabled`,!0),p=e.get(`autoContinue.${d.key}.interval`,d.interval);i+=`
			<tr class="${l?"":"disabled"}">
				<td class="cat-icon">${d.icon}</td>
				<td class="cat-name">${d.name}</td>
				<td class="cat-interval">
					<input type="number" value="${p}" data-key="autoContinue.${d.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${l?"":"disabled"}>s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${d.key}.enabled" ${l?"checked":""} 
					       class="toggle-cb" id="cb-${d.key}">
					<label for="cb-${d.key}" class="toggle-label"></label>
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
		<button onclick="runNow()">\u25B6\uFE0F Run Now</button>
		<button onclick="injectScript()">\u{1F4CB} Inject Script</button>
	</div>
	
	<div class="section">
		<div class="section-title">Server</div>
		<div class="row">
			<label>Port (auto-assigned)</label>
			<span class="port-display">${o}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${c?"checked":""} 
				       class="toggle-cb" id="cb-approval">
				<label for="cb-approval" class="toggle-label"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${s?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${c?"":"disabled"}>
				<label for="cb-autoinject" class="toggle-label"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${r?"checked":""} 
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
				${i}
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
		
		function runNow() {
			vscode.postMessage({ command: 'runNow' });
		}
		
		function injectScript() {
			vscode.postMessage({ command: 'injectScript' });
		}
	</script>
</body>
</html>`}async function de(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,u=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(u),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let o=m(),t=o.get("port");v=await re(e),a("INFO",`Auto-selected port: ${v} for this window`);let r=n.workspace.name||"No Workspace",c=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${r} (${c} folders)`),A=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),A.command="ai-feedback-bridge.openSettings",A.show(),e.subscriptions.push(A),y=n.window.createStatusBarItem(n.StatusBarAlignment.Right,99),y.command="ai-feedback-bridge.toggleAutoContinue",y.show(),e.subscriptions.push(y),L=n.window.createStatusBarItem(n.StatusBarAlignment.Right,98),L.command="ai-feedback-bridge.injectScript",L.text="$(clippy) Inject",L.tooltip="Copy auto-approval script to clipboard",L.show(),e.subscriptions.push(L),H(o);let s=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{ce(e)});e.subscriptions.push(s);let i=n.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let g=await j(e,!0);g?(a("INFO","[Run Now] Manually triggered all enabled reminders"),await R(g,{source:"manual_trigger",timestamp:new Date().toISOString()}),n.window.showInformationMessage("\u2705 Reminders sent!")):n.window.showInformationMessage("\u26A0\uFE0F No enabled categories (check settings)")}catch(g){a("ERROR","[Run Now] Failed to send message",{error:g}),n.window.showErrorMessage("\u274C Failed to send reminders")}});e.subscriptions.push(i);let d=n.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{M()});e.subscriptions.push(d);let l=n.commands.registerCommand("ai-feedback-bridge.getPort",()=>v);e.subscriptions.push(l),ge(e);let p=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async g=>{g||(g=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),g&&await ue(g,{})});e.subscriptions.push(p);let w=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let k=m().get("autoContinue.enabled",!1);await P("autoContinue.enabled",!k),a("INFO",`Auto-Continue ${k?"disabled":"enabled"}`)});e.subscriptions.push(w);let S=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let g=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:k=>{let h=parseInt(k);return isNaN(h)||h<1024||h>65535?"Invalid port (1024-65535)":null}});g&&(await P("port",parseInt(g)),a("INFO",`Port changed to ${g}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(S);let f=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let g=m(),k=g.get("autoContinue.interval",300),h=g.get("autoContinue.enabled",!1),Y=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${h?`Enabled \u2705 (every ${k}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;u.appendLine(Y),u.show()});e.subscriptions.push(f),K(e),ve(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(g=>{if(g.affectsConfiguration("aiFeedbackBridge")){let k=m();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(h=>g.affectsConfiguration(`aiFeedbackBridge.${h}`))}),g.affectsConfiguration("aiFeedbackBridge.port")){let h=k.get("port",3737);h!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${h}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}H(k),g.affectsConfiguration("aiFeedbackBridge.autoContinue")&&le(e)}})),$=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",pe),$.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push($);let I=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>be(e));e.subscriptions.push(I);let F=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>me());e.subscriptions.push(F);let G=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>fe());e.subscriptions.push(G),a("INFO",`Feedback server started on http://localhost:${v}`)}function H(e){if(!y||!A)return;let o=e.get("autoContinue.enabled",!1);A.text=`AI Dev: ${v}`,A.tooltip="Click to configure AI Feedback Bridge",o?(y.text="$(sync~spin) Stop AI Dev",y.tooltip=`Auto-Continue active
Click to stop`):(y.text="$(play) Start AI Dev",y.tooltip=`Auto-Continue inactive
Click to start`)}async function j(e,o=!1){let t=m(),r=["tasks","improvements","coverage","robustness","cleanup","commits"],c=Date.now(),s=[],i="autoContinue.lastSent",d=e.globalState.get(i,{}),l={...d};for(let p of r){let w=t.get(`autoContinue.${p}.enabled`,!0),S=t.get(`autoContinue.${p}.interval`,300),f=t.get(`autoContinue.${p}.message`,"");if(!w||!f)continue;let I=d[p]||0,F=(c-I)/1e3;(o||F>=S)&&(s.push(f),l[p]=c)}return await e.globalState.update(i,l),s.length===0?"":s.join(". ")+"."}function K(e){if(m().get("autoContinue.enabled",!1)){let c=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${c}`),x=setInterval(async()=>{try{let s=await j(e);s&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await R(s,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(s){a("ERROR","[Auto-Continue] Failed to send message",{error:s})}},500)}else a("DEBUG","Auto-Continue is disabled")}function le(e){x&&(clearInterval(x),x=void 0,u.appendLine("Auto-Continue stopped")),K(e)}async function pe(e,o,t,r){u.appendLine(`Chat request received: ${e.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[s]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let i=[n.LanguageModelChatMessage.User(e.prompt)],d=await s.sendRequest(i,{},r);for await(let l of d.text)t.markdown(l)}}catch(s){s instanceof n.LanguageModelError&&(u.appendLine(`Language model error: ${s.message}`),t.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}async function R(e,o){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${e}

`,o&&Object.keys(o).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,u.appendLine("Processing feedback through AI agent..."),u.appendLine(t);try{let[r]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r)return u.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{u.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(r){u.appendLine(`Could not access language model: ${r}`)}return await n.env.clipboard.writeText(t),a("INFO","Feedback copied to clipboard"),!0}catch(t){return a("ERROR",`Error sending to agent: ${t}`),!1}}async function ue(e,o){return R(e,o)}function ge(e){C=B.createServer(async(o,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),o.method==="OPTIONS"){t.writeHead(200),t.end();return}if(o.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(o.url==="/restart-app"||o.url?.startsWith("/restart-app?")){let i=o.url.split("?"),d=new URLSearchParams(i[1]||""),l=parseInt(d.get("delay")||"30",10);u.appendLine(`Received restart request for Electron app (delay: ${l}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${l}s)`,delay:l})),setTimeout(async()=>{try{let{exec:p}=require("child_process"),{promisify:w}=require("util"),S=w(p);u.appendLine("Killing Electron process...");try{await S('pkill -f "electron.*Code/AI"')}catch{u.appendLine("Kill command completed (process may not have been running)")}u.appendLine(`Waiting ${l} seconds before restart...`),await new Promise(I=>setTimeout(I,l*1e3));let f=n.workspace.workspaceFolders?.[0]?.uri.fsPath;f&&f.includes("/AI")?(u.appendLine(`Restarting Electron app in: ${f}`),p(`cd "${f}" && npm run dev > /dev/null 2>&1 &`),u.appendLine("Electron app restart command sent")):u.appendLine(`Could not find workspace path: ${f}`)}catch(p){u.appendLine(`Restart error: ${p}`)}},100);return}let r="",c=1024*1024,s=0;o.on("data",i=>{if(s+=i.length,s>c){a("WARN","Request body too large",{size:s}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),o.destroy();return}r+=i.toString()}),o.on("end",async()=>{try{let i=JSON.parse(r);if(!i||typeof i!="object")throw new Error("Invalid feedback structure: must be an object");if(!i.message||typeof i.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let d=i.message.trim();if(d.length===0)throw new Error("Invalid feedback: message cannot be empty");if(d.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:d.length,hasContext:!!i.context});let l=await R(d,i.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:l,message:l?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(i){let d=i instanceof Error?i.message:String(i);a("ERROR","Error processing feedback",{error:d}),i instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:d})))}})});try{C.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),C.on("error",o=>{o.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:o.message,code:o.code})})}catch(o){a("ERROR","Failed to start server",{error:o})}e.subscriptions.push({dispose:()=>{C&&(a("INFO","Closing server"),C.close())}})}function ve(){let e=m(),o=e.get("autoApproval.enabled",!1),t=e.get("autoApproval.autoInject",!1);o&&(a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),t&&(a("INFO","Auto-inject enabled. Launching quick setup..."),setTimeout(()=>{M().catch(r=>{a("WARN","Auto-inject setup failed:",r)})},1500)))}async function M(){try{let e=q();await n.env.clipboard.writeText(e),a("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(o){a("WARN","Could not toggle Developer Tools",o)}}catch(e){a("ERROR","Failed to copy script",e)}}function q(){try{let e=J.join(O.extensionPath,"auto-approval-script.js");return U.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function be(e){if(b){u.appendLine("Auto-approval is already enabled");return}let t=m().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${t}ms interval`),b=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function me(){b?(clearInterval(b),b=void 0,u.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function fe(){let e=q(),o=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});o.webview.html=he(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function he(e){return`<!DOCTYPE html>
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
</html>`}async function we(){C&&(C.close(),a("INFO","HTTP server closed")),x&&(clearInterval(x),x=void 0,a("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,a("INFO","Auto-approval interval cleared")),O&&await ie(O,v),a("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
