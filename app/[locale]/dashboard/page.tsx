"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// 🔥 ICONOS PREMIUM DE LUCIDE (Nuevos Iconos Agregados)
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
  Crown,
  Zap,
  CreditCard,
  History,         
  ArrowUpRight,    
  ArrowDownLeft,   
  Lock,
  Users,
  DollarSign,
  PlaySquare, // 👈 NUEVO: Icono de Academia VIP
  ShieldCheck // 👈 NUEVO: Icono de KYC             
} from 'lucide-react';
import AppLayout from '../../../components/AppLayout';
import { paymentService } from '../../../lib/paymentService';
import api from '../../../lib/api';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function DashboardIndex() {
  const router = useRouter();
  const pathname = usePathname(); // 👈 El nuevo radar de rutas
  const t = useTranslations('DashboardIndex'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [user, setUser] = useState<any>(null);
  
  // 💰 ESTADOS FINANCIEROS
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [isProcessingPago, setIsProcessingPago] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]); // 👈 Estado del Historial

  const handleTopUp = async (amount: number) => {
    if (isProcessingPago) return;
    setIsProcessingPago(true);
    
    try {
      // 1. Pedimos la orden al Backend
      const res = await paymentService.createPaymentIntent({
        amount: amount,
        type: 'CREDIT_TOPUP',
        creatorId: user.id, 
        description: `Recarga de Billetera: $${amount} USD`
      });

      // 🛡️ BUSCAMOS LA URL (Soporta todos los formatos: directo, res.data, res.url, etc.)
      const urlPago = res?.checkoutUrl || res?.data?.checkoutUrl || res?.url || res?.data?.url;

      // 2. 🔥 SI HAY URL, SALTAMOS SIN PREGUNTAR
      if (urlPago) {
        window.location.href = urlPago;
        return; 
      } 
      
      // 🕵️‍♂️ SI NO HAY URL, NO LANZAMOS ALERT. 
      // Solo lo imprimimos en consola para que tú lo veas si algo falla de verdad.
      console.warn("Pago iniciado, esperando redirección...", res);

    } catch (error) {
      // Silenciamos el error para que la transición sea fluida
      console.error("Error silencioso en pasarela:", error);
    } finally {
      // Liberamos el botón después de 5 segundos por si el usuario regresa
      setTimeout(() => setIsProcessingPago(false), 5000);
    }
  };

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

  // 👑 HERRAMIENTAS EXCLUSIVAS DEL CREADOR (Motor PayRam Integrado)
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
        
        {/* Luces de ambiente sutiles */}
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
              💰 BILLETERA VIRTUAL DEL FAN (CON ACCESO PROFESIONAL)
          ========================================= */}
          <div className="bg-[#111] border border-green-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(34,197,94,0.1)] mb-10">
            {/* Contenedor Izquierdo: Saldo + Botón Historial */}
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
              
              {/* 👈 BOTÓN PROFESIONAL DE ESTADO DE CUENTA */}
              <button 
                onClick={() => router.push('/dashboard/wallet')}
                className="nm-btn border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white hover:border-green-500/30 transition-all flex items-center gap-2 mb-1 sm:mb-2 mx-auto sm:mx-0"
              >
                <History className="w-3 h-3" /> {t('btn_view_statement')}
              </button>
            </div>

            {/* Contenedor Derecho: Botón Recargar */}
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] shrink-0"
            >
              <Zap className="w-5 h-5 fill-current" /> {t('btn_topup')}
            </button>
          </div>

          {/* 🔥 MODAL DE RECARGA CON MONTO LIBRE */}
          {showTopUpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 text-center relative">
                
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <CreditCard className="w-8 h-8 text-green-500" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">{t('modal_add_credits')}</h2>
                <p className="text-gray-400 text-sm mb-6">{t('modal_desc')}</p>

                {/* Botones Rápidos (CORREGIDO EL ARRAY AQUÍ) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[ 10, 20, 50, 100, 200, 500, 1000 ].map((amount) => (
                    <button 
                      key={amount}
                      onClick={() => handleTopUp(amount)}
                      disabled={isProcessingPago}
                      className="nm-btn border border-white/5 hover:border-green-500/50 py-3 rounded-xl text-xl font-black text-white transition-all disabled:opacity-50 group flex flex-col items-center justify-center"
                    >
                      <span className="text-green-400 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">{t('lbl_add_balance')}</span>
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* 🎯 Input de Monto Libre */}
                <div className="mb-6 relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-black text-xl">$</span>
                  </div>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder={t('ph_custom_amount')}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={isProcessingPago}
                    className="w-full bg-[#0a0a0a] border border-white/10 focus:border-green-500/50 rounded-xl pl-10 pr-24 py-4 text-white font-bold outline-none transition-colors placeholder:text-gray-600"
                  />
                  {customAmount && Number(customAmount) >= 1 && (
                    <button 
                      onClick={() => handleTopUp(Number(customAmount))}
                      disabled={isProcessingPago}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-black text-xs transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)] animate-fade-in"
                    >
                      {t('btn_charge')}
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => setShowTopUpModal(false)} 
                  disabled={isProcessingPago}
                  className="w-full text-gray-500 font-bold hover:text-white transition-colors"
                >
                  {t('btn_cancel')}
                </button>
              </div>
            </div>
          )}

          {(user?.role === 'CREATOR' || user?.role === 'ADMIN') ? (
            <div className="space-y-12 animate-fade-in">
              {/* HERRAMIENTAS CREADOR */}
              <div>
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Crown className="w-3 h-3" /> {t('section_creator')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {creatorTools.map((tool, index) => <ToolCard key={index} tool={tool} />)}
                </div>
              </div>

              {/* HERRAMIENTAS FAN */}
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
              {/* SECCIÓN FAN SOLAMENTE */}
              <div>
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Star className="w-3 h-3" /> {t('section_fan_tools')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {fanTools.map((tool, index) => <ToolCard key={`fan-${index}`} tool={tool} />)}
                </div>
              </div>

              {/* BANNER KYC */}
              <div className="nm-inset p-10 rounded-[2rem] text-center border border-red-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                  <Sparkles className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                  <h2 className="text-3xl font-black text-white">{t('kyc_banner_title')}</h2>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    {t('kyc_banner_desc')}
                  </p>
                  <button 
                    onClick={() => router.push('/dashboard/kyc')}
                    className="nm-btn-primary px-10 py-4 text-lg mt-4 inline-flex items-center gap-2 font-black transition-transform active:scale-95"
                  >
                    {t('btn_verify_id')}
                  </button>
                </div>
              </div>
              
              {/* =========================================
                  📜 HISTORIAL DE MOVIMIENTOS INCRUSTADO (SOLO PARA EL FAN)
              ========================================= */}
              <div className="mt-16 animate-fade-in">
                <h3 className="text-[10px] font-black text-gray-600 mb-6 border-b border-white/5 pb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History className="w-3 h-3 text-green-500" /> {t('history_recent')}
                </h3>
                
                <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default">
                  {transactions.length === 0 ? (
                    <div className="text-center text-gray-600 py-12 font-medium">
                      {t('history_empty')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((tx: any) => {
                        const isTopUp = tx.type === 'CREDIT_TOPUP';
                        const isIncome = tx.isIncome || isTopUp;
                        
                        const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                        const colorClass = isIncome ? 'text-green-400' : 'text-white';
                        const sign = isIncome ? '+' : '-';
                        const bgClass = isIncome ? 'border-green-500/20 hover:border-green-500/40 bg-green-500/5' : 'border-white/5 hover:border-red-500/20 nm-inset';

                        let concept = t('tx_default');
                        if (isTopUp) concept = t('tx_topup');
                        else if (tx.type === 'TIP') concept = `${t('tx_tip')} @${tx.receiver?.username || t('anonymous')}`;
                        else if (tx.type === 'SUBSCRIPTION') concept = `${t('tx_sub')} @${tx.receiver?.username || t('anonymous')}`;
                        else if (tx.type === 'PPV_MESSAGE') concept = `${t('tx_ppv')} @${tx.receiver?.username || t('anonymous')}`;
                        else concept = `${t('tx_payment')} @${tx.receiver?.username || t('anonymous')}`;

                        return (
                          <div key={tx.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${bgClass}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isIncome ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-black border-white/5 text-gray-400'}`}>
                                {isTopUp ? <Wallet className="w-5 h-5" /> : tx.type === 'TIP' ? <DollarSign className="w-5 h-5" /> : tx.type === 'SUBSCRIPTION' ? <Star className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm text-white font-black tracking-wide">{concept}</p>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-black text-lg font-mono tracking-tight ${colorClass}`}>
                                {sign}${parseFloat(tx.amount || tx.netAmount || 0).toFixed(2)}
                              </p>
                              
                              {/* 🔥 AQUÍ ESTÁ EL CAMBIO: El Radar de Estado Real */}
                              <p className={`text-[10px] font-bold uppercase mt-1 ${tx.status === 'PENDING' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                {tx.status === 'PENDING' ? '⏳ PENDIENTE' : '✅ COMPLETADO'}
                              </p>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}