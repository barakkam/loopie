// ============================================================
//  sw.js  —  LOOPIE Service Worker  (v1.0)
//  מאפשר התראות Push גם כשהאפליקציה סגורה/ברקע.
//  ⚠️ iOS Safari: Push ב-Web App לא נתמך עד iOS 16.4+
//     (ורק בעת הוספה ל-Home Screen כ-PWA).
// ============================================================

var CACHE_NAME = 'loopie-v1';

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', function(e) {
    console.log('[SW] Installed');
    self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
    console.log('[SW] Activated');
    e.waitUntil(self.clients.claim());
});

// ── Push Event (מגיע משרת push — עתידי) ─────────────────────
self.addEventListener('push', function(e) {
    var data = {};
    try { data = e.data ? e.data.json() : {}; } catch(err) {}

    var title   = data.title   || '🔔 LOOPIE';
    var body    = data.body    || data.message || 'יש עדכון';
    var tag     = data.tag     || 'loopie-push';
    var urgency = data.urgency || 'normal';

    var options = {
        body:             body,
        icon:             './favicon.ico',
        badge:            './favicon.ico',
        tag:              tag,
        renotify:         true,
        requireInteraction: urgency === 'high',
        vibrate:          urgency === 'high' ? [500,100,500,100,500] : [200,100,200],
        data:             { url: self.location.origin + '/loopie/' }
    };

    e.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ── Notification Click ────────────────────────────────────────
self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    var targetUrl = (e.notification.data && e.notification.data.url)
        ? e.notification.data.url
        : '/loopie/';

    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clients) {
                // אם הטאב כבר פתוח — הבא אותו לפוקוס
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].url.includes('loopie') && 'focus' in clients[i]) {
                        return clients[i].focus();
                    }
                }
                // אחרת — פתח חלון חדש
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});

// ── Message from app (לשליחת notification מהאפליקציה) ────────
self.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'SHOW_NOTIFICATION') return;

    var title   = e.data.title   || '🔔 LOOPIE';
    var body    = e.data.body    || '';
    var options = {
        body:             body,
        icon:             './favicon.ico',
        badge:            './favicon.ico',
        tag:              e.data.tag || 'loopie-msg',
        renotify:         true,
        requireInteraction: !!e.data.requireInteraction,
        vibrate:          e.data.urgent ? [500,100,500] : [200,100,200],
        data:             { url: self.location.origin + '/loopie/' }
    };

    self.registration.showNotification(title, options);
});
