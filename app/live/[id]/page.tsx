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
  useTracks
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';

// 🔥 ICONOS PREMIUM
import { Eye, X, Lock, Wifi, Tv, Star, Award, Zap, Diamond, Flame, Trophy } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// 🏆 1. ECONOMÍA DE LUJO EXCLUSIVA (Nivel Dios - Unique Gifts)
// Definidos fuera para evitar re-renders y errores ts(1109)
interface Gift {
  id: number;
  name: string;
  amount: number;
  emoji: string;
  style: string; // Clase CSS para el chat
}

const GIFTS: Gift[] = [
  { id: 1, name: "Diamante FansMio", amount: 5, emoji: "💎", style: "text-sky-400 font-bold" },
  { id: 2, name: "Botella VIP", amount: 10, emoji: "🍾", style: "text-green-400 font-bold" },
  { id: 3, name: "Orbe de Poder", amount: 20, emoji: "🔮", style: "text-purple-400 font-bold" },
  { id: 4, name: "Planeta Privado", amount: 50, emoji: "🪐", style: "text-amber-400 font-bold" },
  { id: 5, name: "Galaxia FansMio", amount: 100, emoji: "🌌", style: "text-white font-extrabold drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" },
];

interface Donator {
  userId: string;
  username: string;
  amount: number;
}

export default function LiveRoom() {
  const { id } = useParams();
  const router = useRouter();

  // Estados Base
  const [user, setUser] = useState<any>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Referencias Técnicas (Tu corrección ✅)
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de Interfaz y Gamificación
  const [viewersCount, setViewersCount] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  
  // 🎆 NIVEL DIOS: EFECTOS Y RANKING
  const [giftEffect, setGiftEffect] = useState<Gift | null>(null);
  const [topDonators, setTopDonators] = useState<Donator[]>([]);
  const [streak, setStreak] = useState(0);

  // Estados de Seguridad y Paywall
  const [hasAccess, setHasAccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState("");

  // ✅ 1. INITIAL LOAD (User + Stream + Token)
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
          isCreator: isCreatorOrAdmin // Seguridad del token
        });

        setLiveKitToken(res.data.token);
      }
    } catch {
      router.push('/explore');
    }
  };

  // ✅ 2. SOCKETS + LÓGICA NIVEL DIOS (Rachas, Regalos, Ranking)
  useEffect(() => {
    if (!user?.id || !id || !hasAccess) return;

    socketRef.current?.disconnect();

    const socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      socketInstance.emit('joinLiveStream', { streamId: id, userId: user.id });
    });

    socketInstance.on('newLiveMessage', (msg: any) => {
      setMessages((prev) => [...prev, msg]);

      // 🎆 EFECTOS PSICOLÓGICOS AL RECIBIR DONACIÓN
      if (msg.isDonation) {
        // Encontrar el objeto Gift para el efecto visual
        const giftData = GIFTS.find(g => g.amount === msg.amount);
        if (giftData) {
          triggerGiftEffect(giftData);
        }
        updateTopDonators(msg);
        handleStreak();
      }
    });

    socketInstance.on('viewerCountUpdated', ({ count }: { count: number }) => setViewersCount(count));
    
    socketInstance.on('streamKilled', () => {
      if (String(user.id) !== String(streamData?.creatorId)) {
        alert("Transmisión finalizada.");
        router.push('/explore');
      }
    });

    return () => { socketInstance.disconnect(); };
  }, [user?.id, id, hasAccess]);

  // ✅ Autoscroll + Timer
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!streamData?.createdAt) return;
      const diff = Math.floor((Date.now() - new Date(streamData.createdAt).getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [streamData]);

  // ✅ 3. FUNCIONES MAESTRAS DE MONETIZACIÓN (Rachas, Regalos, Ranking)

  // 🔥 Multiplicador de Rachas (Dopamina pura)
  const handleStreak = () => {
    setStreak(prev => prev + 1);
    if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
    streakTimeoutRef.current = setTimeout(() => setStreak(0), 8000); // 8 segundos para mantener la racha
  };

  // 🎆 Disparador de Efectos Visuales (Urgency)
  const triggerGiftEffect = (gift: Gift) => {
    setGiftEffect(gift);
    setTimeout(() => setGiftEffect(null), 4000); // El efecto dura 4s
  };

  // 🏆 Ranking de Donadores en Tiempo Real (Competencia)
  const updateTopDonators = (msg: any) => {
    setTopDonators((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.userId === msg.user.id);

      if (index >= 0) {
        updated[index].amount += msg.amount;
      } else {
        updated.push({
          userId: msg.user.id,
          username: msg.user.username,
          amount: msg.amount
        });
      }
      return updated.sort((a, b) => b.amount - a.amount).slice(0, 3); // Top 3
    });
  };

  // 💸 Enviar Regalo Exclusivo
  const sendGift = async (gift: Gift) => {
    setShowGiftMenu(false);
    try {
      const res = await liveService.sendMessage(
        id as string, 
        `ha enviado un ${gift.emoji} ${gift.name}`, 
        true, 
        gift.amount
      );
      
      setMessages((prev) => [...prev, res.chatMessage]);
      socketRef.current?.emit('broadcastMessage', res.chatMessage);
      
      // Efecto local inmediato
      triggerGiftEffect(gift);
      updateTopDonators(res.chatMessage);
      handleStreak();

    } catch {
      alert("Fondos insuficientes en PayRam.");
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

  const handleBuyTicket = async () => {
    if (!streamData || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await paymentService.createPaymentIntent({
        amount: streamData.price,
        type: 'LIVE_TICKET',
        creatorId: streamData.creatorId,
        postId: id as string,
        description: `Ticket VIP: ${streamData.title}`,
      });
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
    <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden font-sans relative">
      
      {/* 📺 VIDEO + OVERLAYS (Nivel Dios) */}
      <div className="flex-1 relative flex flex-col bg-[#050505] min-h-[40vh] md:min-h-screen border-b md:border-b-0 md:border-r border-white/10">
        
        {/* Header Flotante */}
        <div className="absolute top-0 w-full p-4 z-30 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">En Vivo</span>
              <span className="flex items-center gap-1 text-xs text-white font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-md"><Eye className="w-3.5 h-3.5"/> {viewersCount}</span>
              <span className="text-xs text-gray-300 font-mono bg-black/50 px-2 py-0.5 rounded backdrop-blur-md">{uptime}</span>
            </div>
            <h1 className="text-white font-black text-lg drop-shadow-md">{streamData.title}</h1>
          </div>
          <button onClick={() => router.push('/explore')} className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-red-600 transition-colors backdrop-blur-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 🏆 NIVEL DIOS: RANKING TOP FANS (Abs top-right) */}
        {hasAccess && topDonators.length > 0 && (
          <div className="absolute top-4 right-16 md:right-4 z-40 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <div className="flex items-center gap-1.5 mb-2 border-b border-white/10 pb-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <h3 className="text-[11px] text-yellow-400 font-black uppercase tracking-wider">Top FansMio</h3>
            </div>
            {topDonators.map((u, i) => (
              <div key={i} className={`text-xs flex items-center gap-2 ${i === 0 ? 'text-white font-bold' : 'text-gray-300'}`}>
                <span className={`font-mono ${i===0?'text-yellow-400':i===1?'text-gray-400':'text-orange-400'}`}>#{i+1}</span>
                <span className="truncate max-w-[80px]">{u.username}</span>
                <span className="text-green-400 font-mono ml-auto">${u.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 🔥 NIVEL DIOS: STREAK SYSTEM (Abs bottom-center) */}
        {streak > 1 && (
          <div className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-xl px-6 py-2 rounded-full border border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center gap-2.5 animate-pulse">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-500" />
            <div className="text-yellow-400 font-black text-xl md:text-2xl tracking-tight">
              🔥 Racha x{streak} <span className="text-sm font-mono text-white opacity-70">donaciones seguidas</span>
            </div>
          </div>
        )}

        {/* 🌌 NIVEL DIOS: EFECTO DE REGALO GIGANTE (Animación Bounce) */}
        {giftEffect && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/30 backdrop-blur-[2px]">
            <div className="text-center">
              <div className="text-[100px] md:text-[150px] font-black drop-shadow-[0_0_50px_rgba(255,255,255,0.7)] animate-bounce">
                {giftEffect.emoji}
              </div>
              <div className={`text-2xl md:text-4xl font-black mt-4 uppercase tracking-wider ${giftEffect.style}`}>
                ¡ {giftEffect.name} !
              </div>
            </div>
          </div>
        )}

        {/* Zona de Reproducción */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {!hasAccess ? (
            // 💰 PAYWALL MÁS AGRESIVO (Urgencia + Psicología)
            <div className="text-center p-8 bg-[#111] rounded-3xl border border-white/10 z-20 shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-xs m-4">
              <Lock className="w-16 h-16 text-red-500 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
              <h2 className="text-white font-black text-3xl mb-3 tracking-tighter">🔒 Acceso VIP</h2>
              <p className="text-gray-400 text-sm mb-6">Solo fans exclusivos pueden presenciar este contenido. No te quedes fuera.</p>
              
              <div className="nm-inset bg-black p-4 rounded-xl mb-6 border border-white/5">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Costo del Ticket</div>
                <div className="text-5xl font-black text-green-500 font-mono tracking-tight">${streamData.price} <span className="text-base text-gray-500">USD</span></div>
              </div>

              <button onClick={handleBuyTicket} disabled={isProcessing} className="w-full bg-white text-black font-black py-4 rounded-xl text-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {isProcessing ? 'Procesando...' : <><Star className="w-5 h-5"/> Desbloquear Ahora</>}
              </button>
            </div>
          ) : liveKitToken ? (
            <LiveKitRoom
              video={isCreatorOrAdmin} 
              audio={isCreatorOrAdmin} 
              token={liveKitToken}
              serverUrl="wss://live.fansmio.com"
              className="w-full h-full"
            >
              <StreamStage hasControl={isCreatorOrAdmin} />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="text-gray-500 animate-pulse flex flex-col items-center">
               <Tv className="w-8 h-8 mb-2" />
               Conectando señal VIP...
            </div>
          )}
        </div>
      </div>

      {/* 💬 CHAT: SECCIÓN DERECHA / INFERIOR */}
      <div className="w-full md:w-[380px] h-[60vh] md:h-screen flex flex-col bg-[#0a0a0a]">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
          <h2 className="text-white font-black text-sm uppercase tracking-widest">Chat Público</h2>
          <Wifi className="w-4 h-4 text-green-500" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg, i) => {
            if (msg.isSystem) return <div key={i} className="text-xs text-center text-gray-600 italic p-1 nm-inset rounded bg-black/20">{msg.content}</div>;
            
            // Buscar estilo de regalo si es donación
            const donationGift = msg.isDonation ? GIFTS.find(g => g.amount === msg.amount) : null;

            return (
              <div key={i} className={`text-sm p-2 rounded-lg ${msg.isDonation ? 'bg-green-500/10 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'hover:bg-white/5 transition-colors'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.isDonation && <Award className="w-3.5 h-3.5 text-green-400"/>}
                    <span className={`font-black ${msg.user?.role === 'ADMIN' ? 'text-red-400' : 'text-gray-400'}`}>
                        {msg.user?.username || 'Sistema'}:
                    </span>
                </div>
                <span className={`${donationGift ? donationGift.style : 'text-gray-200'}`}>
                  {msg.content}
                </span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* 🌌 NIVEL DIOS: MENÚ DE REGALOS EXCLUSIVOS */}
        {hasAccess && (
          <div className="p-4 bg-[#111] border-t border-white/10 relative">
            
            {showGiftMenu && (
              <div className="absolute bottom-full left-0 w-full p-4 bg-[#111] border-t border-white/10 grid grid-cols-3 gap-2 animate-slide-up shadow-2xl z-20 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {GIFTS.map((gift: Gift) => (
                  <button 
                    key={gift.id} 
                    onClick={() => sendGift(gift)} 
                    className="nm-btn bg-[#0a0a0a]/50 hover:bg-green-600 p-2 rounded-xl transition-all flex flex-col items-center group border border-white/5 hover:border-green-500"
                  >
                    <span className="text-4xl group-hover:animate-bounce">{gift.emoji}</span>
                    <span className="text-xs text-white font-bold tracking-tight mt-1">{gift.name}</span>
                    <span className="text-xs text-green-400 group-hover:text-black font-mono font-black nm-inset px-2 py-0.5 rounded-full mt-1">${gift.amount}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..." 
                className="flex-1 bg-black text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-green-500/50 transition-colors"
              />
              <button 
                onClick={() => setShowGiftMenu(!showGiftMenu)} 
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${showGiftMenu ? 'bg-green-500 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-black text-green-500 border-white/10 hover:border-green-500'}`}
              >
                <Diamond className={`w-5 h-5 ${showGiftMenu ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎬 ESCENARIO MULTI-VIDEO SANEADO Y REFORZADO (Nivel Dios architecture)
function StreamStage({ hasControl }: { hasControl: boolean }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);

  // ✅ EXTRAEMOS LAS VARIABLES DE FORMA SEGURA (Tu corrección ✅)
  const mainTrack = tracks.slice(0, 1);
  const coHostTracks = tracks.slice(1);

  return (
    <div className="w-full h-full flex flex-col relative bg-black">
      
      {/* Speaker Principal */}
      <div className="flex-1 min-h-0 bg-[#050505]">
        <GridLayout tracks={mainTrack} style={{ width: '100%', height: '100%' }}>
          <ParticipantTile />
        </GridLayout>
      </div>

      {/* Tira inferior para Co-Hosts (Tu arquitectura ✅) */}
      {coHostTracks.length > 0 && (
        <div className="h-24 md:h-32 flex gap-2 p-2 overflow-x-auto bg-[#0a0a0a] border-t border-white/10 shadow-inner custom-scrollbar">
          {coHostTracks.map((track, i) => (
            <div key={i} className="w-32 md:w-40 h-full flex-shrink-0 rounded-xl overflow-hidden border border-white/5 bg-[#111]">
              <ParticipantTile trackRef={track} />
            </div>
          ))}
        </div>
      )}

      {/* Botonera de Admin (Seguridad activa) */}
      {hasControl && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }} />
        </div>
      )}
    </div>
  );
}