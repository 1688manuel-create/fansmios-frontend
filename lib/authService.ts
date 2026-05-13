// frontend/lib/authService.ts
import api from './api';

export const authService = {
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 🛡️ PASO 1: LOGIN BLINDADO (Revisa usuario y contraseña)
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    console.log("📦 Respuesta del servidor:", response.data); // Sensor para nosotros
    
    // 🚧 BIFURCACIÓN DE SEGURIDAD: Si requiere 2FA, devolvemos la info y cortamos aquí.
    // (El servidor aún no nos ha dado el token, lo dará en el paso 2).
    if (response.data.requires2FA) {
      return response.data; 
    }
    
    // ✅ SI NO REQUIERE 2FA: Atrapamos el token de forma normal
    const token = response.data.token || response.data.accessToken;
    
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user || { role: 'FAN' }));
    } else {
      console.error("🚨 El servidor no envió el token!");
    }
    
    return response.data;
  },

  // 🔐 PASO 2: VERIFICAR 2FA (Para los usuarios con seguridad alta)
  verify2FALogin: async (data: { userId: string | null, token: string }) => {
    // Enviamos el ID temporal y los 6 números del Google Authenticator
    const response = await api.post('/auth/verify-2fa', data);
    
    // Si el código es correcto, ¡AHORA SÍ el servidor nos da las llaves del reino!
    const finalToken = response.data.token || response.data.accessToken;
    
    if (finalToken) {
      localStorage.setItem('token', finalToken);
      localStorage.setItem('user', JSON.stringify(response.data.user || { role: 'FAN' }));
    } else {
      console.error("🚨 El servidor no envió el token después del 2FA!");
    }
    
    return response.data;
  },

  // 🚪 SALIR DE LA PLATAFORMA
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};