// frontend/app/dashboard/notifications/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService } from '../../../lib/notificationService';
import AppLayout from '../../../components/AppLayout';

// 🔥 IMPORTAMOS ICONOS PREMIUM DE LUCIDE
import { 
  Bell, 
  BellOff, 
  ArrowLeft, 
  CheckCheck,
  Coins,
  Star,
  Heart,
  MessageCircle,
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function NotificationsDashboard() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean, link: string) => {
    try {
      // 1. Lo marcamos como leído (Visualmente y en BD)
      if (!isRead) {
        setNotifications(prev => prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await notificationService.markAsRead(id);
      }
      
      // 2. 🚀 REDIRECCIÓN MÁGICA: Si trae un link, lo llevamos
      if (link) {
        router.push(link);
      }
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
    }
  };

  // 🔹 REEMPLAZAMOS LOS EMOJIS POR COMPONENTES LUCIDE
  const getIconData = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('tip') || t.includes('propina')) return { icon: <Coins className="w-5 h-5 text-green-500" />, bg: 'nm-inset border border-green-500/30' };
    if (t.includes('sub')) return { icon: <Star className="w-5 h-5 text-yellow-500" />, bg: 'nm-inset border border-yellow-500/30' };
    if (t.includes('like')) return { icon: <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />, bg: 'nm-inset border border-red-500/30' };
    if (t.includes('comment')) return { icon: <MessageCircle className="w-5 h-5 text-blue-500" />, bg: 'nm-inset border border-blue-500/30' };
    if (t.includes('message')) return { icon: <MessageCircle className="w-5 h-5 text-teal-400" />, bg: 'nm-inset border border-teal-500/30' };
    
    // Alertas Oficiales del Sistema / Admin
    if (t.includes('system') || t.includes('admin')) return { icon: <ShieldAlert className="w-6 h-6 text-red-500" />, bg: 'nm-inset border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' };
    
    return { icon: <Bell className="w-5 h-5 text-purple-500" />, bg: 'nm-inset border border-purple-500/30' }; 
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} d`;
    return date.toLocaleDateString();
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen pb-24 sm:pb-10 bg-nm-base relative">
        
        {/* NAVBAR SUPERIOR NEUMÓRFICA */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 backdrop-blur-xl shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="nm-btn p-2 rounded-full text-gray-400 hover:text-white transition-colors sm:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" strokeWidth={2.5}/> 
              Notificaciones
              {unreadCount > 0 && <span className="bg-red-600 text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]">{unreadCount} Nuevas</span>}
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="w-full sm:w-auto nm-btn text-gray-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 border border-white/5">
                <CheckCheck className="w-4 h-4"/> Marcar todo como leído
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-3xl mx-auto mt-6 px-4 relative z-10">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-20 nm-inset rounded-[2rem] border border-white/5 mt-10">
                <BellOff className="w-16 h-16 mx-auto text-gray-600 mb-4" strokeWidth={1.5} />
                <p className="text-gray-300 text-lg font-bold">No tienes notificaciones por ahora.</p>
                <p className="text-gray-500 text-sm mt-2 font-medium">Aquí te avisaremos cuando recibas suscripciones, mensajes o propinas.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon, bg } = getIconData(notif.type);
                return (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id, notif.isRead, notif.link)}
                    className={`relative overflow-hidden rounded-[1.5rem] p-4 sm:p-5 flex items-start gap-4 transition-all duration-300 cursor-pointer border ${
                      notif.isRead 
                        ? 'nm-btn border-white/5 opacity-70 hover:opacity-100' 
                        : 'nm-inset border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                    }`}
                  >
                    {/* Borde izquierdo rojo para no leídas */}
                    {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>}
                    
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                      {icon}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm sm:text-base leading-relaxed ${notif.isRead ? 'text-gray-400 font-medium' : 'text-white font-bold'} break-words`}>
                        {notif.content}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3"/> {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    
                    {/* Puntito indicador */}
                    {!notif.isRead && <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-3 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}