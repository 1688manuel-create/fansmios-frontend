"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../../lib/api';
import AppLayout from '../../../../../components/AppLayout';

import { 
  ShieldAlert, ShieldCheck, ZoomIn, X, PlayCircle, BrainCircuit,
  ArrowLeft, Coffee, UserSquare2, FileCheck2, ScanFace, Search,
  ChevronLeft, ChevronRight // 👈 Nuevos Iconos de Paginación
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

export default function AdminKyc() {
  const router = useRouter();
  const t = useTranslations('AdminKyc'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔥 Arquitectura Escalable: Paginación, Búsqueda y Pestañas
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  
  // Modales
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean, profileId: string | null }>({ isOpen: false, profileId: null });
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 🔥 Las opciones ahora usan el traductor
  const rejectionOptions = [
    t('reject_opt_1'),
    t('reject_opt_2'),
    t('reject_opt_3'),
    t('reject_opt_4'),
    t('reject_opt_5')
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchKycProfiles();
  }, [activeTab, debouncedSearch, page]);

  const fetchKycProfiles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/kyc/pending', {
        params: { status: activeTab, search: debouncedSearch, page, limit: 10 }
      }); 
      setProfiles(res.data.profiles || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setCounts(res.data.counts || { PENDING: 0, APPROVED: 0, REJECTED: 0 });
    } catch (error) {
      console.error("Error cargando KYC:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
  };

  const handleApprove = async (id: string, username: string) => {
    if (!window.confirm(`${t('alert_approve_confirm')} ${username}?`)) return;
    setProcessingId(id);
    try {
      await api.post(`/admin/kyc/${id}/approve`);
      alert(t('alert_approved'));
      fetchKycProfiles();
    } catch (error: any) {
      alert(t('alert_error_approve'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason || !rejectModal.profileId) return alert(t('alert_select_reason'));
    setProcessingId(rejectModal.profileId);
    try {
      await api.post(`/admin/kyc/${rejectModal.profileId}/reject`, { reason: rejectReason });
      alert(t('alert_rejected'));
      setRejectModal({ isOpen: false, profileId: null });
      setRejectReason('');
      fetchKycProfiles();
    } catch (error: any) {
      alert(t('alert_error_reject'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] pb-20 relative">
        <div className="absolute top-0 left-1/2 w-[800px] h-[300px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        <nav className="sticky top-0 z-40 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">{t('nav_title')}</h1>
              <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">{t('nav_subtitle')}</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/admin')} className="text-sm border border-white/10 text-gray-300 px-5 py-2.5 rounded-full hover:bg-white/5 hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-7xl mx-auto mt-8 px-4 relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex flex-wrap gap-3 bg-white/5 p-2 rounded-2xl w-fit border border-white/5">
              {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => handleTabChange(tab as any)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab 
                    ? tab === 'PENDING' ? 'bg-blue-600 text-white' : tab === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'PENDING' ? t('tab_pending') : tab === 'APPROVED' ? t('tab_approved') : t('tab_rejected')}
                  <span className="bg-black/40 px-2 py-0.5 rounded-full text-[10px]">
                    {counts[tab as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 animate-pulse text-gray-400 font-bold tracking-widest">{t('loading')}</div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
              <Coffee className="w-16 h-16 mx-auto text-gray-600 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-gray-300">
                {searchTerm ? t('empty_search') : t('empty_category')}
              </h3>
            </div>
          ) : (
            <div className="space-y-8">
              {profiles.map((p) => {
                const ids = p.idDocumentUrl ? p.idDocumentUrl.split(',') : [];
                const idFront = ids[0] || null;
                const idBack = ids[1] || null;

                const username = p.user?.username || 'Usuario';
                const initial = username !== 'Usuario' ? username.toUpperCase() : 'U';
                const email = p.user?.email || 'Sin correo registrado';
                const date = p.user?.createdAt ? new Date(p.user.createdAt).toLocaleDateString() : 'N/A';

                return (
                  <div key={p.id} className="bg-[#0a0a0a] p-6 rounded-[2rem] border border-white/10 flex flex-col gap-6 relative shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center border-b border-white/5 pb-6 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black text-2xl border border-white/10">{initial}</div>
                        <div>
                          <h3 className="text-white font-black text-xl tracking-wide">@{username}</h3>
                          <p className="text-sm text-gray-400 font-medium">{email}</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">{t('lbl_registered')}: {date}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl">
                          <BrainCircuit className="w-6 h-6 text-purple-400" />
                          <div>
                            <p className="text-[10px] text-purple-300 uppercase font-bold tracking-widest">{t('lbl_ai_score')}</p>
                            <p className="text-sm text-white font-black">{p.kycRiskScore ? `${(p.kycRiskScore * 100).toFixed(1)}%` : 'N/A'}</p>
                          </div>
                        </div>

                        {p.kycStatus === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(p.id, username)} disabled={processingId === p.id} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2">
                              {processingId === p.id ? '...' : <><ShieldCheck className="w-5 h-5"/> {t('btn_approve')}</>}
                            </button>
                            <button onClick={() => setRejectModal({ isOpen: true, profileId: p.id })} disabled={processingId === p.id} className="bg-transparent border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2">
                              {processingId === p.id ? '...' : <><ShieldAlert className="w-5 h-5"/> {t('btn_reject')}</>}
                            </button>
                          </div>
                        )}
                        
                        {p.kycStatus === 'REJECTED' && p.kycRejectionReason && (
                           <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl max-w-xs">
                             <p className="text-[10px] text-red-400 uppercase font-bold tracking-widest">{t('lbl_reject_reason')}</p>
                             <p className="text-sm text-white font-medium truncate">{p.kycRejectionReason}</p>
                           </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-black border border-white/5 rounded-2xl p-2 relative group h-64 flex flex-col items-center justify-center">
                        <div className="absolute top-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 z-10 border border-white/10 uppercase tracking-widest flex items-center gap-1.5"><UserSquare2 className="w-3 h-3 text-blue-400"/> 1. {t('doc_front')}</div>
                        {idFront ? (
                          <div className="w-full h-full relative cursor-zoom-in" onClick={() => setZoomedImage(getImageUrl(idFront))}>
                            <img src={getImageUrl(idFront)} className="w-full h-full object-contain rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" alt="Frente" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-xl"><ZoomIn className="w-10 h-10 text-white" /></div>
                          </div>
                        ) : <div className="text-gray-500 text-sm">{t('no_file')}</div>}
                      </div>

                      <div className="bg-black border border-white/5 rounded-2xl p-2 relative group h-64 flex flex-col items-center justify-center">
                        <div className="absolute top-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 z-10 border border-white/10 uppercase tracking-widest flex items-center gap-1.5"><FileCheck2 className="w-3 h-3 text-indigo-400"/> 2. {t('doc_back')}</div>
                        {idBack ? (
                          <div className="w-full h-full relative cursor-zoom-in" onClick={() => setZoomedImage(getImageUrl(idBack))}>
                            <img src={getImageUrl(idBack)} className="w-full h-full object-contain rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" alt="Reverso" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-xl"><ZoomIn className="w-10 h-10 text-white" /></div>
                          </div>
                        ) : <div className="text-gray-500 text-sm">{t('no_file')}</div>}
                      </div>

                      <div className="bg-black border border-purple-500/20 rounded-2xl p-2 relative h-64 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <div className="absolute top-3 left-3 bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold text-purple-300 z-10 uppercase tracking-widest flex items-center gap-1.5"><PlayCircle className="w-3 h-3 text-purple-400"/> 3. {t('doc_selfie')}</div>
                        {p.idSelfieUrl ? (
                          <video src={getImageUrl(p.idSelfieUrl)} controls autoPlay muted loop className="w-full h-full object-contain rounded-xl" />
                        ) : <div className="text-gray-500 text-sm">{t('no_video')}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-10">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-gray-400 font-bold text-sm tracking-widest">
                    {t('pagination_page')} <span className="text-white">{page}</span> {t('pagination_of')} {totalPages}
                  </span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Zoom" />
          <button className="absolute top-6 right-6 text-white hover:text-red-500 bg-black/50 p-2 rounded-full"><X className="w-8 h-8"/></button>
        </div>
      )}

      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/30 p-8 rounded-3xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setRejectModal({ isOpen: false, profileId: null })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">{t('modal_reject_title')}</h2>
            <p className="text-gray-400 text-sm mb-6">{t('modal_reject_desc')}</p>
            
            <div className="space-y-3 mb-6">
              {rejectionOptions.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${rejectReason === opt ? 'bg-red-500/10 border-red-500 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                  <input type="radio" name="reason" value={opt} checked={rejectReason === opt} onChange={(e) => setRejectReason(e.target.value)} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${rejectReason === opt ? 'border-red-500' : 'border-gray-500'}`}>
                    {rejectReason === opt && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              ))}
            </div>

            <button onClick={handleRejectSubmit} disabled={!rejectReason || processingId !== null} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors tracking-widest">
              {processingId ? t('btn_processing') : t('btn_confirm_reject')}
            </button>
          </div>
        </div>
      )}

    </AppLayout>
  );
}