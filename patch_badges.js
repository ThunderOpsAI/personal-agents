const fs = require('fs');
let app = fs.readFileSync('dashboard/app.js', 'utf8');

app = app.replace(
  /if \(tasksTabBadge\) tasksTabBadge\.textContent = pendingCount\.toString\(\);/,
  `if (tasksTabBadge) tasksTabBadge.textContent = pendingCount.toString();
        
        const urgentBanner = document.getElementById('urgentTasksBanner');
        const urgentText = document.getElementById('urgentTasksBannerText');
        const urgentTasks = tasks.filter(t => t.status !== 'completed' && t.isUrgent);
        
        if (urgentBanner && urgentText) {
            if (urgentTasks.length > 0) {
                urgentBanner.classList.remove('hidden');
                const titles = urgentTasks.map(t => t.title).join(', ');
                urgentText.textContent = \`URGENT TASK: \${titles}\`;
            } else {
                urgentBanner.classList.add('hidden');
            }
        }`
);

fs.writeFileSync('dashboard/app.js', app);
