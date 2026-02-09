// Service Worker for notification actions
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    // Handle different actions
    if (event.action === 'focused') {
        // Send message to all clients (app tabs) that user is still focused
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                clientList.forEach(client => {
                    client.postMessage({
                        type: 'CHECK_IN_RESPONSE',
                        status: 'success'
                    });
                });
            })
        );
    } else if (event.action === 'distracted') {
        // Open app and show distraction modal
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                if (clientList.length > 0) {
                    // Focus existing tab
                    clientList[0].focus();
                    clientList[0].postMessage({
                        type: 'CHECK_IN_RESPONSE',
                        status: 'distracted'
                    });
                } else {
                    // Open new tab
                    clients.openWindow('/');
                }
            })
        );
    }
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});
