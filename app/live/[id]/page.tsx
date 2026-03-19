"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../lib/liveService';
import { paymentService } from '../../../lib/paymentService'; 
import api from '../../../lib/api';
import MuxPlayer from '@mux/mux-player-react'; 

// 🔥 ICONOS PREMIUM (Solo los que realmente se usan)
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
  
  // Referencias para la cámara WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  
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

  // ==========================================
  // 🏦 COMPRA INSTANTÁNEA DE TICKET (PAYRAM)
  // ==========================================
  const handleBuyTicket = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Llamada al nuevo motor instantáneo de PayRam
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
        loadStreamData(); // Refrescamos para activar chat y video
      }
    } catch (error) {
      console.error("Error en cobro PayRam:", error);
      alert('Tu saldo es insuficiente o la transacción fue rechazada.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 📡 ANTENA WEBSOCKET (CONEXIÓN SEGURA)
  // ==========================================
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
      // Los SuperChats ahora se descuentan directamente vía PayRam en el backend
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

  // ==========================================
  // 🚀 INICIAR CÁMARA NATIVA (WEBRTC WHIP MUX)
  // ==========================================
  const startWebRTCStream = async () => {
    // 🛡️ REGLA DE SEGURIDAD: Los navegadores exigen HTTPS para encender la cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("🔒 ERROR: Tu navegador bloqueó la cámara porque la conexión no es segura. Asegúrate de entrar usando HTTPS:// en lugar de HTTP://");
      return;
    }

    try {
      setIsProcessing(true);
      // 1. Pedimos permiso para usar la cámara y micrófono del celular
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      
      // 2. Mostramos la cámara en silencio para que el creador se vea sin eco
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Empaquetamos el video
      const pc = new RTCPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Disparamos el video a los servidores oficiales de Mux (WHIP)
      const whipUrl = `https://global-live.mux.com/whip`;
      const response = await fetch(whipUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/sdp',
          'Authorization': `Bearer ${streamData.streamKey}` // 🔑 La llave secreta que exige Mux
        },
        body: offer.sdp
      });

      if (!response.ok) throw new Error("Fallo en el servidor de video Mux");

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // 5. ¡Éxito! Avisamos al servidor que estamos En Vivo
      setIsLive(true);
      setIsProcessing(false);
      liveService.updateStatus(id as string, 'LIVE').catch(()=>{});

    } catch (error) {
      console.error("Error WebRTC:", error);
      alert("Permiso de cámara denegado o error de conexión con Mux.");
      setIsProcessing(false);
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
              <div className="w-full h-full relative group bg-black flex flex-col items-center justify-center overflow-hidden">
                
                {/* 📺 La pantalla donde el creador se ve a sí mismo */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover absolute inset-0 scale-x-[-1]"
                />
                
                {/* 🔴 Indicador de estado */}
                <div className="absolute top-6 left-6 z-30 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg border border-white/10">
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div> 
                  {isLive ? 'EN VIVO (Tus fans te ven)' : 'VISTA PREVIA'}
                </div>

                {/* 🚀 Botón gigante para iniciar */}
                {!isLive && (
                  <div className="absolute bottom-10 z-30">
                    <button 
                      onClick={startWebRTCStream}
                      disabled={isProcessing}
                      className="nm-btn-primary px-8 py-4 rounded-full font-black flex items-center gap-2 text-lg shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-transform hover:scale-105"
                    >
                      {isProcessing ? 'Conectando...' : <><Tv className="w-6 h-6"/> INICIAR TRANSMISIÓN</>}
                    </button>
                  </div>
                )}
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