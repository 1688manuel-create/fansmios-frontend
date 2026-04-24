"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic'; // 🔥 NUEVO: Para cargar Web3 de forma segura

// 🔥 ICONOS PREMIUM DE LUCIDE
import { 
  UserCircle, Settings, Wallet, PackageSearch, TicketPercent, TrendingUp, 
  Star, MessageCircle, Compass, Bookmark, ArrowLeft, Sparkles, Crown, 
  Zap, CreditCard, History, ArrowUpRight, ArrowDownLeft, Lock, Users, 
  DollarSign, PlaySquare, ShieldCheck 
} from 'lucide-react';

import AppLayout from '../../../components/AppLayout';
import api from '../../../lib/api';
import { useTranslations } from 'next-intl';

// 🚀 IMPORTAMOS TU NUEVO MOTOR WEB3 (Asegúrate de que la ruta sea correcta)
const BotonDePay = dynamic(() => import('../../../components/BotonDePay'), { ssr: false });

export default function DashboardIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('DashboardIndex');
  const [user, setUser] = useState<any>(null);
  
  // 💰 ESTADO FINANCIERO (Limpio, sin variables viejas de PayRam)
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchRealBalance = async () => {
      if (typeof window === 'undefined') return;

      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== "undefined") {
          setUser(JSON.parse(storedUser)); 
        } else {
          router.push('/auth');
          return;
        }

        const res = await api.get('/profile/me'); 
        if (res.data) {
          const datosFrescos = res.data.profile || res.data.user || res.data;
          setUser((prev: any) => {
            const actualizado = { ...prev, ...datosFrescos };
            localStorage.setItem('user', JSON.stringify(actualizado));
            return actualizado;
          });
        }

        const resWallet = await api.get('/wallet/dashboard');
        if (resWallet.data && resWallet.data.recentTransactions) {
          setTransactions(resWallet.data.recentTransactions);
        }

      } catch (error) {}
    };

    fetchRealBalance();
  }, [router, pathname]);

  if (!user) return <div className="min-h-screen bg-nm-base flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">{t('syncing_empire')}</div>;

  // 👑 HERRAMIENTAS EXCLUSIVAS DEL CREADOR
  const creatorTools = [
    { title: t('tool_my_profile'), icon: UserCircle, path: user?.username ? `/${user.username}` : 'CONFIG_FIRST', color: 'text-orange-500' },
    { title: t('tool_settings'), icon: Settings, path: '/dashboard/profile', color: 'text-gray-400' },
    { title: t('tool_covra_wallet'), icon: Wallet, path: '/dashboard/wallet', color: 'text-green-500' },
    { title: t('tool_bundles'), icon: PackageSearch, path: '/dashboard/bundles', color: 'text-purple-500' },
    { title: t('tool_coupons'), icon: TicketPercent, path: '/dashboard/coupons', color: 'text-red-500' }, 
    { title: t('tool_stats'), icon: TrendingUp, path: '/dashboard/stats', color: 'text-blue-400' },
    { title: t('tool_referrals'), icon: Users, path: '/dashboard/referrals', color: 'text-yellow-400' },
    { title: t('tool_academy'), icon: PlaySquare, path: '/dashboard/series', color: 'text-cyan-400' },
    { title: t('tool_kyc'), icon: ShieldCheck, path: '/dashboard/kyc', color: 'text-blue-500' },
    { title: t('tool_2fa'), icon: Lock, path: '/dashboard/security', color: 'text-emerald-400' }
  ];

  // ⭐ HERRAMIENTAS DEL FAN
  const fanTools = [
    { title: t('tool_subs'), icon: Star, path: '/dashboard/subscriptions', color: 'text-pink-500' },
    { title: t('tool_msgs'), icon: MessageCircle, path: '/dashboard/messages', color: 'text-teal-400' },
    { title: t('tool_explore'), icon: Compass, path: '/explore', color: 'text-indigo-400' },
    { title: t('tool_bookmarks'), icon: Bookmark, path: '/dashboard/bookmarks', color: 'text-yellow-500' },
    { title: t('tool_2fa_fan'), icon: Lock, path: '/dashboard/security', color: 'text-emerald-400' }
  ];

  const handleNavigation = (path: string) => {
    if (path === 'CONFIG_FIRST') {
      alert(t('alert_config_first'));
      router.push('/dashboard/profile');
    } else {
      router.push(path);
    }
  };

  const ToolCard = ({ tool }: { tool: any }) => {
    const Icon = tool.icon;
    return (
      <div 
        onClick={() => handleNavigation(tool.path)}
        className="nm-btn p-6 flex flex-col justify-center gap-4 cursor-pointer group h-full border border-white/5 hover:border-white/10 transition-all active:scale-95"
      >
        <div className={`w-14 h-14 rounded-2xl bg-[#0a0a0a] nm-inset flex items-center justify-center shadow-inner ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" strokeWidth={2} />
        </div>
        <h3 className="text-white font-black text-sm md:text-base group-hover:text-gray-300 transition-colors tracking-wide">
          {tool.title}
        </h3>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        {/* NAVBAR SUPERIOR */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" /> {t('nav_title')}
          </h1>
          <button 
            onClick={() => router.push('/feed')} 
            className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-5xl mx-auto mt-10 px-4 space-y-10 relative z-10">
          
          {/* HEADER DE BIENVENIDA */}
          <div className="nm-inset p-8 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-3">
                {t('hello')}, {user?.username || 'Usuario'} <span className="text-4xl animate-wave origin-bottom-right inline-block">👋</span>
              </h2>
              <p className="text-gray-500 mt-2 text-lg font-medium">{t('welcome_desc')}</p>
            </div>
            {user?.role === 'CREATOR' && (
               <div className="nm-btn px-6 py-3 flex items-center gap-2 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-xs rounded-full cursor-default shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                 <Crown className="w-5 h-5" /> {t('badge_creator')}
               </div>
            )}
          </div>

          {/* =========================================
              💰 BILLETERA VIRTUAL DEL FAN
          ========================================= */}
          <div className="bg-[#111] border border-green-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(34,197,94,0.1)] mb-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 w-full md:w-auto text-center sm:text-left">
              <div>
                <h3 className="text-gray-400 text-xs uppercase tracking-[0.2em] font-bold mb-1 flex items-center justify-center sm:justify-start gap-2">
                  <Wallet className="w-4 h-4 text-green-400"/> {t('lbl_balance')}
                </h3>
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="text-5xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                    ${Number(user?.walletBalance || 0).toFixed(2)}
                  </span>
                  <span className="text-green-500 font-bold tracking-widest">USD</span>
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/dashboard/wallet')}
                className="nm-btn border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white hover:border-green-500/30 transition-all flex items-center gap-2 mb-1 sm:mb-2 mx-auto sm:mx-0"
              >
                <History className="w-3 h-3" /> {t('btn_view_statement')}
              </button>
            </div>

            {/* 🚀 BOTÓN DEPAY DIRECTO: Reemplaza al viejo modal */}
            <div className="w-full md:w-auto shrink-0">
               <BotonDePay userId={user.id} />
            </div>
          </div>

          {/* CREADOR O FAN TOOLS... */}
          {(user?.role === 'CREATOR' || user?.role === 'ADMIN') ? (
            <div className="space-y-12 animate-fade-in">
              <div>
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Crown className="w-3 h-3" /> {t('section_creator')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {creatorTools.map((tool, index) => <ToolCard key={index} tool={tool} />)}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Star className="w-3 h-3" /> {t('section_fan')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {fanTools.map((tool, index) => <ToolCard key={`fan-${index}`} tool={tool} />)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12 animate-fade-in">
              <div>
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Star className="w-3 h-3" /> {t('section_fan_tools')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {fanTools.map((tool, index) => <ToolCard key={`fan-${index}`} tool={tool} />)}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}