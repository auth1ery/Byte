Thanks for downloading Byte's source files! Here's how you can use this:  

1. You can use this, modify it, redistribute it, all under the MIT license. You have to atleast reference me or give me credit if you are making your projects public, or show off to people.

2. This works in the browser -- only. You can convert it to any other programming language but it is not fun. You basically have to rebuild Byte from scratch using source.js as the reference. I will not give any converted files to your programming langauge of choice, nor even make one.

3. source.js depends on runtime.osdx. These two files are significant.

4. Please remember that Byte is built on CodeMirror 5. If you see any CodeMirror 5 APIs or references, it is purely a coincidence.

5. If you notice that some parts of source.js is different from the actual IDE's interpreter.js, I just removed some parts that reference the actual IDE for convenience.

6. To actually run Byte, you should at least add this to run programs.

document.getElementById("run").addEventListener("click",async()=>{
 cleanupRuntime();const outEl=document.getElementById("output");if(outEl)outEl.textContent="";if(typeof errorLineHandle==="number"){try{editor.removeLineClass(errorLineHandle,"background","line-error")}catch(e){ }errorLineHandle=null}if(typeof currentLineHandle==="number"){try{editor.removeLineClass(currentLineHandle,"background","line-current")}catch(e){}currentLineHandle=null}
 await runByteAsync(editor.getValue());
});

This will make sure you can run programs.

I hope to see your projects with this someday.

-- auth ＼(^-^)／

