"use strict";var Ne=Object.create;var J=Object.defineProperty;var $e=Object.getOwnPropertyDescriptor;var Me=Object.getOwnPropertyNames;var Be=Object.getPrototypeOf,je=Object.prototype.hasOwnProperty;var Q=(e,t)=>()=>(e&&(t=e(e=0)),t);var Y=(e,t)=>{for(var a in t)J(e,a,{get:t[a],enumerable:!0})},de=(e,t,a,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of Me(t))!je.call(e,o)&&o!==a&&J(e,o,{get:()=>t[o],enumerable:!(r=$e(t,o))||r.enumerable});return e};var E=(e,t,a)=>(a=e!=null?Ne(Be(e)):{},de(t||!e||!e.__esModule?J(a,"default",{value:e,enumerable:!0}):a,e)),le=e=>de(J({},"__esModule",{value:!0}),e);var $=Q(()=>{"use strict"});function pe(e){X=e}function i(e,t,a){let o=`[${new Date().toISOString()}] [${e}]`,n=a?`${o} ${t} ${JSON.stringify(a)}`:`${o} ${t}`;X&&X.appendLine(n),e==="ERROR"?console.error(n):e==="WARN"?console.warn(n):console.log(n)}function v(e){return e instanceof Error?e.message:String(e)}var X,D=Q(()=>{"use strict";$()});var Se={};Y(Se,{autoInjectScript:()=>W,getAutoApprovalScript:()=>xe});async function W(e){try{let t=xe(e);await _.env.clipboard.writeText(t),i("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await _.commands.executeCommand("workbench.action.toggleDevTools"),i("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(a){i("WARN","Could not toggle Developer Tools",v(a))}}catch(t){i("ERROR","Failed to copy script",v(t))}}function xe(e){try{let t=Ce.join(e.extensionPath,"scripts","auto-approval-script.js");return ye.readFileSync(t,"utf8")}catch(t){return i("ERROR","Failed to read auto-approval-script.js",v(t)),"// Error: Could not load auto-approval script"}}var _,ye,Ce,ae=Q(()=>{"use strict";_=E(require("vscode")),ye=E(require("fs")),Ce=E(require("path"));D();$()});var rt={};Y(rt,{activate:()=>Qe,deactivate:()=>it});module.exports=le(rt);var s=E(require("vscode"));$();D();async function f(e){return e.workspaceState.get("tasks",[])}async function H(e,t){await e.workspaceState.update("tasks",t)}async function L(e,t,a="",r="other"){let o=await f(e),n={id:Date.now().toString(),title:t,description:a,status:"pending",category:r,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return o.push(n),await H(e,o),n}async function O(e,t,a){let r=await f(e),o=r.find(n=>n.id===t);o&&(o.status=a,o.updatedAt=new Date().toISOString(),await H(e,r))}async function V(e,t){let r=(await f(e)).filter(o=>o.id!==t);await H(e,r)}var G=E(require("vscode")),me=E(require("http"));D();$();var ve="aiFeedbackBridge.portRegistry",ge=3737,De=50;async function be(e){return e.globalState.get(ve,[])}async function Z(e,t){await e.globalState.update(ve,t)}async function ke(e){let t=await be(e),a=G.workspace.name||"No Workspace",r=G.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",o=Date.now()-60*60*1e3,n=t.filter(p=>p.timestamp>o),c=n.find(p=>p.workspace===r);if(c)return i("INFO",`Reusing existing port ${c.port} for workspace`),c.timestamp=Date.now(),await Z(e,n),c.port;let l=new Set(n.map(p=>p.port)),d=ge;for(let p=0;p<De;p++){let u=ge+p;if(!l.has(u)&&await He(u)){d=u;break}}return n.push({port:d,workspace:r,timestamp:Date.now()}),await Z(e,n),i("INFO",`Auto-assigned port ${d} for workspace: ${a}`),d}async function He(e){return new Promise(t=>{let a=me.createServer();a.once("error",r=>{r.code==="EADDRINUSE"?t(!1):t(!0)}),a.once("listening",()=>{a.close(),t(!0)}),a.listen(e)})}async function fe(e,t){let a=await be(e),r=G.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",o=a.filter(n=>!(n.port===t&&n.workspace===r));await Z(e,o),i("INFO",`Released port ${t}`)}var oe={};Y(oe,{startServer:()=>ee,stopServer:()=>K});var we=E(require("vscode")),he=E(require("http"));D();$();var P;function ee(e,t,a){return P=he.createServer(async(r,o)=>{if(o.setHeader("Access-Control-Allow-Origin","*"),o.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS"),o.setHeader("Access-Control-Allow-Headers","Content-Type"),r.method==="OPTIONS"){o.writeHead(200),o.end();return}try{await Ve(r,o,e,t,a)}catch(n){i("ERROR","Request handler error",v(n)),o.writeHead(500,{"Content-Type":"application/json"}),o.end(JSON.stringify({error:"Internal server error"}))}}),P.listen(t,()=>{i("INFO",`\u2705 Server listening on port ${t}`)}),P.on("error",r=>{r.code==="EADDRINUSE"?i("ERROR",`Port ${t} is already in use. Please change the port in settings.`):i("ERROR","Server error occurred",{error:r.message,code:r.code})}),e.subscriptions.push({dispose:()=>{K()}}),P}function K(){P&&(i("INFO","Closing server"),P.close(),P=void 0)}async function Ve(e,t,a,r,o){let n=e.url||"/",c=e.method||"GET";i("DEBUG",`${c} ${n}`),n==="/help"||n==="/"?We(t,r):n==="/tasks"&&c==="GET"?await Ue(t,a):n==="/tasks"&&c==="POST"?await Je(e,t,a):n.startsWith("/tasks/")&&c==="PUT"?await ze(e,t,a,n):n.startsWith("/tasks/")&&c==="DELETE"?await Ge(t,a,n):n==="/feedback"&&c==="POST"?await Ke(e,t,o):n==="/restart-app"||n.startsWith("/restart-app?")?await _e(e,t):(t.writeHead(404,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Not found",message:`Unknown endpoint: ${c} ${n}`})))}function We(e,t){let a=`
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
`;e.writeHead(200,{"Content-Type":"text/plain"}),e.end(a)}async function Ue(e,t){try{let a=await f(t);e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify(a,null,2))}catch(a){i("ERROR","Failed to get tasks",v(a)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to retrieve tasks"}))}}async function Je(e,t,a){let r=await te(e);try{let o=JSON.parse(r);if(!o.title||typeof o.title!="string"){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Missing or invalid "title" field'}));return}let n=o.title.trim(),c=(o.description||"").trim(),l=o.category||"other",d=await L(a,n,c,l);i("INFO","Task created via API",{taskId:d.id,title:d.title}),t.writeHead(201,{"Content-Type":"application/json"}),t.end(JSON.stringify(d,null,2))}catch(o){o instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to create task",v(o)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to create task"})))}}async function ze(e,t,a,r){let o=r.split("/")[2],n=await te(e);try{let c=JSON.parse(n);if(!c.status||!["pending","in-progress","completed"].includes(c.status)){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Invalid or missing "status" field',valid:["pending","in-progress","completed"]}));return}await O(a,o,c.status),i("INFO","Task updated via API",{taskId:o,status:c.status}),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,taskId:o,status:c.status}))}catch(c){c instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(i("ERROR","Failed to update task",v(c)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to update task"})))}}async function Ge(e,t,a){let r=a.split("/")[2];try{await V(t,r),i("INFO","Task deleted via API",{taskId:r}),e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify({success:!0,taskId:r}))}catch(o){i("ERROR","Failed to delete task",v(o)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to delete task"}))}}async function Ke(e,t,a){let r=await te(e,1048576);try{let o=JSON.parse(r);if(!o||typeof o!="object")throw new Error("Invalid feedback structure: must be an object");if(!o.message||typeof o.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let n=o.message.trim();if(n.length===0)throw new Error("Invalid feedback: message cannot be empty");if(n.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");i("INFO","Received feedback",{messageLength:n.length,hasContext:!!o.context});let c=await a(n,o.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:c,message:c?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(o){let n=v(o);i("ERROR","Error processing feedback",{error:n}),o instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:n})))}}async function _e(e,t){let a=(e.url||"").split("?"),r=new URLSearchParams(a[1]||""),o=parseInt(r.get("delay")||"30",10);i("INFO",`Received restart request for Electron app (delay: ${o}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${o}s)`,delay:o})),setTimeout(async()=>{try{let{exec:n}=require("child_process"),{promisify:c}=require("util"),l=c(n);i("INFO","Killing Electron process...");try{await l('pkill -f "electron.*Code/AI"')}catch{i("INFO","Kill command completed (process may not have been running)")}i("INFO",`Waiting ${o} seconds before restart...`),await new Promise(p=>setTimeout(p,o*1e3));let d=we.workspace.workspaceFolders?.[0]?.uri.fsPath;d&&d.includes("/AI")?(i("INFO",`Restarting Electron app in: ${d}`),n(`cd "${d}" && npm run dev > /dev/null 2>&1 &`),i("INFO","Electron app restart command sent")):i("WARN",`Could not find workspace path: ${d}`)}catch(n){i("ERROR","Restart error",v(n))}},100)}async function te(e,t=10*1024){return new Promise((a,r)=>{let o="",n=0;e.on("data",c=>{if(n+=c.length,n>t){r(new Error(`Request body too large (max ${t} bytes)`)),e.destroy();return}o+=c.toString()}),e.on("end",()=>{a(o)}),e.on("error",c=>{r(c)})})}ae();var w,ne,I,F,M,x,m=3737,C,T,R;function b(){return s.workspace.getConfiguration("aiFeedbackBridge")}async function ie(e,t){let a=b();await a.update(e,t,s.ConfigurationTarget.Workspace),i("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:a.get(e)})}async function se(){if(R&&T){let e=await f(T);R.webview.html=await S(b(),m,e),i("DEBUG","Settings panel refreshed")}}async function qe(e){if(R){R.reveal(s.ViewColumn.One);let o=await f(e);R.webview.html=await S(b(),m,o);return}let t=s.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",s.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});R=t,t.onDidDispose(()=>{R=void 0},null,e.subscriptions);let a=b(),r=await f(e);t.webview.html=await S(a,m,r),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"updateSetting":await ie(o.key,o.value),i("INFO",`Setting updated: ${o.key} = ${o.value}`);break;case"reload":let n=await f(e);t.webview.html=await S(b(),m,n);break;case"runNow":try{let l=await re(e,!0);l?(await B(l,{source:"manual_trigger",timestamp:new Date().toISOString()}),i("INFO","[Run Now] Manually triggered all enabled reminders")):s.window.showInformationMessage("No enabled categories (check settings)")}catch(l){i("ERROR","[Run Now] Failed to send message",{error:v(l)}),s.window.showErrorMessage("Failed to send reminders")}break;case"injectScript":W(T);break;case"sendInstructions":try{let l="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+m+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+m+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+m+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+m+"/help";await B(l,{source:"instructions",timestamp:new Date().toISOString()})}catch{s.window.showErrorMessage("Failed to send instructions")}break;case"saveNewTask":try{let l=await L(e,o.title,o.description,o.category),d=await f(e);t.webview.html=await S(b(),m,d)}catch(l){s.window.showErrorMessage(`Failed to create task: ${v(l)}`)}break;case"updateTaskField":try{let l=await f(e),d=l.find(p=>p.id===o.taskId);if(d){o.field==="title"?d.title=o.value:o.field==="description"&&(d.description=o.value),d.updatedAt=new Date().toISOString(),await H(e,l);let p=await f(e);t.webview.html=await S(b(),m,p)}}catch(l){s.window.showErrorMessage(`Failed to update task: ${v(l)}`)}break;case"updateTaskStatus":try{await O(e,o.taskId,o.status);let l=await f(e);t.webview.html=await S(b(),m,l)}catch(l){s.window.showErrorMessage(`Failed to update status: ${v(l)}`)}break;case"createTask":await s.commands.executeCommand("ai-feedback-bridge.addTask");let c=await f(e);t.webview.html=await S(b(),m,c);break;case"openTaskManager":await s.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":try{let d=(await f(e)).filter(u=>u.status==="completed");for(let u of d)await V(e,u.id);let p=await f(e);t.webview.html=await S(b(),m,p)}catch(l){s.window.showErrorMessage(`Failed to clear completed tasks: ${v(l)}`)}break}},void 0,e.subscriptions)}async function S(e,t,a){let r=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],o=e.get("autoContinue.enabled",!1),n=e.get("autoApproval.enabled",!0),c=e.get("autoApproval.autoInject",!1),l="";for(let d of r){let p=e.get(`autoContinue.${d.key}.enabled`,!0),u=e.get(`autoContinue.${d.key}.interval`,d.interval),A=e.get(`autoContinue.${d.key}.message`,"");l+=`
			<tr class="${p?"":"disabled"}">
				<td class="cat-icon">${d.icon}</td>
				<td class="cat-name">${d.name}</td>
				<td class="cat-message">
					<input type="text" value="${A}" data-key="autoContinue.${d.key}.message" 
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
				<input type="checkbox" data-key="autoContinue.enabled" ${o?"checked":""} 
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
				${l}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${(()=>{let d=a.filter(u=>u.status!=="completed").reverse(),p=a.filter(u=>u.status==="completed").length;return d.length===0?`
			<div class="row">
				<label style="color: var(--vscode-descriptionForeground); font-style: italic;">No active tasks for this workspace</label>
				<button onclick="createTask()">Add Task</button>
			</div>
			${p>0?`
			<div class="row" style="margin-top: 8px;">
				<label style="font-size: 12px; color: var(--vscode-descriptionForeground);">${p} completed task${p>1?"s":""}</label>
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
					${d.map(u=>{let A=u.status==="pending"?"\u23F3":u.status==="in-progress"?"\u{1F504}":"\u2705",N=u.status==="pending"?"Pending":u.status==="in-progress"?"In Progress":"Completed",j=u.status==="pending"?"#cca700":u.status==="in-progress"?"#3794ff":"#89d185";return`
						<tr>
							<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${u.id}', '${u.status}')" title="Click to cycle status">${A}</td>
							<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${u.id}', 'title')">${u.title}</td>
							<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${u.id}', 'description')">${u.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
							<td style="font-size: 12px; opacity: 0.7;">${u.category}</td>
							<td style="color: ${j}; font-size: 12px;">${N}</td>
						</tr>
					`}).join("")}
				</tbody>
			</table>
			<div class="row" style="margin-top: 8px;">
				<button onclick="createTask()">Add Task</button>
				<button onclick="openTaskManager()">Manage Tasks</button>
				${p>0?`<button onclick="clearCompleted()">Clear Completed (${p})</button>`:""}
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
</html>`}async function Qe(e){T=e,w=s.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(w),pe(w),i("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=b(),a=s.workspace.getConfiguration("aiFeedbackBridge");a.inspect("autoContinue.enabled")?.globalValue!==void 0&&(i("WARN","Detected old Global settings, clearing to use Workspace scope"),await a.update("autoContinue.enabled",void 0,s.ConfigurationTarget.Global));let o=t.get("port");m=await ke(e),i("INFO",`Auto-selected port: ${m} for this window`);let n=s.workspace.name||"No Workspace",c=s.workspace.workspaceFolders?.length||0;i("INFO",`Window context: ${n} (${c} folders)`),F=s.window.createStatusBarItem(s.StatusBarAlignment.Right,100),F.command="ai-feedback-bridge.openSettings",F.show(),e.subscriptions.push(F),I=s.window.createStatusBarItem(s.StatusBarAlignment.Right,99),I.command="ai-feedback-bridge.toggleAutoContinue",I.show(),e.subscriptions.push(I),M=s.window.createStatusBarItem(s.StatusBarAlignment.Right,98),M.command="ai-feedback-bridge.injectScript",M.text="$(clippy) Inject",M.tooltip="Copy auto-approval script to clipboard",M.show(),e.subscriptions.push(M),Ie(t);let l=s.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{qe(e)});e.subscriptions.push(l);let d=s.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let g=await re(e,!0);g?(i("INFO","[Run Now] Manually triggered all enabled reminders"),await B(g,{source:"manual_trigger",timestamp:new Date().toISOString()})):s.window.showInformationMessage("No enabled categories (check settings)")}catch(g){i("ERROR","[Run Now] Failed to send message",{error:g}),s.window.showErrorMessage("Failed to send reminders")}});e.subscriptions.push(d);let p=s.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{W(T)});e.subscriptions.push(p);let u=s.commands.registerCommand("ai-feedback-bridge.getPort",()=>m);e.subscriptions.push(u);let A=s.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let g=await s.window.showInputBox({prompt:"Task title"});if(!g)return;let h=await s.window.showInputBox({prompt:"Task description (optional)"}),k=await s.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await L(e,g,h||"",k||"other"),await se()});e.subscriptions.push(A);let N=s.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let g=await f(e);if(g.length===0){s.window.showInformationMessage("No tasks found");return}let h=g.map(y=>({label:`${y.status==="completed"?"\u2705":y.status==="in-progress"?"\u{1F504}":"\u23F3"} ${y.title}`,description:y.description,task:y})),k=await s.window.showQuickPick(h,{placeHolder:"Select a task to update"});if(k){let y=await s.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});y==="Delete"?await V(e,k.task.id):y==="Mark as In Progress"?await O(e,k.task.id,"in-progress"):y==="Mark as Completed"?await O(e,k.task.id,"completed"):y==="Mark as Pending"&&await O(e,k.task.id,"pending"),await se()}});e.subscriptions.push(N),et(e);let j=s.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async g=>{g||(g=await s.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),g&&await Ze(g,{source:"manual_command",timestamp:new Date().toISOString()})});e.subscriptions.push(j);let q=s.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let h=b().get("autoContinue.enabled",!1);await ie("autoContinue.enabled",!h),i("INFO",`Auto-Continue ${h?"disabled":"enabled"}`),se()});e.subscriptions.push(q);let Ae=s.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let g=await s.window.showInputBox({prompt:"Enter new port number",value:m.toString(),validateInput:h=>{let k=parseInt(h);return isNaN(k)||k<1024||k>65535?"Invalid port (1024-65535)":null}});g&&(await ie("port",parseInt(g)),i("INFO",`Port changed to ${g}. Reloading VS Code...`),s.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(Ae);let Ee=s.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let g=b(),h=g.get("autoContinue.interval",300),k=g.get("autoContinue.enabled",!1),Fe=`\u{1F309} AI Feedback Bridge Status

Window: ${s.workspace.name||"No Workspace"}
Port: ${m}
Server: ${oe?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${k?`Enabled \u2705 (every ${h}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${m}`;w.appendLine(Fe),w.show()});e.subscriptions.push(Ee);let ce=t.get("autoContinue.enabled",!1),U=t.inspect("autoContinue.enabled");i("INFO","[STARTUP] Auto-Continue check:",{enabled:ce,defaultValue:U?.defaultValue,globalValue:U?.globalValue,workspaceValue:U?.workspaceValue,workspaceFolderValue:U?.workspaceFolderValue}),ce?Te(e):i("INFO","[STARTUP] Auto-Continue is disabled, not starting"),tt(),e.subscriptions.push(s.workspace.onDidChangeConfiguration(g=>{if(g.affectsConfiguration("aiFeedbackBridge")){let h=b();if(i("DEBUG","Configuration changed",{workspace:s.workspace.name,affectedKeys:["port","autoContinue"].filter(k=>g.affectsConfiguration(`aiFeedbackBridge.${k}`))}),g.affectsConfiguration("aiFeedbackBridge.port")){let k=h.get("port",3737);k!==m&&(i("INFO",`Port change detected: ${m} \u2192 ${k}. Reloading window...`),s.commands.executeCommand("workbench.action.reloadWindow"))}Ie(h),g.affectsConfiguration("aiFeedbackBridge.autoContinue")&&Ye(e)}})),ne=s.chat.createChatParticipant("ai-agent-feedback-bridge.agent",Xe),ne.iconPath=s.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(ne);let Oe=s.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>ot(e));e.subscriptions.push(Oe);let Pe=s.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>at());e.subscriptions.push(Pe);let Re=s.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>nt());e.subscriptions.push(Re),i("INFO",`Feedback server started on http://localhost:${m}`)}function Ie(e){if(!I||!F)return;let t=e.get("autoContinue.enabled",!1);F.text=`AI Dev: ${m}`,F.tooltip="Click to configure AI Feedback Bridge",t?(I.text="$(sync~spin) Stop AI Dev",I.tooltip=`Auto-Continue active
Click to stop`):(I.text="$(play) Start AI Dev",I.tooltip=`Auto-Continue inactive
Click to start`)}async function re(e,t=!1){let a=b(),r=["tasks","improvements","coverage","robustness","cleanup","commits"],o=Date.now(),n=[],c="autoContinue.lastSent",l=e.globalState.get(c,{}),d={...l};for(let p of r){let u=a.get(`autoContinue.${p}.enabled`,!0),A=a.get(`autoContinue.${p}.interval`,300),N=a.get(`autoContinue.${p}.message`,"");if(!u||!N)continue;let j=l[p]||0,q=(o-j)/1e3;(t||q>=A)&&(n.push(N),d[p]=o)}return await e.globalState.update(c,d),n.length===0?"":n.join(". ")+"."}function Te(e){if(b().get("autoContinue.enabled",!1)){let o=s.workspace.name||"No Workspace";i("INFO",`\u2705 Auto-Continue enabled for window: ${o}`),x=setInterval(async()=>{try{if(!b().get("autoContinue.enabled",!1)){i("INFO","[Auto-Continue] Detected disabled state, stopping timer"),x&&(clearInterval(x),x=void 0);return}let l=await re(e);l&&(i("INFO","[Auto-Continue] Sending periodic reminder"),await B(l,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(n){i("ERROR","[Auto-Continue] Failed to send message",{error:v(n)})}},500)}else i("DEBUG","Auto-Continue is disabled")}function Ye(e){x&&(clearInterval(x),x=void 0,i("INFO","Auto-Continue timer stopped")),Te(e)}async function Xe(e,t,a,r){w.appendLine(`Chat request received: ${e.prompt}`),a.markdown(`### \u{1F504} Processing Feedback

`),a.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?a.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):a.markdown(`Processing your message...

`);try{let[n]=await s.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n){let c=[s.LanguageModelChatMessage.User(e.prompt)],l=await n.sendRequest(c,{},r);for await(let d of l.text)a.markdown(d)}}catch(n){n instanceof s.LanguageModelError&&(w.appendLine(`Language model error: ${n.message}`),a.markdown(`\u26A0\uFE0F Error: ${n.message}

`))}return{metadata:{command:"process-feedback"}}}async function B(e,t){let a=t||{source:"unknown",timestamp:new Date().toISOString()};try{let r=`# \uFFFD AI DEV MODE

`;r+=`**User Feedback:**
${e}

`,Object.keys(a).filter(n=>n!=="source"&&n!=="timestamp").length>0&&(r+=`**Context:**
\`\`\`json
${JSON.stringify(a,null,2)}
\`\`\`

`),r+=`**Instructions:**
`,r+=`Analyze feedback, take appropriate action:
`,r+=`\u2022 If a bug \u2192 find and fix root cause
`,r+=`\u2022 If a feature \u2192 draft implementation plan
`,r+=`\u2022 Apply and commit changes
`,w.appendLine("Processing feedback through AI agent..."),w.appendLine(r);try{let[n]=await s.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return w.appendLine("\u2705 AI Agent processing request..."),await s.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${r}`}),setTimeout(async()=>{try{await s.commands.executeCommand("workbench.action.chat.submit")}catch{w.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),i("INFO","Feedback sent to AI Agent"),!0}catch(n){w.appendLine(`Could not access language model: ${v(n)}`)}return await s.env.clipboard.writeText(r),i("INFO","Feedback copied to clipboard"),!0}catch(r){return i("ERROR",`Error sending to agent: ${v(r)}`),!1}}async function Ze(e,t){return B(e,t)}function et(e){ee(e,m,B)}function tt(){let e=b(),t=e.get("autoApproval.enabled",!0),a=e.get("autoApproval.autoInject",!1);if(t&&(i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),a)){let r=e.inspect("autoApproval.autoInject");if(!!!(r&&(r.workspaceValue||r.workspaceFolderValue))){i("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),i("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}i("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{W(T).catch(n=>{i("WARN","Auto-inject setup failed:",v(n))})},1e3)}}function ot(e){if(C){w.appendLine("Auto-approval is already enabled");return}let a=b().get("autoApproval.intervalMs",2e3);i("INFO",`Enabling auto-approval with ${a}ms interval`),C=setInterval(async()=>{try{await s.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},a),e.subscriptions.push({dispose:()=>{C&&(clearInterval(C),C=void 0)}}),i("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function at(){C?(clearInterval(C),C=void 0,w.appendLine("Auto-approval disabled"),i("INFO","Auto-approval disabled")):i("INFO","Auto-approval is not currently enabled")}function nt(){let{getAutoApprovalScript:e}=(ae(),le(Se)),t=e(T),a=s.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",s.ViewColumn.One,{enableScripts:!0});a.webview.html=st(t),s.env.clipboard.writeText(t),i("INFO","Auto-approval script copied to clipboard")}function st(e){return`<!DOCTYPE html>
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
</html>`}async function it(){K(),i("INFO","HTTP server closed"),x&&(clearInterval(x),x=void 0,i("INFO","Auto-continue timer cleared")),C&&(clearInterval(C),C=void 0,i("INFO","Auto-approval interval cleared")),T&&await fe(T,m),i("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
