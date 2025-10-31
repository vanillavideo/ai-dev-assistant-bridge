"use strict";var ue=Object.create;var M=Object.defineProperty;var ge=Object.getOwnPropertyDescriptor;var ve=Object.getOwnPropertyNames;var be=Object.getPrototypeOf,me=Object.prototype.hasOwnProperty;var fe=(e,t)=>{for(var o in t)M(e,o,{get:t[o],enumerable:!0})},q=(e,t,o,l)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of ve(t))!me.call(e,n)&&n!==o&&M(e,n,{get:()=>t[n],enumerable:!(l=ge(t,n))||l.enumerable});return e};var B=(e,t,o)=>(o=e!=null?ue(be(e)):{},q(t||!e||!e.__esModule?M(o,"default",{value:e,enumerable:!0}):o,e)),we=e=>q(M({},"__esModule",{value:!0}),e);var Me={};fe(Me,{activate:()=>xe,deactivate:()=>Pe});module.exports=we(Me);var a=B(require("vscode")),J=B(require("http")),X=B(require("fs")),Z=B(require("path")),T,b,W,L,F,N,x,v=3737,A,O,$;function s(e,t,o){let n=`[${new Date().toISOString()}] [${e}]`,i=o?`${n} ${t} ${JSON.stringify(o)}`:`${n} ${t}`;b.appendLine(i),e==="ERROR"&&console.error(i)}function ke(e){return e instanceof Error}function y(e){return ke(e)?e.message:typeof e=="string"?e:JSON.stringify(e)}async function w(e){return e.workspaceState.get("tasks",[])}async function j(e,t){await e.workspaceState.update("tasks",t)}async function ee(e,t,o="",l="other"){let n=await w(e),i={id:Date.now().toString(),title:t,description:o,status:"pending",category:l,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return n.push(i),await j(e,n),i}async function D(e,t,o){let l=await w(e),n=l.find(i=>i.id===t);n&&(n.status=o,n.updatedAt=new Date().toISOString(),await j(e,l))}async function te(e,t){let l=(await w(e)).filter(n=>n.id!==t);await j(e,l)}function m(){return a.workspace.getConfiguration("aiFeedbackBridge")}async function H(e,t){let o=m();await o.update(e,t,a.ConfigurationTarget.Workspace),s("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}async function z(){if($&&O){let e=await w(O);$.webview.html=await I(m(),v,e),s("DEBUG","Settings panel refreshed")}}var oe="aiFeedbackBridge.portRegistry",Y=3737,he=50;async function ae(e){return e.globalState.get(oe,[])}async function U(e,t){await e.globalState.update(oe,t)}async function ye(e){let t=await ae(e),o=a.workspace.name||"No Workspace",l=a.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=Date.now()-60*60*1e3,i=t.filter(d=>d.timestamp>n),p=i.find(d=>d.workspace===l);if(p)return s("INFO",`Reusing existing port ${p.port} for workspace`),p.timestamp=Date.now(),await U(e,i),p.port;let r=new Set(i.map(d=>d.port)),c=Y;for(let d=0;d<he;d++){let u=Y+d;if(!r.has(u)&&await Ce(u)){c=u;break}}return i.push({port:c,workspace:l,timestamp:Date.now()}),await U(e,i),s("INFO",`Auto-assigned port ${c} for workspace: ${o}`),c}async function Ce(e){return new Promise(t=>{let o=J.createServer();o.once("error",l=>{l.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function Ae(e,t){let o=await ae(e),l=a.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=o.filter(i=>!(i.port===t&&i.workspace===l));await U(e,n),s("INFO",`Released port ${t}`)}async function Se(e){if($){$.reveal(a.ViewColumn.One);let n=await w(e);$.webview.html=await I(m(),v,n);return}let t=a.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",a.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});$=t,t.onDidDispose(()=>{$=void 0},null,e.subscriptions);let o=m(),l=await w(e);t.webview.html=await I(o,v,l),t.webview.onDidReceiveMessage(async n=>{switch(n.command){case"updateSetting":await H(n.key,n.value),s("INFO",`Setting updated: ${n.key} = ${n.value}`);break;case"reload":let i=await w(e);t.webview.html=await I(m(),v,i);break;case"runNow":try{let r=await G(e,!0);r?(await R(r,{source:"manual_trigger",timestamp:new Date().toISOString()}),s("INFO","[Run Now] Manually triggered all enabled reminders")):a.window.showInformationMessage("No enabled categories (check settings)")}catch(r){s("ERROR","[Run Now] Failed to send message",{error:y(r)}),a.window.showErrorMessage("Failed to send reminders")}break;case"injectScript":_();break;case"saveNewTask":try{let r=await ee(e,n.title,n.description,n.category),c=await w(e);t.webview.html=await I(m(),v,c)}catch(r){a.window.showErrorMessage(`Failed to create task: ${y(r)}`)}break;case"updateTaskField":try{let r=await w(e),c=r.find(d=>d.id===n.taskId);if(c){n.field==="title"?c.title=n.value:n.field==="description"&&(c.description=n.value),c.updatedAt=new Date().toISOString(),await j(e,r);let d=await w(e);t.webview.html=await I(m(),v,d)}}catch(r){a.window.showErrorMessage(`Failed to update task: ${y(r)}`)}break;case"updateTaskStatus":try{await D(e,n.taskId,n.status);let r=await w(e);t.webview.html=await I(m(),v,r)}catch(r){a.window.showErrorMessage(`Failed to update status: ${y(r)}`)}break;case"createTask":await a.commands.executeCommand("ai-feedback-bridge.addTask");let p=await w(e);t.webview.html=await I(m(),v,p);break;case"openTaskManager":await a.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":try{let c=(await w(e)).filter(u=>u.status==="completed");for(let u of c)await te(e,u.id);let d=await w(e);t.webview.html=await I(m(),v,d)}catch(r){a.window.showErrorMessage(`Failed to clear completed tasks: ${y(r)}`)}break}},void 0,e.subscriptions)}async function I(e,t,o){let l=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],n=e.get("autoContinue.enabled",!1),i=e.get("autoApproval.enabled",!0),p=e.get("autoApproval.autoInject",!1),r="";for(let c of l){let d=e.get(`autoContinue.${c.key}.enabled`,!0),u=e.get(`autoContinue.${c.key}.interval`,c.interval),S=e.get(`autoContinue.${c.key}.message`,"");r+=`
			<tr class="${d?"":"disabled"}">
				<td class="cat-icon">${c.icon}</td>
				<td class="cat-name">${c.name}</td>
				<td class="cat-message">
					<input type="text" value="${S}" data-key="autoContinue.${c.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${d?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${u}" data-key="autoContinue.${c.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${d?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${c.key}.enabled" ${d?"checked":""} 
					       class="toggle-cb" id="cb-${c.key}" data-auto-approved="skip">
					<label for="cb-${c.key}" class="toggle-label" data-auto-approved="skip"></label>
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
				<input type="checkbox" data-key="autoApproval.enabled" ${i?"checked":""} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${p?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${i?"":"disabled"} data-auto-approved="skip">
				<label for="cb-autoinject" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${n?"checked":""} 
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
				${r}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${(()=>{let c=o.filter(u=>u.status!=="completed").reverse(),d=o.filter(u=>u.status==="completed").length;return c.length===0?`
			<div class="row">
				<label style="color: var(--vscode-descriptionForeground); font-style: italic;">No active tasks for this workspace</label>
				<button onclick="createTask()">Add Task</button>
			</div>
			${d>0?`
			<div class="row" style="margin-top: 8px;">
				<label style="font-size: 12px; color: var(--vscode-descriptionForeground);">${d} completed task${d>1?"s":""}</label>
				<button onclick="clearCompleted()">Clear Completed</button>
			</div>
			`:""}
		`:`
			<table id="task-table">
				<thead>
					<tr>
						<th style="width: 40px;"></th>
						<th>Title</th>
						<th>Description</th>
						<th style="width: 120px;">Category</th>
						<th style="width: 100px;">Status</th>
					</tr>
				</thead>
				<tbody id="task-tbody">
					${c.map(u=>{let S=u.status==="pending"?"\u23F3":u.status==="in-progress"?"\u{1F504}":"\u2705",h=u.status==="pending"?"Pending":u.status==="in-progress"?"In Progress":"Completed",E=u.status==="pending"?"#cca700":u.status==="in-progress"?"#3794ff":"#89d185";return`
						<tr>
							<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${u.id}', '${u.status}')" title="Click to cycle status">${S}</td>
							<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${u.id}', 'title')">${u.title}</td>
							<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${u.id}', 'description')">${u.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
							<td style="font-size: 12px; opacity: 0.7;">${u.category}</td>
							<td style="color: ${E}; font-size: 12px;">${h}</td>
						</tr>
					`}).join("")}
				</tbody>
			</table>
			<div class="row" style="margin-top: 8px;">
				<button onclick="createTask()">Add Task</button>
				<button onclick="openTaskManager()">Manage Tasks</button>
				${d>0?`<button onclick="clearCompleted()">Clear Completed (${d})</button>`:""}
			</div>
		`})()} 
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
		
		function createTask() {
			vscode.postMessage({ command: 'createTask' });
		}
		
		function editField(cell, taskId, field) {
			const currentValue = cell.textContent.trim();
			const input = document.createElement('input');
			input.type = 'text';
			input.value = currentValue.includes('click to add') ? '' : currentValue;
			input.style.cssText = 'width:100%;padding:4px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)';
			
			const save = () => {
				const newValue = input.value.trim();
				if (newValue && newValue !== currentValue) {
					vscode.postMessage({ command: 'updateTaskField', taskId, field, value: newValue });
				} else {
					cell.textContent = currentValue;
				}
			};
			
			input.addEventListener('blur', save);
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') save();
				else if (e.key === 'Escape') cell.textContent = currentValue;
			});
			
			cell.textContent = '';
			cell.appendChild(input);
			input.focus();
			input.select();
		}
		
		function cycleStatus(taskId, currentStatus) {
			const nextStatus = currentStatus === 'pending' ? 'in-progress' : 
			                   currentStatus === 'in-progress' ? 'completed' : 'pending';
			vscode.postMessage({ command: 'updateTaskStatus', taskId, status: nextStatus });
		}
		
		function openTaskManager() {
			vscode.postMessage({ command: 'openTaskManager' });
		}
		
		function clearCompleted() {
			vscode.postMessage({ command: 'clearCompleted' });
		}
		
		function sendInstructions() {
			vscode.postMessage({ command: 'sendInstructions' });
		}
	</script>
</body>
</html>`}async function xe(e){O=e,b=a.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(b),s("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=m(),o=a.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(s("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,a.ConfigurationTarget.Global));let n=t.get("port");v=await ye(e),s("INFO",`Auto-selected port: ${v} for this window`);let i=a.workspace.name||"No Workspace",p=a.workspace.workspaceFolders?.length||0;s("INFO",`Window context: ${i} (${p} folders)`),F=a.window.createStatusBarItem(a.StatusBarAlignment.Right,100),F.command="ai-feedback-bridge.openSettings",F.show(),e.subscriptions.push(F),L=a.window.createStatusBarItem(a.StatusBarAlignment.Right,99),L.command="ai-feedback-bridge.toggleAutoContinue",L.show(),e.subscriptions.push(L),N=a.window.createStatusBarItem(a.StatusBarAlignment.Right,98),N.command="ai-feedback-bridge.injectScript",N.text="$(clippy) Inject",N.tooltip="Copy auto-approval script to clipboard",N.show(),e.subscriptions.push(N),Q(t);let r=a.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{Se(e)});e.subscriptions.push(r);let c=a.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let g=await G(e,!0);g?(s("INFO","[Run Now] Manually triggered all enabled reminders"),await R(g,{source:"manual_trigger",timestamp:new Date().toISOString()})):a.window.showInformationMessage("No enabled categories (check settings)")}catch(g){s("ERROR","[Run Now] Failed to send message",{error:g}),a.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(c);let d=a.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{_()});e.subscriptions.push(d);let u=a.commands.registerCommand("ai-feedback-bridge.getPort",()=>v);e.subscriptions.push(u);let S=a.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let g=await a.window.showInputBox({prompt:"Task title"});if(!g)return;let k=await a.window.showInputBox({prompt:"Task description (optional)"}),f=await a.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await ee(e,g,k||"",f||"other"),await z()});e.subscriptions.push(S);let h=a.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let g=await w(e);if(g.length===0){a.window.showInformationMessage("No tasks found");return}let k=g.map(C=>({label:`${C.status==="completed"?"\u2705":C.status==="in-progress"?"\u{1F504}":"\u23F3"} ${C.title}`,description:C.description,task:C})),f=await a.window.showQuickPick(k,{placeHolder:"Select a task to update"});if(f){let C=await a.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});C==="Delete"?await te(e,f.task.id):C==="Mark as In Progress"?await D(e,f.task.id,"in-progress"):C==="Mark as Completed"?await D(e,f.task.id,"completed"):C==="Mark as Pending"&&await D(e,f.task.id,"pending"),await z()}});e.subscriptions.push(h),Te(e);let E=a.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async g=>{g||(g=await a.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),g&&await Ee(g,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(E);let V=a.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let k=m().get("autoContinue.enabled",!1);await H("autoContinue.enabled",!k),s("INFO",`Auto-Continue ${k?"disabled":"enabled"}`),z()});e.subscriptions.push(V);let ie=a.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let g=await a.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:k=>{let f=parseInt(k);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});g&&(await H("port",parseInt(g)),s("INFO",`Port changed to ${g}. Reloading VS Code...`),a.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(ie);let re=a.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let g=m(),k=g.get("autoContinue.interval",300),f=g.get("autoContinue.enabled",!1),pe=`\u{1F309} AI Feedback Bridge Status

Window: ${a.workspace.name||"No Workspace"}
Port: ${v}
Server: ${T?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${k}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;b.appendLine(pe),b.show()});e.subscriptions.push(re);let K=t.get("autoContinue.enabled",!1),P=t.inspect("autoContinue.enabled");s("INFO","[STARTUP] Auto-Continue check:",{enabled:K,defaultValue:P?.defaultValue,globalValue:P?.globalValue,workspaceValue:P?.workspaceValue,workspaceFolderValue:P?.workspaceFolderValue}),K?ne(e):s("INFO","[STARTUP] Auto-Continue is disabled, not starting"),$e(),e.subscriptions.push(a.workspace.onDidChangeConfiguration(g=>{if(g.affectsConfiguration("aiFeedbackBridge")){let k=m();if(s("DEBUG","Configuration changed",{workspace:a.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>g.affectsConfiguration(`aiFeedbackBridge.${f}`))}),g.affectsConfiguration("aiFeedbackBridge.port")){let f=k.get("port",3737);f!==v&&(s("INFO",`Port change detected: ${v} \u2192 ${f}. Reloading window...`),a.commands.executeCommand("workbench.action.reloadWindow"))}Q(k),g.affectsConfiguration("aiFeedbackBridge.autoContinue")&&Ie(e)}})),W=a.chat.createChatParticipant("ai-agent-feedback-bridge.agent",Le),W.iconPath=a.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(W);let ce=a.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>Fe(e));e.subscriptions.push(ce);let de=a.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>Ne());e.subscriptions.push(de);let le=a.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>Oe());e.subscriptions.push(le),s("INFO",`Feedback server started on http://localhost:${v}`)}function Q(e){if(!L||!F)return;let t=e.get("autoContinue.enabled",!1);F.text=`AI Dev: ${v}`,F.tooltip="Click to configure AI Feedback Bridge",t?(L.text="$(sync~spin) Stop AI Dev",L.tooltip=`Auto-Continue active
Click to stop`):(L.text="$(play) Start AI Dev",L.tooltip=`Auto-Continue inactive
Click to start`)}async function G(e,t=!1){let o=m(),l=["tasks","improvements","coverage","robustness","cleanup","commits"],n=Date.now(),i=[],p="autoContinue.lastSent",r=e.globalState.get(p,{}),c={...r};for(let d of l){let u=o.get(`autoContinue.${d}.enabled`,!0),S=o.get(`autoContinue.${d}.interval`,300),h=o.get(`autoContinue.${d}.message`,"");if(!u||!h)continue;let E=r[d]||0,V=(n-E)/1e3;(t||V>=S)&&(i.push(h),c[d]=n)}return await e.globalState.update(p,c),i.length===0?"":i.join(". ")+"."}function ne(e){if(m().get("autoContinue.enabled",!1)){let n=a.workspace.name||"No Workspace";s("INFO",`\u2705 Auto-Continue enabled for window: ${n}`),x=setInterval(async()=>{try{if(!m().get("autoContinue.enabled",!1)){s("INFO","[Auto-Continue] Detected disabled state, stopping timer"),x&&(clearInterval(x),x=void 0);return}let r=await G(e);r&&(s("INFO","[Auto-Continue] Sending periodic reminder"),await R(r,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(i){s("ERROR","[Auto-Continue] Failed to send message",{error:y(i)})}},500)}else s("DEBUG","Auto-Continue is disabled")}function Ie(e){x&&(clearInterval(x),x=void 0,s("INFO","Auto-Continue timer stopped")),ne(e)}async function Le(e,t,o,l){b.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[i]=await a.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i){let p=[a.LanguageModelChatMessage.User(e.prompt)],r=await i.sendRequest(p,{},l);for await(let c of r.text)o.markdown(c)}}catch(i){i instanceof a.LanguageModelError&&(b.appendLine(`Language model error: ${i.message}`),o.markdown(`\u26A0\uFE0F Error: ${i.message}

`))}return{metadata:{command:"process-feedback"}}}async function R(e,t){try{let o=`# \uFFFD AI DEV MODE

`;o+=`**User Feedback:**
${e}

`,Object.keys(t).filter(n=>n!=="source"&&n!=="timestamp").length>0&&(o+=`**Context:**
\`\`\`json
${JSON.stringify(t,null,2)}
\`\`\`

`),o+=`**Instructions:**
`,o+=`Analyze feedback, take appropriate action:
`,o+=`\u2022 If a bug \u2192 find and fix root cause
`,o+=`\u2022 If a feature \u2192 draft implementation plan
`,o+=`\u2022 Apply and commit changes
`,b.appendLine("Processing feedback through AI agent..."),b.appendLine(o);try{let[n]=await a.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return b.appendLine("\u2705 AI Agent processing request..."),await a.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await a.commands.executeCommand("workbench.action.chat.submit")}catch{b.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),s("INFO","Feedback sent to AI Agent"),!0}catch(n){b.appendLine(`Could not access language model: ${y(n)}`)}return await a.env.clipboard.writeText(o),s("INFO","Feedback copied to clipboard"),!0}catch(o){return s("ERROR",`Error sending to agent: ${y(o)}`),!1}}async function Ee(e,t){return R(e,t)}function Te(e){T=J.createServer(async(t,o)=>{if(o.setHeader("Access-Control-Allow-Origin","*"),o.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),o.setHeader("Access-Control-Allow-Headers","Content-Type"),t.method==="OPTIONS"){o.writeHead(200),o.end();return}if(t.method!=="POST"){o.writeHead(405,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Method not allowed"}));return}if(t.url==="/restart-app"||t.url?.startsWith("/restart-app?")){let p=t.url.split("?"),r=new URLSearchParams(p[1]||""),c=parseInt(r.get("delay")||"30",10);b.appendLine(`Received restart request for Electron app (delay: ${c}s)`),o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${c}s)`,delay:c})),setTimeout(async()=>{try{let{exec:d}=require("child_process"),{promisify:u}=require("util"),S=u(d);b.appendLine("Killing Electron process...");try{await S('pkill -f "electron.*Code/AI"')}catch{b.appendLine("Kill command completed (process may not have been running)")}b.appendLine(`Waiting ${c} seconds before restart...`),await new Promise(E=>setTimeout(E,c*1e3));let h=a.workspace.workspaceFolders?.[0]?.uri.fsPath;h&&h.includes("/AI")?(b.appendLine(`Restarting Electron app in: ${h}`),d(`cd "${h}" && npm run dev > /dev/null 2>&1 &`),b.appendLine("Electron app restart command sent")):b.appendLine(`Could not find workspace path: ${h}`)}catch(d){b.appendLine(`Restart error: ${d}`)}},100);return}let l="",n=1024*1024,i=0;t.on("data",p=>{if(i+=p.length,i>n){s("WARN","Request body too large",{size:i}),o.writeHead(413,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Request body too large (max 1MB)"})),t.destroy();return}l+=p.toString()}),t.on("end",async()=>{try{let p=JSON.parse(l);if(!p||typeof p!="object")throw new Error("Invalid feedback structure: must be an object");if(!p.message||typeof p.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let r=p.message.trim();if(r.length===0)throw new Error("Invalid feedback: message cannot be empty");if(r.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");s("INFO","Received feedback",{messageLength:r.length,hasContext:!!p.context});let c=await R(r,p.context);o.writeHead(200,{"Content-Type":"application/json"}),o.end(JSON.stringify({success:c,message:c?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(p){let r=p instanceof Error?p.message:String(p);s("ERROR","Error processing feedback",{error:r}),p instanceof SyntaxError?(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Invalid JSON format"}))):(o.writeHead(400,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:r})))}})});try{T.listen(v,()=>{s("INFO",`\u2705 Server listening on port ${v}`)}),T.on("error",t=>{t.code==="EADDRINUSE"?s("ERROR",`Port ${v} is already in use. Please change the port in settings.`):s("ERROR","Server error occurred",{error:t.message,code:t.code})})}catch(t){s("ERROR","Failed to start server",{error:t})}e.subscriptions.push({dispose:()=>{T&&(s("INFO","Closing server"),T.close())}})}function $e(){let e=m(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(s("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let l=e.inspect("autoApproval.autoInject");if(!!!(l&&(l.workspaceValue||l.workspaceFolderValue))){s("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),s("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}s("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{_().catch(i=>{s("WARN","Auto-inject setup failed:",y(i))})},1e3)}}async function _(){try{let e=se();await a.env.clipboard.writeText(e),s("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await a.commands.executeCommand("workbench.action.toggleDevTools"),s("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(t){s("WARN","Could not toggle Developer Tools",y(t))}}catch(e){s("ERROR","Failed to copy script",y(e))}}function se(){try{let e=Z.join(O.extensionPath,"auto-approval-script.js");return X.readFileSync(e,"utf8")}catch(e){return s("ERROR","Failed to read auto-approval-script.js",y(e)),"// Error: Could not load auto-approval script"}}function Fe(e){if(A){b.appendLine("Auto-approval is already enabled");return}let o=m().get("autoApproval.intervalMs",2e3);s("INFO",`Enabling auto-approval with ${o}ms interval`),A=setInterval(async()=>{try{await a.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{A&&(clearInterval(A),A=void 0)}}),s("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function Ne(){A?(clearInterval(A),A=void 0,b.appendLine("Auto-approval disabled"),s("INFO","Auto-approval disabled")):s("INFO","Auto-approval is not currently enabled")}function Oe(){let e=se(),t=a.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",a.ViewColumn.One,{enableScripts:!0});t.webview.html=Re(e),a.env.clipboard.writeText(e),s("INFO","Auto-approval script copied to clipboard")}function Re(e){return`<!DOCTYPE html>
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
</html>`}async function Pe(){T&&(T.close(),s("INFO","HTTP server closed")),x&&(clearInterval(x),x=void 0,s("INFO","Auto-continue timer cleared")),A&&(clearInterval(A),A=void 0,s("INFO","Auto-approval interval cleared")),O&&await Ae(O,v),s("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
