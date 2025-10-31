"use strict";var J=Object.create;var S=Object.defineProperty;var V=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var Y=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var _=(e,o)=>{for(var t in o)S(e,t,{get:o[t],enumerable:!0})},P=(e,o,t,i)=>{if(o&&typeof o=="object"||typeof o=="function")for(let l of K(o))!G.call(e,l)&&l!==t&&S(e,l,{get:()=>o[l],enumerable:!(i=V(o,l))||i.enumerable});return e};var I=(e,o,t)=>(t=e!=null?J(Y(e)):{},P(o||!e||!e.__esModule?S(t,"default",{value:e,enumerable:!0}):t,e)),Q=e=>P(S({},"__esModule",{value:!0}),e);var me={};_(me,{activate:()=>ne,deactivate:()=>be});module.exports=Q(me);var n=I(require("vscode")),N=I(require("http")),D=I(require("fs")),M=I(require("path")),x,p,R,y,A,L,v=3737,b,O;function a(e,o,t){let l=`[${new Date().toISOString()}] [${e}]`,r=t?`${l} ${o} ${JSON.stringify(t)}`:`${l} ${o}`;p.appendLine(r),e==="ERROR"&&console.error(r)}function m(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function E(e,o){await m().update(e,o,n.ConfigurationTarget.Global)}var z="aiFeedbackBridge.portRegistry",T=3737,X=50;async function W(e){return e.globalState.get(z,[])}async function F(e,o){await e.globalState.update(z,o)}async function Z(e){let o=await W(e),t=n.workspace.name||"No Workspace",i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=Date.now()-60*60*1e3,r=o.filter(g=>g.timestamp>l),s=r.find(g=>g.workspace===i);if(s)return a("INFO",`Reusing existing port ${s.port} for workspace`),s.timestamp=Date.now(),await F(e,r),s.port;let c=new Set(r.map(g=>g.port)),d=T;for(let g=0;g<X;g++){let h=T+g;if(!c.has(h)&&await ee(h)){d=h;break}}return r.push({port:d,workspace:i,timestamp:Date.now()}),await F(e,r),a("INFO",`Auto-assigned port ${d} for workspace: ${t}`),d}async function ee(e){return new Promise(o=>{let t=N.createServer();t.once("error",i=>{i.code==="EADDRINUSE"?o(!1):o(!0)}),t.once("listening",()=>{t.close(),o(!0)}),t.listen(e)})}async function te(e,o){let t=await W(e),i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=t.filter(r=>!(r.port===o&&r.workspace===i));await F(e,l),a("INFO",`Released port ${o}`)}function oe(e){let o=n.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=m();o.webview.html=B(t),o.webview.onDidReceiveMessage(async i=>{switch(i.command){case"updateSetting":await E(i.key,i.value),a("INFO",`Setting updated: ${i.key} = ${i.value}`);break;case"reload":o.webview.html=B(m());break;case"injectScript":await n.commands.executeCommand("ai-agent-feedback-bridge.showAutoApprovalScript"),n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","Auto-approval script copied to clipboard, dev tools opened");break}},void 0,e.subscriptions)}function B(e){let o=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],t=e.get("autoContinue.enabled",!1),i=e.get("autoApproval.enabled",!1),l=e.get("autoApproval.autoInject",!1),r=e.get("port",3737),s="";for(let c of o){let d=e.get(`autoContinue.${c.key}.enabled`,!0),g=e.get(`autoContinue.${c.key}.interval`,c.interval);s+=`
			<tr class="${d?"":"disabled"}">
				<td class="cat-icon">${c.icon}</td>
				<td class="cat-name">${c.name}</td>
				<td class="cat-interval">
					<input type="number" value="${g}" data-key="autoContinue.${c.key}.interval" 
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
			font-size: 13px;
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
		.header h1 { font-size: 16px; flex: 1; font-weight: 600; }
		
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
			font-size: 13px;
		}
		
		.row {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 4px 0;
		}
		.row label { flex: 1; font-size: 12px; }
		
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th {
			text-align: left;
			padding: 6px 4px;
			font-weight: 600;
			font-size: 11px;
			opacity: 0.7;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		td {
			padding: 6px 4px;
			border-bottom: 1px solid rgba(128,128,128,0.1);
		}
		tr.disabled { opacity: 0.5; }
		.cat-icon { width: 28px; font-size: 15px; }
		.cat-name { font-weight: 500; font-size: 12px; }
		.cat-interval { width: 100px; font-size: 12px; }
		.cat-toggle { width: 45px; text-align: right; }
		
		input[type="number"] {
			padding: 3px 5px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-size: 11px;
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
			padding: 5px 10px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
			font-family: var(--vscode-font-family);
		}
		button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		
		.port-display {
			font-family: 'Monaco', 'Courier New', monospace;
			font-weight: 600;
			color: var(--vscode-textLink-foreground);
			font-size: 13px;
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
			<span class="port-display">${r}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${i?"checked":""} 
				       class="toggle-cb" id="cb-approval">
				<label for="cb-approval" class="toggle-label"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${l?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${i?"":"disabled"}>
				<label for="cb-autoinject" class="toggle-label"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${t?"checked":""} 
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
</html>`}async function ne(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,p=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(p),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let o=m(),t=o.get("port");!t||t===3737?(v=await Z(e),await E("port",v),a("INFO",`Auto-selected port: ${v}`)):(v=t,a("INFO",`Using configured port: ${v}`));let i=n.workspace.name||"No Workspace",l=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${i} (${l} folders)`),A=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),A.command="ai-feedback-bridge.openSettings",A.show(),e.subscriptions.push(A),y=n.window.createStatusBarItem(n.StatusBarAlignment.Right,99),y.command="ai-feedback-bridge.toggleAutoContinue",y.show(),e.subscriptions.push(y),j(o);let r=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{oe(e)});e.subscriptions.push(r),ce(e);let s=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async u=>{u||(u=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),u&&await se(u,{})});e.subscriptions.push(s);let c=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let w=m().get("autoContinue.enabled",!1);await E("autoContinue.enabled",!w),a("INFO",`Auto-Continue ${w?"disabled":"enabled"}`)});e.subscriptions.push(c);let d=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let u=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:w=>{let f=parseInt(w);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});u&&(await E("port",parseInt(u)),a("INFO",`Port changed to ${u}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(d);let g=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let u=m(),w=u.get("autoContinue.interval",300),f=u.get("autoContinue.enabled",!1),q=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${x?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${w}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;p.appendLine(q),p.show()});e.subscriptions.push(g),H(e),de(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(u=>{if(u.affectsConfiguration("aiFeedbackBridge")){let w=m();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>u.affectsConfiguration(`aiFeedbackBridge.${f}`))}),u.affectsConfiguration("aiFeedbackBridge.port")){let f=w.get("port",3737);f!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${f}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}j(w),u.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ie(e)}})),R=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",re),R.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(R);let h=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>pe(e));e.subscriptions.push(h);let C=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>ue());e.subscriptions.push(C);let k=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>ge());e.subscriptions.push(k),a("INFO",`Feedback server started on http://localhost:${v}`)}function j(e){if(!y||!A)return;let o=e.get("autoContinue.enabled",!1);A.text=`AI Bridge: ${v}`,A.tooltip="Click to configure AI Feedback Bridge",o?(y.text="$(sync~spin) Stop",y.tooltip=`Auto-Continue active
Click to stop`):(y.text="$(play) Start",y.tooltip=`Auto-Continue inactive
Click to start`)}async function ae(e){let o=m(),t=["tasks","improvements","coverage","robustness","cleanup","commits"],i=Date.now(),l=[],r="autoContinue.lastSent",s=e.globalState.get(r,{}),c={...s};for(let d of t){let g=o.get(`autoContinue.${d}.enabled`,!0),h=o.get(`autoContinue.${d}.interval`,300),C=o.get(`autoContinue.${d}.message`,"");if(!g||!C)continue;let k=s[d]||0;(i-k)/1e3>=h&&(l.push(C),c[d]=i)}return await e.globalState.update(r,c),l.length===0?"":l.join(". ")+"."}function H(e){if(m().get("autoContinue.enabled",!1)){let l=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${l}`),L=setInterval(async()=>{try{let r=await ae(e);r&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await $(r,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(r){a("ERROR","[Auto-Continue] Failed to send message",{error:r})}},500)}else a("DEBUG","Auto-Continue is disabled")}function ie(e){L&&(clearInterval(L),L=void 0,p.appendLine("Auto-Continue stopped")),H(e)}async function re(e,o,t,i){p.appendLine(`Chat request received: ${e.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[r]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r){let s=[n.LanguageModelChatMessage.User(e.prompt)],c=await r.sendRequest(s,{},i);for await(let d of c.text)t.markdown(d)}}catch(r){r instanceof n.LanguageModelError&&(p.appendLine(`Language model error: ${r.message}`),t.markdown(`\u26A0\uFE0F Error: ${r.message}

`))}return{metadata:{command:"process-feedback"}}}async function $(e,o){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${e}

`,o&&Object.keys(o).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,p.appendLine("Processing feedback through AI agent..."),p.appendLine(t);try{let[i]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i)return p.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{p.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(i){p.appendLine(`Could not access language model: ${i}`)}return await n.env.clipboard.writeText(t),a("INFO","Feedback copied to clipboard"),!0}catch(t){return a("ERROR",`Error sending to agent: ${t}`),!1}}async function se(e,o){return $(e,o)}function ce(e){x=N.createServer(async(o,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),o.method==="OPTIONS"){t.writeHead(200),t.end();return}if(o.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(o.url==="/restart-app"||o.url?.startsWith("/restart-app?")){let s=o.url.split("?"),c=new URLSearchParams(s[1]||""),d=parseInt(c.get("delay")||"30",10);p.appendLine(`Received restart request for Electron app (delay: ${d}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${d}s)`,delay:d})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:h}=require("util"),C=h(g);p.appendLine("Killing Electron process...");try{await C('pkill -f "electron.*Code/AI"')}catch{p.appendLine("Kill command completed (process may not have been running)")}p.appendLine(`Waiting ${d} seconds before restart...`),await new Promise(u=>setTimeout(u,d*1e3));let k=n.workspace.workspaceFolders?.[0]?.uri.fsPath;k&&k.includes("/AI")?(p.appendLine(`Restarting Electron app in: ${k}`),g(`cd "${k}" && npm run dev > /dev/null 2>&1 &`),p.appendLine("Electron app restart command sent")):p.appendLine(`Could not find workspace path: ${k}`)}catch(g){p.appendLine(`Restart error: ${g}`)}},100);return}let i="",l=1024*1024,r=0;o.on("data",s=>{if(r+=s.length,r>l){a("WARN","Request body too large",{size:r}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),o.destroy();return}i+=s.toString()}),o.on("end",async()=>{try{let s=JSON.parse(i);if(!s||typeof s!="object")throw new Error("Invalid feedback structure: must be an object");if(!s.message||typeof s.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let c=s.message.trim();if(c.length===0)throw new Error("Invalid feedback: message cannot be empty");if(c.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:c.length,hasContext:!!s.context});let d=await $(c,s.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:d,message:d?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(s){let c=s instanceof Error?s.message:String(s);a("ERROR","Error processing feedback",{error:c}),s instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:c})))}})});try{x.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),x.on("error",o=>{o.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:o.message,code:o.code})})}catch(o){a("ERROR","Failed to start server",{error:o})}e.subscriptions.push({dispose:()=>{x&&(a("INFO","Closing server"),x.close())}})}function de(){let e=m(),o=e.get("autoApproval.enabled",!1),t=e.get("autoApproval.autoInject",!1);o&&(a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),t&&(a("INFO","Auto-inject enabled. Launching quick setup..."),setTimeout(()=>{le().catch(i=>{a("WARN","Auto-inject setup failed:",i)})},1500)))}async function le(){try{let e=U();await n.env.clipboard.writeText(e),a("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","\u{1F6E0}\uFE0F Developer Tools opened")}catch(t){a("WARN","Could not auto-open Developer Tools. Please open manually with Cmd+Option+I",t)}let o=n.window.createWebviewPanel("autoInject","\u{1F680} Quick Setup - Ready to Paste!",n.ViewColumn.Beside,{enableScripts:!0,retainContextWhenHidden:!1});o.webview.html=`
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Quick Setup</title>
				<style>
					* { box-sizing: border-box; margin: 0; padding: 0; }
					body { 
						font-family: var(--vscode-font-family); 
						padding: 30px; 
						background: var(--vscode-editor-background);
						color: var(--vscode-editor-foreground);
						line-height: 1.6;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						min-height: 100vh;
					}
					.hero {
						text-align: center;
						margin-bottom: 30px;
					}
					.hero h1 {
						font-size: 32px;
						color: var(--vscode-textLink-foreground);
						margin-bottom: 15px;
					}
					.big-message {
						background: linear-gradient(135deg, var(--vscode-button-background), var(--vscode-textLink-foreground));
						color: white;
						padding: 25px 40px;
						border-radius: 12px;
						font-size: 24px;
						font-weight: bold;
						margin: 20px 0;
						box-shadow: 0 4px 12px rgba(0,0,0,0.3);
						animation: pulse 2s ease-in-out infinite;
					}
					@keyframes pulse {
						0%, 100% { transform: scale(1); }
						50% { transform: scale(1.05); }
					}
					.quick-steps {
						background: var(--vscode-textCodeBlock-background);
						padding: 25px;
						border-radius: 8px;
						max-width: 600px;
						margin: 20px 0;
					}
					.quick-step {
						display: flex;
						gap: 15px;
						margin: 15px 0;
						align-items: center;
						font-size: 16px;
					}
					.step-icon {
						font-size: 28px;
						min-width: 40px;
						text-align: center;
					}
					.kbd {
						background: var(--vscode-input-background);
						border: 1px solid var(--vscode-input-border);
						padding: 4px 8px;
						border-radius: 4px;
						font-family: monospace;
						font-weight: bold;
						font-size: 14px;
						white-space: nowrap;
					}
					button { 
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 12px 24px;
						border-radius: 6px;
						cursor: pointer;
						margin: 8px;
						font-size: 14px;
						font-weight: 600;
						font-family: var(--vscode-font-family);
						transition: all 0.2s;
					}
					button:hover { 
						background: var(--vscode-button-hoverBackground);
						transform: translateY(-1px);
					}
					.actions {
						margin-top: 30px;
						text-align: center;
					}
					.success-msg {
						background: rgba(0, 200, 0, 0.15);
						border: 2px solid #0c0;
						padding: 15px 20px;
						margin: 20px 0;
						border-radius: 6px;
						font-size: 14px;
						max-width: 600px;
					}
					details {
						margin-top: 30px;
						max-width: 600px;
					}
					summary {
						cursor: pointer;
						user-select: none;
						padding: 10px;
						background: var(--vscode-textCodeBlock-background);
						border-radius: 4px;
						font-weight: 600;
					}
					.code-box {
						background: var(--vscode-editor-background);
						border: 1px solid var(--vscode-panel-border);
						padding: 15px;
						border-radius: 4px;
						margin-top: 10px;
						max-height: 300px;
						overflow-y: auto;
						font-family: 'Monaco', 'Courier New', monospace;
						font-size: 11px;
						white-space: pre-wrap;
						word-break: break-all;
					}
				</style>
			</head>
			<body>
				<div class="hero">
					<h1>\u{1F680} Auto-Approval Setup</h1>
				</div>

				<div class="big-message">
					\u2705 Script Copied! Ready to Paste
				</div>

				<div class="success-msg">
					<strong>\u{1F389} Everything is ready!</strong> The script is in your clipboard.<br>
					Just paste it into the browser console and press Enter.
				</div>

				<div class="quick-steps">
					<div class="quick-step">
						<div class="step-icon">\u{1F6E0}\uFE0F</div>
						<div>Open browser DevTools: <span class="kbd">Cmd+Option+I</span> or <span class="kbd">F12</span></div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u{1F4CB}</div>
						<div>Click <strong>Console</strong> tab</div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u2328\uFE0F</div>
						<div>Paste with <span class="kbd">Cmd+V</span> or <span class="kbd">Ctrl+V</span></div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u23CE</div>
						<div>Press <span class="kbd">Enter</span> to run</div>
					</div>
					
					<div class="quick-step">
						<div class="step-icon">\u2705</div>
						<div>Look for success message in console</div>
					</div>
				</div>

				<div class="actions">
					<button onclick="copyAgain()">\u{1F4CB} Copy Script Again</button>
					<button onclick="openDevTools()">\u{1F6E0}\uFE0F Toggle DevTools</button>
					<button onclick="done()" style="background: rgba(0, 200, 0, 0.3);">\u2705 Done - Close This</button>
				</div>

				<details>
					<summary>\u{1F4DD} View Script Contents</summary>
					<div class="code-box" id="scriptContent"></div>
				</details>

				<script>
					const vscode = acquireVsCodeApi();
					const script = ${JSON.stringify(e)};
					document.getElementById('scriptContent').textContent = script;
					
					function copyAgain() {
						navigator.clipboard.writeText(script).then(() => {
							vscode.postMessage({ command: 'copied' });
						});
					}
					
					function openDevTools() {
						vscode.postMessage({ command: 'openDevTools' });
					}
					
					function done() {
						vscode.postMessage({ command: 'close' });
					}
				</script>
			</body>
			</html>
		`,o.webview.onDidReceiveMessage(async t=>{switch(t.command){case"copied":a("INFO","\u{1F4CB} Script copied to clipboard again");break;case"openDevTools":try{await n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(i){a("WARN","Could not toggle Developer Tools",i)}break;case"close":o.dispose(),a("INFO","\u2705 Auto-inject setup completed");break}})}catch(e){a("ERROR","Failed to auto-inject script",e)}}function U(){try{let e=M.join(O.extensionPath,"auto-approval-script.js");return D.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function pe(e){if(b){p.appendLine("Auto-approval is already enabled");return}let t=m().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${t}ms interval`),b=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function ue(){b?(clearInterval(b),b=void 0,p.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function ge(){let e=U(),o=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});o.webview.html=ve(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function ve(e){return`<!DOCTYPE html>
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
</html>`}async function be(){x&&(x.close(),a("INFO","HTTP server closed")),L&&(clearInterval(L),L=void 0,a("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,a("INFO","Auto-approval interval cleared")),O&&await te(O,v),a("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
