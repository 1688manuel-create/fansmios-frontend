"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletService } from '../../../../lib/walletService';
import api from '../../../../lib/api';
import AppLayout from '../../../../components/AppLayout';
import { useTranslations } from 'next-intl'; 

// 🔥 IMPORTAMOS ICONOS DE ALTA GAMA (Añadidos Coins y ChevronRight)
import { 
  Wallet, 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  SendToBack, 
  Turtle, 
  Zap, 
  Lock, 
  Link as LinkIcon, 
  AlertTriangle, 
  CheckCircle2, 
  IdCard, 
  Smartphone, 
  Download, 
  Star, 
  Banknote, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ShieldCheck,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ChevronRight,
  Diamond
} from 'lucide-react';

// 📦 PAQUETES TÁCTICOS DE MONEDAS
const COIN_PACKAGES = [
  { id: 'pkg_basic', name: 'Puñado', coins: 500, priceUsd: 5.00, bonus: 0, icon: '🪙', color: 'from-gray-500 to-slate-400' },
  { id: 'pkg_pro', name: 'Saco', coins: 1000, priceUsd: 10.00, bonus: 50, icon: '💰', color: 'from-blue-500 to-cyan-400' },
  { id: 'pkg_vip', name: 'Cofre', coins: 5000, priceUsd: 45.00, bonus: 500, icon: '🧰', color: 'from-yellow-500 to-orange-500', popular: true },
  { id: 'pkg_god', name: 'Bóveda', coins: 10000, priceUsd: 90.00, bonus: 1500, icon: '💎', color: 'from-purple-500 to-fuchsia-500' },
];

export default function WalletDashboard() {
  const router = useRouter();
  const t = useTranslations('WalletDashboard'); 
  const [financeData, setFinanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('FAN'); 
  const [localUser, setLocalUser] = useState<any>(null); 
  
  // Estados para Retiros (Creadores)
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Estados Billetera Cripto
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  // 🔥 NUEVO: Estado para la compra de monedas
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      const parsedUser = JSON.parse(storedUser);
      setUserRole(parsedUser.role || 'FAN');
      setLocalUser(parsedUser); 
    }
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await walletService.getDashboard();
      setFinanceData(data);
      if (data?.wallet?.cryptoAddress) {
        setCryptoAddress(data.wallet.cryptoAddress);
      }
    } catch (error) {
      console.error("Error al cargar la billetera", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 DISPARADOR DE COMPRA CRIPTO PARA FANS
  const handleBuyPackage = async (pkg: typeof COIN_PACKAGES[0]) => {
    if (loadingPkg) return;
    setLoadingPkg(pkg.id);

    try {
      const response = await api.post('/wallet/buy-coins', {
        packageId: pkg.id,
        amountUsd: pkg.priceUsd,
        coinsToAdd: pkg.coins + pkg.bonus
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        alert("Error: No se recibió la ruta de pago cripto.");
      }
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
      alert("Hubo un error al conectar con la pasarela blindada. Intenta de nuevo.");
    } finally {
      setLoadingPkg(null);
    }
  };

  const handleSaveCryptoWallet = async () => {
    if (!cryptoAddress.trim() || cryptoAddress.length < 10) {
      alert(t('alert_invalid_wallet'));
      return;
    }
    setIsSavingWallet(true);
    try {
      await api.put('/wallet/update-crypto', { 
        cryptoAddress,
        cryptoNetwork: 'TRC20' 
      });
      alert(t('alert_wallet_saved'));
      fetchWallet();
    } catch (error) {
      alert(t('alert_error_wallet'));
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const availableBalance = financeData?.wallet?.balance || 0;
    
    if (!amount || amount < 50) {
      alert(t('alert_min_withdraw'));
      return;
    }
    if (amount > availableBalance) {
      alert(t('alert_exceed_balance'));
      return;
    }
    if (!financeData?.wallet?.cryptoAddress) {
      alert(t('alert_missing_crypto'));
      return;
    }
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      alert(t('alert_missing_2fa'));
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await api.post('/wallet/withdraw', { amount, isExpress, twoFactorToken });
      alert(`🏦 ${t('alert_success')} ${res.data.message || t('alert_withdraw_process')}`);
      setWithdrawAmount(''); 
      setTwoFactorToken('');
      fetchWallet(); 
    } catch (error: any) {
      alert(error.response?.data?.error || t('alert_error_withdraw'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-nm-base flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/>
        </div>
      </AppLayout>
    );
  }

  // 🛡️ VARIABLES SEGURAS
  const availableBalance = financeData?.wallet?.balance || 0;
  const pendingBalance = financeData?.wallet?.pendingBalance || 0;
  const totalEarned = financeData?.totalEarnedHistorial || 0;
  const allTransactions = financeData?.recentTransactions || [];
  const fanExactBalance = parseFloat(localUser?.walletBalance || financeData?.wallet?.balance || 0).toFixed(2);
  const fanCoins = financeData?.wallet?.coinBalance || localUser?.coinBalance || 0;

  // ============================================================================
  // 🌟 VISTA EXCLUSIVA PARA FANS (NIVEL 5 - ECONOMÍA INFINITA)
  // ============================================================================
  if (userRole === 'FAN') {
    return (
      <AppLayout>
        <div className="min-h-screen pb-24 bg-nm-base relative">
          <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-yellow-900/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
          
          <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
            <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-wide">
              <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <Coins className="w-5 h-5" />
              </div>
              Bóveda
            </h1>
            <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
            </button>
          </nav>

          <main className="max-w-4xl mx-auto mt-8 px-4 space-y-8 relative z-10">
            
            {/* 🛡️ BANNER DE SALDO DEL FAN */}
            <div className="nm-inset p-8 rounded-[2rem] border border-yellow-500/20 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="z-10">
                <h3 className="text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-500" /> Bóveda Segura
                </h3>
                <p className="text-gray-400 text-sm font-medium">Municiones para apoyar a tus creadores en vivo.</p>
                <div className="mt-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full w-fit">
                  <Lock className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Cripto 100% Anónimo</span>
                </div>
              </div>

              <div className="flex gap-4 z-10">
                {/* Saldo Secundario (USD) */}
                <div className="bg-[#0a0a0a] border border-white/5 px-6 py-4 rounded-3xl shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] flex flex-col items-center justify-center">
                  <span className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Saldo USD</span>
                  <span className="text-xl font-bold text-gray-300 font-mono">${fanExactBalance}</span>
                </div>
                
                {/* Saldo Principal (Monedas) */}
                <div className="bg-[#0a0a0a] border border-yellow-500/30 px-8 py-4 rounded-3xl shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                  <span className="text-xs text-yellow-500/80 font-black mb-1 uppercase tracking-widest">Fansmio Coins</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 font-mono tracking-tight drop-shadow-md">
                      {fanCoins}
                    </span>
                    <Coins className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* 🛒 LA VITRINA DE PAQUETES DE MONEDAS */}
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Recargar Municiones
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {COIN_PACKAGES.map((pkg) => (
                  <div key={pkg.id} className={`relative bg-[#0a0a0a] rounded-3xl p-1 transition-all duration-300 hover:scale-[1.02] ${pkg.popular ? 'bg-gradient-to-b from-yellow-500/40 to-[#0a0a0a] shadow-[0_0_20px_rgba(234,179,8,0.1)] border-0' : 'border border-white/5 hover:border-white/20'}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-10 whitespace-nowrap">
                        Más Popular
                      </div>
                    )}
                    <div className="bg-[#111] rounded-[22px] p-5 h-full flex flex-col items-center text-center nm-inset border border-transparent">
                      <div className="text-4xl mb-2 drop-shadow-2xl">{pkg.icon}</div>
                      <h3 className="text-sm font-bold text-gray-300 mb-1">{pkg.name}</h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-xl font-black font-mono text-yellow-400 tracking-tight">{pkg.coins.toLocaleString()}</span>
                      </div>
                      {pkg.bonus > 0 ? (
                        <div className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black px-2 py-0.5 rounded-full mb-4 animate-pulse">
                          + {pkg.bonus} Gratis
                        </div>
                      ) : (
                        <div className="h-5 mb-4"></div>
                      )}
                      <div className="mt-auto w-full">
                        <button 
                          onClick={() => handleBuyPackage(pkg)}
                          disabled={loadingPkg !== null}
                          className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${pkg.popular ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                        >
                          {loadingPkg === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pagar ${pkg.priceUsd.toFixed(2)} <ChevronRight className="w-3 h-3" /></>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HISTORIAL DE MOVIMIENTOS DEL FAN (Intacto) */}
            <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default mt-8">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-green-500" /> {t('fan_history_title')}
              </h2>
              {allTransactions.length === 0 ? (
                <div className="text-center text-gray-600 py-12 font-medium">{t('fan_empty_history')}</div>
              ) : (
                <div className="space-y-4">
                  {allTransactions.map((tx: any) => {
                    const isTopUp = tx.type === 'CREDIT_TOPUP';
                    const isIncome = tx.isIncome || isTopUp;
                    const isPending = tx.status === 'PENDING';
                    
                    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                    const colorClass = isIncome ? 'text-green-400' : 'text-white';
                    const sign = isIncome ? '+' : '-';
                    
                    const bgClass = isPending 
                      ? 'border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-500/5 opacity-80' 
                      : (isIncome ? 'border-green-500/20 hover:border-green-500/40 bg-green-500/5' : 'border-white/5 hover:border-red-500/20 nm-inset');

                    let concept = t('tx_default');
                    if (isTopUp) concept = t('tx_topup');
                    else if (tx.type === 'TIP') concept = `${t('tx_tip')} @${tx.receiver?.username || t('anonymous')}`;
                    else if (tx.type === 'SUBSCRIPTION') concept = `${t('tx_sub')} @${tx.receiver?.username || t('anonymous')}`;
                    else if (tx.type === 'PPV_MESSAGE') concept = `${t('tx_ppv')} @${tx.receiver?.username || t('anonymous')}`;
                    else concept = `${t('tx_payment')} @${tx.receiver?.username || t('anonymous')}`;

                    return (
                      <div key={tx.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${bgClass}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isIncome && !isPending ? 'bg-green-500/10 border-green-500/20 text-green-400' : isPending ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-black border-white/5 text-gray-400'}`}>
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
                          <p className={`font-black text-lg font-mono tracking-tight ${isPending ? 'text-yellow-500' : colorClass}`}>
                            {sign}${parseFloat(tx.amount || tx.netAmount || 0).toFixed(2)}
                          </p>
                          <p className={`text-[10px] font-bold uppercase mt-1 flex items-center justify-end gap-1 ${isPending ? 'text-yellow-500' : 'text-gray-500'}`}>
                            {isPending ? <><Clock className="w-3 h-3" /> ⏳ PENDIENTE</> : <><CheckCircle2 className="w-3 h-3" /> {t('lbl_completed')}</>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

  // ============================================================================
  // 🏦 VISTA PARA CREADORES / ADMINS (Mantenido intacto)
  // ============================================================================
  return (
    <AppLayout>
      <div className="min-h-screen pb-24 bg-nm-base relative">
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-green-900/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-wide">
            <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <Wallet className="w-5 h-5" />
            </div>
            {t('creator_nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-6xl mx-auto mt-8 px-4 space-y-8 relative z-10">
          {/* =========================================
              📊 FILA 1: TARJETAS DE MÉTRICAS
          ========================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="nm-inset p-8 rounded-[2rem] border border-green-500/30 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-green-500/10 group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> {t('lbl_available_balance')}
              </h3>
              <p className="text-5xl font-black text-white z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                ${Number(availableBalance || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-green-400 mt-4 font-bold uppercase tracking-widest nm-inset bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-md inline-flex w-fit z-10">
                {t('lbl_funds_ready')}
              </p>
            </div>
            
            <div className="nm-btn border border-yellow-500/20 p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden cursor-default group">
              <div className="absolute -right-6 -top-6 text-yellow-500/5 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <ShieldCheck className="w-4 h-4 text-yellow-500" /> {t('lbl_pending_balance')}
              </h3>
              <p className="text-5xl font-black text-white z-10">
                ${Number(pendingBalance || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-yellow-500 mt-4 font-bold uppercase tracking-widest z-10">
                {t('lbl_anti_fraud')}
              </p>
            </div>

            <div className="nm-btn border border-purple-500/20 p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden cursor-default group">
              <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <TrendingUp className="w-4 h-4 text-purple-400" /> {t('lbl_total_earned')}
              </h3>
              <p className="text-5xl font-black text-purple-400 z-10">
                ${totalEarned.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-widest z-10">
                {t('lbl_total_platform')}
              </p>
            </div>
          </div>

          {/* =========================================
              🛡️ FILA 2: FORMULARIO DE RETIRO Y BILLETERA
          ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="nm-inset p-8 rounded-[2rem] border border-white/5">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 tracking-wide">
                <SendToBack className="w-6 h-6 text-green-500" /> {t('withdraw_title')}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-3 pl-1">
                    {t('lbl_withdraw_amount')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-2xl">$</span>
                    <input type="number" min="50" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full nm-inset rounded-xl pl-12 pr-6 py-5 text-white text-3xl font-black outline-none focus:border-green-500/50 transition-colors placeholder:text-gray-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setIsExpress(false)} className={`p-4 rounded-2xl flex flex-col items-start transition-all ${!isExpress ? 'nm-inset border border-blue-500/30 text-blue-400' : 'nm-btn border border-transparent text-gray-500 hover:text-gray-300'}`}>
                    <div className="flex items-center gap-2 font-black mb-1"><Turtle className="w-5 h-5" /> {t('type_standard')}</div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-2">{t('fee_2')}</p>
                    <p className="text-[10px] opacity-60 font-medium">{t('time_7d')}</p>
                  </button>
                  <button onClick={() => setIsExpress(true)} className={`p-4 rounded-2xl flex flex-col items-start transition-all ${isExpress ? 'nm-inset border border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'nm-btn border border-transparent text-gray-500 hover:text-gray-300'}`}>
                    <div className="flex items-center gap-2 font-black mb-1"><Zap className="w-5 h-5" /> {t('type_express')}</div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-2">{t('fee_5')}</p>
                    <p className="text-[10px] opacity-60 font-medium">{t('time_24h')}</p>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lbl_2fa')}</label>
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20"><Lock className="w-3 h-3"/> {t('lbl_required')}</span>
                  </div>
                  <input type="text" maxLength={6} value={twoFactorToken} onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full nm-inset rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.7em] font-mono font-bold outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-800" />
                </div>

                <button onClick={handleWithdraw} disabled={isWithdrawing || !withdrawAmount || twoFactorToken.length !== 6 || !financeData?.wallet?.cryptoAddress} className="w-full nm-btn-primary py-5 rounded-2xl text-lg flex justify-center items-center gap-3 disabled:opacity-50 disabled:scale-100 mt-4">
                  {isWithdrawing ? <><Loader2 className="w-6 h-6 animate-spin"/> {t('btn_processing_withdraw')}</> : <><SendToBack className="w-6 h-6"/> {t('btn_submit_withdraw')}</>}
                </button>
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex-1">
                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-3 tracking-wide"><LinkIcon className="w-6 h-6 text-purple-500" /> {t('wallet_title')}</h3>
                <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">{t('wallet_desc_1')} <strong>USDT (Red Tron / TRC20)</strong>. {t('wallet_desc_2')}</p>
                <div className="space-y-4">
                  <input type="text" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} placeholder={t('ph_wallet')} className="w-full nm-inset rounded-xl px-5 py-4 text-sm font-mono text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-700 font-bold" />
                  <button onClick={handleSaveCryptoWallet} disabled={isSavingWallet || !cryptoAddress} className="w-full nm-btn border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white font-bold px-4 py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSavingWallet ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('btn_saving')}</> : <><CheckCircle2 className="w-5 h-5"/> {t('btn_save_wallet')}</>}
                  </button>
                </div>
              </div>

              <div className="nm-inset border border-orange-500/20 bg-[#110505] p-6 rounded-[2rem]">
                <p className="font-black flex items-center gap-2 mb-4 text-orange-500 text-sm uppercase tracking-wide"><AlertTriangle className="w-5 h-5" /> {t('rules_title')}</p>
                <ul className="space-y-3 text-xs text-gray-400 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0"/> {t('rule_1')}</li>
                  <li className="flex items-center gap-3"><IdCard className="w-4 h-4 text-blue-400 shrink-0"/> {t('rule_2')}</li>
                  <li className="flex items-center gap-3"><Smartphone className="w-4 h-4 text-purple-400 shrink-0"/> {t('rule_3')}</li>
                  <li className="flex items-center gap-3"><Turtle className="w-4 h-4 text-yellow-500 shrink-0"/> {t('rule_4')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* =========================================
              📜 FILA 3: TABLAS HISTÓRICAS
          ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Download className="w-4 h-4 text-green-500" /> {t('income_title')}</h2>
              {(!financeData?.recentTransactions || financeData.recentTransactions.length === 0) ? (
                <div className="text-center text-gray-600 py-12 font-medium">{t('income_empty')}</div>
              ) : (
                <div className="space-y-4">
                  {financeData.recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl nm-inset border border-white/5 hover:border-green-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl nm-inset bg-black flex items-center justify-center text-sm border border-white/5">
                          {tx.type === 'SUBSCRIPTION' ? <Star className="w-4 h-4 text-purple-400" /> : tx.type === 'TIP' ? <DollarSign className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm text-white font-black tracking-wide">@{tx.sender?.username || t('anonymous')}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-green-400 font-black text-base drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">+${(tx.netAmount || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-blue-500" /> {t('history_title')}</h2>
              {(!financeData?.withdrawalHistory || financeData.withdrawalHistory.length === 0) ? (
                <div className="text-center text-gray-600 py-12 font-medium">{t('history_empty')}</div>
              ) : (
                <div className="space-y-4">
                  {financeData.withdrawalHistory.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl nm-inset border border-white/5 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl nm-inset bg-black flex items-center justify-center border ${w.status === 'PENDING' ? 'border-yellow-500/30 text-yellow-500' : w.status === 'PROCESSING' ? 'border-orange-500/30 text-orange-400' : (w.status === 'APPROVED' || w.status === 'PAID') ? 'border-blue-500/30 text-blue-400' : 'border-red-500/30 text-red-500'}`}>
                          {w.status === 'PENDING' ? <Clock className="w-4 h-4" /> : w.status === 'PROCESSING' ? <Loader2 className="w-4 h-4 animate-spin" /> : (w.status === 'APPROVED' || w.status === 'PAID') ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-[11px] font-black uppercase tracking-widest ${w.status === 'PENDING' ? 'text-yellow-500' : w.status === 'PROCESSING' ? 'text-orange-400' : (w.status === 'APPROVED' || w.status === 'PAID') ? 'text-blue-400' : 'text-red-500'}`}>
                            {w.status === 'PENDING' ? t('status_pending') : w.status === 'PROCESSING' ? t('status_processing') : w.status === 'APPROVED' ? t('status_approved') : w.status === 'PAID' ? t('status_paid') : t('status_rejected')}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{new Date(w.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black text-base">-${(w.amount || 0).toFixed(2)}</p>
                        {w.adminNotes && <p className="text-[9px] text-gray-500 font-medium max-w-[120px] truncate mt-1" title={w.adminNotes}>{w.adminNotes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}