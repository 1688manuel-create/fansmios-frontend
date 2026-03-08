// frontend/lib/liveService.ts
import api from './api';

export const liveService = {
  // 🔥 CORRECCIÓN: Ahora apunta a '/live/create' y soporta cobro PPV
  createStream: async (title: string, isPPV: boolean = false, price: number = 0) => {
    const res = await api.post('/live/create', { title, isPPV, price });
    return res.data;
  },

  // Obtener la información de una sala para entrar a verla
  getStream: async (streamId: string) => {
    const res = await api.get(`/live/${streamId}`);
    return res.data;
  },

  // Obtener los En Vivos para el Feed
  getActiveStreams: async () => {
    const res = await api.get('/live/active'); 
    return res.data;
  },

  // Cambiar el estado (Empezar a transmitir o Cortar transmisión)
  updateStatus: async (streamId: string, status: 'LIVE' | 'ENDED') => {
    const res = await api.put(`/live/${streamId}/status`, { status });
    return res.data;
  },

  // Enviar un mensaje o Donación al backend (respaldo de la base de datos)
  sendMessage: async (streamId: string, content: string, isDonation = false, amount = 0) => {
    const res = await api.post('/live/message', { streamId, content, isDonation, amount });
    return res.data;
  }
};