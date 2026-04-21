// frontend/lib/paymentService.ts
import api from './api';

export const paymentService = {
  // ==========================================
  // 💰 1. GENERADOR MAESTRO (PPV, PROPINAS, RECARGAS)
  // ==========================================
  createPaymentIntent: async (data: { 
    amount: number, 
    type: string, 
    creatorId?: string, 
    postId?: string, 
    description?: string,
    couponCode?: string,
    messageId?: string
  }) => {
    // Enviamos la orden al backend (Ruta 1: PayRam o Ruta 2: Covra Pay)
    const response = await api.post('/payments/create-intent', data);
    
    // 🔥 LÓGICA DE TRANSPARENCIA PAYRAM:
    // Si el backend responde con una checkoutUrl, es una recarga con tarjeta.
    // Redirigimos al Fan inmediatamente a la pasarela segura.
    if (response.data.checkoutUrl) {
      console.log("🚀 Redirigiendo a Pasarela Segura PayRam...");
      window.location.href = response.data.checkoutUrl;
      return; 
    }

    return response.data;
  },
   
  // ==========================================
  // 🛍️ 2. CONFIRMACIÓN DE COMPRAS INTERNAS
  // ==========================================
  confirmPurchase: async (postId?: string, messageId?: string, isTip?: boolean, amount?: number, creatorId?: string) => {
    // Esta función se usa para validar que el contenido se desbloqueó tras el pago
    const response = await api.post('/payments/confirm-purchase', { 
      postId, 
      messageId, 
      isTip, 
      amount, 
      creatorId 
    });
    return response.data;
  },

  // ==========================================
  // 💎 3. SUSCRIPCIONES
  // ==========================================
  createSubscriptionIntent: async (creatorId: string) => {
    const response = await api.post('/payments/subscribe-intent', { creatorId });
    return response.data;
  },

  confirmSubscription: async (creatorId: string, paymentIntentId: string) => {
    const response = await api.post('/payments/subscribe-confirm', { creatorId, paymentIntentId });
    return response.data;
  }
};