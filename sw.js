// Loopie Service Worker v7 — Push Notifications
const CACHE = 'loopie-v7';

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(clients.claim());
});

// קבלת הודעות מהדף הראשי
self.addEventListener('message', function(e) {
    var data = e.data;
    if (!data) return;

    if (data.type === 'CHECK_SGV') {
        var sgv   = data.sgv;
        var trend = data.trend || '';
        var meal  = data.activeMeal || null;

        // 🔴 היפו — סוכר מתחת ל-70
        if (sgv < 70) {
            self.registration.showNotification('🚨 התרעת היפו!', {
                body: 'סוכר נוכחי: ' + sgv + ' mg/dL — נדרש טיפול מיידי בפחמימות מהירות נוזליות!',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'loopie-hypo',
                requireInteraction: true,
                vibrate: [500, 200, 500, 200, 500]
            });
        }

        // 📋 חוק ה-3 — סוכר עלה מעל 150 אחרי ארוחה
        if (sgv > 150 && meal && meal.debtOpen) {
            var rising = ['SingleUp','DoubleUp','FortyFiveUp'].includes(trend);
            if (rising) {
                self.registration.showNotification('📋 תזכורת חוק ה-3', {
                    body: 'זמן לבדוק באומניבוקס ולהזריק את חוב הפחמימות שנותר מ' + meal.name + '!',
                    icon: '/favicon.ico',
                    tag: 'loopie-debt',
                    requireInteraction: true,
                    vibrate: [300, 100, 300]
                });
            }
        }
    }
});

// לחיצה על הנוטיפיקציה — פתח את האפליקציה
self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(list) {
            if (list.length > 0) return list[0].focus();
            return clients.openWindow('/');
        })
    );
});