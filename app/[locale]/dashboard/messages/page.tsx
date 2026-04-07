"use client";

import { useState, useEffect, useRef, Suspense } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { chatService } from '../../../../lib/chatService';
import { paymentService } from '../../../../lib/paymentService'; 
import api from '../../../../lib/api'; 
import PaymentModal from '../../../../components/PaymentModal'; 
import ReportModal from '../../../../components/ReportModal'; 

import { 
  MessageCircle, 
  Megaphone, 
  Search, 
  Flag, 
  Ban, 
  Unlock, 
  Lock, 
  Trash2, 
  Image as ImageIcon, 
  Paperclip, 
  Mic, 
  Square, 
  X, 
  CircleDollarSign, 
  ArrowLeft, 
  Send,
  Eye,
  Maximize,
  Smile
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const QUICK_EMOJIS = ['❤️', '❤️‍🔥', '🫦', '🤤','😋', '😘', '😍','💔','😡','😢', '😏', '😄'];

const getImageUrl = (path: string | null) => {
  if (!path || path === 'null') return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${cleanPath}`;
};

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [activeChat, setActiveChat] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]); 
  const [messages, setMessages] = useState<any[]>([]); 
  
  // 🔥 ESTADOS PARA LA PAGINACIÓN (ESCALABILIDAD)
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isPPVMode, setIsPPVMode] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);

  const [isGodMode, setIsGodMode] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [selectedMessageToUnlock, setSelectedMessageToUnlock] = useState<any>(null);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastPrice, setBroadcastPrice] = useState('');
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);

  const [isFlashing, setIsFlashing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);

  const [expandedMedia, setExpandedMedia] = useState<{url: string, type: 'video'|'image'} | null>(null);

  const [showEmojis, setShowEmojis] = useState(false);
  const emojiMenuRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user && user !== "undefined") {
        setCurrentUser(JSON.parse(user));
      } else {
        router.push('/auth');
      }
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (currentUser) fetchConversations(true); 
  }, [currentUser, isGodMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    };
    if (showEmojis) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojis]);

  // 🔥 POLLING BLINDADO PARA MENSAJES NUEVOS
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeChat && activeChat.id) { 
      interval = setInterval(async () => {
        try {
          // Solo pedimos la página 1 para ver si hay algo nuevo, protegiendo el servidor
          const data = await chatService.getMessages(activeChat.id, 1);
          const incomingMessages = data.messages || [];
          
          setMessages(prev => {
            if (incomingMessages.length === 0) return prev;
            
            const lastPrevMsg = prev[prev.length - 1];
            const lastIncomingMsg = incomingMessages[incomingMessages.length - 1];

            // Si hay un mensaje nuevo que no teníamos, lo añadimos sin borrar el historial
            if (lastPrevMsg && lastIncomingMsg && lastPrevMsg.id !== lastIncomingMsg.id) {
               const newMsgs = incomingMessages.filter((incMsg: any) => !prev.some((pMsg: any) => pMsg.id === incMsg.id));
               if (newMsgs.length > 0) {
                 if (newMsgs[newMsgs.length - 1].senderId !== 'me' && !isGodMode) triggerNewMessageAlert();
                 return [...prev, ...newMsgs];
               }
            } else if (prev.length === 0 && incomingMessages.length > 0) {
               return incomingMessages;
            }
            return prev;
          });
        } catch (error) {}
      }, 3000); 
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChat, isGodMode]);

  const triggerNewMessageAlert = () => {
    try {
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-30.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch(e) {} 
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1000);
  };

  const fetchConversations = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setIsLoading(true);
      let chats = [];

      if (isGodMode && currentUser?.role === 'ADMIN') {
        const res = await api.get('/messages/admin/all');
        chats = res.data.conversations.map((c: any) => ({
           id: c.id,
           user: { 
             id: 'admin_view', 
             username: `${c.creator?.username || 'U1'} 💬 ${c.fan?.username || 'U2'}` 
           },
           lastMsg: c.lastMsg,
           time: c.time, 
           unread: false,
           isGodModeChat: true
        }));
      } else {
        const data = await chatService.getConversations();
        chats = data.conversations || [];
      }

      setConversations(chats);

      const chatWithId = searchParams?.get('chatWith');
      const chatWithName = searchParams?.get('name');

      if (isInitialLoad && chatWithId && !isGodMode) {
        const existingChat = chats.find((c: any) => c.user?.id === chatWithId);
        if (existingChat) {
          handleSelectChat(existingChat);
        } else {
          setActiveChat({
            id: '', 
            user: { id: chatWithId, username: chatWithName || 'Usuario' }
          });
          setMessages([]);
        }
      } else if (isInitialLoad && !isGodMode) {
        const lastChatId = localStorage.getItem('lastOpenedChat');
        if (lastChatId) {
          const chatToRestore = chats.find((c: any) => c.id === lastChatId);
          if (chatToRestore) {
            handleSelectChat(chatToRestore); 
          } else {
            localStorage.removeItem('lastOpenedChat');
          }
        }
      }
    } catch (error) {
       console.error("Error al cargar conversaciones:", error);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  };

  const handleSelectChat = async (chat: any) => {
    if (!chat || !chat.id || chat.id === '') return;
    setActiveChat(chat); 
    if (!isGodMode) localStorage.setItem('lastOpenedChat', chat.id); 
    setIsBlockedByMe(false); 
    
    // Resetear paginación al abrir chat
    setPage(1);
    setHasMoreMessages(true);
    setMessages([]);

    try {
      const data = await chatService.getMessages(chat.id, 1);
      const initialMsgs = data.messages || [];
      setMessages(initialMsgs);
      
      // Si devolvió muy pocos, asumimos que no hay más historial arriba
      if (initialMsgs.length < 20) setHasMoreMessages(false);
      
      if (!isGodMode) {
        const blockData = await chatService.checkBlockStatus(chat.user.id);
        setIsBlockedByMe(blockData.isBlocked);
      }
      
      if (!isGodMode) fetchConversations(); 
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
    } catch (error) {}
  };

  // 🔥 LÓGICA DE INFINITE SCROLL (PAGINACIÓN HACIA ARRIBA)
  const handleScroll = async () => {
    if (!chatScrollRef.current || isLoadingMore || !hasMoreMessages || !activeChat) return;

    // Si el usuario llega al tope superior del chat
    if (chatScrollRef.current.scrollTop === 0) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      try {
        const data = await chatService.getMessages(activeChat.id, nextPage);
        const olderMessages = data.messages || [];

        if (olderMessages.length === 0) {
          setHasMoreMessages(false);
        } else {
          // Guardamos altura para no brincar al inicio
          const prevScrollHeight = chatScrollRef.current.scrollHeight;
          
          setMessages(prev => [...olderMessages, ...prev]);
          setPage(nextPage);

          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight - prevScrollHeight;
            }
          }, 0);
        }
      } catch (error) {
        console.error("Error paginando:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedImage(e.target.files[0]);
  };

  const handleBroadcastFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setBroadcastFile(e.target.files[0]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlobLocal = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlobLocal);
        stream.getTracks().forEach(track => track.stop()); 
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false); setAudioBlob(null); 
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const handleSendMessage = async () => {
    if (isGodMode) return; 
    if (!newMessage.trim() && !selectedImage && !audioBlob) return;
    if (!activeChat || !activeChat.user?.id) return; 
    setIsSending(true);

    try {
      let fileToSend: any = selectedImage;
      if (audioBlob) fileToSend = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });

      const textToSend = newMessage.trim() === "" ? " " : newMessage.trim();
      const data = await chatService.sendMessage(activeChat.id || '', activeChat.user.id, textToSend, ppvPrice, fileToSend);

      if (data && data.chatId && !activeChat.id) {
         setActiveChat((prev: any) => ({ ...prev, id: data.chatId }));
         localStorage.setItem('lastOpenedChat', data.chatId);
      }

      if (data && data.messageData) {
         const newMsgRight = { ...data.messageData, senderId: 'me' };
         setMessages(prev => [...prev, newMsgRight]); 
         setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      
      setNewMessage(''); setIsPPVMode(false); setPpvPrice(''); setSelectedImage(null); setAudioBlob(null); setShowEmojis(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchConversations();
    } catch (error) {
      alert("Hubo un error al enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() && !broadcastFile) return alert("Debes escribir un mensaje o adjuntar un archivo.");
    if (!broadcastPrice || parseFloat(broadcastPrice) <= 0) {
      if (!confirm("No has puesto precio. ¿Deseas enviar este mensaje GRATIS a todos tus fans?")) return;
    }
    setIsSendingBroadcast(true);
    try {
      const res = await chatService.sendBroadcast(broadcastContent, broadcastPrice, broadcastFile);
      alert(`✅ ¡Éxito! ${res.message}`);
      setIsBroadcastModalOpen(false); setBroadcastContent(''); setBroadcastPrice(''); setBroadcastFile(null);
      fetchConversations(); 
    } catch (error: any) {
      alert(error.response?.data?.error || "Error de conexión con el servidor.");
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("¿Estás seguro de que quieres borrar este mensaje para todos?")) return;
    try {
      await chatService.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (error) {
      alert("Error al intentar borrar el mensaje.");
    }
  };

  const handleDeleteFullConversation = async () => {
    if (!activeChat || !activeChat.id) return;
    
    const confirmDelete = confirm(`⚠️ ALERTA DE SEGURIDAD: ¿Estás seguro de que quieres eliminar TODA la conversación con @${activeChat.user?.username}? \n\nEsta acción borrará todos los mensajes para ambos y NO se puede deshacer.`);
    
    if (!confirmDelete) return;

    try {
      if ((chatService as any).deleteConversation) {
        await (chatService as any).deleteConversation(activeChat.id);
      } else {
        await api.delete(`/messages/conversation/${activeChat.id}`);
      }

      setConversations(prev => prev.filter(c => c.id !== activeChat.id));
      setMessages([]);
      setActiveChat(null);
      if (!isGodMode) localStorage.removeItem('lastOpenedChat');

      alert("💥 Chat eliminado por completo.");
    } catch (error: any) {
      alert("Hubo un error al intentar eliminar la conversación.");
    }
  };

  const handleUnlockClick = async (message: any) => {
    if (currentUser?.role === 'ADMIN') {
      alert("👑 MODO DIOS: Los Administradores no necesitan pagar, el servidor debió haber desbloqueado esto automáticamente.");
      return;
    }

    try {
      const data = await paymentService.createPaymentIntent({
        amount: message.price,
        type: 'MESSAGE', 
        creatorId: message.senderId || message.userId, 
        description: 'Desbloqueo de Mensaje Privado',
        messageId: message.id 
      } as any);
      
      alert("✨ ¡Mensaje desbloqueado con éxito!");
      
      if (activeChat) {
        const chatData = await chatService.getMessages(activeChat.id, 1);
        setMessages(chatData.messages || []);
      }

    } catch (error: any) { 
      alert(error.response?.data?.error || 'Error al procesar el pago. Verifica tu saldo.'); 
    }
  };

  const handleToggleBlock = async () => {
    if (!activeChat || !activeChat.id) return; 
    try {
      if (isBlockedByMe) {
        await chatService.unblockUser(activeChat.user.id);
        setIsBlockedByMe(false);
        alert("✅ Usuario desbloqueado.");
      } else {
        const confirmBlock = confirm("🚨 ¿Estás seguro de que quieres bloquear a este usuario?");
        if (!confirmBlock) return;
        try {
          await chatService.blockUser(activeChat.user.id);
        } catch (err: any) {
          if (err.response?.data?.error !== 'El usuario ya estaba bloqueado.') throw err;
        }
        setIsBlockedByMe(true);
        alert("🚫 Usuario ha sido bloqueado.");
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al actualizar bloqueo.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div></div>;

  const filteredConversations = conversations.filter(chat => 
    chat.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-nm-base overflow-hidden relative">
      <div className={`absolute top-[-20%] left-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-x-1/2 transition-colors ${isGodMode ? 'bg-red-900/10' : 'bg-teal-900/5'}`}></div>

      <nav className="bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center z-10 shrink-0 backdrop-blur-xl shadow-md">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <MessageCircle className={`w-5 h-5 ${isGodMode ? 'text-red-500' : 'text-teal-500'}`} strokeWidth={2.5}/> 
          {isGodMode ? 'Moderador Global' : 'Mensajes VIP'}
        </h1>
        <div className="flex gap-3">
          {currentUser?.role === 'ADMIN' && (
            <button 
              onClick={() => { setActiveChat(null); setIsGodMode(!isGodMode); }}
              className={`text-sm px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${isGodMode ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'nm-inset border border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
            >
              <Eye className="w-4 h-4" /> <span className="hidden md:inline">Modo Dios</span>
            </button>
          )}

          {currentUser?.role === 'CREATOR' && !isGodMode && (
            <button 
              onClick={() => setIsBroadcastModalOpen(true)}
              className="text-sm nm-btn-primary border-teal-500/30 text-teal-400 hover:text-white hover:bg-teal-600 px-4 py-2 rounded-full font-bold flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> <span className="hidden md:inline">Broadcast PPV</span>
            </button>
          )}
          <button 
            onClick={() => router.push('/dashboard')} 
            className="text-sm nm-btn text-gray-300 px-4 py-2 rounded-full hover:text-white transition-colors flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">Volver</span>
          </button>
        </div>
      </nav>

      <div className={`flex flex-1 overflow-hidden max-w-7xl mx-auto w-full z-10 ${isFlashing ? 'shadow-[inset_0_0_50px_rgba(20,184,166,0.2)] border border-teal-500/30 rounded-xl' : ''}`}>
        
        <div className={`w-full sm:w-80 border-r border-white/5 flex flex-col bg-nm-base relative z-20 ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder={isGodMode ? "Buscar por usuario..." : "Buscar fan..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full nm-inset rounded-xl pl-10 pr-4 py-2.5 text-white outline-none transition-colors shadow-inner text-sm ${isGodMode ? 'focus:border-red-500/50' : 'focus:border-teal-500/50'}`}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
            {filteredConversations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10 px-4 font-medium">
                {searchTerm ? 'No se encontraron resultados.' : 'No tienes conversaciones activas.'}
              </p>
            ) : (
              filteredConversations.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => handleSelectChat(chat)} 
                  className={`flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer transition-all ${
                    activeChat?.id === chat.id 
                      ? `nm-inset border ${isGodMode ? 'border-red-500/30' : 'border-teal-500/20'}`
                      : 'nm-btn border border-transparent hover:border-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg relative border-2 border-[#0e0e0e] ${isGodMode ? 'bg-gradient-to-br from-gray-800 to-black' : 'bg-gradient-to-br from-blue-500 to-teal-400'}`}>
                    {chat.user?.username ? chat.user.username.charAt(0).toUpperCase() : 'U'}
                    {chat.unread && !isGodMode && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`truncate text-sm ${chat.unread && !isGodMode ? 'text-white font-black' : 'text-gray-300 font-bold'}`}>
                        {chat.user?.username || 'Usuario'}
                      </h4>
                      <span className={`text-[10px] ${chat.unread && !isGodMode ? 'text-teal-400 font-bold' : 'text-gray-500'}`}>
                        {(!chat.time || String(chat.time).includes('Invalid')) ? '--:--' : chat.time}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${chat.unread && !isGodMode ? 'text-teal-300 font-bold' : 'text-gray-500 font-medium'}`}>{chat.lastMsg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {activeChat ? (
          <div className="flex flex-col flex-1 bg-[#0a0a0a] relative z-10 isolate">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-nm-base relative z-20 shadow-md">
              <div className="flex items-center gap-3">
                <button onClick={() => { setActiveChat(null); if(!isGodMode) localStorage.removeItem('lastOpenedChat'); router.replace('/dashboard/messages'); }} className="sm:hidden nm-btn p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-[#0a0a0a] ${isGodMode ? 'bg-gradient-to-br from-gray-800 to-black' : 'bg-gradient-to-br from-blue-500 to-teal-400'}`}>
                   {activeChat.user?.username ? activeChat.user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                    {activeChat.user?.username || 'Usuario'}
                    {!isGodMode && <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">{isGodMode ? 'Espiando conexión...' : 'En línea'}</p>
                </div>
              </div>
              
              {!isGodMode && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteFullConversation}
                    className="text-xs font-bold p-2 rounded-full transition-all flex items-center text-gray-400 nm-btn hover:text-red-500"
                    title="Eliminar Todo el Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => { setReportingMessageId(null); setIsReportModalOpen(true); }}
                    className="text-xs font-bold p-2 rounded-full transition-all flex items-center text-gray-400 nm-btn hover:text-red-400"
                    title="Reportar Usuario"
                  >
                    <Flag className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={handleToggleBlock}
                    className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                      isBlockedByMe 
                        ? 'text-green-400 nm-inset border border-green-500/30' 
                        : 'text-red-400 nm-btn hover:text-red-300'
                    }`}
                  >
                    {isBlockedByMe ? <Unlock className="w-4 h-4"/> : <Ban className="w-4 h-4"/>} 
                    <span className="hidden sm:inline">{isBlockedByMe ? 'Desbloquear' : 'Bloquear'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 🔥 CONTENEDOR DE MENSAJES CON INFINITE SCROLL */}
            <div 
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar relative"
            >
              {isLoadingMore && (
                <div className="flex justify-center py-2 mb-4">
                  <span className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></span>
                </div>
              )}
              
              {messages.length === 0 && !isLoadingMore && <p className="text-center text-gray-500 mt-10 font-medium">No hay mensajes en este chat.</p>}
              
              {messages.map((msg) => {
                const hasMedia = msg.mediaUrl && msg.mediaUrl !== 'null';
                const isAudio = hasMedia && (msg.mediaUrl.match(/\.(mp3|wav|ogg)$/i) || msg.mediaUrl.includes('audio_') || msg.isAudio);
                const isVideo = hasMedia && (msg.mediaUrl.match(/\.(mp4|mov|webm)$/i) && !msg.mediaUrl.includes('audio_'));

                const alignRight = !isGodMode && msg.senderId === 'me';

                return (
                  <div key={msg.id} className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} animate-fade-in group`}>
                    
                    {isGodMode && (
                      <span className="text-[10px] text-gray-500 mb-1 ml-1 font-mono">ID Remitente: {msg.senderId}</span>
                    )}

                    <div className="flex items-center">
                      {alignRight ? (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)} 
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 mr-2 self-center transition-opacity text-sm nm-btn p-2 rounded-full"
                          title="Borrar mensaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        !isGodMode && (
                          <button 
                            onClick={() => { setReportingMessageId(msg.id); setIsReportModalOpen(true); }} 
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 ml-2 self-center transition-opacity text-sm nm-btn p-2 rounded-full order-last"
                            title="Reportar este mensaje"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )
                      )}

                      <div className={`max-w-xs sm:max-w-md rounded-2xl p-1 relative ${
                          alignRight 
                          ? 'bg-gradient-to-bl from-teal-700 to-blue-700 rounded-tr-none text-white shadow-lg' 
                          : `nm-inset rounded-tl-none text-gray-200 border ${isGodMode ? 'border-red-500/20' : 'border-white/5'}`
                      }`}>
                        {msg.content && msg.content.trim() !== "" && (
                           <div className={`px-4 py-2.5 text-sm md:text-base whitespace-pre-wrap ${msg.isPPV && !msg.isUnlocked ? 'text-teal-200 italic border-l-2 border-teal-500 ml-2 pl-2 mb-2 bg-black/40 rounded-r-lg' : ''}`}>
                              {msg.content}
                           </div>
                        )}

                        {msg.isPPV && (
                          <div className="bg-[#050505] p-4 rounded-xl flex flex-col items-center justify-center min-h-[140px] border border-white/5 m-1 relative overflow-hidden mb-2 shadow-inner">
                            {hasMedia && !msg.isUnlocked && (
                              <>
                                <img src={getImageUrl(msg.mediaUrl)} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 select-none pointer-events-none" alt="Fondo" />
                                <div className="absolute inset-0 bg-[#050505]/40"></div>
                              </>
                            )}
                            {!msg.isUnlocked ? (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent"></div>
                                <Lock className="w-10 h-10 text-teal-500 relative z-10 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)] mb-2" />
                                <p className="font-bold relative z-10 text-sm text-white">Contenido Privado</p>
                                {msg.senderId !== 'me' && !isGodMode ? (
                                  <button onClick={() => handleUnlockClick(msg)} className="mt-3 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold py-2 px-6 rounded-full relative z-10 transition-transform hover:scale-105 shadow-[0_0_10px_rgba(20,184,166,0.3)] flex items-center gap-1">
                                    <Unlock className="w-3 h-3" /> Desbloquear ${msg.price?.toFixed(2)}
                                  </button>
                                ) : (
                                   <span className="nm-inset border border-teal-500/50 text-teal-400 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest mt-2 relative z-10">{isGodMode ? `PPV Bloqueado ($${msg.price})` : `Tú cobraste: $${msg.price?.toFixed(2)}`}</span>
                                )}
                              </>
                            ) : (
                              <div className="text-center relative z-10 py-2 flex flex-col items-center">
                                 <Unlock className="w-8 h-8 text-teal-400 mb-2 drop-shadow-md" />
                                 <span className="text-[10px] text-teal-300 font-bold nm-inset px-3 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">{isGodMode ? 'PPV Auditado' : `¡Desbloqueado por $${msg.price?.toFixed(2)}!`}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {hasMedia && (!msg.isPPV || msg.isUnlocked) && (
                          <div className="relative z-10 mt-2">
                            {isAudio ? (
                               <div className="px-3 pb-2 pt-1">
                                 <audio controls controlsList="nodownload" src={getImageUrl(msg.mediaUrl)} className="max-w-[200px] sm:max-w-[250px] h-10 outline-none" />
                               </div>
                            ) : isVideo ? (
                               <div className="px-2 pb-2 relative group/media flex justify-center">
                                 <video 
                                   controls 
                                   controlsList="nodownload noplaybackrate" 
                                   disablePictureInPicture
                                   src={getImageUrl(msg.mediaUrl)} 
                                   className="rounded-xl max-h-64 w-full object-cover shadow-md select-none relative z-10" 
                                   onContextMenu={(e) => e.preventDefault()} 
                                 />
                                 <div 
                                   onClick={(e) => { e.stopPropagation(); setExpandedMedia({ url: getImageUrl(msg.mediaUrl), type: 'video' }); }}
                                   className="absolute top-4 right-4 bg-black/80 hover:bg-teal-500 p-2.5 rounded-full cursor-pointer opacity-100 sm:opacity-0 sm:group-hover/media:opacity-100 transition-all z-30 shadow-lg border border-white/10"
                                   title="Ver en grande"
                                 >
                                   <Maximize className="w-5 h-5 text-white" />
                                 </div>
                               </div>
                            ) : (
                               <div className="px-2 pb-2 relative flex justify-center group/media">
                                 <img 
                                   src={getImageUrl(msg.mediaUrl)} 
                                   alt="Media" 
                                   className="rounded-xl max-h-48 object-cover shadow-md border border-white/5 select-none cursor-pointer relative z-10" 
                                   onClick={(e) => { e.stopPropagation(); setExpandedMedia({ url: getImageUrl(msg.mediaUrl), type: 'image' }); }}
                                   onContextMenu={(e) => e.preventDefault()} 
                                   draggable="false"
                                 />
                                 <div 
                                   onClick={(e) => { e.stopPropagation(); setExpandedMedia({ url: getImageUrl(msg.mediaUrl), type: 'image' }); }}
                                   className="absolute inset-2 flex items-center justify-center bg-black/40 rounded-xl cursor-pointer opacity-0 group-hover/media:opacity-100 transition-all z-20"
                                 >
                                   <Maximize className="w-10 h-10 text-white drop-shadow-lg" />
                                 </div>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {!isGodMode && (
              <div className="p-4 border-t border-white/5 bg-nm-base relative z-20 min-h-[95px] flex flex-col justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                {isBlockedByMe ? (
                  <div className="w-full text-center py-3 text-red-400 text-sm font-bold nm-inset border border-red-500/30 rounded-full shadow-inner flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4" /> Tienes bloqueado a este usuario.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {selectedImage && (
                        <div className="flex items-center gap-2 nm-inset px-3 py-1.5 rounded-lg border border-white/5 animate-fade-in">
                          <ImageIcon className="w-4 h-4 text-teal-400" />
                          <span className="text-xs text-gray-300 truncate max-w-[150px]">{selectedImage.name}</span>
                          <button onClick={() => setSelectedImage(null)} className="text-gray-500 hover:text-red-400 transition-colors"><X className="w-4 h-4"/></button>
                        </div>
                      )}
                      {isPPVMode && currentUser?.role === 'CREATOR' && (
                        <div className="flex items-center gap-2 nm-inset border border-teal-500/50 w-max px-3 py-1.5 rounded-xl animate-fade-in">
                          <span className="text-teal-400 font-bold text-xs uppercase tracking-widest">Cobrar: $</span>
                          <input type="number" min="1" step="0.01" placeholder="0.00" value={ppvPrice} onChange={(e) => setPpvPrice(e.target.value)} className="bg-transparent border-b border-teal-500/30 text-white outline-none w-16 px-1 py-0.5 text-sm font-bold focus:border-teal-400" />
                          <button onClick={() => { setIsPPVMode(false); setPpvPrice(''); }} className="text-gray-400 hover:text-red-400 ml-1 transition-colors"><X className="w-4 h-4"/></button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end gap-2 nm-inset rounded-[2rem] p-1.5 focus-within:border-teal-500/50 transition-colors border border-transparent">
                      {!isRecording && !audioBlob && currentUser?.role === 'CREATOR' && (
                        <>
                          <input type="file" accept="image/*,video/*,audio/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                          <button onClick={() => fileInputRef.current?.click()} className="nm-btn w-11 h-11 rounded-full text-gray-400 hover:text-teal-400 flex items-center justify-center transition-colors shrink-0">
                            <Paperclip className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {currentUser?.role === 'CREATOR' && (
                        <button onClick={() => setIsPPVMode(!isPPVMode)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${isPPVMode ? 'nm-inset text-teal-400 border border-teal-500/30' : 'nm-btn text-gray-400 hover:text-teal-400'}`}>
                          <CircleDollarSign className="w-5 h-5" />
                        </button>
                      )}
                      
                      {isRecording ? (
                        <div className="flex-1 flex items-center justify-between nm-inset border border-red-500/30 rounded-full px-4 py-2 self-center">
                          <span className="text-red-400 font-bold flex items-center gap-2 text-sm tracking-wide">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Grabando {formatTime(recordingTime)}
                          </span>
                          <div className="flex items-center gap-3">
                            <button onClick={cancelRecording} className="text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancelar</button>
                            <button onClick={stopRecording} className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-red-600 transition-colors">
                              <Square className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        </div>
                      ) : audioBlob ? (
                        <div className="flex-1 flex items-center justify-between nm-inset border border-teal-500/30 rounded-full px-4 py-1.5 self-center">
                          <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 w-full max-w-[200px]" />
                          <button onClick={cancelRecording} className="text-gray-400 hover:text-red-400 transition-colors ml-2 flex items-center gap-1 font-bold text-xs">
                            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Borrar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 relative flex items-center bg-transparent self-center">
                          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje privado..." className="flex-1 bg-transparent text-white outline-none px-4 py-3 max-h-32 resize-none custom-scrollbar text-sm md:text-base placeholder:text-gray-600" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                          
                          {/* 🔥 MENÚ DE EMOJIS RÁPIDOS */}
                          <div className="relative mr-2" ref={emojiMenuRef}>
                            <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-gray-400 hover:text-teal-400 transition-colors">
                              <Smile className="w-5 h-5" />
                            </button>
                            {showEmojis && (
                              <div className="absolute bottom-12 right-0 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-1 z-50 animate-fade-in">
                                {QUICK_EMOJIS.map(emoji => (
                                  <button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojis(false); }} className="text-xl p-2 hover:bg-white/10 rounded-xl transition-colors hover:scale-110">
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!newMessage.trim() && !selectedImage && !audioBlob && !isRecording ? (
                        currentUser?.role === 'CREATOR' ? (
                          <button onClick={startRecording} className="nm-btn w-11 h-11 rounded-full text-gray-400 hover:text-teal-400 flex items-center justify-center transition-colors shrink-0">
                            <Mic className="w-5 h-5" />
                          </button>
                        ) : (
                          <button disabled className="nm-btn-primary h-11 w-11 sm:w-auto sm:px-6 rounded-full transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                            <Send className="w-5 h-5" /> <span className="hidden sm:inline">Enviar</span>
                          </button>
                        )
                      ) : (
                        <button onClick={handleSendMessage} disabled={isSending || (isPPVMode && !ppvPrice) || isRecording} className="nm-btn-primary h-11 w-11 sm:w-auto sm:px-6 rounded-full transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-2">
                          {isSending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Send className="w-5 h-5" /> <span className="hidden sm:inline">Enviar</span></>}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center bg-[#0a0a0a] border-l border-white/5 text-center p-8 relative z-10 shadow-inner">
            <div className={`w-24 h-24 rounded-3xl nm-inset flex items-center justify-center mb-6 ${isGodMode ? 'text-red-500' : 'text-teal-500'}`}>
              {isGodMode ? (
                 <Eye className="w-12 h-12 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
              ) : (
                 <MessageCircle className="w-12 h-12 drop-shadow-[0_0_15px_rgba(20,184,166,0.4)]" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">{isGodMode ? 'Radar Global Activo' : 'Bóveda de Mensajes'}</h2>
            <p className="text-gray-500 max-w-sm font-medium">{isGodMode ? 'Estás interceptando la base de datos completa. Selecciona un chat para auditarlo.' : 'Selecciona un fan de la lista izquierda para enviar contenido exclusivo o conversar.'}</p>
          </div>
        )}
      </div>

      {isBroadcastModalOpen && currentUser?.role === 'CREATOR' && !isGodMode && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="nm-inset border border-teal-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(20,184,166,0.1)]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0e0e0e]">
              <h3 className="text-white font-black flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" /> Difusión Masiva
              </h3>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="nm-btn p-2 rounded-full text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-[#0a0a0a]">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Mensaje (Opcional)</label>
                <textarea value={broadcastContent} onChange={(e) => setBroadcastContent(e.target.value)} className="w-full nm-inset border border-white/5 rounded-xl p-4 text-white outline-none focus:border-teal-500/50 resize-none text-sm placeholder:text-gray-600" rows={3} placeholder="Escribe un mensaje para todos tus fans..."/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Archivo (Opcional)</label>
                <input type="file" accept="image/*,video/*" className="hidden" ref={broadcastFileInputRef} onChange={handleBroadcastFileChange} />
                <div className="flex gap-2 items-center">
                  <button onClick={() => broadcastFileInputRef.current?.click()} className="nm-btn text-gray-300 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Elegir
                  </button>
                  {broadcastFile && <span className="flex-1 nm-inset text-teal-400 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center border border-teal-500/20">
                    <span className="truncate pr-2">{broadcastFile.name}</span> 
                    <button onClick={() => setBroadcastFile(null)} className="hover:text-red-400"><X className="w-4 h-4"/></button>
                  </span>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Precio PPV ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input type="number" min="0" step="0.01" value={broadcastPrice} onChange={(e) => setBroadcastPrice(e.target.value)} className="w-full nm-inset border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white font-bold outline-none focus:border-teal-500/50"/>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-white/5 bg-[#0e0e0e] flex justify-end gap-3">
              <button onClick={() => setIsBroadcastModalOpen(false)} className="nm-btn px-6 py-2.5 text-sm text-gray-400 font-bold rounded-xl">Cancelar</button>
              <button onClick={handleSendBroadcast} disabled={isSendingBroadcast || (!broadcastContent.trim() && !broadcastFile)} className="nm-btn-primary px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2 text-sm">
                {isSendingBroadcast ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar a Todos</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && clientSecret && selectedMessageToUnlock && (
        <PaymentModal 
          clientSecret={clientSecret} 
          price={selectedMessageToUnlock.price} 
          creatorId={activeChat?.user?.id} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSuccess={async () => { 
            setIsPaymentModalOpen(false); 
            try { 
              await paymentService.confirmPurchase(selectedMessageToUnlock.id); 
              alert("✨ ¡Contenido desbloqueado con éxito!"); 
              if (activeChat) { 
                const data = await chatService.getMessages(activeChat.id, 1); 
                setMessages(data.messages || []); 
              } 
            } catch (error) {} 
          }} 
        />
      )}

      {isReportModalOpen && activeChat && (
        <ReportModal 
          type={reportingMessageId ? 'MESSAGE' : 'USER'} 
          targetId={reportingMessageId || activeChat.user.id} 
          reportedUsername={activeChat.user.username} 
          onClose={() => { setIsReportModalOpen(false); setReportingMessageId(null); }} 
        />
      )}

      {/* 🔥 MODAL GIGANTE DE MULTIMEDIA (FIX Z-INDEX FORZADO) */}
      {expandedMedia && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out select-none"
          style={{ zIndex: 999999 }} 
          onClick={() => setExpandedMedia(null)}
          onContextMenu={(e) => e.preventDefault()} 
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setExpandedMedia(null); }}
            className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10"
            style={{ zIndex: 1000000 }}
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative inline-block max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            {expandedMedia.type === 'video' ? (
              <video 
                src={expandedMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[90vh] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] outline-none relative z-10" 
              />
            ) : (
              <img 
                src={expandedMedia.url} 
                alt="Contenido Exclusivo" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default select-none pointer-events-none relative z-10"
                draggable="false"
              />
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden opacity-30 mix-blend-overlay z-0">
               <div className="transform -rotate-45 flex flex-col items-center">
                 <span className="text-white text-5xl md:text-8xl font-black uppercase tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
                   FansMio
                 </span>
                 <span className="text-white text-xl md:text-3xl font-bold drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mt-2">
                   @{activeChat?.user?.username || 'EXCLUSIVO'}
                 </span>
               </div>
            </div>
            {expandedMedia.type === 'image' && (
              <div 
                className="absolute inset-0 z-20 w-full h-full cursor-default pointer-events-auto" 
                onContextMenu={(e) => e.preventDefault()}
              ></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div></div>}>
      <MessagesContent />
    </Suspense>
  );
}