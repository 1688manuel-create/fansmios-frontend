"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../lib/api';
import { postService } from '../../lib/postService';
import PaymentModal from '../../components/PaymentModal';
import TipModal from '../../components/TipModal';
import AppLayout from '../../components/AppLayout';

import { 
  ArrowLeft, CheckCircle2, MessageCircle, Flag, Star, Lock, 
  Unlock, Bookmark, Trash2, Coins, Package, Image as ImageIcon,
  ShieldAlert, Ghost, FileText, X, Plus, Crown, Send, Link
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${cleanPath}`; 
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
  const [posts, setPosts] = useState<any[]>([]);
  
  const [bundles, setBundles] = useState<any[]>([]);
  
  const [paymentData, setPaymentData] = useState<{ payAddress: string, amountUsd: number, transactionId: string, clientSecret?: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
    if (!username || username === 'undefined') return; 
    
    fetchProfileAndPosts(false);
  }, [username]);

  // 🔥 NUEVO: EFECTO FRANCOTIRADOR PARA EL SCROLL
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      // Leemos si la URL tiene un #post-1234
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        // Le damos 300 milisegundos a React para que dibuje el HTML
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            // Hacemos scroll suave hasta el post
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Le ponemos un brillo rojo para que el usuario sepa cuál es
            element.classList.add('ring-2', 'ring-red-500', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');
            
            // Se lo quitamos a los 3 segundos
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-red-500', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');
            }, 3000);
          }
        }, 300);
      }
    }
  }, [isLoading, posts]);

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

      try {
        const bundlesRes = await api.get(`/bundles/creator/${username}`);
        setBundles(bundlesRes.data.availableBundles || []);
      } catch (e) {}

    } catch (error: any) {
      if (error.response?.status === 404) setHasError(true);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) { alert("Debes iniciar sesión para seguir a este creador."); router.push('/auth'); return; }
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
      const res = await api.post('/payments/create-intent', {
        amount: creator?.creatorProfile?.monthlyPrice || 0,
        type: 'SUBSCRIPTION',
        creatorId: creator.id,
        description: `Suscripción VIP - @${creator.username}`
      });
      
      if (res.data.success) {
        alert('✅ ¡Suscripción VIP activada por PayRam!');
        fetchProfileAndPosts(true);
      }
    } catch (error: any) { 
      alert(error.response?.data?.error || 'Error al iniciar suscripción'); 
    }
  };

  const handleUnlockPPV = async (post: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para desbloquear contenido."); router.push('/auth'); return; }
    try {
      const res = await api.post('/payments/create-intent', {
        amount: post.price,
        type: 'PPV_POST',
        creatorId: creator.id,
        postId: post.id,
        description: `Desbloqueo PPV - Post`
      });
      if (res.data.success) {
        alert('✅ ¡Contenido desbloqueado con PayRam!');
        fetchProfileAndPosts(true);
      }
    } catch (error) { alert('Error al procesar el pago.'); }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para comprar paquetes."); router.push('/auth'); return; }
    try {
      const res = await api.post('/payments/create-intent', {
        amount: bundle.price,
        type: 'BUNDLE',
        creatorId: creator.id,
        bundleId: bundle.id,
        description: `Paquete: ${bundle.title}`
      });
      if (res.data.success) {
        alert('✅ ¡Paquete comprado con éxito!');
        fetchProfileAndPosts(true);
      }
    } catch (error) { alert('Error al procesar el pago.'); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("🚨 ¿Estás seguro de que deseas eliminar esta publicación para siempre?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      alert("✅ Publicación eliminada.");
      fetchProfileAndPosts(true);
    } catch (error) {
      alert("Error al intentar eliminar la publicación.");
    }
  };

  const handleMessageClick = async () => {
    if (!currentUser) { alert("Debes iniciar sesión para enviar mensajes."); router.push('/auth'); return; }
    router.push('/dashboard/messages');
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;
  if (hasError || !creator) return <div className="min-h-screen bg-nm-base text-white flex flex-col items-center justify-center"><Ghost className="w-20 h-20 text-gray-600"/><h2 className="text-3xl font-black">Página no encontrada</h2></div>;

  const profile = creator.creatorProfile || {};
  const isOwner = currentUser && creator && currentUser.id === creator.id;

  return (
    <AppLayout>
      <div className="min-h-screen pb-20 bg-nm-base relative">
        
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
                  {profile.isVerified && <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/20" />}
                </h1>
                <p className="text-gray-400 text-sm font-bold mt-1">@{creator.username}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              {(!isOwner) && (
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
                    <button onClick={handleMessageClick} className="nm-btn text-gray-300 hover:text-blue-400 font-bold flex-1 sm:w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {(!isOwner) && (
                isSubscribed ? (
                  <button disabled className="nm-inset text-yellow-500 border border-yellow-500/30 font-bold py-3 px-8 rounded-xl cursor-default w-full sm:w-auto flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                    <Star className="w-4 h-4 fill-yellow-500/20"/> Eres VIP
                  </button>
                ) : (
                  <button onClick={handleSubscribe} className="nm-btn-primary py-3 px-8 rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Crown className="w-5 h-5"/> Suscribirse • ${(profile.monthlyPrice || 0).toFixed(2)}/mes
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mb-10 nm-inset p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
            <div className="flex gap-8 text-sm font-bold text-gray-300 border-b border-white/5 pb-6">
              <div className="flex flex-col">
                <span className="text-white text-xl font-black">{followersCount}</span>
                <span className="text-gray-500 uppercase tracking-widest text-[10px] mt-1">Fans</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-black">{posts.length}</span>
                <span className="text-gray-500 uppercase tracking-widest text-[10px] mt-1">Posts</span>
              </div>
            </div>
            
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-medium pt-6">
              {profile.bio || '✨ Bienvenido a mi espacio VIP.'}
            </p>
          </div>

          {bundles.length > 0 && (
            <div className="mb-12 space-y-6 animate-fade-in">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest pl-2">
                <Package className="w-5 h-5 text-blue-500"/> Paquetes en Oferta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map(bundle => (
                  <div key={bundle.id} onClick={() => handleBuyBundle(bundle)} className="nm-btn p-6 rounded-3xl border border-white/5 cursor-pointer group flex flex-col h-full hover:border-blue-500/30">
                    <h3 className="text-xl font-bold text-white">{bundle.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6 line-clamp-2">{bundle.description}</p>
                    <div className="flex justify-between items-center mt-auto pt-5 border-t border-white/5">
                      <span className="text-xs font-bold text-blue-400 nm-inset px-3 py-1.5 rounded-md border border-blue-500/20">{bundle.posts?.length} Archivos</span>
                      <button className="nm-btn-primary py-2.5 px-6 text-sm">Comprar ${(bundle.price || 0).toFixed(2)}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {posts.length === 0 ? <div className="text-center text-gray-500 py-16 nm-inset rounded-[2rem] border border-white/5">Aún no hay publicaciones.</div> : (
              posts.map((post) => {
                const isPostUnlocked = isOwner || post.hasAccess;

                return !isPostUnlocked ? (
                  <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 transition-all duration-500 bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 relative overflow-hidden border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-white/5">
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">{creator.username[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base">{creator.username}</h3>
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            <Lock className="w-3 h-3"/> {post.isPPV ? 'PPV Exclusivo' : 'Solo VIPs'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 mt-4 overflow-hidden group nm-inset">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-[#0e0e0e] blur-xl"></div>
                      <div className="relative z-10 flex flex-col items-center space-y-4 bg-black/70 px-10 py-8 rounded-3xl border border-white/10 backdrop-blur-md">
                        <Lock className="w-14 h-14 text-red-500" />
                        {!isSubscribed && !post.isPPV ? (
                          <button onClick={(e) => { e.stopPropagation(); handleSubscribe(); }} className="mt-2 nm-btn-primary py-3 px-8 text-sm flex items-center gap-2">
                            <Crown className="w-4 h-4"/> Suscríbete para ver
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleUnlockPPV(post); }} className="mt-2 nm-btn-primary py-3 px-8 text-sm flex items-center gap-2">
                            <Unlock className="w-4 h-4"/> Desbloquear por ${(post.price || 0).toFixed(2)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 transition-all duration-500 bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 border border-white/5 shadow-xl relative">
                    
                    {isOwner && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="absolute top-6 right-6 text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-full transition-all z-20"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}

                    <div className="flex justify-between items-center pr-12">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-white/5">
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center">{creator.username[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base">{creator.username}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            {post.isPPV ? (
                              <><Unlock className="w-3 h-3 text-green-400"/> {isOwner ? `PPV: $${(post.price || 0).toFixed(2)}` : 'Comprado'}</>
                            ) : (
                              <><Star className="w-3 h-3 text-yellow-500"/> VIP</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {post.content && <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>}
                    {post.mediaUrl && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-white/5 nm-inset relative bg-black/50 flex justify-center">
                        <img src={getImageUrl(post.mediaUrl)} alt="Exclusivo" className="w-full h-auto object-cover max-h-[600px]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {isTipModalOpen && tipRecipient && (
          <TipModal creatorName={tipRecipient.username} onClose={() => setIsTipModalOpen(false)} onContinue={async (amount, message) => { 
            setIsTipModalOpen(false); 
            try { 
              const res = await api.post('/payments/create-intent', { amount, type: 'TIP', creatorId: tipRecipient.id, description: `Propina: ${message}` }); 
              if (res.data.success) { alert('✅ ¡Propina enviada con PayRam!'); fetchProfileAndPosts(true); }
            } catch (error) { alert('Error al enviar la propina.'); } 
          }} />
        )}
        
        {isPaymentModalOpen && paymentData && (
          <PaymentModal price={paymentData.amountUsd} onClose={() => setIsPaymentModalOpen(false)} onSuccess={() => { setIsPaymentModalOpen(false); fetchProfileAndPosts(true); }} creatorId={creator.id} />
        )}

      </div>
    </AppLayout>
  );
}