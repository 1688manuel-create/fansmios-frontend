"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '../../../../lib/adminService';
import api from '../../../../lib/api';
import AppLayout from '../../../../components/AppLayout';

// 🔥 IMPORTAMOS EL PODER DEL MODAL UNIVERSAL
import { useModal } from '../../../../src/context/ModalContext';

// 🔥 ICONOS PREMIUM
import { 
  Crown, Scale, BarChart3, Users, Banknote, Flag, Settings, 
  TrendingUp, PiggyBank, Wallet, Sparkles, ImageIcon,
  CheckCircle, XCircle, Eye, UserX, Ghost, ShieldBan, Percent, Download
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import MuteVideoButton from './MuteVideoButton';

export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations('AdminDashboard'); 
  const { showModal } = useModal(); // 💥 INVOCAMOS EL CEREBRO DEL MODAL

  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'WITHDRAWALS' | 'REPORTS' | 'SETTINGS'>('STATS');
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]); 
  
  // 🔥 ESTADOS DE LA BÓVEDA ESPECIAL DEL ADMIN
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // ESTADO DEL MODO DIOS: COMISIONES DINÁMICAS
  const [fees, setFees] = useState({
    feeSubscription: 20,
    feePPV: 20,
    feeTips: 20,
    feeLive: 30,
    feeWithdrawalStd: 2,
    feeWithdrawalExp: 5,
  });
  const [isUpdatingFees, setIsUpdatingFees] = useState(false);
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
      const [statsData, usersData, withData, reportsData, analyticsData, settingsData, vaultData] = await Promise.all([
        adminService.getStats().catch(() => ({ stats: null })),
        adminService.getAllUsers().catch(() => ({ users: [] })),
        api.get('/admin/payouts/pending').catch(() => ({ data: { withdrawals: [] } })),
        api.get('/admin/reports').catch(() => ({ data: { reports: [] } })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: null })),
        api.get('/admin/platform-settings').catch(() => ({ data: null })),
        api.get('/admin/vault').catch(() => ({ data: null }))
      ]);
      
      setStats(statsData?.stats);
      setUsers(usersData?.users || []);
      setWithdrawals(withData?.data?.withdrawals || []);
      setReports(reportsData?.data?.reports || []);
      setAnalytics(analyticsData?.data);
      setVaultInfo(vaultData?.data);
      
      if (settingsData?.data && settingsData.data.id) {
        setFees({
          feeSubscription: settingsData.data.feeSubscription || 20,
          feePPV: settingsData.data.feePPV || 20,
          feeTips: settingsData.data.feeTips || 20,
          feeLive: settingsData.data.feeLive || 30,
          feeWithdrawalStd: settingsData.data.feeWithdrawalStd || 2,
          feeWithdrawalExp: settingsData.data.feeWithdrawalExp || 5,
        });
      }
    } catch (error) {
      console.error("Error cargando panel de admin", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =================================================================
  // 🏦 LÓGICA DE LA BÓVEDA ESPECIAL (Se mantiene el diseño de 2 campos)
  // =================================================================
  const openWithdrawModal = () => {
    if (!vaultInfo || vaultInfo.saldoDisponible <= 0) return;
    setWithdrawAmount(vaultInfo.saldoDisponible.toString()); 
    setWithdrawAddress('');
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > vaultInfo.saldoDisponible) {
      return alert("❌ Monto inválido o superior al saldo disponible.");
    }
    if (!withdrawAddress.trim()) {
      return alert("❌ Por favor ingresa una dirección válida de tu wallet.");
    }

    setIsWithdrawing(true);
    try {
      await api.post('/admin/vault/withdraw', { amount, cryptoAddress: withdrawAddress, notes: 'Retiro manual del Comandante' });
      alert(`✅ Retiro exitoso de $${amount} USD. El dinero va en camino a tu bóveda.`);
      setIsWithdrawModalOpen(false); 
      fetchData(); 
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al intentar retirar.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // =================================================================
  // 🛡️ LÓGICA CON MODAL UNIVERSAL PREMIUM
  // =================================================================

  const handleUpdateFees = async () => {
    setIsUpdatingFees(true);
    try {
      await api.put('/admin/platform-settings', fees)
      alert(t('alert_fees_updated'));
      fetchData();
    } catch (error) { 
      alert(t('alert_error_fees')); 
    } finally {
      setIsUpdatingFees(false);
    }
  };

  const handleFeeChange = (e: any) => {
    setFees({ ...fees, [e.target.name]: Number(e.target.value) });
  };

  // 1. BANEAR O ACTIVAR USUARIO (Usa Modal Universal)
  const handleUserStatus = (userId: string, status: string) => {
    showModal({
      title: status === 'ACTIVE' ? "Activar Usuario" : "Banear Usuario",
      message: `Escribe el motivo para cambiar el estatus a ${status}:`,
      type: status === 'ACTIVE' ? 'SUCCESS' : 'ERROR',
      showInput: true,
      placeholder: "Motivo...",
      confirmText: "Aplicar Cambio",
      onConfirm: async (reason) => {
        if (!reason) return; 
        try {
          await adminService.changeUserStatus(userId, status, reason);
          fetchData();
        } catch (error) { alert(t('alert_error_status')); }
      }
    });
  };

  // 2. APROBAR PAGO A CREADOR (Usa Modal Universal)
  const handleApprovePayout = (id: string, amount: number, address: string) => {
    showModal({
      title: "Aprobar Retiro",
      message: `El creador solicitó $${amount}. Pégalo en tu panel de Binance/PayRam y luego pega aquí el TX Hash:`,
      type: 'SUCCESS',
      showInput: true,
      placeholder: "Ej. 0xabc123... o TxyZ98...",
      confirmText: "Aprobar y Finalizar",
      onConfirm: async (txHash) => {
        setProcessingId(id);
        try {
          await api.post(`/admin/payouts/${id}/approve`, { 
            txHash: txHash || `SIMULATED_TX_${Date.now()}`,
            adminNotes: 'Pago Cripto Procesado Oficialmente'
          });
          fetchData();
        } catch (error: any) {
          alert(error.response?.data?.error || t('alert_error_approve'));
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  // 3. RECHAZAR PAGO (Usa Modal Universal)
  const handleRejectPayout = (id: string, amount: number) => {
    showModal({
      title: "Rechazar Retiro",
      message: `Vas a rechazar el retiro de $${amount} y el dinero regresará a la bóveda del creador. Escribe el motivo:`,
      type: 'ERROR',
      showInput: true,
      placeholder: "Ej. Dirección inválida...",
      confirmText: "Rechazar Retiro",
      onConfirm: async (reason) => {
        if (!reason) return;
        setProcessingId(id);
        try {
          await api.post(`/admin/payouts/${id}/reject`, { adminNotes: reason });
          fetchData();
        } catch (error: any) {
          alert(error.response?.data?.error || t('alert_error_reject'));
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  // 4. RESOLVER REPORTES DE MODERACIÓN (Usa Modal Universal)
  const handleResolveReport = (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    showModal({
      title: status === 'RESOLVED' ? "Sancionar Reporte" : "Desestimar Reporte",
      message: "Añade una nota administrativa interna para cerrar este caso:",
      type: status === 'RESOLVED' ? 'ERROR' : 'INFO',
      showInput: true,
      placeholder: "Nota interna...",
      confirmText: "Cerrar Caso",
      onConfirm: async (adminMessage) => {
        if (!adminMessage) return;
        try {
          await api.put('/admin/reports/resolve', { reportId, newStatus: status, adminMessage });
          fetchData(); 
        } catch (error) { alert(t('alert_error_report')); }
      }
    });
  };

  // 🔥 NUEVA FUNCIÓN: DESCARGAR EL PDF DESDE EL MODO DIOS
  const handleDownloadPdf = async (withdrawalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fansmio.com';
      
      const response = await fetch(`${API_URL}/api/wallet/withdraw/${withdrawalId}/pdf`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("No se pudo descargar el PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fansmio_Recibo_${withdrawalId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al generar tu comprobante PDF. Intenta más tarde.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500 rounded-full animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base text-white">
        
        {/* NAVBAR SUPERADMIN */}
        <nav className="bg-[#0a0a0a] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Crown className="text-red-500 w-8 h-8" />
            <h1 className="text-xl font-black text-red-500">{t('nav_title')}</h1>
          </div>
          <button onClick={() => router.push('/dashboard/admin/kyc')} className="nm-btn border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-purple-900/20 transition-colors">
            {t('nav_kyc_btn')} ({analytics?.metrics?.security?.pendingKyc || 0})
          </button>
        </nav>

        <main className="max-w-7xl mx-auto mt-8 px-4 pb-20">
          
          {/* TABS NAVEGACIÓN */}
          <div className="flex p-1.5 nm-inset rounded-2xl border border-white/5 w-fit mb-10 overflow-x-auto max-w-full">
            {[
              { id: 'STATS', label: t('tab_financial'), icon: BarChart3 },
              { id: 'USERS', label: t('tab_users'), icon: Users },
              { id: 'WITHDRAWALS', label: t('tab_withdrawals'), icon: Banknote },
              { id: 'REPORTS', label: t('tab_moderation'), icon: Flag },
              { id: 'SETTINGS', label: t('tab_platform'), icon: Settings },
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
                <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500"/> {t('stat_volume')}
                  </h3>
                  <p className="text-4xl font-black text-white">
                    ${(analytics?.metrics?.finance?.totalVolumeProcessed || 0).toFixed(2)}
                  </p>
                </div>
                
                {/* 🏦 LA BÓVEDA DEL COMANDANTE */}
                <div className="nm-btn border border-green-500/30 p-8 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-green-500"/> GANANCIA DISPONIBLE</span>
                    </h3>
                    {/* Muestra el saldo real disponible de la bóveda */}
                    <p className="text-4xl font-black text-green-400">
                      ${(vaultInfo?.saldoDisponible || 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
                      BRUTO HISTÓRICO: ${(vaultInfo?.ingresosBrutos || 0).toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={openWithdrawModal}
                    disabled={!vaultInfo || vaultInfo.saldoDisponible <= 0}
                    className="mt-6 w-full bg-green-500/10 border border-green-500/50 text-green-400 font-bold text-xs py-3 rounded-xl hover:bg-green-600 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-green-400"
                  >
                    Retirar a Bóveda Privada 🛡️
                  </button>
                </div>

                <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-500"/> {t('stat_pending_withdrawals')}
                  </h3>
                  <p className="text-4xl font-black text-orange-400">
                    ${(analytics?.metrics?.finance?.pendingLiability || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* ÚLTIMOS MOVIMIENTOS PAYRAM */}
              <div className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="p-6 bg-[#0e0e0e] border-b border-white/5">
                  <h3 className="font-black text-white text-lg">{t('history_title')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">{t('th_type')}</th>
                        <th className="px-6 py-4">{t('th_from')}</th>
                        <th className="px-6 py-4">{t('th_to')}</th>
                        <th className="px-6 py-4">{t('th_amount')}</th>
                        <th className="px-6 py-4">{t('th_fee')}</th>
                        <th className="px-6 py-4">{t('th_date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.recentActivity || []).map((tx: any) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5 font-bold text-blue-400 text-xs">{tx.type}</td>
                          <td className="px-6 py-5">@{tx.sender?.username || t('anonymous')}</td>
                          <td className="px-6 py-5 text-purple-400">@{tx.receiver?.username || t('anonymous')}</td>
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

          {/* 💸 TAB 2: RETIROS */}
          {activeTab === 'WITHDRAWALS' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Banknote className="text-orange-500"/> {t('tab_withdrawals')}</h2>
              {withdrawals.length === 0 ? (
                <div className="nm-btn border border-white/5 p-10 rounded-[2rem] text-center text-gray-500">
                  {t('withdrawals_empty')}
                </div>
              ) : (
                <div className="grid gap-4">
                  {withdrawals.map((w: any) => (
                    <div key={w.id} className="nm-btn border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">ID: {w.id}</p>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          @{w.creator?.username || t('unknown_user')} 
                          <span className="text-[10px] px-2 py-1 rounded-full font-black bg-orange-500/20 text-orange-400">
                            {w.status}
                          </span>
                        </h4>
                        <div className="mt-1 flex gap-3 text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span className="text-green-400">{t('lbl_active_wallet')}: ${w.creator?.wallet?.balance?.toFixed(2) || 0}</span>
                          <span className="text-yellow-400">{t('lbl_held_wallet')}: ${w.creator?.wallet?.pendingBalance?.toFixed(2) || 0}</span>
                        </div>
                        <p className="text-sm mt-2"><span className="text-gray-400">{t('lbl_network')}:</span> {w.cryptoNetwork || 'TRC20'} <span className="text-gray-400 ml-3">{t('lbl_address')}:</span> <span className="text-blue-400 select-all font-mono bg-blue-500/10 px-2 py-1 rounded">{w.cryptoAddress || t('not_provided')}</span></p>
                        {w.adminNotes && <p className="text-xs text-orange-300 mt-2 bg-orange-500/10 p-2 rounded-lg">{w.adminNotes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black text-green-400 mb-4">${w.amount?.toFixed(2)} <span className="text-sm text-gray-500 font-normal">USDT</span></p>
                        
                        {/* 🔥 LÓGICA DE BOTONES Y PDF CONDICIONAL */}
                        <div className="flex flex-col gap-2">
                          {w.status === 'PENDING' || w.status === 'PROCESSING' ? (
                            <>
                              <button 
                                onClick={() => handleApprovePayout(w.id, w.amount, w.cryptoAddress)} 
                                disabled={processingId === w.id}
                                className="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-colors disabled:opacity-50"
                              >
                                {processingId === w.id ? t('btn_processing') : `✅ ${t('btn_approve_crypto')}`}
                              </button>
                              <button 
                                onClick={() => handleRejectPayout(w.id, w.amount)} 
                                disabled={processingId === w.id}
                                className="w-full px-6 py-2 rounded-xl border border-red-500/50 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {processingId === w.id ? t('btn_processing') : `❌ ${t('btn_reject')}`}
                              </button>
                            </>
                          ) : (w.status === 'PAID' || w.status === 'APPROVED') ? (
                            <button 
                              onClick={() => handleDownloadPdf(w.id)}
                              className="w-full px-6 py-3 rounded-xl bg-blue-600/20 border border-blue-500/50 text-blue-400 font-bold text-sm hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Descargar PDF
                            </button>
                          ) : (
                            <div className="w-full px-6 py-3 rounded-xl border border-gray-600/50 text-gray-500 font-bold text-sm text-center">
                              RECHAZADO
                            </div>
                          )}
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
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Users className="text-blue-500"/> {t('tab_users')}</h2>
              <div className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-[#111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">{t('th_user_email')}</th>
                        <th className="px-6 py-4">{t('th_role')}</th>
                        <th className="px-6 py-4">{t('th_status')}</th>
                        <th className="px-6 py-4">{t('th_actions')}</th>
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
                              <button onClick={() => handleUserStatus(u.id, 'BANNED')} className="text-red-500 hover:text-red-400 flex items-center gap-1 text-xs font-bold"><ShieldBan className="w-4 h-4"/> {t('btn_ban')}</button>
                            ) : (
                              <button onClick={() => handleUserStatus(u.id, 'ACTIVE')} className="text-green-500 hover:text-green-400 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4"/> {t('btn_activate')}</button>
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

          {/* 🚩 TAB 4: MODERACIÓN */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Flag className="text-red-500"/> {t('tab_moderation')}</h2>
              {reports.length === 0 ? (
                <div className="nm-btn border border-white/5 p-10 rounded-[2rem] text-center text-gray-500">
                  {t('reports_empty')}
                </div>
              ) : (
                <div className="grid gap-4">
                  {reports.map((r: any) => {
                    const targetUsername = r.reportedUser?.username;
                    const reportType = r.type || 'POST'; 
                    const referenceId = r.postId || r.messageId || r.reportedUserId || 'N/A';

                   return (
                      <div key={r.id} className="nm-btn border border-red-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="w-full">
                          <h4 className="text-lg font-bold text-white mb-2">{t('lbl_reason')}: {r.reason}</h4>
                          
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-400 mb-3 bg-black/30 p-3 rounded-xl border border-white/5">
                            <p>
                              🚩 {t('lbl_reporter')}: <span className="text-white font-bold">@{r.reporter?.username || t('anonymous')}</span>
                            </p>
                            <span className="hidden sm:inline">|</span>
                            <p>
                              🎯 {t('lbl_accused')}: <span className="text-red-400 font-bold">@{targetUsername || t('unknown_user')}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest border border-white/10">
                              {t('lbl_type')}: {reportType}
                            </span>
                            <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-1 rounded font-bold border border-red-500/20 truncate max-w-xs font-mono">
                              ID: {referenceId}
                            </span>
                          </div>

                          <p className="text-sm bg-black/50 p-4 rounded-xl border border-white/5 text-gray-300 italic">"{r.description || t('no_description')}"</p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-48 mt-4 md:mt-0">
                          <button 
                            onClick={() => {
                              if (reportType === 'POST' && targetUsername && r.postId) {
                                router.push(`/${targetUsername}#post-${r.postId}`);
                              } else if (reportType === 'USER' && targetUsername) {
                                router.push(`/${targetUsername}`);
                              } else if (reportType === 'MESSAGE') {
                                router.push(`/dashboard/messages`);
                              } else {
                                router.push(`/${targetUsername || ''}`);
                              }
                            }} 
                            className="w-full px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/50 text-blue-400 font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4"/> {t('btn_view_evidence')}
                          </button>

                          {/* 💥 AQUÍ INYECTAMOS EL BISTURÍ DMCA (Solo si es un Video/Post) */}
                          {reportType === 'POST' && r.postId && (
                            <MuteVideoButton postId={r.postId} />
                          )}

                          <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="w-full px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors shadow-lg flex items-center justify-center gap-2">
                            <ShieldBan className="w-4 h-4"/> {t('btn_take_action')}
                          </button>
                          
                          <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="w-full px-4 py-2 rounded-xl border border-gray-600/50 text-gray-400 font-bold text-xs hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4"/> {t('btn_dismiss')}
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ⚙️ TAB 5: PLATAFORMA (SETTINGS) - TUS 6 COMISIONES ORIGINALES */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-6"><Settings className="text-gray-400"/> {t('settings_title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* BLOQUE: VENTAS */}
                <div className="nm-btn border border-white/5 p-6 rounded-[2rem]">
                  <h3 className="text-red-500 font-bold mb-6 flex items-center gap-2"><Percent className="w-5 h-5"/> {t('settings_sales_title')}</h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_subs')}</label>
                      <input type="number" name="feeSubscription" value={fees.feeSubscription} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_ppv')}</label>
                      <input type="number" name="feePPV" value={fees.feePPV} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_tips')}</label>
                      <input type="number" name="feeTips" value={fees.feeTips} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_live')}</label>
                      <input type="number" name="feeLive" value={fees.feeLive} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* BLOQUE: RETIROS */}
                <div className="nm-btn border border-white/5 p-6 rounded-[2rem]">
                  <h3 className="text-blue-500 font-bold mb-6 flex items-center gap-2"><Banknote className="w-5 h-5"/> {t('settings_withdrawals_title')}</h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_std')}</label>
                      <input type="number" name="feeWithdrawalStd" value={fees.feeWithdrawalStd} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">{t('lbl_fee_exp')}</label>
                      <input type="number" name="feeWithdrawalExp" value={fees.feeWithdrawalExp} onChange={handleFeeChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 leading-relaxed">
                      {t('settings_warning')}
                    </p>
                    <button 
                      onClick={handleUpdateFees}
                      disabled={isUpdatingFees}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 flex justify-center items-center"
                    >
                      {isUpdatingFees ? t('btn_syncing') : t('btn_save_apply')}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
        
        {/* ========================================================= */}
        {/* 🪟 MODAL PREMIUM DE LA BÓVEDA (DISEÑO ESPECIAL 2 CAMPOS) */}
        {/* ========================================================= */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#0a0a0a] border border-green-500/30 rounded-[2rem] p-8 w-full max-w-md shadow-[0_0_50px_rgba(34,197,94,0.1)]">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <PiggyBank className="w-6 h-6 text-green-500"/> Extraer Fondos
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Saldo Disponible: <span className="text-green-400 font-bold">${vaultInfo?.saldoDisponible.toFixed(2)} USD</span></p>
                </div>
                <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Monto a Retirar (USD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white font-black text-xl focus:border-green-500 outline-none transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">Dirección de Bóveda (MetaMask/TronLink)</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-green-400 font-mono text-sm focus:border-green-500 outline-none transition-colors placeholder:text-gray-600"
                    placeholder="0x... o T..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-4 px-4 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 py-4 px-4 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isWithdrawing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Confirmar Transferencia <CheckCircle className="w-4 h-4"/></>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}