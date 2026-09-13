const http = require('http');

async function run() {
    const res = await fetch('http://localhost:3000/api/v1/learn/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            encyclopediaId: 'pain',
            chapterId: 'pain_1',
            chapterTitle: 'Test',
            summary: 'Summary',
            keyTakeaways: []
        })
    });
    console.log(res.status);
    console.log(await res.text());
}
run();
