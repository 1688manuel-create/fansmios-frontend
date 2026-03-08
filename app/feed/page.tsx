"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { postService } from '../../lib/postService';
import { paymentService } from '../../lib/paymentService';
import { storyService } from '../../lib/storyService'; 
import { notificationService } from '../../lib/notificationService'; 
import { chatService } from '../../lib/chatService'; 
import api from '../../lib/api'; 
import PaymentModal from '../../components/PaymentModal';
import TipModal from '../../components/TipModal';
import { liveService } from '../../lib/liveService';
import AppLayout from '../../components/AppLayout';
import React from 'react';
import BoostModal from '../../components/BoostModal';

// 🔥 IMPORTAMOS LOS ICONOS PREMIUM
import { 
  Image as ImageIcon, Lock, Radio, Bell, MessageCircle, Settings, LogOut, 
  Crown, LayoutDashboard, Plus, Trash2, Unlock, Coins, Eye, Ghost, X, User,
  TrendingUp, Zap, Star, ChevronRight, Send, Package
} from 'lucide-react';

import { requestPushPermission } from '../../lib/firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  return `${BACKEND_URL}${path}`; 
};

export default function Feed() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState<any>(null); 
  const [clientSecret, setClientSecret] = useState(''); 
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);

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
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);

  const [stories, setStories] = useState<any[]>([]);
  const [activeStory, setActiveStory] = useState<any>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const [activeStreams, setActiveStreams] = useState<any[]>([]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0); 
  
  // 📸 VISOR DE IMÁGENES RECUPERADO
  const [expandedImage, setExpandedImage] = useState<{url: string, username: string} | null>(null);
  
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [featuredBundle, setFeaturedBundle] = useState<any>(null);
  const [vipCreator, setVipCreator] = useState<any>(null);

  // 💰 ESTADO PARA EL SALDO REAL DE LA BILLETERA
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token) { router.push('/auth'); return; } 
    if (storedUser && storedUser !== "undefined") {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
    fetchData(); 
    requestPushPermission();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      notificationService.getNotifications().then(res => setUnreadNotifications(res.unreadCount || 0)).catch(() => {});
      chatService.getUnreadCount().then(res => setUnreadMessages(res.unreadCount || 0)).catch(() => {});
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [postData, storyData, notifData, liveData, chatData, trendingData, featuredBundleData, vipCreatorData, walletData] = await Promise.all([
        postService.getAllPosts(),
        storyService.getFeedStories(),
        notificationService.getNotifications().catch(() => ({ unreadCount: 0 })),
        liveService.getActiveStreams().catch(() => ({ activeStreams: [] })),
        chatService.getUnreadCount().catch(() => ({ unreadCount: 0 })),
        api.get('/users/trending').catch(() => ({ data: { trending: [] } })),
        api.get('/bundles/featured').catch(() => ({ data: { bundle: null } })),
        api.get('/users/vip-story').catch(() => ({ data: { vip: null } })),
        api.get('/wallet').catch(() => ({ data: { wallet: { balance: 0 } } })) // 🔥 Billetera Real
      ]);
      
      let feedPosts = postData.posts || [];
      feedPosts = feedPosts.filter((post: any, index: number, self: any[]) => index === self.findIndex((t) => t.id === post.id));
      
      setPosts(feedPosts); 
      setStories(storyData.stories || []);
      setUnreadNotifications(notifData.unreadCount || 0); 
      setActiveStreams(liveData.activeStreams || []);
      setUnreadMessages(chatData.unreadCount || 0); 
      setTrendingCreators(trendingData.data.trending || []);
      setFeaturedBundle(featuredBundleData.data?.bundle || null);
      setVipCreator(vipCreatorData.data?.vip || null);
      
      setWalletBalance(walletData.data?.wallet?.balance || 0);

    } catch (error) { console.error('Error cargando datos:', error); }
    finally { setIsLoading(false); }
  };

  // 🔥 NUEVA FUNCIÓN PARA COBRAR EL PAQUETE AZUL (CORREGIDA)
  const handleUnlockBundle = async (bundle: any) => {
    try {
      // 🛡️ TRUCO: Usamos 'any' para que TypeScript no bloquee la palabra 'bundleId'
      const payload: any = {
        amount: bundle.price,
        type: 'BUNDLE',
        creatorId: bundle.creatorId,
        bundleId: bundle.id,
        description: `Compra de Paquete VIP: ${bundle.title}`
      };

      const data = await paymentService.createPaymentIntent(payload);
      
      setClientSecret(data.clientSecret);
      // Le agregamos la bandera isBundle para que el modal sepa qué hacer al terminar
      setSelectedPost({ id: bundle.id, price: bundle.price, user: bundle.creator, isBundle: true });
      setIsPaymentModalOpen(true);
    } catch (error) {
      alert('Error al procesar el pago del paquete. Verifica tu conexión.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
      if (selectedImage) formData.append('image', selectedImage);
      await postService.createPost(formData);
      setNewPostContent(''); setIsPPV(false); setPrice(''); setSelectedImage(null); setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
      fetchData(); 
    } catch (error: any) { alert(error.response?.data?.error || 'Error al publicar.'); } 
    finally { setIsPublishing(false); }
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const caption = window.prompt("Mensaje para tus fans (Opcional):");
      setIsUploadingStory(true);
      try {
        await storyService.createStory(e.target.files[0], caption || '');
        await fetchData(); 
      } catch (error) { alert("Error al subir historia."); } 
      finally {
        setIsUploadingStory(false);
        if (storyFileInputRef.current) storyFileInputRef.current.value = '';
      }
    }
  };

  const handleStartLive = async () => {
    const title = window.prompt("Título de tu transmisión:", "¡Cotorreando!");
    if (!title) return; 
    try {
      const res = await liveService.createStream(title);
      router.push(`/live/${res.liveStream.id}`);
    } catch (error) { alert("Error al iniciar Live."); }
  };

  const openStory = async (story: any) => {
    setActiveStory(story);
    try { await storyService.viewStory(story.id); fetchData(); } catch (error) {}
  };

  const handleUnlockClick = async (post: any) => {
    try {
      const data = await paymentService.createPaymentIntent({
        amount: post.price,
        type: 'POST',
        creatorId: post.user?.id || 'mock',
        postId: post.id,
        description: 'Desbloqueo de Post'
      });
      setClientSecret(data.clientSecret);
      setSelectedPost(post);
      setIsPaymentModalOpen(true);
    } catch (error) { alert('Error con la pasarela.'); }
  };

  const handleLogout = () => { localStorage.clear(); router.push('/auth'); };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        {/* ================= TOP NAVBAR ================= */}
        <nav className="sticky top-0 z-50 bg-[#0e0e0e]/90 border-b border-white/5 px-4 sm:px-6 py-3 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 onClick={() => router.push('/feed')} className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tighter cursor-pointer flex items-center gap-1">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">⚡</span> FANSMIOS
          </h1>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-400 text-sm hidden sm:flex items-center gap-1.5 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              {user?.role === 'ADMIN' ? <Crown className="w-4 h-4 text-red-500"/> : user?.role === 'CREATOR' ? <Crown className="w-4 h-4 text-yellow-500"/> : <User className="w-4 h-4 text-blue-400"/>} 
              <span className="text-white ml-1 font-bold">{user?.username || user?.email?.split('@')[0]}</span>
            </span>
            
            <button onClick={() => router.push('/dashboard/notifications')} className="relative text-xs nm-btn text-gray-300 px-3 sm:px-4 py-2 rounded-full hover:text-white transition-all font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> <span className="hidden sm:inline">Notificaciones</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center border border-black shadow-lg">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                </span>
              )}
            </button>

            <button onClick={() => router.push('/dashboard/messages')} className="relative text-xs nm-btn text-gray-300 px-3 sm:px-4 py-2 rounded-full hover:text-white transition-all font-bold flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">Mensajes</span>
            </button>

            <button onClick={() => router.push('/dashboard')} className="text-xs nm-btn text-gray-300 px-3 sm:px-4 py-2 rounded-full hover:text-white transition-all font-bold flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">{user?.role === 'CREATOR' ? 'Panel' : 'Herramientas'}</span>
            </button>
            <button onClick={handleLogout} className="text-xs nm-btn text-red-500 px-3 sm:px-4 py-2 rounded-full hover:text-white hover:bg-red-600 transition-all font-bold hidden sm:flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </nav>

        {/* ================= CONTENEDOR PRINCIPAL ================= */}
        <div className="max-w-7xl mx-auto flex justify-center gap-8 mt-6 px-4">
          
          <main className="w-full max-w-3xl shrink-0 space-y-8 pb-10">
            
            {/* STORIES CAROUSEL */}
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                <div onClick={() => storyFileInputRef.current?.click()} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-white/5 border border-white/10 group-hover:border-red-500/50 flex items-center justify-center shadow-lg">
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-transparent">
                      {isUploadingStory ? <span className="text-xl animate-spin">⏳</span> : <Plus className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 max-w-[64px] truncate font-medium">Tu historia</span>
                  <input type="file" accept="image/*,video/*" className="hidden" ref={storyFileInputRef} onChange={handleStoryUpload} />
                </div>
              )}

             {/* 🟡 1. HISTORIA DORADA VIP (NUEVO DISEÑO "CORONA" - BLINDADO) */}
              {vipCreator && (
                <div onClick={() => router.push(`/${vipCreator.username}`)} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 relative mt-1.5">
                    
                    {/* 👑 LA NUEVA CORONA VIP: Posicionada arriba para no tapar nada */}
                    <div className="absolute -top-3 z-10 bg-[#0e0e0e] border border-yellow-500 rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse">
                      <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-500" />
                      <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">VIP</span>
                    </div>

                    {/* El Anillo Dorado Premium (bajado ligeramente para dar espacio a la corona) */}
                    <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.3)] mt-1">
                      <div className="w-full h-full rounded-full bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                        {vipCreator.creatorProfile?.profileImage ? (
                          <img src={getImageUrl(vipCreator.creatorProfile.profileImage)} className="w-full h-full object-cover" alt="Avatar VIP" />
                        ) : (
                          // Escudo blindado si no hay foto: Usa la inicial de username, o 'V' si username es null
                          <span className="text-2xl text-yellow-400 font-bold bg-[#111]">
                            {(vipCreator.username || 'V')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 🔥 Nombre Despejado y Blindado: No se tapa porque el badge se movió arriba */}
                    <span className="text-xs text-yellow-500 max-w-[64px] truncate font-bold mt-1 text-center">
                      @{vipCreator.username || 'VIP Creador'}
                    </span>
                </div>
              )}

              {stories.map(story => (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full p-1 transition-transform group-hover:scale-105 bg-gradient-to-tr from-red-600 to-orange-500 shadow-lg">
                    <div className="w-full h-full rounded-full bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                      {story.creator?.creatorProfile?.profileImage ? <img src={getImageUrl(story.creator.creatorProfile.profileImage)} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-xl text-white font-bold">{(story.creator?.username || 'U')[0].toUpperCase()}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 max-w-[64px] truncate font-medium">@{story.creator?.username || 'Usuario'}</span>
                </div>
              ))}
            </div>

            {/* LIVE STREAMS */}
            {activeStreams.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {activeStreams.map(stream => (
                  <div key={stream.id} onClick={() => router.push(`/live/${stream.id}`)} className="relative shrink-0 w-56 h-32 rounded-2xl overflow-hidden cursor-pointer group border border-red-500/30 shadow-lg">
                    <div className="absolute inset-0 bg-black">
                      {stream.creator?.creatorProfile?.profileImage ? (
                        <img src={getImageUrl(stream.creator.creatorProfile.profileImage)} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Fondo" />
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

            {/* PANEL CREADOR */}
            {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
              <div className="nm-inset p-6 rounded-[2rem] space-y-4 border border-white/5">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-orange-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg">
                    {(user?.username || 'C')[0].toUpperCase()}
                  </div>
                  <div className="w-full pt-2">
                    <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none" placeholder="¿Qué contenido exclusivo vas a subir hoy?" rows={2}></textarea>
                    {imagePreview && (
                      <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 inline-block shadow-lg">
                        <img src={imagePreview} alt="Preview" className="max-h-64 object-cover" />
                        <button onClick={() => { setImagePreview(null); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>

                {isPPV && (
                  <div className="flex items-center gap-3 pl-16 py-2 animate-fade-in">
                    <span className="text-green-400 font-bold text-sm">Precio PPV:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input type="number" min="1" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="nm-inset border border-green-500/20 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none w-32 font-bold text-sm"/>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
                  <div className="flex flex-wrap gap-2 text-sm font-bold items-center w-full sm:w-auto">
                    <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 nm-btn text-gray-400 hover:text-white transition-colors"><ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Media</span></button>
                    <button onClick={() => setIsPPV(!isPPV)} className={`flex items-center gap-2 px-4 py-2.5 nm-btn transition-colors ${isPPV ? 'text-green-400 border border-green-500/30' : 'text-yellow-500'}`}><Lock className="w-4 h-4" /> <span className="hidden sm:inline">PPV</span></button>
                    <button onClick={handleStartLive} className="flex items-center gap-2 px-4 py-2.5 nm-btn text-red-500 hover:text-red-400 group"><Radio className="w-4 h-4 animate-pulse" /> <span className="hidden sm:inline">Live</span></button>
                  </div>
                  <button onClick={handlePublish} disabled={isPublishing || (!newPostContent.trim() && !selectedImage) || (isPPV && !price)} className="w-full sm:w-auto nm-btn-primary px-8 py-3">{isPublishing ? 'Subiendo...' : 'Publicar'}</button>
                </div>
              </div>
            )}

            {/* FEED POSTS */}
            <div className="space-y-6">
              {posts.length === 0 ? <div className="text-center text-gray-500 py-10 nm-inset border border-white/5 rounded-3xl">Sin publicaciones aún.</div> : (
                posts.map((post, index) => (
                  <React.Fragment key={`${post.id}-${index}`}>
                    {post.isPromoted && (
                      <div className="flex items-center gap-2 text-yellow-500 mb-[-12px] ml-4 relative z-10 animate-fade-in">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span className="text-xs font-black uppercase tracking-widest">Recomendado para ti</span>
                      </div>
                    )}

                    <div className={`p-4 sm:p-6 rounded-[2rem] space-y-4 relative overflow-hidden shadow-xl border ${post.isPromoted ? 'bg-[#111] border-yellow-500/30' : 'bg-[#0a0a0a] border-white/5'}`}>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                          <div onClick={() => router.push(`/${post.user.username}`)} className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden cursor-pointer border ${post.isPromoted ? 'border-yellow-500' : 'border-white/10'}`}>
                            {post.user?.creatorProfile?.profileImage ? <img src={getImageUrl(post.user.creatorProfile.profileImage)} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center ${post.isPromoted ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>{(post.user?.username || 'U')[0].toUpperCase()}</div>}
                          </div>
                          <div onClick={() => router.push(`/${post.user.username}`)} className="cursor-pointer group">
                            <h3 className={`font-bold text-lg ${post.isPromoted ? 'text-yellow-500' : 'text-white'}`}>@{post.user?.username || 'usuario'}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{!post.hasAccess ? 'Exclusivo' : 'Público'}</p>
                          </div>
                        </div>
                        {post.isPromoted && <button onClick={() => router.push(`/${post.user.username}`)} className="nm-btn border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-full text-xs font-bold">Ver Perfil</button>}
                      </div>
                      
                      {post.content && <p className="text-gray-200 text-base leading-relaxed">{post.content}</p>}

                      {!post.hasAccess ? (
                        <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 overflow-hidden group nm-inset">
                          <div className="relative z-10 flex flex-col items-center bg-black/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
                            <Lock className={`w-16 h-16 mb-4 ${post.isPromoted ? 'text-yellow-500' : 'text-red-500'}`} />
                            <button onClick={() => handleUnlockClick(post)} className={`py-3 px-8 text-sm flex items-center gap-2 font-bold ${post.isPromoted ? 'bg-yellow-500 text-black rounded-full' : 'nm-btn-primary'}`}>
                              <Unlock className="w-4 h-4"/> Desbloquear ${post.price}
                            </button>
                          </div>
                        </div>
                      ) : (
                        post.mediaUrl && (
                          <div className="mt-4 rounded-2xl overflow-hidden nm-inset border border-white/5 relative bg-black/50 flex justify-center">
                            {post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                              <video controls controlsList="nodownload" src={getImageUrl(post.mediaUrl)} className="w-full max-h-[600px] object-cover" />
                            ) : (
                              // 📸 AQUÍ SE LLAMA AL VISOR EXPANDIDO
                              <img src={getImageUrl(post.mediaUrl)} className="w-full h-auto object-cover max-h-[600px] cursor-pointer" onClick={() => setExpandedImage({ url: getImageUrl(post.mediaUrl), username: post.user?.username })} />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>
          </main>

          {/* ================= COLUMNA DERECHA ================= */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 space-y-6">
              
              {/* TRENDING VIP */}
              <div className="bg-[#0a0a0a] rounded-[2rem] border border-yellow-500/20 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-900/30 to-black p-5 border-b border-yellow-500/20 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Trending VIP</h3>
                </div>
                <div className="p-2">
                  {trendingCreators.map((creator, idx) => (
                    <div key={creator.id} onClick={() => router.push(`/${creator.username}`)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold border border-yellow-500/50 overflow-hidden shadow-lg">
                          {creator.creatorProfile?.profileImage ? <img src={getImageUrl(creator.creatorProfile.profileImage)} className="w-full h-full object-cover" /> : (creator.username || 'U')[0].toUpperCase()}
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
                    <p onClick={() => setIsBoostModalOpen(true)} className="text-gray-500 text-[10px] uppercase font-bold tracking-widest cursor-pointer hover:text-yellow-500">¿Quieres aparecer aquí?</p>
                  </div>
                )}
              </div>

              {/* 🔵 2. BANNER AZUL ULTRA-PREMIUM */}
              {featuredBundle && (
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 rounded-[2rem] border border-blue-500/30 shadow-2xl p-6 relative overflow-hidden group">
                  {/* Etiqueta Superior */}
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-lg">
                    <Zap className="w-3 h-3 fill-white"/> RECOMENDADO
                  </div>
                  
                  {/* Foto de Perfil y Nombre */}
                  <div onClick={() => router.push(`/${featuredBundle.creator?.username}`)} className="cursor-pointer flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-1 mb-3 relative group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                       <div className="w-full h-full rounded-full overflow-hidden bg-black">
                         {featuredBundle.creator?.creatorProfile?.profileImage ? (
                           <img src={getImageUrl(featuredBundle.creator.creatorProfile.profileImage)} className="w-full h-full object-cover" alt="Avatar" />
                         ) : (
                           <span className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500">
                             {(featuredBundle.creator?.username || 'U')[0].toUpperCase()}
                           </span>
                         )}
                       </div>
                    </div>
                    
                    <h3 className="text-white font-black text-lg leading-tight">@{featuredBundle.creator?.username}</h3>
                    <p className="text-blue-300 text-[11px] font-bold mt-1 mb-4 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Paquete: {featuredBundle.title}
                    </p>
                  </div>

                  {/* Botonera Doble (Impulso + Suscripción) */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUnlockBundle(featuredBundle); }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 text-sm"
                    >
                      <Unlock className="w-4 h-4"/> Comprar Paquete ${featuredBundle.price}
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/${featuredBundle.creator?.username}`); }}
                      className="w-full bg-transparent border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Crown className="w-4 h-4"/> Ver Perfil y Suscribirse
                    </button>
                  </div>
                </div>
              )}

            </div>
          </aside>

        </div>
        
        {/* ================= MODALES ================= */}
        {activeStory && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-fade-in select-none">
            <div className="flex justify-between items-center p-4 absolute top-0 w-full z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/20">
                  {activeStory.creator?.creatorProfile?.profileImage ? <img src={getImageUrl(activeStory.creator.creatorProfile.profileImage)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{(activeStory.creator?.username || 'U')[0].toUpperCase()}</div>}
                </div>
                <span className="text-white font-bold">@{activeStory.creator?.username}</span>
              </div>
              <button onClick={() => setActiveStory(null)} className="w-10 h-10 nm-btn hover:bg-red-500 text-gray-400 rounded-full flex items-center justify-center"><X className="w-6 h-6"/></button>
            </div>
            <div className="flex-1 flex justify-center items-center p-4">
              {activeStory.mediaUrl?.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={getImageUrl(activeStory.mediaUrl)} autoPlay controls className="max-w-full max-h-full rounded-2xl shadow-2xl" />
              ) : (
                <img src={getImageUrl(activeStory.mediaUrl)} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain pointer-events-none" />
              )}
            </div>
          </div>
        )}

        {isTipModalOpen && tipRecipient && (
          <TipModal 
            creatorName={tipRecipient.username} 
            onClose={() => setIsTipModalOpen(false)} 
            onContinue={async (amount, message) => { 
              setIsTipModalOpen(false); 
              try { 
                const data = await paymentService.createPaymentIntent({ amount: amount, type: 'TIP', creatorId: tipRecipient.id, description: `Tip: ${message}` }); 
                setClientSecret(data.clientSecret); setSelectedPost({ id: 'tip', price: amount }); setIsPaymentModalOpen(true); 
              } catch (error) { alert('Error al procesar propina.'); } 
            }} 
          />
        )}

        {isPaymentModalOpen && clientSecret && selectedPost && (
          <PaymentModal 
            clientSecret={clientSecret} 
            price={selectedPost.price} 
            creatorId={selectedPost.user?.id || tipRecipient?.id || featuredBundle?.creatorId}
            onClose={() => setIsPaymentModalOpen(false)} 
            onSuccess={async () => { 
              setIsPaymentModalOpen(false); 
              
              // 🪄 MAGIA DE ENTREGA: Si lo que compró fue un Paquete, lo desbloqueamos en la Base de Datos
              if (selectedPost.isBundle) {
                try {
                  await api.post('/bundles/purchase', { bundleId: selectedPost.id });
                } catch (e) {
                  console.error('Error interno al liberar el paquete:', e);
                }
              }

              alert("¡Pago exitoso! El contenido ya es tuyo 🔓"); 
              fetchData(); // Recargamos el muro para que desaparezcan los candados
            }} 
          />
        )}

        {isBoostModalOpen && (
          <BoostModal 
            onClose={() => setIsBoostModalOpen(false)} 
            creatorBalance={walletBalance} 
          />
        )}

        {/* 📸 MODAL VISOR DE IMÁGENES (RESTAUARDO) */}
        {expandedImage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none" onClick={() => setExpandedImage(null)} onContextMenu={(e) => e.preventDefault()}>
            <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all z-50 border border-white/10" title="Cerrar"><X className="w-6 h-6" /></button>
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage.url} alt="Exclusivo" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none" draggable="false" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden opacity-30 mix-blend-overlay">
                 <div className="transform -rotate-45 flex flex-col items-center">
                   <span className="text-white text-5xl md:text-8xl font-black uppercase tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">FANSMIOS</span>
                   <span className="text-white text-xl md:text-3xl font-bold drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mt-2">@{expandedImage.username || 'Usuario'}</span>
                 </div>
              </div>
              <div className="absolute inset-0 z-10 w-full h-full cursor-default"></div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}