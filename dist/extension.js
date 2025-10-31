"use strict";var Ze=Object.create;var X=Object.defineProperty;var et=Object.getOwnPropertyDescriptor;var tt=Object.getOwnPropertyNames;var ot=Object.getPrototypeOf,nt=Object.prototype.hasOwnProperty;var re=(e,t)=>()=>(e&&(t=e(e=0)),t);var ce=(e,t)=>{for(var o in t)X(e,o,{get:t[o],enumerable:!0})},ye=(e,t,o,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of tt(t))!nt.call(e,a)&&a!==o&&X(e,a,{get:()=>t[a],enumerable:!(n=et(t,a))||n.enumerable});return e};var S=(e,t,o)=>(o=e!=null?Ze(ot(e)):{},ye(t||!e||!e.__esModule?X(o,"default",{value:e,enumerable:!0}):o,e)),Ce=e=>ye(X({},"__esModule",{value:!0}),e);var P=re(()=>{"use strict"});function xe(e){de=e}function i(e,t,o){let a=`[${new Date().toISOString()}] [${e}]`,s=o?`${a} ${t} ${JSON.stringify(o)}`:`${a} ${t}`;de&&de.appendLine(s),e==="ERROR"?console.error(s):e==="WARN"?console.warn(s):console.log(s)}function m(e){return e instanceof Error?e.message:String(e)}var de,O=re(()=>{"use strict";P()});var Be={};ce(Be,{autoInjectScript:()=>_,getAutoApprovalScript:()=>Me});async function _(e){try{let t=Me(e);await oe.env.clipboard.writeText(t),i("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await oe.commands.executeCommand("workbench.action.toggleDevTools"),i("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(o){i("WARN","Could not toggle Developer Tools",m(o))}}catch(t){i("ERROR","Failed to copy script",m(t))}}function Me(e){try{let t=$e.join(e.extensionPath,"scripts","auto-approval-script.js");return Fe.readFileSync(t,"utf8")}catch(t){return i("ERROR","Failed to read auto-approval-script.js",m(t)),"// Error: Could not load auto-approval script"}}var oe,Fe,$e,ne=re(()=>{"use strict";oe=S(require("vscode")),Fe=S(require("fs")),$e=S(require("path"));O();P()});var Ht={};ce(Ht,{activate:()=>Ft,deactivate:()=>Lt});module.exports=Ce(Ht);var c=S(require("vscode"));P();O();async function f(e){try{let t=e.workspaceState.get("tasks",[]);return Array.isArray(t)?t:(console.error("Invalid tasks data in workspace state, resetting to empty array"),await e.workspaceState.update("tasks",[]),[])}catch(t){return console.error("Error reading tasks from workspace state:",t),[]}}async function G(e,t){try{if(!Array.isArray(t))throw new Error("Tasks must be an array");await e.workspaceState.update("tasks",t)}catch(o){throw console.error("Error saving tasks to workspace state:",o),o}}async function K(e,t,o="",n="other"){if(!t||typeof t!="string"||t.trim().length===0)throw new Error("Task title is required and must be a non-empty string");if(t.length>200)throw new Error("Task title too long (max 200 characters)");if(typeof o!="string")throw new Error("Task description must be a string");if(o.length>5e3)throw new Error("Task description too long (max 5000 characters)");let a=await f(e),s={id:Date.now().toString(),title:t.trim(),description:o.trim(),status:"pending",category:n,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return a.push(s),await G(e,a),s}async function B(e,t,o){let n=await f(e),a=n.find(s=>s.id===t);a&&(a.status=o,a.updatedAt=new Date().toISOString(),await G(e,n))}async function Z(e,t){let n=(await f(e)).filter(a=>a.id!==t);await G(e,n)}async function Se(e){let t=await f(e),o=t.filter(a=>a.status!=="completed"),n=t.length-o.length;return await G(e,o),n}var ee=S(require("vscode")),Te=S(require("http"));O();P();var Ee="aiFeedbackBridge.portRegistry",Ie=3737,at=50;async function Ae(e){return e.globalState.get(Ee,[])}async function pe(e,t){await e.globalState.update(Ee,t)}async function Pe(e){let t=await Ae(e),o=ee.workspace.name||"No Workspace",n=ee.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=Date.now()-60*60*1e3,s=t.filter(d=>d.timestamp>a),r=s.find(d=>d.workspace===n);if(r)return i("INFO",`Reusing existing port ${r.port} for workspace`),r.timestamp=Date.now(),await pe(e,s),r.port;let g=new Set(s.map(d=>d.port)),p=Ie;for(let d=0;d<at;d++){let y=Ie+d;if(!g.has(y)&&await st(y)){p=y;break}}return s.push({port:p,workspace:n,timestamp:Date.now()}),await pe(e,s),i("INFO",`Auto-assigned port ${p} for workspace: ${o}`),p}async function st(e){return new Promise(t=>{let o=Te.createServer();o.once("error",n=>{n.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function Oe(e,t){let o=await Ae(e),n=ee.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=o.filter(s=>!(s.port===t&&s.workspace===n));await pe(e,a),i("INFO",`Released port ${t}`)}var me={};ce(me,{startServer:()=>ue,stopServer:()=>te});var Re=S(require("vscode")),Ne=S(require("http"));O();P();var L,Qt=1024*1024,rt=3e4;function ct(e){return Number.isInteger(e)&&e>=1024&&e<=65535}function ue(e,t,o){if(!ct(t)){let n=`Invalid port number: ${t}. Must be between 1024 and 65535.`;throw i("ERROR",n),new Error(n)}return L=Ne.createServer(async(n,a)=>{if(n.setTimeout(rt,()=>{i("WARN","Request timeout",{url:n.url,method:n.method}),a.headersSent||(a.writeHead(408,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Request timeout"})))}),a.setHeader("Access-Control-Allow-Origin","*"),a.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS"),a.setHeader("Access-Control-Allow-Headers","Content-Type"),n.method==="OPTIONS"){a.writeHead(200),a.end();return}try{await dt(n,a,e,t,o)}catch(s){i("ERROR","Request handler error",m(s)),a.headersSent||(a.writeHead(500,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Internal server error"})))}}),L.listen(t,()=>{i("INFO",`\u2705 Server listening on port ${t}`)}),L.on("error",n=>{n.code==="EADDRINUSE"?i("ERROR",`Port ${t} is already in use. Please change the port in settings.`):i("ERROR","Server error occurred",{error:n.message,code:n.code})}),e.subscriptions.push({dispose:()=>{te()}}),L}function te(){L&&(i("INFO","Closing server"),L.close(),L=void 0)}async function dt(e,t,o,n,a){let s=e.url||"/",r=e.method||"GET";i("DEBUG",`${r} ${s}`),s==="/help"||s==="/"?lt(t,n):s==="/tasks"&&r==="GET"?await pt(t,o):s==="/tasks"&&r==="POST"?await ut(e,t,o):s.startsWith("/tasks/")&&r==="PUT"?await gt(e,t,o,s):s.startsWith("/tasks/")&&r==="DELETE"?await mt(t,o,s):s==="/feedback"&&r==="POST"?await vt(e,t,a):s==="/restart-app"||s.startsWith("/restart-app?")?await ft(e,t):(t.writeHead(404,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Not found",message:`Unknown endpoint: ${r} ${s}`})))}function lt(e,t){let o=`
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
`;e.writeHead(200,{"Content-Type":"text/plain"}),e.end(o)}async function pt(e,t){try{let o=await f(t);e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify(o,null,2))}catch(o){i("ERROR","Failed to get tasks",m(o)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to retrieve tasks"}))}}async function ut(e,t,o){try{let n=await ge(e),a=JSON.parse(n);if(!a.title||typeof a.title!="string"){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Missing or invalid "title" field (must be non-empty string)'}));return}let s=a.title.trim();if(s.length===0){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Title cannot be empty"}));return}if(s.length>200){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Title too long (max 200 characters)"}));return}let r=a.description?String(a.description).trim():"";if(r.length>5e3){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Description too long (max 5000 characters)"}));return}let p=["feature","bug","improvement","other"].includes(a.category)?a.category:"other",d=await K(o,s,r,p);i("INFO","Task created via API",{taskId:d.id,title:d.title}),t.writeHead(201,{"Content-Type":"application/json"}),t.end(JSON.stringify(d,null,2))}catch(n){n instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):n instanceof Error&&n.message.includes("too large")?(t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:n.message}))):(i("ERROR","Failed to create task",m(n)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to create task"})))}}async function gt(e,t,o,n){let a=n.split("/")[2],s=await ge(e);try{let r=JSON.parse(s);if(!r.status||!["pending","in-progress","completed"].includes(r.status)){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Invalid or missing "status" field',valid:["pending","in-progress","completed"]}));return}await B(o,a,r.status),i("INFO","Task updated via API",{taskId:a,status:r.status}),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,taskId:a,status:r.status}))}catch(r){r instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to update task",m(r)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to update task"})))}}async function mt(e,t,o){let n=o.split("/")[2];try{await Z(t,n),i("INFO","Task deleted via API",{taskId:n}),e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify({success:!0,taskId:n}))}catch(a){i("ERROR","Failed to delete task",m(a)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to delete task"}))}}async function vt(e,t,o){let n=await ge(e,1048576);try{let a=JSON.parse(n);if(!a||typeof a!="object")throw new Error("Invalid feedback structure: must be an object");if(!a.message||typeof a.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let s=a.message.trim();if(s.length===0)throw new Error("Invalid feedback: message cannot be empty");if(s.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");i("INFO","Received feedback",{messageLength:s.length,hasContext:!!a.context});let r=await o(s,a.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:r,message:r?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(a){let s=m(a);i("ERROR","Error processing feedback",{error:s}),a instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:s})))}}async function ft(e,t){let o=(e.url||"").split("?"),n=new URLSearchParams(o[1]||""),a=parseInt(n.get("delay")||"30",10);i("INFO",`Received restart request for Electron app (delay: ${a}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${a}s)`,delay:a})),setTimeout(async()=>{try{let{exec:s}=require("child_process"),{promisify:r}=require("util"),g=r(s);i("INFO","Killing Electron process...");try{await g('pkill -f "electron.*Code/AI"')}catch{i("INFO","Kill command completed (process may not have been running)")}i("INFO",`Waiting ${a} seconds before restart...`),await new Promise(d=>setTimeout(d,a*1e3));let p=Re.workspace.workspaceFolders?.[0]?.uri.fsPath;p&&p.includes("/AI")?(i("INFO",`Restarting Electron app in: ${p}`),s(`cd "${p}" && npm run dev > /dev/null 2>&1 &`),i("INFO","Electron app restart command sent")):i("WARN",`Could not find workspace path: ${p}`)}catch(s){i("ERROR","Restart error",m(s))}},100)}async function ge(e,t=10*1024){return new Promise((o,n)=>{let a="",s=0;e.on("data",r=>{if(s+=r.length,s>t){n(new Error(`Request body too large (max ${t} bytes)`)),e.destroy();return}a+=r.toString()}),e.on("end",()=>{o(a)}),e.on("error",r=>{n(r)})})}ne();var C=S(require("vscode"));P();O();ne();var H;async function je(e,t,o,n,a,s){if(H){H.reveal(C.ViewColumn.One);let d=await f(e);H.webview.html=await R(o(),t,d);return}let r=C.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});H=r,r.onDidDispose(()=>{H=void 0},null,e.subscriptions);let g=o(),p=await f(e);r.webview.html=await R(g,t,p),r.webview.onDidReceiveMessage(async d=>{await bt(d,r,e,t,o,n,a,s)},void 0,e.subscriptions)}async function bt(e,t,o,n,a,s,r,g){switch(e.command){case"updateSetting":await s(e.key,e.value),i("INFO",`Setting updated: ${e.key} = ${e.value}`);break;case"reload":let p=await f(o);t.webview.html=await R(a(),n,p);break;case"runNow":await kt(o,r,g);break;case"injectScript":_(o);break;case"sendInstructions":await wt(n,r);break;case"saveNewTask":await ht(e,t,o,n,a);break;case"updateTaskField":await yt(e,t,o,n,a);break;case"updateTaskStatus":await Ct(e,t,o,n,a);break;case"createTask":await xt(t,o,n,a);break;case"openTaskManager":await C.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":await St(t,o,n,a);break}}async function kt(e,t,o){try{let n=await o(e,!0);n?(await t(n,{source:"manual_trigger",timestamp:new Date().toISOString()}),i("INFO","[Run Now] Manually triggered all enabled reminders")):C.window.showInformationMessage("No enabled categories (check settings)")}catch(n){i("ERROR","[Run Now] Failed to send message",{error:m(n)}),C.window.showErrorMessage("Failed to send reminders")}}async function wt(e,t){try{let o="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+e+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+e+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+e+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+e+"/help";await t(o,{source:"instructions",timestamp:new Date().toISOString()})}catch{C.window.showErrorMessage("Failed to send instructions")}}async function ht(e,t,o,n,a){try{await K(o,e.title,e.description,e.category);let s=await f(o);t.webview.html=await R(a(),n,s)}catch(s){C.window.showErrorMessage(`Failed to create task: ${m(s)}`)}}async function yt(e,t,o,n,a){try{let s=await f(o),r=s.find(g=>g.id===e.taskId);if(r){e.field==="title"?r.title=e.value:e.field==="description"&&(r.description=e.value),r.updatedAt=new Date().toISOString(),await G(o,s);let g=await f(o);t.webview.html=await R(a(),n,g)}}catch(s){C.window.showErrorMessage(`Failed to update task: ${m(s)}`)}}async function Ct(e,t,o,n,a){try{await B(o,e.taskId,e.status);let s=await f(o);t.webview.html=await R(a(),n,s)}catch(s){C.window.showErrorMessage(`Failed to update status: ${m(s)}`)}}async function xt(e,t,o,n){await C.commands.executeCommand("ai-feedback-bridge.addTask");let a=await f(t);e.webview.html=await R(n(),o,a)}async function St(e,t,o,n){try{let a=await Se(t),s=await f(t);e.webview.html=await R(n(),o,s),i("DEBUG",`Cleared ${a} completed tasks`)}catch(a){C.window.showErrorMessage(`Failed to clear completed tasks: ${m(a)}`)}}async function R(e,t,o){let n=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],a=e.get("autoContinue.enabled",!1),s=e.get("autoApproval.enabled",!0),r=e.get("autoApproval.autoInject",!1),g="";for(let l of n){let x=e.get(`autoContinue.${l.key}.enabled`,!0),E=e.get(`autoContinue.${l.key}.interval`,l.interval),A=e.get(`autoContinue.${l.key}.message`,"");g+=`
			<tr class="${x?"":"disabled"}">
				<td class="cat-icon">${l.icon}</td>
				<td class="cat-name">${l.name}</td>
				<td class="cat-message">
					<input type="text" value="${A}" data-key="autoContinue.${l.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${x?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${E}" data-key="autoContinue.${l.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${x?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${l.key}.enabled" ${x?"checked":""} 
					       class="toggle-cb" id="cb-${l.key}" data-auto-approved="skip">
					<label for="cb-${l.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`}let p=o.filter(l=>l.status!=="completed").reverse(),d=o.filter(l=>l.status==="completed").length,y=p.length===0?`
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
				${p.map(l=>{let x=l.status==="pending"?"\u23F3":l.status==="in-progress"?"\u{1F504}":"\u2705",E=l.status==="pending"?"Pending":l.status==="in-progress"?"In Progress":"Completed",A=l.status==="pending"?"#cca700":l.status==="in-progress"?"#3794ff":"#89d185";return`
					<tr>
						<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${l.id}', '${l.status}')" title="Click to cycle status">${x}</td>
						<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${l.id}', 'title')">${l.title}</td>
						<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${l.id}', 'description')">${l.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
						<td style="font-size: 12px; opacity: 0.7;">${l.category}</td>
						<td style="color: ${A}; font-size: 12px;">${E}</td>
					</tr>
				`}).join("")}
			</tbody>
		</table>
		<div class="row" style="margin-top: 8px;">
			<button onclick="createTask()">Add Task</button>
			<button onclick="openTaskManager()">Manage Tasks</button>
			${d>0?`<button onclick="clearCompleted()">Clear Completed (${d})</button>`:""}
		</div>
	`;return`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Settings</title>
	<style>
		${It()}
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
		${y}
	</div>
	
	<script>
		${Tt()}
	</script>
</body>
</html>`}function It(){return`
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
	`}function Tt(){return`
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
	`}async function ae(e,t,o){if(H){let n=await f(e);H.webview.html=await R(t(),o,n),i("DEBUG","Settings panel refreshed")}}var w=S(require("vscode"));P();O();var U,j;function De(e){j=e}function We(e){return U=w.chat.createChatParticipant("ai-agent-feedback-bridge.agent",At),U.iconPath=w.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(U),i("INFO","Chat participant registered"),U}async function At(e,t,o,n){j.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[s]=await w.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let r=[w.LanguageModelChatMessage.User(e.prompt)],g=await s.sendRequest(r,{},n);for await(let p of g.text)o.markdown(p)}}catch(s){s instanceof w.LanguageModelError&&(j.appendLine(`Language model error: ${s.message}`),o.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}function Pt(e,t){let o=t||{source:"unknown",timestamp:new Date().toISOString()},n=`# \u{1F916} AI DEV MODE

`;return n+=`**User Feedback:**
${e}

`,Object.keys(o).filter(s=>s!=="source"&&s!=="timestamp").length>0&&(n+=`**Context:**
\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),n+=`**Instructions:**
`,n+=`Analyze feedback, take appropriate action:
`,n+=`\u2022 If a bug \u2192 find and fix root cause
`,n+=`\u2022 If a feature \u2192 draft implementation plan
`,n+=`\u2022 Apply and commit changes
`,n}async function V(e,t){try{let o=Pt(e,t);j.appendLine("Processing feedback through AI agent..."),j.appendLine(o);try{let[n]=await w.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return j.appendLine("\u2705 AI Agent processing request..."),await w.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await w.commands.executeCommand("workbench.action.chat.submit")}catch{j.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),i("INFO","Feedback sent to AI Agent"),!0}catch(n){j.appendLine(`Could not access language model: ${m(n)}`)}return await w.env.clipboard.writeText(o),i("INFO","Feedback copied to clipboard"),!0}catch(o){return i("ERROR",`Error sending to agent: ${m(o)}`),!1}}async function Le(e,t){return V(e,t)}function He(){U&&(U.dispose(),U=void 0,i("INFO","Chat participant disposed"))}var Ue=S(require("vscode"));P();O();var J;async function se(e,t,o=!1){let n=t(),a=["tasks","improvements","coverage","robustness","cleanup","commits"],s=Date.now(),r=[],g="autoContinue.lastSent",p=e.globalState.get(g,{}),d={...p};for(let y of a){let l=n.get(`autoContinue.${y}.enabled`,!0),x=n.get(`autoContinue.${y}.interval`,300),E=n.get(`autoContinue.${y}.message`,"");if(!l||!E)continue;let A=p[y]||0,ie=(s-A)/1e3;(o||ie>=x)&&(r.push(E),d[y]=s)}return await e.globalState.update(g,d),r.length===0?"":r.join(". ")+"."}function ve(e,t,o){if(t().get("autoContinue.enabled",!1)){let r=Ue.workspace.name||"No Workspace";i("INFO",`\u2705 Auto-Continue enabled for window: ${r}`),J=setInterval(async()=>{try{if(!t().get("autoContinue.enabled",!1)){i("INFO","[Auto-Continue] Detected disabled state, stopping timer"),J&&(clearInterval(J),J=void 0);return}let d=await se(e,t);d&&(i("INFO","[Auto-Continue] Sending periodic reminder"),await o(d,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(g){i("ERROR","[Auto-Continue] Failed to send message",{error:m(g)})}},500)}else i("DEBUG","Auto-Continue is disabled")}function fe(){J&&(clearInterval(J),J=void 0,i("INFO","Auto-Continue timer stopped"))}function Ve(e,t,o){fe(),ve(e,t,o)}function Je(e,t){let o=t(),n=["tasks","improvements","coverage","robustness","cleanup","commits"],a=Date.now(),s=null,g=e.globalState.get("autoContinue.lastSent",{});for(let p of n){let d=o.get(`autoContinue.${p}.enabled`,!0),y=o.get(`autoContinue.${p}.interval`,300),l=o.get(`autoContinue.${p}.message`,"");if(!d||!l)continue;let x=g[p]||0,E=(a-x)/1e3,A=Math.max(0,y-E);(s===null||A<s)&&(s=A)}return s}function ze(e){if(e<60)return`${Math.floor(e)}s`;if(e<3600){let t=Math.floor(e/60),o=Math.floor(e%60);return`${t}m ${o}s`}else{let t=Math.floor(e/3600),o=Math.floor(e%3600/60);return`${t}h ${o}m`}}var D=S(require("vscode"));P();O();var N,z,q,Ge=3737;function Ke(e,t,o){Ge=t,z=D.window.createStatusBarItem(D.StatusBarAlignment.Right,100),z.command="ai-feedback-bridge.openSettings",z.show(),e.subscriptions.push(z),N=D.window.createStatusBarItem(D.StatusBarAlignment.Right,99),N.command="ai-feedback-bridge.toggleAutoContinue",N.show(),e.subscriptions.push(N),q=D.window.createStatusBarItem(D.StatusBarAlignment.Right,98),q.command="ai-feedback-bridge.injectScript",q.text="$(clippy) Inject",q.tooltip="Copy auto-approval script to clipboard",q.show(),e.subscriptions.push(q),Q(o),i("INFO","Status bar items initialized")}function Q(e,t){if(!N||!z)return;let o=e.get("autoContinue.enabled",!1);if(z.text=`AI Dev: ${Ge}`,z.tooltip="Click to configure AI Feedback Bridge",o){let n=t?` (${t})`:"";N.text=`$(sync~spin) Stop AI Dev${n}`,N.tooltip=t?`Auto-Continue active
Next reminder: ${t}
Click to stop`:`Auto-Continue active
Click to stop`}else N.text="$(play) Start AI Dev",N.tooltip=`Auto-Continue inactive
Click to start`}var W,h=3737,T,F,$;function k(){return c.workspace.getConfiguration("aiFeedbackBridge")}async function be(e,t){let o=k();await o.update(e,t,c.ConfigurationTarget.Workspace),i("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}async function Ft(e){$=e,W=c.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(W),xe(W),De(W),i("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=k(),o=c.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(i("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,c.ConfigurationTarget.Global));let a=t.get("port");h=await Pe(e),i("INFO",`Auto-selected port: ${h} for this window`);let s=c.workspace.name||"No Workspace",r=c.workspace.workspaceFolders?.length||0;i("INFO",`Window context: ${s} (${r} folders)`),Ke(e,h,t);let g=c.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{je(e,h,k,be,V,(u,b)=>se(u,k,b))});e.subscriptions.push(g);let p=c.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let u=await se(e,k,!0);u?(i("INFO","[Run Now] Manually triggered all enabled reminders"),await V(u,{source:"manual_trigger",timestamp:new Date().toISOString()})):c.window.showInformationMessage("No enabled categories (check settings)")}catch(u){i("ERROR","[Run Now] Failed to send message",{error:u}),c.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(p);let d=c.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{_($)});e.subscriptions.push(d);let y=c.commands.registerCommand("ai-feedback-bridge.getPort",()=>h);e.subscriptions.push(y);let l=c.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let u=await c.window.showInputBox({prompt:"Task title"});if(!u)return;let b=await c.window.showInputBox({prompt:"Task description (optional)"}),v=await c.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await K(e,u,b||"",v||"other"),await ae($,k,h)});e.subscriptions.push(l);let x=c.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let u=await f(e);if(u.length===0){c.window.showInformationMessage("No tasks found");return}let b=u.map(I=>({label:`${I.status==="completed"?"\u2705":I.status==="in-progress"?"\u{1F504}":"\u23F3"} ${I.title}`,description:I.description,task:I})),v=await c.window.showQuickPick(b,{placeHolder:"Select a task to update"});if(v){let I=await c.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});I==="Delete"?await Z(e,v.task.id):I==="Mark as In Progress"?await B(e,v.task.id,"in-progress"):I==="Mark as Completed"?await B(e,v.task.id,"completed"):I==="Mark as Pending"&&await B(e,v.task.id,"pending"),await ae($,k,h)}});e.subscriptions.push(x),$t(e);let E=c.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async u=>{u||(u=await c.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),u&&await Le(u,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(E);let A=c.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let b=k().get("autoContinue.enabled",!1);await be("autoContinue.enabled",!b),i("INFO",`Auto-Continue ${b?"disabled":"enabled"}`),b?we():ke(e),ae($,k,h)});e.subscriptions.push(A);let ie=c.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let u=await c.window.showInputBox({prompt:"Enter new port number",value:h.toString(),validateInput:b=>{let v=parseInt(b);return isNaN(v)||v<1024||v>65535?"Invalid port (1024-65535)":null}});u&&(await be("port",parseInt(u)),i("INFO",`Port changed to ${u}. Reloading VS Code...`),c.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(ie);let _e=c.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let u=k(),b=u.get("autoContinue.interval",300),v=u.get("autoContinue.enabled",!1),Xe=`\u{1F309} AI Feedback Bridge Status

Window: ${c.workspace.name||"No Workspace"}
Port: ${h}
Server: ${me?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${v?`Enabled \u2705 (every ${b}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${h}`;W.appendLine(Xe),W.show()});e.subscriptions.push(_e);let he=t.get("autoContinue.enabled",!1),Y=t.inspect("autoContinue.enabled");i("INFO","[STARTUP] Auto-Continue check:",{enabled:he,defaultValue:Y?.defaultValue,globalValue:Y?.globalValue,workspaceValue:Y?.workspaceValue,workspaceFolderValue:Y?.workspaceFolderValue}),he?(ve(e,k,V),ke(e)):i("INFO","[STARTUP] Auto-Continue is disabled, not starting"),Mt(),e.subscriptions.push(c.workspace.onDidChangeConfiguration(u=>{if(u.affectsConfiguration("aiFeedbackBridge")){let b=k();if(i("DEBUG","Configuration changed",{workspace:c.workspace.name,affectedKeys:["port","autoContinue"].filter(v=>u.affectsConfiguration(`aiFeedbackBridge.${v}`))}),u.affectsConfiguration("aiFeedbackBridge.port")){let v=b.get("port",3737);v!==h&&(i("INFO",`Port change detected: ${h} \u2192 ${v}. Reloading window...`),c.commands.executeCommand("workbench.action.reloadWindow"))}Q(b),u.affectsConfiguration("aiFeedbackBridge.autoContinue")&&(Ve(e,k,V),b.get("autoContinue.enabled",!1)?ke(e):we())}})),We(e);let qe=c.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>Bt(e));e.subscriptions.push(qe);let Qe=c.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>jt());e.subscriptions.push(Qe);let Ye=c.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>Dt());e.subscriptions.push(Ye),i("INFO",`Feedback server started on http://localhost:${h}`)}function $t(e){ue(e,h,V)}function ke(e){F&&clearInterval(F),F=setInterval(()=>{try{let t=k();if(!t.get("autoContinue.enabled",!1)){F&&(clearInterval(F),F=void 0),Q(t);return}let n=Je(e,k);if(n!==null&&n>0){let a=ze(n);Q(t,a)}else Q(t)}catch(t){i("ERROR","Error updating countdown",{error:m(t)})}},1e3)}function we(){F&&(clearInterval(F),F=void 0)}function Mt(){let e=k(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let n=e.inspect("autoApproval.autoInject");if(!!!(n&&(n.workspaceValue||n.workspaceFolderValue))){i("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),i("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}i("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{_($).catch(s=>{i("WARN","Auto-inject setup failed:",m(s))})},1e3)}}function Bt(e){if(T){W.appendLine("Auto-approval is already enabled");return}let o=k().get("autoApproval.intervalMs",2e3);i("INFO",`Enabling auto-approval with ${o}ms interval`),T=setInterval(async()=>{try{await c.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{T&&(clearInterval(T),T=void 0)}}),i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function jt(){T?(clearInterval(T),T=void 0,W.appendLine("Auto-approval disabled"),i("INFO","Auto-approval disabled")):i("INFO","Auto-approval is not currently enabled")}function Dt(){let{getAutoApprovalScript:e}=(ne(),Ce(Be)),t=e($),o=c.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",c.ViewColumn.One,{enableScripts:!0});o.webview.html=Wt(t),c.env.clipboard.writeText(t),i("INFO","Auto-approval script copied to clipboard")}function Wt(e){return`<!DOCTYPE html>
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
</html>`}async function Lt(){te(),i("INFO","HTTP server closed"),fe(),T&&(clearInterval(T),T=void 0,i("INFO","Auto-approval interval cleared")),we(),He(),$&&await Oe($,h),i("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
