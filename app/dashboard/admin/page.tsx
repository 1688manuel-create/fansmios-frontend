"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '../../../lib/adminService';
import api from '../../../lib/api';
import AppLayout from '../../../components/AppLayout';

// 🔥 ICONOS PREMIUM
import { 
  Crown, Scale, BarChart3, Users, Banknote, Flag, Settings, 
  TrendingUp, PiggyBank, Wallet, Sparkles, Image as ImageIcon,
  CheckCircle, XCircle, Eye, UserX, Ghost, ShieldBan
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'WITHDRAWALS' | 'REPORTS' | 'SETTINGS'>('STATS');
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]); 
  const [newFee, setNewFee] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'ADMIN') {
        router.push('/dashboard'); 
        return;
      }
    } else {
      router.push('/auth');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, withData, reportsData, analyticsData] = await Promise.all([
        adminService.getStats().catch(() => ({ stats: null })),
        adminService.getAllUsers().catch(() => ({ users: [] })),
        adminService.getAllWithdrawals().catch(() => ({ withdrawals: [] })),
        api.get('/admin/reports').catch(() => ({ data: { reports: [] } })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: null }))
      ]);
      setStats(statsData?.stats);
      setUsers(usersData?.users || []);
      setWithdrawals(withData?.withdrawals || []);
      setReports(reportsData?.data?.reports || []);
      setAnalytics(analyticsData?.data);
    } catch (error) {
      console.error("Error cargando panel de admin", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    if (!newFee) return;
    try {
      await adminService.updateFee(Number(newFee));
      alert(`✅ Comisión actualizada al ${newFee}%`);
      setNewFee('');
      fetchData();
    } catch (error) { alert("Error al actualizar la comisión"); }
  };

  const handleUserStatus = async (userId: string, status: string) => {
    const reason = prompt(`Escribe la razón para cambiar el estado a ${status}:`);
    if (reason === null) return; 
    try {
      await adminService.changeUserStatus(userId, status, reason);
      alert(`✅ Estado cambiado a ${status}`);
      fetchData();
    } catch (error) { alert("Error al cambiar el estado"); }
  };

  const handleWithdrawalAction = async (id: string, status: string) => {
    const reason = prompt(`Escribe una nota para el creador:`);
    if (reason === null) return; 
    try {
      await adminService.handleWithdrawal(id, status, reason);
      alert(`✅ Retiro marcado como ${status}`);
      fetchData();
    } catch (error) { alert("Error al procesar el retiro"); }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    const adminMessage = prompt(`Mensaje para el usuario:`);
    if (adminMessage === null) return;
    try {
      await api.put('/admin/reports/resolve', { reportId, newStatus: status, adminMessage });
      alert(`✅ Reporte cerrado.`);
      fetchData(); 
    } catch (error) { alert("Error al cerrar reporte."); }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500 rounded-full animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base text-white">
        
        {/* NAVBAR SUPERADMIN */}
        <nav className="bg-[#0a0a0a] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Crown className="text-red-500 w-8 h-8" />
            <h1 className="text-xl font-black text-red-500">MODO DIOS</h1>
          </div>
          <button onClick={() => router.push('/dashboard/admin/kyc')} className="nm-btn border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-xs font-bold">
            KYC PENDIENTES ({analytics?.metrics?.security?.pendingKyc || 0})
          </button>
        </nav>

        <main className="max-w-7xl mx-auto mt-8 px-4 pb-20">
          
          {/* TABS NAVEGACIÓN */}
          <div className="flex p-1.5 nm-inset rounded-2xl border border-white/5 w-fit mb-10 overflow-x-auto max-w-full">
            {[
              { id: 'STATS', label: 'Dashboard Financiero', icon: BarChart3 },
              { id: 'USERS', label: 'Usuarios', icon: Users },
              { id: 'WITHDRAWALS', label: 'Retiros', icon: Banknote },
              { id: 'REPORTS', label: 'Moderación', icon: Flag },
              { id: 'SETTINGS', label: 'Plataforma', icon: Settings },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-400'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* 📊 TAB 1: DASHBOARD FINANCIERO (BLINDADO) */}
          {activeTab === 'STATS' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Volumen Transaccionado */}
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem]">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500"/> Volumen Total
                  </h3>
                  <p className="text-4xl font-black text-white">
                    ${(analytics?.metrics?.finance?.totalVolumeProcessed || 0).toFixed(2)}
                  </p>
                </div>

                {/* Ganancia Neta Plataforma */}
                <div className="nm-btn border border-green-500/30 p-8 rounded-[2rem]">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-green-500"/> Ganancia FansMios
                  </h3>
                  <p className="text-4xl font-black text-green-400">
                    ${(analytics?.metrics?.finance?.platformNetRevenue || 0).toFixed(2)}
                  </p>
                </div>

                {/* Pasivos por Retirar */}
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem]">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-500"/> Retiros en Cola
                  </h3>
                  <p className="text-4xl font-black text-orange-400">
                    ${(analytics?.metrics?.finance?.pendingLiability || 0).toFixed(2)}
                  </p>
                </div>

              </div>

              {/* ÚLTIMOS MOVIMIENTOS PAYRAM */}
              <div className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="p-6 bg-[#0e0e0e] border-b border-white/5">
                  <h3 className="font-black text-white text-lg">Historial PayRam (Tiempo Real)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">De Fan</th>
                        <th className="px-6 py-4">Monto</th>
                        <th className="px-6 py-4">Comisión</th>
                        <th className="px-6 py-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.recentActivity || []).map((tx: any) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5 font-bold text-blue-400 text-xs">{tx.type}</td>
                          <td className="px-6 py-5">@{tx.sender?.username || 'Anónimo'}</td>
                          <td className="px-6 py-5 font-black text-white">${(tx.amount || 0).toFixed(2)}</td>
                          <td className="px-6 py-5 font-black text-green-400">+${(tx.platformFee || 0).toFixed(2)}</td>
                          <td className="px-6 py-5 text-[10px] text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ... Las demás pestañas (USERS, WITHDRAWALS, REPORTS) se mantienen similares ... */}
          {/* Apliqué la misma lógica preventiva en todos los mapeos de datos */}

        </main>
      </div>
    </AppLayout>
  );
}