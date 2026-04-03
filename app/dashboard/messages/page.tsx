"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { chatService } from '../../../lib/chatService'; // Ruta correcta confirmada
import { Send, Lock, Sparkles, Bot, Search, MessageSquareX, ChevronLeft } from 'lucide-react'; 

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
// 💬 MOTOR DE CHAT (El código blindado que hicimos antes)
// ============================================================================
function ChatEngine({ activeChat, onBack }: { activeChat: any, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const userScoreRef = useRef<{ [key: string]: number }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 📥 CARGA INICIAL DEL HISTORIAL
  useEffect(() => {
    if (!activeChat?.id) return;
    setIsTyping(false); // Reseteamos el typing al cambiar de chat
    
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

  // 🔥 SOCKET BLINDADO
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
    const targetUserId = activeChat.user.id as string; // 🔥 Tipado seguro forzado
    
    const score = userScoreRef.current[targetUserId] || 0;
    const dynamicPrice = score > 20 ? 50 : score > 10 ? 30 : 10;

    const optimistic = { id: tempId, content: newMessage, senderId: 'me', pending: true, price: dynamicPrice };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    try {
      const res = await chatService.sendMessage(activeChat.id, targetUserId, optimistic.content, String(dynamicPrice), null);
      setMessages(prev => prev.map(m => m.id === tempId ? res.messageData : m));
      socketRef.current?.send(JSON.stringify({ type: 'NEW_MESSAGE', message: res.messageData, chatId: activeChat.id }));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Error al enviar el mensaje.");
    }
  };

  // 🤖 AUTO-REPLY (IA READY)
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== 'me' && !last.isAutoReply) {
      const aiTimer = setTimeout(() => {
        const reply = { id: `ai-${Date.now()}`, content: 'Te leo 👀 ¿quieres contenido exclusivo?', senderId: 'me', isAutoReply: true };
        setMessages(prev => [...prev, reply]);
      }, 1500);
      return () => clearTimeout(aiTimer);
    }
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* 🔝 HEADER DEL CHAT */}
      <div className="p-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between shadow-md z-10 w-full">
        <div className="flex items-center gap-3">
          {/* 🔥 BOTÓN ATRÁS MEJORADO (MÓVIL) */}
          <button onClick={onBack} className="md:hidden text-gray-400 hover:text-white p-1 bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
            {activeChat?.user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-white font-black">{activeChat?.user?.username || 'Usuario'}</h2>
            <p className="text-[10px] text-green-400 font-mono tracking-widest uppercase">Online</p>
          </div>
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs text-yellow-500 font-bold hidden sm:inline">Valor: Alto</span>
        </div>
      </div>

      {/* 💬 ÁREA DE MENSAJES */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-nm-base relative">
        {messages.map(msg => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`relative px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[70%] ${isMe ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-br-sm shadow-lg' : 'bg-[#111] border border-white/5 text-gray-200 rounded-bl-sm nm-inset'}`}>
                {isMe && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-15deg] overflow-hidden rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">@{activeChat?.user?.username || 'USER'} • DO NOT SHARE</span>
                  </div>
                )}
                <p className="relative z-10 text-sm leading-relaxed">{msg.content}</p>
                {msg.isAutoReply && <Bot className="w-3 h-3 absolute -bottom-1 -right-1 text-blue-400 drop-shadow-md" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {msg.price && <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-1.5 rounded border border-green-500/20 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5"/> ${msg.price} PPV</span>}
                {msg.pending && <span className="text-[10px] text-gray-500 italic">Enviando...</span>}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-gray-500 bg-[#111] border border-white/5 w-fit px-3 py-2 rounded-2xl rounded-bl-sm">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        )}
      </div>

      {/* ✍️ ÁREA DE INPUT */}
      <div className="p-3 sm:p-4 bg-[#0a0a0a] border-t border-white/5 w-full">
        <div className="flex items-center gap-2 max-w-4xl mx-auto relative w-full">
          <input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); socketRef.current?.send(JSON.stringify({ type: 'TYPING', chatId: activeChat.id })); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Envía un mensaje secreto..."
            className="flex-1 bg-[#111] nm-inset border border-white/10 px-4 py-3 rounded-full text-white text-sm outline-none focus:border-red-500/50 transition-colors w-full min-w-0"
          />
          <button onClick={handleSend} disabled={!newMessage.trim()} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full nm-btn-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale">
            <Send className="w-4 h-4 sm:w-5 sm:h-5 fill-white sm:ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  );
}