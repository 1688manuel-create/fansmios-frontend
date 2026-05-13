// frontend/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ INTERCEPTOR DE SALIDA (Inyecta el token blindado)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      // 💡 LISTA BLANCA: Rutas que no necesitan token
      const publicRoutes = ['/auth/login', '/auth/register', '/users/login', '/auth/verify-2fa', '/verify-2fa']; 
      const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

      if (token && token !== 'undefined' && token !== 'null') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } else if (!isPublicRoute) {
        // Solo avisar si NO es una ruta pública y falta el token
        console.warn("⚠️ [Puente Axios] Petición enviada SIN Token a ruta protegida.");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🛡️ INTERCEPTOR DE ENTRADA (El Guardia Inteligente)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend rechaza la petición porque el token expiró o no hay sesión
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Limpiamos la basura corrupta del navegador
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 🕵️‍♂️ AQUÍ ESTÁ LA MAGIA: Verificamos en qué página está el usuario
        const currentPath = window.location.pathname;

        // Lista de áreas VIP donde SÍ O SÍ debes tener sesión
        const protectedRoutes = ['/dashboard', '/feed', '/messages', '/live', '/settings', '/wallet'];
        
        // ¿El usuario está intentando estar en un área VIP?
        const isProtected = protectedRoutes.some(route => currentPath.startsWith(route));

        if (isProtected) {
          console.error("🔴 Bloqueo de seguridad: Expulsando a /auth...");
          window.location.href = '/login';  
        } else {
          console.warn("⚠️ Petición rechazada (401), pero es un visitante en la vitrina. No se le expulsa.");
          // No hacemos window.location.href, dejamos que el usuario siga viendo el perfil.
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;