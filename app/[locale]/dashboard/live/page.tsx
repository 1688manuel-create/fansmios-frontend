"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { liveService } from '../../../../lib/liveService';
import api from '../../../../lib/api'; // Inyectamos API para traer balance
import { 
  Tv, 
  ArrowLeft, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  Lock,
  Wallet
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function LiveSetupLobby() {
  const router = useRouter();
  const t = useTranslations('LiveSetupLobby'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [title, setTitle] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [isStarting, setIsStarting] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // 🔥 CARGA DE BALANCE MOTIVACIONAL
  useEffect(() => {
    api.get('/wallet/balance')
      .then(res => setUserBalance(res.data.balance))
      .catch(() => setUserBalance(0));
  }, []);

  const handleStartLive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanTitle = title.trim();

    // 🛡️ VALIDACIÓN DE TÍTULO
    if (!cleanTitle) {
      alert(t('alert_title_required'));
      return;
    }

    const finalPrice = isPPV ? Number(price) : 0;

    // 💰 VALIDACIÓN DE PRECIO PPV
    if (isPPV && (!Number.isFinite(finalPrice) || finalPrice < 1)) {
      alert(t('alert_price_min'));
      return;
    }

    setIsStarting(true);

    try {
      // 🚀 CREACIÓN DEL EVENTO EN EL SERVIDOR
      const res = await liveService.createStream(cleanTitle, isPPV, finalPrice);
      const streamId = res?.streamId || res?.liveStream?.id;

      if (!streamId) {
        throw new Error(t('error_room_id'));
      }

      // ⚡ TELETRANSPORTACIÓN A LA SALA
      await router.push(`/live/${streamId}`);
      
    } catch (error: unknown) {
      console.error("🚨 Error crítico al iniciar Live:", error);

      let errorMessage = t('error_server_conn');

      // 🕵️ ESTRATEGIA DE DETECCIÓN DE ERRORES
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as {
          response?: {
            data?: {
              error?: string;
              message?: string;
            };
          };
        };

        errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          errorMessage;
      }

      alert(`${t('alert_lobby_prefix')}: ${errorMessage}`);
    } finally {
      // ✅ SIEMPRE LIBERAMOS EL BOTÓN, PASE LO QUE PASE
      setIsStarting(false);
    }
  };

 return (
    <div className="min-h-screen bg-nm-base flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Luces de ambiente sutiles */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
      
      {/* BOTÓN VOLVER */}
      <button 
        onClick={() => router.push('/dashboard')} 
        className="absolute top-8 left-8 nm-btn p-3 rounded-full text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
      </button>

      <div className="max-w-lg w-full animate-fade-in">
        <div className="nm-btn border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative z-10">
          
          {/* HEADER DEL LOBBY */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-black nm-inset rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <Tv className="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t('title')}</h1>
            
            {/* Widget de Balance Táctico */}
            {userBalance !== null && (
               <div className="inline-flex items-center gap-2 mt-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                  <Wallet className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('lbl_covra_balance')} <span className="text-white">${Number(userBalance || 0).toFixed(2)}</span></span>
               </div>
            )}
          </div>

          <form onSubmit={handleStartLive} className="space-y-8">
            
            {/* TÍTULO DEL LIVE */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-red-500" /> {t('lbl_room_title')}
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder={t('ph_room_title')} 
                className="w-full nm-inset bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-red-500/50 transition-all font-bold placeholder:text-gray-700"
                maxLength={60}
                required
              />
            </div>

            {/* CONFIGURACIÓN DE PAGO (PAYWALL) */}
            <div className="nm-inset bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0a0a0a] nm-btn rounded-xl flex items-center justify-center border border-white/5">
                    <Lock className={`w-5 h-5 ${isPPV ? 'text-red-500' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-wide">{t('lbl_private_access')}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t('desc_private_access')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPPV} 
                    onChange={() => setIsPPV(!isPPV)} 
                  />
                  <div className="w-12 h-6 bg-gray-800 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                </label>
              </div>

              {isPPV && (
                <div className="pt-6 border-t border-white/5 animate-slide-up">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-3">
                    {t('lbl_ticket_price')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-black nm-inset rounded-lg flex items-center justify-center border border-white/5">
                      <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      step="0.50" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="5.00" 
                      className="w-full nm-inset bg-black border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-white font-black text-xl outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.15em] mt-3 text-center">
                    {t('desc_revenue_share')}
                  </p>
                </div>
              )}
            </div>

            {/* BOTÓN DE ACCIÓN */}
            <button 
              type="submit" 
              disabled={isStarting || !title.trim()}
              className="w-full nm-btn-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isStarting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white" />
                  {t('btn_create_room')}
                </>
              )}
            </button>
            
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3" /> {t('footer_protected')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}