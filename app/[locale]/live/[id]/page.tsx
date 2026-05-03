"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../../lib/liveService';
import api from '../../../../lib/api';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  useParticipants 
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';

// 🔥 ICONOS PREMIUM
import { Eye, X, Lock, Tv, Star, Diamond, Trophy, Zap, Send, Play, Heart, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 🔥 BLINDAJE DE CONEXIÓN
let SOCKET_URL = 'https://api.fansmio.com';
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL);
    SOCKET_URL = `${url.protocol}//${url.host}`;
  } catch (e) {
    console.error("URL en .env mal escrita, usando fallback");
  }
}

// 🏆 ECONOMÍA DE LUJO FANSMIO (DÓLARES PUROS 💵)
export interface Gift { id: number; name: string; amount: number; image: string; style: string; action?: string; }

// ✅ RUTAS LOCALES RESTAURADAS (Tus imágenes en public/gifts funcionarán perfecto)
export const GIFTS: Gift[] = [
  { id: 1, name: "Rosa", amount: 1.00, image: "/gifts/rosa.png", style: "text-rose-400 font-bold" },
  { id: 2, name: "Brindis", amount: 2.00, image: "/gifts/brindis.png", style: "text-yellow-200 font-bold" },
  { id: 3, name: "Beso", amount: 5.00, image: "/gifts/beso.png", style: "text-pink-500 font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" },
  { id: 4, name: "Carta", amount: 10.00, image: "/gifts/carta.png", style: "text-fuchsia-400 font-bold" },
  { id: 5, name: "Corona", amount: 15.00, image: "/gifts/corona.png", style: "text-yellow-400 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]", action: 'sparkles' },
  { id: 6, name: "Llave", amount: 20.00, image: "/gifts/llave.png", style: "text-amber-200 font-black" },
  { id: 7, name: "Diamante", amount: 30.00, image: "/gifts/diamante.png", style: "text-cyan-300 font-black drop-shadow-[0_0_15px_rgba(103,232,249,0.8)]", action: 'explosion' },
  { id: 8, name: "Deportivo", amount: 50.00, image: "/gifts/deportivo.png", style: "text-green-400 font-black italic" },
  { id: 9, name: "Corazón VIP", amount: 100.00, image: "/gifts/corazon-vip.png", style: "text-red-500 font-extrabold drop-shadow-[0_0_25px_rgba(239,68,68,1)] uppercase", action: 'fireworks' },
  { id: 10, name: "Universo", amount: 200.00, image: "/gifts/universo.png", style: "text-purple-400 font-black drop-shadow-[0_0_35px_rgba(192,132,252,1)] uppercase", action: 'galaxy' },
];

export interface Donator { userId: string; username: string; amount: number; }

export default function LiveRoom() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations('LiveRoom');

  const [user, setUser] = useState<any>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState("");
  const [isLiveActive, setIsLiveActive] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [viewersCount, setViewersCount] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [giftEffect, setGiftEffect] = useState<Gift | null>(null);
  const [topDonators, setTopDonators] = useState<Donator[]>([]);
  const [streak, setStreak] = useState(0);
  
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const [currentGoal, setCurrentGoal] = useState(0);
  const [targetGoal, setTargetGoal] = useState(500);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem('user') : null;
      if (storedUser && storedUser !== "undefined") {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        api.get('/wallet').then(res => {
          if (res.data?.wallet) {
            const freshUser = { ...parsedUser, walletBalance: res.data.wallet.balance };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        }).catch(err => console.error("Error sincronizando bóveda:", err));
      } else {
        router.push('/auth');
      }
    } catch { router.push('/auth'); }
    loadStreamData();
  }, [id, router]);

  const loadStreamData = async () => {
    try {
      const data = await liveService.getStream(id as string);
      setStreamData(data.stream);
      setHasAccess(data.hasAccess);

      if (data.hasAccess) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCreatorOrAdmin = String(currentUser.id) === String(data.stream.creatorId) || String(currentUser.role).toUpperCase() === 'ADMIN';

        setMessages([{ isSystem: true, content: `👋 ${t('msg_secure_connection')} ${data.stream.creator?.username || t('lbl_creator')}.` }, ...(data.stream.messages || [])].slice(-100));
        const res = await api.post('/livekit/token', { roomName: id, participantName: currentUser.username || t('lbl_user'), isCreator: isCreatorOrAdmin });
        setLiveKitToken(res.data.token);
      }
    } catch { router.push('/explore'); }
  };

  const handleStreak = () => {
    setStreak(prev => {
      if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
      streakTimeoutRef.current = setTimeout(() => setStreak(0), 8000);
      return prev + 1;
    });
  };

  const triggerGiftEffect = (gift: Gift) => {
    setGiftEffect(gift);
    if (gift.action) {
      try {
        const audio = new Audio(`/sounds/${gift.action}.wav`);
        audio.volume = 0.8;
        audio.play().catch(e => console.log("Auto-play bloqueado", e));
      } catch (err) {}
    }
    setTimeout(() => setGiftEffect(null), 4000);
  };

  const updateTopDonators = (msg: any) => {
    const donorId = msg.userId || msg.senderId; 
    if (!donorId) return;

    setTopDonators((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.userId === donorId);
      if (index >= 0) {
        updated[index].amount += msg.amount;
      } else {
        updated.push({ 
          userId: donorId, 
          username: msg.user?.username || 'Anónimo', 
          amount: msg.amount 
        });
      }
      return updated.sort((a, b) => b.amount - a.amount).slice(0, 3);
    });
  };

  const triggerHeart = () => {
    if (!heartsContainerRef.current) return;
    const el = document.createElement('div');
    const emojis = ['❤️', '💖', '🔥', '✨', '💎'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    el.innerHTML = randomEmoji;
    
    const randomLeft = Math.floor(Math.random() * 40) - 20; 
    const randomDuration = (Math.random() * 1.5 + 2).toFixed(2);
    const randomSize = Math.floor(Math.random() * 10) + 20;

    el.className = 'absolute bottom-0 text-red-500 drop-shadow-md pointer-events-none opacity-0';
    el.style.left = '50%';
    el.style.fontSize = `${randomSize}px`;
    el.style.animation = `floatUpAndFade ${randomDuration}s ease-in-out forwards`;
    el.style.setProperty('--tx', `${randomLeft}px`);

    heartsContainerRef.current.appendChild(el);
    setTimeout(() => el.remove(), parseFloat(randomDuration) * 1000); 
  };

  const onUpdateGoal = useCallback((usdAmount: number) => {
    setCurrentGoal(prev => prev + usdAmount);
  }, []);

  const socketRef = useLiveSocket({
    id: id as string, user, streamData, onLike: triggerHeart,
    onMessage: (msg: any) => {
      setMessages((prev) => [...prev.slice(-99), msg]); 
      if (msg.isDonation) {
        const giftData = GIFTS.find(g => g.amount === msg.amount) || { style: "text-green-400" };
        if (msg.giftImageUrl) {
          triggerGiftEffect({ ...giftData, image: msg.giftImageUrl } as Gift);
        } else {
          triggerGiftEffect(giftData as Gift);
        }
        
        updateTopDonators(msg);
        handleStreak();
      }
    },
    onViewerCount: setViewersCount,
    onStreamKilled: () => { alert(t('alert_stream_ended')); router.push('/explore'); },
    onPaywallActivated: (newPrice: number) => {
      const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';
      if (!isCreatorOrAdmin) {
        setStreamData((prev: any) => ({ ...prev, price: newPrice }));
        setHasAccess(false); 
      }
    },
    onUpdateGoal: onUpdateGoal
  });

  const handleLockRoomVIP = () => {
    const priceStr = prompt("¿Cuánto costará la entrada VIP en USD? (Ej: 5)", "5");
    const newPrice = Number(priceStr);
    
    if (newPrice && newPrice > 0) {
      if (window.confirm(`¿Seguro que quieres cerrar la sala y cobrar $${newPrice} a los que están gratis?`)) {
        socketRef.current?.emit('activatePaywall', { streamId: id, price: newPrice });
        alert("¡Sala Bloqueada!");
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!streamData?.createdAt) return;
      const isCreator = String(user?.id) === String(streamData.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';
      if (isCreator && !isLiveActive) return;
      const diff = Math.floor((Date.now() - new Date(streamData.createdAt).getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [streamData, isLiveActive, user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendHeart = () => {
    triggerHeart(); 
    socketRef.current?.emit('broadcastMessage', { streamId: id, isLike: true }); 
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const content = chatInput;
    setChatInput('');
    try {
      const res = await liveService.sendMessage(id as string, content, false, 0);
      setMessages((prev) => [...prev.slice(-99), res.chatMessage]);
      
      socketRef.current?.emit('broadcastMessage', {
        ...res.chatMessage,
        streamId: id,
        senderId: user?.id,
        amount: 0,
        isDonation: false,
        text: res.chatMessage.content
      });
    } catch (e) { console.error(e); }
  };

  // ✅ BLINDAJE DE COBRO + IMAGEN ENVIADA POR SOCKET
  const sendGift = async (gift: Gift) => {
    setShowGiftMenu(false);
    
    const fanBalance = parseFloat(user?.walletBalance || 0);

    if (fanBalance < gift.amount) {
      alert("No tienes suficiente saldo en tu Bóveda. ¡Recarga ahora!");
      router.push('/dashboard/wallet'); 
      return;
    }

    try {
      setUser((prev: any) => {
        const newUser = { ...prev, walletBalance: parseFloat(prev.walletBalance || 0) - gift.amount };
        localStorage.setItem('user', JSON.stringify(newUser));
        return newUser;
      });

      const giftMessage = {
        content: `${t('lbl_has_sent_a')} ${gift.name}`,
        isDonation: true,
        amount: gift.amount,
        user: { username: user?.username, role: user?.role },
        userId: user?.id,
        id: Date.now().toString()
      };

      setMessages((prev) => [...prev.slice(-99), giftMessage]);
      
      socketRef.current?.emit('broadcastMessage', {
        streamId: id,
        senderId: user?.id,
        amount: gift.amount,
        isDonation: true,
        text: giftMessage.content,
        user: giftMessage.user,
        giftImageUrl: gift.image // <-- Esto evita que el creador vea la imagen rota
      });

      triggerGiftEffect(gift);
      
      updateTopDonators({ 
        amount: gift.amount, 
        userId: user?.id,
        user: { username: user?.username } 
      });
      
      handleStreak();
      
    } catch (error) {
      alert(t('alert_error_gift'));
    }
  };

  const handleKickUser = async (targetUserId: string, targetUsername: string) => {
    if (targetUserId === user.id) return;
    if (!window.confirm(`🚨 ${t('confirm_kick')} @${targetUsername}?`)) return;
    try {
      socketRef.current?.emit('kickParticipant', { streamId: id, userId: targetUserId, username: targetUsername });
      alert(`🚫 ${t('alert_kicked')}`);
    } catch (error) { alert(t('alert_error_kick')); }
  };

  const handleEndStream = () => {
    if (window.confirm(`🚨 ${t('confirm_end_stream')}`)) {
      liveService.updateStatus(id as string, 'ENDED').then(() => {
        socketRef.current?.emit('streamEnded', { streamId: id });
        router.push('/dashboard');
      });
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/users/${streamData.creatorId}/follow`);
      setIsFollowing(true);
    } catch (error) {}
  };

  const handleBuyTicket = async () => {
    if (!streamData || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/live/buy-ticket', { streamId: id, amount: streamData.price });
      if (res.data.success) {
        setHasAccess(true); 
        alert("¡PAGO EXITOSO! Bienvenido a la zona VIP 🤫");
        
        setUser((prev: any) => {
          const newUser = { ...prev, walletBalance: parseFloat(prev.walletBalance || 0) - streamData.price };
          localStorage.setItem('user', JSON.stringify(newUser));
          return newUser;
        });

        loadStreamData(); 
      }
    } catch (error: any) { 
      alert(error.response?.data?.error || "Error al procesar el pago. Intenta de nuevo."); 
    } 
    finally { 
      setIsProcessing(false); 
    }
  };

  if (!streamData) return <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white font-mono animate-pulse">{t('lbl_connecting_gateway')}</div>;

  const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';
  const actualViewers = connectedUsers.length > 0 ? connectedUsers.length : viewersCount;

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden h-[100dvh] w-full">
      
      <style>{`
        @keyframes floatUpAndFade {
          0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translateY(-20px) translateX(var(--tx)) scale(1.2); }
          80% { opacity: 0.8; }
          100% { transform: translateY(-400px) translateX(calc(var(--tx) * 2)) scale(1); opacity: 0; }
        }
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-drawer { animation: slideUpDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-mask { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 100%); }
      `}</style>

      {/* 🎯 META (EN DÓLARES) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-64">
        <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 px-3 flex items-center gap-2 shadow-lg pointer-events-auto cursor-pointer" onClick={() => isCreatorOrAdmin && setTargetGoal(Number(prompt("Nueva meta:", String(targetGoal))) || targetGoal)}>
          <TrendingUp className="w-3 h-3 text-teal-400" />
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-500" style={{ width: `${Math.min((currentGoal/targetGoal)*100, 100)}%` }}></div>
          </div>
          <span className="text-[9px] font-black font-mono text-white">${currentGoal.toFixed(2)}/${targetGoal.toFixed(2)}</span>
        </div>
      </div>

      {/* 🎬 VIDEO LAYER */}
      <div className="absolute inset-0 z-0 bg-[#050505] [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full" onContextMenu={(e) => e.preventDefault()}>
        {hasAccess && liveKitToken ? (
          <LiveKitRoom video={isCreatorOrAdmin ? isLiveActive : false} audio={isCreatorOrAdmin ? isLiveActive : false} token={liveKitToken} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live.fansmio.com"} className="w-full h-full relative">
            <ParticipantsTracker onUpdate={setConnectedUsers} />
            <StreamStage />
            <RoomAudioRenderer />

            {/* 💎 UI INMERSIVA */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none pb-safe">
              
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none -z-10"></div>
              <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none -z-10"></div>
              
              {/* 🔝 TOP HUD */}
              <div className="pt-4 px-4 flex justify-between items-start pointer-events-auto">
                <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 shadow-lg cursor-pointer hover:bg-black/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-inner overflow-hidden border border-white/20 mr-2">
                    {streamData.creator?.profileImage ? <img src={streamData.creator.profileImage} alt="perfil" className="w-full h-full object-cover" /> : streamData.creator?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col mr-3">
                    <span className="text-sm font-bold leading-tight text-white">{streamData.creator?.username || t('lbl_creator')}</span>
                    <span className="text-[10px] text-gray-300 font-medium">{actualViewers} {t('lbl_viewing')}</span>
                  </div>
                  
                  {!isCreatorOrAdmin && (
                    <button 
                      onClick={handleFollow}
                      disabled={isFollowing}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${isFollowing ? 'bg-gray-600 text-gray-400 cursor-default' : 'bg-teal-500 text-white hover:scale-105'}`}
                    >
                      {isFollowing ? 'SIGUIENDO' : t('btn_follow')}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {isCreatorOrAdmin && (
                      <button onClick={handleLockRoomVIP} className="w-9 h-9 rounded-full bg-red-600/80 backdrop-blur-md flex items-center justify-center border border-red-500/50 text-white hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)]" title="Pasar a Privado">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setShowViewersModal(true)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors shadow-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={isCreatorOrAdmin ? handleEndStream : () => router.push('/explore')} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors shadow-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded-full text-gray-300 backdrop-blur-sm border border-white/5">{uptime}</span>
                </div>
              </div>

              {/* 🏆 TOP DONATORS (EN DÓLARES 💵) */}
              <div className="absolute right-4 top-28 flex flex-col items-end gap-2 pointer-events-auto">
                {topDonators.length > 0 && (
                  <div className="bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-green-500/20 shadow-lg min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 mb-1 border-b border-white/10 pb-1">
                      < Trophy className="w-3 h-3 text-green-400" /> <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">Top Fans</span>
                    </div>
                    {topDonators.map((u, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between gap-3 mt-1">
                        <span className="text-white font-bold truncate max-w-[50px]">{u.username}</span>
                        <span className="text-green-400 font-mono font-black flex items-center gap-0.5">${u.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {streak > 1 && (
                  <div className="bg-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-500/50 flex items-center gap-1.5 animate-pulse mt-2">
                    <Zap className="w-3 h-3 text-orange-400 fill-orange-500" />
                    <span className="text-orange-400 font-black text-xs">Combo x{streak}</span>
                  </div>
                )}
              </div>

              {/* 🎁 EFECTO ANIMADO DEL REGALO */}
              {giftEffect && <GiftEffectOverlay giftEffect={giftEffect} />}

              {/* 💬 ÁREA INFERIOR */}
              <div className="w-full px-4 pb-4 md:w-[500px] pointer-events-auto relative z-20">
                <div ref={heartsContainerRef} className="absolute bottom-16 right-4 w-16 h-64 pointer-events-none overflow-visible z-0" />

                <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-2 custom-mask pr-14 relative z-10">
                  {messages.map((msg: any, i: number) => {
                    if (msg.isSystem) return <div key={i} className="text-[11px] text-teal-400/90 font-bold px-3 py-1 bg-black/30 backdrop-blur-md rounded-xl w-fit border border-teal-500/20">{msg.content}</div>;
                    
                    const gift = msg.isDonation ? GIFTS.find(g => g.amount === msg.amount) : null;
                    const canModerate = isCreatorOrAdmin && msg.user?.id !== user?.id;

                    return (
                      <div key={i} className={`text-[13px] px-3 py-1.5 rounded-2xl w-fit max-w-[100%] group/msg flex flex-col leading-tight animate-fade-in ${msg.isDonation ? 'bg-gradient-to-r from-green-500/20 to-black/30 border border-green-500/50 backdrop-blur-md shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`}>
                        <div className="flex items-center gap-1.5">
                          {msg.isDonation && <DollarSign className="w-3 h-3 text-green-400" />}
                          <span 
                            onClick={() => canModerate && handleKickUser(msg.user?.id, msg.user?.username)}
                            className={`font-bold ${msg.user?.role === 'ADMIN' ? 'text-red-400' : 'text-gray-300'} ${canModerate ? 'cursor-pointer hover:text-red-500' : ''}`}
                          >
                            {msg.user?.username}:
                          </span>
                          {canModerate && (
                            <button onClick={() => handleKickUser(msg.user?.id, msg.user?.username)} className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase ml-1">KICK</button>
                          )}
                        </div>
                        <span className={`mt-0.5 ${gift ? gift.style : 'text-white font-medium'} drop-shadow-md`}>
                          {msg.content}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2 items-center mt-2 relative z-30">
                  <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center px-4 py-2 shadow-lg focus-within:border-teal-500/50 transition-colors">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t('ph_chat')} className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-300 font-medium" />
                    {chatInput.trim() && (
                      <button onClick={handleSendMessage} className="text-teal-400 hover:text-teal-300 transition-colors p-1"><Send className="w-4 h-4" /></button>
                    )}
                  </div>
                  
                  {!isCreatorOrAdmin && (
                    <button onClick={() => setShowGiftMenu(true)} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105 transition-transform shrink-0">
                      <Diamond className="w-5 h-5 text-black fill-black" />
                    </button>
                  )}
                  
                  {!isCreatorOrAdmin && (
                    <button onClick={handleSendHeart} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:scale-105 transition-transform active:scale-95 shrink-0">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </button>
                  )}

                  {isCreatorOrAdmin && isLiveActive && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center shadow-lg px-1 py-0.5">
                      <ControlBar 
                        variation="minimal" 
                        controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }} 
                        className="flex gap-1 [&_.lk-button]:!bg-transparent [&_.lk-button]:!text-white [&_.lk-button:hover]:!bg-white/20 [&_.lk-button]:!rounded-full [&_.lk-button]:!p-2 [&_.lk-button]:!m-0 [&_.lk-button]:!w-10 [&_.lk-button]:!h-10 [&_.lk-button]:!flex [&_.lk-button]:!items-center [&_.lk-button]:!justify-center" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </LiveKitRoom>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30"><Tv className="w-16 h-16 animate-pulse" /></div>
        )}
      </div>

      {/* 🛑 PAYWALL LAYER */}
      {!hasAccess && <PaywallLayer price={streamData?.price || 0} isProcessing={isProcessing} onBuy={handleBuyTicket} />}

      {/* 📺 PREPARATION LAYER (Solo Creador) */}
      {isCreatorOrAdmin && !isLiveActive && hasAccess && <PreparationLayer onStart={() => setIsLiveActive(true)} />}

      {/* 🎁 DRAWER DE REGALOS (AHORA EN DÓLARES 💵) */}
      {showGiftMenu && (
        <>
          <div className="absolute inset-0 bg-black/40 z-40 pointer-events-auto" onClick={() => setShowGiftMenu(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:w-[400px] bg-[#111]/95 backdrop-blur-2xl border-t border-x md:border-y border-white/10 rounded-t-3xl md:rounded-3xl p-6 pb-8 animate-drawer shadow-2xl z-50 pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-black text-lg flex items-center gap-2"><Diamond className="w-5 h-5 text-teal-400"/> {t('gift_title')}</h3>
              
              {/* SALDO EN DÓLARES 💵 */}
              <div className="text-xs bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full font-mono text-green-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-bold">{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {GIFTS.map((gift) => (
                <button key={gift.id} onClick={() => sendGift(gift)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/50 p-2 rounded-2xl transition-all flex flex-col items-center group shadow-sm">
                  {/* IMAGEN DEL REGALO */}
                  <img src={gift.image} alt={gift.name} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform mb-1 drop-shadow-lg" />
                  
                  <span className="text-[9px] text-gray-300 font-bold text-center leading-tight truncate w-full">{t(`gift_name_${gift.id}`) || gift.name}</span>
                  <span className="text-[10px] text-green-400 font-mono font-black mt-1 flex items-center gap-0.5">
                    ${gift.amount.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard/wallet')} className="w-full mt-6 bg-gradient-to-r from-green-500 to-teal-500 hover:scale-[1.02] active:scale-95 text-black font-black uppercase py-3 rounded-xl text-sm transition-all shadow-[0_5px_20px_rgba(34,197,94,0.3)]">
              Recargar Saldo
            </button>
          </div>
        </>
      )}

      {/* 👁️ MODAL ESPECTADORES */}
      {showViewersModal && <ViewersModal connectedUsers={connectedUsers} onClose={() => setShowViewersModal(false)} />}
    </div>
  );
}

// ✅ SUB-COMPONENTES TÁCTICOS (BLINDADOS CONTRA DESCONEXIÓN INFINITA)
function useLiveSocket({ id, user, streamData, onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal }: any) {
  const socketRef = useRef<Socket | null>(null);
  
  // 🔥 BLINDAJE ANTI-RECONEXIÓN: Guardamos las funciones en referencias para no reiniciar el socket.
  const callbacks = useRef({ onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal });

  // Actualizamos las referencias en cada render sin disparar el useEffect del Socket
  useEffect(() => {
    callbacks.current = { onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal };
  });
  
  useEffect(() => {
    if (!user?.id || !id || !streamData) return; 
    
    socketRef.current?.disconnect();
    const socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      const isCreator = String(user.id) === String(streamData?.creatorId);
      const isGhost = String(user.role).toUpperCase() === 'ADMIN' && !isCreator;
      socketInstance.emit('joinLiveStream', { streamId: id, userId: user.id, isGhost, isCreator });
    });

    socketInstance.on('newLiveMessage', (msg: any) => {
      if (msg.isLike) callbacks.current.onLike();
      else callbacks.current.onMessage(msg);
    });

    socketInstance.on('viewerCountUpdated', ({ count }: { count: number }) => {
      callbacks.current.onViewerCount(count);
    });
    
    socketInstance.on('streamKilled', () => {
      if (String(user.id) !== String(streamData?.creatorId)) callbacks.current.onStreamKilled();
    });

    socketInstance.on('paywallActivated', ({ price }: { price: number }) => {
      if (callbacks.current.onPaywallActivated) callbacks.current.onPaywallActivated(price);
    });

    socketInstance.on('updateLiveGoal', ({ amount }: { amount: number }) => {
      if (callbacks.current.onUpdateGoal) callbacks.current.onUpdateGoal(amount);
    });

    return () => { socketInstance.disconnect(); };
  }, [user?.id, id, streamData?.creatorId]); // 🚨 SÓLO SE RECONECTA SI CAMBIA EL ID DE USUARIO O DE SALA.

  return socketRef;
}

function PreparationLayer({ onStart }: { onStart: () => void }) {
  const t = useTranslations('LiveRoom'); 
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm px-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 border border-teal-500/30 relative">
          <div className="absolute inset-0 rounded-full border border-teal-500 animate-ping opacity-50"></div>
          <Tv className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{t('prep_title')}</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">{t('prep_desc')}</p>
        <button onClick={onStart} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-full shadow-[0_10px_30px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105"><Play className="w-5 h-5 fill-white" /> {t('btn_start_stream')}</button>
      </div>
    </div>
  );
}

function PaywallLayer({ price, isProcessing, onBuy }: { price: number, isProcessing: boolean, onBuy: () => void }) {
  const t = useTranslations('LiveRoom'); 
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15); 

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/explore');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 pointer-events-auto">
      <div className="text-center p-8 bg-[#0a0a0a] rounded-[2rem] border border-red-500/30 shadow-[0_0_80px_rgba(220,38,38,0.2)] max-w-sm w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
        
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        <h2 className="text-white font-black text-2xl tracking-tight uppercase">¡SALA PRIVADA!</h2>
        <p className="text-gray-400 text-xs mt-2 font-medium">El creador activó el modo VIP. Paga para quedarte o serás expulsado en:</p>

        <div className="my-6">
          <span className={`text-6xl font-black font-mono tracking-tighter ${timeLeft <= 5 ? 'text-red-500 animate-pulse scale-110 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        
        <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/5 nm-inset">
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{t('lbl_ticket_cost')}</div>
          <div className="text-4xl font-black text-teal-400 font-mono tracking-tight">${price.toFixed(2)} <span className="text-sm text-gray-500 font-sans">USD</span></div>
        </div>
        
        <button onClick={onBuy} disabled={isProcessing} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-black py-4 rounded-xl text-sm hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">
          {isProcessing ? t('btn_processing') : <><Star className="w-4 h-4 fill-white"/> DESBLOQUEAR AHORA</>}
        </button>
      </div>
    </div>
  );
}

function GiftEffectOverlay({ giftEffect }: { giftEffect: Gift }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="text-center animate-bounce flex flex-col items-center">
        <img src={giftEffect.image} alt={giftEffect.name} className="w-48 h-48 object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]" />
        <div className={`text-2xl font-black mt-4 uppercase tracking-widest px-6 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 ${giftEffect.style}`}>¡{giftEffect.name}!</div>
      </div>
    </div>
  );
}

function ViewersModal({ connectedUsers, onClose }: { connectedUsers: any[], onClose: () => void }) {
  const t = useTranslations('LiveRoom'); 
  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl animate-drawer sm:animate-fade-in pb-safe">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-white font-black text-base flex items-center gap-2"><Eye className="w-4 h-4 text-teal-400" /> {t('modal_viewers_title')} ({connectedUsers.length})</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-red-500 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {connectedUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-10 font-medium text-sm">{t('modal_viewers_empty')}</div>
          ) : (
            connectedUsers.map((p, i) => {
              const displayName = p.name || p.identity || t('lbl_user');
              return (
                <div key={p.identity || i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg border border-white/10">{displayName.charAt(0).toUpperCase()}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{displayName}</span>
                    <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> {t('lbl_connected')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StreamStage() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const mainTrack = tracks.slice(0, 1);
  
  return (
    <div className="w-full h-full flex flex-col relative bg-transparent">
      <div className="absolute inset-0 z-0">
        <GridLayout tracks={mainTrack} style={{ width: '100%', height: '100%' }}>
          <ParticipantTile />
        </GridLayout>
      </div>
    </div>
  );
}

function ParticipantsTracker({ onUpdate }: { onUpdate: (participants: any[]) => void }) {
  const participants = useParticipants();
  useEffect(() => { onUpdate(participants); }, [participants, onUpdate]);
  return null;
}