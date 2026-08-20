const fs = require('fs');
let content = fs.readFileSync('dashboard/app.js', 'utf8');

const schedulerCode = `
    // --- Notification Scheduler ---
    function schedulePainLogNotifications() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        
        function checkNotification() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            
            // 6am, 9am, 12pm, 3pm, 6pm, 9pm, 12am (0)
            const validHours = [0, 6, 9, 12, 15, 18, 21];
            if (validHours.includes(hours) && minutes === 0 && seconds === 0) {
                triggerPainLogPrompt();
            }
        }
        
        setInterval(checkNotification, 1000);
    }

    function triggerPainLogPrompt() {
        const title = 'Time to Log Your Pain';
        const options = {
            body: 'Please take a moment to record your current pain levels and mood.',
            icon: '/Rumble_Icon.png'
        };

        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(title, options);
            notif.onclick = () => {
                window.focus();
                const painLogModal = document.getElementById('painLogModal');
                if (painLogModal) painLogModal.classList.remove('hidden');
            };
        } else {
            const alertBanner = document.getElementById('alertBanner');
            const alertBannerText = document.getElementById('alertBannerText');
            if (alertBanner && alertBannerText) {
                alertBannerText.innerText = title + ' - ' + options.body;
                alertBanner.classList.remove('hidden');
                setTimeout(() => alertBanner.classList.add('hidden'), 10000);
            }
        }
    }
    
    schedulePainLogNotifications();
`;

content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + schedulerCode);

fs.writeFileSync('dashboard/app.js', content, 'utf8');
