// frontend/app/admin/payouts/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

export default function AdminPayouts() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Verificamos si es Admin (Básico)
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    try {
      const res = await api.get('/admin/payouts/pending');
      setWithdrawals(res.data.withdrawals || []);
    } catch (error) {
      console.error("Error cargando retiros:", error);
      alert("Error de conexión al cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, amount: number, address: string) => {
    const confirm = window.confirm(`⚠️ ¿Estás seguro de enviar $${amount} USDT a la billetera:\n${address}?`);
    if (!confirm) return;

    // En un futuro, aquí no pediremos el Hash, sino que el Backend lo hará solo.
    // Por ahora, simulamos el Hash si lo haces manual en Binance.
    const txHash = prompt("Pega el Hash de Transacción (TXID) si ya lo enviaste manual, o déjalo vacío para simularlo:");

    setProcessingId(id);
    try {
      await api.post(`/admin/payouts/${id}/approve`, { 
        txHash: txHash || `SIMULATED_TX_${Date.now()}`,
        adminNotes: 'Pago Cripto Procesado'
      });
      alert("✅ ¡Pago Registrado y Creador Notificado!");
      fetchPendingPayouts();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al aprobar el retiro.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, amount: number) => {
    const reason = prompt(`❌ Vas a RECHAZAR el retiro de $${amount} USD.\nEscribe la razón (Ej: "Billetera inválida" o "Sospecha de Fraude"):`);
    if (!reason) return;

    setProcessingId(id);
    try {
      await api.post(`/admin/payouts/${id}/reject`, { adminNotes: reason });
      alert("🛡️ Retiro rechazado. El dinero volvió al balance del creador.");
      fetchPendingPayouts();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al rechazar el retiro.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-bold tracking-widest animate-pulse">CARGANDO BÓVEDA...</div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      
      {/* 👑 NAVBAR DEL ADMIN */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-red-500/20 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-black/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            👑
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight">Control de Payouts</h1>
            <p className="text-[10px] text-red-400 font-bold tracking-widest uppercase">Centro de Comando Antifraude</p>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-white/5 border border-white/10 text-white px-5 py-2 rounded-full hover:bg-white/10 transition-all font-bold">
          Salir al Dashboard
        </button>
      </nav>

      <main className="max-w-6xl mx-auto mt-10 px-4">
        
        {/* ESTADÍSTICA RÁPIDA */}
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/10 to-transparent mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Retiros Pendientes</h2>
            <p className="text-4xl font-extrabold text-white mt-1">{withdrawals.length}</p>
          </div>
          <div className="text-right">
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total a Pagar</h2>
            <p className="text-4xl font-extrabold text-orange-400 mt-1">
              ${withdrawals.reduce((acc, w) => acc + w.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* LISTA DE SOLICITUDES */}
        {withdrawals.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl">
            <div className="text-6xl mb-4 opacity-50">☕</div>
            <h3 className="text-xl font-bold text-white">Todo está al día, CEO.</h3>
            <p className="text-gray-500 mt-2">No hay creadores solicitando retiros en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((w) => (
              <div key={w.id} className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/40 hover:bg-black/60 transition-colors flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                
                {/* 1. Datos del Creador (Antifraude) */}
                <div className="flex-1 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl shrink-0">
                    👤
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">@{w.creator?.username}</h3>
                    <p className="text-xs text-gray-400">{w.creator?.email}</p>
                    <div className="mt-2 flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">Billetera: ${w.creator?.wallet?.balance?.toFixed(2)}</span>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Retenido: ${w.creator?.wallet?.pendingBalance?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Datos del Retiro */}
                <div className="flex-1 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 w-full lg:w-auto">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Monto Solicitado</p>
                  <p className="text-3xl font-extrabold text-white mb-3 text-green-400">${w.amount?.toFixed(2)}</p>
                  
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Billetera Destino ({w.cryptoNetwork})</p>
                  <code className="text-[11px] text-blue-300 break-all select-all font-mono mt-1 block bg-blue-500/10 p-2 rounded">
                    {w.cryptoAddress || 'No proporcionada'}
                  </code>
                </div>

                {/* 3. Botones de Poder */}
                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-40 shrink-0">
                  <button 
                    onClick={() => handleApprove(w.id, w.amount, w.cryptoAddress)}
                    disabled={processingId === w.id}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === w.id ? '...' : '✅ Aprobar'}
                  </button>
                  <button 
                    onClick={() => handleReject(w.id, w.amount)}
                    disabled={processingId === w.id}
                    className="flex-1 bg-zinc-800 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === w.id ? '...' : '❌ Rechazar'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}