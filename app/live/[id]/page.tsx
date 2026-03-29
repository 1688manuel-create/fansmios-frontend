"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../lib/liveService';
import { paymentService } from '../../../lib/paymentService';
import api from '../../../lib/api';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  useParticipants // 👈 ¡AGREGAR ESTA LÍNEA!
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';

// 🔥 ICONOS PREMIUM
import { Eye, X, Lock, Wifi, Tv, Star, Award, Zap, Diamond, Trophy, Send, Power, Play, UserPlus, Heart } from 'lucide-react';

const SOCKET_URL = 'https://api.fansmio.com';

// 🏆 ECONOMÍA DE LUJO FANSMIO (Psicología de Conexión y Estatus)
interface Gift {
  id: number;
  name: string;
  amount: number;
  emoji: string;
  style: string;
}

const GIFTS: Gift[] = [
  // 🔹 TIER 1: Rompehielos (Generan volumen y constancia)
  { id: 1, name: "Rosa de Cristal", amount: 1, emoji: "🌹", style: "text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]" },
  { id: 2, name: "Brindis VIP", amount: 2, emoji: "🥂", style: "text-yellow-200 font-bold drop-shadow-[0_0_6px_rgba(253,230,138,0.5)]" },
  { id: 3, name: "Beso Neón", amount: 5, emoji: "💋", style: "text-pink-500 font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" },
  
  // 🔹 TIER 2: Estatus Medio (Para destacar en el chat)
  { id: 4, name: "Carta Secreta", amount: 10, emoji: "💌", style: "text-fuchsia-400 font-bold drop-shadow-[0_0_8px_rgba(232,121,249,0.6)]" },
  { id: 5, name: "Corona de Oro", amount: 15, emoji: "👑", style: "text-yellow-400 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] tracking-wide" },
  { id: 6, name: "Llave del Corazón", amount: 20, emoji: "🗝️", style: "text-amber-200 font-black drop-shadow-[0_0_12px_rgba(253,230,138,0.8)]" },
  
  // 🔹 TIER 3: Alto Calibre (Para verdaderos fans y Sugar Daddies)
  { id: 7, name: "Anillo de Diamante", amount: 30, emoji: "💍", style: "text-cyan-300 font-black drop-shadow-[0_0_15px_rgba(103,232,249,0.8)] tracking-widest" },
  { id: 8, name: "Deportivo Neón", amount: 50, emoji: "🏎️", style: "text-green-400 font-black drop-shadow-[0_0_18px_rgba(74,222,128,0.9)] italic" },
  { id: 9, name: "Corazón FansMio", amount: 100, emoji: "❤️‍🔥", style: "text-red-500 font-extrabold drop-shadow-[0_0_25px_rgba(239,68,68,1)] uppercase tracking-[0.2em]" },
  
  // 👑 TIER DIOS: El "Whale Bait" (Diseñado para romper la pantalla y el ego)
  { id: 10, name: "Universo FansMio", amount: 200, emoji: "🌌", style: "text-purple-400 font-black drop-shadow-[0_0_35px_rgba(192,132,252,1)] uppercase tracking-[0.3em]" },
];

interface Donator {
  userId: string;
  username: string;
  amount: number;
}

export default function LiveRoom() {
  const { id } = useParams();
  const router = useRouter();

  // ✅ ESTADOS
  const [user, setUser] = useState<any>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [viewersCount, setViewersCount] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  
  const [giftEffect, setGiftEffect] = useState<Gift | null>(null);
  const [topDonators, setTopDonators] = useState<Donator[]>([]);
  const [streak, setStreak] = useState(0);

  // ❤️ ESTADO PARA LOS CORAZONES FLOTANTES
  const [hearts, setHearts] = useState<{id: number, left: number}[]>([]);

  const [hasAccess, setHasAccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState("");

  const [isLiveActive, setIsLiveActive] = useState(false);

  // 👁️ ESTADOS PARA ESPECTADORES
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  // ✅ EFECTOS Y LÓGICA
  useEffect(() => {
    try {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem('user') : null;
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/auth');
      }
    } catch {
      router.push('/auth');
    }
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

        setMessages([
          { isSystem: true, content: `👋 Conexión segura PayRam activa para @${currentUser.username}.` },
          ...(data.stream.messages || [])
        ]);

        const res = await api.post('/livekit/token', {
          roomName: id,
          participantName: currentUser.username || 'Usuario',
          isCreator: isCreatorOrAdmin
        });

        setLiveKitToken(res.data.token);
      }
    } catch {
      router.push('/explore');
    }
  };

  useEffect(() => {
    if (!user?.id || !id || !hasAccess) return;

    socketRef.current?.disconnect();
    const socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      // ✅ TU MODO FANTASMA
      const isCreator = String(user.id) === String(streamData?.creatorId);
      const isGhost = user.role === 'ADMIN' && !isCreator;

      socketInstance.emit('joinLiveStream', { 
        streamId: id, 
        userId: user.id,
        isGhost: isGhost 
      });
    });

    socketInstance.on('newLiveMessage', (msg: any) => {
      // ❤️ SI LLEGA UNA SEÑAL DE LIKE, MOSTRAMOS CORAZÓN Y SALIMOS
      if (msg.isLike) {
        triggerHeart();
        return;
      }

      setMessages((prev) => [...prev, msg]);
      if (msg.isDonation) {
        const giftData = GIFTS.find(g => g.amount === msg.amount);
        if (giftData) triggerGiftEffect(giftData);
        updateTopDonators(msg);
        handleStreak();
      }
    });

    socketInstance.on('viewerCountUpdated', ({ count }: { count: number }) => setViewersCount(count));
    
    socketInstance.on('streamKilled', () => {
      if (String(user.id) !== String(streamData?.creatorId)) {
        alert("Transmisión finalizada por el creador.");
        router.push('/explore');
      }
    });

    return () => { socketInstance.disconnect(); };
  }, [user?.id, id, hasAccess]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ RELOJ CORREGIDO
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

  // ✅ FUNCIONES DE GAMIFICACIÓN, PAGOS Y CORAZONES
  const handleStreak = () => {
    setStreak(prev => prev + 1);
    if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
    streakTimeoutRef.current = setTimeout(() => setStreak(0), 8000);
  };

  const triggerGiftEffect = (gift: Gift) => {
    setGiftEffect(gift);
    setTimeout(() => setGiftEffect(null), 4000);
  };

  const updateTopDonators = (msg: any) => {
    setTopDonators((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.userId === msg.user.id);
      if (index >= 0) {
        updated[index].amount += msg.amount;
      } else {
        updated.push({ userId: msg.user.id, username: msg.user.username, amount: msg.amount });
      }
      return updated.sort((a, b) => b.amount - a.amount).slice(0, 3);
    });
  };

  // ❤️ LÓGICA DE CORAZONES (Likes en pantalla)
  const triggerHeart = () => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 40) + 10; // Posición aleatoria
    setHearts(prev => [...prev, { id, left }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 2500); // El corazón vive 2.5s y desaparece
  };

  const handleSendHeart = () => {
    triggerHeart(); // Animación local
    socketRef.current?.emit('broadcastMessage', { streamId: id, isLike: true }); // Avisamos a todos los demás conectados
  };

  const sendGift = async (gift: Gift) => {
    setShowGiftMenu(false);
    try {
      const res = await liveService.sendMessage(id as string, `ha enviado un ${gift.emoji} ${gift.name}`, true, gift.amount);
      setMessages((prev) => [...prev, res.chatMessage]);
      socketRef.current?.emit('broadcastMessage', res.chatMessage);
      triggerGiftEffect(gift);
      updateTopDonators(res.chatMessage);
      handleStreak();
    } catch (error) {
      console.error("Error al enviar regalo:", error);
      // 🔥 PARCHE DE PRUEBA: Forzamos a que el regalo se envíe localmente y avise a los sockets aunque la API falle temporalmente.
      const fakeMsg = { 
        content: `ha enviado un ${gift.emoji} ${gift.name}`, 
        isDonation: true, 
        amount: gift.amount, 
        user: user,
        streamId: id 
      };
      setMessages((prev) => [...prev, fakeMsg]);
      socketRef.current?.emit('broadcastMessage', fakeMsg);
      triggerGiftEffect(gift);
      handleStreak();
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const content = chatInput;
    setChatInput('');
    try {
      const res = await liveService.sendMessage(id as string, content, false, 0);
      setMessages((prev) => [...prev, res.chatMessage]);
      socketRef.current?.emit('broadcastMessage', res.chatMessage);
    } catch (e) { console.error(e); }
  };

  const handleEndStream = () => {
    if (window.confirm("🚨 ¿Estás seguro que deseas TERMINAR la transmisión?")) {
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
      if (res.success) {
        setHasAccess(true);
        loadStreamData();
      }
    } catch {
      alert('Pago fallido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!streamData) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Sincronizando con PayRam...</div>;

  const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden">
      
      {/* 🎬 CAPA 0: EL VIDEO (CON ESCUDO ANTI-CLIC DERECHO) */}
      <div 
        className="absolute inset-0 z-0 bg-[#050505] [&_video]:!object-cover md:[&_video]:!object-contain [&_video]:!w-full [&_video]:!h-full"
        onContextMenu={(e) => e.preventDefault()}
      >
        {hasAccess && liveKitToken ? (
          <LiveKitRoom 
            video={isCreatorOrAdmin ? isLiveActive : false} 
            audio={isCreatorOrAdmin ? isLiveActive : false} 
            token={liveKitToken} 
            serverUrl="wss://live.fansmio.com" 
            className="w-full h-full"
          >
            {/* 👈 NUEVO RASTREADOR INYECTADO AQUÍ */}
            <ParticipantsTracker onUpdate={setConnectedUsers} />
            <StreamStage hasControl={isCreatorOrAdmin && isLiveActive} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <Tv className="w-16 h-16 animate-pulse" />
          </div>
        )}
      </div>

      {/* 🛑 CAPA PAYWALL */}
      {!hasAccess && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="text-center p-8 bg-[#111]/90 rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-sm w-full">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
            <h2 className="text-white font-black text-3xl mb-3 tracking-tighter">🔒 Acceso VIP</h2>
            <p className="text-gray-400 text-sm mb-6">Solo fans exclusivos pueden presenciar este contenido.</p>
            <div className="bg-black/50 p-4 rounded-xl mb-6 border border-white/5">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Costo del Ticket</div>
              <div className="text-5xl font-black text-green-500 font-mono tracking-tight">${streamData.price} <span className="text-base text-gray-500">USD</span></div>
            </div>
            <button onClick={handleBuyTicket} disabled={isProcessing} className="w-full bg-white text-black font-black py-4 rounded-full text-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? 'Procesando...' : <><Star className="w-5 h-5"/> Desbloquear Ahora</>}
            </button>
          </div>
        </div>
      )}

      {/* 📺 CAPA PREPARACIÓN CREADOR */}
      {isCreatorOrAdmin && !isLiveActive && hasAccess && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm px-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <Tv className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Tu sala inmersiva está lista</h2>
            <p className="text-gray-400 mb-8">Enciende la cámara y arranca el show cuando estés preparado.</p>
            <button onClick={() => setIsLiveActive(true)} className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 transition-transform hover:scale-105">
              <Play className="w-6 h-6 fill-black" /> Iniciar Transmisión
            </button>
          </div>
        </div>
      )}

      {/* 💎 CAPA UI INMERSIVA FLOTANTE */}
      {hasAccess && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
          
          {/* 🔝 TOP HUD */}
          <div className="p-4 flex justify-between items-start pointer-events-auto">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full p-1.5 pr-4 border border-white/10 shadow-lg">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
                {streamData.title.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none text-white">{streamData.creator?.username || 'Creador'}</span>
                <span className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5"><Diamond className="w-2.5 h-2.5 text-sky-400"/> FansMio Live</span>
              </div>
              {!isCreatorOrAdmin && (
                <button className="ml-2 bg-green-500 text-black text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 hover:scale-105 transition-transform">
                  <UserPlus className="w-3 h-3" /> Seguir
                </button>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {/* 👁️ BOTÓN INTERACTIVO DE ESPECTADORES */}
                <button 
                  onClick={() => setShowViewersModal(true)}
                  className="flex items-center gap-1.5 bg-black/40 hover:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold transition-colors cursor-pointer shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5 text-green-400" /> {connectedUsers.length > 0 ? connectedUsers.length : viewersCount}
                </button>
                {!isCreatorOrAdmin ? (
                  <button onClick={() => router.push('/explore')} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleEndStream} className="bg-red-600/90 backdrop-blur-md hover:bg-red-600 font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg text-xs">
                    <Power className="w-3.5 h-3.5" /> Salir
                  </button>
                )}
              </div>
              <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded-md text-gray-300 backdrop-blur-sm">{uptime}</span>
            </div>
          </div>

          {/* 🏆 MIDDLE HUD */}
          <div className="absolute right-4 top-24 flex flex-col items-end gap-3 pointer-events-auto">
            {topDonators.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-w-[120px]">
                <div className="flex items-center gap-1 mb-1.5 border-b border-white/10 pb-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Top Fans</span>
                </div>
                {topDonators.map((u, i) => (
                  <div key={i} className="text-[10px] flex items-center justify-between gap-3 mt-1">
                    <span className="text-white font-bold truncate max-w-[60px]">{u.username}</span>
                    <span className="text-green-400 font-mono">${u.amount}</span>
                  </div>
                ))}
              </div>
            )}
            
            {streak > 1 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-500/50 flex items-center gap-1.5 animate-pulse">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-500" />
                <span className="text-yellow-400 font-black text-sm">x{streak}</span>
              </div>
            )}
          </div>

          {/* 🌌 EFECTO REGALO GIGANTE */}
          {giftEffect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="text-center animate-bounce">
                <div className="text-[120px] drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]">{giftEffect.emoji}</div>
                <div className={`text-2xl font-black mt-2 uppercase tracking-widest ${giftEffect.style}`}>¡{giftEffect.name}!</div>
              </div>
            </div>
          )}

          {/* ❤️ CSS ANIMACIÓN CORAZONES */}
          <style>{`
            @keyframes floatUp {
              0% { opacity: 1; transform: translateY(0) scale(1); }
              100% { opacity: 0; transform: translateY(-200px) scale(1.5); }
            }
            .animate-float { animation: floatUp 2.5s ease-out forwards; }
          `}</style>

          {/* 💬 BOTTOM HUD */}
          <div className="w-full md:w-[450px] bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 pb-4 px-4 flex flex-col justify-end pointer-events-auto mt-auto relative">
            
            {/* 🔴 CONTENEDOR DE CORAZONES FLOTANTES */}
            <div className="absolute bottom-16 right-4 w-16 h-64 pointer-events-none overflow-visible z-40">
              {hearts.map(h => (
                <div key={h.id} className="absolute bottom-0 text-red-500 animate-float text-3xl drop-shadow-md" style={{ left: `${h.left}%` }}>
                  ❤️
                </div>
              ))}
            </div>

            <div 
              className="max-h-[30vh] overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-2" 
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 100%)' }}
            >
              {messages.map((msg, i) => {
                if (msg.isSystem) return <div key={i} className="text-[11px] text-yellow-400/80 italic font-medium px-2 py-0.5 bg-black/20 rounded w-fit">{msg.content}</div>;
                const gift = msg.isDonation ? GIFTS.find(g => g.amount === msg.amount) : null;
                
                return (
                  <div key={i} className={`text-sm px-3 py-1.5 rounded-2xl w-fit max-w-[90%] ${msg.isDonation ? 'bg-gradient-to-r from-green-500/20 to-transparent border-l-2 border-green-500' : 'bg-black/30 backdrop-blur-sm'}`}>
                    <span className={`font-bold mr-1.5 text-xs ${msg.user?.role === 'ADMIN' ? 'text-red-400' : 'text-gray-300'}`}>
                      {msg.user?.username || 'Usuario'}:
                    </span>
                    <span className={`${gift ? gift.style : 'text-white'} text-[13px] leading-tight drop-shadow-md`}>
                      {msg.content}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Menú de Regalos */}
            {showGiftMenu && (
              <div className="absolute bottom-20 left-4 right-4 md:w-[420px] bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 grid grid-cols-3 md:grid-cols-5 gap-2 animate-slide-up shadow-2xl z-20">
                {GIFTS.map((gift) => (
                  <button key={gift.id} onClick={() => sendGift(gift)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500 p-2 rounded-xl transition-all flex flex-col items-center group">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{gift.emoji}</span>
                    <span className="text-[10px] text-gray-300 font-bold mt-1 text-center leading-tight">{gift.name}</span>
                    <span className="text-[11px] text-green-400 font-mono font-black mt-0.5">${gift.amount}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Barra de Input Estilo Cápsula */}
            <div className="flex gap-2 items-center mt-2 relative z-30">
              <div className="flex-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center px-4 py-1.5 focus-within:border-green-500 transition-colors">
                <input 
                  type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Di algo cool..." 
                  className="bg-transparent text-white text-sm w-full outline-none py-1 placeholder-gray-400"
                />
                <button onClick={handleSendMessage} className="text-gray-400 hover:text-green-400 transition-colors p-1">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* ❤️ BOTÓN DE LIKES (CORAZÓN ACTIVO) */}
              <button 
                onClick={handleSendHeart} 
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 hover:text-red-500 transition-colors active:scale-90"
              >
                <Heart className="w-5 h-5" />
              </button>

              <button onClick={() => setShowGiftMenu(!showGiftMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showGiftMenu ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-tr from-green-600 to-emerald-400 text-black hover:scale-105'}`}>
                <Diamond className="w-5 h-5 fill-current" />
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 👁️ MODAL LISTA DE ESPECTADORES */}
      {showViewersModal && (
        <div className="absolute inset-0 z-[200000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-400" /> Espectadores ({connectedUsers.length})
              </h3>
              <button onClick={() => setShowViewersModal(false)} className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-red-500 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {connectedUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8 font-medium text-sm">Nadie ha entrado a la sala aún...</div>
              ) : (
                connectedUsers.map((p, i) => (
                  <div key={p.identity || i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all cursor-default">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg border border-white/20">
                      {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{p.name || 'Usuario'}</span>
                      <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Conectado
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎬 ESCENARIO LIVEKIT
function StreamStage({ hasControl }: { hasControl: boolean }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const mainTrack = tracks.slice(0, 1);
  const coHostTracks = tracks.slice(1);
  

  return (
    <div className="w-full h-full flex flex-col relative bg-transparent">
      {/* Video Principal */}
      <div className="absolute inset-0 z-0">
        <GridLayout tracks={mainTrack} style={{ width: '100%', height: '100%' }}>
          <ParticipantTile />
        </GridLayout>
      </div>

      {/* Co-Hosts */}
      {coHostTracks.length > 0 && (
        <div className="absolute top-20 right-4 flex flex-col gap-2 z-10 w-24">
          {coHostTracks.map((track, i) => (
            <div key={i} className="w-24 h-32 rounded-xl overflow-hidden border-2 border-green-500/50 bg-black/50 backdrop-blur-md shadow-lg">
              <ParticipantTile trackRef={track} />
            </div>
          ))}
        </div>
      )}

      {/* Controles Ocultos */}
      {hasControl && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }} />
        </div>
      )}
    </div>
  );
}
// 🕵️ RASTREADOR DE ESPECTADORES DE LIVEKIT
function ParticipantsTracker({ onUpdate }: { onUpdate: (participants: any[]) => void }) {
  const participants = useParticipants();
  useEffect(() => {
    onUpdate(participants);
  }, [participants, onUpdate]);
  return null;
}