"use strict";var Be=Object.create;var G=Object.defineProperty;var je=Object.getOwnPropertyDescriptor;var De=Object.getOwnPropertyNames;var We=Object.getPrototypeOf,He=Object.prototype.hasOwnProperty;var Z=(e,t)=>()=>(e&&(t=e(e=0)),t);var ee=(e,t)=>{for(var o in t)G(e,o,{get:t[o],enumerable:!0})},pe=(e,t,o,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of De(t))!He.call(e,a)&&a!==o&&G(e,a,{get:()=>t[a],enumerable:!(s=je(t,a))||s.enumerable});return e};var A=(e,t,o)=>(o=e!=null?Be(We(e)):{},pe(t||!e||!e.__esModule?G(o,"default",{value:e,enumerable:!0}):o,e)),ue=e=>pe(G({},"__esModule",{value:!0}),e);var $=Z(()=>{"use strict"});function ge(e){te=e}function i(e,t,o){let a=`[${new Date().toISOString()}] [${e}]`,n=o?`${a} ${t} ${JSON.stringify(o)}`:`${a} ${t}`;te&&te.appendLine(n),e==="ERROR"?console.error(n):e==="WARN"?console.warn(n):console.log(n)}function m(e){return e instanceof Error?e.message:String(e)}var te,D=Z(()=>{"use strict";$()});var Te={};ee(Te,{autoInjectScript:()=>L,getAutoApprovalScript:()=>Ie});async function L(e){try{let t=Ie(e);await Q.env.clipboard.writeText(t),i("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await Q.commands.executeCommand("workbench.action.toggleDevTools"),i("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(o){i("WARN","Could not toggle Developer Tools",m(o))}}catch(t){i("ERROR","Failed to copy script",m(t))}}function Ie(e){try{let t=Se.join(e.extensionPath,"scripts","auto-approval-script.js");return xe.readFileSync(t,"utf8")}catch(t){return i("ERROR","Failed to read auto-approval-script.js",m(t)),"// Error: Could not load auto-approval script"}}var Q,xe,Se,Y=Z(()=>{"use strict";Q=A(require("vscode")),xe=A(require("fs")),Se=A(require("path"));D();$()});var ht={};ee(ht,{activate:()=>dt,deactivate:()=>wt});module.exports=ue(ht);var r=A(require("vscode"));$();D();async function v(e){return e.workspaceState.get("tasks",[])}async function W(e,t){await e.workspaceState.update("tasks",t)}async function H(e,t,o="",s="other"){let a=await v(e),n={id:Date.now().toString(),title:t,description:o,status:"pending",category:s,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return a.push(n),await W(e,a),n}async function R(e,t,o){let s=await v(e),a=s.find(n=>n.id===t);a&&(a.status=o,a.updatedAt=new Date().toISOString(),await W(e,s))}async function K(e,t){let s=(await v(e)).filter(a=>a.id!==t);await W(e,s)}async function me(e){let t=await v(e),o=t.filter(a=>a.status!=="completed"),s=t.length-o.length;return await W(e,o),s}var _=A(require("vscode")),be=A(require("http"));D();$();var ke="aiFeedbackBridge.portRegistry",ve=3737,Le=50;async function fe(e){return e.globalState.get(ke,[])}async function ae(e,t){await e.globalState.update(ke,t)}async function we(e){let t=await fe(e),o=_.workspace.name||"No Workspace",s=_.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=Date.now()-60*60*1e3,n=t.filter(l=>l.timestamp>a),c=n.find(l=>l.workspace===s);if(c)return i("INFO",`Reusing existing port ${c.port} for workspace`),c.timestamp=Date.now(),await ae(e,n),c.port;let g=new Set(n.map(l=>l.port)),p=ve;for(let l=0;l<Le;l++){let T=ve+l;if(!g.has(T)&&await Ve(T)){p=T;break}}return n.push({port:p,workspace:s,timestamp:Date.now()}),await ae(e,n),i("INFO",`Auto-assigned port ${p} for workspace: ${o}`),p}async function Ve(e){return new Promise(t=>{let o=be.createServer();o.once("error",s=>{s.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function he(e,t){let o=await fe(e),s=_.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=o.filter(n=>!(n.port===t&&n.workspace===s));await ae(e,a),i("INFO",`Released port ${t}`)}var ie={};ee(ie,{startServer:()=>ne,stopServer:()=>q});var ye=A(require("vscode")),Ce=A(require("http"));D();$();var M;function ne(e,t,o){return M=Ce.createServer(async(s,a)=>{if(a.setHeader("Access-Control-Allow-Origin","*"),a.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS"),a.setHeader("Access-Control-Allow-Headers","Content-Type"),s.method==="OPTIONS"){a.writeHead(200),a.end();return}try{await Je(s,a,e,t,o)}catch(n){i("ERROR","Request handler error",m(n)),a.writeHead(500,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Internal server error"}))}}),M.listen(t,()=>{i("INFO",`\u2705 Server listening on port ${t}`)}),M.on("error",s=>{s.code==="EADDRINUSE"?i("ERROR",`Port ${t} is already in use. Please change the port in settings.`):i("ERROR","Server error occurred",{error:s.message,code:s.code})}),e.subscriptions.push({dispose:()=>{q()}}),M}function q(){M&&(i("INFO","Closing server"),M.close(),M=void 0)}async function Je(e,t,o,s,a){let n=e.url||"/",c=e.method||"GET";i("DEBUG",`${c} ${n}`),n==="/help"||n==="/"?ze(t,s):n==="/tasks"&&c==="GET"?await Ge(t,o):n==="/tasks"&&c==="POST"?await Ke(e,t,o):n.startsWith("/tasks/")&&c==="PUT"?await _e(e,t,o,n):n.startsWith("/tasks/")&&c==="DELETE"?await qe(t,o,n):n==="/feedback"&&c==="POST"?await Qe(e,t,a):n==="/restart-app"||n.startsWith("/restart-app?")?await Ye(e,t):(t.writeHead(404,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Not found",message:`Unknown endpoint: ${c} ${n}`})))}function ze(e,t){let o=`
AI Feedback Bridge - API Documentation
=======================================

Base URL: http://localhost:${t}

Endpoints:
----------

GET /
GET /help
    Returns this API documentation

GET /tasks
    List all workspace tasks
    Response: Array of task objects

POST /tasks
    Create a new task
    Body: {
        "title": "Task title",
        "description": "Optional description",
        "category": "bug|feature|improvement|documentation|testing|other"
    }
    Response: Created task object

PUT /tasks/:id
    Update a task status
    Body: {
        "status": "pending|in-progress|completed"
    }
    Response: { success: true }

DELETE /tasks/:id
    Delete a task
    Response: { success: true }

POST /feedback
    Send feedback to AI agent
    Body: {
        "message": "Feedback message",
        "context": { ... optional context ... }
    }
    Response: { success: true, message: "Feedback sent to AI Agent" }

POST /restart-app?delay=30
    Restart the Electron app (if applicable)
    Query params: delay (seconds, default 30)
    Response: { success: true, message: "App restart initiated" }

Examples:
---------

# List all tasks
curl http://localhost:${t}/tasks

# Create a task
curl -X POST http://localhost:${t}/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Fix bug", "category": "bug"}'

# Update task status
curl -X PUT http://localhost:${t}/tasks/12345 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "in-progress"}'

# Send feedback
curl -X POST http://localhost:${t}/feedback \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Please review this code"}'
`;e.writeHead(200,{"Content-Type":"text/plain"}),e.end(o)}async function Ge(e,t){try{let o=await v(t);e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify(o,null,2))}catch(o){i("ERROR","Failed to get tasks",m(o)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to retrieve tasks"}))}}async function Ke(e,t,o){let s=await se(e);try{let a=JSON.parse(s);if(!a.title||typeof a.title!="string"){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Missing or invalid "title" field'}));return}let n=a.title.trim(),c=(a.description||"").trim(),g=a.category||"other",p=await H(o,n,c,g);i("INFO","Task created via API",{taskId:p.id,title:p.title}),t.writeHead(201,{"Content-Type":"application/json"}),t.end(JSON.stringify(p,null,2))}catch(a){a instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to create task",m(a)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to create task"})))}}async function _e(e,t,o,s){let a=s.split("/")[2],n=await se(e);try{let c=JSON.parse(n);if(!c.status||!["pending","in-progress","completed"].includes(c.status)){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Invalid or missing "status" field',valid:["pending","in-progress","completed"]}));return}await R(o,a,c.status),i("INFO","Task updated via API",{taskId:a,status:c.status}),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,taskId:a,status:c.status}))}catch(c){c instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to update task",m(c)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to update task"})))}}async function qe(e,t,o){let s=o.split("/")[2];try{await K(t,s),i("INFO","Task deleted via API",{taskId:s}),e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify({success:!0,taskId:s}))}catch(a){i("ERROR","Failed to delete task",m(a)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to delete task"}))}}async function Qe(e,t,o){let s=await se(e,1048576);try{let a=JSON.parse(s);if(!a||typeof a!="object")throw new Error("Invalid feedback structure: must be an object");if(!a.message||typeof a.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let n=a.message.trim();if(n.length===0)throw new Error("Invalid feedback: message cannot be empty");if(n.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");i("INFO","Received feedback",{messageLength:n.length,hasContext:!!a.context});let c=await o(n,a.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:c,message:c?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(a){let n=m(a);i("ERROR","Error processing feedback",{error:n}),a instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:n})))}}async function Ye(e,t){let o=(e.url||"").split("?"),s=new URLSearchParams(o[1]||""),a=parseInt(s.get("delay")||"30",10);i("INFO",`Received restart request for Electron app (delay: ${a}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${a}s)`,delay:a})),setTimeout(async()=>{try{let{exec:n}=require("child_process"),{promisify:c}=require("util"),g=c(n);i("INFO","Killing Electron process...");try{await g('pkill -f "electron.*Code/AI"')}catch{i("INFO","Kill command completed (process may not have been running)")}i("INFO",`Waiting ${a} seconds before restart...`),await new Promise(l=>setTimeout(l,a*1e3));let p=ye.workspace.workspaceFolders?.[0]?.uri.fsPath;p&&p.includes("/AI")?(i("INFO",`Restarting Electron app in: ${p}`),n(`cd "${p}" && npm run dev > /dev/null 2>&1 &`),i("INFO","Electron app restart command sent")):i("WARN",`Could not find workspace path: ${p}`)}catch(n){i("ERROR","Restart error",m(n))}},100)}async function se(e,t=10*1024){return new Promise((o,s)=>{let a="",n=0;e.on("data",c=>{if(n+=c.length,n>t){s(new Error(`Request body too large (max ${t} bytes)`)),e.destroy();return}a+=c.toString()}),e.on("end",()=>{o(a)}),e.on("error",c=>{s(c)})})}Y();var f=A(require("vscode"));$();D();Y();var B;async function Ae(e,t,o,s,a,n){if(B){B.reveal(f.ViewColumn.One);let l=await v(e);B.webview.html=await E(o(),t,l);return}let c=f.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",f.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});B=c,c.onDidDispose(()=>{B=void 0},null,e.subscriptions);let g=o(),p=await v(e);c.webview.html=await E(g,t,p),c.webview.onDidReceiveMessage(async l=>{await Xe(l,c,e,t,o,s,a,n)},void 0,e.subscriptions)}async function Xe(e,t,o,s,a,n,c,g){switch(e.command){case"updateSetting":await n(e.key,e.value),i("INFO",`Setting updated: ${e.key} = ${e.value}`);break;case"reload":let p=await v(o);t.webview.html=await E(a(),s,p);break;case"runNow":await Ze(o,c,g);break;case"injectScript":L(o);break;case"sendInstructions":await et(s,c);break;case"saveNewTask":await tt(e,t,o,s,a);break;case"updateTaskField":await ot(e,t,o,s,a);break;case"updateTaskStatus":await at(e,t,o,s,a);break;case"createTask":await nt(t,o,s,a);break;case"openTaskManager":await f.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":await st(t,o,s,a);break}}async function Ze(e,t,o){try{let s=await o(e,!0);s?(await t(s,{source:"manual_trigger",timestamp:new Date().toISOString()}),i("INFO","[Run Now] Manually triggered all enabled reminders")):f.window.showInformationMessage("No enabled categories (check settings)")}catch(s){i("ERROR","[Run Now] Failed to send message",{error:m(s)}),f.window.showErrorMessage("Failed to send reminders")}}async function et(e,t){try{let o="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+e+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+e+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+e+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+e+"/help";await t(o,{source:"instructions",timestamp:new Date().toISOString()})}catch{f.window.showErrorMessage("Failed to send instructions")}}async function tt(e,t,o,s,a){try{await H(o,e.title,e.description,e.category);let n=await v(o);t.webview.html=await E(a(),s,n)}catch(n){f.window.showErrorMessage(`Failed to create task: ${m(n)}`)}}async function ot(e,t,o,s,a){try{let n=await v(o),c=n.find(g=>g.id===e.taskId);if(c){e.field==="title"?c.title=e.value:e.field==="description"&&(c.description=e.value),c.updatedAt=new Date().toISOString(),await W(o,n);let g=await v(o);t.webview.html=await E(a(),s,g)}}catch(n){f.window.showErrorMessage(`Failed to update task: ${m(n)}`)}}async function at(e,t,o,s,a){try{await R(o,e.taskId,e.status);let n=await v(o);t.webview.html=await E(a(),s,n)}catch(n){f.window.showErrorMessage(`Failed to update status: ${m(n)}`)}}async function nt(e,t,o,s){await f.commands.executeCommand("ai-feedback-bridge.addTask");let a=await v(t);e.webview.html=await E(s(),o,a)}async function st(e,t,o,s){try{let a=await me(t),n=await v(t);e.webview.html=await E(s(),o,n),i("DEBUG",`Cleared ${a} completed tasks`)}catch(a){f.window.showErrorMessage(`Failed to clear completed tasks: ${m(a)}`)}}async function E(e,t,o){let s=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],a=e.get("autoContinue.enabled",!1),n=e.get("autoApproval.enabled",!0),c=e.get("autoApproval.autoInject",!1),g="";for(let d of s){let C=e.get(`autoContinue.${d.key}.enabled`,!0),N=e.get(`autoContinue.${d.key}.interval`,d.interval),F=e.get(`autoContinue.${d.key}.message`,"");g+=`
			<tr class="${C?"":"disabled"}">
				<td class="cat-icon">${d.icon}</td>
				<td class="cat-name">${d.name}</td>
				<td class="cat-message">
					<input type="text" value="${F}" data-key="autoContinue.${d.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${C?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${N}" data-key="autoContinue.${d.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${C?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${d.key}.enabled" ${C?"checked":""} 
					       class="toggle-cb" id="cb-${d.key}" data-auto-approved="skip">
					<label for="cb-${d.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`}let p=o.filter(d=>d.status!=="completed").reverse(),l=o.filter(d=>d.status==="completed").length,T=p.length===0?`
		<div class="row">
			<label style="color: var(--vscode-descriptionForeground); font-style: italic;">No active tasks for this workspace</label>
			<button onclick="createTask()">Add Task</button>
		</div>
		${l>0?`
		<div class="row" style="margin-top: 8px;">
			<label style="font-size: 12px; color: var(--vscode-descriptionForeground);">${l} completed task${l>1?"s":""}</label>
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
				${p.map(d=>{let C=d.status==="pending"?"\u23F3":d.status==="in-progress"?"\u{1F504}":"\u2705",N=d.status==="pending"?"Pending":d.status==="in-progress"?"In Progress":"Completed",F=d.status==="pending"?"#cca700":d.status==="in-progress"?"#3794ff":"#89d185";return`
					<tr>
						<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${d.id}', '${d.status}')" title="Click to cycle status">${C}</td>
						<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${d.id}', 'title')">${d.title}</td>
						<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${d.id}', 'description')">${d.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
						<td style="font-size: 12px; opacity: 0.7;">${d.category}</td>
						<td style="color: ${F}; font-size: 12px;">${N}</td>
					</tr>
				`}).join("")}
			</tbody>
		</table>
		<div class="row" style="margin-top: 8px;">
			<button onclick="createTask()">Add Task</button>
			<button onclick="openTaskManager()">Manage Tasks</button>
			${l>0?`<button onclick="clearCompleted()">Clear Completed (${l})</button>`:""}
		</div>
	`;return`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Settings</title>
	<style>
		${it()}
	</style>
</head>
<body>
	<div class="header">
		<h1>\u{1F309} AI Feedback Bridge</h1>
		<button onclick="runNow()">Run Now</button>
		<button onclick="injectScript()">Inject Script</button>
		<button onclick="sendInstructions()">Send Instructions</button>
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
				<input type="checkbox" data-key="autoApproval.enabled" ${n?"checked":""} 
				       class="toggle-cb" id="cb-approval" data-auto-approved="skip">
				<label for="cb-approval" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
		<div class="row">
			<label>Auto-inject script on startup</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoApproval.autoInject" ${c?"checked":""} 
				       class="toggle-cb" id="cb-autoinject" ${n?"":"disabled"} data-auto-approved="skip">
				<label for="cb-autoinject" class="toggle-label" data-auto-approved="skip"></label>
			</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<div style="display: flex; align-items: center; gap: 8px;">
				<input type="checkbox" data-key="autoContinue.enabled" ${a?"checked":""} 
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
				${g}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${T}
	</div>
	
	<script>
		${rt()}
	</script>
</body>
</html>`}function it(){return`
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
	`}function rt(){return`
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
						const messageInput = row.querySelector('input[type="text"]');
						if (messageInput) messageInput.disabled = !value;
						const intervalInput = row.querySelector('input[type="number"]');
						if (intervalInput) intervalInput.disabled = !value;
					}
				}
				
				// Handle auto-approval enabled toggle
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
	`}async function X(e,t,o){if(B){let s=await v(e);B.webview.html=await E(t(),o,s),i("DEBUG","Settings panel refreshed")}}var h,re,P,j,V,I,k=3737,S,O;function w(){return r.workspace.getConfiguration("aiFeedbackBridge")}async function ce(e,t){let o=w();await o.update(e,t,r.ConfigurationTarget.Workspace),i("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}async function dt(e){O=e,h=r.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(h),ge(h),i("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=w(),o=r.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(i("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,r.ConfigurationTarget.Global));let a=t.get("port");k=await we(e),i("INFO",`Auto-selected port: ${k} for this window`);let n=r.workspace.name||"No Workspace",c=r.workspace.workspaceFolders?.length||0;i("INFO",`Window context: ${n} (${c} folders)`),j=r.window.createStatusBarItem(r.StatusBarAlignment.Right,100),j.command="ai-feedback-bridge.openSettings",j.show(),e.subscriptions.push(j),P=r.window.createStatusBarItem(r.StatusBarAlignment.Right,99),P.command="ai-feedback-bridge.toggleAutoContinue",P.show(),e.subscriptions.push(P),V=r.window.createStatusBarItem(r.StatusBarAlignment.Right,98),V.command="ai-feedback-bridge.injectScript",V.text="$(clippy) Inject",V.tooltip="Copy auto-approval script to clipboard",V.show(),e.subscriptions.push(V),Ee(t);let g=r.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{Ae(e,k,w,ce,J,de)});e.subscriptions.push(g);let p=r.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let u=await de(e,!0);u?(i("INFO","[Run Now] Manually triggered all enabled reminders"),await J(u,{source:"manual_trigger",timestamp:new Date().toISOString()})):r.window.showInformationMessage("No enabled categories (check settings)")}catch(u){i("ERROR","[Run Now] Failed to send message",{error:u}),r.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(p);let l=r.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{L(O)});e.subscriptions.push(l);let T=r.commands.registerCommand("ai-feedback-bridge.getPort",()=>k);e.subscriptions.push(T);let d=r.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let u=await r.window.showInputBox({prompt:"Task title"});if(!u)return;let y=await r.window.showInputBox({prompt:"Task description (optional)"}),b=await r.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await H(e,u,y||"",b||"other"),await X(O,w,k)});e.subscriptions.push(d);let C=r.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let u=await v(e);if(u.length===0){r.window.showInformationMessage("No tasks found");return}let y=u.map(x=>({label:`${x.status==="completed"?"\u2705":x.status==="in-progress"?"\u{1F504}":"\u23F3"} ${x.title}`,description:x.description,task:x})),b=await r.window.showQuickPick(y,{placeHolder:"Select a task to update"});if(b){let x=await r.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});x==="Delete"?await K(e,b.task.id):x==="Mark as In Progress"?await R(e,b.task.id,"in-progress"):x==="Mark as Completed"?await R(e,b.task.id,"completed"):x==="Mark as Pending"&&await R(e,b.task.id,"pending"),await X(O,w,k)}});e.subscriptions.push(C),gt(e);let N=r.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async u=>{u||(u=await r.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),u&&await ut(u,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(N);let F=r.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let y=w().get("autoContinue.enabled",!1);await ce("autoContinue.enabled",!y),i("INFO",`Auto-Continue ${y?"disabled":"enabled"}`),X(O,w,k)});e.subscriptions.push(F);let Oe=r.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let u=await r.window.showInputBox({prompt:"Enter new port number",value:k.toString(),validateInput:y=>{let b=parseInt(y);return isNaN(b)||b<1024||b>65535?"Invalid port (1024-65535)":null}});u&&(await ce("port",parseInt(u)),i("INFO",`Port changed to ${u}. Reloading VS Code...`),r.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(Oe);let Re=r.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let u=w(),y=u.get("autoContinue.interval",300),b=u.get("autoContinue.enabled",!1),Me=`\u{1F309} AI Feedback Bridge Status

Window: ${r.workspace.name||"No Workspace"}
Port: ${k}
Server: ${ie?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${b?`Enabled \u2705 (every ${y}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${k}`;h.appendLine(Me),h.show()});e.subscriptions.push(Re);let le=t.get("autoContinue.enabled",!1),z=t.inspect("autoContinue.enabled");i("INFO","[STARTUP] Auto-Continue check:",{enabled:le,defaultValue:z?.defaultValue,globalValue:z?.globalValue,workspaceValue:z?.workspaceValue,workspaceFolderValue:z?.workspaceFolderValue}),le?Pe(e):i("INFO","[STARTUP] Auto-Continue is disabled, not starting"),mt(),e.subscriptions.push(r.workspace.onDidChangeConfiguration(u=>{if(u.affectsConfiguration("aiFeedbackBridge")){let y=w();if(i("DEBUG","Configuration changed",{workspace:r.workspace.name,affectedKeys:["port","autoContinue"].filter(b=>u.affectsConfiguration(`aiFeedbackBridge.${b}`))}),u.affectsConfiguration("aiFeedbackBridge.port")){let b=y.get("port",3737);b!==k&&(i("INFO",`Port change detected: ${k} \u2192 ${b}. Reloading window...`),r.commands.executeCommand("workbench.action.reloadWindow"))}Ee(y),u.affectsConfiguration("aiFeedbackBridge.autoContinue")&&lt(e)}})),re=r.chat.createChatParticipant("ai-agent-feedback-bridge.agent",pt),re.iconPath=r.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(re);let Ne=r.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>vt(e));e.subscriptions.push(Ne);let Fe=r.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>bt());e.subscriptions.push(Fe);let $e=r.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>kt());e.subscriptions.push($e),i("INFO",`Feedback server started on http://localhost:${k}`)}function Ee(e){if(!P||!j)return;let t=e.get("autoContinue.enabled",!1);j.text=`AI Dev: ${k}`,j.tooltip="Click to configure AI Feedback Bridge",t?(P.text="$(sync~spin) Stop AI Dev",P.tooltip=`Auto-Continue active
Click to stop`):(P.text="$(play) Start AI Dev",P.tooltip=`Auto-Continue inactive
Click to start`)}async function de(e,t=!1){let o=w(),s=["tasks","improvements","coverage","robustness","cleanup","commits"],a=Date.now(),n=[],c="autoContinue.lastSent",g=e.globalState.get(c,{}),p={...g};for(let l of s){let T=o.get(`autoContinue.${l}.enabled`,!0),d=o.get(`autoContinue.${l}.interval`,300),C=o.get(`autoContinue.${l}.message`,"");if(!T||!C)continue;let N=g[l]||0,F=(a-N)/1e3;(t||F>=d)&&(n.push(C),p[l]=a)}return await e.globalState.update(c,p),n.length===0?"":n.join(". ")+"."}function Pe(e){if(w().get("autoContinue.enabled",!1)){let a=r.workspace.name||"No Workspace";i("INFO",`\u2705 Auto-Continue enabled for window: ${a}`),I=setInterval(async()=>{try{if(!w().get("autoContinue.enabled",!1)){i("INFO","[Auto-Continue] Detected disabled state, stopping timer"),I&&(clearInterval(I),I=void 0);return}let g=await de(e);g&&(i("INFO","[Auto-Continue] Sending periodic reminder"),await J(g,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(n){i("ERROR","[Auto-Continue] Failed to send message",{error:m(n)})}},500)}else i("DEBUG","Auto-Continue is disabled")}function lt(e){I&&(clearInterval(I),I=void 0,i("INFO","Auto-Continue timer stopped")),Pe(e)}async function pt(e,t,o,s){h.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[n]=await r.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n){let c=[r.LanguageModelChatMessage.User(e.prompt)],g=await n.sendRequest(c,{},s);for await(let p of g.text)o.markdown(p)}}catch(n){n instanceof r.LanguageModelError&&(h.appendLine(`Language model error: ${n.message}`),o.markdown(`\u26A0\uFE0F Error: ${n.message}

`))}return{metadata:{command:"process-feedback"}}}async function J(e,t){let o=t||{source:"unknown",timestamp:new Date().toISOString()};try{let s=`# \uFFFD AI DEV MODE

`;s+=`**User Feedback:**
${e}

`,Object.keys(o).filter(n=>n!=="source"&&n!=="timestamp").length>0&&(s+=`**Context:**
\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),s+=`**Instructions:**
`,s+=`Analyze feedback, take appropriate action:
`,s+=`\u2022 If a bug \u2192 find and fix root cause
`,s+=`\u2022 If a feature \u2192 draft implementation plan
`,s+=`\u2022 Apply and commit changes
`,h.appendLine("Processing feedback through AI agent..."),h.appendLine(s);try{let[n]=await r.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return h.appendLine("\u2705 AI Agent processing request..."),await r.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${s}`}),setTimeout(async()=>{try{await r.commands.executeCommand("workbench.action.chat.submit")}catch{h.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),i("INFO","Feedback sent to AI Agent"),!0}catch(n){h.appendLine(`Could not access language model: ${m(n)}`)}return await r.env.clipboard.writeText(s),i("INFO","Feedback copied to clipboard"),!0}catch(s){return i("ERROR",`Error sending to agent: ${m(s)}`),!1}}async function ut(e,t){return J(e,t)}function gt(e){ne(e,k,J)}function mt(){let e=w(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let s=e.inspect("autoApproval.autoInject");if(!!!(s&&(s.workspaceValue||s.workspaceFolderValue))){i("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),i("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}i("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{L(O).catch(n=>{i("WARN","Auto-inject setup failed:",m(n))})},1e3)}}function vt(e){if(S){h.appendLine("Auto-approval is already enabled");return}let o=w().get("autoApproval.intervalMs",2e3);i("INFO",`Enabling auto-approval with ${o}ms interval`),S=setInterval(async()=>{try{await r.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{S&&(clearInterval(S),S=void 0)}}),i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function bt(){S?(clearInterval(S),S=void 0,h.appendLine("Auto-approval disabled"),i("INFO","Auto-approval disabled")):i("INFO","Auto-approval is not currently enabled")}function kt(){let{getAutoApprovalScript:e}=(Y(),ue(Te)),t=e(O),o=r.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",r.ViewColumn.One,{enableScripts:!0});o.webview.html=ft(t),r.env.clipboard.writeText(t),i("INFO","Auto-approval script copied to clipboard")}function ft(e){return`<!DOCTYPE html>
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
</html>`}async function wt(){q(),i("INFO","HTTP server closed"),I&&(clearInterval(I),I=void 0,i("INFO","Auto-continue timer cleared")),S&&(clearInterval(S),S=void 0,i("INFO","Auto-approval interval cleared")),O&&await he(O,k),i("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
