// frontend/lib/paymentService.ts
import api from './api';

export const paymentService = {
  // 1. GENERADOR MAESTRO (PPV, PROPINAS, TICKETS)
  createPaymentIntent: async (data: { 
    amount: number, 
    type: string, 
    creatorId: string, 
    postId?: string, 
    description?: string 
  }) => {
    // Enviamos el objeto completo al backend
    const response = await api.post('/payments/create-intent', data);
    return response.data;
  },
   
  confirmPurchase: async (postId?: string, messageId?: string, isTip?: boolean, amount?: number, creatorId?: string) => {
    // 🔥 CORRECCIÓN: Apuntamos a /confirm-purchase
    const response = await api.post('/payments/confirm-purchase', { 
      postId, 
      messageId, 
      isTip, 
      amount, 
      creatorId 
    });
    return response.data;
  },

  // 2. SUSCRIPCIONES
  createSubscriptionIntent: async (creatorId: string) => {
    const response = await api.post('/payments/subscribe-intent', { creatorId });
    return response.data;
  },

  confirmSubscription: async (creatorId: string, paymentIntentId: string) => {
    const response = await api.post('/payments/subscribe-confirm', { creatorId, paymentIntentId });
    return response.data;
  }
};