import api from './api';

export const adminService = {
  // Obtener números grandes (Estadísticas)
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Ajustar tu tajada del negocio (Comisión)
  updateFee: async (newFeePercent: number) => {
    const response = await api.put('/admin/platform-fee', { newFeePercent });
    return response.data;
  },

  // Obtener reportes de contenido o usuarios
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  // 🔴 MODO DIOS: Cambiar estado de un usuario (Banear, Suspender)
  // Nota: Le agregamos adminNotes para guardar la razón en la BD
  changeUserStatus: async (targetUserId: string, newStatus: string, adminNotes: string = '') => {
    const response = await api.put('/admin/user-status', { targetUserId, newStatus, adminNotes });
    return response.data;
  },

  // Manejar el dinero de los creadores (Aprobar o Rechazar retiros)
  handleWithdrawal: async (withdrawalId: string, newStatus: string, adminNotes: string = '') => {
    const response = await api.put('/admin/withdrawals', { withdrawalId, newStatus, adminNotes });
    return response.data;
  },

  // 🔥 NUEVO: Necesitamos una ruta para listar a todos los usuarios para poder banearlos
  // (Esta la agregaremos en el backend en el siguiente paso si no existe, por ahora la dejamos lista)
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  // 🔥 NUEVO: Obtener retiros pendientes
  getAllWithdrawals: async () => {
    const response = await api.get('/admin/withdrawals-list');
    return response.data;
  }
};