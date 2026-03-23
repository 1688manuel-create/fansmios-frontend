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
  
  // Nuevo estado para evitar dobles clics al procesar retiros
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      // Usamos api.get directamente para los retiros nuevos
      const [statsData, usersData, withData, reportsData, analyticsData] = await Promise.all([
        adminService.getStats().catch(() => ({ stats: null })),
        adminService.getAllUsers().catch(() => ({ users: [] })),
        api.get('/admin/payouts/pending').catch(() => ({ data: { withdrawals: [] } })), // 🔥 Nueva ruta PayRam
        api.get('/admin/reports').catch(() => ({ data: { reports: [] } })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: null }))
      ]);
      setStats(statsData?.stats);
      setUsers(usersData?.users || []);
      setWithdrawals(withData?.data?.withdrawals || []);
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

  // 🔥 NUEVA LÓGICA DE PAGOS (INTEGRADA AL MODO DIOS)
  const handleApprovePayout = async (id: string, amount: number, address: string) => {
    const confirm = window.confirm(`⚠️ ¿Estás seguro de enviar $${amount} USDT a la billetera:\n${address}?`);
    if (!confirm) return;

    const txHash = prompt("Pega el Hash de Transacción (TXID) de Binance, o déjalo vacío para simularlo:");

    setProcessingId(id);
    try {
      await api.post(`/admin/payouts/${id}/approve`, { 
        txHash: txHash || `SIMULATED_TX_${Date.now()}`,
        adminNotes: 'Pago Cripto Procesado Oficialmente'
      });
      alert("✅ ¡Pago Registrado y Creador Notificado!");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al aprobar el retiro.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayout = async (id: string, amount: number) => {
    const reason = prompt(`❌ Vas a RECHAZAR el retiro de $${amount} USD.\nEscribe la razón (Ej: "Billetera inválida" o "Fraude"):`);
    if (!reason) return;

    setProcessingId(id);
    try {
      await api.post(`/admin/payouts/${id}/reject`, { adminNotes: reason });
      alert("🛡️ Retiro rechazado. El dinero volvió a la billetera (saldo disponible) del creador.");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al rechazar el retiro.");
    } finally {
      setProcessingId(null);
    }
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
          <button onClick={() => router.push('/dashboard/admin/kyc')} className="nm-btn border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-purple-900/20 transition-colors">
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* 📊 TAB 1: DASHBOARD FINANCIERO */}
          {activeTab === 'STATS' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem]">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500"/> Volumen Total
                  </h3>
                  <p className="text-4xl font-black text-white">
                    ${(analytics?.metrics?.finance?.totalVolumeProcessed || 0).toFixed(2)}
                  </p>
                </div>
                <div className="nm-btn border border-green-500/30 p-8 rounded-[2rem]">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-green-500"/> Ganancia FansMios
                  </h3>
                  <p className="text-4xl font-black text-green-400">
                    ${(analytics?.metrics?.finance?.platformNetRevenue || 0).toFixed(2)}
                  </p>
                </div>
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
                        <th className="px-6 py-4">Para Creador</th>
                        <th className="px-6 py-4">Monto</th>
                        <th className="px-6 py-4">Comisión App</th>
                        <th className="px-6 py-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.recentActivity || []).map((tx: any) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5 font-bold text-blue-400 text-xs">{tx.type}</td>
                          <td className="px-6 py-5">@{tx.sender?.username || 'Anónimo'}</td>
                          <td className="px-6 py-5 text-purple-400">@{tx.receiver?.username || 'Anónimo'}</td>
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

          {/* 💸 TAB 2: RETIROS (WITHDRAWALS - AHORA CON PAYRAM) */}
          {activeTab === 'WITHDRAWALS' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Banknote className="text-orange-500"/> Solicitudes de Retiro</h2>
              {withdrawals.length === 0 ? (
                <div className="nm-btn border border-white/5 p-10 rounded-[2rem] text-center text-gray-500">
                  No hay solicitudes de retiro pendientes. Todo está al día, CEO.
                </div>
              ) : (
                <div className="grid gap-4">
                  {withdrawals.map((w: any) => (
                    <div key={w.id} className="nm-btn border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">ID: {w.id}</p>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          @{w.creator?.username || 'Usuario Desconocido'} 
                          <span className="text-[10px] px-2 py-1 rounded-full font-black bg-orange-500/20 text-orange-400">
                            {w.status}
                          </span>
                        </h4>
                        <div className="mt-1 flex gap-3 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span className="text-green-400">Billetera Activa: ${w.creator?.wallet?.balance?.toFixed(2) || 0}</span>
                          <span className="text-yellow-400">Retenido: ${w.creator?.wallet?.pendingBalance?.toFixed(2) || 0}</span>
                        </div>
                        <p className="text-sm mt-2"><span className="text-gray-400">Red:</span> {w.cryptoNetwork || 'TRC20'} <span className="text-gray-400 ml-3">Billetera:</span> <span className="text-blue-400 select-all font-mono bg-blue-500/10 px-2 py-1 rounded">{w.cryptoAddress || 'No proporcionada'}</span></p>
                        {w.adminNotes && <p className="text-xs text-orange-300 mt-2 bg-orange-500/10 p-2 rounded-lg">{w.adminNotes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black text-green-400 mb-4">${w.amount?.toFixed(2)} <span className="text-sm text-gray-500 font-normal">USDT</span></p>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleApprovePayout(w.id, w.amount, w.cryptoAddress)} 
                            disabled={processingId === w.id}
                            className="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-colors disabled:opacity-50"
                          >
                            {processingId === w.id ? 'Procesando...' : '✅ Aprobar (Cripto)'}
                          </button>
                          <button 
                            onClick={() => handleRejectPayout(w.id, w.amount)} 
                            disabled={processingId === w.id}
                            className="w-full px-6 py-2 rounded-xl border border-red-500/50 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {processingId === w.id ? 'Procesando...' : '❌ Rechazar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 👥 TAB 3: USUARIOS */}
          {activeTab === 'USERS' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Users className="text-blue-500"/> Gestión de Usuarios</h2>
              <div className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">Usuario / Email</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-bold text-white">@{u.username || 'sin_user'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </td>
                          <td className="px-6 py-5 font-black text-xs">
                            <span className={u.role === 'CREATOR' ? 'text-purple-400' : u.role === 'ADMIN' ? 'text-red-500' : 'text-gray-400'}>{u.role}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-black ${u.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {u.status === 'ACTIVE' ? (
                              <button onClick={() => handleUserStatus(u.id, 'BANNED')} className="text-red-500 hover:text-red-400 flex items-center gap-1 text-xs font-bold"><ShieldBan className="w-4 h-4"/> Banear</button>
                            ) : (
                              <button onClick={() => handleUserStatus(u.id, 'ACTIVE')} className="text-green-500 hover:text-green-400 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4"/> Activar</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 🚩 TAB 4: MODERACIÓN (REPORTS) */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Flag className="text-red-500"/> Centro de Reportes</h2>
              {reports.length === 0 ? (
                <div className="nm-btn border border-white/5 p-10 rounded-[2rem] text-center text-gray-500">
                  La comunidad está en paz. No hay reportes pendientes.
                </div>
              ) : (
                <div className="grid gap-4">
                  {reports.map((r: any) => (
                    <div key={r.id} className="nm-btn border border-red-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="w-full">
                        <h4 className="text-lg font-bold text-white mb-2">Motivo: {r.reason}</h4>
                        
                        {/* 🔥 RADAR ACTIVADO: Quién reportó y a quién */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-400 mb-3 bg-black/30 p-3 rounded-xl border border-white/5">
                          <p>
                            🚩 Denunciante: <span className="text-white font-bold">@{r.reporter?.username || 'Anónimo'}</span>
                          </p>
                          <span className="hidden sm:inline">|</span>
                          <p>
                            🎯 Acusado: <span className="text-red-400 font-bold">@{r.reportedUser?.username || r.reportedUsername || 'N/A'}</span>
                          </p>
                        </div>

                        {/* 🔥 QUÉ CONTENIDO ES (Post o Perfil) */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest border border-white/10">
                            Tipo: {r.type || 'POST'}
                          </span>
                          {r.targetId && (
                            <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-1 rounded font-bold border border-red-500/20 truncate max-w-xs">
                              ID Ref: {r.targetId}
                            </span>
                          )}
                        </div>

                        <p className="text-sm bg-black/50 p-4 rounded-xl border border-white/5 text-gray-300 italic">"{r.description || 'Sin descripción adicional.'}"</p>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="flex-1 px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-colors shadow-lg">
                          Tomar Acción
                        </button>
                        <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="flex-1 px-6 py-2 rounded-xl border border-gray-600/50 text-gray-400 font-bold text-xs hover:text-white hover:bg-white/5 transition-colors">
                          Descartar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⚙️ TAB 5: PLATAFORMA (SETTINGS) */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Settings className="text-gray-400"/> Configuración Global</h2>
              <div className="nm-btn border border-white/5 p-8 rounded-[2rem]">
                <h3 className="font-bold text-white mb-4">Comisión Base de la Plataforma (%)</h3>
                <p className="text-sm text-gray-400 mb-6">Esta es la tajada automática que toma el sistema de cada venta general (no afecta retiros exprés).</p>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    placeholder="Ej. 20" 
                    value={newFee} 
                    onChange={(e) => setNewFee(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                  />
                  <button onClick={handleUpdateFee} className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </AppLayout>
  );
}