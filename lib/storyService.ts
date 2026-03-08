// frontend/lib/storyService.ts
import api from './api';

export const storyService = {
  getFeedStories: async () => {
    const res = await api.get('/stories');
    return res.data;
  },
  
  // 🔥 NUEVO: Ahora acepta un 'caption' opcional
  createStory: async (file: File, caption: string = '') => {
    const formData = new FormData();
    formData.append('media', file);
    
    // Si el usuario escribió algo, lo enviamos al backend
    if (caption) {
      formData.append('caption', caption); 
    }

    const res = await api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  
  viewStory: async (id: string) => {
    const res = await api.post(`/stories/${id}/view`);
    return res.data;
  },
  
  // 🔥 NUEVO: Obtener quién vio la historia
  getStoryViews: async (id: string) => {
    const res = await api.get(`/stories/${id}/views`);
    return res.data;
  },
  
  // 🔥 NUEVO: Eliminar historia
  deleteStory: async (id: string) => {
    const res = await api.delete(`/stories/${id}`);
    return res.data;
  }
};