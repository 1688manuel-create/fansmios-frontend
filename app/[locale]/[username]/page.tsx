"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { postService } from '../../../lib/postService';
import PaymentModal from '../../../components/PaymentModal';
import TipModal from '../../../components/TipModal';
import AppLayout from '../../../components/AppLayout';
import { paymentService } from '../../../lib/paymentService';
import SeriesTab from '../../../components/profile/SeriesTab';
import { PlaySquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { 
  ArrowLeft, CheckCircle2, MessageCircle, Star, Lock, Settings,
  Unlock, Trash2, Coins, Package, Ghost, X, Plus, Crown, Send,
  Instagram, Twitter, Globe, ShieldAlert, Flag, AlertTriangle,
  LayoutGrid, Image as ImageIcon, Video, Eye, ChevronLeft, BadgeCheck, ChevronRight,
  LogIn, UserPlus // Añadidos para la navbar
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// 🔥 FUNCIÓN BLINDADA ANTI-CRASH ORIGINAL (INTACTA)
const getImageUrl = (path: any, usernameForWatermark: string | null = null) => {
  if (!path) return '';

  let safePath = path;

  // 1. Desempaquetar si es un JSON con varias fotos
  if (typeof safePath === 'string' && safePath.startsWith('[')) {
    try {
      const parsed = JSON.parse(safePath);
      safePath = Array.isArray(parsed) ? parsed[0]: parsed;
    } catch (e) {}
  }

  // 2. Extraer la primera foto si ya es un Array
  if (Array.isArray(safePath)) {
    safePath = safePath[0] || '';
  }

  // 3. Abortar si sigue sin ser texto para no romper React
  if (typeof safePath !== 'string') return '';

  // 4. Lógica original de HTTP y Marcas de Agua (Cloudinary)
  if (safePath.startsWith('http')) {
    if (usernameForWatermark && safePath.includes('cloudinary.com')) {
      const cleanUsername = usernameForWatermark.replace('@', '');
      const watermarkTransform = `upload/l_text:Arial_40_bold:fansmio%20%40${cleanUsername},co_white,o_30/fl_layer_apply,g_south,y_40/`;
      return safePath.replace('upload/', watermarkTransform);
    }
    return safePath;
  }

  // 5. Flujo normal para archivos locales
  const cleanPath = safePath.startsWith('/') ? safePath.substring(1) : safePath;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${cleanPath}`;
};

// 🌳 NODO DE COMENTARIOS ORIGINAL (INTACTO)
const CommentNode = ({ comment, postId, currentUser, onReply, onDelete, isExpanded }: { comment: any, postId: string, currentUser: any, onReply: (postId: string, commentId: string) => void, onDelete: (commentId: string) => void, isExpanded: boolean }) => {
  const t = useTranslations('Profile'); 
  const isOwner = currentUser?.id === comment.userId || currentUser?.role === 'ADMIN'; 
  const userProfileImage = comment.user?.creatorProfile?.profileImage;
  const initial = comment.user?.username ? comment.user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col mt-2 group/comment scroll-mt-32 transition-all duration-500 rounded-xl">
      <div className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm relative">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#0a0a0a] flex items-center justify-center">
            {userProfileImage ? (
              <img src={getImageUrl(userProfileImage)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-white bg-gradient-to-tr from-teal-500 to-blue-500 w-full h-full flex items-center justify-center">{initial}</span>
            )}
          </div>
          <span className="font-bold text-gray-300">@{comment.user?.username || t('lbl_user')}:</span>
        </div>
        <div className="text-gray-400 pl-8">{comment.content}</div>
        <div className="flex items-center gap-4 mt-2 pl-8">
          <button onClick={() => onReply(postId, comment.id)} className="text-[11px] text-blue-400 hover:underline font-bold">{t('btn_reply')}</button>
          {isOwner && (
            <button onClick={() => onDelete(comment.id)} className="text-[11px] text-red-500 hover:underline font-bold hidden group-hover/comment:block">{t('btn_delete')}</button>
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
  const t = useTranslations('Profile'); 
  
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
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos' | 'locked' | 'series'>('all');
  const [bundles, setBundles] = useState<any[]>([]);

  const [clientSecret, setClientSecret] = useState('');
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<any>(null);

  const [expandedGallery, setExpandedGallery] = useState<{urls: string[], currentIndex: number, username: string} | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [series, setSeries] = useState<any[]>([]);

  const fetchSeries = async () => {
    try {
      if(username) {
        const res = await api.get(`/series/creator/${username}`);
        setSeries(res.data.series || []);
      }
    } catch (error) {}
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
    if (!username || username === 'undefined') return; 
    
    fetchProfileAndPosts(false);
    fetchSeries();
  }, [username]);

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
    if (!currentUser) { alert(t('alert_login_follow')); router.push('/auth'); return; }
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
    if (!currentUser) { router.push('/auth'); return; }
    try {
      const data = await paymentService.createPaymentIntent({
        amount: creator?.creatorProfile?.monthlyPrice || 0,
        type: 'SUBSCRIPTION',
        creatorId: creator.id,
        description: `VIP - @${creator.username}`
      });
      
      if (data.success || data.receipt) {
        alert(t('alert_sub_success'));
        setIsSubscribed(true); 
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: creator?.creatorProfile?.monthlyPrice || 0, isSubscription: true });
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) { 
      const mensajeReal = error.response?.data?.error || error.message || t('alert_sub_error');
      alert(`❌ ${mensajeReal}`);
    }
  };

  const handleUnlockPPV = async (post: any) => {
    if (!currentUser) { router.push('/auth'); return; }
    try {
      const data = await paymentService.createPaymentIntent({
        amount: post.price,
        type: 'PPV_POST',
        creatorId: creator.id,
        postId: post.id,
        description: `PPV - Post`
      });
      if (data.success || data.receipt) {
        alert(t('alert_unlock_success'));
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: post.price });
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) { 
      const mensajeReal = error.response?.data?.error || error.message || t('alert_payment_error');
      alert(`❌ ${mensajeReal}`);
    }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!currentUser) { router.push('/auth'); return; }
    try {
      const payload: any = {
        amount: bundle.price,
        type: 'BUNDLE',
        creatorId: creator.id,
        bundleId: bundle.id,
        description: `Bundle: ${bundle.title}`
      };
      const data = await paymentService.createPaymentIntent(payload);
      
      if (data.success || data.receipt) {
        alert(t('alert_bundle_success'));
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: bundle.price, id: bundle.id, isBundle: true });
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) { 
      const mensajeReal = error.response?.data?.error || error.message || t('alert_payment_error');
      alert(`❌ ${mensajeReal}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t('confirm_delete_post'))) return;
    try {
      await api.delete(`/posts/${postId}`);
      alert(t('alert_post_deleted'));
      fetchProfileAndPosts(true);
    } catch (error) { alert(t('alert_delete_post_error')); }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!currentUser) return;
    try { await api.post(`/posts/${postId}/like`, { emoji }); fetchProfileAndPosts(true); } catch (error) {}
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
    } catch (error) { alert(t('alert_comment_error')); } 
    finally { setIsSubmittingComment(false); }
  };

  const handleReplyClick = (postId: string, commentId: string) => {
    setCommentingPostId(postId); setReplyingToCommentId(commentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('confirm_delete_comment'))) return;
    try { await api.delete(`/posts/comments/${commentId}`); fetchProfileAndPosts(true); } 
    catch (error) { alert(t('alert_delete_comment_error')); }
  };

  const handleMessageClick = async () => {
    if (!currentUser) { router.push('/auth'); return; }
    router.push(`/dashboard/messages?chatWith=${creator.id}&name=${creator.username}`);
  };

  // 🔥 NUEVO ESTADO: Guarda el ID del post si estamos reportando una publicación
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const handleSubmitReport = async () => {
    if (!reportReason) { alert(t('alert_report_reason')); return; }
    setIsSubmittingReport(true);
    try {
      // 🔥 LÓGICA BLINDADA: Siempre enviamos el "reportedUserId" para que salga el Acusado. 
      // Y si es un post, enviamos el ID usando la variable exacta "targetId".
      const payload = reportPostId 
        ? { type: 'POST', targetId: reportPostId, reportedUserId: creator.id, reason: reportReason, description: reportDescription }
        : { type: 'USER', reportedUserId: creator.id, reason: reportReason, description: reportDescription };
        
      await api.post('/reports', payload);
      alert(t('alert_report_success'));
      setIsReportModalOpen(false); 
      setReportReason(''); 
      setReportDescription(''); 
      setReportPostId(null);
    } catch (error) { 
      alert(t('alert_report_error')); 
    } finally { 
      setIsSubmittingReport(false); 
    }
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

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    const hasMedia = post.mediaUrl && post.mediaUrl !== 'null';
    const isVideo = hasMedia && post.mediaUrl.match(/\.(mp4|mov|webm)$/i);
    const isPhoto = hasMedia && !isVideo && !post.mediaUrl.match(/\.(mp3|wav|ogg)$/i);
    
    if (activeTab === 'photos') return isPhoto;
    if (activeTab === 'videos') return isVideo;
    if (activeTab === 'locked') return post.isPPV || (!isSubscribed && currentUser?.role !== 'ADMIN' && currentUser?.id !== creator?.id);
    return true;
  });

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div></div>;
  if (hasError || !creator) return <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center"><Ghost className="w-20 h-20 text-gray-600"/><h2 className="text-3xl font-black">{t('lbl_not_found')}</h2></div>;

  const profile = creator.creatorProfile || {};
  const isOwnerOrAdmin = currentUser && (currentUser.id === creator.id || currentUser.role === 'ADMIN');
  // Extraemos la logica del fuego
  const hasFire = creator.hasFireBorder || creator.addons?.includes('FIRE_BORDER');

  return (
    <AppLayout>
      <div className="min-h-screen pb-20 bg-[#050505] relative w-full overflow-x-hidden">
        
        {/* 🔥 NAVBAR PEGAJOSA */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg">
          <button onClick={() => router.back()} className="text-white flex items-center gap-1.5 font-bold text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
          
          <div className="flex items-center gap-2">
            {!currentUser ? (
              <>
                <button onClick={() => router.push('/auth')} className="text-gray-300 hover:text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 transition-colors">
                  <LogIn className="w-4 h-4"/> Entrar
                </button>
                <button onClick={() => router.push('/auth')} className="bg-gradient-to-r from-yellow-500 to-red-500 hover:scale-105 text-white font-black text-xs px-5 py-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4"/> Crear Cuenta
                </button>
              </>
            ) : (
              <span className="text-yellow-500 font-bold text-xs px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-1.5">
                <Crown className="w-4 h-4"/> VIP
              </span>
            )}
          </div>
        </nav>

        {/* PORTADA EDGE-TO-EDGE */}
        <div className="h-56 sm:h-80 w-full relative bg-[#0a0a0a] select-none mt-14" style={profile.coverImage ? { backgroundImage: `url(${getImageUrl(profile.coverImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} onContextMenu={(e) => e.preventDefault()}>
          {!profile.coverImage && <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-red-900/20"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none"></div> 
        </div>

        {/* MAIN CONTAINER EDGE-TO-EDGE EN MÓVIL */}
        <main className="w-full max-w-4xl mx-auto px-0 sm:px-6 relative z-10 -mt-20 sm:-mt-24">
          
          {/* 🔥 HERO SECTION CENTRADA */}
          <div className="flex flex-col items-center text-center px-4 mb-8">
            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full z-10 flex items-center justify-center relative shadow-2xl select-none ${
              hasFire ? 'p-[3px] bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse' 
                      : (creator.role === 'CREATOR' || creator.role === 'ADMIN') ? 'bg-gradient-to-tr from-yellow-500 to-red-500 p-[3px]' 
                      : 'border-[4px] border-[#050505] bg-[#0a0a0a]'
            }`} onContextMenu={(e) => e.preventDefault()}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0a] border-[4px] border-[#050505] flex items-center justify-center text-white text-5xl font-black">
                {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" draggable="false" /> : <span className="bg-gradient-to-tr from-yellow-500 to-red-500 w-full h-full flex items-center justify-center text-white">{(creator.username || 'U').toUpperCase().charAt(0)}</span>}
              </div>
            </div>
            
            <div className="mt-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2 drop-shadow-md">
                {creator.name || creator.username}
                {(creator.role === 'CREATOR' || creator.role === 'ADMIN') && (
                  <span title="Creador Verificado"><BadgeCheck className="w-6 h-6 text-yellow-500 fill-white drop-shadow-md" /></span>
                )}
                {profile.isVerified && creator.role === 'FAN' && <span title={t('lbl_verified')}><CheckCircle2 className="w-6 h-6 text-teal-400 fill-teal-400/20 drop-shadow-[0_0_5px_rgba(20,184,166,0.8)]" /></span>}
                {currentUser?.role === 'ADMIN' && <span title={t('lbl_admin_view')}><ShieldAlert className="w-5 h-5 text-red-500" /></span>}
              </h1>
              <p className="text-yellow-500 text-sm font-bold mt-1 tracking-widest uppercase">@{creator.username}</p>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mt-6">
              {creator.role === 'FAN' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="nm-inset px-6 py-3.5 rounded-full border border-teal-500/30 flex items-center gap-2 bg-teal-500/5 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                    <Star className="w-5 h-5 text-teal-400 fill-teal-400/20" /> 
                    <span className="text-sm font-bold text-teal-400 uppercase tracking-widest">Verified Fan</span>
                  </div>
                  {isOwnerOrAdmin && (
                    <button onClick={() => router.push('/dashboard/profile')} className="nm-inset px-6 py-3.5 rounded-full border border-white/5 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" /> <span className="text-sm font-bold">Editar Foto</span>
                    </button>
                  )}
                </div>
              )}

              {(creator.role === 'CREATOR' || creator.role === 'ADMIN') && (
                <>
                  {(!isOwnerOrAdmin) ? (
                    isSubscribed ? (
                      <button disabled className="nm-inset text-yellow-500 border border-yellow-500/30 font-bold py-3.5 px-8 rounded-full cursor-default flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-inner w-full sm:w-auto">
                        <Star className="w-5 h-5 fill-yellow-500/20"/> {t('vip_active')}
                      </button>
                    ) : (
                      <button onClick={handleSubscribe} className="bg-gradient-to-r from-yellow-500 to-red-500 hover:scale-105 text-white font-black py-4 px-8 rounded-full w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(239,68,68,0.4)] transition-all uppercase tracking-widest text-sm">
                        <Crown className="w-5 h-5"/> Suscribirse • ${(profile.monthlyPrice || 0).toFixed(2)}/mes
                      </button>
                    )
                  ) : (
                    <div className="nm-inset px-8 py-4 rounded-full border border-white/5 flex items-center gap-2 w-full sm:w-auto justify-center">
                      <Eye className="w-5 h-5 text-yellow-500" /> <span className="text-sm font-bold text-gray-300">Vista Pública</span>
                    </div>
                  )}

                  {currentUser?.id !== creator.id && (
                    <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0 justify-center">
                      {currentUser?.role !== 'ADMIN' && creator.role === 'CREATOR' && (
                        <button 
                          onClick={handleFollowToggle}
                          className={`font-bold py-3.5 px-5 rounded-full transition-all flex items-center justify-center flex-1 sm:w-auto ${isFollowing ? 'nm-inset text-yellow-400 border border-yellow-500/30' : 'bg-[#111] border border-white/10 text-gray-300 hover:text-white shadow-lg'}`}
                          title={isFollowing ? t('btn_unfollow') : t('btn_follow_free')}
                        >
                          {isFollowing ? <CheckCircle2 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                        </button>
                      )}
                      <button onClick={handleMessageClick} title={t('btn_send_message')} className="bg-[#111] border border-white/10 text-gray-300 hover:text-yellow-500 font-bold w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      
                      {currentUser?.role !== 'ADMIN' && (
                        <>
                          <button onClick={() => { setTipRecipient(creator); setIsTipModalOpen(true); }} title={t('btn_tip')} className="bg-[#111] border border-white/10 text-gray-300 hover:text-green-400 font-bold w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg">
                            <Coins className="w-6 h-6" />
                          </button>
                          {/* 🔥 BOTÓN DE REPORTAR PERFIL */}
                          <button onClick={() => { if(!currentUser) { router.push('/auth'); return; } setReportPostId(null); setIsReportModalOpen(true); }} title="Reportar Perfil" className="bg-[#111] border border-white/10 text-gray-500 hover:text-red-500 font-bold w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg">
                            <Flag className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* BIO Y ESTADÍSTICAS */}
          <div className="mb-10 bg-[#0a0a0a] rounded-none sm:rounded-[2rem] border-y sm:border border-white/5 shadow-2xl p-6 sm:p-8 text-center sm:text-left mx-0 sm:mx-0">
            {creator.role !== 'FAN' && (
              <div className="flex justify-center sm:justify-start gap-12 text-sm font-bold text-gray-300 border-b border-white/10 pb-6 mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-white text-3xl font-black drop-shadow-md">{followersCount}</span>
                  <span className="text-gray-500 font-black uppercase tracking-widest text-[10px] mt-1">{t('lbl_fans')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-3xl font-black drop-shadow-md">
                    {/* TRUCO VISUAL: Posts mostrados */}
                    {posts.length > 0 ? posts.length : (creator.role === 'CREATOR' && !isSubscribed && !isOwnerOrAdmin ? '3' : '0')}
                  </span>
                  <span className="text-yellow-500 font-black uppercase tracking-widest text-[10px] mt-1">{t('lbl_posts')}</span>
                </div>
              </div>
            )}
            
            <p className="text-gray-300 whitespace-pre-wrap text-base leading-relaxed font-medium">
              {profile.bio || t('lbl_bio_fallback')}
            </p>
            
            {(profile.instagram || profile.twitter || profile.website) && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6 pt-6 border-t border-white/10">
                {profile.instagram && (
                  <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#111] hover:bg-pink-500/10 text-gray-400 hover:text-pink-500 border border-white/5 px-4 py-2 rounded-full transition-all">
                    <Instagram className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Instagram</span>
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#111] hover:bg-blue-400/10 text-gray-400 hover:text-blue-400 border border-white/5 px-4 py-2 rounded-full transition-all">
                    <Twitter className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#111] hover:bg-teal-400/10 text-gray-400 hover:text-teal-400 border border-white/5 px-4 py-2 rounded-full transition-all">
                    <Globe className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Web</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {(creator.role === 'CREATOR' || creator.role === 'ADMIN') && (
            <div className="px-2 sm:px-0">
             {bundles.length > 0 && (
                <div className="mb-12 space-y-6 animate-fade-in">
                  <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest pl-2 drop-shadow-md">
                    <Package className="w-5 h-5 text-yellow-500"/> {t('lbl_bundles')}
                  </h2>
                  <div className="flex sm:grid sm:grid-cols-2 gap-4 sm:gap-8 overflow-x-auto snap-x snap-mandatory pb-6 custom-scrollbar">
                    {bundles.map(bundle => {
                      const isPurchased = bundle.hasAccess || bundle.isPurchased; 
                      const handleOpenGallery = (e: any) => {
                        e.stopPropagation();
                        let allUrls: string[] = [];
                        bundle.posts?.forEach((p: any) => {
                          if (p.mediaUrl) {
                            try {
                              const parsed = JSON.parse(p.mediaUrl);
                              if (Array.isArray(parsed)) allUrls.push(...parsed);
                              else allUrls.push(parsed);
                            } catch(err) { allUrls.push(p.mediaUrl); }
                          }
                        });
                        if (allUrls.length > 0) setExpandedGallery({ urls: allUrls, currentIndex: 0, username: creator?.username });
                      };

                      return (
                        <div key={bundle.id} onClick={() => { if (!isOwnerOrAdmin && !isPurchased) handleBuyBundle(bundle); }} className={`min-w-[85%] sm:min-w-0 shrink-0 snap-center bg-[#0a0a0a] rounded-[2rem] border border-white/5 group flex flex-col h-full overflow-hidden shadow-lg transition-all relative ${isPurchased ? 'cursor-default border-green-500/20 nm-inset' : 'cursor-pointer hover:border-yellow-500/50'}`}>
                          <div className="w-full h-48 sm:h-56 bg-black relative overflow-hidden">
                            {bundle.posts && bundle.posts.length > 0 ? (() => {
                              let firstMediaUrl = null;
                              if (bundle.posts[0]?.mediaUrl) {
                                try {
                                  const parsed = JSON.parse(bundle.posts[0].mediaUrl);
                                  // 🔥 LÓGICA ORIGINAL INTACTA
                                  firstMediaUrl = Array.isArray(parsed) ? parsed[0]: parsed;
                                } catch(e) { firstMediaUrl = bundle.posts[0] .mediaUrl; }
                              }
                              return firstMediaUrl ? (
                                <>
                                  <img src={getImageUrl(firstMediaUrl)} className={`w-full h-full object-cover transition-all duration-700 ${!isPurchased && !isOwnerOrAdmin ? 'blur-xl opacity-50 scale-125' : 'blur-0 opacity-100'}`} alt="Bundle Cover" draggable="false" onContextMenu={(e) => e.preventDefault()} onClick={(e) => { if (isPurchased || isOwnerOrAdmin) handleOpenGallery(e); }}/>
                                  {!isPurchased && !isOwnerOrAdmin && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
                                      <div className="bg-black/60 p-4 rounded-full border border-white/10 shadow-2xl group-hover:scale-110 transition-transform"><Lock className="w-8 h-8 text-white" /></div>
                                    </div>
                                  )}
                                </>
                              ) : <div className="w-full h-full bg-yellow-900/20"></div>;
                            })() : <div className="w-full h-full bg-yellow-900/20"></div>}
                          </div>
                          <div className="p-6 flex flex-col flex-1 relative z-10">
                            <h3 className="text-xl font-black text-white">{bundle.title}</h3>
                            <p className="text-sm text-gray-400 mt-2 mb-6 line-clamp-2">{bundle.description}</p>
                            <div className="mt-auto pt-5 border-t border-white/5">
                              {isPurchased ? (
                                <button onClick={handleOpenGallery} className="w-full bg-green-500/10 text-green-500 py-3 rounded-xl font-black flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5"/> DESBLOQUEADO</button>
                              ) : (
                                <button className="w-full bg-gradient-to-r from-yellow-500 to-red-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Unlock className="w-5 h-5"/> COMPRAR ${(bundle.price || 0).toFixed(2)}</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🔥 TABS ORIGINALES (Los 5 Restaurados y Funcionales) */}
              <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
                {series?.length > 0 && (
                  <button onClick={() => setActiveTab('series')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'series' ? 'bg-yellow-500 text-black shadow-md' : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'}`}>
                    <PlaySquare className="w-4 h-4" /> {t('tab_academy')}
                  </button>
                )}
                <button onClick={() => setActiveTab('all')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-md' : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'}`}>
                  <LayoutGrid className="w-4 h-4" /> {t('tab_all')}
                </button>
                <button onClick={() => setActiveTab('photos')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'photos' ? 'bg-white text-black shadow-md' : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'}`}>
                  <ImageIcon className="w-4 h-4" /> {t('tab_photos')}
                </button>
                <button onClick={() => setActiveTab('videos')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'videos' ? 'bg-white text-black shadow-md' : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'}`}>
                  <Video className="w-4 h-4" /> {t('tab_videos')}
                </button>
                <button onClick={() => setActiveTab('locked')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'locked' ? 'bg-red-500 text-white shadow-md' : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'}`}>
                  <Lock className="w-4 h-4" /> {t('tab_locked')}
                </button>
              </div>

              {activeTab === 'series' && (
                <div className="mb-10 animate-fade-in"><SeriesTab series={series} onPurchaseSuccess={fetchSeries} /></div>
              )}

              {activeTab !== 'series' && (
                <div className="space-y-6">
                  {/* 🔥 EL TRUCO DEL FOMO: 3 candados gigantes en vez de texto gris */}
                  {filteredPosts.length === 0 && !isOwnerOrAdmin && !isSubscribed ? (
                    <div className="grid grid-cols-1 gap-6 opacity-80 pointer-events-none select-none">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-[#0a0a0a] h-64 sm:h-96 rounded-[2rem] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center nm-inset shadow-2xl">
                           <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-red-900/10 backdrop-blur-3xl"></div>
                           <Lock className="w-16 h-16 text-yellow-500/50 mb-4 drop-shadow-2xl" />
                           <span className="text-white font-black uppercase tracking-widest text-xs bg-black/50 px-6 py-2 rounded-full border border-white/10">Contenido Exclusivo VIP</span>
                        </div>
                      ))}
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center text-gray-500 py-16 nm-inset rounded-[2rem] border border-white/5 font-medium">{t('lbl_empty_category')}</div>
                  ) : (
                    filteredPosts.map((post) => {
                      const isPostUnlocked = isOwnerOrAdmin || post.hasAccess;
                      const rootComments = buildCommentTree(post.comments || []);
                      const totalComments = post._count?.comments || 0;
                      const isExpanded = expandedComments[post.id] || false;
                      const visibleComments = isExpanded ? rootComments : rootComments.slice(0, 3);

                      // 🔥 LÓGICA ORIGINAL INTACTA
                      let mediaUrls: string[] = [];
                      if (post.mediaUrl) {
                        try {
                          const parsed = JSON.parse(post.mediaUrl);
                          if (Array.isArray(parsed)) mediaUrls = parsed;
                          else mediaUrls = [post.mediaUrl];
                        } catch (e) {
                          mediaUrls = [post.mediaUrl];
                        }
                      }

                      return !isPostUnlocked ? (
                        <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 bg-[#0a0a0a] p-4 sm:p-6 rounded-[2rem] space-y-4 border border-white/5 shadow-xl relative group">
                          
                          {/* 🔥 BOTÓN DE REPORTAR POST BLOQUEADO */}
                          {!isOwnerOrAdmin && currentUser && (
                            <button onClick={() => { setReportPostId(post.id); setIsReportModalOpen(true); }} className="absolute top-6 right-6 text-gray-600 hover:text-red-500 transition-colors z-20" title="Reportar Post">
                              <Flag className="w-5 h-5" />
                            </button>
                          )}

                          <div className="flex items-center gap-3 mb-4 pr-10">
                            <div className="w-12 h-12 rounded-full border-2 border-yellow-500/50 flex items-center justify-center overflow-hidden shrink-0">
                              {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{creator.username.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-base">{creator.username}</h3>
                              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1"><Lock className="w-3 h-3"/> {post.isPPV ? t('lbl_ppv_exclusive') : t('lbl_vip_only')}</p>
                            </div>
                          </div>
                          <div className="w-full h-80 rounded-[2rem] relative border border-white/5 overflow-hidden nm-inset">
                            {mediaUrls.length > 0 && (
                              mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? <video src={getImageUrl(mediaUrls[0])} className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-60 scale-125 pointer-events-none" /> : <img src={getImageUrl(mediaUrls[0])} className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-60 scale-125 pointer-events-none" />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                              <Lock className="w-16 h-16 text-red-500 drop-shadow-2xl mb-4" />
                              {!isSubscribed && !post.isPPV ? (
                                <button onClick={handleSubscribe} className="bg-gradient-to-r from-yellow-500 to-red-500 hover:scale-105 text-white font-black py-3 px-8 rounded-full shadow-lg transition-transform flex items-center gap-2"><Crown className="w-5 h-5"/> Suscribirse para ver</button>
                              ) : (
                                <button onClick={() => handleUnlockPPV(post)} className="bg-gradient-to-r from-yellow-500 to-red-500 hover:scale-105 text-white font-black py-3 px-8 rounded-full shadow-lg transition-transform flex items-center gap-2"><Unlock className="w-5 h-5"/> Desbloquear ${(post.price || 0).toFixed(2)}</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 bg-[#0a0a0a] p-4 sm:p-6 rounded-[2rem] space-y-4 border border-white/5 shadow-xl relative group">
                          
                          {/* 🔥 BOTÓN DE BORRAR O REPORTAR EN POST DESBLOQUEADO */}
                          {isOwnerOrAdmin ? (
                            <button onClick={() => handleDeletePost(post.id)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 transition-colors z-20" title="Eliminar Post"><Trash2 className="w-5 h-5" /></button>
                          ) : currentUser ? (
                            <button onClick={() => { setReportPostId(post.id); setIsReportModalOpen(true); }} className="absolute top-6 right-6 text-gray-600 hover:text-red-500 transition-colors z-20" title="Reportar Post">
                              <Flag className="w-5 h-5" />
                            </button>
                          ) : null}

                          <div className="flex items-center gap-3 pr-10">
                            <div className="w-12 h-12 rounded-full border-2 border-yellow-500/50 flex items-center justify-center overflow-hidden shrink-0">
                              {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{creator.username.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-base">{creator.username}</h3>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1"><Unlock className="w-3 h-3 text-green-400"/> DESBLOQUEADO</p>
                            </div>
                          </div>
                          {post.content && <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>}
                          
                          {/* 🔥 CUADRÍCULA ORIGINAL INTACTA */}
                          {mediaUrls.length > 0 && (
                            <div className={`mt-4 rounded-2xl overflow-hidden nm-inset border border-white/5 relative bg-black/50 grid gap-1 ${
                              mediaUrls.length === 1 ? 'grid-cols-1' : 
                              mediaUrls.length === 2 ? 'grid-cols-2' : 
                              mediaUrls.length === 3 ? 'grid-cols-2' : 
                              mediaUrls.length === 4 ? 'grid-cols-2' : 
                              'grid-cols-6'
                            }`}>
                              {mediaUrls.map((url, idx) => {
                                const isVideo = url.match(/\.(mp4|mov|webm)$/i);
                                
                                let itemStyle = 'w-full h-full object-cover bg-black ';
                                if (mediaUrls.length === 1) itemStyle += 'max-h-[70vh] sm:max-h-[600px] object-contain';
                                else if (mediaUrls.length === 2) itemStyle += 'aspect-[3/4] sm:aspect-square';
                                else if (mediaUrls.length === 3) itemStyle += idx === 0 ? 'col-span-2 aspect-[2/1] sm:aspect-[21/9]' : 'col-span-1 aspect-square';
                                else if (mediaUrls.length === 4) itemStyle += 'col-span-1 aspect-square';
                                else if (mediaUrls.length === 5) itemStyle += idx < 2 ? 'col-span-3 aspect-[4/3]' : 'col-span-2 aspect-square';

                                return isVideo ? (
                                  <video key={idx} onContextMenu={(e) => e.preventDefault()} controls controlsList="nodownload noplaybackrate" disablePictureInPicture src={getImageUrl(url)} className={itemStyle} />
                                ) : url.match(/\.(mp3|wav|ogg)$/i) ? (
                                  <div key={idx} className="w-full p-6 flex justify-center bg-white/5 col-span-full">
                                    <audio controls src={getImageUrl(url)} className="w-full max-w-md outline-none" />
                                  </div>
                                ) : (
                                  <img 
                                    key={idx} 
                                    src={getImageUrl(url, post.user?.username)} 
                                    draggable="false" 
                                    onContextMenu={(e) => e.preventDefault()} 
                                    className={`${itemStyle} cursor-pointer hover:opacity-90 transition-opacity`} 
                                    onClick={() => setExpandedGallery({ urls: mediaUrls, currentIndex: idx, username: post.user?.username })} 
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* 🔥 REACCIONES Y COMENTARIOS ORIGINALES INTACTOS */}
                          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between relative">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                  {['❤️', '❤️‍🔥', '🫦', '🤤'].map((emoji) => {
                                    const isSelected = post.myReaction === emoji;
                                    const count = post.reactionCounts ? (post.reactionCounts[emoji] || 0) : 0;
                                    return (
                                      <button key={emoji} onClick={() => handleReact(post.id, emoji)} className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${isSelected ? 'scale-110 opacity-100 grayscale-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                                        <span className="text-xl">{emoji}</span>
                                        {count > 0 && <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{count}</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 font-bold transition-all px-4 py-2.5 rounded-full bg-white/5 border border-white/10 ${commentingPostId === post.id ? 'text-teal-500 border-teal-500/30' : 'text-gray-400 hover:text-teal-400 hover:border-white/20'}`}>
                                  <MessageCircle className="w-4 h-4" /> <span className="text-sm">{totalComments}</span>
                                </button>
                              </div>
                              {(!isOwnerOrAdmin) && (
                                <button onClick={() => { setTipRecipient(post.user); setIsTipModalOpen(true); }} className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 font-bold transition-colors">
                                  <Coins className="w-5 h-5" /> <span className="text-sm hidden sm:inline">{t('btn_tip')}</span>
                                </button>
                              )}
                            </div>

                            {commentingPostId === post.id && (
                              <div className="flex flex-col gap-2 animate-fade-in mt-2">
                                {replyingToCommentId && (
                                  <div className="flex justify-between items-center bg-teal-900/20 px-3 py-1 text-xs text-teal-400 rounded-lg">
                                    <span>{t('lbl_replying')}</span>
                                    <button onClick={() => setReplyingToCommentId(null)}><X className="w-3 h-3"/></button>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('ph_comment')} className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-2.5 text-sm text-white outline-none focus:border-teal-500/50" onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}/>
                                  <button onClick={() => submitComment(post.id)} disabled={isSubmittingComment || !commentText.trim()} className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white hover:bg-teal-500 transition-colors shrink-0 disabled:opacity-50"><Send className="w-4 h-4" /></button>
                                </div>
                              </div>
                            )}

                            {totalComments > 0 && (
                               <div className="space-y-1 mt-4">
                                 {visibleComments.map((comment: any) => (
                                    <CommentNode key={comment.id} comment={comment} postId={post.id} currentUser={currentUser} onReply={handleReplyClick} onDelete={handleDeleteComment} isExpanded={isExpanded}/>
                                 ))}
                                 {totalComments > 3 && (
                                   <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="text-xs text-gray-500 font-bold mt-2 hover:text-white pt-2 w-full text-left transition-colors">
                                     {isExpanded ? t('btn_hide_comments') : t('btn_view_comments', { count: totalComments })}
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
              )}
            </div>
          )}
        </main>

        {/* 🔥 TUS MODALES ORIGINALES INTACTOS (PROPINAS, PAGOS, GALERIA, REPORTES) 🔥 */}
        {isTipModalOpen && tipRecipient && (
          <TipModal creatorName={tipRecipient.username} onClose={() => setIsTipModalOpen(false)} onContinue={async (amount, message) => { setIsTipModalOpen(false); try { const res = await api.post('/payments/create-intent', { amount: Number(amount), type: 'TIP', creatorId: tipRecipient.id, description: `${t('lbl_tip_of')} $${amount}: ${message}` }); if (res.data.success || res.data.receipt) { alert(t('alert_tip_success')); const saldoActual = parseFloat(currentUser.walletBalance) || 0; const nuevoSaldo = saldoActual - Number(amount); const usuarioActualizado = { ...currentUser, walletBalance: nuevoSaldo }; setCurrentUser(usuarioActualizado); localStorage.setItem('user', JSON.stringify(usuarioActualizado)); window.dispatchEvent(new CustomEvent('covraPayBalanceUpdate', { detail: nuevoSaldo })); fetchProfileAndPosts(true); } else if (res.data.clientSecret) { setClientSecret(res.data.clientSecret); setPendingPayment({ price: amount }); setIsPaymentModalOpen(true); } } catch (error) { alert(t('alert_tip_error')); } }} />
        )}
        
        {isPaymentModalOpen && clientSecret && (
          <PaymentModal clientSecret={clientSecret} price={pendingPayment?.price || 0} creatorId={creator.id} onClose={() => setIsPaymentModalOpen(false)} onSuccess={async () => { setIsPaymentModalOpen(false); if (pendingPayment?.isBundle) { try { await api.post('/bundles/purchase', { bundleId: pendingPayment.id }); } catch(e){} } alert(t('alert_payment_success')); if (pendingPayment?.isSubscription) setIsSubscribed(true); fetchProfileAndPosts(true); }} />
        )}

        {expandedGallery && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none" style={{ zIndex: 99999 }}>
            <button onClick={() => setExpandedGallery(null)} className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10" style={{ zIndex: 100000 }} title="Cerrar">
              <X className="w-6 h-6" />
            </button>
            {expandedGallery.urls.length > 1 && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white font-bold bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-sm tracking-widest" style={{ zIndex: 100000 }}>
                {expandedGallery.currentIndex + 1} / {expandedGallery.urls.length}
              </div>
            )}
            {expandedGallery.urls.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setExpandedGallery(prev => prev ? {...prev, currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length} : null); }} className="absolute left-4 sm:left-10 z-50 p-4 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hidden sm:block border border-white/10">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            <div 
              className="relative flex items-center justify-center w-full h-full p-2 sm:p-12" 
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)} 
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)} 
              onTouchEnd={() => { 
                if (!touchStart || !touchEnd) return; 
                const distance = touchStart - touchEnd; 
                const isLeftSwipe = distance > 50; 
                const isRightSwipe = distance < -50; 
                if (isLeftSwipe && expandedGallery.urls.length > 1) { 
                  setExpandedGallery(prev => prev ? {...prev, currentIndex: (prev.currentIndex + 1) % prev.urls.length} : null); 
                } 
                if (isRightSwipe && expandedGallery.urls.length > 1) { 
                  setExpandedGallery(prev => prev ? {...prev, currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length} : null); 
                } 
                setTouchStart(null); 
                setTouchEnd(null); 
              }}
            >
              {expandedGallery.urls[expandedGallery.currentIndex].match(/\.(mp4|mov|webm)$/i) ? (
                <video 
                  src={getImageUrl(expandedGallery.urls[expandedGallery.currentIndex])} 
                  autoPlay 
                  controls 
                  controlsList="nodownload noplaybackrate" 
                  disablePictureInPicture 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto transition-transform duration-300" 
                  onContextMenu={(e) => e.preventDefault()} 
                />
              ) : (
                <img 
                  src={getImageUrl(expandedGallery.urls[expandedGallery.currentIndex], expandedGallery.username)} 
                  alt="Imagen" 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto transition-transform duration-300" 
                  draggable="false" 
                  onContextMenu={(e) => e.preventDefault()} 
                />
              )}
            </div>
            {expandedGallery.urls.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setExpandedGallery(prev => prev ? {...prev, currentIndex: (prev.currentIndex + 1) % prev.urls.length} : null); }} className="absolute right-4 sm:right-10 z-50 p-4 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hidden sm:block border border-white/10">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#111] p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative">
              <button onClick={() => { setIsReportModalOpen(false); setReportPostId(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black text-white">{reportPostId ? "Reportar Publicación" : t('title_report_user')}</h3>
                  <p className="text-xs text-gray-400">@{creator?.username}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('lbl_main_reason')}</label>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500 transition-colors">
                    <option value="">{t('ph_select_reason')}</option>
                    <option value="FRAUD OR SCAM">Fraude o Estafa</option>
                    <option value="VIOLENCE">Violencia</option>
                    <option value="HARASSMENT">Acoso</option>
                    <option value="SELF_HARM">Suicidio o autolesiones</option>
                    <option value="FALSE_INFO">Información falsa</option>
                    <option value="SPAM">Spam</option>
                    <option value="UNAUTHORIZED_SALES">Ventas no autorizadas</option>
                    <option value="HATE_SPEECH">Lenguaje que incita al odio</option>
                    <option value="TERRORISM">Terrorismo</option>
                    <option value="COPYRIGHT">Derechos de autor</option>
                    <option value="AI_CONTENT">Contenido con Inteligencia Artificial</option>
                    <option value="OTHER">Otro motivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('lbl_additional_details')}</label>
                  <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder={t('ph_report_desc')} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500 resize-none custom-scrollbar transition-colors"></textarea>
                </div>
                <div className="pt-2">
                  <button onClick={handleSubmitReport} disabled={isSubmittingReport || !reportReason} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmittingReport ? t('btn_sending') : <><Flag className="w-4 h-4"/> {t('btn_send_report')}</>}
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-3 leading-relaxed">{t('lbl_report_disclaimer')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}