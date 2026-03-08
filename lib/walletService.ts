// frontend/lib/walletService.ts
import api from './api';

export const walletService = {
  // Obtener todos los datos del dashboard financiero
  getDashboard: async () => {
    const response = await api.get('/wallet/dashboard');
    return response.data;
  },

  // Solicitar un retiro de dinero
  requestWithdrawal: async (amount: number) => {
    const response = await api.post('/wallet/withdraw', { amount });
    return response.data;
  }
};