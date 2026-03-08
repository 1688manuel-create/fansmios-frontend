// frontend/lib/fanService.ts
import api from './api';

export const fanService = {
  getMySubscriptions: async () => {
    const response = await api.get('/fans/subscriptions');
    return response.data;
  }
};