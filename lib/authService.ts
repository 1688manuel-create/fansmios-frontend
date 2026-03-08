// frontend/lib/authService.ts
import api from './api';

export const authService = {
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 🛡️ LOGIN BLINDADO
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    console.log("📦 Respuesta del servidor:", response.data); // Sensor para nosotros
    
    // Atrapamos el token ya sea que se llame 'token' o 'accessToken'
    const token = response.data.token || response.data.accessToken;
    
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user || { role: 'FAN' }));
    } else {
      console.error("🚨 El servidor no envió el token!");
    }
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};