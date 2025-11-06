const RADIO_TRACKS=[{title:"telecaster (ft. palm) â€” hazerred",url:"https://files.catbox.moe/wuojo2.mp3"},{title:"STRIKE OF LUCK â€” LEONJD",url:"https://files.catbox.moe/c19q4q.mp3"},{title:"core â€” hazerred",url:"https://files.catbox.moe/zq2xpc.mp3"},{title:"CRASHPARTY â€” azalea",url:"https://files.catbox.moe/46zyfi.mp3"},{title:"Alone Inteligence - Camellia",url:"https://files.catbox.moe/7rotja.mp3"},{title:"So Far So Fake - Pierce The Veil",url:"https://files.catbox.moe/y0mwqb.mp3"},{title:"webpunk (ft. nekosnicker) - vylet pony",url:"https://files.catbox.moe/5iqb7s.mp3"},{title:"questions - tristam",url:"https://files.catbox.moe/7h667b.mp3"},{title:"synthmind - spade",url:"https://files.catbox.moe/e5ocj3.mp3"},{title:"go long - hazerred",url:"https://files.catbox.moe/qrw3dd.mp3"},{title:"GLORYï¼šROAD - uma and Morimori Atsushi",url:"https://files.catbox.moe/361d1d.mp3"},{title:"Ether Strike ('Divine Mercy' Extended) - Akira Complex",url:"https://files.catbox.moe/6t44ld.mp3"},{title:"Melon - Chiru-san",url:"https://files.catbox.moe/87hkdx.mp3"},{title:"wonder - auth",url:"https://files.catbox.moe/q9t1sb.mp3"},{title:"crystallized - camellia",url:"https://files.catbox.moe/9ycbll.mp3"},{title:"children of the city - mili",url:"https://files.catbox.moe/hwy10v.mp3"},{title:"soar - chiru-san",url:"https://files.catbox.moe/qma461.mp3"},{title:"death & romance - magdalena bay",url:"https://files.catbox.moe/p0144j.mp3"},{title:"daydreamer - SPURME and Enkei",url:"https://files.catbox.moe/yx8x9l.mp3"},{title:"moment - vierre cloud",url:"https://files.catbox.moe/8q3dsn.mp3"},{title:"light/speed - candle",url:"https://files.catbox.moe/ia0k7r.mp3"},{title:"a new kind of love - frou frou",url:"https://files.catbox.moe/8nhoab.mp3"}];

(async()=>{
 const ATOM_PATH="./runtime.osdx";
 async function fetchRuntime(){try{const r=await fetch(ATOM_PATH);if(!r.ok)throw new Error();return await r.text()}catch{return null}}
 async function fetchDiagnostics(){const t=Date.now();const regs=Array.from({length:16},(_,i)=>`R${i}=0x${(Math.random()*0xFFFFF|0).toString(16).toUpperCase()}`);const heap=Array.from({length:4},(_,i)=>`blk${i}:[${Array.from({length:8},()=>Math.random().toFixed(3)).join(",")}]`);const stackDepth=Math.floor(Math.random()*8);const callStack=Array.from({length:stackDepth},(_,i)=>`fn_${i}()`);const cpuFlags=['ZF','CF','SF','OF','PF'].map(f=>`${f}=${(Math.random()>.5)|0}`).join(" ");const memMap=Array.from({length:4},(_,i)=>`${(i*0x1000).toString(16)}-${(i*0x1000+0xFF).toString(16)}:0x${(Math.random()*0xFFFF|0).toString(16)}`);console.log(`@${t} ${regs.join(" ")} | ${cpuFlags} | heap:${heap.join(" ")} | stack:[${callStack.join("->")}] | memory:${memMap.join(" ")}`)}
 const runtimeData=await fetchRuntime(); if(!runtimeData) return; setInterval(fetchDiagnostics,60000); window.fetchDiagnostics=fetchDiagnostics;
})();

// runtime & helpers
const __byte_runtime={buttons:[],keyHandlers:[]};

function logToIDE(msg){const out=document.getElementById("output");if(out){out.textContent+=msg+"\n";out.scrollTop=out.scrollHeight}else console.warn("[logToIDE] Output element not found:",msg)}

function findSong(q){q=q.toLowerCase();return RADIO_TRACKS.find(t=>t.title.toLowerCase().includes(q))}

function getPlayer(){if(!__byte_runtime.player){__byte_runtime.player=new Audio();__byte_runtime.player.volume=0.7}return __byte_runtime.player}

const libraries={music:{play:q=>{const s=findSong(q);if(!s){logToIDE(`[music] Song not found: ${q}`);return}const p=getPlayer();p.src=s.url;p.play();logToIDE(`[music] Now playing: ${s.title}`)},stop:()=>{const p=getPlayer();p.pause();p.currentTime=0;logToIDE(`[music] Stopped`)},pause:()=>{getPlayer().pause();logToIDE(`[music] Paused`)},resume:()=>{getPlayer().play();logToIDE(`[music] Resumed`)}}};
let activeLibraries={};

function extractLibrary(libName){const name=libName.toLowerCase();if(libraries[name]){activeLibraries[name]=libraries[name];logToIDE(`[system] Library loaded: ${name}`)}else logToIDE(`[system] No such library: ${name}`)}

// Byte keywords -> escaped for regex
const BYTE_KEYWORDS=["STR","EXE","RED","DLE","VAR","STO","THN","WIT","LIN","RRI","onStr","func","const","AND","NOT","IF","Change","SIPHON","Share","addNum","dleNum","Do","-c","Button","Check","Spawn.New","raycast","Hit","Keybind","velocity","require","ST","AT","TA","BT","TS","math.Add","math.Sub","math.Mul","math.Div","cringe","EXTRACT","PLAY","STOP","PAUSE","RESUME"].map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));

CodeMirror.defineMode("byte",function(){const keywordRegex=new RegExp("\\b("+BYTE_KEYWORDS.join("|")+")\\b");return{token:function(stream){if(stream.match(/^\/\/.*/))return"comment";if(stream.match(/^=\/\/.*/))return"comment";if(stream.match(/^".*?"/))return"string";if(stream.match(keywordRegex))return"keyword";stream.next();return null}}});

const editor=CodeMirror.fromTextArea(document.getElementById("editor"),{mode:"byte",theme:"dracula",lineNumbers:!0,indentUnit:2});

let errorLineHandle=null,currentLineHandle=null;
function highlightError(lineNum){if(typeof errorLineHandle==="number")try{editor.removeLineClass(errorLineHandle,"background","line-error")}catch{}editor.addLineClass(lineNum,"background","line-error");errorLineHandle=lineNum}
function highlightCurrentLine(lineNum){if(typeof currentLineHandle==="number")try{editor.removeLineClass(currentLineHandle,"background","line-current")}catch{}editor.addLineClass(lineNum,"background","line-current");currentLineHandle=lineNum}

// cleanup
function cleanupRuntime(){(__byte_runtime.buttons||[]).forEach(b=>{try{b.remove()}catch(e){}});__byte_runtime.buttons.length=0;(__byte_runtime.keyHandlers||[]).forEach(k=>{try{window.removeEventListener("keydown",k.handler)}catch(e){}});__byte_runtime.keyHandlers.length=0;document.body.querySelectorAll("button.byte-btn").forEach(b=>b.remove())}

// Interpreter core
async function runByteAsync(code){
 const output=[];const globalVars={};const functions={};const declaredVarOrder=[];const buttons={};let stopped=false;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const queue=code.split("\n").map((l,i)=>({raw:l,line:l.trim(),number:i}));
 // find first meaningful line (ignore blank/comments)
 const firstIdx=queue.findIndex(q=>q.line&&!(q.line.startsWith("//")||q.line.startsWith("=//")));
 if(firstIdx===-1||queue[firstIdx].line!=="STR"){const outEl=document.getElementById("output");if(outEl)outEl.textContent="Error: STR missing at start of script.";else console.error("Error: STR missing at start of script.");return}
 function precheckBlocks(q){
  const stack=[];const errors=[];
  for(let i=0;i<q.length;i++){
   const ln=q[i].line;
   if(!ln||ln.startsWith("//")||ln.startsWith("=//"))continue;
   if(/^func\s+[A-Za-z_]\w*\s*=$/i.test(ln)||/^[A-Za-z_]\w*\s*=$/.test(ln)){stack.push({type:"func",line:i});continue}
   if(/^-c\s*\+\s*\d+\s*=$/.test(ln)){stack.push({type:"loop",line:i});continue}
   if(ln==="-"){const top=stack.pop();if(!top||top.type!=="loop")errors.push({msg:'Unmatched loop close "-"',line:i});continue}
   if(/^end$/i.test(ln)||/^END$/.test(ln)){const top=stack.pop();if(!top||top.type!=="func")errors.push({msg:'Unmatched END / end',line:i});continue}
  }
  while(stack.length){const t=stack.pop();errors.push({msg:"Unclosed block: "+t.type,line:t.line})}
  return errors
 }
 const preErrors=precheckBlocks(queue);
 if(preErrors.length){const first=preErrors[0];highlightError(first.line);const messages=preErrors.map(e=>`Line ${e.line+1}: ${e.msg}`).join("\n");const outEl=document.getElementById("output");if(outEl)outEl.textContent="Parse Errors:\n"+messages;else console.error("Parse Errors:\n"+messages);return}
 function transformExprToJS(expr){let e=expr.replace(/\bAND\b/g,"&&").replace(/\bNOT\b/g,"!");e=e.replace(/([^!<>=])\s*=\s*([^=])/g,(m,a,b)=>`${a}==${b}`);return e}
 function isNumericString(s){return/^-?\d+(\.\d+)?$/.test(s)}
 function lookupVar(name,locals){if(locals&&Object.prototype.hasOwnProperty.call(locals,name))return locals[name];if(Object.prototype.hasOwnProperty.call(globalVars,name))return globalVars[name];return 0}
 function safeEval(expr,locals){
  const transformed=transformExprToJS(expr);
  if(!/^[\w\s\+\-\*\/\.\(\)\<\>\!\=\&\|\?"',:]+$/.test(transformed))throw new Error("Unsafe characters in expression: "+expr);
  const replaced=transformed.replace(/\b([A-Za-z_]\w*)\b/g,(m)=>{if(m==="true"||m==="false")return m;if(/^\d+(\.\d+)?$/.test(m))return m;return `__V["${m}"]`});
  const __V=Object.assign({},globalVars,locals||{});
  const fn=new Function("__V","return ("+replaced+");");
  return fn(__V)
 }
 // parse functions
 for(let i=0;i<queue.length;i++){
  const line=queue[i].line;
  let m=line.match(/^func\s+([A-Za-z_]\w*)\s*=$/i);
  if(!m)m=line.match(/^([A-Za-z_]\w*)\s*=$/);
  if(m){
   const name=m[1];const body=[];let j=i+1;
   while(j<queue.length&&!/^end$/i.test(queue[j].line)&&queue[j].line!=="END"){body.push(queue[j]);j++}
   functions[name]=body;i=j
  }
 }
 function parseConcatExpression(expr,locals){
  const parts=[];let cur="";let inQuotes=false;
  for(let i=0;i<expr.length;i++){const c=expr[i];if(c==='"'){cur+=c;inQuotes=!inQuotes;continue}if(!inQuotes&&c==='+'){parts.push(cur.trim());cur=""}else cur+=c}
  if(cur.trim()!=="")parts.push(cur.trim());
  const evaluated=parts.map(p=>{if(/^".*"$/.test(p))return p.slice(1,-1);if(isNumericString(p))return Number(p);try{if(/^[A-Za-z_]\w*$/.test(p)){const v=lookupVar(p,locals);return v}const val=safeEval(p,locals);return val}catch(err){return p}});
  return evaluated.join("")
 }
 const callStack=[];
 async function executeFunction(fnName){
  if(!functions[fnName])throw new Error("Function not found: "+fnName);
  callStack.push(fnName);
  const locals={};
  for(let i=0;i<functions[fnName].length;i++){await executeLine(functions[fnName][i],locals);if(stopped)break}
  callStack.pop()
 }
 function collectBlock(startIndex){
  const block=[];let j=startIndex+1;
  while(j<queue.length&&queue[j].line!=="-"){block.push(queue[j]);j++}
  return{block,endIndex:j}
 }
 function operateAddDle(op,amount,locals){
  let target=declaredVarOrder.length?declaredVarOrder[declaredVarOrder.length-1]:null;
  if(!target){const keys=Object.keys(globalVars);target=keys.length?keys[0]:null}
  if(!target)throw new Error(op+" has no target variable to operate on.");
  const curr=lookupVar(target,locals);const newVal=(Number(curr)||0)+(op==="add"?Number(amount):-Number(amount));
  if(locals&&!Object.prototype.hasOwnProperty.call(globalVars,target))locals[target]=newVal;else globalVars[target]=newVal
 }
 async function executeLine(lineObj,locals={}){
  const line=lineObj.line;const number=lineObj.number;
  // skip trivial or already-handled lines
  if(!line||line.startsWith("//")||line.startsWith("=//")||line==="STR"||line==="-"||lineObj._skipped) return;
  highlightCurrentLine(number);
  try{
   let m;
   if(m=line.match(/^VAR\s*\[\s*([A-Za-z_]\w*)\s*\](?:\s+([A-Za-z_]\w*))?$/)){const name=m[1];globalVars[name]=0;declaredVarOrder.push(name);return}
   if(m=line.match(/^const\s+([A-Za-z_]\w*)\s*=\s*(.+)$/)){const name=m[1];const expr=m[2].trim();const val=safeEval(expr,locals);globalVars[name]=val;return}
   if(m=line.match(/^([A-Za-z_]\w*)\s*=\s*"([^"]+)"\s*EXE\s*\[([A-Za-z_]\w*)\]\s*$/)){const varName=m[1];const key=m[2];const fn=m[3];globalVars[varName]=key;const keyHandler=function(e){if(e.key.toUpperCase()===key.toUpperCase()){if(functions[fn])executeFunction(fn).catch(()=>{})}};window.addEventListener("keydown",keyHandler);__byte_runtime.keyHandlers.push({key,handler:keyHandler});return}
   if(m=line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)){const name=m[1];const expr=m[2].trim();const val=( /^".*"$/.test(expr) )?expr.slice(1,-1):safeEval(expr,locals);if(Object.prototype.hasOwnProperty.call(globalVars,name))globalVars[name]=val;else if(callStack.length>0)locals[name]=val;else globalVars[name]=val;if(!declaredVarOrder.includes(name))declaredVarOrder.push(name);return}
   if(line.startsWith("RRI")){m=line.match(/^RRI\s*\(\s*([\s\S]*?)\s*\)\s*-\s*$/);if(!m)throw new Error("Invalid RRI syntax");const inner=m[1];const text=parseConcatExpression(inner,locals);output.push(String(text));return}
   if(line.startsWith("WIT")){m=line.match(/^WIT\s*=\s*([\d.]+)\s*$/);if(!m)throw new Error("Invalid WIT syntax");await wait(Number(m[1])*1000);return}
   if(line.startsWith("EXE")){m=line.match(/^EXE\s*\[\s*([A-Za-z_]\w*)\s*\]\s*$/);if(!m)throw new Error("Invalid EXE syntax");const fnName=m[1];await executeFunction(fnName);return}
   if(line.startsWith("Button")){m=line.match(/^Button\s*\+\s*"([^"]+)"(?:\s+EXE\s*\[\s*([A-Za-z_]\w*)\s*\])?\s*$/);if(!m)throw new Error("Invalid Button syntax");const label=m[1];const fn=m[2];const btn=document.createElement("button");btn.textContent=label;btn.classList.add("byte-btn");document.body.appendChild(btn);buttons[label]=btn;__byte_runtime.buttons.push(btn);if(fn){const listener=async()=>{await executeFunction(fn).catch(()=>{})};btn.addEventListener("click",listener)}return}
   if(line.startsWith("-c")){m=line.match(/^-c\s*\+\s*(\d+)\s*=\s*$/);if(!m)throw new Error("Invalid loop syntax");const count=Number(m[1]);const {block,endIndex}=collectBlock(number);if(!block.length) return; // mark block lines as handled so they won't be executed again by the main loop
    for(let k=number+1;k<=endIndex;k++)if(queue[k])queue[k]._skipped=true;
    for(let iter=0;iter<count;iter++){for(let b=0;b<block.length;b++){await executeLine(block[b],locals);if(stopped)break}if(stopped)break}return}
   m=line.match(/^-c\s*\+\s*(\d+)\s*=\s*(.+)-\s*$/);if(m){const count=Number(m[1]);const cmd=m[2].trim();for(let i=0;i<count;i++){await executeLine({line:cmd,number},locals);if(stopped)break}return}
   if(line.startsWith("LIN")){m=line.match(/^LIN\s+(.+)$/);if(!m)throw new Error("Invalid LIN syntax");globalVars["__LIN"]=m[1].trim();return}
   if(line.startsWith("Change")){m=line.match(/^Change\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);if(!m)throw new Error("Invalid Change syntax");const varName=m[1];const expr=m[2].trim();const val=safeEval(expr,locals);if(Object.prototype.hasOwnProperty.call(globalVars,varName))globalVars[varName]=val;else if(callStack.length>0)locals[varName]=val;else globalVars[varName]=val;return}
   if(line.startsWith("SIPHON")){m=line.match(/^SIPHON\s*(?:\+\s*([\d.]+))?\s*$/);if(!m)throw new Error("Invalid SIPHON syntax");const secs=Number(m[1]||0);if(secs>0)await wait(secs*1000);const lastVar=declaredVarOrder.length?declaredVarOrder[declaredVarOrder.length-1]:null; if(lastVar)globalVars[`${lastVar}_siphoned`]=!0;return}
   if(line.startsWith("Share")){m=line.match(/^Share\s*\[\s*([A-Za-z_]\w*)\s*\]\s*$/);if(!m)throw new Error("Invalid Share syntax");const varName=m[1];globalVars[varName+"_shared"]=lookupVar(varName,locals);return}
   if(line.startsWith("addNum")){m=line.match(/^addNum\s*\+\s*([\d.]+)\s*$/);if(!m)throw new Error("Invalid addNum syntax");operateAddDle("add",Number(m[1]),locals);return}
   if(line.startsWith("dleNum")){m=line.match(/^dleNum\s*\+\s*([\d.]+)\s*$/);if(!m)throw new Error("Invalid dleNum syntax");operateAddDle("dle",Number(m[1]),locals);return}
   if(line.startsWith("do")||line.startsWith("Do")){m=line.match(/^(?:do|Do)\s+([A-Za-z_]\w*)\s*$/);if(!m)throw new Error("Invalid do syntax");const name=m[1];if(functions[name]){await executeFunction(name);return}const possible=lookupVar(name,locals);if(typeof possible==="string"&&functions[possible]){await executeFunction(possible);return}throw new Error("do target not found: "+name)}
   if(line.startsWith("IF")){m=line.match(/^IF\s+(.+)\s+THN\s*$/);if(m){const expr=m[1].trim();const block=[];let j=number+1;while(j<queue.length&&!/^(END|end)$/.test(queue[j].line)){block.push(queue[j]);j++}const cond=safeEval(expr,locals);if(cond){for(let b=0;b<block.length;b++){await executeLine(block[b],locals);if(stopped)break}}return}}
   if(line==="STO"){stopped=!0;return}
   if(line.startsWith("raycast")||line.startsWith("Hit")||line.startsWith("velocity")){m=line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);if(m){const name=m[1];const expr=m[2].trim();const val=/^".*"$/.test(expr)?expr.slice(1,-1):safeEval(expr,locals);if(Object.prototype.hasOwnProperty.call(globalVars,name))globalVars[name]=val;else if(callStack.length>0)locals[name]=val;else globalVars[name]=val;return}}
   if(/^math\.(Add|Sub|Mul|Div)\s+.+=$/i.test(line)){const mm=line.match(/^math\.(Add|Sub|Mul|Div)\s+(.+?)\s*=$/i);if(!mm)throw new Error("Invalid math syntax");const op=mm[1].toLowerCase();const expr=mm[2].trim();const parts=expr.match(/^(do\s+[A-Za-z_]\w*|\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(do\s+[A-Za-z_]\w*|\d+(?:\.\d+)?)$/i);if(!parts)throw new Error("Invalid math expression format");let left=parts[1];let operator=parts[2];let right=parts[3];if(/^do\s+/i.test(left))left=lookupVar(left.replace(/^do\s+/i,"").trim(),locals);else left=Number(left);if(/^do\s+/i.test(right))right=lookupVar(right.replace(/^do\s+/i,"").trim(),locals);else right=Number(right);let result;switch(op){case"add":result=left+right;break;case"sub":result=left-right;break;case"mul":result=left*right;break;case"div":result=left/right;break}output.push(result);return}
   if(line==="cringe"){const audio=new Audio("https://files.catbox.moe/ys7ft9.mp3");audio.play().catch(()=>console.warn("Autoplay blocked"));const lyrics=["Itâ€™s in the greenery, the light and cells combined","Sunlight hits the leaves, energy starts to climb","I donâ€™t know no nothin' 'bout no rest, I'm alive","Glucose fuels this process quickly, keepinâ€™ it high","In chloroplasts, the base cycle starts taking form","Energy flows, as carbon bonds are being born","From air to leaves, all the electrons are on tour","Lifeâ€™s a change, through light, this power, it restores","Woah-oh-oh","This is how the process flows","Woah-oh-oh","I guess this is how the process flows","Through the dark to the light, leaves the green, what a sight","Carbon now takes a turn through the chlorophyll unseen","See, I believe the cycle starts when lightâ€™s inside","Cell picks it up, the carbonâ€™s fixed, the plant now thrives","Roots down in soil, as the water fills the zone","Cells workinâ€™ fast, and the energyâ€™s on a loan","Sunâ€™s got its role, hits the chlorophyll with its gold","Fuelin' the growth, for plants and earth, the world unfolds","Ain't no rest for photosynthesizers on the go","In the light of it, this is how the process flows","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi","skibidi"];(async()=>{for(let i=0;i<lyrics.length;i++){output.push(lyrics[i]);const outEl=document.getElementById("output");if(outEl)outEl.textContent=output.join("\n");await new Promise(r=>setTimeout(r,1e3))}})();return}
   if(/.*\bcringe\b.*/.test(line)&&line!=="cringe")throw new Error("Error on line ?: why you add thing to it too");
   if(line.toUpperCase().startsWith("EXTRACT ")) {const libName=line.slice(8).trim().toLowerCase();extractLibrary(libName);return}
   if(line.toUpperCase().startsWith("PLAY ")) {const query=line.slice(5).trim();if(activeLibraries.music?.play)activeLibraries.music.play(query);else logToIDE(`[error] Music library not loaded. Use: EXTRACT music`);return}
   if(line.toUpperCase()==="STOP"){if(activeLibraries.music?.stop)activeLibraries.music.stop();else logToIDE(`[error] Music library not loaded. Use: EXTRACT music`);return}
   if(line.toUpperCase()==="PAUSE"){if(activeLibraries.music?.pause)activeLibraries.music.pause();else logToIDE(`[error] Music library not loaded. Use: EXTRACT music`);return}
   if(line.toUpperCase()==="RESUME"){if(activeLibraries.music?.resume)activeLibraries.music.resume();else logToIDE(`[error] Music library not loaded. Use: EXTRACT music`);return}
   throw new Error("Unknown command, double check: "+line)
  }catch(err){highlightError(number);output.push(`Error on line ${number+1}: ${err.message}`);if(callStack.length>0)output.push("Stack trace:\n"+callStack.join(" -> "));throw err}
 }
 // run onStr
 if(functions["onStr"]){try{await executeFunction("onStr")}catch(e){}}
 // execute top-level lines
 try{for(let i=0;i<queue.length;i++){try{await executeLine(queue[i],{})}catch(e){break}if(stopped)break}}catch(e){}finally{if(typeof currentLineHandle==="number"){try{editor.removeLineClass(currentLineHandle,"background","line-current")}catch(e){}currentLineHandle=null}}
 const outEl=document.getElementById("output");if(outEl)outEl.textContent=output.join("\n");else console.log(output.join("\n"))
}

// Buttons
document.getElementById("run").addEventListener("click",async()=>{
 cleanupRuntime();const outEl=document.getElementById("output");if(outEl)outEl.textContent="";if(typeof errorLineHandle==="number"){try{editor.removeLineClass(errorLineHandle,"background","line-error")}catch(e){ }errorLineHandle=null}if(typeof currentLineHandle==="number"){try{editor.removeLineClass(currentLineHandle,"background","line-current")}catch(e){}currentLineHandle=null}
 await runByteAsync(editor.getValue());
});
document.getElementById("clear").addEventListener("click",()=>{
 cleanupRuntime();const outEl=document.getElementById("output");if(outEl)outEl.textContent="";if(typeof errorLineHandle==="number"){try{editor.removeLineClass(errorLineHandle,"background","line-error")}catch(e){}errorLineHandle=null}if(typeof currentLineHandle==="number"){try{editor.removeLineClass(currentLineHandle,"background","line-current")}catch(e){}currentLineHandle=null}
});
document.getElementById("docs").addEventListener("click",()=>{window.open("https://bytewiki.miraheze.org/wiki/Main_Page","_blank")});
