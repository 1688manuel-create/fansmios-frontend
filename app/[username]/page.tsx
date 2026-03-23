"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../lib/api';
import { postService } from '../../lib/postService';
import PaymentModal from '../../components/PaymentModal';
import TipModal from '../../components/TipModal';
import AppLayout from '../../components/AppLayout';
import { paymentService } from '../../lib/paymentService';

// 🔥 Agregamos iconos de redes sociales
import { 
  ArrowLeft, CheckCircle2, MessageCircle, Star, Lock, 
  Unlock, Trash2, Coins, Package, Ghost, X, Plus, Crown, Send,
  Instagram, Twitter, Globe, ShieldAlert
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null, usernameForWatermark: string | null = null) => {
  if (!path) return '';
  if (path.startsWith('http')) {
    if (usernameForWatermark && path.includes('cloudinary.com')) {
      const cleanUsername = usernameForWatermark.replace('@', '');
      const watermarkTransform = `upload/l_text:Arial_40_bold:fansmios%20%40${cleanUsername},co_white,o_30/fl_layer_apply,g_south,y_40/`;
      return path.replace('upload/', watermarkTransform);
    }
    return path; 
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${cleanPath}`; 
};

// 🌳 NODO DE COMENTARIOS PARA EL PERFIL
const CommentNode = ({ comment, postId, currentUser, onReply, onDelete, isExpanded }: { comment: any, postId: string, currentUser: any, onReply: (postId: string, commentId: string) => void, onDelete: (commentId: string) => void, isExpanded: boolean }) => {
  const isOwner = currentUser?.id === comment.userId || currentUser?.role === 'ADMIN'; // 🔥 Admin también puede borrar comentarios

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col mt-2 group/comment scroll-mt-32 transition-all duration-500 rounded-xl">
      <div className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm relative">
        <span className="font-bold text-gray-300 mr-2">@{comment.user?.username || 'Usuario'}:</span>
        <span className="text-gray-400">{comment.content}</span>
        
        <div className="flex items-center gap-4 mt-1.5">
          <button onClick={() => onReply(postId, comment.id)} className="text-[11px] text-blue-400 hover:underline font-bold">Responder</button>
          {isOwner && (
            <button onClick={() => onDelete(comment.id)} className="text-[11px] text-red-500 hover:underline font-bold hidden group-hover/comment:block">Eliminar</button>
          )}
        </div>
      </div>
      
      {(isExpanded === true) && comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 sm:pl-6 border-l-2 border-white/10 ml-3 sm:ml-4 mt-2 space-y-1">
          {comment.replies.map((reply: any) => (
            <CommentNode key={reply.id} comment={reply} postId={postId} currentUser={currentUser} onReply={onReply} onDelete={onDelete} isExpanded={isExpanded} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CreatorProfile() {
  const params = useParams(); 
  const router = useRouter();
  
  const rawUsername = params?.username;
  const username = Array.isArray(rawUsername) ? rawUsername : rawUsername;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [bundles, setBundles] = useState<any[]>([]);

  const [clientSecret, setClientSecret] = useState('');
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  
  const [paymentData, setPaymentData] = useState<{ payAddress: string, amountUsd: number, transactionId: string, clientSecret?: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);
  const [expandedImage, setExpandedImage] = useState<{url: string, username: string} | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
    if (!username || username === 'undefined') return; 
    
    fetchProfileAndPosts(false);
  }, [username]);

  // 🔥 FRANCOTIRADOR PARA EL PERFIL TAMBIÉN
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        const hashWithoutHash = hash.substring(1); 
        const parts = hashWithoutHash.split('-comment-');
        
        const firstPart = parts[0] || '';
        const postIdRaw = firstPart.replace('post-', '');
        const commentIdRaw = parts[1] || null; 
        
        setExpandedComments(prev => ({ ...prev, [postIdRaw]: true }));

        setTimeout(() => {
          const targetId = commentIdRaw ? `comment-${commentIdRaw}` : `post-${postIdRaw}`;
          const element = document.getElementById(targetId);
          
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-red-500', 'shadow-[0_0_40px_rgba(239,68,68,0.8)]', 'bg-red-500/10');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-red-500', 'shadow-[0_0_40px_rgba(239,68,68,0.8)]', 'bg-red-500/10');
            }, 4000);
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 800); 
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
      const data = await paymentService.createPaymentIntent({
        amount: creator?.creatorProfile?.monthlyPrice || 0,
        type: 'SUBSCRIPTION',
        creatorId: creator.id,
        description: `Suscripción VIP - @${creator.username}`
      });
      
      if (data.success || data.receipt) {
        alert('✅ ¡Suscripción VIP activada!');
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: creator?.creatorProfile?.monthlyPrice || 0 });
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) { alert('Error al iniciar suscripción'); }
  };

  const handleUnlockPPV = async (post: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para desbloquear contenido."); router.push('/auth'); return; }
    try {
      const data = await paymentService.createPaymentIntent({
        amount: post.price,
        type: 'PPV_POST',
        creatorId: creator.id,
        postId: post.id,
        description: `Desbloqueo PPV - Post`
      });
      if (data.success || data.receipt) {
        alert('✅ ¡Contenido desbloqueado!');
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: post.price });
        setIsPaymentModalOpen(true);
      }
    } catch (error) { alert('Error al procesar el pago.'); }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!currentUser) { alert("Debes iniciar sesión para comprar paquetes."); router.push('/auth'); return; }
    try {
      const payload: any = {
        amount: bundle.price,
        type: 'BUNDLE',
        creatorId: creator.id,
        bundleId: bundle.id,
        description: `Paquete: ${bundle.title}`
      };
      const data = await paymentService.createPaymentIntent(payload);
      
      if (data.success || data.receipt) {
        alert('✅ ¡Paquete comprado con éxito!');
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: bundle.price, id: bundle.id, isBundle: true });
        setIsPaymentModalOpen(true);
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

  const handleReact = async (postId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await api.post(`/posts/${postId}/like`, { emoji });
      fetchProfileAndPosts(true); 
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
      setCommentText(''); setCommentingPostId(null); setReplyingToCommentId(null);
      setExpandedComments(prev => ({...prev, [postId]: true}));
      fetchProfileAndPosts(true); 
    } catch (error) { alert("Error al enviar comentario"); } 
    finally { setIsSubmittingComment(false); }
  };

  const handleReplyClick = (postId: string, commentId: string) => {
    setCommentingPostId(postId); setReplyingToCommentId(commentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("🚨 ¿Seguro que deseas eliminar este comentario?")) return;
    try { await api.delete(`/posts/comments/${commentId}`); fetchProfileAndPosts(true); } 
    catch (error) { alert("Error al eliminar comentario."); }
  };

  const handleMessageClick = async () => {
    if (!currentUser) { alert("Debes iniciar sesión para enviar mensajes."); router.push('/auth'); return; }
    router.push('/dashboard/messages');
  };

  const buildCommentTree = (comments: any[]) => {
    if (!comments) return [];
    const commentMap = new Map();
    const roots: any[] = [];
    comments.forEach(comment => { commentMap.set(comment.id, { ...comment, replies: [] }); });
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) parent.replies.push(commentMap.get(comment.id));
      } else { roots.push(commentMap.get(comment.id)); }
    });
    return roots;
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;
  if (hasError || !creator) return <div className="min-h-screen bg-nm-base text-white flex flex-col items-center justify-center"><Ghost className="w-20 h-20 text-gray-600"/><h2 className="text-3xl font-black">Página no encontrada</h2></div>;

  const profile = creator.creatorProfile || {};
  
  // 🔥 EL BYPASS DIVINO (Dueño O Admin)
  const isOwnerOrAdmin = currentUser && (currentUser.id === creator.id || currentUser.role === 'ADMIN');

  return (
    <AppLayout>
      <div className="min-h-screen pb-20 bg-nm-base relative">
        
        {/* CABECERA (PORTADA) */}
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
              
              {/* AVATAR */}
              <div 
                className="w-32 h-32 rounded-full border-4 border-[#0e0e0e] shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center text-white text-5xl font-black bg-[#0a0a0a] relative overflow-hidden shrink-0 z-10 nm-inset select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" draggable="false" /> : <span className="bg-gradient-to-tr from-blue-600 to-purple-600 w-full h-full flex items-center justify-center text-white">{(creator.username || 'U').toUpperCase()}</span>}
              </div>
              
              <div className="mt-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  {creator.name || creator.username}
                  {profile.isVerified && <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/20" />}
                  {currentUser?.role === 'ADMIN' && <span title="Visualizando como Administrador"><ShieldAlert className="w-5 h-5 text-red-500" /></span>}
                </h1>
                <p className="text-gray-400 text-sm font-bold mt-1">@{creator.username}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              {(!isOwnerOrAdmin) && (
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

              {/* BOTÓN DE SUSCRIPCIÓN O MODO DIOS */}
              {(!isOwnerOrAdmin) && (
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
              
              {/* CARTEL DEL MODO DIOS */}
              {currentUser?.role === 'ADMIN' && !isOwnerOrAdmin && (
                <div className="nm-inset border border-red-500/30 text-red-500 font-bold py-3 px-8 rounded-xl cursor-default w-full sm:w-auto flex items-center justify-center gap-2 uppercase tracking-widest text-sm bg-red-900/10">
                  <ShieldAlert className="w-4 h-4"/> MODO DIOS ACTIVO
                </div>
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

            {/* 🔥 BOTONES DE REDES SOCIALES */}
            {(profile.instagram || profile.twitter || profile.website) && (
              <div className="flex gap-4 mt-6 pt-6 border-t border-white/5">
                {profile.instagram && (
                  <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors">
                    <Instagram className="w-5 h-5" /> <span className="text-sm font-bold hidden sm:inline">Instagram</span>
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <Twitter className="w-5 h-5" /> <span className="text-sm font-bold hidden sm:inline">Twitter</span>
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                    <Globe className="w-5 h-5" /> <span className="text-sm font-bold hidden sm:inline">Sitio Web</span>
                  </a>
                )}
              </div>
            )}
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
                      {isOwnerOrAdmin ? (
                        <button className="nm-btn-primary py-2.5 px-6 text-sm bg-red-600">Ver Paquete</button>
                      ) : (
                        <button className="nm-btn-primary py-2.5 px-6 text-sm">Comprar ${(bundle.price || 0).toFixed(2)}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {posts.length === 0 ? <div className="text-center text-gray-500 py-16 nm-inset rounded-[2rem] border border-white/5">Aún no hay publicaciones.</div> : (
              posts.map((post) => {
                // 🔥 AQUÍ ROMPEMOS EL CANDADO PARA EL ADMIN
                const isPostUnlocked = isOwnerOrAdmin || post.hasAccess;
                const rootComments = buildCommentTree(post.comments || []);
                const totalComments = post._count?.comments || 0;
                const isExpanded = expandedComments[post.id] || false;
                const visibleComments = isExpanded ? rootComments : rootComments.slice(0, 3);

                return !isPostUnlocked ? (
                  <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 transition-all duration-500 bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 relative overflow-hidden border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-white/5">
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">{creator.username.toUpperCase()}</div>}
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
                    
                    {/* EL ADMIN TAMBIÉN PUEDE BORRAR POSTS */}
                    {isOwnerOrAdmin && (
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
                          {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center">{creator.username.toUpperCase()}</div>}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base">{creator.username}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            {post.isPPV ? (
                              <><Unlock className="w-3 h-3 text-green-400"/> {isOwnerOrAdmin ? `PPV: $${(post.price || 0).toFixed(2)}` : 'Comprado'}</>
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
                        <img src={getImageUrl(post.mediaUrl)} alt="Exclusivo" className="w-full h-auto object-cover max-h-[600px] cursor-pointer" onClick={() => setExpandedImage({ url: getImageUrl(post.mediaUrl, post.user?.username), username: post.user?.username })} />
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                            {['❤️', '❤️‍🔥', '🤤', '🫦'].map((emoji) => {
                              const isSelected = post.myReaction === emoji;
                              const count = post.reactionCounts ? (post.reactionCounts[emoji] || 0) : 0;
                              return (
                                <button 
                                  key={emoji}
                                  onClick={() => handleReact(post.id, emoji)}
                                  className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${isSelected ? 'scale-110 opacity-100 grayscale-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                >
                                  <span className="text-xl">{emoji}</span>
                                  {count > 0 && <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 font-bold transition-all px-4 py-2.5 rounded-full bg-white/5 border border-white/10 ${commentingPostId === post.id ? 'text-blue-500 border-blue-500/30' : 'text-gray-400 hover:text-blue-400 hover:border-white/20'}`}>
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{totalComments}</span>
                          </button>
                        </div>
                        
                        {(!isOwnerOrAdmin) && (
                          <button onClick={() => { setTipRecipient(post.user); setIsTipModalOpen(true); }} className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 font-bold transition-colors">
                            <Coins className="w-5 h-5" />
                            <span className="text-sm hidden sm:inline">Propina</span>
                          </button>
                        )}
                      </div>

                      {commentingPostId === post.id && (
                        <div className="flex flex-col gap-2 animate-fade-in mt-2">
                          {replyingToCommentId && (
                            <div className="flex justify-between items-center bg-blue-900/20 px-3 py-1 text-xs text-blue-400 rounded-lg">
                              <span>Respondiendo al comentario...</span>
                              <button onClick={() => setReplyingToCommentId(null)}><X className="w-3 h-3"/></button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={commentText} 
                              onChange={(e) => setCommentText(e.target.value)} 
                              placeholder="Escribe un comentario..." 
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
                                currentUser={currentUser}
                                onReply={handleReplyClick} 
                                onDelete={handleDeleteComment}
                                isExpanded={isExpanded}
                              />
                           ))}

                           {totalComments > 3 && (
                             <button 
                               onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
                               className="text-xs text-gray-500 font-bold mt-2 hover:text-white pt-2 w-full text-left transition-colors"
                             >
                               {isExpanded ? 'Ocultar comentarios' : `Ver los ${totalComments} comentarios`}
                             </button>
                           )}
                         </div>
                      )}
                    </div>
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
        
        {isPaymentModalOpen && clientSecret && (
          <PaymentModal 
            clientSecret={clientSecret} 
            price={pendingPayment?.price || 0} 
            creatorId={creator.id} 
            onClose={() => setIsPaymentModalOpen(false)} 
            onSuccess={async () => { 
              setIsPaymentModalOpen(false); 
              if (pendingPayment?.isBundle) {
                try { await api.post('/bundles/purchase', { bundleId: pendingPayment.id }); } catch(e){}
              }
              alert("¡Pago exitoso! 🔓"); 
              fetchProfileAndPosts(true); 
            }} 
          />
        )}

        {expandedImage && (
          <div className="fixed inset-0 z- flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none" onClick={() => setExpandedImage(null)} onContextMenu={(e) => e.preventDefault()}>
            <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all z-50 border border-white/10" title="Cerrar"><X className="w-6 h-6" /></button>
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage.url} alt="Exclusivo" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none" draggable="false" />
              <div className="absolute inset-0 z-10 w-full h-full cursor-default"></div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}