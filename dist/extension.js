"use strict";var ze=Object.create;var _=Object.defineProperty;var Ge=Object.getOwnPropertyDescriptor;var Ke=Object.getOwnPropertyNames;var _e=Object.getPrototypeOf,qe=Object.prototype.hasOwnProperty;var te=(e,t)=>()=>(e&&(t=e(e=0)),t);var pe=(e,t)=>{for(var o in t)_(e,o,{get:t[o],enumerable:!0})},ue=(e,t,o,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Ke(t))!qe.call(e,a)&&a!==o&&_(e,a,{get:()=>t[a],enumerable:!(n=Ge(t,a))||n.enumerable});return e};var w=(e,t,o)=>(o=e!=null?ze(_e(e)):{},ue(t||!e||!e.__esModule?_(o,"default",{value:e,enumerable:!0}):o,e)),ge=e=>ue(_({},"__esModule",{value:!0}),e);var h=te(()=>{"use strict"});function me(e){oe=e}function r(e,t,o){let a=`[${new Date().toISOString()}] [${e}]`,s=o?`${a} ${t} ${JSON.stringify(o)}`:`${a} ${t}`;oe&&oe.appendLine(s),e==="ERROR"?console.error(s):e==="WARN"?console.warn(s):console.log(s)}function g(e){return e instanceof Error?e.message:String(e)}var oe,x=te(()=>{"use strict";h()});var Pe={};pe(Pe,{autoInjectScript:()=>V,getAutoApprovalScript:()=>Ee});async function V(e){try{let t=Ee(e);await Y.env.clipboard.writeText(t),r("INFO","\u{1F4CB} Auto-approval script copied to clipboard");try{await Y.commands.executeCommand("workbench.action.toggleDevTools"),r("INFO","\u{1F6E0}\uFE0F Developer Tools toggled")}catch(o){r("WARN","Could not toggle Developer Tools",g(o))}}catch(t){r("ERROR","Failed to copy script",g(t))}}function Ee(e){try{let t=Ae.join(e.extensionPath,"scripts","auto-approval-script.js");return Te.readFileSync(t,"utf8")}catch(t){return r("ERROR","Failed to read auto-approval-script.js",g(t)),"// Error: Could not load auto-approval script"}}var Y,Te,Ae,X=te(()=>{"use strict";Y=w(require("vscode")),Te=w(require("fs")),Ae=w(require("path"));x();h()});var $t={};pe($t,{activate:()=>Tt,deactivate:()=>Ft});module.exports=ge($t);var m=w(require("vscode"));h();x();var q=w(require("vscode")),fe=w(require("http"));x();h();var be="aiFeedbackBridge.portRegistry",ve=3737,Qe=50;async function ke(e){return e.globalState.get(be,[])}async function ne(e,t){await e.globalState.update(be,t)}async function we(e){let t=await ke(e),o=q.workspace.name||"No Workspace",n=q.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=Date.now()-60*60*1e3,s=t.filter(d=>d.timestamp>a),i=s.find(d=>d.workspace===n);if(i)return r("INFO",`Reusing existing port ${i.port} for workspace`),i.timestamp=Date.now(),await ne(e,s),i.port;let p=new Set(s.map(d=>d.port)),l=ve;for(let d=0;d<Qe;d++){let f=ve+d;if(!p.has(f)&&await Ye(f)){l=f;break}}return s.push({port:l,workspace:n,timestamp:Date.now()}),await ne(e,s),r("INFO",`Auto-assigned port ${l} for workspace: ${o}`),l}async function Ye(e){return new Promise(t=>{let o=fe.createServer();o.once("error",n=>{n.code==="EADDRINUSE"?t(!1):t(!0)}),o.once("listening",()=>{o.close(),t(!0)}),o.listen(e)})}async function he(e,t){let o=await ke(e),n=q.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",a=o.filter(s=>!(s.port===t&&s.workspace===n));await ne(e,a),r("INFO",`Released port ${t}`)}var Ce=w(require("vscode")),xe=w(require("http"));x();h();async function v(e){try{let t=e.workspaceState.get("tasks",[]);return Array.isArray(t)?t:(console.error("Invalid tasks data in workspace state, resetting to empty array"),await e.workspaceState.update("tasks",[]),[])}catch(t){return console.error("Error reading tasks from workspace state:",t),[]}}async function H(e,t){try{if(!Array.isArray(t))throw new Error("Tasks must be an array");await e.workspaceState.update("tasks",t)}catch(o){throw console.error("Error saving tasks to workspace state:",o),o}}async function U(e,t,o="",n="other"){if(!t||typeof t!="string"||t.trim().length===0)throw new Error("Task title is required and must be a non-empty string");if(t.length>200)throw new Error("Task title too long (max 200 characters)");if(typeof o!="string")throw new Error("Task description must be a string");if(o.length>5e3)throw new Error("Task description too long (max 5000 characters)");let a=await v(e),s={id:Date.now().toString(),title:t.trim(),description:o.trim(),status:"pending",category:n,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return a.push(s),await H(e,a),s}async function N(e,t,o){let n=await v(e),a=n.find(s=>s.id===t);a&&(a.status=o,a.updatedAt=new Date().toISOString(),await H(e,n))}async function Q(e,t){let n=(await v(e)).filter(a=>a.id!==t);await H(e,n)}async function ye(e){let t=await v(e),o=t.filter(a=>a.status!=="completed"),n=t.length-o.length;return await H(e,o),n}var F,Vt=1024*1024,Ze=3e4;function et(e){return Number.isInteger(e)&&e>=1024&&e<=65535}function Se(e,t,o){if(!et(t)){let n=`Invalid port number: ${t}. Must be between 1024 and 65535.`;throw r("ERROR",n),new Error(n)}return F=xe.createServer(async(n,a)=>{if(n.setTimeout(Ze,()=>{r("WARN","Request timeout",{url:n.url,method:n.method}),a.headersSent||(a.writeHead(408,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Request timeout"})))}),a.setHeader("Access-Control-Allow-Origin","*"),a.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS"),a.setHeader("Access-Control-Allow-Headers","Content-Type"),n.method==="OPTIONS"){a.writeHead(200),a.end();return}try{await tt(n,a,e,t,o)}catch(s){r("ERROR","Request handler error",g(s)),a.headersSent||(a.writeHead(500,{"Content-Type":"application/json"}),a.end(JSON.stringify({error:"Internal server error"})))}}),F.listen(t,()=>{r("INFO",`\u2705 Server listening on port ${t}`)}),F.on("error",n=>{n.code==="EADDRINUSE"?r("ERROR",`Port ${t} is already in use. Please change the port in settings.`):r("ERROR","Server error occurred",{error:n.message,code:n.code})}),e.subscriptions.push({dispose:()=>{se()}}),F}function se(){F&&(r("INFO","Closing server"),F.close(),F=void 0)}function Ie(){return F}async function tt(e,t,o,n,a){let s=e.url||"/",i=e.method||"GET";r("DEBUG",`${i} ${s}`),s==="/help"||s==="/"?ot(t,n):s==="/tasks"&&i==="GET"?await nt(t,o):s==="/tasks"&&i==="POST"?await at(e,t,o):s.startsWith("/tasks/")&&i==="PUT"?await st(e,t,o,s):s.startsWith("/tasks/")&&i==="DELETE"?await rt(t,o,s):s==="/feedback"&&i==="POST"?await it(e,t,a):s==="/restart-app"||s.startsWith("/restart-app?")?await ct(e,t):(t.writeHead(404,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Not found",message:`Unknown endpoint: ${i} ${s}`})))}function ot(e,t){let o=`
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
`;e.writeHead(200,{"Content-Type":"text/plain"}),e.end(o)}async function nt(e,t){try{let o=await v(t);e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify(o,null,2))}catch(o){r("ERROR","Failed to get tasks",g(o)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to retrieve tasks"}))}}async function at(e,t,o){try{let n=await re(e),a=JSON.parse(n);if(!a.title||typeof a.title!="string"){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Missing or invalid "title" field (must be non-empty string)'}));return}let s=a.title.trim();if(s.length===0){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Title cannot be empty"}));return}if(s.length>200){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Title too long (max 200 characters)"}));return}let i=a.description?String(a.description).trim():"";if(i.length>5e3){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Description too long (max 5000 characters)"}));return}let l=["feature","bug","improvement","other"].includes(a.category)?a.category:"other",d=await U(o,s,i,l);r("INFO","Task created via API",{taskId:d.id,title:d.title}),t.writeHead(201,{"Content-Type":"application/json"}),t.end(JSON.stringify(d,null,2))}catch(n){n instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):n instanceof Error&&n.message.includes("too large")?(t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:n.message}))):(r("ERROR","Failed to create task",g(n)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to create task"})))}}async function st(e,t,o,n){let a=n.split("/")[2],s=await re(e);try{let i=JSON.parse(s);if(!i.status||!["pending","in-progress","completed"].includes(i.status)){t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:'Invalid or missing "status" field',valid:["pending","in-progress","completed"]}));return}await N(o,a,i.status),r("INFO","Task updated via API",{taskId:a,status:i.status}),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,taskId:a,status:i.status}))}catch(i){i instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(r("ERROR","Failed to update task",g(i)),t.writeHead(500,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Failed to update task"})))}}async function rt(e,t,o){let n=o.split("/")[2];try{await Q(t,n),r("INFO","Task deleted via API",{taskId:n}),e.writeHead(200,{"Content-Type":"application/json"}),e.end(JSON.stringify({success:!0,taskId:n}))}catch(a){r("ERROR","Failed to delete task",g(a)),e.writeHead(500,{"Content-Type":"application/json"}),e.end(JSON.stringify({error:"Failed to delete task"}))}}async function it(e,t,o){let n=await re(e,1048576);try{let a=JSON.parse(n);if(!a||typeof a!="object")throw new Error("Invalid feedback structure: must be an object");if(!a.message||typeof a.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let s=a.message.trim();if(s.length===0)throw new Error("Invalid feedback: message cannot be empty");if(s.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");r("INFO","Received feedback",{messageLength:s.length,hasContext:!!a.context});let i=await o(s,a.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:i,message:i?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(a){let s=g(a);r("ERROR","Error processing feedback",{error:s}),a instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:s})))}}async function ct(e,t){let o=(e.url||"").split("?"),n=new URLSearchParams(o[1]||""),a=parseInt(n.get("delay")||"30",10);r("INFO",`Received restart request for Electron app (delay: ${a}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${a}s)`,delay:a})),setTimeout(async()=>{try{let{exec:s}=require("child_process"),{promisify:i}=require("util"),p=i(s);r("INFO","Killing Electron process...");try{await p('pkill -f "electron.*Code/AI"')}catch{r("INFO","Kill command completed (process may not have been running)")}r("INFO",`Waiting ${a} seconds before restart...`),await new Promise(d=>setTimeout(d,a*1e3));let l=Ce.workspace.workspaceFolders?.[0]?.uri.fsPath;l&&l.includes("/AI")?(r("INFO",`Restarting Electron app in: ${l}`),s(`cd "${l}" && npm run dev > /dev/null 2>&1 &`),r("INFO","Electron app restart command sent")):r("WARN",`Could not find workspace path: ${l}`)}catch(s){r("ERROR","Restart error",g(s))}},100)}async function re(e,t=10*1024){return new Promise((o,n)=>{let a="",s=0;e.on("data",i=>{if(s+=i.length,s>t){n(new Error(`Request body too large (max ${t} bytes)`)),e.destroy();return}a+=i.toString()}),e.on("end",()=>{o(a)}),e.on("error",i=>{n(i)})})}X();var b=w(require("vscode"));h();x();var B,$;function Oe(e){$=e}function Re(e){return B=b.chat.createChatParticipant("ai-agent-feedback-bridge.agent",lt),B.iconPath=b.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(B),r("INFO","Chat participant registered"),B}async function lt(e,t,o,n){$.appendLine(`Chat request received: ${e.prompt}`),o.markdown(`### \u{1F504} Processing Feedback

`),o.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?o.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):o.markdown(`Processing your message...

`);try{let[s]=await b.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let i=[b.LanguageModelChatMessage.User(e.prompt)],p=await s.sendRequest(i,{},n);for await(let l of p.text)o.markdown(l)}}catch(s){s instanceof b.LanguageModelError&&($.appendLine(`Language model error: ${s.message}`),o.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}function pt(e,t){let o=t||{source:"unknown",timestamp:new Date().toISOString()},n=`# \u{1F916} AI DEV MODE

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
`,n}async function J(e,t){try{let o=pt(e,t);$.appendLine("Processing feedback through AI agent..."),$.appendLine(o);try{let[n]=await b.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(n)return $.appendLine("\u2705 AI Agent processing request..."),await b.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${o}`}),setTimeout(async()=>{try{await b.commands.executeCommand("workbench.action.chat.submit")}catch{$.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},300),r("INFO","Feedback sent to AI Agent"),!0}catch(n){$.appendLine(`Could not access language model: ${g(n)}`)}return await b.env.clipboard.writeText(o),r("INFO","Feedback copied to clipboard"),!0}catch(o){return r("ERROR",`Error sending to agent: ${g(o)}`),!1}}async function Ne(e,t){return J(e,t)}function Fe(){B&&(B.dispose(),B=void 0,r("INFO","Chat participant disposed"))}var Me=w(require("vscode"));h();x();var j;async function Z(e,t,o=!1){let n=t(),a=["tasks","improvements","coverage","robustness","cleanup","commits"],s=Date.now(),i=[],p="autoContinue.lastSent",l=e.globalState.get(p,{}),d={...l};for(let f of a){let c=n.get(`autoContinue.${f}.enabled`,!0),C=n.get(`autoContinue.${f}.interval`,300),O=n.get(`autoContinue.${f}.message`,"");if(!c||!O)continue;let R=l[f]||0,Je=(s-R)/1e3;(o||Je>=C)&&(i.push(O),d[f]=s)}return await e.globalState.update(p,d),i.length===0?"":i.join(". ")+"."}function ie(e,t,o){if(t().get("autoContinue.enabled",!1)){let i=Me.workspace.name||"No Workspace";r("INFO",`\u2705 Auto-Continue enabled for window: ${i}`),j=setInterval(async()=>{try{if(!t().get("autoContinue.enabled",!1)){r("INFO","[Auto-Continue] Detected disabled state, stopping timer"),j&&(clearInterval(j),j=void 0);return}let d=await Z(e,t);d&&(r("INFO","[Auto-Continue] Sending periodic reminder"),await o(d,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(p){r("ERROR","[Auto-Continue] Failed to send message",{error:g(p)})}},500)}else r("DEBUG","Auto-Continue is disabled")}function ce(){j&&(clearInterval(j),j=void 0,r("INFO","Auto-Continue timer stopped"))}function Be(e,t,o){ce(),ie(e,t,o)}function je(e,t){let o=t(),n=["tasks","improvements","coverage","robustness","cleanup","commits"],a=Date.now(),s=null,p=e.globalState.get("autoContinue.lastSent",{});for(let l of n){let d=o.get(`autoContinue.${l}.enabled`,!0),f=o.get(`autoContinue.${l}.interval`,300),c=o.get(`autoContinue.${l}.message`,"");if(!d||!c)continue;let C=p[l]||0,O=(a-C)/1e3,R=Math.max(0,f-O);(s===null||R<s)&&(s=R)}return s}function De(e){if(e<60)return`${Math.floor(e)}s`;if(e<3600){let t=Math.floor(e/60),o=Math.floor(e%60);return`${t}m ${o}s`}else{let t=Math.floor(e/3600),o=Math.floor(e%3600/60);return`${t}h ${o}m`}}var M=w(require("vscode"));h();x();var T,D,z,Le=3737;function He(e,t,o){Le=t,D=M.window.createStatusBarItem(M.StatusBarAlignment.Right,100),D.command="ai-feedback-bridge.openSettings",D.show(),e.subscriptions.push(D),T=M.window.createStatusBarItem(M.StatusBarAlignment.Right,99),T.command="ai-feedback-bridge.toggleAutoContinue",T.show(),e.subscriptions.push(T),z=M.window.createStatusBarItem(M.StatusBarAlignment.Right,98),z.command="ai-feedback-bridge.injectScript",z.text="$(clippy) Inject",z.tooltip="Copy auto-approval script to clipboard",z.show(),e.subscriptions.push(z),G(o),r("INFO","Status bar items initialized")}function G(e,t){if(!T||!D)return;let o=e.get("autoContinue.enabled",!1);if(D.text=`AI Dev: ${Le}`,D.tooltip="Click to configure AI Feedback Bridge",o){let n=t?` (${t})`:"";T.text=`$(sync~spin) Stop AI Dev${n}`,T.tooltip=t?`Auto-Continue active
Next reminder: ${t}
Click to stop`:`Auto-Continue active
Click to stop`}else T.text="$(play) Start AI Dev",T.tooltip=`Auto-Continue inactive
Click to start`}var u=w(require("vscode"));x();h();var k=w(require("vscode"));h();x();X();var W;async function Ue(e,t,o,n,a,s){if(W){W.reveal(k.ViewColumn.One);let d=await v(e);W.webview.html=await A(o(),t,d);return}let i=k.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",k.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});W=i,i.onDidDispose(()=>{W=void 0},null,e.subscriptions);let p=o(),l=await v(e);i.webview.html=await A(p,t,l),i.webview.onDidReceiveMessage(async d=>{await gt(d,i,e,t,o,n,a,s)},void 0,e.subscriptions)}async function gt(e,t,o,n,a,s,i,p){switch(e.command){case"updateSetting":await s(e.key,e.value),r("INFO",`Setting updated: ${e.key} = ${e.value}`);break;case"reload":let l=await v(o);t.webview.html=await A(a(),n,l);break;case"runNow":await mt(o,i,p);break;case"injectScript":V(o);break;case"sendInstructions":await vt(n,i);break;case"saveNewTask":await ft(e,t,o,n,a);break;case"updateTaskField":await bt(e,t,o,n,a);break;case"updateTaskStatus":await kt(e,t,o,n,a);break;case"createTask":await wt(t,o,n,a);break;case"openTaskManager":await k.commands.executeCommand("ai-feedback-bridge.listTasks");break;case"clearCompleted":await ht(t,o,n,a);break}}async function mt(e,t,o){try{let n=await o(e,!0);n?(await t(n,{source:"manual_trigger",timestamp:new Date().toISOString()}),r("INFO","[Run Now] Manually triggered all enabled reminders")):k.window.showInformationMessage("No enabled categories (check settings)")}catch(n){r("ERROR","[Run Now] Failed to send message",{error:g(n)}),k.window.showErrorMessage("Failed to send reminders")}}async function vt(e,t){try{let o="\u{1F4CB} AI Feedback Bridge - Usage Instructions\\n\\nThis extension helps coordinate between external apps and AI agents in VS Code.\\n\\n\u{1F3AF} Key Features:\\n1. **Task Management** - Create and track workspace-specific tasks\\n   - Click any title/description to edit inline\\n   - Click status icon (\u23F3/\u{1F504}) to cycle status\\n   - Tasks auto-sync with external API at http://localhost:"+e+'/tasks\\n\\n2. **Auto-Continue System** - Periodic AI reminders\\n   - Configure categories: tasks, improvements, coverage, robustness, cleanup, commits\\n   - Customize messages and intervals\\n   - "Run Now" button triggers all reminders immediately\\n\\n3. **External API** - HTTP endpoints for automation\\n   - GET /tasks - List all workspace tasks\\n   - POST /tasks - Create new task\\n   - PUT /tasks/:id - Update task status\\n   - GET /help - Full API documentation\\n   - Server auto-starts on port '+e+'\\n\\n4. **Auto-Approval Script** - Browser dev tools automation\\n   - "Inject Script" copies script to clipboard\\n   - Paste in VS Code Developer Tools console\\n   - Auto-clicks "Allow" and "Keep" buttons\\n\\n\u{1F4A1} Quick Start:\\n- Add tasks inline by clicking "Add Task"\\n- Configure auto-continue in settings below\\n- External apps can POST to http://localhost:'+e+'/tasks\\n- Check Command Palette for "AI Feedback Bridge" commands\\n\\n\u{1F4D6} For full API docs, visit: http://localhost:'+e+"/help";await t(o,{source:"instructions",timestamp:new Date().toISOString()})}catch{k.window.showErrorMessage("Failed to send instructions")}}async function ft(e,t,o,n,a){try{await U(o,e.title,e.description,e.category);let s=await v(o);t.webview.html=await A(a(),n,s)}catch(s){k.window.showErrorMessage(`Failed to create task: ${g(s)}`)}}async function bt(e,t,o,n,a){try{let s=await v(o),i=s.find(p=>p.id===e.taskId);if(i){e.field==="title"?i.title=e.value:e.field==="description"&&(i.description=e.value),i.updatedAt=new Date().toISOString(),await H(o,s);let p=await v(o);t.webview.html=await A(a(),n,p)}}catch(s){k.window.showErrorMessage(`Failed to update task: ${g(s)}`)}}async function kt(e,t,o,n,a){try{await N(o,e.taskId,e.status);let s=await v(o);t.webview.html=await A(a(),n,s)}catch(s){k.window.showErrorMessage(`Failed to update status: ${g(s)}`)}}async function wt(e,t,o,n){await k.commands.executeCommand("ai-feedback-bridge.addTask");let a=await v(t);e.webview.html=await A(n(),o,a)}async function ht(e,t,o,n){try{let a=await ye(t),s=await v(t);e.webview.html=await A(n(),o,s),r("DEBUG",`Cleared ${a} completed tasks`)}catch(a){k.window.showErrorMessage(`Failed to clear completed tasks: ${g(a)}`)}}async function A(e,t,o){let n=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],a=e.get("autoContinue.enabled",!1),s=e.get("autoApproval.enabled",!0),i=e.get("autoApproval.autoInject",!1),p="";for(let c of n){let C=e.get(`autoContinue.${c.key}.enabled`,!0),O=e.get(`autoContinue.${c.key}.interval`,c.interval),R=e.get(`autoContinue.${c.key}.message`,"");p+=`
			<tr class="${C?"":"disabled"}">
				<td class="cat-icon">${c.icon}</td>
				<td class="cat-name">${c.name}</td>
				<td class="cat-message">
					<input type="text" value="${R}" data-key="autoContinue.${c.key}.message" 
					       placeholder="Enter message..." 
					       style="width: 100%; padding: 4px 8px; font-size: 13px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" 
					       ${C?"":"disabled"} data-auto-approved="skip">
				</td>
				<td class="cat-interval">
					<input type="number" value="${O}" data-key="autoContinue.${c.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${C?"":"disabled"} data-auto-approved="skip">s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${c.key}.enabled" ${C?"checked":""} 
					       class="toggle-cb" id="cb-${c.key}" data-auto-approved="skip">
					<label for="cb-${c.key}" class="toggle-label" data-auto-approved="skip"></label>
				</td>
			</tr>
		`}let l=o.filter(c=>c.status!=="completed").reverse(),d=o.filter(c=>c.status==="completed").length,f=l.length===0?`
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
				${l.map(c=>{let C=c.status==="pending"?"\u23F3":c.status==="in-progress"?"\u{1F504}":"\u2705",O=c.status==="pending"?"Pending":c.status==="in-progress"?"In Progress":"Completed",R=c.status==="pending"?"#cca700":c.status==="in-progress"?"#3794ff":"#89d185";return`
					<tr>
						<td style="cursor: pointer; font-size: 18px;" onclick="cycleStatus('${c.id}', '${c.status}')" title="Click to cycle status">${C}</td>
						<td style="cursor: pointer; font-weight: 500;" onclick="editField(this, '${c.id}', 'title')">${c.title}</td>
						<td style="cursor: pointer; opacity: 0.8; font-size: 13px;" onclick="editField(this, '${c.id}', 'description')">${c.description||'<span style="opacity: 0.5;">(click to add description)</span>'}</td>
						<td style="font-size: 12px; opacity: 0.7;">${c.category}</td>
						<td style="color: ${R}; font-size: 12px;">${O}</td>
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
		${yt()}
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
				<input type="checkbox" data-key="autoApproval.autoInject" ${i?"checked":""} 
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
				${p}
			</tbody>
		</table>
	</div>
	
	<div class="section">
		<div class="section-title">Task Management (Workspace)</div>
		${f}
	</div>
	
	<script>
		${Ct()}
	</script>
</body>
</html>`}function yt(){return`
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
	`}function Ct(){return`
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
	`}async function ee(e,t,o){if(W){let n=await v(e);W.webview.html=await A(t(),o,n),r("DEBUG","Settings panel refreshed")}}function Ve(e){let{context:t}=e;t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{Ue(e.context,e.currentPort,e.getConfig,e.updateConfig,e.sendToAgent,(o,n)=>Z(o,e.getConfig,n))})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.runNow",async()=>{try{let o=await Z(e.context,e.getConfig,!0);o?(r("INFO","[Run Now] Manually triggered all enabled reminders"),await e.sendToAgent(o,{source:"manual_trigger",timestamp:new Date().toISOString()})):u.window.showInformationMessage("No enabled categories (check settings)")}catch(o){r("ERROR","[Run Now] Failed to send message",{error:o}),u.window.showErrorMessage("Failed to send reminders")}})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.injectScript",async()=>{e.autoInjectScript(e.context)})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.getPort",()=>e.currentPort)),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.addTask",async()=>{let o=await u.window.showInputBox({prompt:"Task title"});if(!o)return;let n=await u.window.showInputBox({prompt:"Task description (optional)"}),a=await u.window.showQuickPick(["bug","feature","improvement","documentation","testing","other"],{placeHolder:"Select category"});await U(e.context,o,n||"",a||"other"),await ee(e.context,e.getConfig,e.currentPort)})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.listTasks",async()=>{let o=await v(e.context);if(o.length===0){u.window.showInformationMessage("No tasks found");return}let n=o.map(s=>({label:`${s.status==="completed"?"\u2705":s.status==="in-progress"?"\u{1F504}":"\u23F3"} ${s.title}`,description:s.description,task:s})),a=await u.window.showQuickPick(n,{placeHolder:"Select a task to update"});if(a){let s=await u.window.showQuickPick(["Mark as In Progress","Mark as Completed","Mark as Pending","Delete"],{placeHolder:"What do you want to do?"});s==="Delete"?await Q(e.context,a.task.id):s==="Mark as In Progress"?await N(e.context,a.task.id,"in-progress"):s==="Mark as Completed"?await N(e.context,a.task.id,"completed"):s==="Mark as Pending"&&await N(e.context,a.task.id,"pending"),await ee(e.context,e.getConfig,e.currentPort)}})),t.subscriptions.push(u.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async o=>{o||(o=await u.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),o&&await Ne(o,{source:"manual_command",timestamp:new Date().toISOString()})})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let n=e.getConfig().get("autoContinue.enabled",!1);await e.updateConfig("autoContinue.enabled",!n),r("INFO",`Auto-Continue ${n?"disabled":"enabled"}`),n?e.stopCountdownUpdates():e.startCountdownUpdates(e.context),ee(e.context,e.getConfig,e.currentPort)})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let o=await u.window.showInputBox({prompt:"Enter new port number",value:e.currentPort.toString(),validateInput:n=>{let a=parseInt(n);return isNaN(a)||a<1024||a>65535?"Invalid port (1024-65535)":null}});o&&(await e.updateConfig("port",parseInt(o)),r("INFO",`Port changed to ${o}. Reloading VS Code...`),u.commands.executeCommand("workbench.action.reloadWindow"))})),t.subscriptions.push(u.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let o=e.getConfig(),n=o.get("autoContinue.interval",300),a=o.get("autoContinue.enabled",!1),i=`\u{1F309} AI Feedback Bridge Status

Window: ${u.workspace.name||"No Workspace"}
Port: ${e.currentPort}
Server: ${e.server?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${a?`Enabled \u2705 (every ${n}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${e.currentPort}`;e.outputChannel.appendLine(i),e.outputChannel.show()})),t.subscriptions.push(u.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>e.enableAutoApproval(e.context))),t.subscriptions.push(u.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>e.disableAutoApproval())),t.subscriptions.push(u.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>e.injectAutoApprovalScript())),r("INFO","All commands registered successfully")}var L,E=3737,y,P,K;function S(){return m.workspace.getConfiguration("aiFeedbackBridge")}async function It(e,t){let o=S();await o.update(e,t,m.ConfigurationTarget.Workspace),r("DEBUG",`Config updated: ${e} = ${t}`,{scope:"Workspace",newValue:o.get(e)})}async function Tt(e){K=e,L=m.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(L),me(L),Oe(L),r("INFO","\u{1F680} AI Agent Feedback Bridge activated");let t=S(),o=m.workspace.getConfiguration("aiFeedbackBridge");o.inspect("autoContinue.enabled")?.globalValue!==void 0&&(r("WARN","Detected old Global settings, clearing to use Workspace scope"),await o.update("autoContinue.enabled",void 0,m.ConfigurationTarget.Global));let a=t.get("port");E=await we(e),r("INFO",`Auto-selected port: ${E} for this window`);let s=m.workspace.name||"No Workspace",i=m.workspace.workspaceFolders?.length||0;r("INFO",`Window context: ${s} (${i} folders)`),He(e,E,t),Ve({context:e,currentPort:E,getConfig:S,updateConfig:It,sendToAgent:J,autoInjectScript:V,enableAutoApproval:Pt,disableAutoApproval:Ot,injectAutoApprovalScript:Rt,startCountdownUpdates:de,stopCountdownUpdates:le,outputChannel:L,server:Ie()}),At(e);let p=t.get("autoContinue.enabled",!1),l=t.inspect("autoContinue.enabled");r("INFO","[STARTUP] Auto-Continue check:",{enabled:p,defaultValue:l?.defaultValue,globalValue:l?.globalValue,workspaceValue:l?.workspaceValue,workspaceFolderValue:l?.workspaceFolderValue}),p?(ie(e,S,J),de(e)):r("INFO","[STARTUP] Auto-Continue is disabled, not starting"),Et(),e.subscriptions.push(m.workspace.onDidChangeConfiguration(d=>{if(d.affectsConfiguration("aiFeedbackBridge")){let f=S();if(r("DEBUG","Configuration changed",{workspace:m.workspace.name,affectedKeys:["port","autoContinue"].filter(c=>d.affectsConfiguration(`aiFeedbackBridge.${c}`))}),d.affectsConfiguration("aiFeedbackBridge.port")){let c=f.get("port",3737);c!==E&&(r("INFO",`Port change detected: ${E} \u2192 ${c}. Reloading window...`),m.commands.executeCommand("workbench.action.reloadWindow"))}G(f),d.affectsConfiguration("aiFeedbackBridge.autoContinue")&&(Be(e,S,J),f.get("autoContinue.enabled",!1)?de(e):le())}})),Re(e),r("INFO",`Feedback server started on http://localhost:${E}`)}function At(e){Se(e,E,J)}function de(e){P&&clearInterval(P),P=setInterval(()=>{try{let t=S();if(!t.get("autoContinue.enabled",!1)){P&&(clearInterval(P),P=void 0),G(t);return}let n=je(e,S);if(n!==null&&n>0){let a=De(n);G(t,a)}else G(t)}catch(t){r("ERROR","Error updating countdown",{error:g(t)})}},1e3)}function le(){P&&(clearInterval(P),P=void 0)}function Et(){let e=S(),t=e.get("autoApproval.enabled",!0),o=e.get("autoApproval.autoInject",!1);if(t&&(r("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.'),o)){let n=e.inspect("autoApproval.autoInject");if(!!!(n&&(n.workspaceValue||n.workspaceFolderValue))){r("INFO","Skipping auto-inject because autoApproval.autoInject is not set at workspace scope."),r("INFO",'To enable auto-inject for this workspace, set "aiFeedbackBridge.autoApproval.autoInject" in Workspace Settings.');return}r("INFO","Auto-inject enabled at workspace scope. Launching quick setup..."),setTimeout(()=>{V(K).catch(s=>{r("WARN","Auto-inject setup failed:",g(s))})},1e3)}}function Pt(e){if(y){L.appendLine("Auto-approval is already enabled");return}let o=S().get("autoApproval.intervalMs",2e3);r("INFO",`Enabling auto-approval with ${o}ms interval`),y=setInterval(async()=>{try{await m.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},o),e.subscriptions.push({dispose:()=>{y&&(clearInterval(y),y=void 0)}}),r("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function Ot(){y?(clearInterval(y),y=void 0,L.appendLine("Auto-approval disabled"),r("INFO","Auto-approval disabled")):r("INFO","Auto-approval is not currently enabled")}function Rt(){let{getAutoApprovalScript:e}=(X(),ge(Pe)),t=e(K),o=m.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",m.ViewColumn.One,{enableScripts:!0});o.webview.html=Nt(t),m.env.clipboard.writeText(t),r("INFO","Auto-approval script copied to clipboard")}function Nt(e){return`<!DOCTYPE html>
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
</html>`}async function Ft(){se(),r("INFO","HTTP server closed"),ce(),y&&(clearInterval(y),y=void 0,r("INFO","Auto-approval interval cleared")),le(),Fe(),K&&await he(K,E),r("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
