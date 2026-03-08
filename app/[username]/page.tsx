"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../lib/api';
import { postService } from '../../lib/postService';
import PaymentModal from '../../components/PaymentModal';
import TipModal from '../../components/TipModal';
import ReportModal from '../../components/ReportModal'; 
import AppLayout from '../../components/AppLayout';

// 🔥 CORRECCIÓN: Quitamos Instagram, Twitter y Globe de Lucide para evitar errores de versión.
import { 
  ArrowLeft, CheckCircle2, MessageCircle, Flag, Star, Lock, 
  Unlock, Bookmark, Trash2, Coins, Package, Image as ImageIcon,
  ShieldAlert, Ghost, FileText, X, Plus, Crown, Send, Link
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  return `${BACKEND_URL}${path}`; 
};

export default function CreatorProfile() {
  const params = useParams(); 
  const router = useRouter();
  
  const rawUsername = params?.username;
  const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null); 
  const [posts, setPosts] = useState<any[]>([]);
  
  const [bundles, setBundles] = useState<any[]>([]);
  const [purchasedBundles, setPurchasedBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [viewingBundleGallery, setViewingBundleGallery] = useState<any>(null); 
  
  const [paymentData, setPaymentData] = useState<{ payAddress: string, amountUsd: number, transactionId: string, clientSecret?: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'SUBSCRIPTION' | 'PPV' | 'BUNDLE' | 'TIP'>('SUBSCRIPTION');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  // 📸 ESTADOS DE DISEÑO PREMIUM
  const [expandedImage, setExpandedImage] = useState<{url: string, username: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PHOTOS' | 'VIDEOS'>('ALL');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
    if (!username || username === 'undefined') return; 
    
    fetchProfileAndPosts(false);
  }, [username]);

  const fetchProfileAndPosts = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true); 
      setHasError(false);
      
      const profileRes = await api.get(`/profile/${username}`);
      setCreator(profileRes.data.profile);
      
      setIsFollowing(profileRes.data.isFollowing || false);
      setFollowersCount(profileRes.data.profile._count?.followers || 0);
      
      const postsData = await postService.getCreatorPosts(username as string);
      setPosts(postsData.posts || []);
      setIsSubscribed(postsData.isSubscribed); 

      const token = localStorage.getItem('token');
      if (token && token !== "undefined") {
        try {
          const subsRes = await api.get('/payments/my-subscriptions');
          const currentSub = subsRes.data.subscriptions?.find((s: any) => s.creator?.username === username);
          if (currentSub) setSubscriptionStatus(currentSub.status);
        } catch (e) {
          console.error("Error cargando suscripciones");
        }
      }

      try {
        const bundlesRes = await api.get(`/bundles/creator/${username}`);
        setBundles(bundlesRes.data.availableBundles || []);
        setPurchasedBundles(bundlesRes.data.purchasedBundles || []);
      } catch (e) {}

    } catch (error: any) {
      if (error.response?.status === 404) setHasError(true);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para seguir a este creador.");
      router.push('/auth');
      return;
    }
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);

    try { await api.post(`/users/${creator.id}/follow`); } 
    catch (error) {
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) { alert("Debes iniciar sesión para suscribirte."); router.push('/auth'); return; }
    try {
      setPaymentType('SUBSCRIPTION');
      const res = await api.post('/payments/create-intent', {
        amount: creator.creatorProfile.monthlyPrice,
        type: 'SUBSCRIPTION',
        creatorId: creator.id,
        description: `Suscripción VIP - @${creator.username}`
      });
      setPaymentData({ payAddress: res.data.payAddress, amountUsd: res.data.finalAmount, transactionId: res.data.transactionId, clientSecret: res.data.clientSecret });
      setIsPaymentModalOpen(true);
    } catch (error: any) { alert(error.response?.data?.error || 'Error al iniciar suscripción'); }
  };

  const handleUnlockPPV = async (post: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para desbloquear contenido."); router.push('/auth'); return; }
    try {
      setPaymentType('PPV');
      setSelectedPost(post);
      const res = await api.post('/payments/create-intent', {
        amount: post.price,
        type: 'PPV_POST',
        creatorId: creator.id,
        postId: post.id,
        description: `Desbloqueo PPV - Post`
      });
      setPaymentData({ payAddress: res.data.payAddress, amountUsd: res.data.finalAmount, transactionId: res.data.transactionId, clientSecret: res.data.clientSecret });
      setIsPaymentModalOpen(true);
    } catch (error) { alert('Error al conectar con la pasarela.'); }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para comprar paquetes."); router.push('/auth'); return; }
    try {
      setPaymentType('BUNDLE');
      setSelectedBundle(bundle);
      const res = await api.post('/payments/create-intent', {
        amount: bundle.price,
        type: 'BUNDLE',
        creatorId: creator.id,
        bundleId: bundle.id,
        description: `Paquete: ${bundle.title}`
      });
      setPaymentData({ payAddress: res.data.payAddress, amountUsd: res.data.finalAmount, transactionId: res.data.transactionId, clientSecret: res.data.clientSecret });
      setIsPaymentModalOpen(true);
    } catch (error) { alert('Error al conectar con la pasarela de pagos.'); }
  };

  const handleReaction = async (postId: string, selectedEmoji: string) => {
    if (!currentUser) return router.push('/auth');
    try {
      setActiveReactionMenu(null);
      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) {
          const oldReaction = post.myReaction;
          const isRemoving = oldReaction === selectedEmoji; 
          const isChanging = oldReaction && oldReaction !== selectedEmoji; 
          let newLikesCount = post._count.likes;
          if (isRemoving) newLikesCount--; else if (!isChanging) newLikesCount++; 
          return { ...post, myReaction: isRemoving ? null : selectedEmoji, _count: { ...post._count, likes: newLikesCount } };
        }
        return post;
      }));
      await postService.toggleLike(postId, selectedEmoji);
    } catch (error) {}
  };

  const handleBookmark = async (postId: string) => {
    if (!currentUser) return router.push('/auth');
    try { await api.post(`/bookmarks/${postId}/toggle`); alert("🔖 Post guardado en tu Bóveda (Favoritos)"); } catch (error) {}
  };

  const submitComment = async (postId: string) => {
    if (!currentUser) return router.push('/auth');
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await postService.addComment(postId, commentText, replyingToCommentId);
      setCommentText(''); setReplyingToCommentId(null); 
      await fetchProfileAndPosts(true); 
    } catch (error) {} finally { setIsSubmittingComment(false); }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!currentUser) return router.push('/auth');
    try { await postService.toggleCommentLike(commentId); fetchProfileAndPosts(true); } catch (error) {}
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("🚨 ¿Eliminar publicación?")) return;
    try { await api.delete(`/posts/${postId}`); fetchProfileAndPosts(true); } catch (error) { alert("Error al eliminar."); }
  };

  const handleMessageClick = async () => {
    if (!currentUser) { alert("Debes iniciar sesión para enviar mensajes."); router.push('/auth'); return; }
    try {
      const res = await api.get('/messages/conversations');
      const conversations = res.data.conversations || [];
      const existingChat = conversations.find((chat: any) => chat.user?.id === creator.id);
      
      if (existingChat) { localStorage.setItem('lastOpenedChat', existingChat.id); } 
      else {
         const formData = new FormData();
         formData.append('receiverId', creator.id);
         formData.append('content', '¡Hola! 👋 Me encantaría hablar contigo.');
         const newMsgRes = await api.post('/messages/send', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
         if (newMsgRes.data?.messageData) localStorage.setItem('lastOpenedChat', newMsgRes.data.messageData.conversationId);
      }
      router.push('/dashboard/messages');
    } catch (error) { alert("Error al abrir chat."); }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;
  if (hasError || !creator) return <div className="min-h-screen bg-nm-base text-white flex flex-col items-center justify-center space-y-4"><Ghost className="w-20 h-20 text-gray-600"/><h2 className="text-3xl font-black">Página no encontrada</h2><button onClick={() => router.push('/explore')} className="mt-4 nm-btn-primary px-8 py-3 text-sm">Volver a Explorar</button></div>;

  const profile = creator.creatorProfile || {};

  return (
    <AppLayout>
      <div className="min-h-screen pb-20 bg-nm-base relative">
        
        {/* PORTADA NEUMÓRFICA */}
        <div 
          className="h-48 sm:h-72 w-full relative bg-[#0a0a0a] select-none" 
          style={profile.coverImage ? { backgroundImage: `url(${getImageUrl(profile.coverImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          onContextMenu={(e) => e.preventDefault()}
        >
          {!profile.coverImage && <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none"></div> 
          <button onClick={() => router.back()} className="absolute top-4 left-4 nm-btn text-white px-5 py-2.5 rounded-full z-20 flex items-center gap-2 font-bold text-sm hover:text-blue-400">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20 z-10">
          
          {/* CABECERA Y AVATAR */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
            <div className="flex flex-col items-start">
              <div 
                className="w-32 h-32 rounded-full border-4 border-[#0e0e0e] shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center text-white text-5xl font-black bg-[#0a0a0a] relative overflow-hidden shrink-0 z-10 nm-inset select-none"
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
              >
                {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover pointer-events-none" draggable="false" /> : <span className="bg-gradient-to-tr from-blue-600 to-purple-600 w-full h-full flex items-center justify-center text-white pointer-events-none">{creator.username[0].toUpperCase()}</span>}
              </div>
              
              <div className="mt-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  {creator.name || creator.username}
                  {profile.isVerified && <span title="Verificado"><CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/20" /></span>}
                </h1>
                <p className="text-gray-400 text-sm font-bold mt-1">@{creator.username}</p>
              </div>
            </div>
            
            {/* BOTONERA ACCIÓN */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              {(!currentUser || currentUser.id !== creator.id) && (
                <>
                  <button 
                    onClick={handleFollowToggle}
                    className={`font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                      isFollowing ? 'nm-inset text-blue-400 border border-blue-500/30' : 'nm-btn text-blue-400 hover:text-white'
                    }`}
                  >
                    {isFollowing ? <><CheckCircle2 className="w-4 h-4"/> Siguiendo</> : <><Plus className="w-4 h-4"/> Seguir Gratis</>}
                  </button>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleMessageClick} className="nm-btn text-gray-300 hover:text-blue-400 font-bold flex-1 sm:w-12 h-12 rounded-xl flex items-center justify-center shrink-0" title="Enviar Mensaje">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setReportingPostId(null); setIsReportModalOpen(true); }} className="nm-btn text-gray-400 hover:text-red-500 font-bold flex-1 sm:w-12 h-12 rounded-xl flex items-center justify-center shrink-0" title="Reportar Usuario">
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {(!currentUser || currentUser.id !== creator.id) && (
                isSubscribed ? (
                  <button disabled className="nm-inset text-yellow-500 border border-yellow-500/30 font-bold py-3 px-8 rounded-xl cursor-default w-full sm:w-auto flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                    <Star className="w-4 h-4 fill-yellow-500/20"/> Eres VIP
                  </button>
                ) : (
                  <button onClick={handleSubscribe} className="nm-btn-primary py-3 px-8 rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Crown className="w-5 h-5"/> Suscribirse • ${profile.monthlyPrice > 0 ? profile.monthlyPrice.toFixed(2) : '0.00'}/mes
                  </button>
                )
              )}
            </div>
          </div>

          {/* ✨ INFO SOCIAL Y BIOGRAFÍA (VERSIÓN PREMIUM) */}
          <div className="mb-10 nm-inset p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
            {/* Destello de fondo decorativo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[50px] pointer-events-none"></div>

            <div className="flex gap-8 text-sm font-bold text-gray-300 border-b border-white/5 pb-6">
              <div className="flex flex-col">
                <span className="text-white text-xl flex items-center gap-2 font-black">
                  {profile.hideStats && (!currentUser || currentUser.id !== creator.id) && currentUser?.role !== 'ADMIN' 
                    ? <span className="text-gray-500 text-sm flex items-center gap-1"><Lock className="w-3 h-3"/> Privado</span> 
                    : followersCount
                  }
                </span>
                <span className="text-gray-500 uppercase tracking-widest text-[10px] mt-1">Fans</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl flex items-center gap-2 font-black">
                  {profile.hideStats && (!currentUser || currentUser.id !== creator.id) && currentUser?.role !== 'ADMIN' 
                    ? <span className="text-gray-500 text-sm flex items-center gap-1"><Lock className="w-3 h-3"/> Privado</span> 
                    : posts.length
                  }
                </span>
                <span className="text-gray-500 uppercase tracking-widest text-[10px] mt-1">Posts</span>
              </div>
            </div>
            
            {/* Biografía Persuasiva */}
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-medium pt-6">
              {profile.bio || '✨ Bienvenido a mi espacio VIP. \n\nSuscríbete para desbloquear todo mi contenido exclusivo, chatear conmigo en privado todos los días y ver material que no publico en mis otras redes. 😈🔥'}
            </p>

            {/* 🔗 REDES SOCIALES (Estilo Linktree Premium con Emojis Nativos) */}
            {(profile.instagram || profile.twitter || profile.website) && (
              <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-white/5">
                {profile.instagram && (
                  <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] h-12 rounded-xl nm-btn flex items-center justify-center gap-2 text-pink-500 hover:text-pink-400 transition-all font-bold text-sm border border-pink-500/10 hover:border-pink-500/30">
                    <span className="text-lg">📷</span> Instagram
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] h-12 rounded-xl nm-btn flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-all font-bold text-sm border border-white/5 hover:border-white/20">
                    <span className="text-lg">🐦</span> Twitter / X
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] h-12 rounded-xl nm-btn flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-all font-bold text-sm border border-blue-500/10 hover:border-blue-500/30">
                    <Link className="w-4 h-4" /> Mi Página
                  </a>
                )}
              </div>
            )}
          </div>

          {/* PAQUETES (BUNDLES) */}
          {bundles.length > 0 && (
            <div className="mb-12 space-y-6 animate-fade-in">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest pl-2">
                <Package className="w-5 h-5 text-blue-500"/> Paquetes en Oferta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map(bundle => (
                  <div key={bundle.id} onClick={() => handleBuyBundle(bundle)} className="nm-btn p-6 rounded-3xl border border-white/5 cursor-pointer group flex flex-col h-full hover:border-blue-500/30">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{bundle.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6 line-clamp-2 font-medium">{bundle.description}</p>
                    <div className="flex gap-2 mb-6 select-none" onContextMenu={(e) => e.preventDefault()}>
                      {bundle.posts?.slice(0, 3).map((p: any, i: number) => (
                        <div key={p.id} className="w-14 h-14 rounded-xl nm-inset overflow-hidden relative border border-white/5">
                          {p.mediaUrl ? ( <div className="absolute inset-0 bg-cover bg-center blur-[2px] opacity-70" style={{ backgroundImage: `url(${getImageUrl(p.mediaUrl)})` }}></div> ) : ( <div className="absolute inset-0 flex items-center justify-center text-gray-500"><FileText className="w-5 h-5"/></div> )}
                          {i === 2 && bundle.posts.length > 3 && ( <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs font-bold text-white">+{bundle.posts.length - 3}</div> )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-5 border-t border-white/5">
                      <span className="text-xs font-bold text-blue-400 nm-inset px-3 py-1.5 rounded-md border border-blue-500/20">{bundle.posts?.length} Archivos</span>
                      <button className="nm-btn-primary py-2.5 px-6 text-sm">Comprar ${bundle.price}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📸 SECCIÓN DEL MURO (CON TABS VISUALES) */}
          <div className="space-y-6">
            
            {/* TABS (Filtros de aspecto Premium) */}
            <div className="flex items-center gap-6 border-b border-white/5 mb-6 px-2">
              <button onClick={() => setActiveTab('ALL')} className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'ALL' ? 'border-blue-500 text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                Todo
              </button>
              <button onClick={() => setActiveTab('PHOTOS')} className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'PHOTOS' ? 'border-blue-500 text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                📸 Fotos
              </button>
              <button onClick={() => setActiveTab('VIDEOS')} className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'VIDEOS' ? 'border-blue-500 text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                🎥 Videos
              </button>
            </div>
            
            {posts.length === 0 ? <div className="text-center text-gray-500 py-16 nm-inset rounded-[2rem] border border-white/5 font-medium">Aún no hay publicaciones en este muro.</div> : (
              posts.map((post) => (
                !post.hasAccess ? (
                  /* POST BLOQUEADO */
                  <div key={post.id} id={post.id} className="bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 relative overflow-hidden border border-white/5 shadow-xl scroll-mt-24">
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-white/5 select-none" onContextMenu={(e) => e.preventDefault()}>
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover pointer-events-none" draggable="false" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">{creator.username[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base">{creator.username}</h3>
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            <Lock className="w-3 h-3"/> {post.isPPV ? 'PPV Exclusivo' : 'Solo VIPs'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 mt-4 overflow-hidden group cursor-pointer nm-inset select-none" onContextMenu={(e) => e.preventDefault()}>
                      {post.mediaUrl ? <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110" style={{ backgroundImage: `url(${getImageUrl(post.mediaUrl)})` }}></div> : <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-[#0e0e0e] blur-xl"></div>}
                      <div className="relative z-10 flex flex-col items-center space-y-4 bg-black/70 px-10 py-8 rounded-3xl border border-white/10 backdrop-blur-md transition-transform group-hover:scale-105 pointer-events-none">
                        <Lock className="w-14 h-14 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                        {!isSubscribed && !post.isPPV ? (
                          <button onClick={(e) => { e.stopPropagation(); handleSubscribe(); }} className="mt-2 nm-btn-primary py-3 px-8 text-sm flex items-center gap-2 pointer-events-auto">
                            <Crown className="w-4 h-4"/> Suscríbete para ver
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleUnlockPPV(post); }} className="mt-2 nm-btn-primary py-3 px-8 text-sm flex items-center gap-2 pointer-events-auto">
                            <Unlock className="w-4 h-4"/> Desbloquear por ${post.price}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* POST DESBLOQUEADO / VIP */
                  <div key={post.id} id={post.id} className="bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 border border-white/5 shadow-xl scroll-mt-24">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-white/5 select-none" onContextMenu={(e) => e.preventDefault()}>
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover pointer-events-none" draggable="false" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center">{creator.username[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base">{creator.username}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            {post.isPPV ? <><Unlock className="w-3 h-3 text-green-400"/> Comprado</> : <><Star className="w-3 h-3 text-yellow-500"/> VIP</>}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {post.content && <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>}
                    
                    {post.mediaUrl && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-white/5 nm-inset relative group bg-black/50 flex justify-center">
                        {post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.mov') || post.mediaUrl.endsWith('.webm') ? (
                          <video controls controlsList="nodownload noplaybackrate" disablePictureInPicture src={getImageUrl(post.mediaUrl)} className="w-full h-auto object-cover max-h-[600px] select-none" onContextMenu={(e) => e.preventDefault()}/>
                        ) : post.mediaUrl.endsWith('.mp3') || post.mediaUrl.endsWith('.wav') || post.mediaUrl.endsWith('.ogg') ? (
                          <div className="p-6 bg-[#0e0e0e] flex justify-center w-full"><audio controls controlsList="nodownload" src={getImageUrl(post.mediaUrl)} className="w-full outline-none" /></div>
                        ) : (
                          <img src={getImageUrl(post.mediaUrl)} alt="Contenido Exclusivo" className="w-full h-auto object-cover max-h-[600px] cursor-pointer hover:opacity-90 transition-opacity select-none" draggable="false" onContextMenu={(e) => e.preventDefault()} onClick={() => setExpandedImage({ url: getImageUrl(post.mediaUrl), username: creator.username })}/>
                        )}
                      </div>
                    )}
                    
                    {/* Botones de interacción (Likes, comments) */}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5 relative">
                      <div className="flex gap-3 text-gray-400 font-bold text-sm">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveReactionMenu(activeReactionMenu === post.id ? null : post.id); }} className={`nm-btn px-4 py-2 rounded-lg flex items-center gap-2 relative z-40 transition-colors ${post.myReaction ? 'text-red-500 border-red-500/20' : 'hover:text-red-400'}`}>
                            <span className="text-lg group-active:scale-125 transition-transform">{post.myReaction ? post.myReaction : '🤍'}</span> {post._count?.likes || 0}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCommentingPostId(commentingPostId === post.id ? null : post.id); setReplyingToCommentId(null); }} className="nm-btn px-4 py-2 rounded-lg hover:text-blue-400 transition-colors flex items-center gap-2 relative z-40">
                          <MessageCircle className="w-5 h-5" /> {post._count?.comments || 0}
                        </button>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTipRecipient(creator); setIsTipModalOpen(true); }} className="text-green-400 hover:text-green-300 nm-btn px-5 py-2.5 rounded-lg border border-green-500/20 font-bold text-xs flex items-center gap-2 relative z-40">
                        <Coins className="w-4 h-4"/> <span className="hidden sm:inline">Tip</span>
                      </button>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </main>

        {/* MODALES EXTERNOS */}
        {isTipModalOpen && tipRecipient && (
          <TipModal creatorName={tipRecipient.username} onClose={() => setIsTipModalOpen(false)} onContinue={async (amount, message) => { setIsTipModalOpen(false); try { setPaymentType('TIP'); const res = await api.post('/payments/create-intent', { amount, type: 'TIP', creatorId: tipRecipient.id, description: `Propina: ${message}` }); setPaymentData({ payAddress: res.data.payAddress, amountUsd: res.data.finalAmount, transactionId: res.data.transactionId, clientSecret: res.data.clientSecret }); setIsPaymentModalOpen(true); } catch (error) { alert('Error al procesar la propina.'); } }} />
        )}
        {isPaymentModalOpen && paymentData && (
          <PaymentModal price={paymentData.amountUsd} payAddress={paymentData.payAddress} amountUsd={paymentData.amountUsd} clientSecret={paymentData.clientSecret || ""} transactionId={paymentData.transactionId} creatorId={creator.id} onClose={() => { setIsPaymentModalOpen(false); setPaymentData(null); }} onSuccess={() => { setIsPaymentModalOpen(false); setPaymentData(null); alert('✅ ¡Pago exitoso! Disfruta el contenido.'); fetchProfileAndPosts(true); }} />
        )}
        
        {/* VISOR DE IMÁGENES BLINDADO */}
        {expandedImage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none" onClick={() => setExpandedImage(null)} onContextMenu={(e) => e.preventDefault()}>
            <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all z-50 border border-white/10" title="Cerrar"><X className="w-6 h-6" /></button>
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage.url} alt="Exclusivo" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none" draggable="false" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden opacity-30 mix-blend-overlay">
                 <div className="transform -rotate-45 flex flex-col items-center">
                   <span className="text-white text-5xl md:text-8xl font-black uppercase tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">FANSMIOS</span>
                   <span className="text-white text-xl md:text-3xl font-bold drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mt-2">@{expandedImage.username || 'EXCLUSIVO'}</span>
                 </div>
              </div>
              <div className="absolute inset-0 z-10 w-full h-full cursor-default" onContextMenu={(e) => e.preventDefault()}></div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}