// frontend/lib/bundleService.ts
import api from './api';

export const bundleService = {
  // Obtener los paquetes creados
  getMyBundles: async () => {
    const response = await api.get('/bundles/my-bundles');
    return response.data;
  },

  // Obtener posts que se pueden empaquetar
  getEligiblePosts: async () => {
    const response = await api.get('/bundles/eligible-posts');
    return response.data;
  },

  // Crear un paquete nuevo
  createBundle: async (bundleData: { title: string, description: string, price: number, postIds: string[] }) => {
    const response = await api.post('/bundles/create', bundleData);
    return response.data;
  },

  // (Para después) Fan compra un paquete
  purchaseBundle: async (bundleId: string) => {
    const response = await api.post('/bundles/purchase', { bundleId });
    return response.data;
  }
};