"use client";

import { useEffect, useState } from 'react';
import AppLayout from '../../../components/AppLayout';
import api from '../../../lib/api';
import { 
  TrendingUp, DollarSign, Users, Eye, Ticket, Plus, 
  Copy, Power, Loader2, Award, ShieldCheck, Activity, Wallet
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null); // Para el Modo Dios
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para crear cupón (Solo Creadores)
  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser?.role === 'ADMIN') {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      fetchCreatorData();
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/admin/analytics/dashboard');
      setAdminStats(res.data.metrics);
    } catch (error) {
      console.error("Error cargando SuperAdmin Dashboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreatorData = async () => {
    try {
      const [statsRes, couponsRes] = await Promise.all([
        api.get('/analytics/creator'),
        api.get('/coupons')
      ]);
      setStats(statsRes.data);
      setCoupons(couponsRes.data.coupons);
    } catch (error) {
      console.error("Error cargando dashboard de creador", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/coupons', { code, discountPercent, maxUses: maxUses || null, expiresAt: expiresAt || null });
      alert('🎟️ ¡Cupón creado con éxito!');
      setCode(''); setDiscountPercent(''); setMaxUses(''); setExpiresAt('');
      fetchCreatorData(); 
    } catch (error: any) { alert(error.response?.data?.error || 'Error al crear el cupón'); } 
    finally { setIsCreating(false); }
  };

  const handleToggleCoupon = async (id: string) => {
    try { await api.patch(`/coupons/${id}/toggle`); fetchCreatorData(); } 
    catch (error) { alert('Error al cambiar estado del cupón'); }
  };

  if (isLoading) return <AppLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-teal-500 animate-spin"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24">
        
        {/* ========================================================= */}
        {/* 👑 VISTA MODO DIOS (SUPER ADMIN) */}
        {/* ========================================================= */}
        {isAdmin ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-red-500" /> Radar Global (CEO)
                </h1>
                <p className="text-gray-400 font-medium mt-1">Visión absoluta de los números de toda la plataforma.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="nm-inset p-6 rounded-3xl border border-green-500/30 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-green-400"><TrendingUp className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Volumen Bruto Movido</h3>
                </div>
                <p className="text-4xl font-black text-white">${adminStats?.finance?.totalVolumeProcessed?.toFixed(2) || '0.00'}</p>
              </div>

              <div className="nm-inset p-6 rounded-3xl border border-blue-500/30 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-blue-400"><DollarSign className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Tus Ganancias (Comisión)</h3>
                </div>
                <p className="text-4xl font-black text-white">${adminStats?.finance?.platformNetRevenue?.toFixed(2) || '0.00'}</p>
              </div>

              <div className="nm-inset p-6 rounded-3xl border border-red-500/30 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-red-400"><Wallet className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Deuda a Creadores</h3>
                </div>
                <p className="text-4xl font-black text-white">${adminStats?.finance?.pendingLiability?.toFixed(2) || '0.00'}</p>
              </div>

              <div className="nm-inset p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-purple-400"><Users className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Usuarios Totales</h3>
                </div>
                <p className="text-4xl font-black text-white">{adminStats?.users?.total || 0}</p>
              </div>
            </div>
            
            <div className="nm-btn p-8 rounded-[2rem] border border-white/5 flex items-center justify-center gap-4 text-gray-500">
              <Activity className="w-6 h-6 animate-pulse text-red-500" />
              <p className="font-bold uppercase tracking-widest text-sm">Monitoreo Financiero en Tiempo Real Activo</p>
            </div>
          </>
        ) : (
        /* ========================================================= */
        /* 📸 VISTA DE CREADOR NORMAL */
        /* ========================================================= */
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Cerebro Financiero</h1>
                <p className="text-gray-400 font-medium">Controla tus ganancias y lanza ofertas exclusivas.</p>
              </div>
            </div>

            {/* 💰 TARJETAS DE GANANCIAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="nm-inset p-6 rounded-3xl border border-teal-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-teal-400"><DollarSign className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Ingresos Mes</h3>
                </div>
                <p className="text-4xl font-black text-white">${stats?.financialStats?.monthlyIncome?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="nm-inset p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-blue-400"><TrendingUp className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Ingresos Hoy</h3>
                </div>
                <p className="text-4xl font-black text-white">${stats?.financialStats?.dailyIncome?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="nm-inset p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-purple-400"><Users className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Fans Activos</h3>
                </div>
                <p className="text-4xl font-black text-white">{stats?.socialStats?.activeVIPs || 0}</p>
              </div>
              <div className="nm-inset p-6 rounded-3xl border border-orange-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 nm-btn rounded-xl text-orange-400"><Eye className="w-6 h-6" /></div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Vistas Stories</h3>
                </div>
                <p className="text-4xl font-black text-white">{stats?.socialStats?.storyViews || 0}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* 🐋 RANKING DE BALLENAS (Top Fans) */}
              <div className="lg:col-span-1 nm-inset p-6 rounded-[2rem] border border-white/5 shadow-inner flex flex-col">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" /> Tus Ballenas (Top 5)
                </h2>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {stats?.topFans?.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center mt-10">Aún no tienes ventas registradas.</p>
                  ) : (
                    stats?.topFans?.map((fan: any, index: number) => (
                      <div key={fan.id} className="flex items-center justify-between nm-btn p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-600 to-orange-400 flex items-center justify-center text-white font-bold">
                            {index === 0 ? '👑' : fan.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">@{fan.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Top {index + 1}</p>
                          </div>
                        </div>
                        <span className="text-teal-400 font-black text-sm">${fan.spent.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 🎟️ MÁQUINA DE CUPONES */}
              <div className="lg:col-span-2 space-y-6">
                <div className="nm-inset p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-inner">
                  <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-pink-500" /> Generar Oferta Exclusiva
                  </h2>
                  <form onSubmit={handleCreateCoupon} className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Código (Ej. VERANO50)</label>
                      <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full mt-1 bg-black/40 nm-inset rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Descuento (%)</label>
                      <input type="number" required min="1" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full mt-1 bg-black/40 nm-inset rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                    </div>
                    <div className="sm:col-span-2 mt-2">
                      <button type="submit" disabled={isCreating} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2">
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Plus className="w-5 h-5"/> Generar Cupón</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </AppLayout>
  );
}