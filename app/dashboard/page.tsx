"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// 🔥 IMPORTAMOS ICONOS PREMIUM DE LUCIDE
import { 
  UserCircle, 
  Settings, 
  Wallet, 
  PackageSearch, 
  TicketPercent, 
  TrendingUp, 
  Star, 
  MessageCircle, 
  Compass, 
  Bookmark, 
  ArrowLeft,
  Sparkles,
  Crown 
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';

export default function DashboardIndex() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/auth');
    }
  }, [router]);

  if (!user) return <div className="min-h-screen bg-nm-base"></div>;

  // 👑 HERRAMIENTAS EXCLUSIVAS DEL CREADOR
  const creatorTools = [
    { title: 'Mi Perfil Público', icon: UserCircle, path: user.username ? `/${user.username}` : 'CONFIG_FIRST', color: 'text-orange-500' },
    { title: 'Configurar Perfil', icon: Settings, path: '/dashboard/profile', color: 'text-gray-400' },
    { title: 'Mi Billetera', icon: Wallet, path: '/dashboard/wallet', color: 'text-green-500' },
    { title: 'Paquetes (Bundles)', icon: PackageSearch, path: '/dashboard/bundles', color: 'text-purple-500' },
    { title: 'Cupones de Descuento', icon: TicketPercent, path: '/dashboard/coupons', color: 'text-red-500' }, 
    { title: 'Estadísticas', icon: TrendingUp, path: '/dashboard/stats', color: 'text-blue-400' },
  ];

  // ⭐ HERRAMIENTAS DEL FAN (O DE CONSUMO)
  const fanTools = [
    { title: 'Mis Suscripciones', icon: Star, path: '/dashboard/subscriptions', color: 'text-pink-500' },
    { title: 'Mensajes PPV', icon: MessageCircle, path: '/dashboard/messages', color: 'text-teal-400' },
    { title: 'Explorar Creadores', icon: Compass, path: '/explore', color: 'text-indigo-400' },
    { title: 'Mis Guardados', icon: Bookmark, path: '/dashboard/bookmarks', color: 'text-yellow-500' },
  ];

  const handleNavigation = (path: string) => {
    if (path === 'CONFIG_FIRST') {
      alert("⚠️ Aún no has configurado tu enlace público. ¡Ve a 'Configurar Perfil' y guarda tu nombre de usuario primero!");
      router.push('/dashboard/profile');
    } else {
      router.push(path);
    }
  };

  // 🔹 Componente Reutilizable (Tarjeta Neumórfica)
  const ToolCard = ({ tool }: { tool: any }) => {
    const Icon = tool.icon;
    return (
      <div 
        onClick={() => handleNavigation(tool.path)}
        className="nm-btn p-6 flex flex-col justify-center gap-4 cursor-pointer group h-full border border-white/5 hover:border-white/10"
      >
        <div className={`w-14 h-14 rounded-2xl bg-[#0a0a0a] nm-inset flex items-center justify-center shadow-inner ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" strokeWidth={2} />
        </div>
        <h3 className="text-white font-bold text-sm md:text-base group-hover:text-gray-300 transition-colors tracking-wide">
          {tool.title}
        </h3>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        {/* Luces de ambiente sutiles */}
        <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        {/* 🔹 NAVBAR SUPERIOR NEUMÓRFICO */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" /> Panel de Control
          </h1>
          <button 
            onClick={() => router.push('/feed')} 
            className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver al Muro</span>
          </button>
        </nav>

        <main className="max-w-5xl mx-auto mt-10 px-4 space-y-10 relative z-10">
          
          {/* 🔹 HEADER DE BIENVENIDA (Hundido) */}
          <div className="nm-inset p-8 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                Hola, {user.username || 'Usuario'} <span className="text-4xl animate-wave origin-bottom-right inline-block">👋</span>
              </h2>
              <p className="text-gray-400 mt-2 text-lg font-medium">¿Qué parte de tu imperio quieres gestionar hoy?</p>
            </div>
            {/* Si es creador, le ponemos una medallita */}
            {user.role === 'CREATOR' && (
               <div className="nm-btn px-4 py-2 flex items-center gap-2 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-xs rounded-full cursor-default">
                 <Crown className="w-4 h-4" /> Creador VIP
               </div>
            )}
          </div>

          {user.role === 'CREATOR' || user.role === 'ADMIN' ? (
            // ===============================
            // 👑 VISTA PARA CREADORES (Ven todo)
            // ===============================
            <div className="space-y-12 animate-fade-in">
              {/* SECCIÓN CREADOR */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-6 border-b border-white/5 pb-3 uppercase tracking-widest flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Tu Imperio (Herramientas de Creador)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {creatorTools.map((tool, index) => <ToolCard key={index} tool={tool} />)}
                </div>
              </div>

              {/* SECCIÓN FAN */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-6 border-b border-white/5 pb-3 uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-4 h-4" /> Tu Consumo (Herramientas de Fan)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {fanTools.map((tool, index) => <ToolCard key={`fan-${index}`} tool={tool} />)}
                </div>
              </div>
            </div>
          ) : (
            // ===============================
            // ⭐ VISTA PARA FANS (Ven suscripciones y banner)
            // ===============================
            <div className="space-y-12 animate-fade-in">
              
              {/* SECCIÓN FAN */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-6 border-b border-white/5 pb-3 uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-4 h-4" /> Tus Herramientas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {fanTools.map((tool, index) => <ToolCard key={`fan-${index}`} tool={tool} />)}
                </div>
              </div>

              {/* BANNER PARA CONVERTIRSE EN CREADOR (CONECTADO A LA ADUANA KYC) */}
              <div className="nm-inset p-10 rounded-[2rem] text-center border border-red-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-orange-500/5 pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                  <Sparkles className="w-12 h-12 text-red-500 mx-auto" />
                  <h2 className="text-3xl font-black text-white">¿Quieres empezar a ganar dinero?</h2>
                  <p className="text-gray-400 font-medium leading-relaxed">
                    Completa tu verificación de identidad para activar tu cuenta de Creador. Podrás subir contenido exclusivo y recibir pagos de tus fans.
                  </p>
                  <button 
                    onClick={() => router.push('/dashboard/kyc')}  // 🛑 AQUÍ ESTÁ EL CAMBIO HACIA LA ADUANA
                    className="nm-btn-primary px-10 py-4 text-lg mt-4 inline-flex items-center gap-2 font-bold"
                  >
                    Verificar mi Identidad
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </AppLayout>
  );
}