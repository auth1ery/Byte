# byte
byte is a lightweight interpreted programming language for simple scripting, rapid prototyping, and educational use. it supports variables, functions, loops, conditionals, buttons, and basic graphics interactions.
flexible, and abnormally buggy. 

# DISCLAIMER
ANY WEBSITES DEPLOYED/CONNECTED TO THIS GITHUB REPO IS A BACKUP SITE. DO NOT USE THESE SITES, BUT ONLY IF NEOCITIES IS DOWN.
USE THE NEOCITIES VERSION: https://bytedev.neocities.org/

# DISCLAIMER 2 (lmao)
THIS PROGRAMMING LANGUAGE AS OF NOW IS BUGGY AND UNSTABLE. IT IS NOT DESIGNED FOR BIG BYTE PROJECTS. THE INTERPRETER ISN'T PERFECT, AND ERRORS MAY APPEAR UNEXPECTEDLY.

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
then paste the code. don't worry, it won't do anything else other than downloading byte.json (the interpreter in json) on your computer.

2. do whatever you want, put it into a folder, make bolganese spaghetti with it, but in this example we're gonna add it into a folder or somewhere where your site is hosted.

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

IDE: https://bytedev.neocities.org/
documentation: https://bytedev.neocities.org/docs
