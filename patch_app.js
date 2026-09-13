const fs = require('fs');
for (const file of ['dashboard/public/app.js', 'dashboard/app.js']) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Mock Data changes
    content = content.replace(
        /{ id: 'yest_med_2100', time: '09:00 PM', title: 'Evening Meditation Protocol', item_type: 'meditation', status: 'completed' }/g,
        "{ id: 'yest_med_2100', time: '09:00 PM', title: 'Sleep Meditation', item_type: 'meditation', status: 'completed' }"
    );
    content = content.replace(
        /{ id: 'tom_med_2100', time: '09:00 PM', title: 'Evening Meditation Protocol & Somatic Unwind', item_type: 'meditation', status: 'pending' },\n\s*{ id: 'tom_rest_0000', time: '12:00 AM', title: 'Midnight Restorative Decompression', item_type: 'meditation', status: 'pending' }/g,
        "{ id: 'tom_yoga_1700', time: '05:00 PM', title: 'Shoulder & Neck Decompression', item_type: 'yoga', status: 'pending' },\n            { id: 'tom_med_2100', time: '09:00 PM', title: 'Sleep Meditation', item_type: 'meditation', status: 'pending' }"
    );

    // 2. Redirect meditation
    content = content.replace(
        /function startRunnerModal\(id\) \{\n\s*runnerModal.classList.remove\('hidden'\);\n\s*const rawId = \(id \|\| ''\).toLowerCase\(\).trim\(\);/g,
        "function startRunnerModal(id) {\n        const rawId = (id || '').toLowerCase().trim();\n        if (rawId.includes('meditation')) {\n            window.open('https://insighttimer.com', '_blank');\n            return;\n        }\n\n        runnerModal.classList.remove('hidden');"
    );

    // 3. Export chat event listener
    content = content.replace(
        /btnCloseRumbleChat.addEventListener\('click', \(\) => \{\n\s*rumbleChatModal.classList.add\('hidden'\);\n\s*\}\);\n\n\s*let pendingChatAction/g,
        "btnCloseRumbleChat.addEventListener('click', () => {\n        rumbleChatModal.classList.add('hidden');\n    });\n\n    const btnExportChat = document.getElementById('btnExportChat');\n    if (btnExportChat) {\n        btnExportChat.addEventListener('click', () => {\n            const msgs = Array.from(rumbleChatMessages.querySelectorAll('.message')).map(m => {\n                const isUser = m.classList.contains('user-message');\n                return { role: isUser ? 'user' : 'rumble', text: m.innerText };\n            });\n            navigator.clipboard.writeText(JSON.stringify(msgs, null, 2)).then(() => {\n                showToast('Chat exported to clipboard');\n            }).catch(e => {\n                showToast('Failed to export chat');\n                console.error(e);\n            });\n        });\n    }\n\n    let pendingChatAction"
    );

    // 4. Budget UI logic
    content = content.replace(
        /if \(btnToggleBudgetPeriod\) \{\n\s*btnToggleBudgetPeriod.addEventListener\('click', \(e\) => \{\n\s*e.stopPropagation\(\);\n\s*currentBudgetPeriod = currentBudgetPeriod === 'weekly' \? 'monthly' : 'weekly';\n\s*btnToggleBudgetPeriod.innerText = currentBudgetPeriod === 'weekly' \? 'Show Month' : 'Show Week';\n\s*if \(budgetPeriodBadge\) \{\n\s*budgetPeriodBadge.innerText = currentBudgetPeriod === 'weekly' \? 'Weekly' : 'Monthly';\n\s*\}\n\s*loadBudget\(\);\n\s*\}\);\n\s*\}/g,
        "if (btnToggleBudgetPeriod) {\n        btnToggleBudgetPeriod.addEventListener('click', (e) => {\n            e.stopPropagation();\n            currentBudgetPeriod = currentBudgetPeriod === 'weekly' ? 'monthly' : 'weekly';\n            btnToggleBudgetPeriod.innerText = currentBudgetPeriod === 'weekly' ? 'Show Month' : 'Show Week';\n            if (budgetPeriodBadge) {\n                budgetPeriodBadge.innerText = currentBudgetPeriod === 'weekly' ? 'Weekly' : 'Monthly';\n            }\n            loadBudget();\n        });\n    }\n\n    const btnViewBudgetEntries = document.getElementById('btnViewBudgetEntries');\n    const budgetEntriesList = document.getElementById('budgetEntriesList');\n    if (btnViewBudgetEntries && budgetEntriesList) {\n        btnViewBudgetEntries.addEventListener('click', (e) => {\n            e.stopPropagation();\n            budgetEntriesList.classList.toggle('hidden');\n        });\n    }"
    );

    const oldBudgetDisplay = `const spentVal = Number(data.summary?.Total || 0).toFixed(2);
                    const incomeVal = Number(data.summary?.Income || 0).toFixed(2);
                    const periodLabel = currentBudgetPeriod === 'weekly' ? \`Week (\${data.weekly?.label || ''})\` : \`Month (\${data.monthly?.label || ''})\`;
                    if (budgetTotalSpent) {
                        if (Number(incomeVal) > 0) {
                            budgetTotalSpent.innerText = \`Spent: \$\${spentVal} | In: \$\${incomeVal}\`;
                        } else {
                            budgetTotalSpent.innerText = \`Spent: \$\${spentVal}\`;
                        }
                    }
                    if (budgetPeriodBadge) budgetPeriodBadge.innerText = periodLabel;`;

    const newBudgetDisplay = `const spentVal = Number(data.summary?.Total || 0).toFixed(2);
                    const incomeVal = Number(data.summary?.Income || 0).toFixed(2);
                    const totalVal = (Number(incomeVal) - Number(spentVal)).toFixed(2);
                    const periodLabel = currentBudgetPeriod === 'weekly' ? \`Week (\${data.weekly?.label || ''})\` : \`Month (\${data.monthly?.label || ''})\`;
                    if (budgetTotalSpent) {
                        budgetTotalSpent.innerText = \`IN: \$\${incomeVal} | OUT: \$\${spentVal} | TOTAL: \$\${totalVal}\`;
                    }
                    if (budgetPeriodBadge) budgetPeriodBadge.innerText = periodLabel;
                    
                    const entriesList = document.getElementById('budgetEntriesList');
                    if (entriesList) {
                        const items = currentBudgetPeriod === 'weekly' ? data.weekly?.items : data.monthly?.items;
                        if (items && items.length > 0) {
                            let tableHtml = \`<table style="width: 100%; border-collapse: collapse;">\`;
                            tableHtml += \`<tr><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Date</th><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Desc</th><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Cat</th><th style="text-align: right; padding: 4px; border-bottom: 1px solid var(--glass-border);">Amount</th></tr>\`;
                            items.forEach(item => {
                                const d = new Date(item.created_at).toLocaleDateString('en-AU', {day: '2-digit', month: 'short'});
                                const amtColor = item.type === 'income' ? 'var(--neon-green)' : 'var(--text-primary)';
                                tableHtml += \`<tr>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">\${d}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">\${item.description.replace(/</g, "&lt;")}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">\${item.category.replace(/</g, "&lt;")}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: \${amtColor};">\$\${Number(item.amount).toFixed(2)}</td>
                                </tr>\`;
                            });
                            tableHtml += \`</table>\`;
                            entriesList.innerHTML = tableHtml;
                        } else {
                            entriesList.innerHTML = '<div style="color: var(--text-secondary);">No entries logged.</div>';
                        }
                    }`;

    content = content.replace(oldBudgetDisplay, newBudgetDisplay);

    fs.writeFileSync(file, content);
}
