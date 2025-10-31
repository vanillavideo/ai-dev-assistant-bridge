"use strict";var le=Object.create;var P=Object.defineProperty;var pe=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var ge=Object.getPrototypeOf,ve=Object.prototype.hasOwnProperty;var be=(e,t)=>{for(var o in t)P(e,o,{get:t[o],enumerable:!0})},q=(e,t,o,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of ue(t))!ve.call(e,s)&&s!==o&&P(e,s,{get:()=>t[s],enumerable:!(i=pe(t,s))||i.enumerable});return e};var $=(e,t,o)=>(o=e!=null?le(ge(e)):{},q(t||!e||!e.__esModule?P(o,"default",{value:e,enumerable:!0}):o,e)),me=e=>q(P({},"__esModule",{value:!0}),e);var Be={};be(Be,{activate:()=>Se,deactivate:()=>Te});module.exports=me(Be);var a=$(require("vscode")),U=$(require("http")),X=$(require("fs")),Z=$(require("path")),x,g,M,A,L,N,C,b=3737,h,B,I;function n(e,t,o){let s=`[${new Date().toISOString()}] [${e}]`,r=o?`${s} ${t} ${JSON.stringify(o)}`:`${s} ${t}`;g.appendLine(r),e==="ERROR"&&console.error(r)}function fe(e){return e instanceof Error}function S(e){return fe(e)?e.message:typeof e=="string"?e:JSON.stringify(e)}async function j(e){return e.workspaceState.get("tasks",[])}async function J(e,t){await e.workspaceState.update("tasks",t)}async function we(e,t,o="",i="other"){let s=await j(e),r={id:Date.now().toString(),title:t,description:o,status:"pending",category:i,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return s.push(r),await J(e,s),r}async function W(e,t,o){let i=await j(e),s=i.find(r=>r.id===t);s&&(s.status=o,s.updatedAt=new Date().toISOString(),await J(e,i))}async function ke(e,t){let i=(await j(e)).filter(s=>s.id!==t);await J(e,i)}function m(){return a.workspace.getConfiguration("aiFeedbackBridge")}async function H(e,t){let o=m();await o.update(e,t,a.ConfigurationTarget.Workspace),n("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}function V(){I&&(I.webview.html=T(m(),b),n("DEBUG","Settings panel refreshed"))}var ee="aiFeedbackBridge.portRegistry",Y=3737,he=50;async function te(e){return e.globalState.get(ee,[])}async function z(e,t){await e.globalState.update(ee,t)}async function ye(e){let t=await te(e),o=a.workspace.name||"No Workspace",i=a.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",s=Date.now()-60*60*1e3,r=t.filter(u=>u.timestamp>s),c=r.find(u=>u.workspace===i);if(c)return n("INFO",`Reusing existing port ${c.port} for workspace`),c.timestamp=Date.now(),await z(e,r),c.port;let d=new Set(r.map(u=>u.port)),p=Y;for(let u=0;u<he;u++){let w=Y+u;if(!d.has(w)&&await Ce(w)){p=w;break}}return r.push({port:p,workspace:i,timestamp:Date.now()}),await z(e,r),n("INFO",`Auto-assigned port ${p} for workspace: ${o}`),p}async function Ce(e){return new Promise(t=>{let o=U.createServer();o.once("error",i=>{i.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function Ae(e,t){let o=await te(e),i=a.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",s=o.filter(r=>!(r.port===t&&r.workspace===i));await z(e,s),n("INFO",`Released port ${t}`)}function xe(e){if(I){I.reveal(a.ViewColumn.One),I.webview.html=T(m(),b);return}let t=a.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",a.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});I=t,t.onDidDispose(()=>{I=void 0},null,e.subscriptions);let o=m();t.webview.html=T(o,b),t.webview.onDidReceiveMessage(async i=>{switch(i.command){case"updateSetting":await H(i.key,i.value),n("INFO",`Setting updated: ${i.key} = ${i.value}`);break;case"reload":t.webview.html=T(m(),b);break;case"runNow":try{let s=await G(e,!0);s?(await R(s,{source:"manual_trigger",timestamp:new Date().toISOString()}),n("INFO","[Run Now] Manually triggered all enabled reminders")):a.window.showInformationMessage("No enabled categories (check settings)")}catch(s){n("ERROR","[Run Now] Failed to send message",{error:S(s)}),a.window.showErrorMessage("Failed to send reminders")}break;case"injectScript":_();break}},void 0,e.subscriptions)}function T(e,t){let o=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],i=e.get("autoContinue.enabled",!1),s=e.get("autoApproval.enabled",!0),r=e.get("autoApproval.autoInject",!1),c="";for(let d of o){let p=e.get(`autoContinue.${d.key}.enabled`,!0),u=e.get(`autoContinue.${d.key}.interval`,d.interval),w=e.get(`autoContinue.${d.key}.message`,"");c+=`
			<tr class="${p?"":"disabled"}">
				<td class="cat-icon">${d.icon}</td>
				<td class="cat-name">${d.name}</td>
				<td class="cat-message">
					<input type="text" value="${w}" data-key="autoContinue.${d.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${p?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${u}" data-key="autoContinue.${d.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${p?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${d.key}.enabled" ${p?"checked":""} 
					       class="toggle-cb" id="cb-${d.key}" data-auto-approved="skip">
					<label for="cb-${d.key}" class="toggle-label" data-auto-approved="skip"></label>
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
		.cat-name { width: 120px; font-weight: 500; font-size: 14px; }
		.cat-message { min-width: 250px; max-width: 400px; font-size: 14px; }
		.cat-interval { width: 100px; font-size: 14px; }
		.cat-toggle { width: 45px; text-align: right; }
		
		input[type="number"] {
			padding: 3px 5px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-size: 14px;
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
			<span class="port-display">${t}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.enabled" ${s?"checked":""} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${r?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${s?"":"disabled"} data-auto-approved="skip">
				<label for="cb-autoinject" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${i?"checked":""} 
				       class="toggle-cb" id="cb-autocontinue" data-auto-approved="skip">
				<label for="cb-autocontinue" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Category</th>
					<th>Message</th>
					<th>Interval</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				${c}
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
						// Toggle message input in current row
						const messageInput = row.querySelector('input[type="text"]');
						if (messageInput) messageInput.disabled = !value;
						// Toggle interval input in current row
						const intervalInput = row.querySelector('input[type="number"]');
						if (intervalInput) intervalInput.disabled = !value;
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
</html>`}async function Se(e){B=e,g=a.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(g),n("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=m(),o=a.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(n("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,a.ConfigurationTarget.Global));let s=t.get("port");b=await ye(e),n("INFO",`Auto-selected port: ${b} for this window`);let r=a.workspace.name||"No Workspace",c=a.workspace.workspaceFolders?.length||0;n("INFO",`Window context: ${r} (${c} folders)`),L=a.window.createStatusBarItem(a.StatusBarAlignment.Right,100),L.command="ai-feedback-bridge.openSettings",L.show(),e.subscriptions.push(L),A=a.window.createStatusBarItem(a.StatusBarAlignment.Right,99),A.command="ai-feedback-bridge.toggleAutoContinue",A.show(),e.subscriptions.push(A),N=a.window.createStatusBarItem(a.StatusBarAlignment.Right,98),N.command="ai-feedback-bridge.injectScript",N.text="$(clippy) Inject",N.tooltip="Copy auto-approval script to clipboard",N.show(),e.subscriptions.push(N),Q(t);let d=a.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{xe(e)});e.subscriptions.push(d);let p=a.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let l=await G(e,!0);l?(n("INFO","[Run Now] Manually triggered all enabled reminders"),await R(l,{source:"manual_trigger",timestamp:new Date().toISOString()})):a.window.showInformationMessage("No enabled categories (check settings)")}catch(l){n("ERROR","[Run Now] Failed to send message",{error:l}),a.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(p);let u=a.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{_()});e.subscriptions.push(u);let w=a.commands.registerCommand("ai-feedback-bridge.getPort",()=>b);e.subscriptions.push(w);let E=a.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let l=await a.window.showInputBox({prompt:"Task title"});if(!l)return;let f=await a.window.showInputBox({prompt:"Task description (optional)"}),v=await a.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await we(e,l,f||"",v||"other"),await V()});e.subscriptions.push(E);let y=a.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let l=await j(e);if(l.length===0){a.window.showInformationMessage("No tasks found");return}let f=l.map(k=>({label:`${k.status==="completed"?"\u2705":k.status==="in-progress"?"\u{1F504}":"\u23F3"} ${k.title}`,description:k.description,task:k})),v=await a.window.showQuickPick(f,{placeHolder:"Select a task to update"});if(v){let k=await a.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});k==="Delete"?await ke(e,v.task.id):k==="Mark as In Progress"?await W(e,v.task.id,"in-progress"):k==="Mark as Completed"?await W(e,v.task.id,"completed"):k==="Mark as Pending"&&await W(e,v.task.id,"pending"),await V()}});e.subscriptions.push(y),Oe(e);let O=a.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async l=>{l||(l=await a.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),l&&await Ee(l,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(O);let D=a.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let f=m().get("autoContinue.enabled",!1);await H("autoContinue.enabled",!f),n("INFO",`Auto-Continue ${f?"disabled":"enabled"}`),V()});e.subscriptions.push(D);let ne=a.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let l=await a.window.showInputBox({prompt:"Enter new port number",value:b.toString(),validateInput:f=>{let v=parseInt(f);return isNaN(v)||v<1024||v>65535?"Invalid port (1024-65535)":null}});l&&(await H("port",parseInt(l)),n("INFO",`Port changed to ${l}. Reloading VS Code...`),a.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(ne);let se=a.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let l=m(),f=l.get("autoContinue.interval",300),v=l.get("autoContinue.enabled",!1),de=`\u{1F309} AI Feedback Bridge Status

Window: ${a.workspace.name||"No Workspace"}
Port: ${b}
Server: ${x?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${v?`Enabled \u2705 (every ${f}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${b}`;g.appendLine(de),g.show()});e.subscriptions.push(se);let K=t.get("autoContinue.enabled",!1),F=t.inspect("autoContinue.enabled");n("INFO","[STARTUP] Auto-Continue check:",{enabled:K,defaultValue:F?.defaultValue,globalValue:F?.globalValue,workspaceValue:F?.workspaceValue,workspaceFolderValue:F?.workspaceFolderValue}),K?oe(e):n("INFO","[STARTUP] Auto-Continue is disabled, not starting"),Ne(),e.subscriptions.push(a.workspace.onDidChangeConfiguration(l=>{if(l.affectsConfiguration("aiFeedbackBridge")){let f=m();if(n("DEBUG","Configuration changed",{workspace:a.workspace.name,affectedKeys:["port","autoContinue"].filter(v=>l.affectsConfiguration(`aiFeedbackBridge.${v}`))}),l.affectsConfiguration("aiFeedbackBridge.port")){let v=f.get("port",3737);v!==b&&(n("INFO",`Port change detected: ${b} \u2192 ${v}. Reloading window...`),a.commands.executeCommand("workbench.action.reloadWindow"))}Q(f),l.affectsConfiguration("aiFeedbackBridge.autoContinue")&&Ie(e)}})),M=a.chat.createChatParticipant("ai-agent-feedback-bridge.agent",Le),M.iconPath=a.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(M);let re=a.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>Re(e));e.subscriptions.push(re);let ie=a.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>Fe());e.subscriptions.push(ie);let ce=a.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>Pe());e.subscriptions.push(ce),n("INFO",`Feedback server started on http://localhost:${b}`)}function Q(e){if(!A||!L)return;let t=e.get("autoContinue.enabled",!1);L.text=`AI Dev: ${b}`,L.tooltip="Click to configure AI Feedback Bridge",t?(A.text="$(sync~spin) Stop AI Dev",A.tooltip=`Auto-Continue active
Click to stop`):(A.text="$(play) Start AI Dev",A.tooltip=`Auto-Continue inactive
Click to start`)}async function G(e,t=!1){let o=m(),i=["tasks","improvements","coverage","robustness","cleanup","commits"],s=Date.now(),r=[],c="autoContinue.lastSent",d=e.globalState.get(c,{}),p={...d};for(let u of i){let w=o.get(`autoContinue.${u}.enabled`,!0),E=o.get(`autoContinue.${u}.interval`,300),y=o.get(`autoContinue.${u}.message`,"");if(!w||!y)continue;let O=d[u]||0,D=(s-O)/1e3;(t||D>=E)&&(r.push(y),p[u]=s)}return await e.globalState.update(c,p),r.length===0?"":r.join(". ")+"."}function oe(e){if(m().get("autoContinue.enabled",!1)){let s=a.workspace.name||"No Workspace";n("INFO",`\u2705 Auto-Continue enabled for window: ${s}`),C=setInterval(async()=>{try{if(!m().get("autoContinue.enabled",!1)){n("INFO","[Auto-Continue] Detected disabled state, stopping timer"),C&&(clearInterval(C),C=void 0);return}let d=await G(e);d&&(n("INFO","[Auto-Continue] Sending periodic reminder"),await R(d,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(r){n("ERROR","[Auto-Continue] Failed to send message",{error:S(r)})}},500)}else n("DEBUG","Auto-Continue is disabled")}function Ie(e){C&&(clearInterval(C),C=void 0,n("INFO","Auto-Continue timer stopped")),oe(e)}async function Le(e,t,o,i){g.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[r]=await a.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r){let c=[a.LanguageModelChatMessage.User(e.prompt)],d=await r.sendRequest(c,{},i);for await(let p of d.text)o.markdown(p)}}catch(r){r instanceof a.LanguageModelError&&(g.appendLine(`Language model error: ${r.message}`),o.markdown(`\u26A0\uFE0F Error: ${r.message}

`))}return{metadata:{command:"process-feedback"}}}async function R(e,t){try{let o=`# \uFFFD AI DEV MODE

`;o+=`**User Feedback:**
${e}

`,Object.keys(t).filter(s=>s!=="source"&&s!=="timestamp").length>0&&(o+=`**Context:**
\`\`\`json
${JSON.stringify(t,null,2)}
\`\`\`

`),o+=`**Instructions:**
`,o+=`Analyze feedback, take appropriate action:
`,o+=`\u2022 If a bug \u2192 find and fix root cause
`,o+=`\u2022 If a feature \u2192 draft implementation plan
`,o+=`\u2022 Apply and commit changes
`,g.appendLine("Processing feedback through AI agent..."),g.appendLine(o);try{let[s]=await a.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s)return g.appendLine("\u2705 AI Agent processing request..."),await a.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await a.commands.executeCommand("workbench.action.chat.submit")}catch{g.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),n("INFO","Feedback sent to AI Agent"),!0}catch(s){g.appendLine(`Could not access language model: ${S(s)}`)}return await a.env.clipboard.writeText(o),n("INFO","Feedback copied to clipboard"),!0}catch(o){return n("ERROR",`Error sending to agent: ${S(o)}`),!1}}async function Ee(e,t){return R(e,t)}function Oe(e){x=U.createServer(async(t,o)=>{if(o.setHeader("Access-Control-Allow-Origin","*"),o.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),o.setHeader("Access-Control-Allow-Headers","Content-Type"),t.method==="OPTIONS"){o.writeHead(200),o.end();return}if(t.method!=="POST"){o.writeHead(405,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Method not allowed"}));return}if(t.url==="/restart-app"||t.url?.startsWith("/restart-app?")){let c=t.url.split("?"),d=new URLSearchParams(c[1]||""),p=parseInt(d.get("delay")||"30",10);g.appendLine(`Received restart request for Electron app (delay: ${p}s)`),o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${p}s)`,delay:p})),setTimeout(async()=>{try{let{exec:u}=require("child_process"),{promisify:w}=require("util"),E=w(u);g.appendLine("Killing Electron process...");try{await E('pkill -f "electron.*Code/AI"')}catch{g.appendLine("Kill command completed (process may not have been running)")}g.appendLine(`Waiting ${p} seconds before restart...`),await new Promise(O=>setTimeout(O,p*1e3));let y=a.workspace.workspaceFolders?.[0]?.uri.fsPath;y&&y.includes("/AI")?(g.appendLine(`Restarting Electron app in: ${y}`),u(`cd "${y}" && npm run dev > /dev/null 2>&1 &`),g.appendLine("Electron app restart command sent")):g.appendLine(`Could not find workspace path: ${y}`)}catch(u){g.appendLine(`Restart error: ${u}`)}},100);return}let i="",s=1024*1024,r=0;t.on("data",c=>{if(r+=c.length,r>s){n("WARN","Request body too large",{size:r}),o.writeHead(413,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Request body too large (max 1MB)"})),t.destroy();return}i+=c.toString()}),t.on("end",async()=>{try{let c=JSON.parse(i);if(!c||typeof c!="object")throw new Error("Invalid feedback structure: must be an object");if(!c.message||typeof c.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let d=c.message.trim();if(d.length===0)throw new Error("Invalid feedback: message cannot be empty");if(d.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");n("INFO","Received feedback",{messageLength:d.length,hasContext:!!c.context});let p=await R(d,c.context);o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:p,message:p?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(c){let d=c instanceof Error?c.message:String(c);n("ERROR","Error processing feedback",{error:d}),c instanceof SyntaxError?(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Invalid JSON format"}))):(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:d})))}})});try{x.listen(b,()=>{n("INFO",`\u2705 Server listening on port ${b}`)}),x.on("error",t=>{t.code==="EADDRINUSE"?n("ERROR",`Port ${b} is already in use. Please change the port in settings.`):n("ERROR","Server error occurred",{error:t.message,code:t.code})})}catch(t){n("ERROR","Failed to start server",{error:t})}e.subscriptions.push({dispose:()=>{x&&(n("INFO","Closing server"),x.close())}})}function Ne(){let e=m(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(n("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let i=e.inspect("autoApproval.autoInject");if(!!!(i&&(i.workspaceValue||i.workspaceFolderValue))){n("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),n("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}n("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{_().catch(r=>{n("WARN","Auto-inject setup failed:",S(r))})},1e3)}}async function _(){try{let e=ae();await a.env.clipboard.writeText(e),n("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await a.commands.executeCommand("workbench.action.toggleDevTools"),n("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(t){n("WARN","Could not toggle Developer Tools",S(t))}}catch(e){n("ERROR","Failed to copy script",S(e))}}function ae(){try{let e=Z.join(B.extensionPath,"auto-approval-script.js");return X.readFileSync(e,"utf8")}catch(e){return n("ERROR","Failed to read auto-approval-script.js",S(e)),"// Error: Could not load auto-approval script"}}function Re(e){if(h){g.appendLine("Auto-approval is already enabled");return}let o=m().get("autoApproval.intervalMs",2e3);n("INFO",`Enabling auto-approval with ${o}ms interval`),h=setInterval(async()=>{try{await a.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{h&&(clearInterval(h),h=void 0)}}),n("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function Fe(){h?(clearInterval(h),h=void 0,g.appendLine("Auto-approval disabled"),n("INFO","Auto-approval disabled")):n("INFO","Auto-approval is not currently enabled")}function Pe(){let e=ae(),t=a.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",a.ViewColumn.One,{enableScripts:!0});t.webview.html=$e(e),a.env.clipboard.writeText(e),n("INFO","Auto-approval script copied to clipboard")}function $e(e){return`<!DOCTYPE html>
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
</html>`}async function Te(){x&&(x.close(),n("INFO","HTTP server closed")),C&&(clearInterval(C),C=void 0,n("INFO","Auto-continue timer cleared")),h&&(clearInterval(h),h=void 0,n("INFO","Auto-approval interval cleared")),B&&await Ae(B,b),n("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
