// frontend/lib/exploreService.ts
import api from './api';

export const exploreService = {
  getSuggested: async () => {
    const response = await api.get('/explore/suggested');
    return response.data;
  },
  searchCreators: async (query: string) => {
    const response = await api.get(`/explore/search?q=${query}`);
    return response.data;
  }
};