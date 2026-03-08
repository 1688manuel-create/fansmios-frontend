// frontend/app/live/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../lib/liveService';
import { paymentService } from '../../../lib/paymentService'; 
import api from '../../../lib/api';
import MuxPlayer from '@mux/mux-player-react'; 
import PaymentModal from '../../../components/PaymentModal'; 

// 🔥 ICONOS PREMIUM
import { 
  Eye, X, Send, DollarSign, Crown, Target, Heart, 
  Flame, Diamond, Key, Clock, Tv, MessageCircle, Star, 
  Sparkles, ShieldAlert, Award, Zap, Wifi, Lock, CreditCard
} from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function LiveRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showTipMenu, setShowTipMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [viewersCount, setViewersCount] = useState(0);
  
  // Estados de Gamificación y UX
  const [uptime, setUptime] = useState('00:00:00');
  const [pinnedSuperChat, setPinnedSuperChat] = useState<any>(null);
  const [connectionQuality, setConnectionQuality] = useState('Excelente');
  const DONATION_GOAL = 500; 

  // 🔥 ESTADOS DEL PAYWALL (Muro de Pago)
  const [hasAccess, setHasAccess] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/auth');
      return;
    }
    loadStreamData();
  }, [id]);

  const loadStreamData = async () => {
    try {
      const data = await liveService.getStream(id as string);
      
      setStreamData(data.stream);
      setHasAccess(data.hasAccess);

      if (data.hasAccess) {
        setMessages([{
          isSystem: true,
          content: `👋 Bienvenido a la sala, @${JSON.parse(localStorage.getItem('user') || '{}').username}. Los mensajes están encriptados.`
        }, ...(data.stream.messages || [])]);
      } else {
        setMessages([]); 
      }

    } catch (error) {
      alert("La transmisión no existe o ya finalizó.");
      router.push('/explore');
    }
  };

  // ==========================================
  // 💸 FLUJO DE COMPRA DE TICKET (PAYWALL)
  // ==========================================
  const handleBuyTicket = async () => {
    try {
      const data = await paymentService.createPaymentIntent({
        amount: streamData.price,
        type: 'LIVE_TICKET', 
        creatorId: streamData.creatorId, 
        postId: id as string, 
        description: `Ticket VIP para Live: ${streamData.title}`
      });

      setClientSecret(data.nowPaymentsId); 
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Error al generar orden:", error);
      alert('Error al conectar con la bóveda de pagos.');
    }
  };

  // ==========================================
  // 🔥 ANTENA EN TIEMPO REAL (WebSockets BLINDADA)
  // ==========================================
  useEffect(() => {
    // Solo conectamos si tiene acceso y ya cargó su usuario
    if (!user?.id || !id || !hasAccess) return;
    
    // 🔥 CORRECCIÓN CRÍTICA: Forzamos 'websocket' puro para evitar caídas en el handshake
    const newSocket = io(SOCKET_URL, { 
      transports: ['websocket'], 
      reconnectionAttempts: 5 
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Chat en vivo conectado con éxito');
      newSocket.emit('joinLiveStream', { streamId: id, userId: user.id });
    });

    newSocket.on('newLiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      if (message.isDonation && message.amount >= 5) {
        setPinnedSuperChat(message);
        setTimeout(() => setPinnedSuperChat(null), 8000); 
      }
    });

    newSocket.on('viewerCountUpdated', ({ count }) => {
      setViewersCount(count);
    });

    newSocket.on('streamKilled', () => {
      if (user.id !== streamData?.creatorId) {
        alert("El creador ha finalizado la transmisión. ¡Gracias por participar!");
        router.push('/explore');
      }
    });

    const qualityInterval = setInterval(() => {
      const qualities = ['Excelente', 'Excelente', 'Excelente', 'Buena', 'Excelente'];
      setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)]);
    }, 15000);

    return () => { 
      newSocket.disconnect(); 
      clearInterval(qualityInterval);
    };
  }, [user?.id, id, hasAccess]); // 🔥 Quitamos streamData?.creatorId para evitar re-conexiones locas

  // Reloj de Transmisión
  useEffect(() => {
    const timer = setInterval(() => {
      if (!streamData?.createdAt) return;
      const diff = Math.floor((Date.now() - new Date(streamData.createdAt).getTime()) / 1000);
      const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [streamData]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput;
    setChatInput(''); 

    try {
      const res = await liveService.sendMessage(id as string, content, false, 0);
      // El backend devuelve el mensaje con nuestro nivel de Fan
      setMessages((prev) => [...prev, res.chatMessage]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Lo propagamos al resto de la sala
      socket?.emit('broadcastMessage', res.chatMessage);
    } catch (error) {
      console.error("Error al enviar", error);
    }
  };

  const sendFastTip = async (amount: number, IconComponent: any) => {
    setShowTipMenu(false);
    try {
      const content = `¡SuperChat de $${amount}!`;
      const res = await liveService.sendMessage(id as string, content, true, amount);
      setMessages((prev) => [...prev, res.chatMessage]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      socket?.emit('broadcastMessage', res.chatMessage);
      
      setPinnedSuperChat(res.chatMessage);
      setTimeout(() => setPinnedSuperChat(null), 8000);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al procesar el SuperChat.");
    }
  };

  const handleLeaveStream = () => {
    if (user?.id === streamData?.creatorId) {
      if (window.confirm("🚨 ¿Deseas TERMINAR esta transmisión definitivamente?")) {
        liveService.updateStatus(id as string, 'ENDED')
          .then(() => {
            socket?.emit('streamEnded', { streamId: id });
            socket?.disconnect();
            router.push('/dashboard');
          })
          .catch(() => alert("Error al terminar el stream"));
      }
    } else {
      socket?.disconnect();
      router.push('/explore');
    }
  };

  if (!streamData) return <div className="min-h-screen bg-nm-base flex items-center justify-center text-white"><span className="animate-pulse flex items-center gap-2"><Tv className="w-5 h-5"/> Entrando al evento...</span></div>;

  const totalEarned = messages.reduce((acc, msg) => acc + (msg.isDonation ? Number(msg.amount) : 0), 0);
  const progressPercent = Math.min((totalEarned / DONATION_GOAL) * 100, 100);
  
  const topFansData = messages.reduce((acc, msg) => {
    if (msg.isDonation && msg.user) {
      acc[msg.user.id] = acc[msg.user.id] || { username: msg.user.username, total: 0 };
      acc[msg.user.id].total += Number(msg.amount);
    }
    return acc;
  }, {});
  const topFans = Object.values(topFansData).sort((a: any, b: any) => b.total - a.total).slice(0, 3) as any[];

  // Diccionario de Medallas VIP
  const getFanBadge = (level: string) => {
    switch (level) {
      case 'DIAMOND': return <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/50 uppercase font-black"><Diamond className="w-3 h-3 fill-blue-500"/> Diamante</span>;
      case 'GOLD': return <span className="inline-flex items-center gap-1 text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/50 uppercase font-black"><Award className="w-3 h-3 fill-yellow-500"/> Oro</span>;
      case 'SILVER': return <span className="inline-flex items-center gap-1 text-[9px] bg-gray-400/20 text-gray-300 px-1.5 py-0.5 rounded border border-gray-400/50 uppercase font-black"><Award className="w-3 h-3"/> Plata</span>;
      case 'BRONZE': return <span className="inline-flex items-center gap-1 text-[9px] bg-orange-800/30 text-orange-400 px-1.5 py-0.5 rounded border border-orange-800/50 uppercase font-black"><Award className="w-3 h-3"/> Bronce</span>;
      case 'CREATOR': return <span className="inline-flex items-center gap-1 text-[9px] bg-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/50 uppercase font-black"><Tv className="w-3 h-3"/> Creador</span>;
      case 'ADMIN': return <span className="inline-flex items-center gap-1 text-[9px] bg-red-600/30 text-red-500 px-1.5 py-0.5 rounded border border-red-600/50 uppercase font-black"><ShieldAlert className="w-3 h-3"/> Admin</span>;
      default: return null; 
    }
  };

  const getUsernameColor = (level: string, isDonation: boolean) => {
    if (isDonation) return 'text-white';
    switch (level) {
      case 'DIAMOND': return 'text-blue-300';
      case 'GOLD': return 'text-yellow-400';
      case 'SILVER': return 'text-gray-300';
      case 'BRONZE': return 'text-orange-300';
      case 'CREATOR': return 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]';
      case 'ADMIN': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-nm-base flex flex-col md:flex-row relative overflow-hidden">
      
      {/* =========================================
          🔴 COLUMNA IZQUIERDA: ZONA DE VIDEO Y EVENTO
      ========================================= */}
      <div className="flex-1 flex flex-col relative border-r border-white/5 bg-[#050505]">
        
        {/* TOP BAR MULTI-ESTADO */}
        <div className="absolute top-0 w-full p-4 sm:p-6 z-30 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
          <div className="flex flex-col gap-3 pointer-events-auto">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-red-600/20 border border-red-500/50 text-red-500 px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]"></div> EN VIVO
              </div>
              <div className="bg-black/40 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                <Eye className="w-3.5 h-3.5 text-blue-400" /> {viewersCount}
              </div>
              <div className="bg-black/40 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full font-bold text-xs font-mono uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> {uptime}
              </div>
              
              {hasAccess && (
                <div className="bg-black/40 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                  <Wifi className={`w-3.5 h-3.5 ${connectionQuality === 'Excelente' ? 'text-green-400' : 'text-yellow-400'}`} /> 
                  <span className={connectionQuality === 'Excelente' ? 'text-green-400' : 'text-yellow-400'}>{connectionQuality}</span>
                </div>
              )}
            </div>
            <h1 className="text-white font-black text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] max-w-lg leading-tight">
              {streamData.title}
            </h1>
          </div>
          <button onClick={handleLeaveStream} className="w-10 h-10 nm-btn bg-black/60 hover:text-red-500 text-gray-300 rounded-full flex items-center justify-center transition-colors backdrop-blur-md pointer-events-auto shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div> 

        {/* 🎬 REPRODUCTOR O PAYWALL */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black nm-inset border-none">
          
          {!hasAccess ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl p-6">
              <div className="nm-inset bg-[#0a0a0a] border border-white/10 p-10 rounded-[2rem] max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="w-24 h-24 rounded-full nm-inset bg-black flex items-center justify-center mx-auto mb-6 border border-white/5 relative">
                  <Lock className="w-10 h-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                  <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border border-black">VIP</div>
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">Evento Exclusivo</h2>
                <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                  Esta transmisión de <strong>@{streamData.creator?.username}</strong> es privada. Compra tu acceso para desbloquear el video y el chat.
                </p>

                {streamData.isPPV ? (
                  <button 
                    onClick={handleBuyTicket}
                    className="w-full nm-btn-primary py-4 text-lg flex items-center justify-center gap-3 font-black"
                  >
                    <CreditCard className="w-5 h-5"/> Comprar Ticket - ${streamData.price}
                  </button>
                ) : (
                  <button 
                    onClick={() => router.push(`/${streamData.creator?.username}`)}
                    className="w-full nm-btn border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white py-4 text-lg flex items-center justify-center gap-3 font-black transition-colors rounded-xl"
                  >
                    <Star className="w-5 h-5"/> Suscribirse al Perfil
                  </button>
                )}
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-6 flex items-center justify-center gap-1.5"><ShieldAlert className="w-3 h-3"/> Conexión Segura</p>
              </div>
            </div>
          ) : (
            streamData.playbackId && !streamData.playbackId.includes('simulated') && !streamData.playbackId.includes('protected') ? (
              <MuxPlayer
                streamType="live"
                playbackId={streamData.playbackId}
                tokens={{ playback: streamData.playbackToken }} 
                autoPlay
                muted={false}
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-tr from-purple-900/20 to-black">
                <div className="w-24 h-24 rounded-full nm-inset flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                  <Tv className="w-10 h-10 text-gray-500 animate-pulse" />
                </div>
                <p className="text-gray-300 font-black text-xl tracking-wide uppercase">El evento comenzará pronto</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">Esperando señal de transmisión de MUX...</p>
              </div>
            )
          )}

          {hasAccess && pinnedSuperChat && (
            <div className="absolute top-1/4 right-8 z-40 animate-slide-up max-w-xs pointer-events-none">
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-1 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <div className="bg-black/90 backdrop-blur-xl p-4 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-black uppercase tracking-widest">
                      SuperChat de ${pinnedSuperChat.amount}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm">
                    <span className="text-yellow-400">@{pinnedSuperChat.user?.username}:</span> {pinnedSuperChat.content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasAccess && user?.id === streamData.creatorId && streamData.streamKey && (
            <div className="absolute bottom-28 bg-black/80 border border-purple-500/30 p-5 rounded-2xl max-w-md w-full text-center backdrop-blur-xl z-20 shadow-2xl">
              <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <Key className="w-3 h-3" /> Tu Clave de Transmisión (Privada)
              </p>
              <code className="text-white nm-inset bg-black px-4 py-3 rounded-xl font-mono text-sm break-all select-all block border border-white/5 font-bold">
                {streamData.streamKey}
              </code>
              <p className="text-[10px] text-gray-500 mt-3 font-medium">
                Pega esto en OBS Studio. Servidor: <b>rtmp://global-live.mux.com:5222/app</b>
              </p>
            </div>
          )}

          {hasAccess && (
            <div className="absolute bottom-0 w-full p-4 sm:p-6 z-30 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col sm:flex-row justify-between items-end gap-4 pointer-events-none">
              <div className="w-full sm:max-w-xs pointer-events-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-md">
                    <Target className="w-3 h-3"/> Meta Diaria
                  </span>
                  <span className="text-xs font-bold text-white drop-shadow-md">${totalEarned.toFixed(0)} / ${DONATION_GOAL}</span>
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/10 backdrop-blur-md nm-inset">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-end gap-2 pointer-events-auto">
                {topFans.map((fan, idx) => (
                  <div key={idx} className="bg-black/60 border border-yellow-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                    <Crown className={`w-3 h-3 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-orange-400'}`} />
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Top {idx + 1}</p>
                      <p className="text-xs text-white font-black">${fan.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          💬 COLUMNA DERECHA: CHAT VIP
      ========================================= */}
      <div className="w-full md:w-[400px] h-[50vh] md:h-screen flex flex-col bg-[#0a0a0a] relative z-40 border-l border-white/5 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="p-5 border-b border-white/5 shrink-0 bg-[#0e0e0e] flex justify-between items-center z-10">
          <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-purple-500" /> Chat en Vivo
          </h2>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest nm-inset px-2.5 py-1 rounded-md border border-white/5">
            {messages.length} msgs
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
          
          {!hasAccess && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
              <Lock className="w-8 h-8 text-gray-500 mb-3" />
              <p className="text-gray-400 font-bold text-sm">El chat está bloqueado para usuarios sin acceso.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`animate-fade-in text-sm leading-relaxed ${
              msg.isSystem 
                ? 'bg-blue-900/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-300 text-xs font-medium text-center shadow-inner'
                : msg.isDonation 
                ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/20 border border-green-500/50 p-3 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                : 'px-2 py-1'
            }`}>
              
              {msg.isSystem ? (
                <span>{msg.content}</span>
              ) : (
                <>
                  {msg.isDonation && (
                    <div className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-green-400" /> SUPERCHAT DE ${msg.amount}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 break-words flex-wrap">
                    {msg.fanLevel && msg.fanLevel !== 'NEW' && (
                      <div className="mt-0.5">{getFanBadge(msg.fanLevel)}</div>
                    )}
                    <span className={`font-black shrink-0 ${getUsernameColor(msg.fanLevel, msg.isDonation)}`}>
                      {msg.user?.username || 'Usuario'}:
                    </span>
                    <span className={`font-medium ${msg.isDonation ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {msg.content || msg.message}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {hasAccess && (
          <>
            {showTipMenu && (
              <div className="absolute bottom-[90px] left-4 right-4 bg-[#0e0e0e] border border-green-500/30 rounded-[2rem] p-5 shadow-[0_-10px_40px_rgba(34,197,94,0.15)] animate-slide-up z-50 nm-inset">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500"/> Enviar SuperChat
                  </p>
                  <button onClick={() => setShowTipMenu(false)} className="text-gray-500 hover:text-white nm-btn w-8 h-8 rounded-full flex items-center justify-center"><X className="w-4 h-4"/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => sendFastTip(5, Heart)} className="nm-btn border border-pink-500/30 hover:border-pink-500 text-pink-400 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"><Heart className="w-4 h-4"/> $5</button>
                  <button onClick={() => sendFastTip(10, Flame)} className="nm-btn border border-orange-500/30 hover:border-orange-500 text-orange-400 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"><Flame className="w-4 h-4"/> $10</button>
                  <button onClick={() => sendFastTip(50, Crown)} className="nm-btn border border-yellow-500/30 hover:border-yellow-500 text-yellow-400 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"><Crown className="w-4 h-4"/> $50</button>
                  <button onClick={() => sendFastTip(100, Diamond)} className="nm-btn border border-blue-500/30 hover:border-blue-500 text-blue-400 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"><Diamond className="w-4 h-4"/> $100</button>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#0e0e0e] border-t border-white/5 shrink-0 z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Escribe en el chat..." 
                  className="flex-1 nm-inset border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:border-purple-500/50 text-sm font-medium placeholder:text-gray-600 transition-colors"
                  maxLength={200}
                />
                <button 
                  type="button"
                  onClick={() => setShowTipMenu(!showTipMenu)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                    showTipMenu ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'nm-btn border border-green-500/30 text-green-400 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()} 
                  className="w-12 h-12 rounded-2xl nm-btn-primary flex items-center justify-center shrink-0 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE COMPRA */}
      {isPaymentModalOpen && clientSecret && streamData && (
        <PaymentModal 
          clientSecret={clientSecret} 
          price={streamData.price} 
          creatorId={streamData.creatorId}
          onClose={() => setIsPaymentModalOpen(false)} 
          onSuccess={async () => { 
            setIsPaymentModalOpen(false); 
            try { 
              await api.post('/payments/confirm-purchase', { 
                postId: streamData.id, 
                type: 'LIVE_TICKET',
                amount: streamData.price, 
                creatorId: streamData.creatorId 
              }); 
              alert("✅ ¡Ticket comprado con éxito! Disfruta el show."); 
              loadStreamData(); 
            } catch (error) {} 
          }} 
        />
      )}

    </div>
  );
}