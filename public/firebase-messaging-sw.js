// frontend/public/firebase-messaging-sw.js

// 1. Importamos las librerías "compat" (necesarias para Service Workers en Firebase 10+)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBiuk5jAnIMkH8Elp2lYQ_KhBxRCi81Qe8",
  authDomain: "fansmio.firebaseapp.com",
  projectId: "fansmio",
  storageBucket: "fansmio.firebasestorage.app",
  messagingSenderId: "33571782042",
  appId: "1:33571782042:web:9802c76c231484d296ce23",
  measurementId: "G-3YV3SPP0WW"
};

// Inicialización
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🚀 TRUCO DE PRO: Forzar activación inmediata
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// 2. Manejo de mensajes en SEGUNDO PLANO
messaging.onBackgroundMessage((payload) => {
  console.log('[FansMio SW] 🔔 Mensaje recibido:', payload);

  // Si el mensaje ya trae un objeto "notification" de Firebase, 
  // el navegador podría mostrarlo solo. Si no, lo forzamos aquí:
  if (payload.notification) {
    const notificationTitle = payload.notification.title || 'FansMio';
    const notificationOptions = {
      body: payload.notification.body || 'Tienes una nueva actualización.',
      icon: '/favicon.ico', 
      badge: '/favicon.ico',
      data: {
        // Guardamos el link que viene en el data o un default
        link: payload.data?.link || '/dashboard/notifications'
      }
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// 3. Manejo del CLIC en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Cerrar la notificación al hacer clic

  const baseUrl = self.location.origin;
  // Extraemos el link que guardamos en el paso anterior
  const targetPath = event.notification.data?.link || '/dashboard/notifications';
  const urlToOpen = targetPath.startsWith('http') ? targetPath : `${baseUrl}${targetPath}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña abierta de nuestra web, ir a ella y navegar al link
      for (let client of windowClients) {
        if (client.url.startsWith(baseUrl) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si no hay pestañas abiertas, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});