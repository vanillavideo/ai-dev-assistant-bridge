"use strict";var ue=Object.create;var B=Object.defineProperty;var ge=Object.getOwnPropertyDescriptor;var ve=Object.getOwnPropertyNames;var be=Object.getPrototypeOf,me=Object.prototype.hasOwnProperty;var we=(e,t)=>{for(var a in t)B(e,a,{get:t[a],enumerable:!0})},q=(e,t,a,l)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of ve(t))!me.call(e,n)&&n!==a&&B(e,n,{get:()=>t[n],enumerable:!(l=ge(t,n))||l.enumerable});return e};var M=(e,t,a)=>(a=e!=null?ue(be(e)):{},q(t||!e||!e.__esModule?B(a,"default",{value:e,enumerable:!0}):a,e)),ke=e=>q(B({},"__esModule",{value:!0}),e);var Be={};we(Be,{activate:()=>xe,deactivate:()=>Re});module.exports=ke(Be);var o=M(require("vscode")),J=M(require("http")),X=M(require("fs")),Z=M(require("path")),T,b,W,L,N,$,x,v=3737,I,P,F;function s(e,t,a){let n=`[${new Date().toISOString()}] [${e}]`,r=a?`${n} ${t} ${JSON.stringify(a)}`:`${n} ${t}`;b.appendLine(r),e==="ERROR"&&console.error(r)}function fe(e){return e instanceof Error}function y(e){return fe(e)?e.message:typeof e=="string"?e:JSON.stringify(e)}async function k(e){return e.workspaceState.get("tasks",[])}async function j(e,t){await e.workspaceState.update("tasks",t)}async function ee(e,t,a="",l="other"){let n=await k(e),r={id:Date.now().toString(),title:t,description:a,status:"pending",category:l,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return n.push(r),await j(e,n),r}async function D(e,t,a){let l=await k(e),n=l.find(r=>r.id===t);n&&(n.status=a,n.updatedAt=new Date().toISOString(),await j(e,l))}async function te(e,t){let l=(await k(e)).filter(n=>n.id!==t);await j(e,l)}function m(){return o.workspace.getConfiguration("aiFeedbackBridge")}async function H(e,t){let a=m();await a.update(e,t,o.ConfigurationTarget.Workspace),s("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:a.get(e)})}async function z(){if(F&&P){let e=await k(P);F.webview.html=await S(m(),v,e),s("DEBUG","Settings panel refreshed")}}var oe="aiFeedbackBridge.portRegistry",Y=3737,he=50;async function ae(e){return e.globalState.get(oe,[])}async function U(e,t){await e.globalState.update(oe,t)}async function ye(e){let t=await ae(e),a=o.workspace.name||"No Workspace",l=o.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=Date.now()-60*60*1e3,r=t.filter(d=>d.timestamp>n),p=r.find(d=>d.workspace===l);if(p)return s("INFO",`Reusing existing port ${p.port} for workspace`),p.timestamp=Date.now(),await U(e,r),p.port;let i=new Set(r.map(d=>d.port)),c=Y;for(let d=0;d<he;d++){let u=Y+d;if(!i.has(u)&&await Ce(u)){c=u;break}}return r.push({port:c,workspace:l,timestamp:Date.now()}),await U(e,r),s("INFO",`Auto-assigned port ${c} for workspace: ${a}`),c}async function Ce(e){return new Promise(t=>{let a=J.createServer();a.once("error",l=>{l.code==="EADDRINUSE"?t(!1):t(!0)}),a.once("listening",()=>{a.close(),t(!0)}),a.listen(e)})}async function Ie(e,t){let a=await ae(e),l=o.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=a.filter(r=>!(r.port===t&&r.workspace===l));await U(e,n),s("INFO",`Released port ${t}`)}async function Ae(e){if(F){F.reveal(o.ViewColumn.One);let n=await k(e);F.webview.html=await S(m(),v,n);return}let t=o.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",o.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});F=t,t.onDidDispose(()=>{F=void 0},null,e.subscriptions);let a=m(),l=await k(e);t.webview.html=await S(a,v,l),t.webview.onDidReceiveMessage(async n=>{switch(n.command){case"updateSetting":await H(n.key,n.value),s("INFO",`Setting updated: ${n.key} = ${n.value}`);break;case"reload":let r=await k(e);t.webview.html=await S(m(),v,r);break;case"runNow":try{let i=await G(e,!0);i?(await O(i,{source:"manual_trigger",timestamp:new Date().toISOString()}),s("INFO","[Run Now] Manually triggered all enabled reminders")):o.window.showInformationMessage("No enabled categories (check settings)")}catch(i){s("ERROR","[Run Now] Failed to send message",{error:y(i)}),o.window.showErrorMessage("Failed to send reminders")}break;case"injectScript":case"sendInstructions":try{let i="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+v+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+v+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+v+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+v+"/help";await O(i,{source:"instructions",timestamp:new Date().toISOString()})}catch{o.window.showErrorMessage("Failed to send instructions")}break;case"saveNewTask":try{let i=await ee(e,n.title,n.description,n.category),c=await k(e);t.webview.html=await S(m(),v,c)}catch(i){o.window.showErrorMessage(`Failed to create task: ${y(i)}`)}break;case"updateTaskField":try{let i=await k(e),c=i.find(d=>d.id===n.taskId);if(c){n.field==="title"?c.title=n.value:n.field==="description"&&(c.description=n.value),c.updatedAt=new Date().toISOString(),await j(e,i);let d=await k(e);t.webview.html=await S(m(),v,d)}}catch(i){o.window.showErrorMessage(`Failed to update task: ${y(i)}`)}break;case"updateTaskStatus":try{await D(e,n.taskId,n.status);let i=await k(e);t.webview.html=await S(m(),v,i)}catch(i){o.window.showErrorMessage(`Failed to update status: ${y(i)}`)}break;case"createTask":await o.commands.executeCommand("ai-feedback-bridge.addTask");let p=await k(e);t.webview.html=await S(m(),v,p);break;case"openTaskManager":await o.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":try{let c=(await k(e)).filter(u=>u.status==="completed");for(let u of c)await te(e,u.id);let d=await k(e);t.webview.html=await S(m(),v,d)}catch(i){o.window.showErrorMessage(`Failed to clear completed tasks: ${y(i)}`)}break}},void 0,e.subscriptions)}async function S(e,t,a){let l=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],n=e.get("autoContinue.enabled",!1),r=e.get("autoApproval.enabled",!0),p=e.get("autoApproval.autoInject",!1),i="";for(let c of l){let d=e.get(`autoContinue.${c.key}.enabled`,!0),u=e.get(`autoContinue.${c.key}.interval`,c.interval),A=e.get(`autoContinue.${c.key}.message`,"");i+=`
			<tr class="${d?"":"disabled"}">
				<td class="cat-icon">${c.icon}</td>
				<td class="cat-name">${c.name}</td>
				<td class="cat-message">
					<input type="text" value="${A}" data-key="autoContinue.${c.key}.message" 
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
		<button onclick="sendInstructions()">Send Instructions</button>
		<button onclick="runNow()">Run Now</button>
		<button onclick="injectScript()">Inject Script</button>
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
				<input type="checkbox" data-key="autoApproval.enabled" ${r?"checked":""} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${p?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${r?"":"disabled"} data-auto-approved="skip">
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
				${i}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${(()=>{let c=a.filter(u=>u.status!=="completed").reverse(),d=a.filter(u=>u.status==="completed").length;return c.length===0?`
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
					${c.map(u=>{let A=u.status==="pending"?"\u23F3":u.status==="in-progress"?"\u{1F504}":"\u2705",h=u.status==="pending"?"Pending":u.status==="in-progress"?"In Progress":"Completed",E=u.status==="pending"?"#cca700":u.status==="in-progress"?"#3794ff":"#89d185";return`
						<tr>
							<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${u.id}', '${u.status}')" title="Click to cycle status">${A}</td>
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
		const tbody = document.getElementById('task-tbody');
		if (!tbody) {
			vscode.postMessage({ command: 'createTask' });
			return;
		}
		
		// Check if there's already a new task row
		if (document.getElementById('new-task-row')) {
			return;
		}
		
		const newRow = document.createElement('tr');
		newRow.id = 'new-task-row';
		newRow.style.opacity = '0.7';
		newRow.innerHTML = \`
			<td>\u23F3</td>
			<td><input type="text" id="new-title" placeholder="Task title..." style="width: 100%; padding: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" autofocus></td>
			<td><input type="text" id="new-description" placeholder="Description (optional)..." style="width: 100%; padding: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);"></td>
			<td>
				<select id="new-category" style="padding: 4px; font-size: 12px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
					<option value="bug">bug</option>
					<option value="feature">feature</option>
					<option value="improvement">improvement</option>
					<option value="documentation">documentation</option>
					<option value="testing">testing</option>
					<option value="other">other</option>
				</select>
			</td>
			<td>
				<button onclick="saveNewTask()" style="padding: 4px 12px; font-size: 12px;">Save</button>
			</td>
		\`;
		
		tbody.insertBefore(newRow, tbody.firstChild);
		document.getElementById('new-title').focus();
		
		// Handle Enter key to save, Escape to cancel
		document.getElementById('new-title').addEventListener('keydown', (e) => {
			if (e.key === 'Enter') saveNewTask();
			if (e.key === 'Escape') cancelNewTask();
		});
		document.getElementById('new-description').addEventListener('keydown', (e) => {
			if (e.key === 'Enter') saveNewTask();
			if (e.key === 'Escape') cancelNewTask();
		});
	}
	
	function saveNewTask() {
		const title = document.getElementById('new-title')?.value.trim();
		const description = document.getElementById('new-description')?.value.trim();
		const category = document.getElementById('new-category')?.value;
		
		if (!title) {
			cancelNewTask();
			return;
		}
		
		vscode.postMessage({ 
			command: 'saveNewTask',
			title: title,
			description: description || '',
			category: category || 'other'
		});
	}
	
	function cancelNewTask() {
		const row = document.getElementById('new-task-row');
		if (row) row.remove();
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
</html>`}async function xe(e){P=e,b=o.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(b),s("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=m(),a=o.workspace.getConfiguration("aiFeedbackBridge");a.inspect("autoContinue.enabled")?.globalValue!==void 0&&(s("WARN","Detected old Global settings, clearing to use Workspace scope"),await a.update("autoContinue.enabled",void 0,o.ConfigurationTarget.Global));let n=t.get("port");v=await ye(e),s("INFO",`Auto-selected port: ${v} for this window`);let r=o.workspace.name||"No Workspace",p=o.workspace.workspaceFolders?.length||0;s("INFO",`Window context: ${r} (${p} folders)`),N=o.window.createStatusBarItem(o.StatusBarAlignment.Right,100),N.command="ai-feedback-bridge.openSettings",N.show(),e.subscriptions.push(N),L=o.window.createStatusBarItem(o.StatusBarAlignment.Right,99),L.command="ai-feedback-bridge.toggleAutoContinue",L.show(),e.subscriptions.push(L),$=o.window.createStatusBarItem(o.StatusBarAlignment.Right,98),$.command="ai-feedback-bridge.injectScript",$.text="$(clippy) Inject",$.tooltip="Copy auto-approval script to clipboard",$.show(),e.subscriptions.push($),Q(t);let i=o.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{Ae(e)});e.subscriptions.push(i);let c=o.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let g=await G(e,!0);g?(s("INFO","[Run Now] Manually triggered all enabled reminders"),await O(g,{source:"manual_trigger",timestamp:new Date().toISOString()})):o.window.showInformationMessage("No enabled categories (check settings)")}catch(g){s("ERROR","[Run Now] Failed to send message",{error:g}),o.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(c);let d=o.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{K()});e.subscriptions.push(d);let u=o.commands.registerCommand("ai-feedback-bridge.getPort",()=>v);e.subscriptions.push(u);let A=o.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let g=await o.window.showInputBox({prompt:"Task title"});if(!g)return;let f=await o.window.showInputBox({prompt:"Task description (optional)"}),w=await o.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await ee(e,g,f||"",w||"other"),await z()});e.subscriptions.push(A);let h=o.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let g=await k(e);if(g.length===0){o.window.showInformationMessage("No tasks found");return}let f=g.map(C=>({label:`${C.status==="completed"?"\u2705":C.status==="in-progress"?"\u{1F504}":"\u23F3"} ${C.title}`,description:C.description,task:C})),w=await o.window.showQuickPick(f,{placeHolder:"Select a task to update"});if(w){let C=await o.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});C==="Delete"?await te(e,w.task.id):C==="Mark as In Progress"?await D(e,w.task.id,"in-progress"):C==="Mark as Completed"?await D(e,w.task.id,"completed"):C==="Mark as Pending"&&await D(e,w.task.id,"pending"),await z()}});e.subscriptions.push(h),Te(e);let E=o.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async g=>{g||(g=await o.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),g&&await Ee(g,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(E);let V=o.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let f=m().get("autoContinue.enabled",!1);await H("autoContinue.enabled",!f),s("INFO",`Auto-Continue ${f?"disabled":"enabled"}`),z()});e.subscriptions.push(V);let ie=o.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let g=await o.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:f=>{let w=parseInt(f);return isNaN(w)||w<1024||w>65535?"Invalid port (1024-65535)":null}});g&&(await H("port",parseInt(g)),s("INFO",`Port changed to ${g}. Reloading VS Code...`),o.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(ie);let re=o.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let g=m(),f=g.get("autoContinue.interval",300),w=g.get("autoContinue.enabled",!1),pe=`\u{1F309} AI Feedback Bridge Status

Window: ${o.workspace.name||"No Workspace"}
Port: ${v}
Server: ${T?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${w?`Enabled \u2705 (every ${f}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;b.appendLine(pe),b.show()});e.subscriptions.push(re);let _=t.get("autoContinue.enabled",!1),R=t.inspect("autoContinue.enabled");s("INFO","[STARTUP] Auto-Continue check:",{enabled:_,defaultValue:R?.defaultValue,globalValue:R?.globalValue,workspaceValue:R?.workspaceValue,workspaceFolderValue:R?.workspaceFolderValue}),_?ne(e):s("INFO","[STARTUP] Auto-Continue is disabled, not starting"),Fe(),e.subscriptions.push(o.workspace.onDidChangeConfiguration(g=>{if(g.affectsConfiguration("aiFeedbackBridge")){let f=m();if(s("DEBUG","Configuration changed",{workspace:o.workspace.name,affectedKeys:["port","autoContinue"].filter(w=>g.affectsConfiguration(`aiFeedbackBridge.${w}`))}),g.affectsConfiguration("aiFeedbackBridge.port")){let w=f.get("port",3737);w!==v&&(s("INFO",`Port change detected: ${v} \u2192 ${w}. Reloading window...`),o.commands.executeCommand("workbench.action.reloadWindow"))}Q(f),g.affectsConfiguration("aiFeedbackBridge.autoContinue")&&Se(e)}})),W=o.chat.createChatParticipant("ai-agent-feedback-bridge.agent",Le),W.iconPath=o.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(W);let ce=o.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>Ne(e));e.subscriptions.push(ce);let de=o.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>$e());e.subscriptions.push(de);let le=o.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>Pe());e.subscriptions.push(le),s("INFO",`Feedback server started on http://localhost:${v}`)}function Q(e){if(!L||!N)return;let t=e.get("autoContinue.enabled",!1);N.text=`AI Dev: ${v}`,N.tooltip="Click to configure AI Feedback Bridge",t?(L.text="$(sync~spin) Stop AI Dev",L.tooltip=`Auto-Continue active
Click to stop`):(L.text="$(play) Start AI Dev",L.tooltip=`Auto-Continue inactive
Click to start`)}async function G(e,t=!1){let a=m(),l=["tasks","improvements","coverage","robustness","cleanup","commits"],n=Date.now(),r=[],p="autoContinue.lastSent",i=e.globalState.get(p,{}),c={...i};for(let d of l){let u=a.get(`autoContinue.${d}.enabled`,!0),A=a.get(`autoContinue.${d}.interval`,300),h=a.get(`autoContinue.${d}.message`,"");if(!u||!h)continue;let E=i[d]||0,V=(n-E)/1e3;(t||V>=A)&&(r.push(h),c[d]=n)}return await e.globalState.update(p,c),r.length===0?"":r.join(". ")+"."}function ne(e){if(m().get("autoContinue.enabled",!1)){let n=o.workspace.name||"No Workspace";s("INFO",`\u2705 Auto-Continue enabled for window: ${n}`),x=setInterval(async()=>{try{if(!m().get("autoContinue.enabled",!1)){s("INFO","[Auto-Continue] Detected disabled state, stopping timer"),x&&(clearInterval(x),x=void 0);return}let i=await G(e);i&&(s("INFO","[Auto-Continue] Sending periodic reminder"),await O(i,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(r){s("ERROR","[Auto-Continue] Failed to send message",{error:y(r)})}},500)}else s("DEBUG","Auto-Continue is disabled")}function Se(e){x&&(clearInterval(x),x=void 0,s("INFO","Auto-Continue timer stopped")),ne(e)}async function Le(e,t,a,l){b.appendLine(`Chat request received: ${e.prompt}`),a.markdown(`### \u{1F504} Processing Feedback

`),a.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?a.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):a.markdown(`Processing your message...

`);try{let[r]=await o.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r){let p=[o.LanguageModelChatMessage.User(e.prompt)],i=await r.sendRequest(p,{},l);for await(let c of i.text)a.markdown(c)}}catch(r){r instanceof o.LanguageModelError&&(b.appendLine(`Language model error: ${r.message}`),a.markdown(`\u26A0\uFE0F Error: ${r.message}

`))}return{metadata:{command:"process-feedback"}}}async function O(e,t){try{let a=`# \uFFFD AI DEV MODE

`;a+=`**User Feedback:**
${e}

`,Object.keys(t).filter(n=>n!=="source"&&n!=="timestamp").length>0&&(a+=`**Context:**
\`\`\`json
${JSON.stringify(t,null,2)}
\`\`\`

`),a+=`**Instructions:**
`,a+=`Analyze feedback, take appropriate action:
`,a+=`\u2022 If a bug \u2192 find and fix root cause
`,a+=`\u2022 If a feature \u2192 draft implementation plan
`,a+=`\u2022 Apply and commit changes
`,b.appendLine("Processing feedback through AI agent..."),b.appendLine(a);try{let[n]=await o.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return b.appendLine("\u2705 AI Agent processing request..."),await o.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${a}`}),setTimeout(async()=>{try{await o.commands.executeCommand("workbench.action.chat.submit")}catch{b.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),s("INFO","Feedback sent to AI Agent"),!0}catch(n){b.appendLine(`Could not access language model: ${y(n)}`)}return await o.env.clipboard.writeText(a),s("INFO","Feedback copied to clipboard"),!0}catch(a){return s("ERROR",`Error sending to agent: ${y(a)}`),!1}}async function Ee(e,t){return O(e,t)}function Te(e){T=J.createServer(async(t,a)=>{if(a.setHeader("Access-Control-Allow-Origin","*"),a.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),a.setHeader("Access-Control-Allow-Headers","Content-Type"),t.method==="OPTIONS"){a.writeHead(200),a.end();return}if(t.method!=="POST"){a.writeHead(405,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Method not allowed"}));return}if(t.url==="/restart-app"||t.url?.startsWith("/restart-app?")){let p=t.url.split("?"),i=new URLSearchParams(p[1]||""),c=parseInt(i.get("delay")||"30",10);b.appendLine(`Received restart request for Electron app (delay: ${c}s)`),a.writeHead(200,{"Content-Type":"application/json"}),a.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${c}s)`,delay:c})),setTimeout(async()=>{try{let{exec:d}=require("child_process"),{promisify:u}=require("util"),A=u(d);b.appendLine("Killing Electron process...");try{await A('pkill -f "electron.*Code/AI"')}catch{b.appendLine("Kill command completed (process may not have been running)")}b.appendLine(`Waiting ${c} seconds before restart...`),await new Promise(E=>setTimeout(E,c*1e3));let h=o.workspace.workspaceFolders?.[0]?.uri.fsPath;h&&h.includes("/AI")?(b.appendLine(`Restarting Electron app in: ${h}`),d(`cd "${h}" && npm run dev > /dev/null 2>&1 &`),b.appendLine("Electron app restart command sent")):b.appendLine(`Could not find workspace path: ${h}`)}catch(d){b.appendLine(`Restart error: ${d}`)}},100);return}let l="",n=1024*1024,r=0;t.on("data",p=>{if(r+=p.length,r>n){s("WARN","Request body too large",{size:r}),a.writeHead(413,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Request body too large (max 1MB)"})),t.destroy();return}l+=p.toString()}),t.on("end",async()=>{try{let p=JSON.parse(l);if(!p||typeof p!="object")throw new Error("Invalid feedback structure: must be an object");if(!p.message||typeof p.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let i=p.message.trim();if(i.length===0)throw new Error("Invalid feedback: message cannot be empty");if(i.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");s("INFO","Received feedback",{messageLength:i.length,hasContext:!!p.context});let c=await O(i,p.context);a.writeHead(200,{"Content-Type":"application/json"}),a.end(JSON.stringify({success:c,message:c?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(p){let i=p instanceof Error?p.message:String(p);s("ERROR","Error processing feedback",{error:i}),p instanceof SyntaxError?(a.writeHead(400,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Invalid JSON format"}))):(a.writeHead(400,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:i})))}})});try{T.listen(v,()=>{s("INFO",`\u2705 Server listening on port ${v}`)}),T.on("error",t=>{t.code==="EADDRINUSE"?s("ERROR",`Port ${v} is already in use. Please change the port in settings.`):s("ERROR","Server error occurred",{error:t.message,code:t.code})})}catch(t){s("ERROR","Failed to start server",{error:t})}e.subscriptions.push({dispose:()=>{T&&(s("INFO","Closing server"),T.close())}})}function Fe(){let e=m(),t=e.get("autoApproval.enabled",!0),a=e.get("autoApproval.autoInject",!1);if(t&&(s("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),a)){let l=e.inspect("autoApproval.autoInject");if(!!!(l&&(l.workspaceValue||l.workspaceFolderValue))){s("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),s("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}s("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{K().catch(r=>{s("WARN","Auto-inject setup failed:",y(r))})},1e3)}}async function K(){try{let e=se();await o.env.clipboard.writeText(e),s("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await o.commands.executeCommand("workbench.action.toggleDevTools"),s("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(t){s("WARN","Could not toggle Developer Tools",y(t))}}catch(e){s("ERROR","Failed to copy script",y(e))}}function se(){try{let e=Z.join(P.extensionPath,"auto-approval-script.js");return X.readFileSync(e,"utf8")}catch(e){return s("ERROR","Failed to read auto-approval-script.js",y(e)),"// Error: Could not load auto-approval script"}}function Ne(e){if(I){b.appendLine("Auto-approval is already enabled");return}let a=m().get("autoApproval.intervalMs",2e3);s("INFO",`Enabling auto-approval with ${a}ms interval`),I=setInterval(async()=>{try{await o.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},a),e.subscriptions.push({dispose:()=>{I&&(clearInterval(I),I=void 0)}}),s("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function $e(){I?(clearInterval(I),I=void 0,b.appendLine("Auto-approval disabled"),s("INFO","Auto-approval disabled")):s("INFO","Auto-approval is not currently enabled")}function Pe(){let e=se(),t=o.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",o.ViewColumn.One,{enableScripts:!0});t.webview.html=Oe(e),o.env.clipboard.writeText(e),s("INFO","Auto-approval script copied to clipboard")}function Oe(e){return`<!DOCTYPE html>
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
</html>`}async function Re(){T&&(T.close(),s("INFO","HTTP server closed")),x&&(clearInterval(x),x=void 0,s("INFO","Auto-continue timer cleared")),I&&(clearInterval(I),I=void 0,s("INFO","Auto-approval interval cleared")),P&&await Ie(P,v),s("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
