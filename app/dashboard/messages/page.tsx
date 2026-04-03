"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { chatService } from '../../../lib/chatService'; // Ruta correcta confirmada
import { Send, Lock, Sparkles, Bot, Search, MessageSquareX, ChevronLeft, MoreVertical, Trash2, Flag, Ban } from 'lucide-react'; 

const BACKEND_WS = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.fansmio.com';

// ============================================================================
// 👑 COMPONENTE PRINCIPAL (ORQUESTADOR A DOS COLUMNAS)
// ============================================================================
export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Cargando Bóveda de Mensajes...</div>}>
      <MessagesContainer />
    </Suspense>
  );
}

function MessagesContainer() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  
  // 🔍 NUEVO ESTADO PARA EL BUSCADOR
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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

  // 🎯 NUEVO FILTRO TÁCTICO (BLINDADO CONTRA ERRORES NULL)
  const filteredChats = chats.filter(chat => 
    (chat.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white pt-16 md:pt-0">
      
      {/* 👈 COLUMNA IZQUIERDA: LISTA DE FANS */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-white/5 bg-nm-base`}>
        <div className="p-4 border-b border-white/5 bg-[#0a0a0a]">
          <h1 className="text-xl font-black mb-4">Mensajes VIP</h1>
          <div className="bg-[#111] nm-inset border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            {/* ⌨️ INPUT CONECTADO */}
            <input 
              type="text" 
              placeholder="Buscar fan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {isLoadingChats ? (
            <div className="text-center text-gray-500 text-sm mt-10">Buscando conexiones...</div>
          ) : filteredChats.length === 0 ? ( 
            <div className="text-center flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquareX className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold">No se encontraron fans</p>
            </div>
          ) : (
            filteredChats.map(chat => ( 
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all ${
                  activeChat?.id === chat.id 
                    ? 'bg-white/10 border border-white/10 nm-inset' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-600 to-blue-500 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg">
                  {chat.user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold truncate text-sm">{chat.user?.username || 'Usuario'}</h3>
                    <span className="text-[10px] text-gray-500 font-mono">Ahora</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">Haz clic para ver la conversación</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 👉 COLUMNA DERECHA: LA BÓVEDA DE MENSAJES PPV */}
      <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#050505] relative`}>
        {activeChat ? (
          <ChatEngine activeChat={activeChat} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="hidden md:flex h-full flex-col items-center justify-center text-gray-600">
            <Lock className="w-16 h-16 mb-4 opacity-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            <h2 className="text-xl font-black tracking-widest uppercase">Bóveda Encriptada</h2>
            <p className="text-sm mt-2 font-medium">Selecciona un Fan para monetizar la conversación.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// 💬 MOTOR DE CHAT VIP (Estética Premium + Moderación + PPV Manual)
// ============================================================================
function ChatEngine({ activeChat, onBack }: { activeChat: any, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 🔥 NUEVOS ESTADOS TÁCTICOS
  const [isPPVMode, setIsPPVMode] = useState(false); // Control manual del PPV
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Menú de opciones por mensaje

  const socketRef = useRef<WebSocket | null>(null);
  const userScoreRef = useRef<{ [key: string]: number }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeChat?.id) return;
    setIsTyping(false);
    
    const loadHistory = async () => {
      try {
        const data = await chatService.getMessages(activeChat.id);
        data.messages?.forEach(trackUserScore);
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error cargando historial:", error);
      }
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
          trackUserScore(data.message);
          setMessages(prev => [...prev, data.message]);
        }
        if (data.type === 'TYPING' && data.chatId === activeChat.id) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      } catch (e) { console.error(e); }
    };

    return () => {
      ws.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChat.id]);

  const trackUserScore = (msg: any) => {
    if (!msg?.senderId || msg.senderId === 'me') return;
    userScoreRef.current[msg.senderId] = (userScoreRef.current[msg.senderId] || 0) + 1;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat?.user?.id) return;
    
    const tempId = `temp-${Date.now()}`;
    const targetUserId = activeChat.user.id as string;
    
    // 💰 LÓGICA DE PPV (Solo se aplica si el Creador activó el botón candado)
    let finalPrice = 0;
    if (isPPVMode) {
      const score = userScoreRef.current[targetUserId] || 0;
      finalPrice = score > 20 ? 50 : score > 10 ? 30 : 10;
    }

    const optimistic = { id: tempId, content: newMessage, senderId: 'me', pending: true, price: finalPrice };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    setIsPPVMode(false); // Apagamos el PPV después de enviar

    try {
      const res = await chatService.sendMessage(activeChat.id, targetUserId, optimistic.content, String(finalPrice), null);
      setMessages(prev => prev.map(m => m.id === tempId ? res.messageData : m));
      socketRef.current?.send(JSON.stringify({ type: 'NEW_MESSAGE', message: res.messageData, chatId: activeChat.id }));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Error al enviar el mensaje.");
    }
  };

  // 🛡️ FUNCIONES DE MODERACIÓN
  const handleDeleteMsg = (msgId: string) => {
    if(window.confirm("¿Estás seguro de eliminar este mensaje para ambos?")) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      // TODO: Conectar a endpoint de backend: chatService.deleteMessage(msgId)
    }
    setOpenMenuId(null);
  };

  const handleReportMsg = () => {
    alert("Mensaje reportado a administración.");
    setOpenMenuId(null);
  };

  const handleBlockUser = () => {
    if(window.confirm(`¿Bloquear a ${activeChat?.user?.username}? Ya no podrá enviarte mensajes.`)) {
      alert("Usuario bloqueado.");
      onBack(); // Te saca del chat al bloquear
    }
    setOpenMenuId(null);
  };

  // 🤖 AUTO-REPLY
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== 'me' && !last.isAutoReply) {
      const aiTimer = setTimeout(() => {
        const reply = { id: `ai-${Date.now()}`, content: 'Mensaje automático de FansMio (Demo)', senderId: 'me', isAutoReply: true };
        setMessages(prev => [...prev, reply]);
      }, 3000);
      return () => clearTimeout(aiTimer);
    }
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full w-full relative">
      
      {/* 🔝 HEADER DEL CHAT */}
      <div className="p-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between shadow-md z-20 w-full">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-gray-400 hover:text-white p-1.5 bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            {activeChat?.user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <h2 className="text-white font-black text-lg leading-tight">{activeChat?.user?.username || 'Usuario'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">En Línea</p>
            </div>
          </div>
        </div>
        
        {/* Menú Global del Usuario */}
        <button onClick={() => setOpenMenuId(openMenuId === 'global' ? null : 'global')} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
          <MoreVertical className="w-5 h-5" />
          {openMenuId === 'global' && (
            <div className="absolute right-0 top-12 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 w-48 z-50 animate-fade-in">
              <button onClick={handleBlockUser} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 font-bold hover:bg-white/5 rounded-lg transition-colors">
                <Ban className="w-4 h-4" /> Bloquear Usuario
              </button>
            </div>
          )}
        </button>
      </div>

      {/* 💬 ÁREA DE MENSAJES (Con Fondo Sutil) */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#080808] relative">
        {/* Marca de agua de fondo */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
          <Lock className="w-64 h-64" />
        </div>

        {messages.map(msg => {
          const isMe = msg.senderId === 'me';
          const showPrice = msg.price && msg.price > 0;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
              
              <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%]`}>
                
                {/* ⚙️ MENÚ MODERACIÓN (Aparece al hacer hover) */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity relative ${isMe ? 'order-1' : 'order-2'}`}>
                  <button onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)} className="p-1.5 text-gray-500 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === msg.id && (
                    <div className={`absolute bottom-8 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-1.5 w-40 z-50`}>
                      {isMe && (
                        <button onClick={() => handleDeleteMsg(msg.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 hover:text-red-500 rounded-lg transition-colors font-bold">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                      {!isMe && (
                        <button onClick={handleReportMsg} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-yellow-500 hover:bg-white/5 rounded-lg transition-colors font-bold">
                          <Flag className="w-3.5 h-3.5" /> Reportar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 🎈 BURBUJA DE MENSAJE */}
                <div className={`relative px-5 py-3.5 rounded-3xl ${isMe ? 'order-2 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-br-sm shadow-[0_5px_15px_rgba(239,68,68,0.2)]' : 'order-1 bg-[#151515] border border-white/5 text-gray-200 rounded-bl-sm nm-inset shadow-lg'}`}>
                  
                  {/* Watermark de seguridad si es de pago */}
                  {isMe && showPrice && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-15deg] overflow-hidden rounded-3xl">
                      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">DO NOT SHARE</span>
                    </div>
                  )}
                  
                  <p className="relative z-10 text-[15px] leading-relaxed">{msg.content}</p>
                  
                  {/* Tag de Precio (SOLO SI EL CREADOR LO ACTIVÓ) */}
                  {showPrice && (
                    <div className="mt-2 w-fit bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-green-400"/>
                      <span className="text-[11px] text-green-400 font-black tracking-widest">${msg.price} PPV</span>
                    </div>
                  )}

                  {msg.isAutoReply && <Bot className="w-4 h-4 absolute -bottom-1 -right-1 text-blue-400 drop-shadow-md bg-black rounded-full" />}
                </div>

              </div>
              
              {/* Indicador de estado */}
              {isMe && msg.pending && <span className="absolute -bottom-4 right-0 text-[9px] text-gray-600 uppercase tracking-widest">Enviando...</span>}
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
             <div className="flex items-center gap-1.5 bg-[#151515] border border-white/5 w-fit px-4 py-3 rounded-3xl rounded-bl-sm shadow-md">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* ✍️ ÁREA DE INPUT (DISEÑO PREMIUM) */}
      <div className="p-3 sm:p-5 bg-[#0a0a0a] border-t border-white/5 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
        <div className="flex items-center gap-2 max-w-4xl mx-auto relative w-full bg-[#111] nm-inset border border-white/10 rounded-full p-1.5 pl-4 focus-within:border-red-500/50 transition-colors">
          
          {/* 🔒 BOTÓN TÓGGLE PPV (ESTRELLA DE LA MONETIZACIÓN) */}
          <button 
            onClick={() => setIsPPVMode(!isPPVMode)} 
            title="Activar mensaje de pago (PPV)"
            className={`p-2 rounded-full transition-all duration-300 flex-shrink-0 ${isPPVMode ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.6)] scale-110' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <Lock className="w-4 h-4" strokeWidth={isPPVMode ? 3 : 2} />
          </button>

          <input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); socketRef.current?.send(JSON.stringify({ type: 'TYPING', chatId: activeChat.id })); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isPPVMode ? "Escribe tu mensaje VIP ($)..." : "Escribe un mensaje..."}
            className={`flex-1 bg-transparent border-none text-white text-sm outline-none w-full min-w-0 transition-all ${isPPVMode ? 'font-bold placeholder:text-green-500/50' : 'placeholder:text-gray-600'}`}
          />
          
          <button 
            onClick={handleSend} 
            disabled={!newMessage.trim()} 
            className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale ${isPPVMode ? 'bg-green-500 hover:scale-105' : 'nm-btn-primary hover:scale-105'}`}
          >
            <Send className={`w-4 h-4 sm:w-5 sm:h-5 ml-0.5 ${isPPVMode ? 'fill-black text-black' : 'fill-white text-white'}`} />
          </button>
        </div>
      </div>

    </div>
  );
}