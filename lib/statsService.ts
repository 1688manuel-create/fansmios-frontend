// frontend/lib/statsService.ts
import api from './api';

export const statsService = {
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};