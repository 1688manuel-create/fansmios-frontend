"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { chatService } from '../../../lib/chatService'; 
import { 
  Send, Lock, Search, MessageSquareX, ChevronLeft, 
  MoreVertical, Trash2, Flag, Ban, Image as ImageIcon, 
  Mic, Smile, X, Play, Paperclip
} from 'lucide-react'; 

const BACKEND_WS = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.fansmio.com';

const QUICK_EMOJIS = ['🌹', '🔥', '💋', '💎', '👑', '❤️‍🔥'];

// ============================================================================
// 👑 COMPONENTE PRINCIPAL
// ============================================================================
export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono animate-pulse">Cargando Bóveda...</div>}>
      <MessagesContainer />
    </Suspense>
  );
}

function MessagesContainer() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔥 1. MEMORIA DE CHAT: RECUPERAR AL ENTRAR
  useEffect(() => {
    const savedChat = sessionStorage.getItem('fansmio_active_chat');
    if (savedChat) {
      try { setActiveChat(JSON.parse(savedChat)); } catch (e) {}
    }

    const loadChats = async () => {
      try {
        const res = await chatService.getConversations(); 
        setChats(res.conversations || res.chats || res || []);
      } catch (error) {
        console.error("Error cargando lista de chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };
    loadChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    (chat.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white pt-16 md:pt-0 font-sans">
      
      {/* 👈 COLUMNA IZQUIERDA: LISTA DE FANS */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-white/5 bg-[#0a0a0a]`}>
        <div className="p-5 border-b border-white/5">
          <h1 className="text-2xl font-black mb-4 tracking-tight">Mensajes</h1>
          <div className="bg-[#151515] border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-3 transition-colors focus-within:border-white/20">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar conversación..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-600" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {isLoadingChats ? (
            <div className="text-center text-gray-600 text-sm mt-10">Sincronizando...</div>
          ) : filteredChats.length === 0 ? ( 
            <div className="text-center flex flex-col items-center justify-center h-full text-gray-600">
              <MessageSquareX className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Bandeja vacía</p>
            </div>
          ) : (
            filteredChats.map(chat => ( 
              <button
                key={chat.id}
                onClick={() => {
                  // 🔥 2. MEMORIA DE CHAT: GUARDAR AL SELECCIONAR
                  setActiveChat(chat);
                  sessionStorage.setItem('fansmio_active_chat', JSON.stringify(chat));
                }}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all ${
                  activeChat?.id === chat.id 
                    ? 'bg-[#1a1a1a] shadow-sm' 
                    : 'hover:bg-[#111]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-inner">
                  {chat.user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold truncate text-[15px]">{chat.user?.username || 'Usuario'}</h3>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Toca para abrir el chat</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 👉 COLUMNA DERECHA: CHAT */}
      <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#050505] relative`}>
        {activeChat ? (
          <ChatEngine 
            activeChat={activeChat} 
            onBack={() => {
              // 🔥 3. MEMORIA DE CHAT: BORRAR AL SALIR
              setActiveChat(null);
              sessionStorage.removeItem('fansmio_active_chat');
            }} 
          />
        ) : (
          <div className="hidden md:flex h-full flex-col items-center justify-center text-gray-600">
            <div className="w-20 h-20 rounded-full bg-[#111] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Lock className="w-8 h-8 opacity-50" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-400">Tus Mensajes Seguros</h2>
            <p className="text-sm mt-2 text-gray-600 font-medium">Selecciona un chat para comenzar a enviar contenido.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 💬 MOTOR DE CHAT VIP
// ============================================================================
function ChatEngine({ activeChat, onBack }: { activeChat: any, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [isPPVMode, setIsPPVMode] = useState(false); 
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); 
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null); 
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!activeChat?.id) return;
    const loadHistory = async () => {
      try {
        const data = await chatService.getMessages(activeChat.id);
        setMessages(data.messages || []);
      } catch (error) { console.error(error); }
    };
    loadHistory();
  }, [activeChat?.id]);

  useEffect(() => {
    if (!BACKEND_WS) return;
    const ws = new WebSocket(BACKEND_WS);
    socketRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_MESSAGE' && data.chatId === activeChat.id) {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (e) { console.error(e); }
    };
    return () => ws.close();
  }, [activeChat.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    };
    if (showEmojis) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojis]);

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedMedia) return;
    
    const tempId = `temp-${Date.now()}`;
    const targetUserId = activeChat.user.id as string;
    const finalPrice = isPPVMode ? 10 : 0; 
    
    const mediaUrl = selectedMedia ? URL.createObjectURL(selectedMedia) : null;
    const isVideo = selectedMedia?.type.startsWith('video');
    const isAudio = selectedMedia?.type.startsWith('audio'); 

    const optimistic = { 
      id: tempId, 
      content: newMessage, 
      senderId: 'me', 
      pending: true, 
      price: finalPrice,
      mediaUrl: mediaUrl,
      isVideo: isVideo,
      isAudio: isAudio 
    };

    setMessages(prev => [...prev, optimistic]);
    
    // Guardamos las variables antes de limpiar la interfaz
    const textToSend = newMessage.trim() === "" ? " " : newMessage.trim(); // Enviamos un espacio si solo es un audio/foto
    const mediaToSend = selectedMedia; 

    setNewMessage('');
    setIsPPVMode(false);
    setSelectedMedia(null);
    setShowEmojis(false);

    try {
      // 🔥 CORRECCIÓN: Le pasamos 'mediaToSend' a tu backend en lugar de 'null'
      const res = await chatService.sendMessage(activeChat.id, targetUserId, textToSend, String(finalPrice), mediaToSend);
      
      // 🔥 BLINDAJE VISUAL: Fusionamos la respuesta del backend con nuestro audio temporal 
      // (Por si tu backend aún no procesa las URLs de los archivos correctamente)
      const finalMessage = {
        ...res.messageData,
        mediaUrl: res.messageData.mediaUrl || optimistic.mediaUrl,
        isAudio: res.messageData.isAudio !== undefined ? res.messageData.isAudio : optimistic.isAudio,
        isVideo: res.messageData.isVideo !== undefined ? res.messageData.isVideo : optimistic.isVideo
      };

      setMessages(prev => prev.map(m => m.id === tempId ? finalMessage : m));
      socketRef.current?.send(JSON.stringify({ type: 'NEW_MESSAGE', message: finalMessage, chatId: activeChat.id }));
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Error al enviar el archivo multimedia.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 🔥 CORRECCIÓN SEGURA DEL ARCHIVO CON
    if (e.target.files && e.target.files) { 
      setSelectedMedia(e.target.files[0]);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `nota_voz_${Date.now()}.webm`, { type: 'audio/webm' });
          setSelectedMedia(audioFile); 
          stream.getTracks().forEach(track => track.stop()); 
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accediendo al micrófono:", error);
        alert("Por favor permite el acceso al micrófono para enviar notas de voz.");
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, selectedMedia]);

  return (
    <div className="flex flex-col h-full w-full relative bg-[#0a0a0a]">
      
      {/* 🔝 HEADER DEL CHAT */}
      <div className="px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-20 w-full sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-gray-400 hover:text-white transition-colors -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold text-white shadow-sm">
            {activeChat?.user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-[15px]">{activeChat?.user?.username || 'Usuario'}</h2>
            <p className="text-[11px] text-green-500 font-medium">En línea</p>
          </div>
        </div>
        
        <button onClick={() => setOpenMenuId(openMenuId === 'global' ? null : 'global')} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors relative">
          <MoreVertical className="w-5 h-5" />
          {openMenuId === 'global' && (
            <div className="absolute right-0 top-12 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48 z-50">
              <button onClick={() => alert("Bloqueado")} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 font-medium hover:bg-white/5 rounded-lg transition-colors">
                <Ban className="w-4 h-4" /> Bloquear Usuario
              </button>
            </div>
          )}
        </button>
      </div>

      {/* 💬 ÁREA DE MENSAJES */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        {messages.map(msg => {
          const isMe = msg.senderId === 'me';
          const isPPV = msg.price > 0;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
              <div className={`flex items-end gap-2 max-w-[80%] sm:max-w-[65%]`}>
                
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity relative ${isMe ? 'order-1' : 'order-2'}`}>
                  <button onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)} className="p-1.5 text-gray-500 hover:text-white rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === msg.id && (
                    <div className={`absolute bottom-8 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1.5 w-36 z-50`}>
                      {isMe ? (
                        <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-white/5 rounded-lg">
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      ) : (
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-500 hover:bg-white/5 rounded-lg">
                          <Flag className="w-4 h-4" /> Reportar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className={`relative rounded-[20px] overflow-hidden flex flex-col ${isMe ? 'order-2 bg-teal-600 text-white rounded-br-[4px]' : 'order-1 bg-[#1a1a1a] border border-white/5 text-gray-100 rounded-bl-[4px]'}`}>
                  
                  {isPPV && (
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 border-b border-black/20 flex items-center gap-1.5 w-full">
                      <Lock className="w-3 h-3 text-white"/>
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">Mensaje Bloqueado • ${msg.price}</span>
                    </div>
                  )}

                  {msg.mediaUrl && (
                    <div className="relative max-w-sm p-1">
                      {msg.isVideo ? (
                        <video src={msg.mediaUrl} controls className="w-full h-auto max-h-64 object-cover rounded-xl" />
                      ) : msg.isAudio ? (
                        <audio src={msg.mediaUrl} controls className="w-full h-10 max-w-[220px] mt-2 mb-1" />
                      ) : (
                        <img src={msg.mediaUrl} alt="media" className="w-full h-auto max-h-64 object-cover rounded-xl" />
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p className="px-4 py-2.5 text-[15px] leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMedia && (
        <div className="px-6 py-3 bg-[#111] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
              {selectedMedia.type.startsWith('video') ? <Play className="w-5 h-5 text-teal-500"/> 
               : selectedMedia.type.startsWith('audio') ? <Mic className="w-5 h-5 text-teal-500"/> 
               : <ImageIcon className="w-5 h-5 text-teal-500"/>}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[200px]">
                {selectedMedia.type.startsWith('audio') ? 'Nota de voz lista' : selectedMedia.name}
              </p>
              <p className="text-[10px] text-gray-500">{(selectedMedia.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button onClick={() => setSelectedMedia(null)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 bg-[#0a0a0a] border-t border-white/5 w-full">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>

          <button onClick={toggleRecording} className={`p-3 rounded-full transition-colors shrink-0 ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
            <Mic className="w-5 h-5" />
          </button>

          <div className="flex-1 relative bg-[#151515] border border-white/10 rounded-3xl flex items-center transition-all focus-within:border-white/30">
            
            <button 
              onClick={() => setIsPPVMode(!isPPVMode)} 
              className={`ml-2 p-2 rounded-full transition-colors ${isPPVMode ? 'text-teal-400 bg-teal-400/10' : 'text-gray-500 hover:text-white'}`}
              title="Cobrar por este mensaje"
            >
              <Lock className="w-4 h-4" />
            </button>

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isPPVMode ? "Mensaje de cobro..." : isRecording ? "Grabando audio... (Toca el micro para detener)" : "Escribe un mensaje..."}
              className={`flex-1 bg-transparent border-none text-white text-[15px] outline-none px-3 py-3.5 max-h-32 resize-none overflow-y-auto ${isRecording ? 'opacity-50 cursor-not-allowed text-red-400 font-bold' : ''} ${isPPVMode ? 'text-teal-50' : ''}`}
              rows={1}
              disabled={isRecording}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />

            <div className="relative mr-2" ref={emojiMenuRef}>
              <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-gray-400 hover:text-white transition-colors" disabled={isRecording}>
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

          <button 
            onClick={handleSend} 
            disabled={(!newMessage.trim() && !selectedMedia) || isRecording} 
            className="w-12 h-12 shrink-0 rounded-full bg-teal-600 flex items-center justify-center text-white hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>

        </div>
      </div>

    </div>
  );
}