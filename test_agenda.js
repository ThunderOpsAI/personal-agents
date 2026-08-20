const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('dashboard/public/index.html', 'utf8');
const scriptCode = fs.readFileSync('dashboard/public/app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.fetch = async (url) => {
    console.log("Fetching", url);
    return {
        ok: true,
        json: async () => ({
            "status":"success",
            "view":"daily",
            "items":[],
            "daily":[{"id":"e115877d","title":"Call Clancy","time":"10:00 am","item_type":"task","status":"pending"}],
            "weekly":[],
            "monthly":[]
        })
    };
};

dom.window.eval(scriptCode);

setTimeout(() => {
    console.log("Cards in DOM:", dom.window.document.querySelectorAll('.protocol-card').length);
    if(dom.window.document.querySelectorAll('.protocol-card').length === 0) {
        console.log("AGENDA IS EMPTY!");
    } else {
        console.log("Agenda is NOT empty.");
    }
}, 2000);
