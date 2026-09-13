const fs = require('fs');
let route = fs.readFileSync('dashboard/app/api/v1/tasks/route.ts', 'utf8');

route = route.replace(
  /const \{ title, notes, due,\n      isUrgent: typeof isUrgent === "boolean" \? isUrgent : undefined, status, taskListId, isUrgent \} = body;/,
  `const { title, notes, due, status, taskListId, isUrgent } = body;`
);

route = route.replace(
  /const \{ id, title, notes, due,\n      isUrgent: typeof isUrgent === "boolean" \? isUrgent : undefined, status, isUrgent \} = body;/,
  `const { id, title, notes, due, status, isUrgent } = body;`
);

fs.writeFileSync('dashboard/app/api/v1/tasks/route.ts', route);
