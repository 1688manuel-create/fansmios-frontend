import api from './api';

export const notificationService = {
  // 1. Obtener todas las notificaciones
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // 2. Marcar una sola como leída
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // 3. Marcar todas como leídas (Limpiar bandeja)
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};