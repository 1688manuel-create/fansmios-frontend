// frontend/lib/chatService.ts
import api from './api';

export const chatService = {
  // ==========================================
  // 1. GESTIÓN DE CONVERSACIONES
  // ==========================================
  
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread');
    return response.data;
  },

  // 🔥 CORRECCIÓN: Ahora recibe el número de página (page) y lo envía al backend
  getMessages: async (conversationId: string, page: number = 1) => {
    if (!conversationId) throw new Error("Falta el ID de la conversación");
    // Enviamos el parámetro de página en la URL (Query Params)
    const response = await api.get(`/messages/${conversationId}?page=${page}`);
    return response.data;
  },

  // ==========================================
  // 2. ENVÍO DE MENSAJES
  // ==========================================

  sendMessage: async (conversationId: string, receiverId: string, content: string, price: string = '', media: File | Blob | null = null) => {
    if (!receiverId) {
      throw new Error("Datos de destinatario incompletos para enviar el mensaje");
    }

    const formData = new FormData();
    formData.append('conversationId', conversationId || ''); 
    formData.append('receiverId', receiverId);
    
    if (content) formData.append('content', content);
    
    if (price && Number(price) > 0) {
      formData.append('price', price);
      formData.append('isPPV', 'true');
    }
    
    if (media) formData.append('media', media);

    const response = await api.post('/messages/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  sendBroadcast: async (content: string, price: string, mediaFile: File | null) => {
    const formData = new FormData();
    
    if (content) formData.append('content', content);
    
    if (price && Number(price) > 0) {
      formData.append('isPPV', 'true');
      formData.append('price', price);
    }
    
    if (mediaFile) formData.append('media', mediaFile);

    const response = await api.post('/messages/broadcast', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // ==========================================
  // 3. MODERACIÓN Y SEGURIDAD
  // ==========================================

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  blockUser: async (blockedId: string) => {
    const response = await api.post('/messages/block', { blockedId });
    return response.data;
  },

  unblockUser: async (blockedId: string) => {
    const response = await api.post('/messages/unblock', { blockedId });
    return response.data;
  },

  checkBlockStatus: async (userId: string) => {
    const response = await api.get(`/messages/block-status/${userId}`);
    return response.data;
  },
  
  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/messages/conversation/${conversationId}`);
    return response.data;
  }
};