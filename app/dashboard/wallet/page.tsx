// frontend/app/dashboard/wallet/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletService } from '../../../lib/walletService';
import api from '../../../lib/api';
import AppLayout from '../../../components/AppLayout';

// 🔥 IMPORTAMOS ICONOS DE ALTA GAMA DE LUCIDE REACT
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
  History
} from 'lucide-react';

export default function WalletDashboard() {
  const router = useRouter();
  const [financeData, setFinanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para Retiros
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Estados Billetera Cripto
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await walletService.getDashboard();
      setFinanceData(data);
      if (data.wallet?.cryptoAddress) {
        setCryptoAddress(data.wallet.cryptoAddress);
      }
    } catch (error) {
      console.error("Error al cargar la billetera", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCryptoWallet = async () => {
    if (!cryptoAddress.trim() || cryptoAddress.length < 10) {
      alert("Por favor ingresa una billetera USDT (TRC20) válida.");
      return;
    }
    setIsSavingWallet(true);
    try {
      await api.put('/wallet/update-crypto', { 
        cryptoAddress,
        cryptoNetwork: 'TRC20' 
      });
      alert("✅ ¡Billetera guardada con éxito!");
      fetchWallet();
    } catch (error) {
      alert("Error al guardar la billetera. Inténtalo de nuevo.");
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < 50) {
      alert("El retiro mínimo es de $50 USD.");
      return;
    }
    if (amount > financeData?.wallet?.balance) {
      alert("No puedes retirar más de tu Balance Disponible.");
      return;
    }
    if (!financeData?.wallet?.cryptoAddress) {
      alert("⚠️ Debes configurar tu Billetera Cripto (USDT TRC20) antes de poder retirar.");
      return;
    }
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      alert("Debes ingresar el código de 6 dígitos de tu Google Authenticator.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount,
        isExpress,
        twoFactorToken
      });
      alert(`🏦 ¡Éxito! ${res.data.message || 'Retiro en proceso.'}`);
      setWithdrawAmount(''); 
      setTwoFactorToken('');
      fetchWallet(); 
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al solicitar el retiro.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) return <AppLayout><div className="min-h-screen bg-nm-base flex items-center justify-center"><Loader2 className="w-12 h-12 text-green-500 animate-spin drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen pb-24 bg-nm-base relative">
        
        {/* Iluminación Ambiental */}
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-green-900/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-wide">
            <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <Wallet className="w-5 h-5" />
            </div>
            Mi Bóveda
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
          </button>
        </nav>

        <main className="max-w-6xl mx-auto mt-8 px-4 space-y-8 relative z-10">
          
          {/* =========================================
              📊 FILA 1: TARJETAS DE MÉTRICAS (Neumórficas)
          ========================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Balance Disponible */}
            <div className="nm-inset p-8 rounded-[2rem] border border-green-500/30 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-green-500/10 group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Balance Disponible
              </h3>
              <p className="text-5xl font-black text-white z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                ${financeData?.wallet?.balance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[10px] text-green-400 mt-4 font-bold uppercase tracking-widest nm-inset bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-md inline-flex w-fit z-10">
                Fondos listos para retirar
              </p>
            </div>
            
            {/* En Retención */}
            <div className="nm-btn border border-yellow-500/20 p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden cursor-default group">
              <div className="absolute -right-6 -top-6 text-yellow-500/5 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <ShieldCheck className="w-4 h-4 text-yellow-500" /> En Cuarentena (Pending)
              </h3>
              <p className="text-5xl font-black text-white z-10">
                ${financeData?.wallet?.pendingBalance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[10px] text-yellow-500 mt-4 font-bold uppercase tracking-widest z-10">
                Liberación automática Anti-Fraude (48h)
              </p>
            </div>

            {/* Ganancias Históricas */}
            <div className="nm-btn border border-purple-500/20 p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden cursor-default group">
              <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-48 h-48" strokeWidth={1} />
              </div>
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 z-10">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Histórico Facturado
              </h3>
              <p className="text-5xl font-black text-purple-400 z-10">
                ${financeData?.totalEarnedHistorial?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-widest z-10">
                Total generado en la plataforma
              </p>
            </div>
          </div>

          {/* =========================================
              🛡️ FILA 2: FORMULARIO DE RETIRO Y BILLETERA
          ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* CAJERO: Solicitar Retiro */}
            <div className="nm-inset p-8 rounded-[2rem] border border-white/5">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 tracking-wide">
                <SendToBack className="w-6 h-6 text-green-500" /> Solicitar Retiro
              </h2>
              
              <div className="space-y-6">
                
                {/* Monto */}
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-3 pl-1">
                    Monto a retirar (Min. $50 USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-2xl">$</span>
                    <input 
                      type="number" 
                      min="50"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full nm-inset rounded-xl pl-12 pr-6 py-5 text-white text-3xl font-black outline-none focus:border-green-500/50 transition-colors placeholder:text-gray-800"
                    />
                  </div>
                </div>

                {/* Tipo de Retiro (Toggles Neumórficos) */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsExpress(false)}
                    className={`p-4 rounded-2xl flex flex-col items-start transition-all ${
                      !isExpress 
                        ? 'nm-inset border border-blue-500/30 text-blue-400' 
                        : 'nm-btn border border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black mb-1">
                      <Turtle className="w-5 h-5" /> Estándar
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-2">Comisión 2%</p>
                    <p className="text-[10px] opacity-60 font-medium">Hasta 7 días</p>
                  </button>
                  
                  <button 
                    onClick={() => setIsExpress(true)}
                    className={`p-4 rounded-2xl flex flex-col items-start transition-all ${
                      isExpress 
                        ? 'nm-inset border border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                        : 'nm-btn border border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black mb-1">
                      <Zap className="w-5 h-5" /> Exprés
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-2">Comisión 5%</p>
                    <p className="text-[10px] opacity-60 font-medium">Menos de 24 hrs</p>
                  </button>
                </div>

                {/* Autenticación 2FA */}
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Google Authenticator (2FA)
                    </label>
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                      <Lock className="w-3 h-3"/> Requerido
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full nm-inset rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.7em] font-mono font-bold outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-800"
                  />
                </div>

                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || twoFactorToken.length !== 6 || !financeData?.wallet?.cryptoAddress}
                  className="w-full nm-btn-primary py-5 rounded-2xl text-lg flex justify-center items-center gap-3 disabled:opacity-50 disabled:scale-100 mt-4"
                >
                  {isWithdrawing ? (
                    <><Loader2 className="w-6 h-6 animate-spin"/> Procesando Retiro...</>
                  ) : (
                    <><SendToBack className="w-6 h-6"/> Enviar Solicitud a Bóveda</>
                  )}
                </button>
              </div>
            </div>

            {/* AJUSTES Y REQUISITOS (Columna Derecha) */}
            <div className="space-y-8 flex flex-col">
              
              {/* Configurar Billetera USDT */}
              <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex-1">
                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-3 tracking-wide">
                  <LinkIcon className="w-6 h-6 text-purple-500" /> Billetera Receptora
                </h3>
                <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
                  Ingresa tu dirección exacta de <strong>USDT (Red Tron / TRC20)</strong>. Aquí depositaremos tus ganancias automáticamente.
                </p>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={cryptoAddress} 
                    onChange={(e) => setCryptoAddress(e.target.value)} 
                    placeholder="Pega tu dirección (Ej: Txyz...)" 
                    className="w-full nm-inset rounded-xl px-5 py-4 text-sm font-mono text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-700 font-bold" 
                  />
                  <button 
                    onClick={handleSaveCryptoWallet} 
                    disabled={isSavingWallet || !cryptoAddress} 
                    className="w-full nm-btn border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white font-bold px-4 py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingWallet ? <><Loader2 className="w-5 h-5 animate-spin"/> Guardando...</> : <><CheckCircle2 className="w-5 h-5"/> Guardar Dirección Cripto</>}
                  </button>
                </div>
              </div>

              {/* Checklist de Seguridad */}
              <div className="nm-inset border border-orange-500/20 bg-[#110505] p-6 rounded-[2rem]">
                <p className="font-black flex items-center gap-2 mb-4 text-orange-500 text-sm uppercase tracking-wide">
                  <AlertTriangle className="w-5 h-5" /> Reglas de Retiro
                </p>
                <ul className="space-y-3 text-xs text-gray-400 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0"/> Monto mínimo de solicitud: $50 USD.</li>
                  <li className="flex items-center gap-3"><IdCard className="w-4 h-4 text-blue-400 shrink-0"/> Identidad Legal (KYC) debe estar aprobada.</li>
                  <li className="flex items-center gap-3"><Smartphone className="w-4 h-4 text-purple-400 shrink-0"/> App de Google Authenticator (2FA) activa.</li>
                  <li className="flex items-center gap-3"><Turtle className="w-4 h-4 text-yellow-500 shrink-0"/> Retiro estándar limitado a 1 por semana.</li>
                </ul>
              </div>

            </div>
          </div>

          {/* =========================================
              📜 FILA 3: TABLAS HISTÓRICAS
          ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            
            {/* ÚLTIMOS INGRESOS */}
            <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" /> Últimos Ingresos (Fans)
              </h2>
              {(!financeData?.recentTransactions || financeData.recentTransactions.length === 0) ? (
                <div className="text-center text-gray-600 py-12 font-medium">No hay ingresos registrados aún.</div>
              ) : (
                <div className="space-y-4">
                  {financeData.recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl nm-inset border border-white/5 hover:border-green-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl nm-inset bg-black flex items-center justify-center text-sm border border-white/5">
                          {tx.type === 'SUBSCRIPTION' ? <Star className="w-4 h-4 text-purple-400" /> : tx.type === 'TIP' ? <DollarSign className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm text-white font-black tracking-wide">@{tx.sender?.username || 'Anónimo'}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-green-400 font-black text-base drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                        +${tx.netAmount?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HISTORIAL DE RETIROS */}
            <div className="nm-btn border border-white/5 p-6 rounded-[2rem] cursor-default">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" /> Estado de Retiros
              </h2>
              {(!financeData?.withdrawalHistory || financeData.withdrawalHistory.length === 0) ? (
                <div className="text-center text-gray-600 py-12 font-medium">Aún no has solicitado ningún retiro.</div>
              ) : (
                <div className="space-y-4">
                  {financeData.withdrawalHistory.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl nm-inset border border-white/5 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl nm-inset bg-black flex items-center justify-center border ${
                          w.status === 'PENDING' ? 'border-yellow-500/30 text-yellow-500' : 
                          w.status === 'PROCESSING' ? 'border-orange-500/30 text-orange-400' : 
                          w.status === 'APPROVED' || w.status === 'PAID' ? 'border-blue-500/30 text-blue-400' : 
                          'border-red-500/30 text-red-500'
                        }`}>
                          {w.status === 'PENDING' ? <Clock className="w-4 h-4" /> : w.status === 'PROCESSING' ? <Loader2 className="w-4 h-4 animate-spin" /> : w.status === 'PAID' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-[11px] font-black uppercase tracking-widest ${
                            w.status === 'PENDING' ? 'text-yellow-500' : 
                            w.status === 'PROCESSING' ? 'text-orange-400' :
                            w.status === 'PAID' ? 'text-blue-400' : 
                            'text-red-500'
                          }`}>
                            {w.status === 'PENDING' ? 'En Espera' : w.status === 'PROCESSING' ? 'Procesando' : w.status === 'PAID' ? 'Transferido' : 'Rechazado'}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{new Date(w.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black text-base">-${w.amount?.toFixed(2)}</p>
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