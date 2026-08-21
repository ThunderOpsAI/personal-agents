const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const key = envFile.split('GEMINI_API_KEY=')[1].split('\n')[0].trim();
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    console.log(data.models.map(m => m.name).join('\n'));
  })
  .catch(console.error);
