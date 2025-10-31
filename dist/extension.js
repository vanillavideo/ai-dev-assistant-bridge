"use strict";var J=Object.create;var I=Object.defineProperty;var V=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var K=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var Y=(e,o)=>{for(var t in o)I(e,t,{get:o[t],enumerable:!0})},P=(e,o,t,r)=>{if(o&&typeof o=="object"||typeof o=="function")for(let l of q(o))!G.call(e,l)&&l!==t&&I(e,l,{get:()=>o[l],enumerable:!(r=V(o,l))||r.enumerable});return e};var L=(e,o,t)=>(t=e!=null?J(K(e)):{},P(o||!e||!e.__esModule?I(t,"default",{value:e,enumerable:!0}):t,e)),_=e=>P(I({},"__esModule",{value:!0}),e);var me={};Y(me,{activate:()=>oe,deactivate:()=>ve});module.exports=_(me);var n=L(require("vscode")),$=L(require("http")),M=L(require("fs")),D=L(require("path")),C,p,R,k,x,S,v=3737,b,O;function a(e,o,t){let l=`[${new Date().toISOString()}] [${e}]`,s=t?`${l} ${o} ${JSON.stringify(t)}`:`${l} ${o}`;p.appendLine(s),e==="ERROR"&&console.error(s)}function f(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function E(e,o){await f().update(e,o,n.ConfigurationTarget.Global)}var W="aiFeedbackBridge.portRegistry",T=3737,X=50;async function z(e){return e.globalState.get(W,[])}async function F(e,o){await e.globalState.update(W,o)}async function Q(e){let o=await z(e),t=n.workspace.name||"No Workspace",r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=Date.now()-60*60*1e3,s=o.filter(g=>g.timestamp>l),i=s.find(g=>g.workspace===r);if(i)return a("INFO",`Reusing existing port ${i.port} for workspace`),i.timestamp=Date.now(),await F(e,s),i.port;let c=new Set(s.map(g=>g.port)),d=T;for(let g=0;g<X;g++){let m=T+g;if(!c.has(m)&&await Z(m)){d=m;break}}return s.push({port:d,workspace:r,timestamp:Date.now()}),await F(e,s),a("INFO",`Auto-assigned port ${d} for workspace: ${t}`),d}async function Z(e){return new Promise(o=>{let t=$.createServer();t.once("error",r=>{r.code==="EADDRINUSE"?o(!1):o(!0)}),t.once("listening",()=>{t.close(),o(!0)}),t.listen(e)})}async function ee(e,o){let t=await z(e),r=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",l=t.filter(s=>!(s.port===o&&s.workspace===r));await F(e,l),a("INFO",`Released port ${o}`)}function te(e){let o=n.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=f();o.webview.html=B(t),o.webview.onDidReceiveMessage(async r=>{switch(r.command){case"updateSetting":await E(r.key,r.value),a("INFO",`Setting updated: ${r.key} = ${r.value}`);break;case"reload":o.webview.html=B(f());break}},void 0,e.subscriptions)}function B(e){let o=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",desc:"Continue with current tasks"},{key:"improvements",icon:"\u2728",name:"Improvements",desc:"Code quality and optimizations"},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",desc:"Testing and validation"},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",desc:"Error handling and stability"},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",desc:"Remove unused code"},{key:"commits",icon:"\u{1F4BE}",name:"Commits",desc:"Save progress regularly"}],t=e.get("autoContinue.enabled",!1),r=e.get("autoApproval.enabled",!1),l=e.get("port",3737),s=e.get("autoStart",!0),i="";for(let c of o){let d=e.get(`autoContinue.${c.key}.enabled`,!0),g=e.get(`autoContinue.${c.key}.interval`,300),m=e.get(`autoContinue.${c.key}.message`,"");i+=`
			<div class="category ${d?"enabled":"disabled"}">
				<div class="category-header">
					<span class="icon">${c.icon}</span>
					<span class="name">${c.name}</span>
					<label class="toggle">
						<input type="checkbox" data-key="autoContinue.${c.key}.enabled" ${d?"checked":""}>
						<span class="slider"></span>
					</label>
				</div>
				<div class="category-body ${d?"":"hidden"}">
					<div class="field">
						<label>Interval (seconds)</label>
						<input type="number" value="${g}" data-key="autoContinue.${c.key}.interval" min="60" step="60">
					</div>
					<div class="field">
						<label>Message</label>
						<textarea data-key="autoContinue.${c.key}.message" rows="2">${m}</textarea>
					</div>
				</div>
			</div>
		`}return`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AI Feedback Bridge Settings</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			padding: 20px;
		}
		h1 { margin-bottom: 20px; font-size: 24px; }
		h2 { margin: 30px 0 15px; font-size: 18px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
		
		.section { margin-bottom: 30px; }
		.field { margin-bottom: 15px; }
		.field label { display: block; margin-bottom: 5px; font-weight: 500; }
		.field input[type="number"], .field input[type="text"] {
			width: 200px;
			padding: 6px 10px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
		}
		.field textarea {
			width: 100%;
			max-width: 600px;
			padding: 8px 10px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-family: var(--vscode-font-family);
			resize: vertical;
		}
		
		.toggle { position: relative; display: inline-block; width: 42px; height: 24px; }
		.toggle input { opacity: 0; width: 0; height: 0; }
		.slider {
			position: absolute; cursor: pointer; inset: 0;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 24px;
			transition: .3s;
		}
		.slider:before {
			position: absolute; content: ""; height: 16px; width: 16px;
			left: 3px; bottom: 3px;
			background-color: var(--vscode-input-foreground);
			border-radius: 50%;
			transition: .3s;
		}
		input:checked + .slider { background-color: var(--vscode-button-background); border-color: var(--vscode-button-background); }
		input:checked + .slider:before { transform: translateX(18px); background-color: white; }
		
		.category {
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			margin-bottom: 12px;
			background: var(--vscode-sideBar-background);
		}
		.category.disabled { opacity: 0.6; }
		.category-header {
			padding: 12px 15px;
			display: flex;
			align-items: center;
			gap: 12px;
			cursor: pointer;
		}
		.category-header .icon { font-size: 20px; }
		.category-header .name { flex: 1; font-weight: 500; font-size: 15px; }
		.category-body {
			padding: 0 15px 15px;
			border-top: 1px solid var(--vscode-panel-border);
		}
		.category-body.hidden { display: none; }
		.category-body .field { margin-top: 12px; }
		
		.main-toggle {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 15px;
			background: var(--vscode-editor-background);
			border: 2px solid var(--vscode-panel-border);
			border-radius: 6px;
			margin-bottom: 20px;
		}
		.main-toggle .label { flex: 1; font-size: 16px; font-weight: 600; }
	</style>
</head>
<body>
	<h1>\u{1F309} AI Feedback Bridge Settings</h1>
	
	<div class="section">
		<h2>Server</h2>
		<div class="field">
			<label>Port (auto-assigned per window)</label>
			<input type="number" value="${l}" data-key="port" min="1024" max="65535" readonly>
			<p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">Port is automatically selected for each window</p>
		</div>
		<div class="field">
			<label class="toggle">
				<input type="checkbox" data-key="autoStart" ${s?"checked":""}>
				<span class="slider"></span>
			</label>
			<label style="display: inline; margin-left: 10px;">Auto-start server on launch</label>
		</div>
	</div>
	
	<div class="section">
		<h2>Auto-Approval</h2>
		<div class="field">
			<label class="toggle">
				<input type="checkbox" data-key="autoApproval.enabled" ${r?"checked":""}>
				<span class="slider"></span>
			</label>
			<label style="display: inline; margin-left: 10px;">Enable auto-approval (requires manual console script)</label>
		</div>
	</div>
	
	<div class="section">
		<h2>Auto-Continue</h2>
		<div class="main-toggle">
			<span class="label">Enable Auto-Continue</span>
			<label class="toggle">
				<input type="checkbox" data-key="autoContinue.enabled" ${t?"checked":""}>
				<span class="slider"></span>
			</label>
		</div>
		
		<p style="margin-bottom: 15px; opacity: 0.8;">Configure which reminders to send and how often:</p>
		${i}
	</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		
		// Handle all input changes
		document.querySelectorAll('input, textarea').forEach(el => {
			el.addEventListener('change', (e) => {
				const key = e.target.dataset.key;
				let value = e.target.type === 'checkbox' ? e.target.checked : 
				           e.target.type === 'number' ? parseInt(e.target.value) : 
				           e.target.value;
				
				vscode.postMessage({
					command: 'updateSetting',
					key: key,
					value: value
				});
				
				// Toggle category body visibility
				if (key.includes('.enabled')) {
					const category = e.target.closest('.category');
					if (category) {
						const body = category.querySelector('.category-body');
						if (body) {
							body.classList.toggle('hidden', !value);
						}
						category.classList.toggle('enabled', value);
						category.classList.toggle('disabled', !value);
					}
				}
			});
		});
		
		// Make category headers clickable
		document.querySelectorAll('.category-header').forEach(header => {
			header.addEventListener('click', (e) => {
				if (e.target.type !== 'checkbox' && !e.target.classList.contains('slider')) {
					const toggle = header.querySelector('input[type="checkbox"]');
					toggle.click();
				}
			});
		});
	</script>
</body>
</html>`}async function oe(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,p=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(p),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let o=f(),t=o.get("port");!t||t===3737?(v=await Q(e),await E("port",v),a("INFO",`Auto-selected port: ${v}`)):(v=t,a("INFO",`Using configured port: ${v}`));let r=n.workspace.name||"No Workspace",l=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${r} (${l} folders)`),x=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),x.command="ai-feedback-bridge.openSettings",x.show(),e.subscriptions.push(x),k=n.window.createStatusBarItem(n.StatusBarAlignment.Right,99),k.command="ai-feedback-bridge.toggleAutoContinue",k.show(),e.subscriptions.push(k),j(o);let s=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{te(e)});e.subscriptions.push(s),ie(e);let i=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async u=>{u||(u=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),u&&await se(u,{})});e.subscriptions.push(i);let c=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let w=f().get("autoContinue.enabled",!1);await E("autoContinue.enabled",!w),a("INFO",`Auto-Continue ${w?"disabled":"enabled"}`)});e.subscriptions.push(c);let d=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let u=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:w=>{let h=parseInt(w);return isNaN(h)||h<1024||h>65535?"Invalid port (1024-65535)":null}});u&&(await E("port",parseInt(u)),a("INFO",`Port changed to ${u}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(d);let g=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let u=f(),w=u.get("autoContinue.interval",300),h=u.get("autoContinue.enabled",!1),U=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${h?`Enabled \u2705 (every ${w}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;p.appendLine(U),p.show()});e.subscriptions.push(g),H(e),ce(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(u=>{if(u.affectsConfiguration("aiFeedbackBridge")){let w=f();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(h=>u.affectsConfiguration(`aiFeedbackBridge.${h}`))}),u.affectsConfiguration("aiFeedbackBridge.port")){let h=w.get("port",3737);h!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${h}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}j(w),u.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ae(e)}})),R=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",re),R.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(R);let m=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>le(e));e.subscriptions.push(m);let A=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>pe());e.subscriptions.push(A);let y=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>ue());e.subscriptions.push(y),a("INFO",`Feedback server started on http://localhost:${v}`)}function j(e){if(!k||!x)return;let o=e.get("autoContinue.enabled",!1);x.text=`AI Bridge: ${v}`,x.tooltip="Click to configure AI Feedback Bridge",o?(k.text="$(sync~spin) Stop",k.tooltip=`Auto-Continue active
Click to stop`):(k.text="$(play) Start",k.tooltip=`Auto-Continue inactive
Click to start`)}async function ne(e){let o=f(),t=["tasks","improvements","coverage","robustness","cleanup","commits"],r=Date.now(),l=[],s="autoContinue.lastSent",i=e.globalState.get(s,{}),c={...i};for(let d of t){let g=o.get(`autoContinue.${d}.enabled`,!0),m=o.get(`autoContinue.${d}.interval`,300),A=o.get(`autoContinue.${d}.message`,"");if(!g||!A)continue;let y=i[d]||0;(r-y)/1e3>=m&&(l.push(A),c[d]=r)}return await e.globalState.update(s,c),l.length===0?"":l.join(". ")+"."}function H(e){if(f().get("autoContinue.enabled",!1)){let l=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${l}`),S=setInterval(async()=>{try{let s=await ne(e);s&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await N(s,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(s){a("ERROR","[Auto-Continue] Failed to send message",{error:s})}},500)}else a("DEBUG","Auto-Continue is disabled")}function ae(e){S&&(clearInterval(S),S=void 0,p.appendLine("Auto-Continue stopped")),H(e)}async function re(e,o,t,r){p.appendLine(`Chat request received: ${e.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[s]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let i=[n.LanguageModelChatMessage.User(e.prompt)],c=await s.sendRequest(i,{},r);for await(let d of c.text)t.markdown(d)}}catch(s){s instanceof n.LanguageModelError&&(p.appendLine(`Language model error: ${s.message}`),t.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}async function N(e,o){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${e}

`,o&&Object.keys(o).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,p.appendLine("Processing feedback through AI agent..."),p.appendLine(t);try{let[r]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r)return p.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{p.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(r){p.appendLine(`Could not access language model: ${r}`)}return await n.env.clipboard.writeText(t),a("INFO","Feedback copied to clipboard"),!0}catch(t){return a("ERROR",`Error sending to agent: ${t}`),!1}}async function se(e,o){return N(e,o)}function ie(e){C=$.createServer(async(o,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),o.method==="OPTIONS"){t.writeHead(200),t.end();return}if(o.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(o.url==="/restart-app"||o.url?.startsWith("/restart-app?")){let i=o.url.split("?"),c=new URLSearchParams(i[1]||""),d=parseInt(c.get("delay")||"30",10);p.appendLine(`Received restart request for Electron app (delay: ${d}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${d}s)`,delay:d})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:m}=require("util"),A=m(g);p.appendLine("Killing Electron process...");try{await A('pkill -f "electron.*Code/AI"')}catch{p.appendLine("Kill command completed (process may not have been running)")}p.appendLine(`Waiting ${d} seconds before restart...`),await new Promise(u=>setTimeout(u,d*1e3));let y=n.workspace.workspaceFolders?.[0]?.uri.fsPath;y&&y.includes("/AI")?(p.appendLine(`Restarting Electron app in: ${y}`),g(`cd "${y}" && npm run dev > /dev/null 2>&1 &`),p.appendLine("Electron app restart command sent")):p.appendLine(`Could not find workspace path: ${y}`)}catch(g){p.appendLine(`Restart error: ${g}`)}},100);return}let r="",l=1024*1024,s=0;o.on("data",i=>{if(s+=i.length,s>l){a("WARN","Request body too large",{size:s}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),o.destroy();return}r+=i.toString()}),o.on("end",async()=>{try{let i=JSON.parse(r);if(!i||typeof i!="object")throw new Error("Invalid feedback structure: must be an object");if(!i.message||typeof i.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let c=i.message.trim();if(c.length===0)throw new Error("Invalid feedback: message cannot be empty");if(c.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:c.length,hasContext:!!i.context});let d=await N(c,i.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:d,message:d?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(i){let c=i instanceof Error?i.message:String(i);a("ERROR","Error processing feedback",{error:c}),i instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:c})))}})});try{C.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),C.on("error",o=>{o.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:o.message,code:o.code})})}catch(o){a("ERROR","Failed to start server",{error:o})}e.subscriptions.push({dispose:()=>{C&&(a("INFO","Closing server"),C.close())}})}function ce(){f().get("autoApproval.enabled",!1)&&a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function de(){try{let e=D.join(O.extensionPath,"auto-approval-script.js");return M.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function le(e){if(b){p.appendLine("Auto-approval is already enabled");return}let t=f().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${t}ms interval`),b=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function pe(){b?(clearInterval(b),b=void 0,p.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function ue(){let e=de(),o=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});o.webview.html=ge(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function ge(e){return`<!DOCTYPE html>
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
</html>`}async function ve(){C&&(C.close(),a("INFO","HTTP server closed")),S&&(clearInterval(S),S=void 0,a("INFO","Auto-continue timer cleared")),b&&(clearInterval(b),b=void 0,a("INFO","Auto-approval interval cleared")),O&&await ee(O,v),a("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
