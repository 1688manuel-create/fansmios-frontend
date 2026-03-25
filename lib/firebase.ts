// frontend/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from './api'; 

const firebaseConfig = {
  apiKey: "AIzaSyBiuk5jAnIMkH8Elp2lYQ_KhBxRCi81Qe8",
  authDomain: "fansmio.firebaseapp.com",
  projectId: "fansmio",
  storageBucket: "fansmio.firebasestorage.app",
  messagingSenderId: "33571782042",
  appId: "1:33571782042:web:9802c76c231484d296ce23",
  measurementId: "G-3YV3SPP0WW"
};

const app = initializeApp(firebaseConfig);

// Inicializamos messaging de forma segura para SSR (Next.js)
let messaging: any;
if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export const requestPushPermission = async () => {
  try {
    if (!messaging) {
      console.warn("⚠️ Firebase Messaging no está soportado en este navegador.");
      return null;
    }

    // 1. Pedir permiso al usuario
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log("🔔 Permiso de notificaciones concedido por el usuario.");

      // 2. REGISTRO MANUAL DEL SERVICE WORKER
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/' 
      });

      // Obligamos a esperar a que el guardia esté 100% "Activo"
      await navigator.serviceWorker.ready;

      // 3. Obtener el Token (AQUÍ ESTÁ EL ESCUDO 🛡️)
      let token = null;
      try {
        token = await getToken(messaging, { 
          vapidKey: "BHW5cVX7Z_k-zbd5BZgQ-OmF6TFdDWDlZaSbpx_BNAscm2VbEMnSZQoOHsMnornALMV7WkpL_5ebsvhkzMgEq5I",
          serviceWorkerRegistration: registration 
        });
      } catch (tokenError) {
        // 🔥 Silenciamos el 403 Forbidden o el bloqueo por navegadores estrictos (Brave/Incógnito)
        console.warn("⚠️ Token de notificaciones bloqueado (Error 403 o Antirrastreo). Ignorando silenciosamente...");
        return null; // Salimos sin romper el resto de la app
      }

      if (token) {
        console.log("✅ Token de FCM generado con éxito."); // Oculto para no hacer ruido
        
        // 4. Enviar al backend
        try {
           await api.post('/users/settings/push-token', { fcmToken: token });
        } catch (apiError) {
           console.warn("⚠️ No se pudo guardar el token en la base de datos.");
        }
        
        return token;
      }
    } else {
      console.warn("🚫 El usuario bloqueó las notificaciones.");
    }
  } catch (error) {
    // Solo mostramos advertencias amarillas, no errores rojos fatales
    console.warn("⚠️ Flujo de notificaciones interrumpido:", error);
  }
};

export { messaging, onMessage };