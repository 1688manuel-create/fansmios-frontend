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
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

import { 
  ArrowLeft, CheckCircle2, MessageCircle, Star, Lock, 
  Unlock, Trash2, Coins, Package, Ghost, X, Plus, Crown, Send,
  Instagram, Twitter, Globe, ShieldAlert, Flag, AlertTriangle,
  LayoutGrid, Image as ImageIcon, Video, Eye // 👈 ¡Agrega 'Eye' aquí!
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null, usernameForWatermark: string | null = null) => {
  if (!path) return '';
  if (path.startsWith('http')) {
    if (usernameForWatermark && path.includes('cloudinary.com')) {
      const cleanUsername = usernameForWatermark.replace('@', '');
      const watermarkTransform = `upload/l_text:Arial_40_bold:fansmio%20%40${cleanUsername},co_white,o_30/fl_layer_apply,g_south,y_40/`;
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
  const t = useTranslations('Profile'); // 👈 AGREGAMOS EL TRADUCTOR AQUÍ
  const isOwner = currentUser?.id === comment.userId || currentUser?.role === 'ADMIN'; 

  return (
    <div id={`comment-${comment.id}`} className="flex flex-col mt-2 group/comment scroll-mt-32 transition-all duration-500 rounded-xl">
      <div className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm relative">
        <span className="font-bold text-gray-300 mr-2">@{comment.user?.username || t('lbl_user')}:</span>
        <span className="text-gray-400">{comment.content}</span>
        
        <div className="flex items-center gap-4 mt-1.5">
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

  const t = useTranslations('Profile'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  
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
  
  // 🔥 ESTADO PARA LOS TABS DEL PERFIL
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
  const [expandedImage, setExpandedImage] = useState<{url: string, username: string} | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
    if (!username || username === 'undefined') return; 
    
    fetchProfileAndPosts(false);
  }, [username]);

  // Estado para guardar las series
  const [series, setSeries] = useState<any[]>([]);

  // Función para extraer los cursos del backend
  const fetchSeries = async () => {
    try {
      // Reemplaza params.username por como sea que estés obteniendo el nombre de la URL
      const res = await api.get(`/series/creator/${params.username}`);
      setSeries(res.data.series || []);
    } catch (error) {
      console.error("Error cargando la academia:", error);
    }
  };

  // Inyecta fetchSeries() adentro de tu useEffect principal para que cargue al entrar a la página
  useEffect(() => {
    // ... tus otras cargas (fetchProfile, etc.)
    fetchSeries();
  }, [params.username]);

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
    if (!currentUser) { alert(t('alert_login_subscribe')); router.push('/auth'); return; }
    try {
      const data = await paymentService.createPaymentIntent({
        amount: creator?.creatorProfile?.monthlyPrice || 0,
        type: 'SUBSCRIPTION',
        creatorId: creator.id,
        description: `VIP - @${creator.username}`
      });
      
      if (data.success || data.receipt) {
        alert(t('alert_sub_success'));
        fetchProfileAndPosts(true);
      } else {
        setClientSecret(data.clientSecret);
        setPendingPayment({ price: creator?.creatorProfile?.monthlyPrice || 0 });
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) { 
      // 🔥 AHORA LEE EL ERROR REAL DE LA BÓVEDA
      const mensajeReal = error.response?.data?.error || error.message || t('alert_sub_error');
      alert(`❌ ${mensajeReal}`);
    }
  };

  const handleUnlockPPV = async (post: any) => {
    if (!currentUser) { alert(t('alert_login_unlock')); router.push('/auth'); return; }
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
      // 🔥 AHORA LEE EL ERROR REAL DE LA BÓVEDA
      const mensajeReal = error.response?.data?.error || error.message || t('alert_payment_error');
      alert(`❌ ${mensajeReal}`);
    }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!currentUser) { alert(t('alert_login_bundle')); router.push('/auth'); return; }
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
      // 🔥 AHORA LEE EL ERROR REAL DE LA BÓVEDA
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
    } catch (error) {
      alert(t('alert_delete_post_error'));
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await api.post(`/posts/${postId}/like`, { emoji });
      fetchProfileAndPosts(true); 
    } catch (error) { console.error("Error:", error); }
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
    if (!currentUser) { alert(t('alert_login_message')); router.push('/auth'); return; }
    router.push(`/dashboard/messages?chatWith=${creator.id}&name=${creator.username}`);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) { alert(t('alert_report_reason')); return; }
    setIsSubmittingReport(true);
    try {
      await api.post('/reports', {
        type: 'USER',
        reportedUserId: creator.id,
        reason: reportReason,
        description: reportDescription
      });
      alert(t('alert_report_success'));
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
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

  // 🔥 LÓGICA DE FILTRADO DE TABS
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

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div></div>;
  if (hasError || !creator) return <div className="min-h-screen bg-nm-base text-white flex flex-col items-center justify-center"><Ghost className="w-20 h-20 text-gray-600"/><h2 className="text-3xl font-black">{t('lbl_not_found')}</h2></div>;

  const profile = creator.creatorProfile || {};
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
          {!profile.coverImage && <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-blue-900/20"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none"></div> 
          <button onClick={() => router.back()} className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full z-20 flex items-center gap-2 font-bold text-sm hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('btn_back')}
          </button>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-16 sm:-mt-20">
          
          {/* 🔥 1. AVATAR FLOTANTE Y CABECERA REDISEÑADA */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end mb-8 gap-4">
            <div className="flex flex-col items-start relative">
              <div 
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-[#050505] shadow-2xl flex items-center justify-center text-white text-5xl font-black bg-[#0a0a0a] relative overflow-hidden shrink-0 z-10 nm-inset select-none ${profile.isVerified ? 'shadow-[0_0_30px_rgba(20,184,166,0.3)]' : ''}`}
                onContextMenu={(e) => e.preventDefault()}
              >
                {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" draggable="false" /> : <span className="bg-gradient-to-tr from-teal-500 to-blue-500 w-full h-full flex items-center justify-center text-white">{(creator.username || 'U').toUpperCase()}</span>}
              </div>
              
              <div className="mt-3 px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 drop-shadow-md">
                  {creator.name || creator.username}
                  {profile.isVerified && <span title={t('lbl_verified')}><CheckCircle2 className="w-6 h-6 text-teal-400 fill-teal-400/20 drop-shadow-[0_0_5px_rgba(20,184,166,0.8)]" /></span>}
                  {currentUser?.role === 'ADMIN' && <span title={t('lbl_admin_view')}><ShieldAlert className="w-5 h-5 text-red-500" /></span>}
                </h1>
                <p className="text-gray-400 text-sm font-bold mt-0.5">@{creator.username}</p>
              </div>
            </div>
            
            {/* 🔥 2. BOTONES DE ACCIÓN (CTAs) AGRESIVOS */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              
              {(!isOwnerOrAdmin) ? (
                isSubscribed ? (
                  <button disabled className="nm-inset text-yellow-500 border border-yellow-500/30 font-bold py-3.5 px-8 rounded-2xl cursor-default w-full sm:w-auto flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-inner">
                    <Star className="w-5 h-5 fill-yellow-500/20"/> {t('vip_active')}
                  </button>
                ) : (
                  <button onClick={handleSubscribe} className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-black py-3.5 px-10 rounded-2xl w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(20,184,166,0.3)] hover:scale-105 transition-all">
                    <Crown className="w-5 h-5"/> {t('subscribe')} • ${(profile.monthlyPrice || 0).toFixed(2)}{t('lbl_month')}
                  </button>
                )
              ) : (
                <div className="nm-inset px-6 py-3.5 rounded-2xl border border-white/5 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-500" /> <span className="text-sm font-bold text-gray-300">{t('public_profile')}</span>
                </div>
              )}

              {currentUser?.id !== creator.id && (
                <div className="flex gap-2 w-full sm:w-auto">
                  {currentUser?.role !== 'ADMIN' && (
                    <button 
                      onClick={handleFollowToggle}
                      className={`font-bold py-3.5 px-5 rounded-2xl transition-all flex items-center justify-center flex-1 sm:w-auto ${
                        isFollowing ? 'nm-inset text-teal-400 border border-teal-500/30' : 'bg-[#151515] border border-white/5 text-gray-300 hover:text-white hover:border-white/20 shadow-md'
                      }`}
                      title={isFollowing ? t('btn_unfollow') : t('btn_follow_free')}
                    >
                      {isFollowing ? <CheckCircle2 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                    </button>
                  )}
                  
                  <button onClick={handleMessageClick} title={t('btn_send_message')} className="bg-[#151515] border border-white/5 text-gray-300 hover:text-teal-400 font-bold w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-md">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  
                  {currentUser?.role !== 'ADMIN' && (
                    <>
                      <button onClick={() => { setTipRecipient(creator); setIsTipModalOpen(true); }} title={t('btn_tip')} className="bg-[#151515] border border-white/5 text-gray-300 hover:text-green-400 font-bold w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-md">
                        <Coins className="w-5 h-5" />
                      </button>
                      <button onClick={() => {
                        if(!currentUser) { alert(t('alert_login_report')); router.push('/auth'); return; }
                        setIsReportModalOpen(true);
                      }} title={t('btn_report_user')} className="bg-[#151515] border border-white/5 text-gray-500 hover:text-red-500 font-bold w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-md">
                        <Flag className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 🔥 3. PANEL DE ESTADÍSTICAS NEUMÓRFICO Y BIO */}
          <div className="mb-10 bg-[#0a0a0a] nm-inset rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl p-1">
            <div className="p-6 md:p-8">
              <div className="flex gap-10 text-sm font-bold text-gray-300 border-b border-white/10 pb-6">
                <div className="flex flex-col items-center">
                  <span className="text-white text-2xl font-black drop-shadow-md">{followersCount}</span>
                  <span className="text-teal-500 font-black uppercase tracking-widest text-[10px] mt-1">{t('lbl_fans')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-2xl font-black drop-shadow-md">{posts.length}</span>
                  <span className="text-blue-500 font-black uppercase tracking-widest text-[10px] mt-1">{t('lbl_posts')}</span>
                </div>
              </div>
              
              <p className="text-gray-300 whitespace-pre-wrap text-base leading-relaxed font-medium pt-6">
                {profile.bio || t('lbl_bio_fallback')}
              </p>

              {/* 🔥 4. PÍLDORAS SOCIALES */}
              {(profile.instagram || profile.twitter || profile.website) && (
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">
                  {profile.instagram && (
                    <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#151515] hover:bg-pink-500/10 text-gray-400 hover:text-pink-500 border border-white/5 hover:border-pink-500/30 px-4 py-2 rounded-full transition-all shadow-sm">
                      <Instagram className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Instagram</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#151515] hover:bg-blue-400/10 text-gray-400 hover:text-blue-400 border border-white/5 hover:border-blue-400/30 px-4 py-2 rounded-full transition-all shadow-sm">
                      <Twitter className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#151515] hover:bg-teal-400/10 text-gray-400 hover:text-teal-400 border border-white/5 hover:border-teal-400/30 px-4 py-2 rounded-full transition-all shadow-sm">
                      <Globe className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Web</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PAQUETES EN OFERTA CON MINI GALERÍA INTERACTIVA */}
          {bundles.length > 0 && (
            <div className="mb-12 space-y-6 animate-fade-in">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest pl-2">
                <Package className="w-5 h-5 text-teal-500"/> {t('lbl_bundles')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map(bundle => {
                  const isPurchased = bundle.hasAccess || bundle.isPurchased; 

                  return (
                    <div 
                      key={bundle.id} 
                      onClick={() => { if (!isOwnerOrAdmin && !isPurchased) handleBuyBundle(bundle); }} 
                      className={`bg-[#0a0a0a] p-6 rounded-3xl border border-white/5 group flex flex-col h-full transition-colors shadow-lg ${
                        isPurchased ? 'cursor-default border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)] nm-inset' : 'cursor-pointer hover:border-teal-500/30 hover:shadow-[0_10px_30px_rgba(20,184,166,0.1)]'
                      }`}
                    >
                      <h3 className="text-xl font-bold text-white">{bundle.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-2">{bundle.description}</p>
                      
                      {bundle.posts && bundle.posts.length > 0 && (
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex -space-x-3">
                            {bundle.posts.slice(0, 3).map((p: any, i: number) => (
                              <div key={i} className="w-12 h-12 rounded-lg nm-inset border border-white/10 overflow-hidden relative" style={{ zIndex: 3 - i }}>
                                {p.mediaUrl ? (
                                  <img 
                                    src={getImageUrl(p.mediaUrl)} 
                                    className={`w-full h-full object-cover transition-all ${!isPurchased && !isOwnerOrAdmin ? 'blur-md opacity-60 scale-125' : 'blur-0 opacity-100 cursor-pointer hover:scale-110'}`} 
                                    alt="Media" 
                                    draggable="false"
                                    onContextMenu={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                      if (isPurchased || isOwnerOrAdmin) {
                                        e.stopPropagation();
                                        setExpandedImage({ url: getImageUrl(p.mediaUrl, creator?.username), username: creator?.username });
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-teal-900/20"></div>
                                )}
                              </div>
                            ))}
                            {bundle.posts.length > 3 && (
                              <div className="w-12 h-12 rounded-lg nm-inset border border-white/10 bg-black/80 flex items-center justify-center text-xs font-bold text-white z-0">
                                +{bundle.posts.length - 3}
                              </div>
                            )}
                          </div>
                          {!isPurchased && !isOwnerOrAdmin && (
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded">
                              <Lock className="w-3 h-3"/> {t('lbl_hidden')}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-auto pt-5 border-t border-white/5">
                        <span className="text-xs font-bold text-teal-400 nm-inset px-3 py-1.5 rounded-md border border-teal-500/20">{bundle.posts?.length} {t('lbl_files')}</span>
                        
                        {isOwnerOrAdmin ? (
                          <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors">{t('btn_view_bundle')}</button>
                        ) : isPurchased ? (
                          <button className="nm-inset border border-green-500/30 text-green-500 py-2.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 font-bold cursor-default" onClick={(e) => e.stopPropagation()}>
                            <CheckCircle2 className="w-4 h-4" /> {t('btn_acquired')}
                          </button>
                        ) : (
                          <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/20">{t('btn_buy')} ${(bundle.price || 0).toFixed(2)}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🔥 5. TABS DE FILTRO CON LA ACADEMIA INCLUIDA */}
          {(posts.length > 0 || series?.length > 0) && (
            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
              <button onClick={() => setActiveTab('series')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'series' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-[#151515] text-gray-400 hover:text-white border border-white/5'}`}>
                <PlaySquare className="w-4 h-4" /> {t('tab_academy')}
              </button>
              <button onClick={() => setActiveTab('all')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-md' : 'bg-[#151515] text-gray-400 hover:text-white border border-white/5'}`}>
                <LayoutGrid className="w-4 h-4" /> {t('tab_all')}
              </button>
              <button onClick={() => setActiveTab('photos')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'photos' ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-[#151515] text-gray-400 hover:text-white border border-white/5'}`}>
                <ImageIcon className="w-4 h-4" /> {t('tab_photos')}
              </button>
              <button onClick={() => setActiveTab('videos')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'videos' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#151515] text-gray-400 hover:text-white border border-white/5'}`}>
                <Video className="w-4 h-4" /> {t('tab_videos')}
              </button>
              <button onClick={() => setActiveTab('locked')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'locked' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[#151515] text-gray-400 hover:text-white border border-white/5'}`}>
                <Lock className="w-4 h-4" /> {t('tab_locked')}
              </button>
            </div>
          )}

          {/* 🔥 6. VITRINA DE LA ACADEMIA VIP */}
          {activeTab === 'series' && (
            <div className="mb-10 animate-fade-in">
              <SeriesTab series={series} onPurchaseSuccess={fetchSeries} />
            </div>
          )}

          {/* EL RESTO DE LOS POSTS EN EL MURO */}
          {activeTab !== 'series' && (
            <div className="space-y-6">
              {filteredPosts.length === 0 ? <div className="text-center text-gray-500 py-16 nm-inset rounded-[2rem] border border-white/5 font-medium">{t('lbl_empty_category')}</div> : (
                filteredPosts.map((post) => {
                  const isPostUnlocked = isOwnerOrAdmin || post.hasAccess;
                  const rootComments = buildCommentTree(post.comments || []);
                  const totalComments = post._count?.comments || 0;
                  const isExpanded = expandedComments[post.id] || false;
                  const visibleComments = isExpanded ? rootComments : rootComments.slice(0, 3);

                  return !isPostUnlocked ? (
                    <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 transition-all duration-500 bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 relative overflow-hidden border border-white/5 shadow-xl">
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border-2 border-teal-500/30">
                            {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" draggable="false" onContextMenu={(e) => e.preventDefault()} /> : <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center">{creator.username.toUpperCase()}</div>}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-base">{creator.username}</h3>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              <Lock className="w-3 h-3"/> {post.isPPV ? t('lbl_ppv_exclusive') : t('lbl_vip_only')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 mt-4 overflow-hidden group nm-inset">
                        {post.mediaUrl && (
                          post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                            <video src={getImageUrl(post.mediaUrl)} onContextMenu={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-60 scale-125 select-none pointer-events-none" />
                          ) : (
                            <img src={getImageUrl(post.mediaUrl)} alt="Contenido Oculto" draggable="false" onContextMenu={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-60 scale-125 select-none pointer-events-none" />
                          )
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
                        
                        <div className="relative z-10 flex flex-col items-center space-y-4 bg-black/40 px-10 py-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                          <Lock className="w-14 h-14 text-red-500 drop-shadow-md" />
                          {!isSubscribed && !post.isPPV ? (
                            <button onClick={(e) => { e.stopPropagation(); handleSubscribe(); }} className="mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
                              <Crown className="w-4 h-4"/> {t('subscribe_to_view')}
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); handleUnlockPPV(post); }} className="mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
                              <Unlock className="w-4 h-4"/> {t('unlock_for')} ${(post.price || 0).toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div id={`post-${post.id}`} key={post.id} className="scroll-mt-24 transition-all duration-500 bg-[#0a0a0a] p-6 rounded-[2rem] space-y-5 border border-white/5 shadow-xl relative">
                      
                      {isOwnerOrAdmin && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-6 right-6 text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-full transition-all z-20"
                          title={t('btn_delete_post')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}

                      <div className="flex justify-between items-center pr-12">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border-2 border-teal-500/30">
                            {profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="Avatar" className="w-full h-full object-cover" draggable="false" onContextMenu={(e) => e.preventDefault()} /> : <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center">{creator.username.toUpperCase()}</div>}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-base">{creator.username}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              {post.isPPV ? (
                                <><Unlock className="w-3 h-3 text-green-400"/> {isOwnerOrAdmin ? `PPV: $${(post.price || 0).toFixed(2)}` : t('lbl_purchased')}</>
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
                          {post.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                            <video controls controlsList="nodownload noplaybackrate" disablePictureInPicture src={getImageUrl(post.mediaUrl)} className="w-full h-auto object-cover max-h-[600px] shadow-md select-none" onContextMenu={(e) => e.preventDefault()} />
                          ) : post.mediaUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                            <div className="w-full p-6 flex justify-center bg-white/5">
                              <audio controls src={getImageUrl(post.mediaUrl)} className="w-full max-w-md outline-none" />
                            </div>
                          ) : (
                            <img src={getImageUrl(post.mediaUrl)} alt="Exclusivo" draggable="false" onContextMenu={(e) => e.preventDefault()} className="w-full h-auto object-cover max-h-[600px] cursor-pointer" onClick={() => setExpandedImage({ url: getImageUrl(post.mediaUrl, post.user?.username), username: post.user?.username })} />
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
                                  >
                                    <span className="text-xl">{emoji}</span>
                                    {count > 0 && <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className={`flex items-center gap-1.5 font-bold transition-all px-4 py-2.5 rounded-full bg-white/5 border border-white/10 ${commentingPostId === post.id ? 'text-teal-500 border-teal-500/30' : 'text-gray-400 hover:text-teal-400 hover:border-white/20'}`}>
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{totalComments}</span>
                            </button>
                          </div>
                          
                          {(!isOwnerOrAdmin) && (
                            <button onClick={() => { setTipRecipient(post.user); setIsTipModalOpen(true); }} className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 font-bold transition-colors">
                              <Coins className="w-5 h-5" />
                              <span className="text-sm hidden sm:inline">{t('btn_tip')}</span>
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
                              <input 
                                type="text" 
                                value={commentText} 
                                onChange={(e) => setCommentText(e.target.value)} 
                                placeholder={t('ph_comment')} 
                                className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-2.5 text-sm text-white outline-none focus:border-teal-500/50" 
                                onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                              />
                              <button 
                                onClick={() => submitComment(post.id)} 
                                disabled={isSubmittingComment || !commentText.trim()} 
                                className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white hover:bg-teal-500 transition-colors shrink-0 disabled:opacity-50"
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
        </main>

        {/* MODAL DE PROPINAS */}
        {isTipModalOpen && tipRecipient && (
          <TipModal 
            creatorName={tipRecipient.username} 
            onClose={() => setIsTipModalOpen(false)} 
            onContinue={async (amount, message) => { 
              setIsTipModalOpen(false); 
              try { 
                const res = await api.post('/payments/create-intent', { 
                  amount: Number(amount),
                  type: 'TIP', 
                  creatorId: tipRecipient.id, 
                  description: `${t('lbl_tip_of')} $${amount}: ${message}` 
                }); 

                // 1. Si se pagó exitosamente con el saldo de la billetera
                if (res.data.success || res.data.receipt) { 
                  alert(t('alert_tip_success')); 

                  const saldoActual = parseFloat(currentUser.walletBalance) || 0;
                  const nuevoSaldo = saldoActual - Number(amount);
                  
                  const usuarioActualizado = { ...currentUser, walletBalance: nuevoSaldo };
                  setCurrentUser(usuarioActualizado);
                  localStorage.setItem('user', JSON.stringify(usuarioActualizado));
                  
                  window.dispatchEvent(new CustomEvent('covraPayBalanceUpdate', { 
                    detail: nuevoSaldo 
                  }));

                  fetchProfileAndPosts(true); 
                } 
                // 2. 🔥 SOLUCIÓN: Si no hay saldo, abrimos la pasarela de pago (PaymentModal)
                else if (res.data.clientSecret) {
                  setClientSecret(res.data.clientSecret);
                  setPendingPayment({ price: amount });
                  setIsPaymentModalOpen(true);
                }
              } catch (error) { 
                console.error("Error al enviar propina:", error);
                alert(t('alert_tip_error')); 
              } 
            }} 
          />
        )}
        
        {/* MODAL DE PAGOS */}
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
              alert(t('alert_payment_success')); 
              fetchProfileAndPosts(true); 
            }} 
          />
        )}

        {/* MODAL DE IMAGEN EXPANDIDA */}
        {expandedImage && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none" 
            style={{ zIndex: 99999 }}
            onClick={() => setExpandedImage(null)} 
            onContextMenu={(e) => e.preventDefault()}
          >
            <button 
              onClick={() => setExpandedImage(null)} 
              className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10" 
              style={{ zIndex: 100000 }} 
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage.url} alt="Exclusivo" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none" draggable="false" onContextMenu={(e) => e.preventDefault()} />
              <div className="absolute inset-0 w-full h-full cursor-default" onContextMenu={(e) => e.preventDefault()} style={{ zIndex: 10 }}></div>
            </div>
          </div>
        )}

        {/* NUEVO MODAL DE REPORTES */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#111] p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{t('title_report_user')}</h3>
                  <p className="text-xs text-gray-400">@{creator?.username}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('lbl_main_reason')}</label>
                  <select 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="">{t('ph_select_reason')}</option>
                    <option value="SPAM">{t('rep_spam')}</option>
                    <option value="FRAUD">{t('rep_fraud')}</option>
                    <option value="HARASSMENT">{t('rep_harassment')}</option>
                    <option value="INAPPROPRIATE">{t('rep_inappropriate')}</option>
                    <option value="OTHER">{t('rep_other')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('lbl_additional_details')}</label>
                  <textarea 
                    value={reportDescription} 
                    onChange={(e) => setReportDescription(e.target.value)} 
                    placeholder={t('ph_report_desc')}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500 resize-none custom-scrollbar transition-colors"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleSubmitReport}
                    disabled={isSubmittingReport || !reportReason}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingReport ? t('btn_sending') : <><Flag className="w-4 h-4"/> {t('btn_send_report')}</>}
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-3 leading-relaxed">
                    {t('lbl_report_disclaimer')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}