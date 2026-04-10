"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import api from '../../../../lib/api';
import { Rocket, Zap, Crown, Timer, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function PromotionsDashboard() {
  const router = useRouter();
  const t = useTranslations('Promotions'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [walletBalance, setWalletBalance] = useState(0);
  const [activePromo, setActivePromo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, promoRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/promotions/status')
      ]);
      setWalletBalance(walletRes.data.balance || 0);
      setActivePromo(promoRes.data.promotion);
    } catch (error) {
      console.error("Error cargando datos de promoción", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyBoost = async (packageId: string, price: number) => {
    if (walletBalance < price) {
      alert(`${t('alert_insufficient_funds_1')} $${walletBalance.toFixed(2)} ${t('alert_insufficient_funds_2')} $${price}. ${t('alert_insufficient_funds_3')}`);
      return;
    }

    const confirmMsg = `${t('confirm_buy_1')} $${price} ${t('confirm_buy_2')}`;
    if (!confirm(confirmMsg)) return;

    setIsBuying(true);
    try {
      const res = await api.post('/promotions/buy', { packageId });
      alert(res.data.message || t('alert_success'));
      fetchData(); // Recargar saldo y estado
    } catch (error: any) {
      alert(error.response?.data?.error || t('alert_error_buy'));
    } finally {
      setIsBuying(false);
    }
  };

  const calculateTimeLeft = (expiresAt: string) => {
    const end = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return t('time_expired');
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} ${t('time_hours_left')}`;
  };

  if (isLoading) return <AppLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-yellow-500 animate-spin"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24 relative">
        
        {/* LUZ DE FONDO */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-2">
              <Rocket className="w-8 h-8 text-yellow-500" /> {t('page_title')}
            </h1>
            <p className="text-gray-400 font-medium mt-1">{t('page_subtitle')}</p>
          </div>

          <div className="nm-inset px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4 bg-black/40">
            <div className="p-2 nm-btn rounded-full text-green-400"><Wallet className="w-5 h-5"/></div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lbl_available_balance')}</p>
              <p className="text-xl font-black text-white">${walletBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* ESTADO ACTUAL */}
        {activePromo && (
          <div className="nm-inset border border-yellow-500/30 p-6 rounded-3xl bg-gradient-to-r from-yellow-900/20 to-transparent relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 text-yellow-400 animate-pulse">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{t('status_vip_level')} {activePromo.package}!</h3>
                  <p className="text-sm text-yellow-200">{t('status_vip_desc')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <Timer className="w-3 h-3" /> {t('lbl_time_left')}
                </div>
                <span className="text-2xl font-black text-yellow-400">{calculateTimeLeft(activePromo.expiresAt)}</span>
              </div>
            </div>
          </div>
        )}

        {/* PAQUETES DE COMPRA */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          
          {/* PAQUETE 1: BASIC */}
          <div className="nm-btn p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl nm-inset text-blue-400 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{t('pkg1_title')}</h3>
              <p className="text-gray-400 text-sm font-medium mb-6">{t('pkg1_desc')}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {t('feat_priority')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {t('feat_border_blue')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-blue-500"/> {t('feat_duration_24h')}</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleBuyBoost('basic', 15)}
              disabled={isBuying}
              className="w-full nm-btn text-white font-black py-4 rounded-xl hover:text-blue-400 transition-colors border border-transparent hover:border-blue-500/20"
            >
              {t('btn_buy_for')} $15
            </button>
          </div>

          {/* PAQUETE 2: PRO (DESTACADO) */}
          <div className="nm-inset p-8 rounded-[2rem] border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col justify-between transform md:-translate-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-1 rotate-45 translate-x-6 translate-y-3 shadow-lg">{t('badge_popular')}</div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6">
                <Rocket className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{t('pkg2_title')}</h3>
              <p className="text-gray-400 text-sm font-medium mb-6">{t('pkg2_desc')}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-purple-400"/> {t('feat_ranking_vip')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-purple-400"/> {t('feat_border_purple')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-purple-400"/> {t('feat_notification')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-200"><CheckCircle2 className="w-4 h-4 text-purple-400"/> {t('feat_duration_48h')}</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleBuyBoost('pro', 25)}
              disabled={isBuying}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            >
              {t('btn_buy_for')} $25
            </button>
          </div>

          {/* PAQUETE 3: GOD */}
          <div className="nm-btn p-8 rounded-[2rem] border border-white/5 hover:border-yellow-500/30 transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl nm-inset text-yellow-400 flex items-center justify-center mb-6">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{t('pkg3_title')}</h3>
              <p className="text-gray-400 text-sm font-medium mb-6">{t('pkg3_desc')}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-yellow-500"/> {t('feat_pos_1')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-yellow-500"/> {t('feat_gold_crown')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-yellow-500"/> {t('feat_stories')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-yellow-500"/> {t('feat_duration_72h')}</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleBuyBoost('god', 50)}
              disabled={isBuying}
              className="w-full nm-btn text-white font-black py-4 rounded-xl hover:text-yellow-400 transition-colors border border-transparent hover:border-yellow-500/20"
            >
              {t('btn_buy_for')} $50
            </button>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}