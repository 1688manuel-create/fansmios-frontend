"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { postService } from '../../../lib/postService';
import { paymentService } from '../../../lib/paymentService';
import { storyService } from '../../../lib/storyService'; 
import { notificationService } from '../../../lib/notificationService'; 
import { chatService } from '../../../lib/chatService'; 
import api from '../../../lib/api'; 
import PaymentModal from '../../../components/PaymentModal';
import TipModal from '../../../components/TipModal';
import ReportModal from '../../../components/ReportModal'; 
import { liveService } from '../../../lib/liveService';
import AppLayout from '../../../components/AppLayout';
import React from 'react';
import BoostModal from '../../../components/BoostModal';

import { 
  Image as ImageIcon, Lock, Radio, Bell, MessageCircle, LogOut, 
  Crown, LayoutDashboard, Plus, Trash2, Unlock, Coins, X, User,
  TrendingUp, Zap, Star, ChevronRight, Send, Flag, Wallet
} from 'lucide-react';

import { requestPushPermission } from '../../../lib/firebase';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null, usernameForWatermark: string | null = null) => {
  if (!path) return '';
  
  if (path.startsWith('http')) {
    // Si es Cloudinary, aplicamos optimización inteligente
    if (path.includes('cloudinary.com')) {
      // 1. Limpiamos cualquier transformación previa para no duplicar
      const cleanPath = path.replace(/upload\/.*\/(v\d+)/, 'upload/$1');
      
      if (usernameForWatermark) {
        const cleanUsername = usernameForWatermark.replace('@', '');
        // Marca de agua + Optimización (sin el /v1/ extra)
        const wm = `upload/f_auto,q_auto/l_text:Arial_40_bold:fansmio%20%40${cleanUsername},co_white,o_30/fl_layer_apply,g_south,y_40/`;
        return cleanPath.replace('upload/', wm);
      }
      
      // Optimización simple para fotos de perfil y trending
      return cleanPath.replace('upload/', 'upload/f_auto,q_auto/');
    }
    return path; 
  }

  // Para imágenes locales del servidor
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${cleanPath}`; 
};

// 🌳 NODO DE COMENTARIOS (Plano con Escáner Profundo, PODERES DE MODERACIÓN y FOTO DE PERFIL)
const CommentNode = ({ comment, postId, postOwnerId, currentUser, onReply, onDelete, onReport, onBlock, isExpanded }: { comment: any, postId: string, postOwnerId: string, currentUser: any, onReply: (postId: string, commentId: string) => void, onDelete: (commentId: string) => void, onReport: (commentId: string, username: string) => void, onBlock: (userId: string, username: string) => void, isExpanded: boolean }) => {
  const t = useTranslations('Feed'); 
  
  // 🛡️ PODERES DE JERARQUÍA
  const isCommentAuthor = currentUser?.id === comment.userId;
  const isPostOwner = currentUser?.id === postOwnerId;
  const isAdmin = currentUser?.role === 'ADMIN';
  
  // Puedes borrar si: lo escribiste tú, o es tu post, o eres el CEO (Admin).
  const canDelete = isCommentAuthor || isPostOwner || isAdmin;
  
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  // 🔥 EXTRACCIÓN DE LA FOTO DEL PERFIL
  const userProfileImage = comment.user?.creatorProfile?.profileImage;
  const initial = comment.user?.username ? comment.user.username.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    let currentHash = window.location.hash;
    
    // 🔥 EL NUEVO ESCÁNER PROFUNDO (Busca en hijos, nietos y tataranietos)
    const hasTargetInDescendants = (replies: any[], target: string): boolean => {
      if (!replies || replies.length === 0) return false;
      for (const rep of replies) {
        if (String(rep.id) === target) return true;
        if (hasTargetInDescendants(rep.replies, target)) return true;
      }
      return false;
    };

    const checkAndOpen = (hashToCheck: string) => {
      if (hashToCheck && hashToCheck.includes('-comment-')) {
        const parts = hashToCheck.split('-comment-');
        
        // ✅ CORRECCIÓN CLAVE + DEFENSA TÁCTICA DEL COMANDANTE
        const targetId = parts[1].split('&')[0];
        
        // Si el objetivo está en CUALQUIER nivel de profundidad, abrimos las respuestas
        if (targetId && hasTargetInDescendants(comment.replies, String(targetId))) {
          setShowReplies(true);
        }
      }
    };
    
    checkAndOpen(currentHash);
    const scanner = setInterval(() => {
      if (window.location.hash !== currentHash) {
        currentHash = window.location.hash;
        checkAndOpen(currentHash);
      }
    }, 400);
    return () => clearInterval(scanner);
  }, [comment.replies]);

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col mt-2 group/comment scroll-mt-40 transition-all duration-500">
      <div className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm relative transition-all duration-500">
        
        {/* 🔥 CONTENEDOR DE LA FOTO Y EL NOMBRE */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#0a0a0a] flex items-center justify-center">
            {userProfileImage ? (
              <img src={getImageUrl(userProfileImage)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-white bg-gradient-to-tr from-teal-500 to-blue-500 w-full h-full flex items-center justify-center">
                {initial}
              </span>
            )}
          </div>
          <span className="font-bold text-gray-300">@{comment.user?.username || 'Usuario'}:</span>
        </div>

        {/* 💬 TEXTO DEL COMENTARIO */}
        <div className="text-gray-400 pl-8">{comment.content}</div>
        
        {/* ⚙️ BOTONES DE ACCIÓN Y MODERACIÓN */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap pl-8">
          <button onClick={() => onReply(postId, comment.id)} className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors">{t('btn_reply')}</button>
          
          {/* BOTÓN ELIMINAR (Aparece en Hover) */}
          {canDelete && (
            <button onClick={() => onDelete(comment.id)} className="text-[11px] text-red-500 hover:text-red-400 font-bold opacity-100 lg:opacity-0 lg:group-hover/comment:opacity-100 transition-opacity duration-300">{t('btn_delete')}</button>
          )}
          
          {/* BOTONES DE MODERACIÓN (Aparecen en Hover) */}
          {!isCommentAuthor && (
            <>
              <button onClick={() => onReport(comment.id, comment.user?.username)} className="text-[11px] text-yellow-500 hover:text-yellow-400 font-bold opacity-100 lg:opacity-0 lg:group-hover/comment:opacity-100 transition-opacity duration-300">{t('btn_report')}</button>
              
              {(isPostOwner || isAdmin) && (
                <button onClick={() => onBlock(comment.userId, comment.user?.username)} className="text-[11px] text-orange-500 hover:text-orange-400 font-bold opacity-100 lg:opacity-0 lg:group-hover/comment:opacity-100 transition-opacity duration-300">{t('btn_block')}</button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 🔄 RESPUESTAS ANIDADAS */}
      {hasReplies && (
        <>
          <button onClick={() => setShowReplies(!showReplies)} className="text-[11px] text-gray-500 font-bold mt-2 ml-4 flex items-center gap-2 hover:text-gray-300 transition-colors">
            <div className="w-6 h-[1px] bg-gray-600"></div>
            {showReplies ? t('btn_hide_replies') : `${t('btn_view')} ${comment.replies.length} ${comment.replies.length === 1 ? t('lbl_reply') : t('lbl_replies')}`}
          </button>

          {showReplies && (
            <div className="pl-4 sm:pl-6 border-l-2 border-white/10 ml-3 sm:ml-4 mt-2 space-y-1 animate-fade-in">
              {comment.replies.map((reply: any) => (
                <CommentNode key={reply.id} comment={reply} postId={postId} postOwnerId={postOwnerId} currentUser={currentUser} onReply={onReply} onDelete={onDelete} onReport={onReport} onBlock={onBlock} isExpanded={isExpanded} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function Feed() {
  const router = useRouter();
  const t = useTranslations('Feed'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState<any>(null); 
  const [clientSecret, setClientSecret] = useState(''); 
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);

  const [reportData, setReportData] = useState<{type: 'POST' | 'COMMENT', targetId: string, reportedUsername: string} | null>(null);

  const [newPostContent, setNewPostContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null); 
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [stories, setStories] = useState<any[]>([]);
  const [activeStory, setActiveStory] = useState<any>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const [activeStreams, setActiveStreams] = useState<any[]>([]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0); 
  
  const [expandedImage, setExpandedImage] = useState<{url: string, username: string} | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [featuredBundle, setFeaturedBundle] = useState<any>(null);
  const [vipCreator, setVipCreator] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // 1. LA FUNCIÓN DE CARGA (Guarda TODO en memoria)
  const fetchData = useCallback(async () => {
    try {
      const [
        postData, storyData, notifData, liveData, chatData, 
        trendingData, featuredBundleData, vipCreatorData, walletData
      ] = await Promise.all([
        postService.getAllPosts(),
        storyService.getFeedStories(),
        notificationService.getNotifications().catch(() => ({ unreadCount: 0 })),
        liveService.getActiveStreams().catch(() => ({ activeStreams: [] })),
        chatService.getUnreadCount().catch(() => ({ unreadCount: 0 })),
        api.get('/users/trending').catch(() => ({ data: { trending: [] } })),
        api.get('/bundles/featured').catch(() => ({ data: { bundle: null } })),
        api.get('/users/vip-story').catch(() => ({ data: { vip: null } })),
        api.get('/wallet').catch(() => ({ data: { wallet: { balance: 0 } } }))
      ]);
      
      let feedPosts = postData.posts || [];
      feedPosts = feedPosts.filter((post: any, index: number, self: any[]) => 
        index === self.findIndex((t) => t.id === post.id)
      );
      
      // 🔥 IMPORTANTE: Guardamos TODAS las historias en la memoria para el temporizador
      setStories(storyData.stories || []); 
      
      setPosts(feedPosts); 
      setUnreadNotifications(notifData.unreadCount || 0); 
      setActiveStreams(liveData.activeStreams || []);
      setUnreadMessages(chatData.unreadCount || 0); 
      setTrendingCreators(trendingData.data.trending || []);
      setFeaturedBundle(featuredBundleData.data?.bundle || null);
      setVipCreator(vipCreatorData.data?.vip || null);
      setWalletBalance(walletData.data?.wallet?.balance || 0);
    } catch (error) { 
      console.error('Error cargando datos:', error); 
    } finally { 
      setIsLoading(false); 
    }
  }, []);

  // 2. EL TEMPORIZADOR (5 Segundos)
  useEffect(() => {
    let timer: any;
    if (activeStory) {
      // Buscamos todas las historias de este usuario en la memoria
      const userStories = stories.filter((s: any) => s.creator?.id === activeStory.creator?.id);
      
      timer = setTimeout(() => {
        if (currentStoryIndex < userStories.length - 1) {
          // Hay más historias: pasamos a la siguiente
          const nextIndex = currentStoryIndex + 1;
          setCurrentStoryIndex(nextIndex);
          setActiveStory(userStories[nextIndex]);
        } else {
          // Se acabaron: cerramos el modal
          setActiveStory(null);
          setCurrentStoryIndex(0);
        }
      }, 5000); 
    }
    return () => clearTimeout(timer);
  }, [activeStory, currentStoryIndex, stories]);

  // 3. LOS EFECTOS DE CARGA INICIAL
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token) { router.push('/auth'); return; } 
    if (storedUser && storedUser !== "undefined") {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
    fetchData(); 
  }, [fetchData, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      notificationService.getNotifications().then(res => setUnreadNotifications(res.unreadCount || 0)).catch(() => {});
      chatService.getUnreadCount().then(res => setUnreadMessages(res.unreadCount || 0)).catch(() => {});
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  // 🧭 BUSCADOR DE OBJETIVOS VIP (Sincronización Total)
  useEffect(() => {
    if (isLoading || posts.length === 0) return;

    let currentHash = window.location.hash;

    const huntForTarget = (hashToHunt: string) => {
      if (hashToHunt && hashToHunt.startsWith('#post-')) {
        const hashContent = hashToHunt.substring(1);
        const [postPart, commentPart] = hashContent.split('-comment-');
        const postId = postPart.replace('post-', '');
        const targetId = commentPart ? `comment-${commentPart}` : `post-${postId}`;

        // 1. Forzamos la apertura del post principal
        setExpandedComments(prev => ({ ...prev, [postId]: true }));

        // 2. Iniciamos el perro de caza (Check cada 200ms)
        let attempts = 0;
        const findAndScroll = setInterval(() => {
          const element = document.getElementById(targetId);
          attempts++;

          if (element) {
            clearInterval(findAndScroll);
            
            // 🎯 Esperamos un poco más para que el scroll sea fluido después de que el DOM se estire
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // ✨ EFECTO BRILLO IMPERIAL (Red Highlight)
              element.classList.add('ring-4', 'ring-red-600', 'shadow-[0_0_50px_rgba(220,38,38,0.5)]', 'bg-red-600/10', 'z-50');
              
              setTimeout(() => {
                element.classList.remove('ring-4', 'ring-red-600', 'shadow-[0_0_50px_rgba(220,38,38,0.5)]', 'bg-red-600/10', 'z-50');
                window.history.replaceState(null, '', window.location.pathname);
                currentHash = ''; 
              }, 4000);
            }, 500); 
          }

          if (attempts > 50) clearInterval(findAndScroll); // 10 segundos límite
        }, 200);
      }
    };

    if (currentHash) huntForTarget(currentHash);

    const scanner = setInterval(() => {
      if (window.location.hash !== currentHash) {
        currentHash = window.location.hash;
        huntForTarget(currentHash);
      }
    }, 400);

    return () => clearInterval(scanner);
  }, [isLoading, posts]);

  const handleReact = async (postId: string, emoji: string) => {
    if (!user) return;
    try {
      await api.post(`/posts/${postId}/like`, { emoji });
      fetchData(); 
    } catch (error) { console.error("Error al reaccionar:", error); }
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      let finalContent = commentText;
      if (replyingToCommentId) {
        const post = posts.find(p => p.id === postId);
        const parentComment = post?.comments?.find((c: any) => c.id === replyingToCommentId);
        if (parentComment && parentComment.user?.username) {
          finalContent = `@${parentComment.user.username} ${commentText}`;
        }
      }

      await api.post(`/posts/${postId}/comment`, { content: finalContent, parentId: replyingToCommentId });
      
      setCommentText('');
      setCommentingPostId(null);
      setReplyingToCommentId(null);
      setExpandedComments(prev => ({...prev, [postId]: true}));
      fetchData(); 
    } catch (error) {
      alert(t('alert_publish_error'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplyClick = (postId: string, commentId: string) => {
    setCommentingPostId(postId);
    setReplyingToCommentId(commentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('confirm_delete_comment'))) return;
    try {
      await api.delete(`/posts/comments/${commentId}`); 
      fetchData(); 
    } catch (error) {
      alert(t('alert_error_delete_comment'));
    }
  };

  const handleBlockUser = async (userId: string, username: string) => {
    if (!window.confirm(`${t('confirm_block_user_1')} @${username}? ${t('confirm_block_user_2')}`)) return;
    try {
      await api.post(`/users/${userId}/block`); 
      alert(`🚫 ${t('alert_blocked')} @${username}.`);
      fetchData(); 
    } catch (error) {
      alert(t('alert_error_block'));
    }
  };

  const handleUnlockClick = async (post: any) => {
    try {
      const data = await paymentService.createPaymentIntent({
        amount: post.price || 0,
        type: 'PPV_POST', 
        creatorId: post.user?.id || 'mock',
        postId: post.id,
        description: 'Desbloqueo de Post'
      });
      if (data.success || data.receipt) {
        alert(t('alert_unlocked'));
        fetchData();
      } else {
        setClientSecret(data.clientSecret);
        setSelectedPost(post);
        setIsPaymentModalOpen(true);
      }
    } catch (error) { alert(t('alert_gateway_error')); }
  };

  const handleUnlockBundle = async (bundle: any) => {
    try {
      const payload: any = {
        amount: bundle.price || 0,
        type: 'BUNDLE',
        creatorId: bundle.creatorId || bundle.creator?.id,
        bundleId: bundle.id,
        description: `Compra de Paquete VIP: ${bundle.title}`
      };
      const data = await paymentService.createPaymentIntent(payload);
      if (data.success || data.receipt) {
        alert(t('alert_bundle_bought'));
        fetchData();
      } else {
        setClientSecret(data.clientSecret);
        setSelectedPost({ id: bundle.id, price: bundle.price, user: bundle.creator, isBundle: true });
        setIsPaymentModalOpen(true);
      }
    } catch (error) { 
      alert(t('alert_error_bundle')); 
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handlePublish = async () => {
    if (!newPostContent.trim() && !selectedImage) return;
    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      formData.append('isPPV', String(isPPV));
      formData.append('price', String(isPPV ? Number(price) : 0));
      if (selectedImage) formData.append('media', selectedImage);
      await postService.createPost(formData);
      setNewPostContent(''); setIsPPV(false); setPrice(''); setSelectedImage(null); setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
      fetchData(); 
    } catch (error: any) { alert(error.response?.data?.error || t('alert_publish_error')); } 
    finally { setIsPublishing(false); }
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const caption = window.prompt(t('prompt_story_msg'));
      setIsUploadingStory(true);
      try {
        await storyService.createStory(file, caption || '');
        await fetchData(); 
      } catch (error) { alert(t('alert_story_error')); } 
      finally {
        setIsUploadingStory(false);
        if (storyFileInputRef.current) storyFileInputRef.current.value = '';
      }
    }
  };

  const handleStartLive = async () => {
    const title = window.prompt(t('prompt_live_title'));
    if (!title) return; 
    try {
      const res = await liveService.createStream(title);
      router.push(`/live/${res.liveStream.id}`);
    } catch (error) { alert(t('alert_live_error')); }
  };

  const openStory = async (story: any) => {
    setActiveStory(story);
    setCurrentStoryIndex(0); 
    try { 
      await storyService.viewStory(story.id); 
      fetchData(); 
    } catch (error) {}
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm(t('confirm_delete_story'))) return;
    try {
      await api.delete(`/stories/${storyId}`);
      alert(t('alert_story_deleted'));
      setActiveStory(null); 
      fetchData(); 
    } catch (error) { alert(t('alert_error_delete_story')); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t('confirm_delete_post'))) return;
    try {
      await api.delete(`/posts/${postId}`);
      alert(t('alert_post_deleted'));
      fetchData();
    } catch (error) { alert(t('alert_error_delete_post')); }
  };

  const handleLogout = () => { localStorage.clear(); router.push('/auth'); };

  // 🌳 CONSTRUCTOR DE COMENTARIOS (ESTILO FACEBOOK/INSTAGRAM - 1 SOLO NIVEL)
  const buildCommentTree = (comments: any[]) => {
    if (!comments) return [];
    
    const roots: any[] = [];
    const rootMap = new Map();

    // 1. Identificar los Comentarios Principales (Abuelos)
    comments.forEach(c => {
      if (!c.parentId) {
        const rootNode = { ...c, replies: [] };
        rootMap.set(c.id, rootNode);
        roots.push(rootNode);
      }
    });

    // 2. Función para encontrar al "Abuelo" de cualquier comentario
    const getRootId = (parentId: string): string | null => {
      if (rootMap.has(parentId)) return parentId;
      const parent = comments.find(c => c.id === parentId);
      return parent ? getRootId(parent.parentId) : null;
    };

    // 3. Agrupar TODOS (hijos, nietos, bisnietos) directamente bajo el Abuelo
    comments.forEach(c => {
      if (c.parentId) {
        const rootId = getRootId(c.parentId);
        if (rootId && rootMap.has(rootId)) {
          // Los agregamos como "texto plano" sin sub-respuestas para evitar escaleras
          rootMap.get(rootId).replies.push({ ...c, replies: [] });
        }
      }
    });

    return roots;
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        <nav className="sticky top-0 z-50 bg-[#0e0e0e]/90 border-b border-white/5 px-4 sm:px-6 py-3 flex justify-between items-center backdrop-blur-xl shadow-md">
          
          {/* 🔥 LOGO INTELIGENTE (ADAPTATIVO) */}
          <div className="flex items-center">
            {/* 📱 MÓVIL: Mostramos el logo completo porque el menú lateral está oculto */}
            <h1 onClick={() => router.push('/feed')} className="md:hidden text-[26px] font-black tracking-tighter cursor-pointer flex items-center gap-2 hover:scale-[1.02] transition-transform">
              <span className="text-2xl drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]">⚡</span> 
              <span className="text-white">FansMio</span>
            </h1>
            
            {/* 💻 ESCRITORIO: Como el logo ya está a la izquierda, aquí mostramos la sección actual */}
            <h1 className="hidden md:block text-xl font-bold text-gray-200 tracking-wide">
              Feed
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-400 text-sm hidden sm:flex items-center gap-1.5 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              {user?.role === 'ADMIN' ? <Crown className="w-4 h-4 text-red-500"/> : user?.role === 'CREATOR' ? <Crown className="w-4 h-4 text-yellow-500"/> : <User className="w-4 h-4 text-blue-400"/>} 
              <span className="text-white ml-1 font-bold">{user?.username || user?.email?.split('@')}</span>
            </span>
            
            <button onClick={() => router.push('/dashboard/notifications')} className="relative text-xs nm-btn text-gray-300 px-3 sm:px-4 py-2 rounded-full hover:text-white transition-all font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> <span className="hidden sm:inline">{t('nav_notifs')}</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center border border-black shadow-lg">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                </span>
              )}
            </button>

            {/* 🔥 NUEVO BOTÓN BILLETERA COVRA PAY 🔥 */}
            <button onClick={() => router.push('/dashboard/wallet')} className={`relative text-xs px-3 sm:px-4 py-2 rounded-full transition-all font-bold flex items-center gap-1.5 ${walletBalance > 0 ? 'nm-inset border border-green-500/30 text-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' : 'nm-btn text-gray-300 hover:text-white'}`}>
              <Wallet className={`w-4 h-4 ${walletBalance > 0 ? 'drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : ''}`} /> 
              <span className="hidden sm:inline">{walletBalance > 0 ? `$${walletBalance.toFixed(2)}` : t('nav_wallet')}</span>
            </button>

            <button onClick={() => router.push('/dashboard')} className="text-xs nm-btn text-gray-300 px-3 sm:px-4 py-2 rounded-full hover:text-white transition-all font-bold flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">{user?.role === 'CREATOR' ? t('nav_panel') : t('nav_tools')}</span>
            </button>
            <button onClick={handleLogout} className="relative text-xs nm-btn text-red-500 px-3 sm:px-4 py-2 rounded-full hover:text-white hover:bg-red-600 transition-all font-bold flex items-center gap-1.5" title={t('btn_logout')}>
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_exit')}</span>
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto flex justify-center gap-8 mt-6 px-4">
          
          <main className="w-full max-w-3xl shrink-0 space-y-8 pb-10">
            
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                <div onClick={() => storyFileInputRef.current?.click()} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-white/5 border border-white/10 group-hover:border-red-500/50 flex items-center justify-center shadow-lg">
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-transparent">
                      {isUploadingStory ? <span className="text-xl animate-spin">⏳</span> : <Plus className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 max-w-[64px] truncate font-medium">{t('lbl_your_story')}</span>
                  <input type="file" accept="image/*,video/*" className="hidden" ref={storyFileInputRef} onChange={handleStoryUpload} />
                </div>
              )}

              {vipCreator && (
                <div onClick={() => router.push(`/${vipCreator.username}`)} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 relative mt-1.5">
                    <div className="absolute -top-3 z-10 bg-[#0e0e0e] border border-yellow-500 rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse">
                      <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-500" />
                      <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">VIP</span>
                    </div>

                    <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.3)] mt-1">
                      <div className="w-full h-full rounded-full bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                        {vipCreator.creatorProfile?.profileImage ? (
                          <img src={getImageUrl(vipCreator.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" alt="Avatar VIP" />
                        ) : (
                          <span className="text-2xl text-yellow-400 font-bold bg-[#111]">
                            {(vipCreator.username || 'V').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-yellow-500 max-w-[64px] truncate font-bold mt-1 text-center">
                      @{vipCreator.username || 'VIP Creador'}
                    </span>
                </div>
              )}

              {stories
              .filter((story: any, index: number, self: any[]) => 
                index === self.findIndex((s: any) => s.creator?.id === story.creator?.id)
              )
              .map(story => (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-gradient-to-tr from-red-600 to-orange-500 shadow-lg">
                    <div className="w-full h-full rounded-full bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                      {story.creator?.creatorProfile?.profileImage ? <img src={getImageUrl(story.creator.creatorProfile.profileImage)} alt="Avatar" draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" /> : <span className="text-xl text-white font-bold">{(story.creator?.username || 'U').toUpperCase()}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 max-w-[64px] truncate font-medium">@{story.creator?.username || 'Usuario'}</span>
                </div>
              ))}
            </div>

            {activeStreams.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {activeStreams.map(stream => (
                  <div key={stream.id} onClick={() => router.push(`/live/${stream.id}`)} className="relative shrink-0 w-56 h-32 rounded-2xl overflow-hidden cursor-pointer group border border-red-500/30 shadow-lg">
                    <div className="absolute inset-0 bg-black">
                      {stream.creator?.creatorProfile?.profileImage ? (
                        <img src={getImageUrl(stream.creator.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Fondo" />
                      ) : <div className="w-full h-full bg-gradient-to-br from-red-900 to-black"></div>}
                    </div>
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div> EN VIVO
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-bold truncate">{stream.title}</p>
                      <p className="text-red-300 text-[11px] font-bold">@{stream.creator?.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
              <div className="nm-inset p-6 rounded-[2rem] space-y-4 border border-white/5">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-orange-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg shrink-0">
                    {(() => {
                      const myFreshData = posts.find(p => p.user?.id === user?.id)?.user;
                      const avatarUrl = myFreshData?.creatorProfile?.profileImage || user?.creatorProfile?.profileImage;
                      
                      return avatarUrl ? (
                        <img src={getImageUrl(avatarUrl)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover object-center" alt="Avatar" />
                      ) : (
                        (user?.username || 'C').toUpperCase()
                      );
                    })()}
                  </div>
                  
                  <div className="w-full pt-2">
                    <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none" placeholder={t('ph_new_post')} rows={2}></textarea>
                    {/* 🔥 INICIO DEL FIX DE PREVISUALIZACIÓN */}
                    {imagePreview && selectedImage && (
                      <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 inline-block shadow-lg bg-black">
                        {selectedImage.type.startsWith('video/') ? (
                          <video 
                            src={imagePreview} 
                            controls 
                            controlsList="nodownload noplaybackrate" 
                            disablePictureInPicture 
                            className="max-h-64 object-cover" 
                          />
                        ) : (
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            draggable="false" 
                            onContextMenu={(e) => e.preventDefault()} 
                            className="max-h-64 object-cover" 
                          />
                        )}
                        <button onClick={() => { setImagePreview(null); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors z-10"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>

                {isPPV && (
                  <div className="flex items-center gap-3 pl-16 py-2 animate-fade-in">
                    <span className="text-green-400 font-bold text-sm">{t('lbl_ppv_price')}</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input type="number" min="1" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="nm-inset border border-green-500/20 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none w-32 font-bold text-sm"/>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
                  <div className="flex flex-wrap gap-2 text-sm font-bold items-center w-full sm:w-auto">
                    <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 nm-btn text-gray-400 hover:text-white transition-colors"><ImageIcon className="w-4 h-4" /><span className="hidden sm:inline">{t('btn_media')}</span></button>
                    <button onClick={() => setIsPPV(!isPPV)} className={`flex items-center gap-2 px-4 py-2.5 nm-btn transition-colors ${isPPV ? 'text-green-400 border border-green-500/30' : 'text-yellow-500'}`}><Lock className="w-4 h-4" /> <span className="hidden sm:inline">PPV</span></button>
                    <button onClick={handleStartLive} className="flex items-center gap-2 px-4 py-2.5 nm-btn text-red-500 hover:text-red-400 group"><Radio className="w-4 h-4 animate-pulse" /><span className="hidden sm:inline">{t('btn_live')}</span></button>
                  </div>
                  <button onClick={handlePublish} disabled={isPublishing || (!newPostContent.trim() && !selectedImage) || (isPPV && !price)} className="w-full sm:w-auto nm-btn-primary px-8 py-3">{isPublishing ? t('btn_uploading') : t('btn_publish')}</button>
                </div>
              </div>
            )}

            {/* FEED POSTS */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center text-gray-500 py-10 nm-inset border border-white/5 rounded-3xl">{t('empty_feed')}</div>
              ) : (
                posts.map((post, index) => {
                  const isOwner = user && post.user && user.id === post.user.id;
                  
                  const rootComments = buildCommentTree(post.comments || []);
                  const totalComments = post._count?.comments || 0; 
                  const isExpanded = expandedComments[post.id] || false;
                  
                  const visibleComments = isExpanded ? rootComments : rootComments.slice(0, 3);

                  return (
                    <React.Fragment key={`${post.id}-${index}`}>
                      {post.isPromoted && (
                        <div className="flex items-center gap-2 text-yellow-500 mb-[-12px] ml-4 relative z-10 animate-fade-in">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <span className="text-xs font-black uppercase tracking-widest">{t('lbl_recommended')}</span>
                        </div>
                      )}

                      <div id={`post-${post.id}`} className={`scroll-mt-24 transition-all duration-500 p-4 sm:p-6 rounded-[2rem] space-y-4 relative overflow-hidden shadow-xl border group ${post.isPromoted ? 'bg-[#111] border-yellow-500/30' : 'bg-[#0a0a0a] border-white/5'}`}>
                        
                        {/* 🔥 BOTONES DE ACCIÓN SUPERIOR */}
                        {isOwner ? (
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="absolute top-6 right-6 text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-full transition-all z-20"
                            title={t('title_delete_post')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setReportData({ type: 'POST', targetId: post.id, reportedUsername: post.user?.username })}
                            className="absolute top-6 right-6 text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-full transition-all z-20 opacity-50 hover:opacity-100"
                            title={t('title_report_post')}
                          >
                            <Flag className="w-5 h-5" />
                          </button>
                        )}

                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex items-center gap-3">
                            <div onClick={() => router.push(`/${post.user.username}`)} className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden cursor-pointer border ${post.isPromoted ? 'border-yellow-500' : 'border-white/10'}`}>
                              {post.user?.creatorProfile?.profileImage ? <img src={getImageUrl(post.user.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center ${post.isPromoted ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>{(post.user?.username || 'U').toUpperCase()}</div>}
                            </div>
                            <div onClick={() => router.push(`/${post.user.username}`)} className="cursor-pointer group">
                              <h3 className={`font-bold text-lg ${post.isPromoted ? 'text-yellow-500' : 'text-white'}`}>@{post.user?.username || 'usuario'}</h3>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                {post.isPPV ? (
                                  !post.hasAccess ? (
                                    <><Lock className="w-3 h-3 text-red-400"/> {isOwner ? `Tu PPV: $${(post.price || 0).toFixed(2)}` : t('lbl_exclusive_ppv')}</>
                                  ) : (
                                    <><Unlock className="w-3 h-3 text-green-400"/> {isOwner ? `Tu PPV: $${(post.price || 0).toFixed(2)}` : t('lbl_unlocked')}</>
                                  )
                                ) : !post.hasAccess ? (
                                  <><Lock className="w-3 h-3 text-red-400"/> {t('lbl_exclusive_vip')}</>
                                ) : (
                                  <><Star className="w-3 h-3 text-yellow-500"/> VIP</>
                                )}
                              </p>
                            </div>
                          </div>
                          {post.isPromoted && !isOwner && <button onClick={() => router.push(`/${post.user.username}`)} className="nm-btn border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-full text-xs font-bold mr-10">Ver Perfil</button>}
                        </div>
                        
                        {post.content && <p className="text-gray-200 text-base leading-relaxed">{post.content}</p>}

                        {!post.hasAccess ? (
                          <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 overflow-hidden group nm-inset mt-4">
                            {/* 🔥 FONDO BORROSO PREMIUM (FIX APLICADO) */}
                            {post.mediaUrl && (
                              post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                                <video src={getImageUrl(post.mediaUrl)} className="absolute inset-0 w-full h-full object-cover blur-[20px] opacity-50 scale-110 select-none pointer-events-none" />
                              ) : (
                                <img src={getImageUrl(post.mediaUrl)} alt="Contenido Oculto" draggable="false" onContextMenu={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full object-cover blur-[20px] opacity-50 scale-110 select-none pointer-events-none" />
                              )
                            )}

                            {/* 🧊 CAPA GLASS SUAVE */}
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                            
                            {/* 🔒 CONTENIDO CENTRAL */}
                            <div className="relative z-10 flex flex-col items-center bg-black/60 px-10 py-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                              <Lock className={`w-14 h-14 mb-4 ${post.isPromoted ? 'text-yellow-500' : 'text-red-500'}`} />
                              {isOwner ? (
                                <button disabled className="py-3 px-8 text-sm flex items-center gap-2 font-bold nm-inset text-red-500 cursor-default rounded-xl">
                                  <Lock className="w-4 h-4"/> {t('lbl_your_ppv')} (${(post.price || 0).toFixed(2)})
                                </button>
                              ) : (
                                <button onClick={() => handleUnlockClick(post)} className={`py-3 px-8 text-sm flex items-center gap-2 font-bold ${post.isPromoted ? 'bg-yellow-500 text-black rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'nm-btn-primary rounded-xl'}`}>
                                  {t('btn_unlock_for')} ${(post.price || 0).toFixed(2)}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            {post.mediaUrl && (
                              <div className="mt-4 rounded-2xl overflow-hidden nm-inset border border-white/5 relative bg-black/50 flex justify-center">
                                {post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                                  <video onContextMenu={(e) => e.preventDefault()} controls controlsList="nodownload noplaybackrate" disablePictureInPicture src={getImageUrl(post.mediaUrl)} className="w-full h-auto max-h-[70vh] sm:max-h-[600px] object-contain bg-black" />
                                ) : (
                                  <img src={getImageUrl(post.mediaUrl, post.user?.username)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-auto object-cover max-h-[600px] cursor-pointer" onClick={() => setExpandedImage({ url: getImageUrl(post.mediaUrl, post.user?.username), username: post.user?.username })} />
                                )}
                              </div>
                            )}

                            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-white/5">
                              <div className="flex items-center justify-between relative">
                                <div className="flex items-center gap-3">
                                  
                                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                    {['❤️', '❤️‍🔥', '🫦', '🤤'].map((emoji) => {
                                      const isSelected = post.myReaction === emoji;
                                      const count = post.reactionCounts ? (post.reactionCounts[emoji] || 0) : 0;
                                      
                                      return (
                                        <button 
                                          key={emoji}
                                          onClick={() => handleReact(post.id, emoji)}
                                          className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${isSelected ? 'scale-110 opacity-100 grayscale-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                          title="Reaccionar"
                                        >
                                          <span className="text-xl">{emoji}</span>
                                          {count > 0 && (
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                              {count}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  
                                  <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 font-bold transition-all px-4 py-2.5 rounded-full bg-white/5 border border-white/10 ${commentingPostId === post.id ? 'text-blue-500 border-blue-500/30' : 'text-gray-400 hover:text-blue-400 hover:border-white/20'}`}>
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm">{totalComments}</span>
                                  </button>
                                </div>
                                
                                {!isOwner && (
                                  <button onClick={() => { setTipRecipient(post.user); setIsTipModalOpen(true); }} className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 font-bold transition-colors">
                                    <Coins className="w-5 h-5" />
                                    <span className="text-sm hidden sm:inline">{t('btn_tip')}</span>
                                  </button>
                                )}
                              </div>

                              {commentingPostId === post.id && (
                                <div className="flex flex-col gap-2 animate-fade-in mt-2">
                                  {replyingToCommentId && (
                                    <div className="flex justify-between items-center bg-blue-900/20 px-3 py-1 text-xs text-blue-400 rounded-lg">
                                      <span>{t('lbl_replying')}</span>
                                      <button onClick={() => setReplyingToCommentId(null)}><X className="w-3 h-3"/></button>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={commentText} 
                                      onChange={(e) => setCommentText(e.target.value)} 
                                      placeholder={t('ph_write_comment')}
                                      className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" 
                                      onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                    />
                                    <button 
                                      onClick={() => submitComment(post.id)} 
                                      disabled={isSubmittingComment || !commentText.trim()} 
                                      className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shrink-0 disabled:opacity-50"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {totalComments > 0 && (
                                 <div className="space-y-1 mt-4">
                                   {visibleComments.map((comment: any) => (
                                      <CommentNode 
                                        key={comment.id} 
                                        comment={comment} 
                                        postId={post.id}
                                        postOwnerId={post.user?.id} 
                                        currentUser={user}
                                        onReply={handleReplyClick} 
                                        onDelete={handleDeleteComment}
                                        onReport={(commentId, username) => setReportData({ type: 'COMMENT', targetId: commentId, reportedUsername: username })}
                                        onBlock={handleBlockUser}
                                        isExpanded={isExpanded}
                                      />
                                   ))}

                                   {totalComments > 3 && (
                                     <button 
                                       onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
                                       className="text-xs text-gray-500 font-bold mt-2 hover:text-white pt-2 w-full text-left transition-colors"
                                     >
                                       {isExpanded ? t('btn_hide_comments') : `${t('btn_view_the')} ${totalComments} ${t('lbl_comments')}`}
                                     </button>
                                   )}
                                 </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </main>

          {/* ================= COLUMNA DERECHA ================= */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-[#0a0a0a] rounded-[2rem] border border-yellow-500/20 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-900/30 to-black p-5 border-b border-yellow-500/20 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('aside_trending')}</h3>
                </div>
                <div className="p-2">
                  {trendingCreators.map((creator, idx) => (
                    <div key={creator.id} onClick={() => router.push(`/${creator.username}`)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold border border-yellow-500/50 overflow-hidden shadow-lg">
                          {creator.creatorProfile?.profileImage ? <img src={getImageUrl(creator.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" /> : (creator.username || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm flex items-center gap-1">{creator.username || 'Usuario'} {idx === 0 && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/>}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 transition-transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
                {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                  <div className="p-4 border-t border-white/5 text-center">
                    <p onClick={() => setIsBoostModalOpen(true)} className="text-gray-500 text-[10px] uppercase font-bold tracking-widest cursor-pointer hover:text-yellow-500">{t('aside_want_appear')}</p>
                  </div>
                )}
              </div>

              {featuredBundle && (
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 rounded-[2rem] border border-blue-500/30 shadow-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-lg">
                    <Zap className="w-3 h-3 fill-white"/> {t('badge_recommended')}
                  </div>
                  
                  <div onClick={() => router.push(`/${featuredBundle.creator?.username}`)} className="cursor-pointer flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-1 mb-3 relative group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                       <div className="w-full h-full rounded-full overflow-hidden bg-black">
                         {featuredBundle.creator?.creatorProfile?.profileImage ? (
                           <img src={getImageUrl(featuredBundle.creator.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" alt="Avatar" />
                         ) : (
                           <span className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500">
                             {(featuredBundle.creator?.username || 'U').toUpperCase()}
                           </span>
                         )}
                       </div>
                    </div>
                    
                    <h3 className="text-white font-black text-lg leading-tight">@{featuredBundle.creator?.username}</h3>
                    <p className="text-blue-300 text-[11px] font-bold mt-1 mb-4 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      {t('lbl_bundle')}: {featuredBundle.title}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 relative z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUnlockBundle(featuredBundle); }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 text-sm"
                    >
                      <Unlock className="w-4 h-4"/> {t('btn_buy_bundle')} ${featuredBundle.price}
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/${featuredBundle.creator?.username}`); }}
                      className="w-full bg-transparent border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Crown className="w-4 h-4"/> {t('btn_view_subscribe')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </aside>

        </div>
        
        {/* ================= MODALES ================= */}
        {activeStory && (
          <div className="fixed inset-0 z-[99999] bg-black/95 flex flex-col animate-fade-in select-none pointer-events-auto">
            
            {/* 📊 BARRAS DE PROGRESO TIPO INSTAGRAM */}
            <div className="absolute top-4 left-0 right-0 z-[100001] flex gap-1 px-4 max-w-lg mx-auto w-full">
              {stories
                .filter((s: any) => s.creator?.id === activeStory.creator?.id)
                .map((s: any, index: number) => (
                  <div key={s.id || index} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden shadow-sm">
                    <div 
                      className={"h-full bg-white transition-all duration-300 " + (index <= currentStoryIndex ? "w-full" : "w-0")}
                    />
                  </div>
                ))
              }
            </div>

            {/* HEADER */}
            <div className="fixed top-0 left-0 w-full z-[100000] flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent pt-8">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/20 shadow-lg">
                  {activeStory.creator?.creatorProfile?.profileImage ? (
                    <img src={getImageUrl(activeStory.creator.creatorProfile.profileImage)} draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {(activeStory.creator?.username || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-white font-bold drop-shadow-md">
                  @{activeStory.creator?.username}
                </span>
              </div>

              <div className="flex items-center gap-3 z-[100001]">
                {(user?.id === activeStory.creator?.id || user?.role === 'ADMIN') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(activeStory.id); }}
                    className="w-10 h-10 bg-black/50 hover:bg-red-600 text-gray-300 hover:text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-lg cursor-pointer"
                    title="Eliminar historia"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setActiveStory(null); }}
                  className="w-10 h-10 bg-black/50 hover:bg-white/20 text-gray-300 hover:text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-lg cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* MEDIA */}
            <div className="flex-1 flex justify-center items-center p-4 pt-24 relative z-10 w-full h-full">
              
              {/* 👈 ZONA TÁCTIL IZQUIERDA (Retroceder) */}
              <div 
                className="absolute top-0 left-0 w-1/3 h-full z-20 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  const userStories = stories.filter((s: any) => s.creator?.id === activeStory.creator?.id);
                  if (currentStoryIndex > 0) {
                    const prevIdx = currentStoryIndex - 1;
                    setCurrentStoryIndex(prevIdx);
                    setActiveStory(userStories[prevIdx]);
                  }
                }} 
              />

              {/* 👉 ZONA TÁCTIL DERECHA (Avanzar / Cerrar) */}
              <div 
                className="absolute top-0 right-0 w-2/3 h-full z-20 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  const userStories = stories.filter((s: any) => s.creator?.id === activeStory.creator?.id);
                  if (currentStoryIndex < userStories.length - 1) {
                    const nextIdx = currentStoryIndex + 1;
                    setCurrentStoryIndex(nextIdx);
                    setActiveStory(userStories[nextIdx]);
                  } else {
                    setActiveStory(null);
                    setCurrentStoryIndex(0);
                  }
                }} 
              />

              {/* CONTENIDO (Imagen o Video) */}
              <div className="relative z-10 max-w-full max-h-full flex justify-center items-center pointer-events-none">
                {activeStory.mediaUrl?.match(/\.(mp4|mov|webm)$/i) ? (
                  <video
                    src={getImageUrl(activeStory.mediaUrl)}
                    autoPlay
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-w-full max-h-full rounded-2xl shadow-2xl relative z-30 pointer-events-auto"
                  />
                ) : (
                  <img
                    src={getImageUrl(activeStory.mediaUrl, activeStory.creator?.username)}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
                  />
                )}
              </div>
            </div>

            {/* CAPTION */}
            {activeStory.caption && (
              <div className="fixed bottom-10 left-0 w-full text-center px-4 z-[100000]">
                <span className="bg-black/70 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-white font-medium shadow-2xl inline-block max-w-xl">
                  {activeStory.caption}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 🔥 MODAL DE PROPINAS RESTAURADO */}
        {isTipModalOpen && tipRecipient && (
          <TipModal 
            creatorName={tipRecipient.username} 
            onClose={() => setIsTipModalOpen(false)} 
            onContinue={async (amount, message) => { 
              setIsTipModalOpen(false); 
              try { 
                const data = await paymentService.createPaymentIntent({ amount: amount || 0, type: 'TIP', creatorId: tipRecipient.id, description: `Propina: ${message}` }); 
                if (data.success || data.receipt) {
                  alert('✅ ' + t('alert_unlocked'));
                  router.refresh();
                  fetchData();
                } else {
                  setClientSecret(data.clientSecret); setSelectedPost({ id: 'tip', price: amount }); setIsPaymentModalOpen(true); 
                }
              } catch (error) { alert(t('alert_error_payment')); }
            }} 
          />
        )}
        
        {isPaymentModalOpen && clientSecret && selectedPost && (
          <PaymentModal 
            clientSecret={clientSecret} 
            price={selectedPost.price || 0} 
            creatorId={selectedPost.user?.id || tipRecipient?.id || featuredBundle?.creatorId}
            onClose={() => setIsPaymentModalOpen(false)} 
            onSuccess={async () => { 
              setIsPaymentModalOpen(false); 
              if (selectedPost.isBundle) {
                try {
                  await api.post('/bundles/purchase', { bundleId: selectedPost.id });
                } catch (e) {
                  console.error('Error interno al liberar el paquete:', e);
                }
              }
              alert(t('alert_payment_success'));
              fetchData(); 
            }} 
          />
        )}

        {isBoostModalOpen && (
          <BoostModal 
            onClose={() => setIsBoostModalOpen(false)} 
            creatorBalance={walletBalance} 
          />
        )}

        {/* 🔥 MODAL DE REPORTES INTEGRADO AQUÍ */}
        {reportData && (
          <ReportModal 
            type={reportData.type}
            targetId={reportData.targetId}
            reportedUsername={reportData.reportedUsername}
            onClose={() => setReportData(null)}
          />
        )}

        {expandedImage && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none" 
            style={{ zIndex: 99999 }}
            onClick={() => setExpandedImage(null)} 
            onContextMenu={(e) => e.preventDefault()}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setExpandedImage(null); }} 
              className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10" 
              style={{ zIndex: 100000 }} 
              title={t('btn_cancel')}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage.url} alt={t('lbl_exclusive')} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none" draggable="false" onContextMenu={(e) => e.preventDefault()} />
              <div className="absolute inset-0 w-full h-full cursor-default" onContextMenu={(e) => e.preventDefault()} style={{ zIndex: 10 }}></div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}