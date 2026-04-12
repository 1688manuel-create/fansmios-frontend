// frontend/app/dashboard/subscriptions/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fanService } from '../../../../lib/fanService';
import api from '../../../../lib/api'; 
import PaymentModal from '../../../../components/PaymentModal'; // 🔥 Importamos el nuevo Modal Cripto-Invisible
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function FanSubscriptions() {
  const router = useRouter();
  const t = useTranslations('Subscriptions'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 ESTADOS PARA EL PAGO DE RENOVACIÓN (NUEVO)
  const [paymentData, setPaymentData] = useState<{ payAddress: string, amountUsd: number, transactionId: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [renewingCreatorId, setRenewingCreatorId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    try {
      setIsLoading(true);
      const data = await fanService.getMySubscriptions();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error("Error cargando suscripciones", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de cancelación 
  const handleCancelSubscription = async (creatorId: string, username: string) => {
    const confirmAction = window.confirm(
      `${t('confirm_cancel_1')} @${username}?\n\n${t('confirm_cancel_2')}`
    );

    if (!confirmAction) return;

    try {
      await api.post('/payments/cancel-subscription', { creatorId });
      alert(t('alert_cancel_success'));
      fetchSubs(); 
    } catch (error) {
      alert(t('alert_error_cancel'));
    }
  };

  // 🔥 NUEVA FUNCIÓN: LÓGICA DE REACTIVACIÓN HÍBRIDA (Onramper)
  const handleReactivateSubscription = async (creatorId: string, price: number, username: string) => {
    try {
      setRenewingCreatorId(creatorId);
      // Le pedimos al backend la billetera temporal para renovar
      const res = await api.post('/payments/create-intent', {
        amount: price,
        type: 'SUBSCRIPTION',
        creatorId: creatorId,
        description: `Reactivación VIP - @${username}`
      });
      setPaymentData({ payAddress: res.data.payAddress, amountUsd: res.data.finalAmount, transactionId: res.data.transactionId });
      setIsPaymentModalOpen(true);
    } catch (error) {
      alert(t('alert_error_reactivate'));
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div></div>;

  // Separamos las suscripciones para mostrar un historial más limpio
  const activeSubs = subscriptions.filter(sub => sub.status === 'ACTIVE' && !sub.isExpired);
  const inactiveOrCanceled = subscriptions.filter(sub => sub.status !== 'ACTIVE' || sub.isExpired);

  return (
    <div className="min-h-screen pb-20 bg-black relative">
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-pink-900/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

      <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
        <h1 className="text-xl font-bold text-white">⭐ {t('nav_title')}</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20 transition-colors">{t('btn_back')}</button>
      </nav>

      <main className="max-w-3xl mx-auto mt-10 px-4 space-y-8 relative z-10">
        
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-r from-pink-500/10 to-orange-500/10">
          <h2 className="text-2xl font-bold text-white">{t('header_title')}</h2>
          <p className="text-gray-400 mt-2">{t('header_desc')}</p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-white/5">
            <span className="text-5xl">🥺</span>
            <h3 className="text-xl font-bold text-white mt-4">{t('empty_title')}</h3>
            <p className="text-gray-400 mt-2 mb-6">{t('empty_desc')}</p>
            <button onClick={() => router.push('/explore')} className="bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              🔍 {t('btn_explore')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 🟢 SECCIÓN ACTIVAS */}
            {activeSubs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-pink-400 font-bold uppercase tracking-widest text-xs ml-2">{t('active_subs_title')}</h3>
                {activeSubs.map(sub => (
                  <div key={sub.id} className="glass-panel p-6 rounded-3xl border border-white/5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-6 hover:border-pink-500/30 transition-colors">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0 overflow-hidden">
                        {sub.creator?.creatorProfile?.profileImage ? 
                          <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${sub.creator.creatorProfile.profileImage}`} alt="Avatar" className="w-full h-full object-cover" /> 
                          : sub.creator?.username?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl">@{sub.creator?.username || t('unknown_user')}</h3>
                        <p className="text-sm text-green-400 font-medium mt-0.5">{t('status_active')} • ${sub.price} USD / {t('lbl_month')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('lbl_renewal')}: {new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button onClick={() => router.push(`/${sub.creator?.username}`)} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-6 rounded-full transition-colors text-sm">
                        {t('btn_view_profile')}
                      </button>
                      <button 
                        onClick={() => handleCancelSubscription(sub.creatorId, sub.creator?.username)}
                        className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2.5 px-6 rounded-full transition-colors text-sm"
                      >
                        {t('btn_cancel')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 🔴 SECCIÓN HISTORIAL / CANCELADAS / EXPIRADAS */}
            {inactiveOrCanceled.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs ml-2">{t('inactive_subs_title')}</h3>
                {inactiveOrCanceled.map(sub => (
                  <div key={sub.id} className="glass-panel p-6 rounded-3xl border border-white/5 opacity-60 flex flex-col sm:flex-row justify-between items-center gap-6 grayscale-[0.5]">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xl shrink-0 overflow-hidden">
                        {sub.creator?.creatorProfile?.profileImage ? 
                          <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${sub.creator.creatorProfile.profileImage}`} alt="Avatar" className="w-full h-full object-cover" /> 
                          : sub.creator?.username?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">@{sub.creator?.username || t('unknown_user')}</h3>
                        <p className="text-xs text-red-400 font-medium uppercase">{sub.status === 'CANCELED' ? t('status_canceled') : t('status_expired')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('lbl_expires')}: {new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* 🔥 EL NUEVO BOTÓN DE REACTIVACIÓN QUE ABRE ONRAMPER */}
                    <button 
                      onClick={() => handleReactivateSubscription(sub.creatorId, sub.price, sub.creator?.username)} 
                      className="w-full sm:w-auto bg-pink-500/20 text-pink-400 font-bold py-2 px-6 rounded-full text-sm hover:bg-pink-500 hover:text-white transition-all"
                    >
                      {t('btn_reactivate')}
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {/* 🔥 MODAL DE PAGOS (ONRAMPER HYBRID) */}
      {isPaymentModalOpen && paymentData && renewingCreatorId && (
       <PaymentModal
            payAddress={paymentData.payAddress}
            amountUsd={paymentData.amountUsd}
            price={paymentData.amountUsd}
            clientSecret={(paymentData as any).clientSecret || ""}
            transactionId={paymentData.transactionId}
            creatorId={renewingCreatorId}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              alert(t('alert_renew_success'));
              window.location.reload(); {/* 🔥 SOLUCIÓN INFALIBLE */}
            }}
        />
      )}
    </div>
  );
}