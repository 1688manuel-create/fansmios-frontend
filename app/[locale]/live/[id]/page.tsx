"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../../lib/liveService';
import { paymentService } from '../../../../lib/paymentService';
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
import { Eye, X, Lock, Tv, Star, Diamond, Trophy, Zap, Send, Power, Play, UserPlus, Heart } from 'lucide-react';

const SOCKET_URL = 'https://api.fansmio.com';

// 🏆 ECONOMÍA DE LUJO FANSMIO
export interface Gift { id: number; name: string; amount: number; emoji: string; style: string; }

export const GIFTS: Gift[] = [
  { id: 1, name: "Rosa", amount: 1, emoji: "🌹", style: "text-rose-400 font-bold" },
  { id: 2, name: "Brindis", amount: 2, emoji: "🥂", style: "text-yellow-200 font-bold" },
  { id: 3, name: "Beso", amount: 5, emoji: "💋", style: "text-pink-500 font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" },
  { id: 4, name: "Carta", amount: 10, emoji: "💌", style: "text-fuchsia-400 font-bold" },
  { id: 5, name: "Corona", amount: 15, emoji: "👑", style: "text-yellow-400 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" },
  { id: 6, name: "Llave", amount: 20, emoji: "🗝️", style: "text-amber-200 font-black" },
  { id: 7, name: "Diamante", amount: 30, emoji: "💎", style: "text-cyan-300 font-black drop-shadow-[0_0_15px_rgba(103,232,249,0.8)]" },
  { id: 8, name: "Deportivo", amount: 50, emoji: "🏎️", style: "text-green-400 font-black italic" },
  { id: 9, name: "Corazón VIP", amount: 100, emoji: "❤️‍🔥", style: "text-red-500 font-extrabold drop-shadow-[0_0_25px_rgba(239,68,68,1)] uppercase" },
  { id: 10, name: "Universo", amount: 200, emoji: "🌌", style: "text-purple-400 font-black drop-shadow-[0_0_35px_rgba(192,132,252,1)] uppercase" },
];

export interface Donator { userId: string; username: string; amount: number; }

// ============================================================================
// 👑 ORQUESTADOR TIKTOK-LEVEL
// ============================================================================
export default function LiveRoom() {
  const { id } = useParams();
  const router = useRouter();

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem('user') : null;
      if (storedUser && storedUser !== "undefined") setUser(JSON.parse(storedUser));
      else router.push('/auth');
    } catch { router.push('/auth'); }
    loadStreamData();
  }, [id]);

  const loadStreamData = async () => {
    try {
      const data = await liveService.getStream(id as string);
      setStreamData(data.stream);
      setHasAccess(data.hasAccess);

      if (data.hasAccess) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCreatorOrAdmin = String(currentUser.id) === String(data.stream.creatorId) || currentUser.role === 'ADMIN';

        setMessages([{ isSystem: true, content: `👋 Conexión segura a la sala de ${data.stream.creator?.username || 'Creador'}.` }, ...(data.stream.messages || [])].slice(-100));
        const res = await api.post('/livekit/token', { roomName: id, participantName: currentUser.username || 'Usuario', isCreator: isCreatorOrAdmin });
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
    setTimeout(() => setGiftEffect(null), 4000);
  };

  const updateTopDonators = (msg: any) => {
    setTopDonators((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.userId === msg.user.id);
      if (index >= 0) updated[index].amount += msg.amount;
      else updated.push({ userId: msg.user.id, username: msg.user.username, amount: msg.amount });
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

  const socketRef = useLiveSocket({
    id: id as string, user, streamData, hasAccess, onLike: triggerHeart,
    onMessage: (msg: any) => {
      setMessages((prev) => [...prev.slice(-99), msg]); 
      if (msg.isDonation) {
        const giftData = GIFTS.find(g => g.amount === msg.amount);
        if (giftData) triggerGiftEffect(giftData);
        updateTopDonators(msg);
        handleStreak();
      }
    },
    onViewerCount: setViewersCount,
    onStreamKilled: () => { alert("Transmisión finalizada."); router.push('/explore'); }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!streamData?.createdAt) return;
      const isCreator = String(user?.id) === String(streamData.creatorId) || user?.role === 'ADMIN';
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
      socketRef.current?.emit('broadcastMessage', res.chatMessage);
    } catch (e) { console.error(e); }
  };

  const sendGift = async (gift: Gift) => {
    setShowGiftMenu(false);
    try {
      const res = await liveService.sendMessage(id as string, `ha enviado un ${gift.name}`, true, gift.amount);
      setMessages((prev) => [...prev.slice(-99), res.chatMessage]);
      socketRef.current?.emit('broadcastMessage', res.chatMessage);
      triggerGiftEffect(gift);
      updateTopDonators(res.chatMessage);
      handleStreak();
    } catch (error) {
      alert("Error enviando regalo. Verifica saldo.");
    }
  };

  const handleKickUser = async (targetUserId: string, targetUsername: string) => {
    if (targetUserId === user.id) return;
    if (!window.confirm(`🚨 ¿EXPULSAR a @${targetUsername}?`)) return;
    try {
      socketRef.current?.emit('kickParticipant', { streamId: id, userId: targetUserId, username: targetUsername });
      alert(`🚫 Usuario expulsado.`);
    } catch (error) { alert("Error al expulsar."); }
  };

  const handleEndStream = () => {
    if (window.confirm("🚨 ¿TERMINAR la transmisión?")) {
      liveService.updateStatus(id as string, 'ENDED').then(() => {
        socketRef.current?.emit('streamEnded', { streamId: id });
        router.push('/dashboard');
      });
    }
  };

  const handleBuyTicket = async () => {
    if (!streamData || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await paymentService.createPaymentIntent({ amount: streamData.price, type: 'LIVE_TICKET', creatorId: streamData.creatorId, postId: id as string, description: `Ticket VIP: ${streamData.title}` });
      if (res.success) { setHasAccess(true); loadStreamData(); }
    } catch { alert('Pago fallido'); } 
    finally { setIsProcessing(false); }
  };

  if (!streamData) return <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white font-mono animate-pulse">Conectando con Covra Pay...</div>;

  const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || user?.role === 'ADMIN';
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

      {/* 🎬 VIDEO LAYER Y UI INMERSIVA */}
      <div className="absolute inset-0 z-0 bg-[#050505] [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full" onContextMenu={(e) => e.preventDefault()}>
        {hasAccess && liveKitToken ? (
          <LiveKitRoom video={isCreatorOrAdmin ? isLiveActive : false} audio={isCreatorOrAdmin ? isLiveActive : false} token={liveKitToken} serverUrl="wss://live.fansmio.com" className="w-full h-full relative">
            <ParticipantsTracker onUpdate={setConnectedUsers} />
            <StreamStage />
            <RoomAudioRenderer />

            {/* 💎 UI INMERSIVA (DENTRO DEL ROOM) */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none pb-safe">
              
              {/* DEGRADADOS (Fondo oscuro arriba y abajo para que se lean las letras) */}
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none -z-10"></div>
              <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none -z-10"></div>
              
              {/* 🔝 TOP HUD (Píldora) */}
              <div className="pt-4 px-4 flex justify-between items-start pointer-events-auto">
                <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 shadow-lg cursor-pointer hover:bg-black/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-inner overflow-hidden border border-white/20 mr-2">
                    {streamData.creator?.profileImage ? <img src={streamData.creator.profileImage} className="w-full h-full object-cover" /> : streamData.creator?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col mr-3">
                    <span className="text-sm font-bold leading-tight text-white">{streamData.creator?.username || 'Creador'}</span>
                    <span className="text-[10px] text-gray-300 font-medium">{actualViewers} espectando</span>
                  </div>
                  {!isCreatorOrAdmin && (
                    <button className="bg-teal-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider hover:scale-105 transition-transform">Seguir</button>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
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

              {/* 🏆 TOP DONATORS (Derecha Medio) */}
              <div className="absolute right-4 top-28 flex flex-col items-end gap-2 pointer-events-auto">
                {topDonators.length > 0 && (
                  <div className="bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-yellow-500/20 shadow-lg min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 mb-1 border-b border-white/10 pb-1">
                      <Trophy className="w-3 h-3 text-yellow-400" /> <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Top</span>
                    </div>
                    {topDonators.map((u, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between gap-3 mt-1">
                        <span className="text-white font-bold truncate max-w-[50px]">{u.username}</span>
                        <span className="text-teal-400 font-mono">${u.amount}</span>
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

              {/* 🌌 EFECTO DE REGALO GIGANTE */}
              {giftEffect && <GiftEffectOverlay giftEffect={giftEffect} />}

              {/* 💬 ÁREA INFERIOR (Chat y Controles) */}
              <div className="w-full px-4 pb-4 md:w-[500px] pointer-events-auto relative z-20">
                
                <div ref={heartsContainerRef} className="absolute bottom-16 right-4 w-16 h-64 pointer-events-none overflow-visible z-0" />

                {/* Chat Flotante */}
                <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-2 custom-mask pr-14 relative z-10">
                  {messages.map((msg: any, i: number) => {
                    if (msg.isSystem) return <div key={i} className="text-[11px] text-teal-400/90 font-bold px-3 py-1 bg-black/30 backdrop-blur-md rounded-xl w-fit border border-teal-500/20">{msg.content}</div>;
                    
                    const gift = msg.isDonation ? GIFTS.find(g => g.amount === msg.amount) : null;
                    const canModerate = isCreatorOrAdmin && msg.user?.id !== user?.id;

                    return (
                      <div key={i} className={`text-[13px] px-3 py-1.5 rounded-2xl w-fit max-w-[100%] group/msg flex flex-col leading-tight animate-fade-in ${msg.isDonation ? 'bg-gradient-to-r from-teal-500/30 to-black/30 border border-teal-500/50 backdrop-blur-md shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`}>
                        <div className="flex items-center gap-1.5">
                          {msg.isDonation && <Diamond className="w-3 h-3 text-teal-300 fill-teal-300" />}
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

                {/* 🔥 Input Bar Estilo TikTok y CONTROLES CREADOR */}
                <div className="flex gap-2 items-center mt-2 relative z-30">
                  <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center px-4 py-2 shadow-lg focus-within:border-teal-500/50 transition-colors">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Añadir comentario..." className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-300 font-medium" />
                    {chatInput.trim() && (
                      <button onClick={handleSendMessage} className="text-teal-400 hover:text-teal-300 transition-colors p-1"><Send className="w-4 h-4" /></button>
                    )}
                  </div>
                  
                  {/* SI ES FAN: Ve Diamante y Corazón */}
                  {!isCreatorOrAdmin && (
                    <button onClick={() => setShowGiftMenu(true)} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:scale-105 transition-transform shrink-0">
                      <Diamond className="w-5 h-5 text-white fill-white" />
                    </button>
                  )}
                  
                  {!isCreatorOrAdmin && (
                    <button onClick={handleSendHeart} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:scale-105 transition-transform active:scale-95 shrink-0">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </button>
                  )}

                  {/* 🔥 SI ES CREADOR: Ve su Micrófono y Cámara alineados aquí */}
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
      {!hasAccess && <PaywallLayer price={streamData.price} isProcessing={isProcessing} onBuy={handleBuyTicket} />}

      {/* 📺 PREPARATION LAYER (Solo Creador) */}
      {isCreatorOrAdmin && !isLiveActive && hasAccess && <PreparationLayer onStart={() => setIsLiveActive(true)} />}

      {/* 🎁 DRAWER DE REGALOS (Desliza desde abajo) */}
      {showGiftMenu && (
        <>
          <div className="absolute inset-0 bg-black/40 z-40 pointer-events-auto" onClick={() => setShowGiftMenu(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:w-[400px] bg-[#111]/95 backdrop-blur-2xl border-t border-x md:border-y border-white/10 rounded-t-3xl md:rounded-3xl p-6 pb-8 animate-drawer shadow-2xl z-50 pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-black text-lg flex items-center gap-2"><Diamond className="w-5 h-5 text-teal-400"/> Enviar Regalo</h3>
              <div className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-mono text-teal-400">Saldo: ${(user?.walletBalance || 0).toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {GIFTS.map((gift) => (
                <button key={gift.id} onClick={() => sendGift(gift)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-teal-500 p-2 rounded-2xl transition-all flex flex-col items-center group shadow-sm">
                  <span className="text-3xl group-hover:scale-110 transition-transform mb-1">{gift.emoji}</span>
                  <span className="text-[9px] text-gray-300 font-bold text-center leading-tight truncate w-full">{gift.name}</span>
                  <span className="text-[10px] text-teal-400 font-mono font-black mt-1">${gift.amount}</span>
                </button>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard/wallet')} className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-sm transition-colors border border-white/10">Recargar Saldo</button>
          </div>
        </>
      )}

      {/* 👁️ MODAL ESPECTADORES */}
      {showViewersModal && <ViewersModal connectedUsers={connectedUsers} onClose={() => setShowViewersModal(false)} />}
    </div>
  );
}

// ============================================================================
// 🧩 SUB-COMPONENTES TÁCTICOS
// ============================================================================

function useLiveSocket({ id, user, streamData, hasAccess, onLike, onMessage, onViewerCount, onStreamKilled }: any) {
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id || !id || !hasAccess) return;
    socketRef.current?.disconnect();
    const socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      const isCreator = String(user.id) === String(streamData?.creatorId);
      const isGhost = user.role === 'ADMIN' && !isCreator;
      socketInstance.emit('joinLiveStream', { streamId: id, userId: user.id, isGhost });
    });

    socketInstance.on('newLiveMessage', (msg: any) => {
      if (msg.isLike) onLike();
      else onMessage(msg);
    });

    socketInstance.on('viewerCountUpdated', ({ count }: { count: number }) => onViewerCount(count));
    
    socketInstance.on('streamKilled', () => {
      if (String(user.id) !== String(streamData?.creatorId)) onStreamKilled();
    });

    return () => { socketInstance.disconnect(); };
  }, [user?.id, id, hasAccess]);

  return socketRef;
}

function PreparationLayer({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm px-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 border border-teal-500/30 relative">
          <div className="absolute inset-0 rounded-full border border-teal-500 animate-ping opacity-50"></div>
          <Tv className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Estudio en Vivo</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">Tu cámara y micrófono están listos. Inicia cuando estés preparado para brillar.</p>
        <button onClick={onStart} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-full shadow-[0_10px_30px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105"><Play className="w-5 h-5 fill-white" /> Iniciar Transmisión</button>
      </div>
    </div>
  );
}

function PaywallLayer({ price, isProcessing, onBuy }: { price: number, isProcessing: boolean, onBuy: () => void }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 pointer-events-auto">
      <div className="text-center p-8 bg-[#0a0a0a] rounded-[2rem] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,1)] max-w-sm w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>
        <Lock className="w-14 h-14 text-teal-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(20,184,166,0.4)]" />
        <h2 className="text-white font-black text-2xl mb-2 tracking-tight">Evento Exclusivo</h2>
        <p className="text-gray-400 text-sm mb-8 font-medium">Adquiere tu ticket VIP para entrar a esta transmisión en vivo.</p>
        
        <div className="bg-white/5 p-5 rounded-2xl mb-8 border border-white/5 nm-inset">
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Costo de Entrada</div>
          <div className="text-4xl font-black text-teal-400 font-mono tracking-tight">${price} <span className="text-sm text-gray-500 font-sans">USD</span></div>
        </div>
        
        <button onClick={onBuy} disabled={isProcessing} className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl">
          {isProcessing ? 'Procesando pago seguro...' : <><Star className="w-4 h-4 fill-black"/> Comprar Ticket Covra</>}
        </button>
      </div>
    </div>
  );
}

function GiftEffectOverlay({ giftEffect }: { giftEffect: Gift }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="text-center animate-bounce flex flex-col items-center">
        <div className="text-[120px] drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">{giftEffect.emoji}</div>
        <div className={`text-2xl font-black mt-4 uppercase tracking-widest px-6 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 ${giftEffect.style}`}>¡{giftEffect.name}!</div>
      </div>
    </div>
  );
}

function ViewersModal({ connectedUsers, onClose }: { connectedUsers: any[], onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[200000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl animate-drawer sm:animate-fade-in pb-safe">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-white font-black text-base flex items-center gap-2"><Eye className="w-4 h-4 text-teal-400" /> Espectadores ({connectedUsers.length})</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-red-500 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {connectedUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-10 font-medium text-sm">Nadie ha entrado a la sala aún...</div>
          ) : (
            connectedUsers.map((p, i) => {
              const displayName = p.name || p.identity || 'Usuario';
              return (
                <div key={p.identity || i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg border border-white/10">{displayName.charAt(0).toUpperCase()}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{displayName}</span>
                    <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Conectado en sala</span>
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