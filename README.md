# byte
byte is a lightweight interpreted language for simple scripting, rapid prototyping, and educational use. it supports variables, functions, loops, conditionals, buttons, and basic graphics interactions.
flexible, and abnormally buggy.

# how to use
this is just the repository for the project, but you can follow these steps here to get byte into your site.
1. go into console on your browser (right click - inspect - console) and paste this piece of code:

```fetch('https://bytedev.neocities.org/API/byte.json')
  .then(res => res.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'byte.json';
    a.click();
  })
  .catch(err => console.error('Error fetching byte.json:', err));```

if your browser starts crying about how that pasting code you don't understand could put your security at risk, type the command: ```allow pasting``` then paste the code. don't worry, it won't do anything else other than downloading byte.json (the interpreter in json) on your computer.
