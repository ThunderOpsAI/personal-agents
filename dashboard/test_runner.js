const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('public/index.html', 'utf8');
const script = fs.readFileSync('public/app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
const window = dom.window;
const document = window.document;

// Mock fetch
window.fetch = async () => ({ ok: true, json: async () => ({}) });
// Mock FullCalendar
window.FullCalendar = { Calendar: class { render(){} } };

try {
    // Modify script to remove DOMContentLoaded wrapper so we can test functions
    let modifiedScript = script.replace(/document\.addEventListener\('DOMContentLoaded', \(\) => \{/, '');
    modifiedScript = modifiedScript.substring(0, modifiedScript.lastIndexOf('}'));
    
    window.eval(modifiedScript);
    
    // Check if startRunnerModal is available
    if (typeof window.startRunnerModal === 'function') {
        window.startRunnerModal('y1');
        console.log("Placeholder display:", document.getElementById('runnerPlaceholder').style.display);
        console.log("Image display:", document.getElementById('runnerImg').style.display);
    } else {
        console.log("startRunnerModal not found.");
    }
} catch (e) {
    console.error("Error evaluating script:", e);
}
