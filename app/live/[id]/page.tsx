"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../lib/liveService';
import { paymentService } from '../../../lib/paymentService'; 
import api from '../../../lib/api';
import { LiveKitRoom, RoomAudioRenderer, GridLayout, ParticipantTile, ControlBar, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// ICONOS
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
  const [uptime, setUptime] = useState('00:00:00');
  const [pinnedSuperChat, setPinnedSuperChat] = useState<any>(null);
  const DONATION_GOAL = 500;

  const [hasAccess, setHasAccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState("");

  // ✅ LOAD USER + STREAM
  useEffect(() => {
    let storedUser = null;

    try {
      if (typeof window !== "undefined") {
        storedUser = localStorage.getItem('user');
      }

      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/auth');
        return;
      }
    } catch {
      router.push('/auth');
      return;
    }

    loadStreamData();
  }, [id]);

  // ✅ LOAD STREAM DATA
  const loadStreamData = async () => {
    try {
      const data = await liveService.getStream(id as string);

      setStreamData(data.stream);
      setHasAccess(data.hasAccess);

      if (data.hasAccess) {
        let currentUser: any = {};
        try {
          currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {}

        setMessages([
          {
            isSystem: true,
            content: `👋 Bienvenido a la sala, @${currentUser.username}. Conexión segura PayRam activa.`,
          },
          ...(data.stream.messages || []),
        ]);

        // 🔥 TOKEN LIVEKIT
        api.post('/livekit/token', {
          roomName: id,
          participantName: currentUser.username || 'Usuario',
          isCreator: String(currentUser.id) === String(data.stream.creatorId),
        })
        .then(res => setLiveKitToken(res.data.token))
        .catch(err => console.error("Error LiveKit:", err));
      }
    } catch (error) {
      alert("La transmisión no existe o ya finalizó.");
      router.push('/explore');
    }
  };

  // ✅ COMPRAR ACCESO
  const handleBuyTicket = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await paymentService.createPaymentIntent({
        amount: streamData.price,
        type: 'LIVE_TICKET',
        creatorId: streamData.creatorId,
        postId: id as string,
        description: `Ticket VIP para Live: ${streamData.title}`,
      });

      if (res.success) {
        setHasAccess(true);
        alert("✅ Acceso concedido");
        loadStreamData();
      }
    } catch (error) {
      console.error(error);
      alert('Pago rechazado o saldo insuficiente');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ SOCKET
  useEffect(() => {
    if (!user?.id || !id || !hasAccess) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
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
        alert("El live terminó");
        router.push('/explore');
      }
    });

    return () => {
      newSocket.off();
      newSocket.disconnect();
    };
  }, [user?.id, id, hasAccess]);

  // ✅ TIMER
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

  // ✅ CHAT
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const content = chatInput;
    setChatInput('');

    try {
      const res = await liveService.sendMessage(id as string, content, false, 0);
      setMessages((prev) => [...prev, res.chatMessage]);
      socket?.emit('broadcastMessage', res.chatMessage);
    } catch (error) {
      console.error(error);
    }
  };

  const sendFastTip = async (amount: number) => {
    setShowTipMenu(false);

    try {
      const res = await liveService.sendMessage(
        id as string,
        `💸 SuperChat $${amount}`,
        true,
        amount
      );

      setMessages((prev) => [...prev, res.chatMessage]);
      socket?.emit('broadcastMessage', res.chatMessage);

      setPinnedSuperChat(res.chatMessage);
      setTimeout(() => setPinnedSuperChat(null), 8000);
    } catch {
      alert("Saldo insuficiente");
    }
  };

  const handleLeaveStream = () => {
    if (String(user?.id) === String(streamData?.creatorId)) {
      if (window.confirm("¿Terminar transmisión?")) {
        liveService.updateStatus(id as string, 'ENDED').then(() => {
          socket?.emit('streamEnded', { streamId: id });
          router.push('/dashboard');
        });
      }
    } else {
      router.push('/explore');
    }
  };

  if (!streamData) {
    return <div className="text-white p-10">Cargando...</div>;
  }

  // UI
  return (
    <div className="flex h-screen bg-black">

      {/* VIDEO */}
      <div className="flex-1 relative">
        {!hasAccess ? (
          <div className="text-center p-10">
            <Lock className="mx-auto mb-4"/>
            <button onClick={handleBuyTicket}>
              Comprar acceso - ${streamData.price}
            </button>
          </div>
        ) : (
          liveKitToken ? (
            <LiveKitRoom
              video={String(user?.id) === String(streamData.creatorId) || user?.role === 'ADMIN'}
              audio={String(user?.id) === String(streamData.creatorId) || user?.role === 'ADMIN'}
              token={liveKitToken}
              serverUrl="wss://live.fansmio.com"
              className="w-full h-full"
            >
              {/* Le pasamos nuestro nuevo escenario inmersivo */}
              <StreamStage hasControl={String(user?.id) === String(streamData.creatorId) || user?.role === 'ADMIN'} />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="text-white">Conectando...</div>
          )
        )}
      </div>

      {/* CHAT */}
      <div className="w-[350px] flex flex-col bg-[#0a0a0a]">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm text-white">
              <b>{msg.user?.username || 'Sistema'}:</b> {msg.content}
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>

        {hasAccess && (
          <div className="p-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full p-2 bg-black text-white"
            />

            <button onClick={() => setShowTipMenu(!showTipMenu)}>
              <DollarSign/>
            </button>

            {showTipMenu && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 5, 10, 20].map((amt) => (
                  <button key={amt} onClick={() => sendFastTip(amt)}>
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

// 🔥 NUEVO COMPONENTE: ESCENARIO VIP INMERSIVO
function StreamStage({ hasControl }: { hasControl: boolean }) {
  // Obtenemos únicamente las pistas de cámara de la sala
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false }
  ]);

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
      
      {/* 🎬 VIDEO A PANTALLA COMPLETA (Sin marcos feos) */}
      <GridLayout tracks={tracks} style={{ width: '100%', height: '100%' }}>
        <ParticipantTile />
      </GridLayout>

      {/* 🎛️ PANEL FLOTANTE DE LUJO (Solo para Creadores y Admins) */}
      {hasControl && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-1 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <ControlBar
            variation="minimal"
            controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }}
          />
        </div>
      )}
    </div>
  );
}