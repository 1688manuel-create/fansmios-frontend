"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { liveService } from '../../../../lib/liveService';
import api from '../../../../lib/api';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile,
  ControlBar,
  useTracks,
  useParticipants 
} from '@livekit/components-react';

import { Track, VideoPresets, RoomOptions } from 'livekit-client';
import '@livekit/components-styles';

import { Eye, X, Lock, Tv, Star, Diamond, Trophy, Zap, Send, Play, Heart, TrendingUp, DollarSign, Swords, UserPlus, Timer, Target, Trash2, CheckCircle2, Dices, Gavel, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

let SOCKET_URL = 'https://api.fansmio.com';
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL);
    SOCKET_URL = `${url.protocol}//${url.host}`;
  } catch (e) {
    console.error("URL en .env mal escrita, usando fallback");
  }
}

export interface Gift { id: number; name: string; amount: number; image: string; style: string; action?: string; }
export interface Challenge { id: string; title: string; description: string; price: number; isActive: boolean; }

export const GIFTS: Gift[] = [
  { id: 1, name: "Rosa", amount: 0.25, image: "/gifts/rosa.png", style: "text-rose-400 font-bold" },
  { id: 2, name: "Brindis", amount: 1.00, image: "/gifts/brindis.png", style: "text-yellow-200 font-bold" },
  { id: 3, name: "Beso", amount: 2.00, image: "/gifts/beso.png", style: "text-pink-500 font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" },
  { id: 4, name: "Carta", amount: 5.00, image: "/gifts/carta.png", style: "text-fuchsia-400 font-bold" },
  { id: 5, name: "Corona", amount: 10.00, image: "/gifts/corona.png", style: "text-yellow-400 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]", action: 'sparkles' },
  { id: 6, name: "Llave", amount: 20.00, image: "/gifts/llave.png", style: "text-amber-200 font-black" },
  { id: 7, name: "Diamante", amount: 30.00, image: "/gifts/diamante.png", style: "text-cyan-300 font-black drop-shadow-[0_0_15px_rgba(103,232,249,0.8)]", action: 'explosion' },
  { id: 8, name: "Deportivo", amount: 50.00, image: "/gifts/deportivo.png", style: "text-green-400 font-black italic" },
  { id: 9, name: "Corazón VIP", amount: 100.00, image: "/gifts/corazon-vip.png", style: "text-red-500 font-extrabold drop-shadow-[0_0_25px_rgba(239,68,68,1)] uppercase", action: 'fireworks' },
  { id: 10, name: "Universo", amount: 200.00, image: "/gifts/universo.png", style: "text-purple-400 font-black drop-shadow-[0_0_35px_rgba(192,132,252,1)] uppercase", action: 'galaxy' },
  { id: 11, name: "Rayo", amount: 300.00, image: "/gifts/rayo.png", style: "text-purple-500 font-extrabold drop-shadow-[0_0_20px_rgba(168,85,247,1)] uppercase animate-pulse", action: 'vibrate_intenso' }
];

export interface Donator { userId: string; username: string; amount: number; }

const roomOptions: RoomOptions = {
  videoCaptureDefaults: { resolution: VideoPresets.h1080.resolution, facingMode: 'user' },
  publishDefaults: { simulcast: true, videoEncoding: { maxBitrate: 3000000, maxFramerate: 30 }, videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720, VideoPresets.h360] }
};

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
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showChallengeManager, setShowChallengeManager] = useState(false);
  const [giftTab, setGiftTab] = useState<'GIFTS' | 'CHALLENGES'>('GIFTS');

  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [giftEffect, setGiftEffect] = useState<Gift | null>(null);
  const [topDonators, setTopDonators] = useState<Donator[]>([]);
  const [streak, setStreak] = useState(0);
  
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const [currentGoal, setCurrentGoal] = useState(0);
  const [targetGoal, setTargetGoal] = useState(500);

  const [battle, setBattle] = useState<any>(null);
  const [slowMode, setSlowMode] = useState(0);
  const [battleSide, setBattleSide] = useState<'left'|'right'>('left');
  const [rouletteEvent, setRouletteEvent] = useState<{senderName: string, prize: string} | null>(null);
  const [auction, setAuction] = useState<any>(null);

  const [promptConfig, setPromptConfig] = useState<any>(null);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const streakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartsContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef(0);

  useEffect(() => { GIFTS.forEach((gift) => { const img = new window.Image(); img.src = gift.image; }); }, []);

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
        }).catch(err => console.error(err));
      } else { router.push('/auth'); }
    } catch { router.push('/auth'); }
    loadStreamData();
  }, [id, router]);

  const loadStreamData = async () => {
    try {
      const data = await liveService.getStream(id as string);
      setStreamData(data.stream);
      setHasAccess(data.hasAccess);
      if (data.stream.creatorId) {
        liveService.getCreatorChallenges(data.stream.creatorId).then(res => { if (res.challenges) setChallenges(res.challenges); });
      }
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
    if (gift.action) { try { const audio = new Audio(`/sounds/${gift.action}.wav`); audio.volume = 0.8; audio.play().catch(e => e); } catch (err) {} }
    setTimeout(() => setGiftEffect(null), 4000);
  };

  const updateTopDonators = (msg: any) => {
    const donorId = msg.userId || msg.senderId; 
    if (!donorId) return;
    setTopDonators((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(u => u.userId === donorId);
      if (index >= 0) updated[index].amount += msg.amount;
      else updated.push({ userId: donorId, username: msg.user?.username || 'Anónimo', amount: msg.amount });
      return updated.sort((a, b) => b.amount - a.amount).slice(0, 3);
    });
  };

  const triggerHeart = () => {
    if (!heartsContainerRef.current) return;
    const el = document.createElement('div');
    const emojis = ['❤️', '💖', '🔥', '✨', '💎'];
    el.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
    const randomLeft = Math.floor(Math.random() * 40) - 20; 
    const randomDuration = (Math.random() * 1.5 + 2).toFixed(2);
    const randomSize = Math.floor(Math.random() * 10) + 20;
    el.className = 'absolute bottom-0 text-red-500 drop-shadow-md pointer-events-none opacity-0';
    el.style.left = '50%'; el.style.fontSize = `${randomSize}px`; el.style.animation = `floatUpAndFade ${randomDuration}s ease-in-out forwards`; el.style.setProperty('--tx', `${randomLeft}px`);
    heartsContainerRef.current.appendChild(el);
    setTimeout(() => el.remove(), parseFloat(randomDuration) * 1000); 
  };

  const socketRef = useLiveSocket({
    id: id as string, user, streamData, onLike: triggerHeart,
    onMessage: (msg: any) => {
      setMessages((prev) => {
        // 🛡️ DEDUPLICADOR: Creamos un ID único basado en el mensaje o usamos el que trae
        const msgText = msg.text || msg.content;
        const msgId = msg.id || msg._id || `${msg.senderId || msg.userId}-${msgText}-${msg.amount}-${msg.user?.username}`;
        
        // 🛡️ ESCUDO: Verificamos si este mensaje ya existe en nuestra pantalla
        const exists = prev.some(m => {
           const mText = m.text || m.content;
           const existingId = m.id || m._id || `${m.senderId || m.userId}-${mText}-${m.amount}-${m.user?.username}`;
           return existingId === msgId;
        });
        
        // Si ya existe (porque lo acabamos de escribir nosotros), lo ignoramos y no hacemos nada
        if (exists) return prev;

        // Si es un mensaje/regalo NUEVO, procesamos las animaciones
        if (msg.isDonation) {
           setTimeout(() => {
              if (msg.isChallenge) {
                 triggerGiftEffect({ id: 999, name: msg.challengeTitle, amount: msg.amount, image: '', style: "text-red-500 font-black", action: 'explosion' } as Gift);
              } else {
                 const giftData = GIFTS.find(g => g.amount === msg.amount) || { style: "text-green-400" };
                 triggerGiftEffect(msg.giftImageUrl ? { ...giftData, image: msg.giftImageUrl } as Gift : giftData as Gift);
              }
              updateTopDonators(msg); handleStreak();
           }, 0);
        }

        // Finalmente, agregamos el mensaje a la lista
        return [...prev.slice(-99), { ...msg, id: msgId, content: msgText }];
      });
    },
    onViewerCount: setViewersCount,
    onStreamKilled: () => { setConfirmConfig({ title: "Fin de Transmisión", message: t('alert_stream_ended'), confirmText: "Entendido", onConfirm: () => router.push('/explore'), hideCancel: true }); },
    onPaywallActivated: (newPrice: number) => {
      const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';
      if (!isCreatorOrAdmin) { setStreamData((prev: any) => ({ ...prev, price: newPrice })); setHasAccess(false); }
    },
    onUpdateGoal: useCallback((usdAmount: number) => setCurrentGoal(prev => prev + usdAmount), []),
    onBattleUpdate: setBattle,
    onSlowModeUpdate: setSlowMode,
    onRouletteSpun: (data: any) => {
      setRouletteEvent(data); setTimeout(() => setRouletteEvent(null), 7000);
      setMessages((prev) => [...prev.slice(-99), { content: `🎡 ${data.senderName} giró la Ruleta y ganó: ${data.prize}!`, isDonation: true, amount: data.amount, isSystem: true, id: Date.now().toString() }]);
      updateTopDonators({ userId: 'roulette', username: data.senderName, amount: data.amount });
    },
    onAuctionUpdate: setAuction,
    onError: (err: any) => setConfirmConfig({ title: "Atención", message: err.message, confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) })
  });

  const handleStartAuction = () => {
    setPromptConfig({
      title: "Iniciar Subasta", icon: <Gavel className="text-yellow-500" />,
      fields: [
        { id: 'item', label: 'Artículo a subastar', placeholder: 'Ej: Lencería rosa, Videollamada...' },
        { id: 'price', label: 'Precio inicial (USD)', placeholder: 'Ej: 20', type: 'number', defaultValue: '20' },
        { id: 'duration', label: 'Minutos', placeholder: 'Ej: 3', type: 'number', defaultValue: '3' }
      ],
      submitText: "Lanzar Subasta",
      onSubmit: (v: any) => {
        if(v.item && v.price) socketRef.current?.emit('auction:start', { streamId: id, item: v.item, startingPrice: Number(v.price), durationMinutes: Number(v.duration) });
        setPromptConfig(null);
      },
      onCancel: () => setPromptConfig(null)
    });
  };

  const submitAuctionBid = (amount: number) => {
    const fanBalance = parseFloat(user?.walletBalance || 0);
    if (fanBalance < amount) {
      setConfirmConfig({ title: "Saldo Insuficiente", message: "No tienes saldo suficiente para esta puja. ¡Recarga ahora!", confirmText: "Recargar", onConfirm: () => router.push('/dashboard/wallet'), onCancel: () => setConfirmConfig(null) });
      return;
    }
    setUser((prev: any) => ({ ...prev, walletBalance: prev.walletBalance - amount }));
    socketRef.current?.emit('auction:bid', { streamId: id, senderId: user?.id, amount, senderName: user?.username });
  };

  const handleLockRoomVIP = () => {
    setPromptConfig({
      title: "Cerrar Sala VIP", icon: <Lock className="text-red-500" />,
      fields: [{ id: 'price', label: 'Costo de entrada (USD)', placeholder: 'Ej: 5', type: 'number', defaultValue: '5' }],
      submitText: "Configurar Precio",
      onSubmit: (v: any) => {
        setPromptConfig(null);
        setConfirmConfig({
          title: "¡Atención!", message: `¿Seguro que quieres cerrar la sala y cobrar $${v.price} a los que están gratis?`, confirmText: "Sí, Bloquear", confirmColor: "bg-red-600",
          onConfirm: () => { socketRef.current?.emit('activatePaywall', { streamId: id, price: Number(v.price) }); setConfirmConfig(null); },
          onCancel: () => setConfirmConfig(null)
        });
      },
      onCancel: () => setPromptConfig(null)
    });
  };

  const handleStartBattle = () => {
    setPromptConfig({
      title: "Configurar Batalla", icon: <Swords className="text-pink-500" />,
      fields: [
        { id: 'leftName', label: 'Equipo 1', placeholder: 'Ej: Team Rojo', defaultValue: 'Team Rojo' },
        { id: 'rightName', label: 'Equipo 2', placeholder: 'Ej: Team Azul', defaultValue: 'Team Azul' },
        { id: 'duration', label: 'Minutos', placeholder: 'Ej: 5', type: 'number', defaultValue: '5' }
      ],
      submitText: "Iniciar Batalla",
      onSubmit: (v: any) => {
        if(v.leftName && v.rightName) socketRef.current?.emit('battle:start', { streamId: id, leftName: v.leftName, rightName: v.rightName, durationMinutes: Number(v.duration) });
        setPromptConfig(null);
      },
      onCancel: () => setPromptConfig(null)
    });
  };

  const handleInviteGuest = () => {
    setPromptConfig({
      title: "Invitar a Cámara", icon: <UserPlus className="text-teal-500" />,
      fields: [{ id: 'username', label: 'Nombre de usuario (Sin @)', placeholder: 'Ej: fan123' }],
      submitText: "Buscar e Invitar",
      onSubmit: (v: any) => {
        const targetUsername = v.username?.trim().replace('@', '');
        if (!targetUsername) return;
        
        // 🔍 Rastreo automático del ID en el chat
        const foundMsg = messages.find((m: any) => m.user?.username?.toLowerCase() === targetUsername.toLowerCase());
        const targetId = foundMsg?.userId || foundMsg?.user?.id || foundMsg?.senderId;

        if (targetId) {
           socketRef.current?.emit('guest:invite', { streamId: id, userId: targetId });
           setPromptConfig(null);
           setConfirmConfig({ title: "Invitación Enviada", message: `Se ha invitado a @${targetUsername} a subir a la cámara.`, confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        } else {
           setConfirmConfig({ title: "Usuario no detectado", message: `No encontramos a @${targetUsername}. Pídele que escriba un simple "Hola" en el chat para que el radar lo detecte y puedas invitarlo.`, confirmText: "Entendido", hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        }
      },
      onCancel: () => setPromptConfig(null)
    });
  };

  const handleToggleSlowMode = () => {
    setPromptConfig({
      title: "Modo Lento", icon: <Timer className="text-orange-500" />,
      fields: [{ id: 'secs', label: 'Segundos entre mensajes (0 apaga)', placeholder: 'Ej: 5', type: 'number', defaultValue: '5' }],
      submitText: "Aplicar",
      onSubmit: (v: any) => { setSlowMode(Number(v.secs)); socketRef.current?.emit('slowmode:set', { streamId: id, seconds: Number(v.secs) }); setPromptConfig(null); },
      onCancel: () => setPromptConfig(null)
    });
  };

  const handleKickUser = async (uid: string, uname: string) => {
    if (uid === user.id) return;
    setConfirmConfig({
      title: "Expulsar Espectador", message: `¿Estás seguro de expulsar a @${uname} de la sala?`, confirmText: "Expulsar", confirmColor: "bg-red-600",
      onConfirm: () => { socketRef.current?.emit('kickParticipant', { streamId: id, userId: uid, username: uname }); setConfirmConfig(null); },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleEndStream = () => {
    setConfirmConfig({
      title: "Finalizar Transmisión", message: "¿Estás seguro de terminar el en vivo? Esta acción cortará la señal para todos.", confirmText: "Finalizar", confirmColor: "bg-red-600",
      onConfirm: () => { liveService.updateStatus(id as string, 'ENDED').then(() => { socketRef.current?.emit('streamEnded', { streamId: id }); router.push('/dashboard'); }); },
      onCancel: () => setConfirmConfig(null)
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!streamData?.createdAt) return;
      const isCreator = String(user?.id) === String(streamData.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';
      if (isCreator && !isLiveActive) return;
      const diff = Math.floor((Date.now() - new Date(streamData.createdAt).getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0'); const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0'); const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000); return () => clearInterval(timer);
  }, [streamData, isLiveActive, user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendHeart = () => { triggerHeart(); socketRef.current?.emit('broadcastMessage', { streamId: id, isLike: true }); };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (slowMode > 0 && Date.now() - lastMessageTime.current < slowMode * 1000) { 
      setConfirmConfig({ title: "Modo Lento", message: `Debes esperar ${slowMode} segundos entre mensajes.`, confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) }); return; 
    }
    lastMessageTime.current = Date.now(); const content = chatInput; setChatInput('');
    try {
      const res = await liveService.sendMessage(id as string, content, false, 0);
      
      // 🛡️ CREAMOS UN ID UNICO PARA RASTREARLO
      const newMsg = { ...res.chatMessage, id: res.chatMessage?.id || Date.now().toString(), senderId: user?.id };
      
      // 1. Lo mostramos localmente al instante (Velocidad de la luz)
      setMessages((prev) => [...prev.slice(-99), newMsg]);
      
      // 2. Lo enviamos al servidor con ese MISMO ID para que cuando regrese, el escudo lo destruya
      socketRef.current?.emit('broadcastMessage', { ...newMsg, streamId: id, amount: 0, isDonation: false, text: newMsg.content });
    } catch (e) { console.error(e); }
  };

  const sendGift = async (gift: Gift | Challenge, isChallenge = false) => {
    setShowGiftMenu(false); const price = isChallenge ? (gift as Challenge).price : (gift as Gift).amount;
    if (parseFloat(user?.walletBalance || 0) < price) { 
      setConfirmConfig({ title: "Saldo Insuficiente", message: "No tienes saldo suficiente. ¡Recarga tu bóveda ahora!", confirmText: "Recargar", onConfirm: () => router.push('/dashboard/wallet'), onCancel: () => setConfirmConfig(null) }); return; 
    }
    try {
      setUser((prev: any) => ({ ...prev, walletBalance: prev.walletBalance - price }));
      let battleTag = ''; if (battle?.active && !isChallenge) battleTag = battleSide === 'left' ? ` [Apoya a ${battle.leftName}]` : ` [Apoya a ${battle.rightName}]`;
      const msgContent = isChallenge ? `🔥 ¡Pagó por el reto: ${(gift as Challenge).title}!` : `${t('lbl_has_sent_a')} ${(gift as Gift).name}${battleTag}`;
      
      // 🛡️ CREAMOS EL ID ÚNICO DEL REGALO Y LO GUARDAMOS
      const msgId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      
      const giftMessage = { content: msgContent, isDonation: true, amount: price, user: { username: user?.username, role: user?.role }, userId: user?.id, senderId: user?.id, id: msgId };
      
      // 1. Mostramos el mensaje localmente
      setMessages((prev) => [...prev.slice(-99), giftMessage]);
      
      // 2. DISPARAMOS AL SERVIDOR INYECTANDO EL ID (¡El Escudo lo leerá cuando regrese!)
      socketRef.current?.emit('broadcastMessage', { 
        id: msgId, // <--- INYECCIÓN DEL ID TÁCTICO
        streamId: id, senderId: user?.id, amount: price, isDonation: true, 
        text: giftMessage.content, user: giftMessage.user, 
        giftImageUrl: isChallenge ? null : (gift as Gift).image, // Ya no mandamos la corona
        battleSide: battle?.active ? battleSide : null, 
        action: isChallenge ? null : (gift as Gift).action,
        isChallenge: isChallenge, 
        challengeTitle: isChallenge ? (gift as Challenge).title : null
      });

      // 🔥 DISPARO LOCAL DE LA ANIMACIÓN
      if (isChallenge) {
         triggerGiftEffect({ id: 999, name: (gift as Challenge).title, amount: price, image: '', style: "text-red-500 font-black", action: 'explosion' } as Gift);
      } else {
         triggerGiftEffect(gift as Gift);
      }
      
      updateTopDonators({ amount: price, userId: user?.id, user: { username: user?.username } }); handleStreak();
    } catch (error) { setConfirmConfig({ title: "Error", message: t('alert_error_gift'), confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) }); }
  };

  const spinRoulette = () => {
    const ROULETTE_PRICE = 15; setShowGiftMenu(false);
    if (parseFloat(user?.walletBalance || 0) < ROULETTE_PRICE) { 
      setConfirmConfig({ title: "Saldo Insuficiente", message: "Necesitas $15 USD para girar. ¡Recarga tu bóveda!", confirmText: "Recargar", onConfirm: () => router.push('/dashboard/wallet'), onCancel: () => setConfirmConfig(null) }); return; 
    }
    setUser((prev: any) => ({ ...prev, walletBalance: prev.walletBalance - ROULETTE_PRICE }));
    socketRef.current?.emit('spinRoulette', { streamId: id, senderId: user?.id, amount: ROULETTE_PRICE, user: { username: user?.username }, battleSide: battle?.active ? battleSide : null });
  };

  const handleFollow = async () => { try { await api.post(`/users/${streamData.creatorId}/follow`); setIsFollowing(true); } catch (e) {} };
  
  const handleBuyTicket = async () => {
    if (!streamData || isProcessing) return; setIsProcessing(true);
    try { const res = await api.post('/live/buy-ticket', { streamId: id, amount: streamData.price }); if (res.data.success) { setHasAccess(true); setUser((prev: any) => ({ ...prev, walletBalance: prev.walletBalance - streamData.price })); loadStreamData(); } } catch (error: any) { setConfirmConfig({ title: "Error", message: error.response?.data?.error || "Error.", confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) }); } finally { setIsProcessing(false); }
  };

  if (!streamData) return <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white font-mono animate-pulse">{t('lbl_connecting_gateway')}</div>;
  const isCreatorOrAdmin = String(user?.id) === String(streamData?.creatorId) || String(user?.role).toUpperCase() === 'ADMIN';

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden h-[100dvh] w-full">
      <style>{`
        @keyframes floatUpAndFade { 0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; } 10% { opacity: 1; transform: translateY(-20px) translateX(var(--tx)) scale(1.2); } 80% { opacity: 0.8; } 100% { transform: translateY(-400px) translateX(calc(var(--tx) * 2)) scale(1); opacity: 0; } }
        @keyframes slideUpDrawer { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-drawer { animation: slideUpDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-mask { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 100%); }
        @keyframes slotSpin { 0% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
      `}</style>

      {/* 🎯 META CORREGIDA (Más abajo en móvil) */}
      <div className="absolute top-[170px] sm:top-28 left-1/2 -translate-x-1/2 z-30 w-64">
        <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 px-3 flex items-center gap-2 shadow-lg pointer-events-auto cursor-pointer" onClick={() => {
          if (!isCreatorOrAdmin) return;
          setPromptConfig({ title: "Actualizar Meta", icon: <TrendingUp className="text-teal-400" />, fields: [{ id: 'goal', label: 'Meta (USD)', placeholder: 'Ej: 1000', type: 'number', defaultValue: String(targetGoal) }], submitText: "Guardar", onSubmit: (v: any) => { setTargetGoal(Number(v.goal) || targetGoal); setPromptConfig(null); }, onCancel: () => setPromptConfig(null) });
        }}>
          <TrendingUp className="w-3 h-3 text-teal-400" />
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-500" style={{ width: `${Math.min((currentGoal/targetGoal)*100, 100)}%` }}></div>
          </div>
          <span className="text-[9px] font-black font-mono text-white">${currentGoal.toFixed(2)}/${targetGoal.toFixed(2)}</span>
        </div>
      </div>

      <BattleOverlay battle={battle} />
      <AuctionOverlay auction={auction} isCreator={isCreatorOrAdmin} onBid={submitAuctionBid} />

      <div className="absolute inset-0 z-0 bg-[#050505] [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full" onContextMenu={(e) => e.preventDefault()}>
        {hasAccess && liveKitToken ? (
          <LiveKitRoom video={isCreatorOrAdmin ? isLiveActive : false} audio={isCreatorOrAdmin ? isLiveActive : false} token={liveKitToken} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live.fansmio.com"} options={roomOptions} className="w-full h-full relative">
            <ParticipantsTracker onUpdate={setConnectedUsers} />
            <StreamStage />
            <RoomAudioRenderer />

            <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none pb-safe">
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none -z-10"></div>
              <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none -z-10"></div>
              
              <div className="pt-4 px-2 sm:px-4 flex justify-between items-start pointer-events-auto">
                
                {/* 🛡️ IZQUIERDA: Perfil y Botones del Creador */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 shadow-lg cursor-pointer hover:bg-black/50 transition-colors max-w-fit">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-inner overflow-hidden border border-white/20 mr-2">
                      {streamData.creator?.profileImage ? <img src={streamData.creator.profileImage} alt="perfil" className="w-full h-full object-cover" /> : streamData.creator?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col mr-3">
                      <span className="text-sm font-bold leading-tight text-white">{streamData.creator?.username || t('lbl_creator')}</span>
                      <span className="text-[10px] text-gray-300 font-medium">{connectedUsers.length > 0 ? connectedUsers.length : viewersCount} {t('lbl_viewing')}</span>
                    </div>
                    {!isCreatorOrAdmin && <button onClick={handleFollow} disabled={isFollowing} className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${isFollowing ? 'bg-gray-600 text-gray-400 cursor-default' : 'bg-teal-500 text-white hover:scale-105'}`}>{isFollowing ? 'SIGUIENDO' : t('btn_follow')}</button>}
                  </div>

                  {isCreatorOrAdmin && isLiveActive && (
                    <div className="flex flex-wrap gap-1.5 max-w-[200px] sm:max-w-[250px]">
                      <button onClick={handleInviteGuest} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 hover:bg-white/20 transition-all text-[10px] sm:text-xs font-bold shadow-lg text-teal-400"><UserPlus className="w-3.5 h-3.5" /> Invitar</button>
                      <button onClick={handleStartBattle} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 hover:bg-white/20 transition-all text-[10px] sm:text-xs font-bold shadow-lg text-pink-400"><Swords className="w-3.5 h-3.5" /> Batalla</button>
                      <button onClick={() => setShowChallengeManager(true)} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 hover:bg-white/20 transition-all text-[10px] sm:text-xs font-bold shadow-lg text-red-400"><Target className="w-3.5 h-3.5" /> Mis Retos</button>
                      <button onClick={handleStartAuction} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 hover:bg-white/20 transition-all text-[10px] sm:text-xs font-bold shadow-lg text-yellow-400"><Gavel className="w-3.5 h-3.5" /> Subasta</button>
                    </div>
                  )}
                </div>

                {/* 🛡️ DERECHA: Controles (Ahora envuelven si falta espacio) */}
                <div className="flex flex-col items-end gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end max-w-[100px] sm:max-w-none">
                    {isCreatorOrAdmin && <button onClick={handleToggleSlowMode} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full backdrop-blur-md flex items-center justify-center border shadow-lg transition-colors ${slowMode > 0 ? 'bg-orange-500/80 border-orange-500/50 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}><Timer className="w-4 h-4 sm:w-4 sm:h-4" /></button>}
                    {isCreatorOrAdmin && <button onClick={handleLockRoomVIP} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600/80 backdrop-blur-md flex items-center justify-center border border-red-500/50 text-white hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)]"><Lock className="w-4 h-4 sm:w-4 sm:h-4" /></button>}
                    <button onClick={() => setShowViewersModal(true)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors shadow-lg"><Eye className="w-4 h-4 sm:w-4 sm:h-4" /></button>
                    <button onClick={isCreatorOrAdmin ? handleEndStream : () => router.push('/explore')} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors shadow-lg"><X className="w-4 h-4 sm:w-4 sm:h-4" /></button>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono bg-black/40 px-2 py-1 rounded-full text-gray-300 backdrop-blur-sm border border-white/5">{uptime}</span>
                </div>
              </div>

              <div className="absolute right-2 sm:right-4 top-[240px] sm:top-44 flex flex-col items-end gap-2 pointer-events-auto">
                {topDonators.length > 0 && (
                  <div className="bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-green-500/20 shadow-lg min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 mb-1 border-b border-white/10 pb-1">< Trophy className="w-3 h-3 text-green-400" /> <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">Top Fans</span></div>
                    {topDonators.map((u, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between gap-3 mt-1"><span className="text-white font-bold truncate max-w-[50px]">{u.username}</span><span className="text-green-400 font-mono font-black flex items-center gap-0.5">${u.amount.toFixed(2)}</span></div>
                    ))}
                  </div>
                )}
                {streak > 1 && <div className="bg-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-500/50 flex items-center gap-1.5 animate-pulse mt-2"><Zap className="w-3 h-3 text-orange-400 fill-orange-500" /><span className="text-orange-400 font-black text-xs">Combo x{streak}</span></div>}
              </div>

              {giftEffect && <GiftEffectOverlay giftEffect={giftEffect} />}
              {rouletteEvent && <RouletteOverlay event={rouletteEvent} />}

              <div className="w-full px-4 pb-4 md:w-[500px] pointer-events-auto relative z-20">
                <div ref={heartsContainerRef} className="absolute bottom-16 right-4 w-16 h-64 pointer-events-none overflow-visible z-0" />
                <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-2 custom-mask pr-14 relative z-10">
                  {messages.map((msg: any, i: number) => {
                    if (msg.isSystem) return <div key={i} className={`text-[11px] font-bold px-3 py-1 bg-black/30 backdrop-blur-md rounded-xl w-fit border ${msg.content.includes('🔨') ? 'text-yellow-400/90 border-yellow-500/20' : 'text-teal-400/90 border-teal-500/20'}`}>{msg.content}</div>;
                    const gift = msg.isDonation ? GIFTS.find(g => g.amount === msg.amount) : null;
                    const canModerate = isCreatorOrAdmin && msg.user?.id !== user?.id;
                    return (
                      <div key={i} className={`text-[13px] px-3 py-1.5 rounded-2xl w-fit max-w-[100%] group/msg flex flex-col leading-tight animate-fade-in ${msg.isDonation ? 'bg-gradient-to-r from-green-500/20 to-black/30 border border-green-500/50 backdrop-blur-md shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`}>
                        <div className="flex items-center gap-1.5">
                          {msg.isDonation && <DollarSign className="w-3 h-3 text-green-400" />}
                          <span className={`font-bold ${msg.user?.role === 'ADMIN' ? 'text-red-400' : 'text-gray-300'}`}>{msg.user?.username}:</span>
                          
                          {/* 🔥 LOS CONTROLES RÁPIDOS 1-CLIC PARA EL CREADOR */}
                          {canModerate && (
                            <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                              <button onClick={() => {
                                 const targetId = msg.userId || msg.user?.id || msg.senderId;
                                 if(targetId) {
                                   socketRef.current?.emit('guest:invite', { streamId: id, userId: targetId });
                                   setConfirmConfig({ title: "Invitación Enviada", message: `Has invitado a @${msg.user?.username} a la cámara compartida.`, confirmText: "Genial", hideCancel: true, onConfirm: () => setConfirmConfig(null) });
                                 }
                              }} className="text-[9px] bg-teal-600 hover:bg-teal-500 text-white px-1.5 py-0.5 rounded font-black uppercase shadow-md transition-colors">Subir</button>
                              
                              <button onClick={() => handleKickUser(msg.userId || msg.user?.id, msg.user?.username)} className="text-[9px] bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase shadow-md transition-colors">Kick</button>
                            </div>
                          )}
                        </div>
                        <span className={`mt-0.5 ${gift ? gift.style : 'text-white font-medium'} drop-shadow-md`}>{msg.content}</span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2 items-center mt-2 relative z-30">
                  <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center px-4 py-2 shadow-lg focus-within:border-teal-500/50 transition-colors">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={slowMode > 0 ? `Modo lento: ${slowMode}s` : t('ph_chat')} className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-300 font-medium" />
                    {chatInput.trim() && <button onClick={handleSendMessage} className="text-teal-400 hover:text-teal-300 transition-colors p-1"><Send className="w-4 h-4" /></button>}
                  </div>
                  {!isCreatorOrAdmin && <button onClick={() => setShowGiftMenu(true)} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105 transition-transform shrink-0"><Diamond className="w-5 h-5 text-black fill-black" /></button>}
                  {!isCreatorOrAdmin && <button onClick={handleSendHeart} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:scale-105 transition-transform active:scale-95 shrink-0"><Heart className="w-5 h-5 text-white fill-white" /></button>}
                  {isCreatorOrAdmin && isLiveActive && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center shadow-lg px-1 py-0.5">
                      <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }} className="flex gap-1 [&_.lk-button]:!bg-transparent [&_.lk-button]:!text-white [&_.lk-button:hover]:!bg-white/20 [&_.lk-button]:!rounded-full [&_.lk-button]:!p-2 [&_.lk-button]:!m-0 [&_.lk-button]:!w-10 [&_.lk-button]:!h-10 [&_.lk-button]:!flex [&_.lk-button]:!items-center [&_.lk-button]:!justify-center" />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </LiveKitRoom>
        ) : <div className="w-full h-full flex items-center justify-center opacity-30"><Tv className="w-16 h-16 animate-pulse" /></div>}
      </div>

      {!hasAccess && <PaywallLayer price={streamData?.price || 0} isProcessing={isProcessing} onBuy={handleBuyTicket} />}
      {isCreatorOrAdmin && !isLiveActive && hasAccess && <PreparationLayer onStart={() => setIsLiveActive(true)} />}

      {showGiftMenu && (
        <>
          <div className="absolute inset-0 bg-black/40 z-40 pointer-events-auto" onClick={() => setShowGiftMenu(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:w-[400px] bg-[#111]/95 backdrop-blur-2xl border-t border-x md:border-y border-white/10 rounded-t-3xl md:rounded-3xl p-6 pb-8 animate-drawer shadow-2xl z-50 pointer-events-auto">
            {battle?.active && (
              <div className="flex gap-2 mb-4 bg-black/50 p-1.5 rounded-xl border border-white/10">
                <button onClick={() => setBattleSide('left')} className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-black transition-all border ${battleSide === 'left' ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_10px_rgba(244,114,182,0.4)]' : 'border-transparent text-gray-500 hover:text-white'}`}>Votar: {battle.leftName}</button>
                <button onClick={() => setBattleSide('right')} className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-black transition-all border ${battleSide === 'right' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(96,165,250,0.4)]' : 'border-transparent text-gray-500 hover:text-white'}`}>Votar: {battle.rightName}</button>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3 bg-black/50 p-1 rounded-xl border border-white/10">
                <button onClick={() => setGiftTab('GIFTS')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${giftTab === 'GIFTS' ? 'bg-teal-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}><Diamond className="w-3 h-3"/> REGALOS</button>
                <button onClick={() => setGiftTab('CHALLENGES')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${giftTab === 'CHALLENGES' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Target className="w-3 h-3"/> RETOS</button>
              </div>
              <div className="text-xs bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full font-mono text-green-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> <span className="font-bold">{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={spinRoulette} className="w-full mb-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-95 text-white font-black uppercase py-3 rounded-xl text-sm transition-all shadow-[0_5px_20px_rgba(192,132,252,0.4)] flex items-center justify-center gap-2 border border-pink-400/50">
              <Dices className="w-5 h-5"/> GIRAR RULETA CALIENTE - $15.00
            </button>
            {giftTab === 'GIFTS' ? (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {GIFTS.map((gift) => (
                  <button key={gift.id} onClick={() => sendGift(gift, false)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/50 p-2 rounded-2xl transition-all flex flex-col items-center group shadow-sm"><img src={gift.image} alt={gift.name} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform mb-1 drop-shadow-lg" /><span className="text-[9px] text-gray-300 font-bold text-center leading-tight truncate w-full">{t(`gift_name_${gift.id}`) || gift.name}</span><span className="text-[10px] text-green-400 font-mono font-black mt-1 flex items-center gap-0.5">${gift.amount.toFixed(2)}</span></button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {challenges.filter(c => c.isActive).length === 0 ? <div className="text-center text-gray-500 py-10 text-xs font-bold">El creador no tiene retos activos ahora mismo.</div> : challenges.filter(c => c.isActive).map(challenge => (
                  <button key={challenge.id} onClick={() => sendGift(challenge, true)} className="bg-gradient-to-r from-red-900/40 to-black hover:from-red-800/60 border border-red-500/30 p-3 rounded-xl transition-all flex items-center justify-between group text-left"><div><div className="text-red-400 font-black text-sm group-hover:text-red-300">{challenge.title}</div>{challenge.description && <div className="text-gray-400 text-[10px] mt-0.5 max-w-[200px]">{challenge.description}</div>}</div><div className="bg-red-500/20 text-red-400 font-mono font-black px-3 py-1.5 rounded-lg border border-red-500/50">${challenge.price.toFixed(2)}</div></button>
                ))}
              </div>
            )}
            <button onClick={() => router.push('/dashboard/wallet')} className="w-full mt-4 bg-transparent border border-white/10 hover:bg-white/5 active:scale-95 text-gray-300 font-bold uppercase py-2 rounded-xl text-xs transition-all">Recargar Bóveda</button>
          </div>
        </>
      )}

      {/* 🔥 RENDERIZADO DE MODALES DINÁMICOS */}
      {promptConfig && <DynamicPromptModal config={promptConfig} />}
      {confirmConfig && <DynamicConfirmModal config={confirmConfig} />}

      {showChallengeManager && <ChallengeManagerModal challenges={challenges} setChallenges={setChallenges} onClose={() => setShowChallengeManager(false)} setConfirmConfig={setConfirmConfig} />}
      {showViewersModal && <ViewersModal connectedUsers={connectedUsers} onClose={() => setShowViewersModal(false)} />}
    </div>
  );
}

// ==========================================================
// 🛠️ MODALES DINÁMICOS (Reemplazan prompt y confirm nativos)
// ==========================================================

function DynamicPromptModal({ config }: { config: any }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    config.fields.forEach((f: any) => init[f.id] = f.defaultValue || '');
    return init;
  });

  return (
    <div className="absolute inset-0 z-[100002] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <h3 className="text-white font-black text-lg flex items-center gap-2">{config.icon} {config.title}</h3>
          <button onClick={config.onCancel} className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {config.fields.map((f: any) => (
            <div key={f.id}>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">{f.label}</label>
              <input type={f.type || 'text'} placeholder={f.placeholder} value={values[f.id]} onChange={e => setValues({...values, [f.id]: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50 transition-colors" />
            </div>
          ))}
          <button onClick={() => config.onSubmit(values)} className="w-full mt-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:scale-[1.02] active:scale-95 text-white font-black uppercase py-3 rounded-xl text-sm transition-all shadow-lg">
            {config.submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

function DynamicConfirmModal({ config }: { config: any }) {
  return (
    <div className="absolute inset-0 z-[100002] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in text-center p-6">
         <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
           <AlertTriangle className="w-8 h-8 text-yellow-500" />
         </div>
         <h3 className="text-white font-black text-xl mb-2">{config.title}</h3>
         <p className="text-gray-400 text-sm mb-6 leading-relaxed">{config.message}</p>
         <div className="flex gap-3">
            {!config.hideCancel && (
              <button onClick={config.onCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors text-sm">Cancelar</button>
            )}
            <button onClick={config.onConfirm} className={`flex-1 ${config.confirmColor || 'bg-teal-600 hover:bg-teal-500'} text-white font-black py-3 rounded-xl transition-colors shadow-lg text-sm`}>{config.confirmText || 'Confirmar'}</button>
         </div>
      </div>
    </div>
  );
}

// ==========================================================
// 🛠️ COMPONENTES TÁCTICOS BLINDADOS
// ==========================================================

function AuctionOverlay({ auction, isCreator, onBid }: { auction: any, isCreator: boolean, onBid: (amount: number) => void }) {
  // 1. TODOS LOS ESTADOS ARRIBA
  const [timeLeft, setTimeLeft] = useState(0);
  const [customBid, setCustomBid] = useState('');
  const [hide, setHide] = useState(false); 

  // 2. TODOS LOS EFECTOS ARRIBA
  useEffect(() => {
    if (!auction || !auction.active) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((auction.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const isFinished = timeLeft <= 0;

  useEffect(() => {
    if (auction && auction.active && isFinished) {
      const timer = setTimeout(() => setHide(true), 5000); // Se oculta a los 5 segundos
      return () => clearTimeout(timer);
    } else {
      setHide(false); // Resetea si empieza una nueva subasta
    }
  }, [isFinished, auction]);

  // 3. AHORA SÍ, LOS RETORNOS (CORTES)
  if (!auction || !auction.active || hide) return null;

  const mins = Math.floor(timeLeft / 60); 
  const secs = timeLeft % 60;

  // 4. EL RENDERIZADO VISUAL
  return (
    <div className="absolute top-[250px] sm:top-44 left-1/2 -translate-x-1/2 w-64 sm:w-72 z-40 pointer-events-auto">
      <div className={`bg-gradient-to-b from-yellow-900/90 to-black border-2 border-yellow-500 rounded-3xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.4)] ${isFinished ? 'animate-pulse' : 'animate-fade-in'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1 text-yellow-400 font-black text-xs uppercase tracking-widest"><Gavel className="w-4 h-4"/> SUBASTA</div>
          <div className="text-white font-mono text-xs bg-black/50 px-2 py-1 rounded-md">{isFinished ? 'FINALIZADA' : `${mins}:${secs.toString().padStart(2, '0')}`}</div>
        </div>
        
        <h3 className="text-white font-bold text-sm text-center mb-1 leading-tight">{auction.item}</h3>
        
        <div className="bg-black/50 rounded-xl p-3 text-center my-3 border border-yellow-500/30">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Mejor Puja</div>
          <div className="text-3xl font-black text-yellow-400 font-mono tracking-tighter">${auction.currentBid.toFixed(2)}</div>
          <div className="text-[10px] text-yellow-200 mt-1">{auction.highestBidderName ? `por @${auction.highestBidderName}` : '¡Sé el primero en pujar!'}</div>
        </div>

        {!isCreator && !isFinished && (
          <div className="flex gap-2">
            <button onClick={() => onBid(auction.currentBid + 5)} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2 rounded-xl text-xs transition-colors shadow-md">
              + $5 USD
            </button>
            <div className="flex-1 flex">
              <input type="number" placeholder="Ej: 50" value={customBid} onChange={e => setCustomBid(e.target.value)} className="w-full bg-black border border-yellow-500/50 rounded-l-xl px-2 text-white text-xs font-mono outline-none" />
              <button onClick={() => { if(Number(customBid) > auction.currentBid) onBid(Number(customBid)); }} className="bg-yellow-600 hover:bg-yellow-500 px-2 rounded-r-xl text-black font-black text-xs">GO</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RouletteOverlay({ event }: { event: {senderName: string, prize: string} }) {
  const [isSpinning, setIsSpinning] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setIsSpinning(false), 3000); return () => clearTimeout(timer); }, []);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-b from-purple-900/90 to-black border-2 border-pink-500 rounded-3xl shadow-[0_0_80px_rgba(236,72,153,0.5)] transition-all transform ${isSpinning ? 'scale-100' : 'scale-110'}`}>
        <Dices className={`w-16 h-16 text-pink-400 mb-4 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] ${isSpinning ? 'animate-spin' : 'animate-bounce'}`} />
        <h2 className="text-white font-black text-xl mb-2 uppercase tracking-widest text-center">{event.senderName} Giró la Ruleta!</h2>
        <div className="w-full h-1 bg-white/20 rounded-full mb-6 overflow-hidden relative">{isSpinning && <div className="absolute top-0 left-0 h-full bg-pink-500 w-1/3 animate-[slide_1s_infinite_linear]"></div>}</div>
        <div className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 text-center uppercase tracking-tighter ${isSpinning ? 'animate-pulse blur-[2px]' : 'drop-shadow-[0_0_20px_rgba(236,72,153,1)]'}`}>{isSpinning ? 'Calculando...' : event.prize}</div>
      </div>
    </div>
  );
}

function ChallengeManagerModal({ challenges, setChallenges, onClose, setConfirmConfig }: { challenges: Challenge[], setChallenges: any, onClose: () => void, setConfirmConfig: any }) {
  const [title, setTitle] = useState(''); 
  const [desc, setDesc] = useState(''); 
  const [price, setPrice] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  const handleAdd = async () => {
    if (!title || !price) return;
    setLoading(true);
    try { 
      const data = await liveService.createChallenge(title, desc, Number(price)); 
      setChallenges((prev: any) => [...prev, data.challenge]); 
      setTitle(''); setDesc(''); setPrice(''); 
    } catch (e) { 
      setConfirmConfig({ title: "Error", message: "Error al crear el reto", confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) }); 
    }
    setLoading(false);
  };
  
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try { 
      await liveService.toggleChallenge(id, !currentStatus); 
      setChallenges((prev: any) => prev.map((c: any) => c.id === id ? { ...c, isActive: !currentStatus } : c)); 
    } catch (e) { 
      setConfirmConfig({ title: "Error", message: "Error al actualizar", confirmText: "OK", hideCancel: true, onConfirm: () => setConfirmConfig(null) }); 
    }
  };
  
  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: "Eliminar Reto", message: "¿Borrar este reto para siempre?", confirmText: "Borrar", confirmColor: "bg-red-600 hover:bg-red-500",
      onConfirm: async () => {
        setConfirmConfig(null);
        try { await liveService.deleteChallenge(id); setChallenges((prev: any) => prev.filter((c: any) => c.id !== id)); } catch (e) { }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };
  
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-[#111] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-red-900/30 to-transparent">
          <h3 className="text-white font-black text-lg flex items-center gap-2"><Target className="w-5 h-5 text-red-500" /> Mis Retos VIP</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6">
            <h4 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-widest">Crear Nuevo Reto</h4>
            <div className="space-y-3">
              <input type="text" placeholder="Ej: Bailar 10 segundos" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50" />
              
              {/* 🔥 CORRECCIÓN AQUÍ: Se ajustaron los flex y shrink para móvil */}
              <div className="flex gap-3">
                <input type="text" placeholder="Detalle (opcional)" value={desc} onChange={e => setDesc(e.target.value)} className="flex-1 min-w-0 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50" />
                <div className="relative w-24 sm:w-28 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-7 pr-2 py-2.5 text-sm text-white font-mono font-bold outline-none focus:border-red-500/50" />
                </div>
              </div>

              <button onClick={handleAdd} disabled={loading || !title || !price} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Guardando...' : '+ Añadir a mi lista'}
              </button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {challenges.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">No has creado ningún reto todavía.</div>
            ) : (
              challenges.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${c.isActive ? 'bg-red-900/10 border-red-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{c.title} <span className="text-green-400 font-mono text-xs ml-2">${c.price.toFixed(2)}</span></div>
                    {c.description && <div className="text-[10px] text-gray-400">{c.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(c.id, c.isActive)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamStage() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const visibleTracks = tracks.slice(0, 4); 
  const layout = visibleTracks.length <= 1 ? "grid-cols-1" : visibleTracks.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";
  return (
    <div className="w-full h-full flex flex-col relative bg-transparent"><div className="absolute inset-0 z-0"><div className={`grid ${layout} w-full h-full [&_video]:!object-cover`}>{visibleTracks.map((track) => ( <ParticipantTile key={track.participant.identity} trackRef={track} /> ))}</div></div></div>
  );
}

function BattleOverlay({ battle }: { battle: any }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!battle || !battle.active) return;
    const interval = setInterval(() => { const remaining = Math.max(0, Math.floor((battle.endTime - Date.now()) / 1000)); setTimeLeft(remaining); }, 1000);
    return () => clearInterval(interval);
  }, [battle]);
  if (!battle || !battle.active) return null;

  const total = (battle.leftScore || 0) + (battle.rightScore || 0);
  const leftPct = total ? (battle.leftScore / total) * 100 : 50;
  const mins = Math.floor(timeLeft / 60); const secs = timeLeft % 60; const isFinished = timeLeft <= 0;
  const winner = battle.leftScore >= battle.rightScore ? battle.leftName : battle.rightName;

  return (
    <div className="absolute top-[210px] sm:top-36 left-0 w-full px-4 sm:px-8 z-30 animate-fade-in pointer-events-none">
      <div className="flex flex-col items-center mb-1">
        {isFinished ? <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-bounce">¡TIEMPO! GANA: {winner}</span> : <span className="bg-red-600 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-lg flex items-center gap-1 animate-pulse"><Timer className="w-3 h-3"/> {mins}:{secs.toString().padStart(2, '0')}</span>}
      </div>
      <div className="flex justify-between w-full px-2 mb-1 text-[9px] font-black uppercase text-white drop-shadow-md"><span>{battle.leftName}</span><span>{battle.rightName}</span></div>
      <div className="h-6 bg-black/60 rounded-full flex overflow-hidden border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="bg-gradient-to-r from-pink-600 to-pink-400 transition-all duration-700 ease-out flex items-center pl-2" style={{ width: `${leftPct}%` }}><span className="text-white text-[10px] font-black">${battle.leftScore.toFixed(2)}</span></div>
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 flex-1 transition-all duration-700 ease-out flex items-center justify-end pr-2"><span className="text-white text-[10px] font-black">${battle.rightScore.toFixed(2)}</span></div>
      </div>
    </div>
  );
}

function useLiveSocket({ id, user, streamData, onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal, onBattleUpdate, onSlowModeUpdate, onRouletteSpun, onAuctionUpdate, onError }: any) {
  const socketRef = useRef<Socket | null>(null);
  const callbacks = useRef({ onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal, onBattleUpdate, onSlowModeUpdate, onRouletteSpun, onAuctionUpdate, onError });
  useEffect(() => { callbacks.current = { onLike, onMessage, onViewerCount, onStreamKilled, onPaywallActivated, onUpdateGoal, onBattleUpdate, onSlowModeUpdate, onRouletteSpun, onAuctionUpdate, onError }; });
  
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
    socketInstance.on('newLiveMessage', (msg: any) => { if (msg.isLike) callbacks.current.onLike(); else callbacks.current.onMessage(msg); });
    socketInstance.on('viewerCountUpdated', ({ count }: { count: number }) => callbacks.current.onViewerCount(count));
    socketInstance.on('streamKilled', () => { if (String(user.id) !== String(streamData?.creatorId)) callbacks.current.onStreamKilled(); });
    socketInstance.on('paywallActivated', ({ price }: { price: number }) => { if (callbacks.current.onPaywallActivated) callbacks.current.onPaywallActivated(price); });
    socketInstance.on('updateLiveGoal', ({ amount }: { amount: number }) => { if (callbacks.current.onUpdateGoal) callbacks.current.onUpdateGoal(amount); });
    socketInstance.on('battle:update', (data: any) => { if (callbacks.current.onBattleUpdate) callbacks.current.onBattleUpdate(data); });
    socketInstance.on('slowmode:update', (seconds: number) => { if (callbacks.current.onSlowModeUpdate) callbacks.current.onSlowModeUpdate(seconds); });
    socketInstance.on('rouletteSpun', (data: any) => { if (callbacks.current.onRouletteSpun) callbacks.current.onRouletteSpun(data); });
    socketInstance.on('auction:update', (data: any) => { if (callbacks.current.onAuctionUpdate) callbacks.current.onAuctionUpdate(data); });
    socketInstance.on('error', (err: any) => { if (callbacks.current.onError) callbacks.current.onError(err); });
    return () => { socketInstance.disconnect(); };
  }, [user?.id, id, streamData?.creatorId]); 
  return socketRef;
}

function PreparationLayer({ onStart }: { onStart: () => void }) {
  const t = useTranslations('LiveRoom'); 
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm px-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 border border-teal-500/30 relative">
          <div className="absolute inset-0 rounded-full border border-teal-500 animate-ping opacity-50"></div><Tv className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{t('prep_title')}</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">{t('prep_desc')}</p>
        <button onClick={onStart} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-black text-lg py-4 rounded-full shadow-[0_10px_30px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105"><Play className="w-5 h-5 fill-white" /> {t('btn_start_stream')}</button>
      </div>
    </div>
  );
}

function PaywallLayer({ price, isProcessing, onBuy }: { price: number, isProcessing: boolean, onBuy: () => void }) {
  const t = useTranslations('LiveRoom'); const router = useRouter(); const [timeLeft, setTimeLeft] = useState(15); 
  useEffect(() => { if (timeLeft <= 0) { router.push('/explore'); return; } const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000); return () => clearInterval(timer); }, [timeLeft, router]);
  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 pointer-events-auto">
      <div className="text-center p-8 bg-[#0a0a0a] rounded-[2rem] border border-red-500/30 shadow-[0_0_80px_rgba(220,38,38,0.2)] max-w-sm w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div><Lock className="w-12 h-12 text-red-500 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        <h2 className="text-white font-black text-2xl tracking-tight uppercase">¡SALA PRIVADA!</h2>
        <div className="my-6"><span className={`text-6xl font-black font-mono tracking-tighter ${timeLeft <= 5 ? 'text-red-500 animate-pulse scale-110 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'text-white'}`}>00:{timeLeft.toString().padStart(2, '0')}</span></div>
        <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/5 nm-inset">
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{t('lbl_ticket_cost')}</div><div className="text-4xl font-black text-teal-400 font-mono tracking-tight">${price.toFixed(2)} <span className="text-sm text-gray-500 font-sans">USD</span></div>
        </div>
        <button onClick={onBuy} disabled={isProcessing} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-black py-4 rounded-xl text-sm hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">{isProcessing ? t('btn_processing') : <><Star className="w-4 h-4 fill-white"/> DESBLOQUEAR AHORA</>}</button>
      </div>
    </div>
  );
}

function GiftEffectOverlay({ giftEffect }: { giftEffect: Gift }) {
  // 🔥 INTERFAZ ESPECIAL PARA RETOS PAGADOS (ID 999)
  if (giftEffect.id === 999) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="text-center animate-[bounce_1s_infinite] flex flex-col items-center px-8 py-6 bg-gradient-to-b from-red-600/90 to-red-900/90 backdrop-blur-xl border-4 border-red-500 rounded-3xl shadow-[0_0_80px_rgba(220,38,38,0.8)] transform scale-110">
          <div className="text-5xl mb-2 animate-pulse">🚨</div>
          <h2 className="text-white font-black text-xl uppercase tracking-widest mb-1 drop-shadow-md">¡RETO PAGADO!</h2>
          <div className="text-3xl md:text-4xl font-black text-yellow-300 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] mt-2">
            {giftEffect.name}
          </div>
        </div>
      </div>
    );
  }

  // 🎁 INTERFAZ NORMAL PARA REGALOS
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
          <h3 className="text-white font-black text-base flex items-center gap-2"><Eye className="w-4 h-4 text-teal-400" /> {t('modal_viewers_title')} ({connectedUsers.length})</h3><button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-red-500 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {connectedUsers.length === 0 ? <div className="text-center text-gray-500 py-10 font-medium text-sm">{t('modal_viewers_empty')}</div> : connectedUsers.map((p, i) => {
            const displayName = p.name || p.identity || t('lbl_user');
            return (
              <div key={p.identity || i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg border border-white/10">{displayName.charAt(0).toUpperCase()}</div>
                <div className="flex flex-col"><span className="text-sm font-bold text-white">{displayName}</span><span className="text-[10px] text-teal-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> {t('lbl_connected')}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ParticipantsTracker({ onUpdate }: { onUpdate: (participants: any[]) => void }) {
  const participants = useParticipants();
  useEffect(() => { onUpdate(participants); }, [participants, onUpdate]); return null;
}