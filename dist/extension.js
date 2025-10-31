"use strict";var J=Object.create;var I=Object.defineProperty;var V=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var q=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var Y=(e,o)=>{for(var t in o)I(e,t,{get:o[t],enumerable:!0})},P=(e,o,t,i)=>{if(o&&typeof o=="object"||typeof o=="function")for(let c of K(o))!G.call(e,c)&&c!==t&&I(e,c,{get:()=>o[c],enumerable:!(i=V(o,c))||i.enumerable});return e};var L=(e,o,t)=>(t=e!=null?J(q(e)):{},P(o||!e||!e.__esModule?I(t,"default",{value:e,enumerable:!0}):t,e)),_=e=>P(I({},"__esModule",{value:!0}),e);var be={};Y(be,{activate:()=>oe,deactivate:()=>ve});module.exports=_(be);var n=L(require("vscode")),N=L(require("http")),M=L(require("fs")),D=L(require("path")),C,l,R,k,x,S,v=3737,b,O;function a(e,o,t){let c=`[${new Date().toISOString()}] [${e}]`,s=t?`${c} ${o} ${JSON.stringify(t)}`:`${c} ${o}`;l.appendLine(s),e==="ERROR"&&console.error(s)}function m(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function E(e,o){await m().update(e,o,n.ConfigurationTarget.Global)}var W="aiFeedbackBridge.portRegistry",T=3737,X=50;async function z(e){return e.globalState.get(W,[])}async function F(e,o){await e.globalState.update(W,o)}async function Q(e){let o=await z(e),t=n.workspace.name||"No Workspace",i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=Date.now()-60*60*1e3,s=o.filter(g=>g.timestamp>c),r=s.find(g=>g.workspace===i);if(r)return a("INFO",`Reusing existing port ${r.port} for workspace`),r.timestamp=Date.now(),await F(e,s),r.port;let p=new Set(s.map(g=>g.port)),d=T;for(let g=0;g<X;g++){let h=T+g;if(!p.has(h)&&await Z(h)){d=h;break}}return s.push({port:d,workspace:i,timestamp:Date.now()}),await F(e,s),a("INFO",`Auto-assigned port ${d} for workspace: ${t}`),d}async function Z(e){return new Promise(o=>{let t=N.createServer();t.once("error",i=>{i.code==="EADDRINUSE"?o(!1):o(!0)}),t.once("listening",()=>{t.close(),o(!0)}),t.listen(e)})}async function ee(e,o){let t=await z(e),i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=t.filter(s=>!(s.port===o&&s.workspace===i));await F(e,c),a("INFO",`Released port ${o}`)}function te(e){let o=n.window.createWebviewPanel("aiFeedbackBridgeSettings","AI Feedback Bridge Settings",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=m();o.webview.html=B(t),o.webview.onDidReceiveMessage(async i=>{switch(i.command){case"updateSetting":await E(i.key,i.value),a("INFO",`Setting updated: ${i.key} = ${i.value}`);break;case"reload":o.webview.html=B(m());break;case"injectScript":await n.commands.executeCommand("ai-agent-feedback-bridge.showAutoApprovalScript"),n.commands.executeCommand("workbench.action.toggleDevTools"),a("INFO","Auto-approval script copied to clipboard, dev tools opened");break}},void 0,e.subscriptions)}function B(e){let o=[{key:"tasks",icon:"\u{1F4CB}",name:"Tasks",interval:300},{key:"improvements",icon:"\u2728",name:"Improvements",interval:600},{key:"coverage",icon:"\u{1F9EA}",name:"Coverage",interval:900},{key:"robustness",icon:"\u{1F6E1}\uFE0F",name:"Robustness",interval:600},{key:"cleanup",icon:"\u{1F9F9}",name:"Cleanup",interval:1200},{key:"commits",icon:"\u{1F4BE}",name:"Commits",interval:900}],t=e.get("autoContinue.enabled",!1),i=e.get("autoApproval.enabled",!1),c=e.get("port",3737),s="";for(let r of o){let p=e.get(`autoContinue.${r.key}.enabled`,!0),d=e.get(`autoContinue.${r.key}.interval`,r.interval);s+=`
			<tr class="${p?"":"disabled"}">
				<td class="cat-icon">${r.icon}</td>
				<td class="cat-name">${r.name}</td>
				<td class="cat-interval">
					<input type="number" value="${d}" data-key="autoContinue.${r.key}.interval" 
					       min="60" step="60" style="width: 70px;" ${p?"":"disabled"}>s
				</td>
				<td class="cat-toggle">
					<input type="checkbox" data-key="autoContinue.${r.key}.enabled" ${p?"checked":""} 
					       class="toggle-cb" id="cb-${r.key}">
					<label for="cb-${r.key}" class="toggle-label"></label>
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
			width: 34px;
			height: 18px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 9px;
			position: relative;
			cursor: pointer;
			transition: all 0.2s;
		}
		.toggle-label:after {
			content: '';
			position: absolute;
			width: 12px;
			height: 12px;
			border-radius: 50%;
			background: var(--vscode-input-foreground);
			top: 2px;
			left: 2px;
			transition: all 0.2s;
		}
		.toggle-cb:checked + .toggle-label {
			background: var(--vscode-button-background);
			border-color: var(--vscode-button-background);
		}
		.toggle-cb:checked + .toggle-label:after {
			left: 18px;
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
			<span class="port-display">${c}</span>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Approval</div>
		<div class="row">
			<label>Enable monitoring</label>
			<input type="checkbox" data-key="autoApproval.enabled" ${i?"checked":""} 
			       class="toggle-cb" id="cb-approval">
			<label for="cb-approval" class="toggle-label"></label>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Auto-Continue</div>
		<div class="row" style="margin-bottom: 8px;">
			<label>Enable reminders</label>
			<input type="checkbox" data-key="autoContinue.enabled" ${t?"checked":""} 
			       class="toggle-cb" id="cb-autocontinue">
			<label for="cb-autocontinue" class="toggle-label"></label>
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
				
				// Update row state
				if (key.includes('.enabled')) {
					const row = e.target.closest('tr');
					if (row) {
						row.classList.toggle('disabled', !value);
						const input = row.querySelector('input[type="number"]');
						if (input) input.disabled = !value;
					}
				}
			});
		});
		
		function injectScript() {
			vscode.postMessage({ command: 'injectScript' });
		}
	</script>
</body>
</html>`}async function oe(e){console.log("AI Agent Feedback Bridge is now active!"),O=e,l=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(l),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let o=m(),t=o.get("port");!t||t===3737?(v=await Q(e),await E("port",v),a("INFO",`Auto-selected port: ${v}`)):(v=t,a("INFO",`Using configured port: ${v}`));let i=n.workspace.name||"No Workspace",c=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${i} (${c} folders)`),x=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),x.command="ai-feedback-bridge.openSettings",x.show(),e.subscriptions.push(x),k=n.window.createStatusBarItem(n.StatusBarAlignment.Right,99),k.command="ai-feedback-bridge.toggleAutoContinue",k.show(),e.subscriptions.push(k),j(o);let s=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{te(e)});e.subscriptions.push(s),ie(e);let r=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async u=>{u||(u=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),u&&await se(u,{})});e.subscriptions.push(r);let p=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let y=m().get("autoContinue.enabled",!1);await E("autoContinue.enabled",!y),a("INFO",`Auto-Continue ${y?"disabled":"enabled"}`)});e.subscriptions.push(p);let d=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let u=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:y=>{let f=parseInt(y);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});u&&(await E("port",parseInt(u)),a("INFO",`Port changed to ${u}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(d);let g=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let u=m(),y=u.get("autoContinue.interval",300),f=u.get("autoContinue.enabled",!1),U=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${C?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${y}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;l.appendLine(U),l.show()});e.subscriptions.push(g),H(e),ce(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(u=>{if(u.affectsConfiguration("aiFeedbackBridge")){let y=m();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>u.affectsConfiguration(`aiFeedbackBridge.${f}`))}),u.affectsConfiguration("aiFeedbackBridge.port")){let f=y.get("port",3737);f!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${f}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}j(y),u.affectsConfiguration("aiFeedbackBridge.autoContinue")&&ae(e)}})),R=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",re),R.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(R);let h=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>le(e));e.subscriptions.push(h);let A=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>pe());e.subscriptions.push(A);let w=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>ue());e.subscriptions.push(w),a("INFO",`Feedback server started on http://localhost:${v}`)}function j(e){if(!k||!x)return;let o=e.get("autoContinue.enabled",!1);x.text=`AI Bridge: ${v}`,x.tooltip="Click to configure AI Feedback Bridge",o?(k.text="$(sync~spin) Stop",k.tooltip=`Auto-Continue active
Click to stop`):(k.text="$(play) Start",k.tooltip=`Auto-Continue inactive
Click to start`)}async function ne(e){let o=m(),t=["tasks","improvements","coverage","robustness","cleanup","commits"],i=Date.now(),c=[],s="autoContinue.lastSent",r=e.globalState.get(s,{}),p={...r};for(let d of t){let g=o.get(`autoContinue.${d}.enabled`,!0),h=o.get(`autoContinue.${d}.interval`,300),A=o.get(`autoContinue.${d}.message`,"");if(!g||!A)continue;let w=r[d]||0;(i-w)/1e3>=h&&(c.push(A),p[d]=i)}return await e.globalState.update(s,p),c.length===0?"":c.join(". ")+"."}function H(e){if(m().get("autoContinue.enabled",!1)){let c=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${c}`),S=setInterval(async()=>{try{let s=await ne(e);s&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await $(s,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(s){a("ERROR","[Auto-Continue] Failed to send message",{error:s})}},500)}else a("DEBUG","Auto-Continue is disabled")}function ae(e){S&&(clearInterval(S),S=void 0,l.appendLine("Auto-Continue stopped")),H(e)}async function re(e,o,t,i){l.appendLine(`Chat request received: ${e.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[s]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(s){let r=[n.LanguageModelChatMessage.User(e.prompt)],p=await s.sendRequest(r,{},i);for await(let d of p.text)t.markdown(d)}}catch(s){s instanceof n.LanguageModelError&&(l.appendLine(`Language model error: ${s.message}`),t.markdown(`\u26A0\uFE0F Error: ${s.message}

`))}return{metadata:{command:"process-feedback"}}}async function $(e,o){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${e}

`,o&&Object.keys(o).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,l.appendLine("Processing feedback through AI agent..."),l.appendLine(t);try{let[i]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i)return l.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{l.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(i){l.appendLine(`Could not access language model: ${i}`)}return await n.env.clipboard.writeText(t),a("INFO","Feedback copied to clipboard"),!0}catch(t){return a("ERROR",`Error sending to agent: ${t}`),!1}}async function se(e,o){return $(e,o)}function ie(e){C=N.createServer(async(o,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),o.method==="OPTIONS"){t.writeHead(200),t.end();return}if(o.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(o.url==="/restart-app"||o.url?.startsWith("/restart-app?")){let r=o.url.split("?"),p=new URLSearchParams(r[1]||""),d=parseInt(p.get("delay")||"30",10);l.appendLine(`Received restart request for Electron app (delay: ${d}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${d}s)`,delay:d})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:h}=require("util"),A=h(g);l.appendLine("Killing Electron process...");try{await A('pkill -f "electron.*Code/AI"')}catch{l.appendLine("Kill command completed (process may not have been running)")}l.appendLine(`Waiting ${d} seconds before restart...`),await new Promise(u=>setTimeout(u,d*1e3));let w=n.workspace.workspaceFolders?.[0]?.uri.fsPath;w&&w.includes("/AI")?(l.appendLine(`Restarting Electron app in: ${w}`),g(`cd "${w}" && npm run dev > /dev/null 2>&1 &`),l.appendLine("Electron app restart command sent")):l.appendLine(`Could not find workspace path: ${w}`)}catch(g){l.appendLine(`Restart error: ${g}`)}},100);return}let i="",c=1024*1024,s=0;o.on("data",r=>{if(s+=r.length,s>c){a("WARN","Request body too large",{size:s}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),o.destroy();return}i+=r.toString()}),o.on("end",async()=>{try{let r=JSON.parse(i);if(!r||typeof r!="object")throw new Error("Invalid feedback structure: must be an object");if(!r.message||typeof r.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let p=r.message.trim();if(p.length===0)throw new Error("Invalid feedback: message cannot be empty");if(p.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:p.length,hasContext:!!r.context});let d=await $(p,r.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:d,message:d?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(r){let p=r instanceof Error?r.message:String(r);a("ERROR","Error processing feedback",{error:p}),r instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:p})))}})});try{C.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),C.on("error",o=>{o.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:o.message,code:o.code})})}catch(o){a("ERROR","Failed to start server",{error:o})}e.subscriptions.push({dispose:()=>{C&&(a("INFO","Closing server"),C.close())}})}function ce(){m().get("autoApproval.enabled",!1)&&a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function de(){try{let e=D.join(O.extensionPath,"auto-approval-script.js");return M.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function le(e){if(b){l.appendLine("Auto-approval is already enabled");return}let t=m().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${t}ms interval`),b=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),e.subscriptions.push({dispose:()=>{b&&(clearInterval(b),b=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function pe(){b?(clearInterval(b),b=void 0,l.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function ue(){let e=de(),o=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});o.webview.html=ge(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function ge(e){return`<!DOCTYPE html>
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
