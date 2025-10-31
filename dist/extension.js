"use strict";var ze=Object.create;var q=Object.defineProperty;var Ge=Object.getOwnPropertyDescriptor;var Ke=Object.getOwnPropertyNames;var _e=Object.getPrototypeOf,qe=Object.prototype.hasOwnProperty;var ae=(e,t)=>()=>(e&&(t=e(e=0)),t);var se=(e,t)=>{for(var o in t)q(e,o,{get:t[o],enumerable:!0})},be=(e,t,o,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Ke(t))!qe.call(e,n)&&n!==o&&q(e,n,{get:()=>t[n],enumerable:!(a=Ge(t,n))||a.enumerable});return e};var S=(e,t,o)=>(o=e!=null?ze(_e(e)):{},be(t||!e||!e.__esModule?q(o,"default",{value:e,enumerable:!0}):o,e)),ke=e=>be(q({},"__esModule",{value:!0}),e);var A=ae(()=>{"use strict"});function fe(e){ie=e}function i(e,t,o){let n=`[${new Date().toISOString()}] [${e}]`,s=o?`${n} ${t} ${JSON.stringify(o)}`:`${n} ${t}`;ie&&ie.appendLine(s),e==="ERROR"?console.error(s):e==="WARN"?console.warn(s):console.log(s)}function m(e){return e instanceof Error?e.message:String(e)}var ie,N=ae(()=>{"use strict";A()});var Re={};se(Re,{autoInjectScript:()=>G,getAutoApprovalScript:()=>Oe});async function G(e){try{let t=Oe(e);await Z.env.clipboard.writeText(t),i("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await Z.commands.executeCommand("workbench.action.toggleDevTools"),i("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(o){i("WARN","Could not toggle Developer Tools",m(o))}}catch(t){i("ERROR","Failed to copy script",m(t))}}function Oe(e){try{let t=Pe.join(e.extensionPath,"scripts","auto-approval-script.js");return Ee.readFileSync(t,"utf8")}catch(t){return i("ERROR","Failed to read auto-approval-script.js",m(t)),"// Error: Could not load auto-approval script"}}var Z,Ee,Pe,ee=ae(()=>{"use strict";Z=S(require("vscode")),Ee=S(require("fs")),Pe=S(require("path"));N();A()});var Ot={};se(Ot,{activate:()=>Ct,deactivate:()=>Pt});module.exports=ke(Ot);var c=S(require("vscode"));A();N();async function v(e){return e.workspaceState.get("tasks",[])}async function J(e,t){await e.workspaceState.update("tasks",t)}async function z(e,t,o="",a="other"){let n=await v(e),s={id:Date.now().toString(),title:t,description:o,status:"pending",category:a,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return n.push(s),await J(e,n),s}async function F(e,t,o){let a=await v(e),n=a.find(s=>s.id===t);n&&(n.status=o,n.updatedAt=new Date().toISOString(),await J(e,a))}async function Q(e,t){let a=(await v(e)).filter(n=>n.id!==t);await J(e,a)}async function we(e){let t=await v(e),o=t.filter(n=>n.status!=="completed"),a=t.length-o.length;return await J(e,o),a}var Y=S(require("vscode")),ye=S(require("http"));N();A();var Ce="aiFeedbackBridge.portRegistry",he=3737,Qe=50;async function xe(e){return e.globalState.get(Ce,[])}async function ce(e,t){await e.globalState.update(Ce,t)}async function Se(e){let t=await xe(e),o=Y.workspace.name||"No Workspace",a=Y.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=Date.now()-60*60*1e3,s=t.filter(l=>l.timestamp>n),r=s.find(l=>l.workspace===a);if(r)return i("INFO",`Reusing existing port ${r.port} for workspace`),r.timestamp=Date.now(),await ce(e,s),r.port;let g=new Set(s.map(l=>l.port)),u=he;for(let l=0;l<Qe;l++){let C=he+l;if(!g.has(C)&&await Ye(C)){u=C;break}}return s.push({port:u,workspace:a,timestamp:Date.now()}),await ce(e,s),i("INFO",`Auto-assigned port ${u} for workspace: ${o}`),u}async function Ye(e){return new Promise(t=>{let o=ye.createServer();o.once("error",a=>{a.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function Ie(e,t){let o=await xe(e),a=Y.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",n=o.filter(s=>!(s.port===t&&s.workspace===a));await ce(e,n),i("INFO",`Released port ${t}`)}var pe={};se(pe,{startServer:()=>de,stopServer:()=>X});var Te=S(require("vscode")),Ae=S(require("http"));N();A();var D;function de(e,t,o){return D=Ae.createServer(async(a,n)=>{if(n.setHeader("Access-Control-Allow-Origin","*"),n.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS"),n.setHeader("Access-Control-Allow-Headers","Content-Type"),a.method==="OPTIONS"){n.writeHead(200),n.end();return}try{await Ze(a,n,e,t,o)}catch(s){i("ERROR","Request handler error",m(s)),n.writeHead(500,{"Content-Type":"application/json"}),n.end(JSON.stringify({error:"Internal server error"}))}}),D.listen(t,()=>{i("INFO",`\u2705 Server listening on port ${t}`)}),D.on("error",a=>{a.code==="EADDRINUSE"?i("ERROR",`Port ${t} is already in use. Please change the port in settings.`):i("ERROR","Server error occurred",{error:a.message,code:a.code})}),e.subscriptions.push({dispose:()=>{X()}}),D}function X(){D&&(i("INFO","Closing server"),D.close(),D=void 0)}async function Ze(e,t,o,a,n){let s=e.url||"/",r=e.method||"GET";i("DEBUG",`${r} ${s}`),s==="/help"||s==="/"?et(t,a):s==="/tasks"&&r==="GET"?await tt(t,o):s==="/tasks"&&r==="POST"?await ot(e,t,o):s.startsWith("/tasks/")&&r==="PUT"?await nt(e,t,o,s):s.startsWith("/tasks/")&&r==="DELETE"?await at(t,o,s):s==="/feedback"&&r==="POST"?await st(e,t,n):s==="/restart-app"||s.startsWith("/restart-app?")?await it(e,t):(t.writeHead(404,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Not found",message:`Unknown endpoint: ${r} ${s}`})))}function et(e,t){let o=`
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
`;e.writeHead(200,{"Content-Type":"text/plain"}),e.end(o)}async function tt(e,t){try{let o=await v(t);e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify(o,null,2))}catch(o){i("ERROR","Failed to get tasks",m(o)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to retrieve tasks"}))}}async function ot(e,t,o){let a=await le(e);try{let n=JSON.parse(a);if(!n.title||typeof n.title!="string"){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Missing or invalid "title" field'}));return}let s=n.title.trim(),r=(n.description||"").trim(),g=n.category||"other",u=await z(o,s,r,g);i("INFO","Task created via API",{taskId:u.id,title:u.title}),t.writeHead(201,{"Content-Type":"application/json"}),t.end(JSON.stringify(u,null,2))}catch(n){n instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to create task",m(n)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to create task"})))}}async function nt(e,t,o,a){let n=a.split("/")[2],s=await le(e);try{let r=JSON.parse(s);if(!r.status||!["pending","in-progress","completed"].includes(r.status)){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Invalid or missing "status" field',valid:["pending","in-progress","completed"]}));return}await F(o,n,r.status),i("INFO","Task updated via API",{taskId:n,status:r.status}),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,taskId:n,status:r.status}))}catch(r){r instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to update task",m(r)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to update task"})))}}async function at(e,t,o){let a=o.split("/")[2];try{await Q(t,a),i("INFO","Task deleted via API",{taskId:a}),e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify({success:!0,taskId:a}))}catch(n){i("ERROR","Failed to delete task",m(n)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to delete task"}))}}async function st(e,t,o){let a=await le(e,1048576);try{let n=JSON.parse(a);if(!n||typeof n!="object")throw new Error("Invalid feedback structure: must be an object");if(!n.message||typeof n.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let s=n.message.trim();if(s.length===0)throw new Error("Invalid feedback: message cannot be empty");if(s.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");i("INFO","Received feedback",{messageLength:s.length,hasContext:!!n.context});let r=await o(s,n.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:r,message:r?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(n){let s=m(n);i("ERROR","Error processing feedback",{error:s}),n instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:s})))}}async function it(e,t){let o=(e.url||"").split("?"),a=new URLSearchParams(o[1]||""),n=parseInt(a.get("delay")||"30",10);i("INFO",`Received restart request for Electron app (delay: ${n}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${n}s)`,delay:n})),setTimeout(async()=>{try{let{exec:s}=require("child_process"),{promisify:r}=require("util"),g=r(s);i("INFO","Killing Electron process...");try{await g('pkill -f "electron.*Code/AI"')}catch{i("INFO","Kill command completed (process may not have been running)")}i("INFO",`Waiting ${n} seconds before restart...`),await new Promise(l=>setTimeout(l,n*1e3));let u=Te.workspace.workspaceFolders?.[0]?.uri.fsPath;u&&u.includes("/AI")?(i("INFO",`Restarting Electron app in: ${u}`),s(`cd "${u}" && npm run dev > /dev/null 2>&1 &`),i("INFO","Electron app restart command sent")):i("WARN",`Could not find workspace path: ${u}`)}catch(s){i("ERROR","Restart error",m(s))}},100)}async function le(e,t=10*1024){return new Promise((o,a)=>{let n="",s=0;e.on("data",r=>{if(s+=r.length,s>t){a(new Error(`Request body too large (max ${t} bytes)`)),e.destroy();return}n+=r.toString()}),e.on("end",()=>{o(n)}),e.on("error",r=>{a(r)})})}ee();var h=S(require("vscode"));A();N();ee();var W;async function Ne(e,t,o,a,n,s){if(W){W.reveal(h.ViewColumn.One);let l=await v(e);W.webview.html=await E(o(),t,l);return}let r=h.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",h.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});W=r,r.onDidDispose(()=>{W=void 0},null,e.subscriptions);let g=o(),u=await v(e);r.webview.html=await E(g,t,u),r.webview.onDidReceiveMessage(async l=>{await rt(l,r,e,t,o,a,n,s)},void 0,e.subscriptions)}async function rt(e,t,o,a,n,s,r,g){switch(e.command){case"updateSetting":await s(e.key,e.value),i("INFO",`Setting updated: ${e.key} = ${e.value}`);break;case"reload":let u=await v(o);t.webview.html=await E(n(),a,u);break;case"runNow":await ct(o,r,g);break;case"injectScript":G(o);break;case"sendInstructions":await dt(a,r);break;case"saveNewTask":await lt(e,t,o,a,n);break;case"updateTaskField":await pt(e,t,o,a,n);break;case"updateTaskStatus":await ut(e,t,o,a,n);break;case"createTask":await gt(t,o,a,n);break;case"openTaskManager":await h.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":await mt(t,o,a,n);break}}async function ct(e,t,o){try{let a=await o(e,!0);a?(await t(a,{source:"manual_trigger",timestamp:new Date().toISOString()}),i("INFO","[Run Now] Manually triggered all enabled reminders")):h.window.showInformationMessage("No enabled categories (check settings)")}catch(a){i("ERROR","[Run Now] Failed to send message",{error:m(a)}),h.window.showErrorMessage("Failed to send reminders")}}async function dt(e,t){try{let o="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+e+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+e+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+e+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+e+"/help";await t(o,{source:"instructions",timestamp:new Date().toISOString()})}catch{h.window.showErrorMessage("Failed to send instructions")}}async function lt(e,t,o,a,n){try{await z(o,e.title,e.description,e.category);let s=await v(o);t.webview.html=await E(n(),a,s)}catch(s){h.window.showErrorMessage(`Failed to create task: ${m(s)}`)}}async function pt(e,t,o,a,n){try{let s=await v(o),r=s.find(g=>g.id===e.taskId);if(r){e.field==="title"?r.title=e.value:e.field==="description"&&(r.description=e.value),r.updatedAt=new Date().toISOString(),await J(o,s);let g=await v(o);t.webview.html=await E(n(),a,g)}}catch(s){h.window.showErrorMessage(`Failed to update task: ${m(s)}`)}}async function ut(e,t,o,a,n){try{await F(o,e.taskId,e.status);let s=await v(o);t.webview.html=await E(n(),a,s)}catch(s){h.window.showErrorMessage(`Failed to update status: ${m(s)}`)}}async function gt(e,t,o,a){await h.commands.executeCommand("ai-feedback-bridge.addTask");let n=await v(t);e.webview.html=await E(a(),o,n)}async function mt(e,t,o,a){try{let n=await we(t),s=await v(t);e.webview.html=await E(a(),o,s),i("DEBUG",`Cleared ${n} completed tasks`)}catch(n){h.window.showErrorMessage(`Failed to clear completed tasks: ${m(n)}`)}}async function E(e,t,o){let a=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],n=e.get("autoContinue.enabled",!1),s=e.get("autoApproval.enabled",!0),r=e.get("autoApproval.autoInject",!1),g="";for(let d of a){let T=e.get(`autoContinue.${d.key}.enabled`,!0),R=e.get(`autoContinue.${d.key}.interval`,d.interval),B=e.get(`autoContinue.${d.key}.message`,"");g+=`
			<tr class="${T?"":"disabled"}">
				<td class="cat-icon">${d.icon}</td>
				<td class="cat-name">${d.name}</td>
				<td class="cat-message">
					<input type="text" value="${B}" data-key="autoContinue.${d.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${T?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${R}" data-key="autoContinue.${d.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${T?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${d.key}.enabled" ${T?"checked":""} 
					       class="toggle-cb" id="cb-${d.key}" data-auto-approved="skip">
					<label for="cb-${d.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`}let u=o.filter(d=>d.status!=="completed").reverse(),l=o.filter(d=>d.status==="completed").length,C=u.length===0?`
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
				${u.map(d=>{let T=d.status==="pending"?"\u23F3":d.status==="in-progress"?"\u{1F504}":"\u2705",R=d.status==="pending"?"Pending":d.status==="in-progress"?"In Progress":"Completed",B=d.status==="pending"?"#cca700":d.status==="in-progress"?"#3794ff":"#89d185";return`
					<tr>
						<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${d.id}', '${d.status}')" title="Click to cycle status">${T}</td>
						<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${d.id}', 'title')">${d.title}</td>
						<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${d.id}', 'description')">${d.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
						<td style="font-size: 12px; opacity: 0.7;">${d.category}</td>
						<td style="color: ${B}; font-size: 12px;">${R}</td>
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
		${vt()}
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
				${g}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${C}
	</div>
	
	<script>
		${bt()}
	</script>
</body>
</html>`}function vt(){return`
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
	`}function bt(){return`
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
	`}async function te(e,t,o){if(W){let a=await v(e);W.webview.html=await E(t(),o,a),i("DEBUG","Settings panel refreshed")}}var k=S(require("vscode"));A();N();var L,$;function Fe(e){$=e}function $e(e){return L=k.chat.createChatParticipant("ai-agent-feedback-bridge.agent",ft),L.iconPath=k.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(L),i("INFO","Chat participant registered"),L}async function ft(e,t,o,a){$.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[s]=await k.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let r=[k.LanguageModelChatMessage.User(e.prompt)],g=await s.sendRequest(r,{},a);for await(let u of g.text)o.markdown(u)}}catch(s){s instanceof k.LanguageModelError&&($.appendLine(`Language model error: ${s.message}`),o.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}function wt(e,t){let o=t||{source:"unknown",timestamp:new Date().toISOString()},a=`# \u{1F916} AI DEV MODE

`;return a+=`**User Feedback:**
${e}

`,Object.keys(o).filter(s=>s!=="source"&&s!=="timestamp").length>0&&(a+=`**Context:**
\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),a+=`**Instructions:**
`,a+=`Analyze feedback, take appropriate action:
`,a+=`\u2022 If a bug \u2192 find and fix root cause
`,a+=`\u2022 If a feature \u2192 draft implementation plan
`,a+=`\u2022 Apply and commit changes
`,a}async function H(e,t){try{let o=wt(e,t);$.appendLine("Processing feedback through AI agent..."),$.appendLine(o);try{let[a]=await k.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(a)return $.appendLine("\u2705 AI Agent processing request..."),await k.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await k.commands.executeCommand("workbench.action.chat.submit")}catch{$.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),i("INFO","Feedback sent to AI Agent"),!0}catch(a){$.appendLine(`Could not access language model: ${m(a)}`)}return await k.env.clipboard.writeText(o),i("INFO","Feedback copied to clipboard"),!0}catch(o){return i("ERROR",`Error sending to agent: ${m(o)}`),!1}}async function Me(e,t){return H(e,t)}function Be(){L&&(L.dispose(),L=void 0,i("INFO","Chat participant disposed"))}var je=S(require("vscode"));A();N();var V;async function oe(e,t,o=!1){let a=t(),n=["tasks","improvements","coverage","robustness","cleanup","commits"],s=Date.now(),r=[],g="autoContinue.lastSent",u=e.globalState.get(g,{}),l={...u};for(let C of n){let d=a.get(`autoContinue.${C}.enabled`,!0),T=a.get(`autoContinue.${C}.interval`,300),R=a.get(`autoContinue.${C}.message`,"");if(!d||!R)continue;let B=u[C]||0,ne=(s-B)/1e3;(o||ne>=T)&&(r.push(R),l[C]=s)}return await e.globalState.update(g,l),r.length===0?"":r.join(". ")+"."}function ue(e,t,o){if(t().get("autoContinue.enabled",!1)){let r=je.workspace.name||"No Workspace";i("INFO",`\u2705 Auto-Continue enabled for window: ${r}`),V=setInterval(async()=>{try{if(!t().get("autoContinue.enabled",!1)){i("INFO","[Auto-Continue] Detected disabled state, stopping timer"),V&&(clearInterval(V),V=void 0);return}let l=await oe(e,t);l&&(i("INFO","[Auto-Continue] Sending periodic reminder"),await o(l,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(g){i("ERROR","[Auto-Continue] Failed to send message",{error:m(g)})}},500)}else i("DEBUG","Auto-Continue is disabled")}function ge(){V&&(clearInterval(V),V=void 0,i("INFO","Auto-Continue timer stopped"))}function De(e,t,o){ge(),ue(e,t,o)}var M,P,U,K,f=3737,I,O;function y(){return c.workspace.getConfiguration("aiFeedbackBridge")}async function me(e,t){let o=y();await o.update(e,t,c.ConfigurationTarget.Workspace),i("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}async function Ct(e){O=e,M=c.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(M),fe(M),Fe(M),i("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=y(),o=c.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(i("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,c.ConfigurationTarget.Global));let n=t.get("port");f=await Se(e),i("INFO",`Auto-selected port: ${f} for this window`);let s=c.workspace.name||"No Workspace",r=c.workspace.workspaceFolders?.length||0;i("INFO",`Window context: ${s} (${r} folders)`),U=c.window.createStatusBarItem(c.StatusBarAlignment.Right,100),U.command="ai-feedback-bridge.openSettings",U.show(),e.subscriptions.push(U),P=c.window.createStatusBarItem(c.StatusBarAlignment.Right,99),P.command="ai-feedback-bridge.toggleAutoContinue",P.show(),e.subscriptions.push(P),K=c.window.createStatusBarItem(c.StatusBarAlignment.Right,98),K.command="ai-feedback-bridge.injectScript",K.text="$(clippy) Inject",K.tooltip="Copy auto-approval script to clipboard",K.show(),e.subscriptions.push(K),We(t);let g=c.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{Ne(e,f,y,me,H,(p,w)=>oe(p,y,w))});e.subscriptions.push(g);let u=c.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let p=await oe(e,y,!0);p?(i("INFO","[Run Now] Manually triggered all enabled reminders"),await H(p,{source:"manual_trigger",timestamp:new Date().toISOString()})):c.window.showInformationMessage("No enabled categories (check settings)")}catch(p){i("ERROR","[Run Now] Failed to send message",{error:p}),c.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(u);let l=c.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{G(O)});e.subscriptions.push(l);let C=c.commands.registerCommand("ai-feedback-bridge.getPort",()=>f);e.subscriptions.push(C);let d=c.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let p=await c.window.showInputBox({prompt:"Task title"});if(!p)return;let w=await c.window.showInputBox({prompt:"Task description (optional)"}),b=await c.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await z(e,p,w||"",b||"other"),await te(O,y,f)});e.subscriptions.push(d);let T=c.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let p=await v(e);if(p.length===0){c.window.showInformationMessage("No tasks found");return}let w=p.map(x=>({label:`${x.status==="completed"?"\u2705":x.status==="in-progress"?"\u{1F504}":"\u23F3"} ${x.title}`,description:x.description,task:x})),b=await c.window.showQuickPick(w,{placeHolder:"Select a task to update"});if(b){let x=await c.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});x==="Delete"?await Q(e,b.task.id):x==="Mark as In Progress"?await F(e,b.task.id,"in-progress"):x==="Mark as Completed"?await F(e,b.task.id,"completed"):x==="Mark as Pending"&&await F(e,b.task.id,"pending"),await te(O,y,f)}});e.subscriptions.push(T),xt(e);let R=c.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async p=>{p||(p=await c.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),p&&await Me(p,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(R);let B=c.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let w=y().get("autoContinue.enabled",!1);await me("autoContinue.enabled",!w),i("INFO",`Auto-Continue ${w?"disabled":"enabled"}`),te(O,y,f)});e.subscriptions.push(B);let ne=c.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let p=await c.window.showInputBox({prompt:"Enter new port number",value:f.toString(),validateInput:w=>{let b=parseInt(w);return isNaN(b)||b<1024||b>65535?"Invalid port (1024-65535)":null}});p&&(await me("port",parseInt(p)),i("INFO",`Port changed to ${p}. Reloading VS Code...`),c.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(ne);let Le=c.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let p=y(),w=p.get("autoContinue.interval",300),b=p.get("autoContinue.enabled",!1),Je=`\u{1F309} AI Feedback Bridge Status

Window: ${c.workspace.name||"No Workspace"}
Port: ${f}
Server: ${pe?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${b?`Enabled \u2705 (every ${w}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${f}`;M.appendLine(Je),M.show()});e.subscriptions.push(Le);let ve=t.get("autoContinue.enabled",!1),_=t.inspect("autoContinue.enabled");i("INFO","[STARTUP] Auto-Continue check:",{enabled:ve,defaultValue:_?.defaultValue,globalValue:_?.globalValue,workspaceValue:_?.workspaceValue,workspaceFolderValue:_?.workspaceFolderValue}),ve?ue(e,y,H):i("INFO","[STARTUP] Auto-Continue is disabled, not starting"),St(),e.subscriptions.push(c.workspace.onDidChangeConfiguration(p=>{if(p.affectsConfiguration("aiFeedbackBridge")){let w=y();if(i("DEBUG","Configuration changed",{workspace:c.workspace.name,affectedKeys:["port","autoContinue"].filter(b=>p.affectsConfiguration(`aiFeedbackBridge.${b}`))}),p.affectsConfiguration("aiFeedbackBridge.port")){let b=w.get("port",3737);b!==f&&(i("INFO",`Port change detected: ${f} \u2192 ${b}. Reloading window...`),c.commands.executeCommand("workbench.action.reloadWindow"))}We(w),p.affectsConfiguration("aiFeedbackBridge.autoContinue")&&De(e,y,H)}})),$e(e);let He=c.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>It(e));e.subscriptions.push(He);let Ve=c.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>Tt());e.subscriptions.push(Ve);let Ue=c.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>At());e.subscriptions.push(Ue),i("INFO",`Feedback server started on http://localhost:${f}`)}function We(e){if(!P||!U)return;let t=e.get("autoContinue.enabled",!1);U.text=`AI Dev: ${f}`,U.tooltip="Click to configure AI Feedback Bridge",t?(P.text="$(sync~spin) Stop AI Dev",P.tooltip=`Auto-Continue active
Click to stop`):(P.text="$(play) Start AI Dev",P.tooltip=`Auto-Continue inactive
Click to start`)}function xt(e){de(e,f,H)}function St(){let e=y(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let a=e.inspect("autoApproval.autoInject");if(!!!(a&&(a.workspaceValue||a.workspaceFolderValue))){i("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),i("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}i("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{G(O).catch(s=>{i("WARN","Auto-inject setup failed:",m(s))})},1e3)}}function It(e){if(I){M.appendLine("Auto-approval is already enabled");return}let o=y().get("autoApproval.intervalMs",2e3);i("INFO",`Enabling auto-approval with ${o}ms interval`),I=setInterval(async()=>{try{await c.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{I&&(clearInterval(I),I=void 0)}}),i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function Tt(){I?(clearInterval(I),I=void 0,M.appendLine("Auto-approval disabled"),i("INFO","Auto-approval disabled")):i("INFO","Auto-approval is not currently enabled")}function At(){let{getAutoApprovalScript:e}=(ee(),ke(Re)),t=e(O),o=c.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",c.ViewColumn.One,{enableScripts:!0});o.webview.html=Et(t),c.env.clipboard.writeText(t),i("INFO","Auto-approval script copied to clipboard")}function Et(e){return`<!DOCTYPE html>
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
</html>`}async function Pt(){X(),i("INFO","HTTP server closed"),ge(),I&&(clearInterval(I),I=void 0,i("INFO","Auto-approval interval cleared")),Be(),O&&await Ie(O,f),i("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
