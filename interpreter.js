// ===============================
// Runtime trackers & helpers
// ===============================
const __byte_runtime = { buttons: [], keyHandlers: [] };

// ===============================
// Byte keywords for highlighting
// ===============================
const BYTE_KEYWORDS = [
  "STR","EXE","RED","DLE","VAR","STO","THN","WIT","LIN","RRI",
  "onStr","func","const","AND","NOT","IF",
  "Change","SIPHON","Share","addNum","dleNum","Do","-c",
  "Button","Check","Spawn.New","raycast","Hit","Keybind","velocity","require",
  "ST","AT","TA","BT","TS"
].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // escape for regex

CodeMirror.defineMode("byte", function(config){
  const keywordRegex = new RegExp("\\b(" + BYTE_KEYWORDS.join("|") + ")\\b");
  return {
    token: function(stream) {
      if (stream.match(/^\/\/.*/)) return "comment";
      if (stream.match(/^=\/\/.*/)) return "comment";
      if (stream.match(/^".*?"/)) return "string";
      if (stream.match(keywordRegex)) return "keyword";
      stream.next();
      return null;
    }
  };
});

const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "byte", theme: "dracula", lineNumbers: true, indentUnit: 2
});

let errorLineHandle = null;
let currentLineHandle = null;
function highlightError(lineNum){
  if (errorLineHandle) editor.removeLineClass(errorLineHandle, "background", "line-error");
  errorLineHandle = editor.addLineClass(lineNum, "background", "line-error");
}
function highlightCurrentLine(lineNum){
  if (currentLineHandle) editor.removeLineClass(currentLineHandle, "background", "line-current");
  currentLineHandle = editor.addLineClass(lineNum, "background", "line-current");
}

// ===============================
// Cleanup runtime (buttons & key handlers)
// ===============================
function cleanupRuntime(){
  // remove buttons created by previous runs
  (__byte_runtime.buttons || []).forEach(b=>{
    try{ b.remove(); }catch(e){}
  });
  __byte_runtime.buttons.length = 0;

  // remove key handlers
  (__byte_runtime.keyHandlers || []).forEach(k=>{
    try{ window.removeEventListener("keydown", k.handler); }catch(e){}
  });
  __byte_runtime.keyHandlers.length = 0;

  // Also remove any orphan DOM buttons with class 'byte-btn' just in case
  document.body.querySelectorAll("button.byte-btn").forEach(b=>b.remove());
}

// ===============================
// Byte Interpreter Core
// ===============================
async function runByteAsync(code){
  const output = [];
  const globalVars = {};           // declared with VAR or const at top-level
  const functions = {};            // parsed functions
  const declaredVarOrder = [];     // for addNum/dleNum fallback
  const buttons = {};
  let stopped = false;
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const queue = code.split("\n").map((l,i)=>({ raw: l, line: l.trim(), number: i }));

  // Basic sanity shit
  if (queue.length === 0 || queue[0].line !== "STR"){
    document.getElementById("output").textContent = "Error: STR missing at start of script.";
    return;
  }

  // ===============================
  // Pre-parse block checker (detect unmatched/unfinished blocks)
  // ===============================
  function precheckBlocks(q){
    const stack = [];
    const errors = [];
    for (let i=0;i<q.length;i++){
      const ln = q[i].line;
      // ignore blank lines/comments
      if (!ln || ln.startsWith("//") || ln.startsWith("=//")) continue;

      // function header: func Name =  OR Name =
      if (/^func\s+[A-Za-z_]\w*\s*=$/i.test(ln) || /^[A-Za-z_]\w*\s*=$/.test(ln)){
        // avoid counting assignment lines that are part of code (we only treat lines with only "name =" as function header)
        stack.push({type:'func', line:i});
        continue;
      }
      // loop header: -c + N =
      if (/^-c\s*\+\s*\d+\s*=$/.test(ln)){
        stack.push({type:'loop', line:i});
        continue;
      }
      // loop close '-'
      if (ln === "-"){
        const top = stack.pop();
        if (!top || top.type !== 'loop'){
          errors.push({msg: 'Unmatched loop close "-"', line:i});
        }
        continue;
      }
      // end for functions/conditionals
      if (/^end$/i.test(ln) || /^END$/.test(ln) || /^END$/.test(ln)){
        const top = stack.pop();
        if (!top || top.type !== 'func'){
          errors.push({msg: 'Unmatched END / end', line:i});
        }
        continue;
      }
    }
    // any remaining unmatched blocks
    while (stack.length){
      const t = stack.pop();
      errors.push({msg: 'Unclosed block: ' + t.type, line: t.line});
    }
    return errors;
  }

  const preErrors = precheckBlocks(queue);
  if (preErrors.length){
    // highlight first error, show messages
    const first = preErrors[0];
    highlightError(first.line);
    const messages = preErrors.map(e=>`Line ${e.line+1}: ${e.msg}`).join("\n");
    document.getElementById("output").textContent = "Parse Errors:\n" + messages;
    return;
  }

  // Helper: safe expression evaluator (supports = for equality, AND, NOT, numeric ops, comparison)
  function transformExprToJS(expr){
    // Replace Byte tokens with JS equivalents
    // 'AND' -> '&&', 'NOT' -> '!'
    let e = expr.replace(/\bAND\b/g, "&&").replace(/\bNOT\b/g, "!");
    // Replace single '=' for comparisons (avoid => and >= <= !=)
    e = e.replace(/([^!<>=])\s*=\s*([^=])/g, (m, a, b) => `${a}==${b}`);
    return e;
  }

  function isNumericString(s){
    return /^-?\d+(\.\d+)?$/.test(s);
  }

  function lookupVar(name, locals){
    if (locals && locals.hasOwnProperty(name)) return locals[name];
    if (globalVars.hasOwnProperty(name)) return globalVars[name];
    // Unset variables default to 0 per many examples
    return 0;
  }

  function safeEval(expr, locals){
    const transformed = transformExprToJS(expr);
    // Allow only characters that are safe for our small expression language
    if (!/^[\w\s\+\-\*\/\.\(\)\<\>\!\=\&\|\?"',:]+$/.test(transformed)){
      throw new Error("Unsafe characters in expression: " + expr);
    }
    // Replace variable names by references into a local object '__V'
    const replaced = transformed.replace(/\b([A-Za-z_]\w*)\b/g, (m)=>{
      if (m === "true" || m === "false") return m;
      if (/^\d+(\.\d+)?$/.test(m)) return m;
      return `__V["${m}"]`;
    });
    const __V = Object.assign({}, globalVars, locals || {});
    // eslint-disable-next-line no-new-func
    const fn = new Function("__V", "return (" + replaced + ");");
    return fn(__V);
  }

  // Parse functions and multi-line blocks
  for (let i = 0; i < queue.length; i++){
    const line = queue[i].line;
    let m = line.match(/^func\s+([A-Za-z_]\w*)\s*=$/i);
    if (!m){
      m = line.match(/^([A-Za-z_]\w*)\s*=$/);
    }
    if (m){
      const name = m[1];
      const body = [];
      let j = i + 1;
      while (j < queue.length && !/^end$/i.test(queue[j].line) && queue[j].line !== "END"){
        body.push(queue[j]);
        j++;
      }
      functions[name] = body;
      i = j; // skip to end
    }
  }

  // Helper: parse concatenation expression inside RRI parentheses
  function parseConcatExpression(expr, locals){
    const parts = [];
    let cur = "";
    let inQuotes = false;
    for (let i=0;i<expr.length;i++){
      const c = expr[i];
      if (c === '"') {
        cur += c;
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && c === '+'){
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    if (cur.trim() !== "") parts.push(cur.trim());
    const evaluated = parts.map(p=>{
      if (/^".*"$/.test(p)) return p.slice(1,-1);
      if (isNumericString(p)) return Number(p);
      try {
        if (/^[A-Za-z_]\w*$/.test(p)){
          const v = lookupVar(p, locals);
          return v;
        }
        const val = safeEval(p, locals);
        return val;
      } catch (err){
        return p;
      }
    });
    return evaluated.join("");
  }

  // Execution context stack (for local scoping)
  const callStack = [];

  async function executeFunction(fnName){
    if (!functions[fnName]) throw new Error("Function not found: " + fnName);
    callStack.push(fnName);
    const locals = {};
    for (let i=0;i<functions[fnName].length;i++){
      await executeLine(functions[fnName][i], locals);
      if (stopped) break;
    }
    callStack.pop();
  }

  // Utility: collect block lines for "-c + N =" loop (multi-line until single line '-')
  function collectBlock(startIndex){
    const block = [];
    let j = startIndex + 1;
    while (j < queue.length && queue[j].line !== "-"){
      block.push(queue[j]);
      j++;
    }
    return { block, endIndex: j };
  }

  // addNum/dleNum behavior: operate on most recently declared VAR or named variable if provided
  function operateAddDle(op, amount, locals){
    let target = declaredVarOrder.length ? declaredVarOrder[declaredVarOrder.length - 1] : null;
    if (!target){
      const keys = Object.keys(globalVars);
      target = keys.length ? keys[0] : null;
    }
    if (!target) throw new Error(op + " has no target variable to operate on.");
    const curr = lookupVar(target, locals);
    const newVal = (Number(curr) || 0) + (op === "add" ? Number(amount) : -Number(amount));
    if (locals && !globalVars.hasOwnProperty(target)){
      locals[target] = newVal;
    } else {
      globalVars[target] = newVal;
    }
  }

  // idk what this fucking does but its here ig
  async function executeLine(lineObj, locals = {}){
    const { line, number } = lineObj;
    highlightCurrentLine(number);

    try{
      if (!line || line.startsWith("//") || line.startsWith("=//") || line === "STR") return;
      let m;
      if (m = line.match(/^VAR\s*\[\s*([A-Za-z_]\w*)\s*\](?:\s+([A-Za-z_]\w*))?$/)){
        const name = m[1];
        globalVars[name] = 0;
        declaredVarOrder.push(name);
        return;
      }

      if (m = line.match(/^const\s+([A-Za-z_]\w*)\s*=\s*(.+)$/)){
        const name = m[1];
        const expr = m[2].trim();
        const val = safeEval(expr, locals);
        globalVars[name] = val;
        return;
      }

      if (m = line.match(/^([A-Za-z_]\w*)\s*=\s*"([^"]+)"\s*EXE\s*\[([A-Za-z_]\w*)\]\s*$/)){
        const varName = m[1];
        const key = m[2];
        const fn = m[3];
        globalVars[varName] = key;
        const keyHandler = function(e){
          if (e.key.toUpperCase() === key.toUpperCase()){
            if (functions[fn]) executeFunction(fn).catch(()=>{});
          }
        };
        window.addEventListener("keydown", keyHandler);
        __byte_runtime.keyHandlers.push({ key, handler: keyHandler });
        return;
      }

      if (m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)){
        const name = m[1];
        const expr = m[2].trim();
        const val = ( /^".*"$/.test(expr) )
          ? expr.slice(1,-1)
          : safeEval(expr, locals);
        if (globalVars.hasOwnProperty(name)){
          globalVars[name] = val;
        } else if (callStack.length > 0){
          locals[name] = val;
        } else {
          globalVars[name] = val;
        }
        if (!declaredVarOrder.includes(name)) declaredVarOrder.push(name);
        return;
      }

      if (line.startsWith("RRI")){
        m = line.match(/^RRI\s*\(\s*([\s\S]*?)\s*\)\s*-\s*$/);
        if (!m) throw new Error("Invalid RRI syntax");
        const inner = m[1];
        const text = parseConcatExpression(inner, locals);
        output.push(String(text));
        return;
      }

      if (line.startsWith("WIT")){
        m = line.match(/^WIT\s*=\s*([\d.]+)\s*$/);
        if (!m) throw new Error("Invalid WIT syntax");
        await wait(Number(m[1]) * 1000);
        return;
      }

      if (line.startsWith("EXE")){
        m = line.match(/^EXE\s*\[\s*([A-Za-z_]\w*)\s*\]\s*$/);
        if (!m) throw new Error("Invalid EXE syntax");
        const fnName = m[1];
        await executeFunction(fnName);
        return;
      }

      if (line.startsWith("Button")){
        m = line.match(/^Button\s*\+\s*"([^"]+)"(?:\s+EXE\s*\[\s*([A-Za-z_]\w*)\s*\])?\s*$/);
        if (!m) throw new Error("Invalid Button syntax");
        const label = m[1];
        const fn = m[2];
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.classList.add("byte-btn");
        document.body.appendChild(btn);
        buttons[label] = btn;
        __byte_runtime.buttons.push(btn);
        if (fn){
          const listener = async ()=>{ await executeFunction(fn).catch(()=>{}); };
          btn.addEventListener("click", listener);
        }
        return;
      }

      if (line.startsWith("-c")){
        m = line.match(/^-c\s*\+\s*(\d+)\s*=\s*$/);
        if (!m) throw new Error("Invalid loop syntax");
        const count = Number(m[1]);
        const { block, endIndex } = collectBlock(number);
        if (!block.length) return;
        for (let iter=0; iter<count; iter++){
          for (let b=0; b<block.length; b++){
            await executeLine(block[b], locals);
            if (stopped) break;
          }
          if (stopped) break;
        }
        return;
      }

      m = line.match(/^-c\s*\+\s*(\d+)\s*=\s*(.+)-\s*$/);
      if (m){
        const count = Number(m[1]);
        const cmd = m[2].trim();
        for (let i=0;i<count;i++){
          await executeLine({line: cmd, number}, locals);
          if (stopped) break;
        }
        return;
      }

      if (line.startsWith("LIN")){
        m = line.match(/^LIN\s+(.+)$/);
        if (!m) throw new Error("Invalid LIN syntax");
        globalVars["__LIN"] = m[1].trim();
        return;
      }

      if (line.startsWith("Change")){
        m = line.match(/^Change\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (!m) throw new Error("Invalid Change syntax");
        const varName = m[1];
        const expr = m[2].trim();
        const val = safeEval(expr, locals);
        if (globalVars.hasOwnProperty(varName)) globalVars[varName] = val;
        else if (callStack.length > 0) locals[varName] = val;
        else globalVars[varName] = val;
        return;
      }

      if (line.startsWith("SIPHON")){
        m = line.match(/^SIPHON\s*(?:\+\s*([\d.]+))?\s*$/);
        if (!m) throw new Error("Invalid SIPHON syntax");
        const secs = Number(m[1] || 0);
        if (secs > 0) await wait(secs*1000);
        const lastVar = declaredVarOrder.length ? declaredVarOrder[declaredVarOrder.length-1] : null;
        if (lastVar) {
          globalVars[`${lastVar}_siphoned`] = true;
        }
        return;
      }

      if (line.startsWith("Share")){
        m = line.match(/^Share\s*\[\s*([A-Za-z_]\w*)\s*\]\s*$/);
        if (!m) throw new Error("Invalid Share syntax");
        const varName = m[1];
        globalVars[varName + "_shared"] = lookupVar(varName, locals);
        return;
      }

      if (line.startsWith("addNum")){
        m = line.match(/^addNum\s*\+\s*([\d.]+)\s*$/);
        if (!m) throw new Error("Invalid addNum syntax");
        operateAddDle("add", Number(m[1]), locals);
        return;
      }

      if (line.startsWith("dleNum")){
        m = line.match(/^dleNum\s*\+\s*([\d.]+)\s*$/);
        if (!m) throw new Error("Invalid dleNum syntax");
        operateAddDle("dle", Number(m[1]), locals);
        return;
      }

      if (line.startsWith("do") || line.startsWith("Do")){
        m = line.match(/^(?:do|Do)\s+([A-Za-z_]\w*)\s*$/);
        if (!m) throw new Error("Invalid do syntax");
        const name = m[1];
        if (functions[name]) {
          await executeFunction(name);
          return;
        }
        const possible = lookupVar(name, locals);
        if (typeof possible === "string" && functions[possible]) {
          await executeFunction(possible);
          return;
        }
        throw new Error("do target not found: " + name);
      }

      if (line.startsWith("IF")){
        m = line.match(/^IF\s+(.+)\s+THN\s*$/);
        if (m){
          const expr = m[1].trim();
          const block = [];
          let j = number + 1;
          while (j < queue.length && !/^(END|end)$/.test(queue[j].line)){
            block.push(queue[j]);
            j++;
          }
          const cond = safeEval(expr, locals);
          if (cond){
            for (let b=0; b<block.length; b++){
              await executeLine(block[b], locals);
              if (stopped) break;
            }
          }
          return;
        }
      }

      if (line === "STO"){
        stopped = true;
        return;
      }
// goo goo gaga
      if (line.startsWith("raycast") || line.startsWith("Hit") || line.startsWith("velocity")){
        m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (m){
          const name = m[1];
          const expr = m[2].trim();
          const val = /^".*"$/.test(expr) ? expr.slice(1,-1) : safeEval(expr, locals);
          if (globalVars.hasOwnProperty(name)) globalVars[name] = val;
          else if (callStack.length > 0) locals[name] = val;
          else globalVars[name] = val;
          return;
        }
      }

      throw new Error("Unknown command: " + line);
    }catch(err){
      highlightError(number);
      output.push(`Error on line ${number+1}: ${err.message}`);
      if (callStack.length > 0) output.push("Stack trace:\n" + callStack.join(" -> "));
      throw err;
    }
  }

  // run onStr automatically if present (docs: onStr runs at script start)
  if (functions["onStr"]) {
    try {
      await executeFunction("onStr");
    } catch(e){
      // stop if onStr errors
    }
  }

  // Execute top-level lines (after parsing functions)
  try{
    for (let i=0;i<queue.length;i++){
      await executeLine(queue[i], {});
      if (stopped) break;
    }
  }catch(e){
    // stop on error (already reported)
  } finally {
    if (currentLineHandle){
      editor.removeLineClass(currentLineHandle, "background", "line-current");
      currentLineHandle = null;
    }
  }

  document.getElementById("output").textContent = output.join("\n");
}

// =========================
// Buttons (Run / Clear / Docs) with cleanup
// =========================
document.getElementById("run").addEventListener("click", async ()=>{
  // cleanup any previous runtime artifacts & highlights
  cleanupRuntime();
  document.getElementById("output").textContent = "";
  if (errorLineHandle){ editor.removeLineClass(errorLineHandle,"background","line-error"); errorLineHandle = null; }
  if (currentLineHandle){ editor.removeLineClass(currentLineHandle,"background","line-current"); currentLineHandle = null; }

  await runByteAsync(editor.getValue());
});
document.getElementById("clear").addEventListener("click", ()=>{
  cleanupRuntime();
  document.getElementById("output").textContent = "";
  if (errorLineHandle){ editor.removeLineClass(errorLineHandle,"background","line-error"); errorLineHandle = null; }
  if (currentLineHandle){ editor.removeLineClass(currentLineHandle,"background","line-current"); currentLineHandle = null; }
});
document.getElementById("docs").addEventListener("click", ()=>{
  window.open("https://bytedev.neocities.org/docs.html", "_blank");
});
