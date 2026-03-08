// frontend/lib/chatService.ts
import api from './api';

export const chatService = {
  // ==========================================
  // 1. GESTIÓN DE CONVERSACIONES
  // ==========================================
  
  // Obtener la lista de chats activos para la barra lateral
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Obtener el total de mensajes no leídos (Para las notificaciones de la navbar)
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread');
    return response.data;
  },

  // Obtener el historial de mensajes de un chat específico
  getMessages: async (conversationId: string) => {
    if (!conversationId) throw new Error("Falta el ID de la conversación");
    
    // Ajustado para coincidir con el enrutador limpio del backend
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
  },

  // ==========================================
  // 2. ENVÍO DE MENSAJES (1 a 1 y BROADCAST)
  // ==========================================

  // Enviar un mensaje directo (Soporta Texto, Imágenes, Videos, Notas de Voz y PPV)
  sendMessage: async (conversationId: string, receiverId: string, content: string, price: string = '', media: File | Blob | null = null) => {
    if (!conversationId || !receiverId) {
      throw new Error("Datos de conversación incompletos para enviar el mensaje");
    }

    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('receiverId', receiverId);
    
    if (content) formData.append('content', content);
    
    if (price && Number(price) > 0) {
      formData.append('price', price);
      formData.append('isPPV', 'true');
    }
    
    // 🎤 Soporta tanto fotos como notas de voz (Blob)
    if (media) formData.append('media', media);

    const response = await api.post('/messages/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Envío Masivo PPV (Broadcast) a todos los suscriptores activos
  sendBroadcast: async (content: string, price: string, mediaFile: File | null) => {
    const formData = new FormData();
    
    if (content) formData.append('content', content);
    
    if (price && Number(price) > 0) {
      formData.append('isPPV', 'true');
      formData.append('price', price);
    }
    
    if (mediaFile) formData.append('media', mediaFile);

    // Tu instancia "api" ya le pone el Bearer Token automáticamente
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

  // Eliminar un mensaje específico
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Bloquear a un usuario molesto
  blockUser: async (blockedId: string) => {
    const response = await api.post('/messages/block', { blockedId });
    return response.data;
  },

  // Desbloquear a un usuario
  unblockUser: async (blockedId: string) => {
    const response = await api.post('/messages/unblock', { blockedId });
    return response.data;
  },

  // Verificar si hay un bloqueo activo entre el usuario actual y otro
  checkBlockStatus: async (userId: string) => {
    const response = await api.get(`/messages/block-status/${userId}`);
    return response.data;
  },
};