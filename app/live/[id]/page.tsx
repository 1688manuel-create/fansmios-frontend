"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../lib/liveService';
import { paymentService } from '../../../lib/paymentService'; 
import api from '../../../lib/api';
import MuxPlayer from '@mux/mux-player-react'; 

// 🔥 ICONOS PREMIUM
import { 
  Eye, X, DollarSign, Diamond, Tv, Star, Award, Wifi, Lock, CreditCard
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
  const DONATION_GOAL = 500; 

  // 🔥 ESTADOS DEL PAYWALL PAYRAM
  const [hasAccess, setHasAccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
          content: `👋 Bienvenido a la sala, @${JSON.parse(localStorage.getItem('user') || '{}').username}. Conexión segura PayRam activa.`
        }, ...(data.stream.messages || [])]);
      }
    } catch (error) {
      alert("La transmisión no existe o ya finalizó.");
      router.push('/explore');
    }
  };

  const handleBuyTicket = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await paymentService.createPaymentIntent({
        amount: streamData.price,
        type: 'LIVE_TICKET', 
        creatorId: streamData.creatorId, 
        postId: id as string, 
        description: `Ticket VIP para Live: ${streamData.title}`
      });

      if (res.success) {
        setHasAccess(true);
        alert("✅ ¡Acceso concedido por PayRam! Disfruta el show.");
        loadStreamData(); 
      }
    } catch (error) {
      console.error("Error en cobro PayRam:", error);
      alert('Tu saldo es insuficiente o la transacción fue rechazada.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !id || !hasAccess) return;
    
    const newSocket = io(SOCKET_URL, { 
      transports: ['websocket'], 
      reconnectionAttempts: 5 
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
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
      if (String(user.id) !== String(streamData?.creatorId)) {
        alert("El creador ha finalizado la transmisión.");
        router.push('/explore');
      }
    });

    return () => { newSocket.disconnect(); };
  }, [user?.id, id, hasAccess]);

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
      setMessages((prev) => [...prev, res.chatMessage]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      socket?.emit('broadcastMessage', res.chatMessage);
    } catch (error) {
      console.error("Error al enviar", error);
    }
  };

  const sendFastTip = async (amount: number, IconComponent: any) => {
    setShowTipMenu(false);
    try {
      const res = await liveService.sendMessage(id as string, `¡SuperChat de $${amount}!`, true, amount);
      setMessages((prev) => [...prev, res.chatMessage]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      socket?.emit('broadcastMessage', res.chatMessage);
      
      setPinnedSuperChat(res.chatMessage);
      setTimeout(() => setPinnedSuperChat(null), 8000);
    } catch (error: any) {
      alert("No tienes fondos suficientes en tu cuenta PayRam.");
    }
  };

  const handleLeaveStream = () => {
    if (String(user?.id) === String(streamData?.creatorId)) {
      if (window.confirm("🚨 ¿TERMINAR transmisión definitivamente?")) {
        liveService.updateStatus(id as string, 'ENDED').then(() => {
          socket?.emit('streamEnded', { streamId: id });
          router.push('/dashboard');
        });
      }
    } else {
      router.push('/explore');
    }
  };

  if (!streamData) return <div className="min-h-screen bg-nm-base flex items-center justify-center text-white"><span className="animate-pulse flex items-center gap-2"><Tv className="w-5 h-5"/> Sincronizando con PayRam...</span></div>;

  const totalEarned = messages.reduce((acc, msg) => acc + (msg.isDonation ? Number(msg.amount) : 0), 0);
  const progressPercent = Math.min((totalEarned / DONATION_GOAL) * 100, 100);
  
  const getFanBadge = (level: string) => {
    switch (level) {
      case 'DIAMOND': return <span className="text-blue-400"><Diamond className="w-3 h-3 inline fill-blue-500"/></span>;
      case 'GOLD': return <span className="text-yellow-400"><Award className="w-3 h-3 inline fill-yellow-500"/></span>;
      case 'CREATOR': return <span className="text-purple-400"><Tv className="w-3 h-3 inline"/></span>;
      default: return null; 
    }
  };

  return (
    <div className="min-h-screen bg-nm-base flex flex-col md:flex-row relative overflow-hidden">
      
      {/* 🎬 ZONA DE VIDEO */}
      <div className="flex-1 flex flex-col relative border-r border-white/5 bg-[#050505]">
        
        {/* HEADER DE LA SALA */}
        <div className="absolute top-0 w-full p-6 z-30 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black animate-pulse">LIVE</div>
              <div className="flex items-center gap-1 text-xs text-white font-bold"><Eye className="w-3 h-3"/> {viewersCount}</div>
              <div className="text-xs text-gray-400 font-mono">{uptime}</div>
            </div>
            <h1 className="text-white font-black text-lg">{streamData.title}</h1>
          </div>
          <button onClick={handleLeaveStream} className="nm-btn w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div> 

        {/* REPRODUCTOR O PAYWALL */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
          {!hasAccess ? (
            <div className="z-20 text-center p-10 nm-inset bg-[#0a0a0a] rounded-[2rem] border border-white/5 max-w-sm">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <h2 className="text-white font-black text-xl mb-2">Evento Privado</h2>
              <p className="text-gray-500 text-sm mb-6">Este contenido requiere un ticket de acceso PayRam.</p>
              
              <button 
                onClick={handleBuyTicket}
                disabled={isProcessing}
                className="w-full nm-btn-primary py-4 font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : <><CreditCard className="w-5 h-5"/> Comprar Acceso - ${streamData.price}</>}
              </button>
            </div>
          ) : (
            String(user?.id) === String(streamData.creatorId) ? (
              <div className="z-20 p-8 nm-inset bg-[#0a0a0a] rounded-3xl border border-white/5 max-w-lg w-full text-left">
                <h2 className="text-white font-black text-2xl mb-2 flex items-center gap-2"><Tv className="text-red-500"/> Panel de Transmisión VIP</h2>
                <p className="text-gray-400 text-sm mb-6">Transmite en alta definición (1080p). Copia estas credenciales y pégalas en <b>Larix Broadcaster</b> (celular) u <b>OBS Studio</b> (PC).</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 block">Servidor (URL RTMP)</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value="rtmps://global-live.mux.com:443/app" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 block">Clave Secreta de Transmisión</label>
                    <div className="flex gap-2">
                      {/* 🔥 IMPORTANTE: Aquí generamos el texto exacto que Larix necesita copiarse */}
                      <input type="text" readOnly value={`rtmps://global-live.mux.com:443/app/${streamData.streamKey || ''}`} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-red-400 font-mono font-bold outline-none" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl text-blue-300 text-xs leading-relaxed">
                  <span className="font-bold block mb-1">💡 Guía rápida para Larix (Celular):</span>
                  1. Abre Larix Broadcaster y presiona el Engrane (Ajustes) &gt; Connections &gt; New Connection.<br/>
                  2. En URL pega directamente el texto rojo de arriba (que ya trae tu clave pegada al final).<br/>
                  3. Guarda, presiona el botón rojo de grabar, ¡y aparecerás en vivo!
                </div>
              </div>
            ) : streamData.playbackId ? (
              <MuxPlayer
                streamType="live"
                playbackId={streamData.playbackId}
                tokens={streamData.playbackToken ? { playback: streamData.playbackToken } : undefined}
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500 italic">Esperando señal de origen...</div>
            )
          )}
        </div>
      </div>

      {/* 💬 CHAT VIP */}
      <div className="w-full md:w-[380px] flex flex-col bg-[#0a0a0a] border-l border-white/5">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0e0e0e]">
          <h2 className="text-white font-black text-xs uppercase tracking-widest">Chat en Vivo</h2>
          <Wifi className="w-3 h-3 text-green-500" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`text-sm ${msg.isDonation ? 'bg-green-500/10 border border-green-500/20 p-2 rounded-lg' : ''}`}>
              <span className="font-black text-gray-500 mr-2">
                {getFanBadge(msg.fanLevel)} {msg.user?.username || 'Sistema'}:
              </span>
              <span className={msg.isDonation ? 'text-green-400 font-bold' : 'text-gray-300'}>{msg.content}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {hasAccess && (
          <div className="p-4 bg-[#0e0e0e] border-t border-white/5">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe algo..." 
                className="flex-1 nm-inset bg-black text-white px-4 py-3 rounded-xl text-sm outline-none border border-white/5"
              />
              <button onClick={() => setShowTipMenu(!showTipMenu)} className="nm-btn w-12 h-12 rounded-xl text-green-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </button>
            </div>
            
            {showTipMenu && (
              <div className="grid grid-cols-4 gap-2 mt-3 animate-slide-up">
                {[5, 10, 20, 50].map(amt => (
                  <button key={amt} onClick={() => sendFastTip(amt, Star)} className="nm-btn py-2 text-[10px] font-black text-white rounded-lg border border-white/5 hover:bg-green-600 transition-colors">
                    ${amt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}