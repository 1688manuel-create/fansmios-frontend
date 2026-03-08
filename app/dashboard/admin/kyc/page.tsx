// frontend/app/admin/kyc/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import AppLayout from '../../../../components/AppLayout';

// 🔥 IMPORTAMOS ICONOS DE LUCIDE REACT
import { 
  Scale, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Search, 
  Coffee, 
  UserSquare2, 
  FileCheck2, 
  ScanFace 
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

export default function AdminKyc() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Seguridad básica
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchPendingKyc();
  }, []);

  const fetchPendingKyc = async () => {
    try {
      const res = await api.get('/admin/kyc/pending');
      setProfiles(res.data.profiles || []);
    } catch (error) {
      console.error("Error cargando KYC:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, username: string) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de APROBAR legalmente a @${username}? Esto le permitirá retirar dinero.`)) return;

    setProcessingId(id);
    try {
      await api.post(`/admin/kyc/${id}/approve`);
      alert("✅ Identidad Aprobada exitosamente.");
      fetchPendingKyc();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al aprobar.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, username: string) => {
    const reason = prompt(`❌ Vas a RECHAZAR a @${username}.\nEscribe la razón (Ej: "Selfie borrosa", "ID falso", "No coincide el rostro"):`);
    if (!reason) return;

    setProcessingId(id);
    try {
      await api.post(`/admin/kyc/${id}/reject`, { reason });
      alert("🛡️ Expediente Rechazado. El creador ha sido notificado.");
      fetchPendingKyc();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al rechazar.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center text-white font-bold animate-pulse">Iniciando Cámara Gesell...</div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-20 relative">
        
        {/* Iluminación de ambiente */}
        <div className="absolute top-0 left-1/2 w-[800px] h-[300px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        {/* 👑 NAVBAR DEL ADMIN NEUMÓRFICA */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 nm-inset bg-black rounded-2xl flex items-center justify-center text-blue-500 border border-white/5 shadow-inner">
              <Scale className="w-6 h-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Control de Identidad</h1>
              <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Módulo Legal AML / KYC</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/admin')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
          </button>
        </nav>

        <main className="max-w-7xl mx-auto mt-10 px-4 relative z-10">
          
          <div className="nm-inset p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-900/10 to-transparent mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" /> Expedientes Pendientes de Revisión
              </h2>
              <p className="text-5xl font-black text-white mt-2">{profiles.length}</p>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-20 nm-inset rounded-[2rem] border border-white/5">
              <Coffee className="w-16 h-16 mx-auto text-gray-600 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-gray-300">No hay criminales a la vista, Jefe.</h3>
              <p className="text-gray-500 mt-2 font-medium">Todos los creadores están verificados o no hay nuevas solicitudes en la cola.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {profiles.map((p) => {
                // Dividimos el string del ID para sacar el Frente y el Reverso
                const ids = p.idDocumentUrl ? p.idDocumentUrl.split(',') : [];
                const idFront = ids[0] || null;
                const idBack = ids[1] || null;

                return (
                  <div key={p.id} className="nm-btn p-6 rounded-[2rem] border border-white/5 flex flex-col gap-6 relative overflow-hidden cursor-default">
                    
                    {/* Encabezado del Usuario */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/5 pb-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full nm-inset bg-[#0a0a0a] flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white/10">
                          {p.user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white font-black text-xl tracking-wide">@{p.user.username}</h3>
                          <p className="text-sm text-gray-400 font-medium">{p.user.email}</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                            Registrado: {new Date(p.user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Botones de Poder (Extruidos y Contundentes) */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApprove(p.id, p.user.username)}
                          disabled={processingId === p.id}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingId === p.id ? '...' : <><CheckCircle className="w-5 h-5"/> APROBAR</>}
                        </button>
                        <button 
                          onClick={() => handleReject(p.id, p.user.username)}
                          disabled={processingId === p.id}
                          className="nm-btn border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingId === p.id ? '...' : <><XCircle className="w-5 h-5"/> RECHAZAR</>}
                        </button>
                      </div>
                    </div>

                    {/* Galería de Evidencia (Hundida) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* FOTO 1: FRENTE ID */}
                      <div className="nm-inset border border-white/5 rounded-2xl p-2 relative group h-64 flex flex-col items-center justify-center">
                        <div className="absolute top-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 z-10 border border-white/10 uppercase tracking-widest flex items-center gap-1.5">
                          <UserSquare2 className="w-3 h-3 text-blue-400"/> 1. Frente ID
                        </div>
                        {idFront ? (
                          <a href={getImageUrl(idFront)} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                            <img src={getImageUrl(idFront)} className="max-w-full max-h-full object-contain rounded-xl opacity-90 group-hover:opacity-100 transition-opacity cursor-zoom-in" alt="ID Frente" />
                          </a>
                        ) : <div className="text-red-500 font-bold text-sm flex items-center gap-2"><XCircle className="w-4 h-4"/> Archivo Faltante</div>}
                      </div>

                      {/* FOTO 2: REVERSO ID */}
                      <div className="nm-inset border border-white/5 rounded-2xl p-2 relative group h-64 flex flex-col items-center justify-center">
                        <div className="absolute top-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 z-10 border border-white/10 uppercase tracking-widest flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-indigo-400"/> 2. Reverso ID
                        </div>
                        {idBack ? (
                          <a href={getImageUrl(idBack)} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                            <img src={getImageUrl(idBack)} className="max-w-full max-h-full object-contain rounded-xl opacity-90 group-hover:opacity-100 transition-opacity cursor-zoom-in" alt="ID Reverso" />
                          </a>
                        ) : <div className="text-red-500 font-bold text-sm flex items-center gap-2"><XCircle className="w-4 h-4"/> Archivo Faltante</div>}
                      </div>

                      {/* FOTO 3: SELFIE (PRUEBA DE VIDA) */}
                      <div className="nm-inset border border-purple-500/20 rounded-2xl p-2 relative group h-64 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <div className="absolute top-3 left-3 bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold text-purple-300 z-10 uppercase tracking-widest flex items-center gap-1.5">
                          <ScanFace className="w-3 h-3 text-purple-400"/> 3. Prueba de Vida
                        </div>
                        {p.idSelfieUrl ? (
                          <a href={getImageUrl(p.idSelfieUrl)} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                            <img src={getImageUrl(p.idSelfieUrl)} className="max-w-full max-h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity cursor-zoom-in" alt="Selfie" />
                          </a>
                        ) : <div className="text-red-500 font-bold text-sm flex items-center gap-2"><XCircle className="w-4 h-4"/> Archivo Faltante</div>}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </AppLayout>
  );
}