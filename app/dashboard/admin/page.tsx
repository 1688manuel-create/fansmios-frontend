// frontend/app/dashboard/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '../../../lib/adminService';
import api from '../../../lib/api';
import AppLayout from '../../../components/AppLayout';

// 🔥 IMPORTAMOS ICONOS PREMIUM DE LUCIDE
import { 
  Crown, 
  Scale, 
  BarChart3, 
  Users, 
  Banknote, 
  Flag, 
  Settings, 
  TrendingUp, 
  PiggyBank, 
  Wallet, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
  UserX,
  Ghost,
  ShieldBan
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
    const actionName = status === 'SHADOWBANNED' ? 'Ocultar como Fantasma' : status;
    const reason = prompt(`Escribe la razón para cambiar el estado a ${actionName}:`);
    if (reason === null) return; 
    try {
      await adminService.changeUserStatus(userId, status, reason);
      alert(`✅ Estado cambiado a ${status}`);
      fetchData();
    } catch (error) { alert("Error al cambiar el estado del usuario"); }
  };

  const handleWithdrawalAction = async (id: string, status: string) => {
    const reason = prompt(`Escribe una nota para el creador (Aprobado/Rechazado):`);
    if (reason === null) return; 
    try {
      await adminService.handleWithdrawal(id, status, reason);
      alert(`✅ Retiro marcado como ${status}`);
      fetchData();
    } catch (error) { alert("Error al procesar el retiro"); }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    const actionText = status === 'RESOLVED' ? 'Resuelto' : 'Ignorado';
    const confirm = window.confirm(`¿Estás seguro de marcar este reporte como ${actionText}?`);
    if (!confirm) return;

    const adminMessage = prompt(`(Opcional) Escribe un mensaje para notificar al usuario sobre su reporte:\nEj: "Ya eliminamos el contenido, gracias por avisar."`);
    if (adminMessage === null) return;

    try {
      await api.put('/admin/reports/resolve', { reportId, newStatus: status, adminMessage });
      alert(`✅ Reporte limpiado y usuario notificado.`);
      fetchData(); 
    } catch (error) {
      alert("Error al intentar cerrar el reporte y notificar.");
    }
  };

  const goToReportedContent = (targetUser: any, postId: string | undefined) => {
    const usernameFallback = targetUser?.username || targetUser?.email?.split('@')[0];
    if (usernameFallback && postId) {
      window.open(`/${usernameFallback}#${postId}`, '_blank');
    } else {
      alert("Error Crítico: El reporte está corrupto y no tiene un Post ID asociado.");
    }
  };

  const goToUserProfile = (targetUser: any) => {
    const usernameFallback = targetUser?.username || targetUser?.email?.split('@')[0];
    if (usernameFallback) {
      window.open(`/${usernameFallback}`, '_blank');
    } else {
      alert("Error: No hay datos suficientes para encontrar a este usuario.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base text-white relative">
        
        {/* Iluminación de ambiente */}
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        {/* 🔥 NAVBAR MODO DIOS NEUMÓRFICA */}
        <nav className="bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 backdrop-blur-xl shadow-[0_5px_30px_rgba(0,0,0,0.5)] gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black nm-inset rounded-2xl flex items-center justify-center text-red-500 border border-white/5 shadow-inner">
              <Crown className="w-6 h-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-red-500 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)] tracking-tighter">
                MODO DIOS
              </h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Centro de Mando SuperAdmin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/admin/kyc')} className="text-xs nm-btn border border-purple-500/30 text-purple-400 hover:text-white px-5 py-2.5 rounded-full font-bold transition-all flex items-center gap-2">
              <Scale className="w-4 h-4"/> KYC Pendientes 
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded-md nm-inset text-[10px]">{analytics?.metrics?.security?.pendingKyc || 0}</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[10px] nm-inset border border-red-500/20 text-red-500 font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div> En Línea
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto mt-8 px-4 pb-20 relative z-10">
          
          {/* 📑 TABS DE NAVEGACIÓN NEUMÓRFICAS */}
          <div className="flex p-1.5 nm-inset rounded-2xl border border-white/5 w-fit overflow-x-auto max-w-full custom-scrollbar mb-10">
            {[
              { id: 'STATS', label: 'Dashboard Financiero', icon: BarChart3 },
              { id: 'USERS', label: 'Usuarios', icon: Users },
              { id: 'WITHDRAWALS', label: 'Retiros', icon: Banknote },
              { id: 'REPORTS', label: `Reportes (${reports.filter(r => r.status === 'PENDING').length})`, icon: Flag },
              { id: 'SETTINGS', label: 'Plataforma', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'nm-btn-active bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* =========================================
              📊 TAB 1: DASHBOARD FINANCIERO (FASE 7)
          ========================================= */}
          {activeTab === 'STATS' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Tarjetas de Dinero Neumórficas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Volumen */}
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group cursor-default">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-blue-500">
                    <TrendingUp className="w-40 h-40" strokeWidth={1} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500"/> Volumen Transaccionado
                  </h3>
                  <p className="text-4xl font-black text-white">${analytics?.metrics?.finance?.totalVolumeProcessed?.toFixed(2) || '0.00'} <span className="text-lg text-gray-500 font-bold">USD</span></p>
                  <p className="text-[10px] text-blue-400 mt-3 font-bold uppercase tracking-widest nm-inset inline-block px-3 py-1.5 rounded-md border border-blue-500/20">Dinero total movido</p>
                </div>

                {/* Ganancia Neta */}
                <div className="nm-btn border border-green-500/30 p-8 rounded-[2rem] relative overflow-hidden group cursor-default shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-green-500">
                    <PiggyBank className="w-40 h-40" strokeWidth={1} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-green-500"/> Ganancia Neta (Plataforma)
                  </h3>
                  <p className="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">${analytics?.metrics?.finance?.platformNetRevenue?.toFixed(2) || '0.00'} <span className="text-lg text-green-700 font-bold">USD</span></p>
                  <p className="text-[10px] text-green-500 mt-3 font-bold uppercase tracking-widest nm-inset inline-block px-3 py-1.5 rounded-md border border-green-500/20">Tu tajada libre: {stats?.currentPlatformFee || '20%'}</p>
                </div>

                {/* Pasivos */}
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group cursor-default">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-orange-500">
                    <Wallet className="w-40 h-40" strokeWidth={1} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-500"/> Pasivos (Por Pagar)
                  </h3>
                  <p className="text-4xl font-black text-orange-400">${analytics?.metrics?.finance?.pendingLiability?.toFixed(2) || '0.00'} <span className="text-lg text-orange-700 font-bold">USD</span></p>
                  <p className="text-[10px] text-orange-500 mt-3 font-bold uppercase tracking-widest nm-inset inline-block px-3 py-1.5 rounded-md border border-orange-500/20">{analytics?.metrics?.finance?.payoutsInQueue || 0} retiros en cola</p>
                </div>

              </div>

              {/* Tarjetas de Usuarios Neumórficas (Hundidas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="nm-inset p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1 pl-1">Total de Fans</h3>
                    <p className="text-3xl font-black text-white pl-1">{analytics?.metrics?.users?.fans || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-[#0a0a0a] rounded-2xl nm-inset border border-white/5 flex items-center justify-center shadow-inner">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                
                <div className="nm-inset p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1 pl-1">Creadores VIP</h3>
                    <p className="text-3xl font-black text-white pl-1">{analytics?.metrics?.users?.creators || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg border border-pink-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="nm-inset p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1 pl-1">Posts Publicados</h3>
                    <p className="text-3xl font-black text-white pl-1">{stats?.totalPosts || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-[#0a0a0a] rounded-2xl nm-inset border border-white/5 flex items-center justify-center shadow-inner">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Tabla Neumórfica: Flujo de Caja */}
              <div className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-[#0e0e0e] flex justify-between items-center">
                  <h3 className="font-black text-white text-lg flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-500"/> Últimos Movimientos
                  </h3>
                  <span className="text-[10px] nm-inset border border-green-500/30 text-green-400 font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div> LIVE
                  </span>
                </div>
                <div className="overflow-x-auto bg-[#0a0a0a]">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-bold">Tipo</th>
                        <th className="px-6 py-4 font-bold">De Fan</th>
                        <th className="px-6 py-4 font-bold">A Creador</th>
                        <th className="px-6 py-4 font-bold">Monto (USD)</th>
                        <th className="px-6 py-4 font-bold">Tu Ganancia</th>
                        <th className="px-6 py-4 font-bold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-gray-500 font-medium">Aún no hay transacciones en la plataforma.</td></tr>
                      ) : (
                        analytics.recentActivity.map((tx: any) => (
                          <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-5 font-bold text-blue-400 text-xs tracking-wide">{tx.type}</td>
                            <td className="px-6 py-5 font-medium text-gray-300">@{tx.sender?.username || 'Anónimo'}</td>
                            <td className="px-6 py-5 font-medium text-gray-300">@{tx.receiver?.username || 'Sistema'}</td>
                            <td className="px-6 py-5 font-black text-white">${tx.amount.toFixed(2)}</td>
                            <td className="px-6 py-5 font-black text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">+ ${tx.platformFee.toFixed(2)}</td>
                            <td className="px-6 py-5 text-[10px] text-gray-500 uppercase tracking-wider font-bold">{new Date(tx.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =========================================
              👥 TAB 2: USUARIOS
          ========================================= */}
          {activeTab === 'USERS' && (
            <div className="nm-inset border border-white/5 rounded-[2rem] overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500"/> Gestión de Usuarios
                </h3>
              </div>
              <div className="overflow-x-auto bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#111] text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="p-5">Usuario</th>
                      <th className="p-5">Rol</th>
                      <th className="p-5">Estado</th>
                      <th className="p-5 text-right">Acción de Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-5">
                          <p className="font-black text-white text-sm">@{u.username || 'Sin_Usuario'}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">{u.email}</p>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider nm-inset border ${u.role === 'CREATOR' ? 'border-blue-500/30 text-blue-400' : 'border-gray-500/30 text-gray-400'}`}>{u.role}</span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider nm-inset border ${
                            u.status === 'ACTIVE' ? 'border-green-500/30 text-green-400' : 
                            u.status === 'SUSPENDED' ? 'border-yellow-500/30 text-yellow-400' : 
                            u.status === 'SHADOWBANNED' ? 'border-purple-500/30 text-purple-400' : 
                            'border-red-500/30 text-red-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-5 text-right flex justify-end gap-2">
                          {u.status !== 'ACTIVE' && <button onClick={() => handleUserStatus(u.id, 'ACTIVE')} className="text-[10px] uppercase tracking-wider nm-btn text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Reactivar</button>}
                          {u.status !== 'SHADOWBANNED' && <button onClick={() => handleUserStatus(u.id, 'SHADOWBANNED')} className="text-[10px] uppercase tracking-wider nm-btn text-purple-400 hover:text-purple-300 px-4 py-2 rounded-lg font-bold flex items-center gap-1" title="Ocultar sin que el usuario se dé cuenta"><Ghost className="w-3 h-3"/> Fantasma</button>}
                          {u.status !== 'SUSPENDED' && <button onClick={() => handleUserStatus(u.id, 'SUSPENDED')} className="text-[10px] uppercase tracking-wider nm-btn text-yellow-500 hover:text-yellow-400 px-4 py-2 rounded-lg font-bold flex items-center gap-1"><UserX className="w-3 h-3"/> Suspender</button>}
                          {u.status !== 'BANNED' && <button onClick={() => handleUserStatus(u.id, 'BANNED')} className="text-[10px] uppercase tracking-wider nm-btn border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1"><ShieldBan className="w-3 h-3"/> Banear</button>}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-500 font-medium">No hay otros usuarios en la plataforma.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================
              💸 TAB 3: RETIROS 
          ========================================= */}
          {activeTab === 'WITHDRAWALS' && (
            <div className="nm-inset border border-white/5 rounded-[2rem] overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-500"/> Solicitudes de Retiro
                </h3>
              </div>
              <div className="overflow-x-auto bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#111] text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="p-5">Creador</th>
                      <th className="p-5">Monto Solicitado</th>
                      <th className="p-5">Estado</th>
                      <th className="p-5 text-right">Decisión Financiera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-5">
                          <p className="font-black text-white text-sm">@{w.creator?.username || 'Desconocido'}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="p-5 font-black text-green-400 text-lg">${w.amount} <span className="text-xs text-gray-500">USD</span></td>
                        <td className="p-5">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider nm-inset border ${w.status === 'PENDING' ? 'border-yellow-500/30 text-yellow-400' : w.status === 'APPROVED' || w.status === 'PAID' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>{w.status}</span>
                        </td>
                        <td className="p-5 text-right flex justify-end gap-2">
                          {w.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleWithdrawalAction(w.id, 'APPROVED')} className="text-[10px] uppercase tracking-wider nm-btn text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Aprobar</button>
                              <button onClick={() => handleWithdrawalAction(w.id, 'REJECTED')} className="text-[10px] uppercase tracking-wider nm-btn text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rechazar</button>
                            </>
                          )}
                          {w.status === 'APPROVED' && (
                            <button onClick={() => handleWithdrawalAction(w.id, 'PAID')} className="text-[10px] uppercase tracking-wider nm-btn border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><Banknote className="w-4 h-4"/> Confirmar Pago Bancario</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-500 font-medium">No hay solicitudes de retiro en la bóveda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================
              🚩 TAB 4: REPORTES 
          ========================================= */}
          {activeTab === 'REPORTS' && (
            <div className="nm-inset border border-white/5 rounded-[2rem] overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500"/> Fila de Moderación
                </h3>
              </div>
              <div className="overflow-x-auto bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#111] text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="p-5 w-1/4">Denunciante / Info</th>
                      <th className="p-5 w-2/4">Motivo / Descripción</th>
                      <th className="p-5 text-right w-1/4">Acción Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.filter(r => r.status === 'PENDING').map(r => {
                      let title = r.reason;
                      let desc = r.description;
                      if (!desc && title.includes(' | Detalles: ')) {
                        const parts = title.split(' | Detalles: ');
                        title = parts[0];
                        desc = parts[1];
                      } else if (!desc) {
                        desc = 'Sin detalles adicionales provistos por el usuario.';
                      }

                      const targetUser = r.reportedUser || r.post?.user || r.message?.sender;
                      const targetUsername = targetUser?.username;
                      const targetEmail = targetUser?.email;
                      const displayTarget = targetUsername ? `@${targetUsername}` : (targetEmail || 'Desconocido');

                      return (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-5 align-top">
                            <p className="font-bold text-white text-sm truncate max-w-[200px]">{r.reporter?.email}</p>
                            <p className="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-wider mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest nm-inset border ${r.type === 'POST' ? 'border-purple-500/30 text-purple-400' : r.type === 'MESSAGE' ? 'border-blue-500/30 text-blue-400' : 'border-red-500/30 text-red-400'}`}>OBJETIVO: {r.type === 'POST' ? 'PUBLICACIÓN' : r.type === 'MESSAGE' ? 'MENSAJE' : 'USUARIO'}</span>
                          </td>
                          <td className="p-5 align-top">
                            <div className="flex items-start gap-2 mb-2"><Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/><p className="text-sm font-black text-white">{title}</p></div>
                            <p className="text-xs text-gray-400 nm-inset p-4 rounded-xl border border-white/5 italic leading-relaxed">"{desc}"</p>
                            <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-widest pl-1">Acusado: <span className="text-red-400">{displayTarget}</span></p>
                          </td>
                          <td className="p-5 text-right align-top space-y-3">
                            {r.type === 'POST' && (<button onClick={() => goToReportedContent(targetUser, r.postId || r.post?.id)} className="w-full text-xs nm-btn text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"><Eye className="w-4 h-4"/> Ver Evidencia</button>)}
                            {(r.type === 'USER' || r.type === 'MESSAGE' || !r.type) && (<button onClick={() => goToUserProfile(targetUser)} className="w-full text-xs nm-btn text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"><Users className="w-4 h-4"/> Ver Perfil</button>)}
                            
                            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                              <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="text-[10px] uppercase tracking-wider nm-btn border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1" title="Sancionar"><ShieldBan className="w-3 h-3"/> Castigar</button>
                              <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="text-[10px] uppercase tracking-wider nm-btn text-gray-500 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Descartar</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {reports.filter(r => r.status === 'PENDING').length === 0 && (
                      <tr><td colSpan={3} className="p-16 text-center text-gray-500 font-medium">🎉 El imperio está seguro. No hay reportes pendientes de revisión.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================
              ⚙️ TAB 5: AJUSTES DE PLATAFORMA
          ========================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="nm-inset p-8 md:p-10 rounded-[2rem] border border-white/5 max-w-2xl animate-fade-in space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Settings className="w-6 h-6 text-gray-400"/> Tajada del Negocio</h2>
                <p className="text-gray-400 text-sm font-medium mt-2">Ajusta el porcentaje (fee) que la plataforma le cobra a los creadores por cada venta de suscripciones, mensajes PPV y propinas.</p>
              </div>
              
              <div className="bg-[#0e0e0e] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-inner">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 block pl-1">Nuevo Porcentaje de Retención (%)</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl">%</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={newFee} 
                      onChange={(e) => setNewFee(e.target.value)} 
                      placeholder={stats?.currentPlatformFee?.replace('%', '') || '20'} 
                      className="w-full nm-inset rounded-xl pl-4 pr-12 py-4 text-white outline-none focus:border-red-500/50 text-2xl font-black transition-colors placeholder:text-gray-700"
                    />
                  </div>
                </div>
                <button onClick={handleUpdateFee} className="nm-btn-primary px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] text-base mt-2 flex justify-center items-center gap-2">
                  <CheckCircle className="w-5 h-5"/> Aplicar Nuevo Fee Global
                </button>
                <p className="text-[10px] text-yellow-500/80 text-center font-bold mt-2">⚠️ Este cambio afectará a todos los creadores de forma inmediata.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </AppLayout>
  );
}