// frontend/lib/postService.ts
import api from './api';

export const postService = {
  createPost: async (formData: FormData) => {
    const response = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAllPosts: async () => {
    const response = await api.get('/posts');
    return response.data;
  },

  getCreatorPosts: async (username: string) => {
    const response = await api.get(`/posts/creator/${username}`);
    return response.data;
  },

  // 🔥 NUEVAS FUNCIONES PARA LIKES Y COMENTARIOS
  toggleLike: async (postId: string, emoji: string = '❤️') => {
    const response = await api.post(`/posts/${postId}/like`, { emoji });
    return response.data;
  },

  addComment: async (postId: string, content: string, parentId: string | null = null) => {
    const response = await api.post(`/posts/${postId}/comment`, { content, parentId });
    return response.data;
  },

  toggleCommentLike: async (commentId: string) => {
    const response = await api.post(`/posts/comment/${commentId}/like`);
    return response.data;
  }
};