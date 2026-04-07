"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import api from '../../../../lib/api';
import { 
  TrendingUp, DollarSign, Users, ShieldCheck, Activity, Wallet, User, Loader2
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null); // Para el Modo Dios
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (storedUser?.role === 'ADMIN') {
      // 🟢 Acceso concedido al CEO
      setIsAdmin(true);
      fetchAdminData();
    } else {
      // 🚨 Bouncer activo: Expulsar a fans y creadores hacia sus estadísticas reales
      router.push('/dashboard/stats');
    }
  }, [router]);

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

  if (isLoading) return <AppLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-red-500 animate-spin"/></div></AppLayout>;

  // Si por alguna fracción de segundo intenta renderizar y no es admin, se bloquea la vista visualmente
  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24">
        
        {/* ========================================================= */}
        {/* 👑 VISTA MODO DIOS (SUPER ADMIN) */}
        {/* ========================================================= */}
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

          {/* TARJETA DE USUARIOS */}
          <div className="nm-inset p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 nm-btn rounded-xl text-purple-400"><Users className="w-6 h-6" /></div>
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Usuarios Totales</h3>
              </div>
              <p className="text-4xl font-black text-white">{adminStats?.users?.total || 0}</p>
            </div>
            
            {/* Desglose debajo del total */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fans</span>
                <span className="text-sm font-black text-blue-400 ml-1">{adminStats?.users?.fans || 0}</span>
              </div>
              <div className="w-[1px] h-4 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Creadores</span>
                <span className="text-sm font-black text-purple-400 ml-1">{adminStats?.users?.creators || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="nm-btn p-8 rounded-[2rem] border border-white/5 flex items-center justify-center gap-4 text-gray-500">
          <Activity className="w-6 h-6 animate-pulse text-red-500" />
          <p className="font-bold uppercase tracking-widest text-sm">Monitoreo Financiero en Tiempo Real Activo</p>
        </div>

      </div>
    </AppLayout>
  );
}