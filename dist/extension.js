"use strict";var J=Object.create;var L=Object.defineProperty;var V=Object.getOwnPropertyDescriptor;var z=Object.getOwnPropertyNames;var K=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var _=(e,o)=>{for(var t in o)L(e,t,{get:o[t],enumerable:!0})},T=(e,o,t,i)=>{if(o&&typeof o=="object"||typeof o=="function")for(let c of z(o))!G.call(e,c)&&c!==t&&L(e,c,{get:()=>o[c],enumerable:!(i=V(o,c))||i.enumerable});return e};var E=(e,o,t)=>(t=e!=null?J(K(e)):{},T(o||!e||!e.__esModule?L(t,"default",{value:e,enumerable:!0}):t,e)),Y=e=>T(L({},"__esModule",{value:!0}),e);var ge={};_(ge,{activate:()=>ee,deactivate:()=>ue});module.exports=Y(ge);var n=E(require("vscode")),N=E(require("http")),j=E(require("fs")),M=E(require("path")),k,l,O,y,I,S,v=3737,m,x;function a(e,o,t){let c=`[${new Date().toISOString()}] [${e}]`,r=t?`${c} ${o} ${JSON.stringify(t)}`:`${c} ${o}`;l.appendLine(r),e==="ERROR"&&console.error(r)}function C(){return n.workspace.getConfiguration("aiFeedbackBridge",null)}async function R(e,o){await C().update(e,o,n.ConfigurationTarget.Global)}var D="aiFeedbackBridge.portRegistry",$=3737,q=50;async function W(e){return e.globalState.get(D,[])}async function F(e,o){await e.globalState.update(D,o)}async function X(e){let o=await W(e),t=n.workspace.name||"No Workspace",i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=Date.now()-60*60*1e3,r=o.filter(g=>g.timestamp>c),s=r.find(g=>g.workspace===i);if(s)return a("INFO",`Reusing existing port ${s.port} for workspace`),s.timestamp=Date.now(),await F(e,r),s.port;let u=new Set(r.map(g=>g.port)),d=$;for(let g=0;g<q;g++){let b=$+g;if(!u.has(b)&&await Q(b)){d=b;break}}return r.push({port:d,workspace:i,timestamp:Date.now()}),await F(e,r),a("INFO",`Auto-assigned port ${d} for workspace: ${t}`),d}async function Q(e){return new Promise(o=>{let t=N.createServer();t.once("error",i=>{i.code==="EADDRINUSE"?o(!1):o(!0)}),t.once("listening",()=>{t.close(),o(!0)}),t.listen(e)})}async function Z(e,o){let t=await W(e),i=n.workspace.workspaceFolders?.[0]?.uri.fsPath||"no-workspace",c=t.filter(r=>!(r.port===o&&r.workspace===i));await F(e,c),a("INFO",`Released port ${o}`)}async function ee(e){console.log("AI Agent Feedback Bridge is now active!"),x=e,l=n.window.createOutputChannel("AI Agent Feedback"),e.subscriptions.push(l),a("INFO","\u{1F680} AI Agent Feedback Bridge activated");let o=C(),t=o.get("port");!t||t===3737?(v=await X(e),await R("port",v),a("INFO",`Auto-selected port: ${v}`)):(v=t,a("INFO",`Using configured port: ${v}`));let i=n.workspace.name||"No Workspace",c=n.workspace.workspaceFolders?.length||0;a("INFO",`Window context: ${i} (${c} folders)`),y=n.window.createStatusBarItem(n.StatusBarAlignment.Right,101),y.command="ai-feedback-bridge.toggleAutoContinue",y.show(),e.subscriptions.push(y),I=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100),I.text="$(gear)",I.tooltip="AI Feedback Bridge Settings",I.command="ai-feedback-bridge.openSettings",I.show(),e.subscriptions.push(I),B(o);let r=n.commands.registerCommand("ai-feedback-bridge.openSettings",async()=>{await n.commands.executeCommand("workbench.action.openSettings","aiFeedbackBridge")});e.subscriptions.push(r),re(e);let s=n.commands.registerCommand("ai-agent-feedback-bridge.sendToCopilotChat",async p=>{p||(p=await n.window.showInputBox({prompt:"Enter feedback to send to Copilot Chat",placeHolder:"Describe the issue or request..."})),p&&await ae(p,{})});e.subscriptions.push(s);let u=n.commands.registerCommand("ai-feedback-bridge.toggleAutoContinue",async()=>{let w=C().get("autoContinue.enabled",!1);await R("autoContinue.enabled",!w),a("INFO",`Auto-Continue ${w?"disabled":"enabled"}`)});e.subscriptions.push(u);let d=n.commands.registerCommand("ai-feedback-bridge.changePort",async()=>{let p=await n.window.showInputBox({prompt:"Enter new port number",value:v.toString(),validateInput:w=>{let f=parseInt(w);return isNaN(f)||f<1024||f>65535?"Invalid port (1024-65535)":null}});p&&(await R("port",parseInt(p)),a("INFO",`Port changed to ${p}. Reloading VS Code...`),n.commands.executeCommand("workbench.action.reloadWindow"))});e.subscriptions.push(d);let g=n.commands.registerCommand("ai-feedback-bridge.showStatus",()=>{let p=C(),w=p.get("autoContinue.interval",300),f=p.get("autoContinue.enabled",!1),U=`\u{1F309} AI Feedback Bridge Status

Window: ${n.workspace.name||"No Workspace"}
Port: ${v}
Server: ${k?"Running \u2705":"Stopped \u274C"}
Auto-Continue: ${f?`Enabled \u2705 (every ${w}s)`:"Disabled \u274C"}
Endpoint: http://localhost:${v}`;l.appendLine(U),l.show()});e.subscriptions.push(g),H(e),se(),e.subscriptions.push(n.workspace.onDidChangeConfiguration(p=>{if(p.affectsConfiguration("aiFeedbackBridge")){let w=C();if(a("DEBUG","Configuration changed",{workspace:n.workspace.name,affectedKeys:["port","autoContinue"].filter(f=>p.affectsConfiguration(`aiFeedbackBridge.${f}`))}),p.affectsConfiguration("aiFeedbackBridge.port")){let f=w.get("port",3737);f!==v&&(a("INFO",`Port change detected: ${v} \u2192 ${f}. Reloading window...`),n.commands.executeCommand("workbench.action.reloadWindow"))}B(w),p.affectsConfiguration("aiFeedbackBridge.autoContinue")&&oe(e)}})),O=n.chat.createChatParticipant("ai-agent-feedback-bridge.agent",ne),O.iconPath=n.Uri.file(e.asAbsolutePath("icon.png")),e.subscriptions.push(O);let b=n.commands.registerCommand("ai-agent-feedback-bridge.enableAutoApproval",()=>ce(e));e.subscriptions.push(b);let A=n.commands.registerCommand("ai-agent-feedback-bridge.disableAutoApproval",()=>de());e.subscriptions.push(A);let h=n.commands.registerCommand("ai-agent-feedback-bridge.injectAutoApprovalScript",()=>le());e.subscriptions.push(h),a("INFO",`Feedback server started on http://localhost:${v}`)}function B(e){if(!y||!I)return;e.get("autoContinue.enabled",!1)?(y.text="$(sync~spin) Stop",y.tooltip=`Auto-Continue active
Click to stop`):(y.text="$(play) Start",y.tooltip=`Auto-Continue inactive
Click to start`)}async function te(e){let o=C(),t=["tasks","improvements","coverage","robustness","cleanup","commits"],i=Date.now(),c=[],r="autoContinue.lastSent",s=e.globalState.get(r,{}),u={...s};for(let d of t){let g=o.get(`autoContinue.${d}.enabled`,!0),b=o.get(`autoContinue.${d}.interval`,300),A=o.get(`autoContinue.${d}.message`,"");if(!g||!A)continue;let h=s[d]||0;(i-h)/1e3>=b&&(c.push(A),u[d]=i)}return await e.globalState.update(r,u),c.length===0?"":c.join(". ")+"."}function H(e){if(C().get("autoContinue.enabled",!1)){let c=n.workspace.name||"No Workspace";a("INFO",`\u2705 Auto-Continue enabled for window: ${c}`),S=setInterval(async()=>{try{let r=await te(e);r&&(a("INFO","[Auto-Continue] Sending periodic reminder"),await P(r,{source:"auto_continue",timestamp:new Date().toISOString()}))}catch(r){a("ERROR","[Auto-Continue] Failed to send message",{error:r})}},500)}else a("DEBUG","Auto-Continue is disabled")}function oe(e){S&&(clearInterval(S),S=void 0,l.appendLine("Auto-Continue stopped")),H(e)}async function ne(e,o,t,i){l.appendLine(`Chat request received: ${e.prompt}`),t.markdown(`### \u{1F504} Processing Feedback

`),t.markdown(`**Message:** ${e.prompt}

`),e.prompt.match(/# 🔄 FEEDBACK FROM AI AGENT SYSTEM APP/)?t.markdown(`I've received feedback from your external AI agent system. Let me analyze it:

`):t.markdown(`Processing your message...

`);try{let[r]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(r){let s=[n.LanguageModelChatMessage.User(e.prompt)],u=await r.sendRequest(s,{},i);for await(let d of u.text)t.markdown(d)}}catch(r){r instanceof n.LanguageModelError&&(l.appendLine(`Language model error: ${r.message}`),t.markdown(`\u26A0\uFE0F Error: ${r.message}

`))}return{metadata:{command:"process-feedback"}}}async function P(e,o){try{let t=`# \u{1F504} FEEDBACK FROM EXTERNAL AI SYSTEM

`;t+=`**User Feedback:**
${e}

`,o&&Object.keys(o).length>0&&(t+=`**Context:**
`,t+=`\`\`\`json
${JSON.stringify(o,null,2)}
\`\`\`

`),t+=`**Instructions:**
`,t+="Analyze this feedback and provide actionable responses. ",t+="If it's a bug, analyze the root cause. ",t+="If it's a feature request, provide an implementation plan. ",t+=`Make code changes if needed using available tools.

`,l.appendLine("Processing feedback through AI agent..."),l.appendLine(t);try{let[i]=await n.lm.selectChatModels({vendor:"copilot",family:"gpt-4o"});if(i)return l.appendLine("\u2705 AI Agent processing request..."),await n.commands.executeCommand("workbench.action.chat.open",{query:`@agent ${t}`}),setTimeout(async()=>{try{await n.commands.executeCommand("workbench.action.chat.submit")}catch{l.appendLine("Note: Could not auto-submit. User can press Enter to submit.")}},500),a("INFO","Feedback sent to AI Agent"),!0}catch(i){l.appendLine(`Could not access language model: ${i}`)}return await n.env.clipboard.writeText(t),a("INFO","Feedback copied to clipboard"),!0}catch(t){return a("ERROR",`Error sending to agent: ${t}`),!1}}async function ae(e,o){return P(e,o)}function re(e){k=N.createServer(async(o,t)=>{if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),o.method==="OPTIONS"){t.writeHead(200),t.end();return}if(o.method!=="POST"){t.writeHead(405,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Method not allowed"}));return}if(o.url==="/restart-app"||o.url?.startsWith("/restart-app?")){let s=o.url.split("?"),u=new URLSearchParams(s[1]||""),d=parseInt(u.get("delay")||"30",10);l.appendLine(`Received restart request for Electron app (delay: ${d}s)`),t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:!0,message:`App restart initiated (will restart in ${d}s)`,delay:d})),setTimeout(async()=>{try{let{exec:g}=require("child_process"),{promisify:b}=require("util"),A=b(g);l.appendLine("Killing Electron process...");try{await A('pkill -f "electron.*Code/AI"')}catch{l.appendLine("Kill command completed (process may not have been running)")}l.appendLine(`Waiting ${d} seconds before restart...`),await new Promise(p=>setTimeout(p,d*1e3));let h=n.workspace.workspaceFolders?.[0]?.uri.fsPath;h&&h.includes("/AI")?(l.appendLine(`Restarting Electron app in: ${h}`),g(`cd "${h}" && npm run dev > /dev/null 2>&1 &`),l.appendLine("Electron app restart command sent")):l.appendLine(`Could not find workspace path: ${h}`)}catch(g){l.appendLine(`Restart error: ${g}`)}},100);return}let i="",c=1024*1024,r=0;o.on("data",s=>{if(r+=s.length,r>c){a("WARN","Request body too large",{size:r}),t.writeHead(413,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Request body too large (max 1MB)"})),o.destroy();return}i+=s.toString()}),o.on("end",async()=>{try{let s=JSON.parse(i);if(!s||typeof s!="object")throw new Error("Invalid feedback structure: must be an object");if(!s.message||typeof s.message!="string")throw new Error('Invalid feedback: missing or invalid "message" field');let u=s.message.trim();if(u.length===0)throw new Error("Invalid feedback: message cannot be empty");if(u.length>5e4)throw new Error("Invalid feedback: message too long (max 50000 characters)");a("INFO","Received feedback",{messageLength:u.length,hasContext:!!s.context});let d=await P(u,s.context);t.writeHead(200,{"Content-Type":"application/json"}),t.end(JSON.stringify({success:d,message:d?"Feedback sent to AI Agent":"Failed to send to AI Agent"}))}catch(s){let u=s instanceof Error?s.message:String(s);a("ERROR","Error processing feedback",{error:u}),s instanceof SyntaxError?(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:"Invalid JSON format"}))):(t.writeHead(400,{"Content-Type":"application/json"}),t.end(JSON.stringify({error:u})))}})});try{k.listen(v,()=>{a("INFO",`\u2705 Server listening on port ${v}`)}),k.on("error",o=>{o.code==="EADDRINUSE"?a("ERROR",`Port ${v} is already in use. Please change the port in settings.`):a("ERROR","Server error occurred",{error:o.message,code:o.code})})}catch(o){a("ERROR","Failed to start server",{error:o})}e.subscriptions.push({dispose:()=>{k&&(a("INFO","Closing server"),k.close())}})}function se(){C().get("autoApproval.enabled",!1)&&a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function ie(){try{let e=M.join(x.extensionPath,"auto-approval-script.js");return j.readFileSync(e,"utf8")}catch(e){return a("ERROR","Failed to read auto-approval-script.js",e),"// Error: Could not load auto-approval script"}}function ce(e){if(m){l.appendLine("Auto-approval is already enabled");return}let t=C().get("autoApproval.intervalMs",2e3);a("INFO",`Enabling auto-approval with ${t}ms interval`),m=setInterval(async()=>{try{await n.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")}catch{}},t),e.subscriptions.push({dispose:()=>{m&&(clearInterval(m),m=void 0)}}),a("INFO",'Auto-approval enabled. Use "AI Feedback Bridge: Copy Auto-Approval Script" command to get the script.')}function de(){m?(clearInterval(m),m=void 0,l.appendLine("Auto-approval disabled"),a("INFO","Auto-approval disabled")):a("INFO","Auto-approval is not currently enabled")}function le(){let e=ie(),o=n.window.createWebviewPanel("autoApprovalScript","Auto-Approval Script",n.ViewColumn.One,{enableScripts:!0});o.webview.html=pe(e),n.env.clipboard.writeText(e),a("INFO","Auto-approval script copied to clipboard")}function pe(e){return`<!DOCTYPE html>
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
</html>`}async function ue(){k&&(k.close(),a("INFO","HTTP server closed")),S&&(clearInterval(S),S=void 0,a("INFO","Auto-continue timer cleared")),m&&(clearInterval(m),m=void 0,a("INFO","Auto-approval interval cleared")),x&&await Z(x,v),a("INFO","\u{1F44B} AI Agent Feedback Bridge deactivated")}0&&(module.exports={activate,deactivate});
