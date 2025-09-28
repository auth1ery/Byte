# byte

<img src="images/Byte.png" alt="insert byte logo here" width="300">

byte is a lightweight interpreted programming language for simple scripting, rapid prototyping, and educational use. it supports variables, functions, loops, conditionals, buttons, and basic graphics interactions.
flexible, and abnormally buggy. 

# DISCLAIMER
ANY WEBSITES DEPLOYED/CONNECTED TO THIS GITHUB REPO IS A BACKUP SITE. DO NOT USE THESE SITES BUT ONLY IF NEOCITIES IS DOWN OR RATE-LIMITED.
USE THE NEOCITIES VERSION FOR THE LATEST VERSION OF BYTE: https://bytedev.neocities.org/

here are the backup sites just in case:
https://auth1ery.github.io/byte/
https://bytedev-1pd.pages.dev/
https://byte-wheat.vercel.app/

# DISCLAIMER 2 (lmao)
THIS PROGRAMMING LANGUAGE AS OF NOW IS BUGGY AND UNSTABLE. IT IS NOT DESIGNED FOR BIG BYTE PROJECTS. THE INTERPRETER ISN'T PERFECT, AND ERRORS MAY APPEAR UNEXPECTEDLY. BEWARE OF BUGS, CHECK https://bytedev.neocities.org/bugs

# how to use
this is just the repository for the project, but you can follow these steps here to get byte into your site. (ooh that rhymed)
1. go into console on your browser (right click - inspect - console) and paste this piece of code:

```
fetch('https://bytedev.neocities.org/API/byte.json')
  .then(res => res.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'byte.json';
    a.click();
  })
  .catch(err => console.error('Error fetching byte.json:', err));
```

if your browser starts crying about how that pasting code you don't understand could put your security at risk, type the command: 
`allow pasting`
then paste the code. don't worry, it won't do anything else other than downloading byte.json (the interpreter in json) on your computer, which is harmless, just looks freaky in code editors.

2. do whatever you want, put it into a folder, make bolganese spaghetti with it, tell people you made this code even though you didnt, but in this example we're gonna add it into a folder or somewhere where your site is hosted.

3. you can read it in JavaScript or Node.js with `fetch` (browser) or `fs.readFile` (Node.js).
example in Javascript:
```
fetch('./byte.json')
  .then(res => res.json())
  .then(data => console.log(data));
```

example in Node.js:
```
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./byte.json', 'utf-8'));
console.log(data);
```

then, you got it!

# links

landing page: https://bytedev.neocities.org/  
documentation: https://bytedev.neocities.org/docs  
da discord: https://discord.gg/QMDy4d5gCD
