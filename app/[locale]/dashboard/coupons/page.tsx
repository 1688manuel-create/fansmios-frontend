"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import api from '../../../../lib/api';
import { Ticket, Plus, Loader2, Power, Copy, Calendar, Users } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function CouponsDashboard() {
  const router = useRouter();
  const t = useTranslations('CouponsDashboard'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'CREATOR' && user.role !== 'ADMIN') router.push('/dashboard');
    else fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // 🚀 Ruta corregida para coincidir con tu backend
      const res = await api.get('/coupons');
      setCoupons(res.data.coupons || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/coupons', { 
        code, 
        discountPercent, 
        maxUses: maxUses || null,
        expiresAt: expiresAt || null
      });
      alert(t('alert_success_create'));
      setCode(''); setDiscountPercent(''); setMaxUses(''); setExpiresAt('');
      fetchCoupons();
    } catch (error: any) {
      alert(error.response?.data?.error || t('alert_error_create'));
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.patch(`/coupons/${id}/toggle`);
      fetchCoupons();
    } catch (error) { 
      alert(t('alert_error_toggle')); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`${t('alert_copy_1')} ${text} ${t('alert_copy_2')}`);
  };

  if (isLoading) return <AppLayout><div className="min-h-screen bg-nm-base flex items-center justify-center"><Loader2 className="w-12 h-12 text-pink-500 animate-spin"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 relative overflow-hidden">
        
        {/* Luz de fondo ambiental */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* HEADER NEUMÓRFICO */}
        <nav className="sticky top-0 z-40 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-pink-500" strokeWidth={2.5}/> {t('nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold">
            {t('btn_back')}
          </button>
        </nav>

        <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* ================================== */}
          {/* CREADOR DE CUPONES (IZQUIERDA)     */}
          {/* ================================== */}
          <div className="lg:col-span-1">
            <div className="nm-inset p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-inner sticky top-28">
              <h2 className="text-xl font-black text-white mb-2">{t('form_title')}</h2>
              <p className="text-gray-500 text-xs font-medium mb-6 leading-relaxed">
                {t('form_desc')}
              </p>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">{t('lbl_code')}</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder={t('ph_code')} className="w-full mt-1 bg-black/40 border border-white/5 nm-inset rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 font-black uppercase tracking-wider"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">{t('lbl_discount')}</label>
                  <input type="number" min="1" max="99" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required placeholder={t('ph_discount')} className="w-full mt-1 bg-black/40 border border-white/5 nm-inset rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 font-bold"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">{t('lbl_max_uses')}</label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={t('ph_unlimited')} className="w-full mt-1 bg-black/40 border border-white/5 nm-inset rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-pink-500"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">{t('lbl_expires')}</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full mt-1 bg-black/40 border border-white/5 nm-inset rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-pink-500 [color-scheme:dark]"/>
                  </div>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(219,39,119,0.3)] mt-6 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Plus className="w-5 h-5"/> {t('btn_generate')}</>}
                </button>
              </form>
            </div>
          </div>

          {/* ================================== */}
          {/* LISTA DE CUPONES (DERECHA)         */}
          {/* ================================== */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white">{t('list_title')}</h2>
              <span className="nm-inset px-3 py-1 rounded-full text-xs font-bold text-pink-400 border border-pink-500/20">
                {coupons.length} {t('lbl_registered')}
              </span>
            </div>

            {coupons.length === 0 ? (
              <div className="nm-inset p-12 rounded-[2rem] border border-white/5 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Ticket className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-gray-300">{t('empty_title')}</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-sm">{t('empty_desc')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${coupon.active ? 'nm-inset border-pink-500/30 shadow-[inset_0_0_20px_rgba(219,39,119,0.05)]' : 'bg-black/50 border-white/5 opacity-60 grayscale'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black tracking-widest text-white drop-shadow-md">{coupon.code}</h3>
                        <p className={`text-sm font-black mt-1 ${coupon.active ? 'text-pink-400' : 'text-gray-500'}`}>
                          -{coupon.discountPercent}% {t('lbl_off')}
                        </p>
                      </div>
                      <button onClick={() => copyToClipboard(coupon.code)} className="nm-btn p-2.5 rounded-lg text-gray-400 hover:text-white transition-colors" title={t('btn_copy')}>
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">{t('lbl_uses')}:</span>
                        <span className="text-gray-300">{coupon.currentUses} / {coupon.maxUses ? coupon.maxUses : '∞'}</span>
                      </div>
                      {coupon.expiresAt && (
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-500">{t('lbl_expires_date')}:</span>
                          <span className="text-gray-300">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${coupon.active ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                        {coupon.active ? t('status_online') : t('status_offline')}
                      </span>
                      
                      <button 
                        onClick={() => toggleStatus(coupon.id)} 
                        className={`nm-btn px-4 py-2 rounded-xl transition-colors font-bold flex items-center gap-2 text-xs ${coupon.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        <Power className="w-3 h-3" /> {coupon.active ? t('btn_deactivate') : t('btn_activate')}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </AppLayout>
  );
}