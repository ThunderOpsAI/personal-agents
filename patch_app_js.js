const fs = require('fs');
let app = fs.readFileSync('dashboard/app.js', 'utf8');

app = app.replace(
  /const taskInputStatus = document.getElementById\('taskInputStatus'\);/,
  `const taskInputStatus = document.getElementById('taskInputStatus');\n    const taskInputUrgent = document.getElementById('taskInputUrgent');`
);

app = app.replace(
  /if \(taskInputTitle\) taskInputTitle.value = isEditing \? taskOrPrefill.title : '';/,
  `if (taskInputTitle) taskInputTitle.value = isEditing ? taskOrPrefill.title : '';\n        if (taskInputUrgent) taskInputUrgent.checked = isEditing ? Boolean(taskOrPrefill.isUrgent) : false;`
);

app = app.replace(
  /const status = taskInputStatus \? taskInputStatus.value : 'needsAction';/,
  `const status = taskInputStatus ? taskInputStatus.value : 'needsAction';\n            const isUrgent = taskInputUrgent ? taskInputUrgent.checked : false;`
);

app = app.replace(
  /body: JSON.stringify\(\{ title, due, status, notes, taskListId: '@default' \}\)/,
  `body: JSON.stringify({ title, due, status, notes, isUrgent, taskListId: '@default' })`
);

app = app.replace(
  /body: JSON.stringify\(\{ id: currentTaskEditId, title, due, status, notes \}\)/,
  `body: JSON.stringify({ id: currentTaskEditId, title, due, status, notes, isUrgent })`
);

app = app.replace(
  /const res = await fetch\(`\$\{API_TASKS\}\?taskListId=@default&sync=\$\{sync\}`, \{ method: 'GET' \}\);/,
  `const res = await fetch(\`\${API_TASKS}?taskListId=@default&sync=\${sync}\`, { method: 'GET' });`
);

fs.writeFileSync('dashboard/app.js', app);
