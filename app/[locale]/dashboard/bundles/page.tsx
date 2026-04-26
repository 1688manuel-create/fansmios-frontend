"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api'; 
import { bundleService } from '../../../../lib/bundleService';
import AppLayout from '../../../../components/AppLayout';
import { Package, Plus, Tag, DollarSign, Image as ImageIcon, CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// 🔥 FUNCIÓN BLINDADA ANTI-CRASH PARA IMÁGENES
const getImageUrl = (path: any) => {
  if (!path) return '';

  let safePath = path;

  // 1. Si viene como un texto JSON (ej: '["foto.png"]')
  if (typeof safePath === 'string' && safePath.startsWith('[')) {
    try {
      const parsed = JSON.parse(safePath);
      // 👇 Usamos safePath = en lugar de return
      safePath = Array.isArray(parsed) ? parsed[0]: parsed;
    } catch (e) {
      // Ignorar si no se puede parsear
    }
  }

  // 2. Si ya es una lista/Array real (Agregamos el aquí)
  if (Array.isArray(safePath)) {
    safePath = safePath[0] || '';
  }

  // 3. Si después de todo sigue sin ser un texto, abortamos para no romper React
  if (typeof safePath !== 'string') return '';

  // 4. El flujo normal de URLs (Aquí es donde se le pega la URL de tu servidor)
  if (safePath.startsWith('http')) return safePath;
  const cleanPath = safePath.startsWith('/') ? safePath.substring(1) : safePath;
  return `${BACKEND_URL}/${cleanPath}`;
};

// 🔥 FUNCIÓN TÁCTICA PARA EXTRAER LA PRIMERA IMAGEN SI ES UN ARRAY JSON
const getFirstMedia = (mediaUrl: string | null) => {
  if (!mediaUrl) return null;
  try {
    const parsed = JSON.parse(mediaUrl);
    // 👇 CORRECCIÓN APLICADA: parsed
    return Array.isArray(parsed) ? parsed[0]: parsed;
  } catch (e) {
    return mediaUrl; // Si no es JSON, es una URL vieja (soporte legacy)
  }
};

export default function ContentBundlesPage() {
  const router = useRouter();
  const t = useTranslations('ContentBundles');
  
  const [isCreating, setIsCreating] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  const [eligiblePosts, setEligiblePosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bundlesData, postsData] = await Promise.all([
        bundleService.getMyBundles(),
        bundleService.getEligiblePosts()
      ]);
      setBundles(bundlesData.bundles || []);
      setEligiblePosts(postsData.posts || []);
    } catch (error) {
      console.error("Error al cargar bundles", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPostIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || selectedPostIds.length === 0) {
        alert(t('alert_validation'));
        return;
    }

    setIsSubmitting(true);
    try {
      await bundleService.createBundle({
          title,
          description,
          price: parseFloat(price),
          postIds: selectedPostIds
      });
      
      alert(t('alert_created'));
      setTitle(''); setDescription(''); setPrice(''); setSelectedPostIds([]);
      setIsCreating(false);
      fetchData(); 
    } catch (error: any) {
      alert(error.response?.data?.error || t('alert_error_create'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm(t('alert_confirm_delete'))) return;
    try {
      await api.delete(`/bundles/${id}`); 
      fetchData();
    } catch (error) {
      alert(t('alert_error_delete'));
    }
  };

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base text-white pb-20">
        
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-5 backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" strokeWidth={2.5}/> {t('nav_title')}
          </h1>
        </nav>

        <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          
          {/* COLUMNA 1: FORMULARIO */}
          <div className="nm-inset rounded-[2rem] border border-white/5 p-6 sm:p-8 h-fit">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-green-400"/> {t('title_create')}</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">{t('desc_create')}</p>
              </div>
              <button onClick={() => setIsCreating(!isCreating)} className={`font-bold py-2.5 px-6 rounded-full transition-transform text-sm whitespace-nowrap ${isCreating ? 'nm-btn text-gray-400 hover:text-white' : 'nm-btn-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}>
                {isCreating ? t('btn_cancel') : t('btn_start_bundle')}
              </button>
            </div>
            
            {isCreating ? (
              <form onSubmit={handleCreateBundle} className="space-y-6 animate-fade-in border-t border-white/5 pt-6">
                {/* Inputs de Título, Precio, Descripción... */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">{t('lbl_title')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Tag className="w-4 h-4"/></span>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t('ph_title')} className="w-full nm-inset border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-blue-500/50 text-sm" />
                  </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">{t('lbl_price')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold"><DollarSign className="w-4 h-4"/></span>
                            <input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="19.99" className="w-full nm-inset border border-green-500/20 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-green-500/50 font-bold" />
                        </div>
                    </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">{t('lbl_desc')}</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={t('ph_desc')} rows={3} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-sm resize-none" />
                </div>

                <div className="pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold text-white uppercase tracking-widest bg-blue-500/20 px-3 py-1.5 rounded-lg mb-4 inline-block border border-blue-500/30">{t('lbl_step_2')}</label>
                  
                  {eligiblePosts.length === 0 ? (
                    <div className="nm-inset border border-white/5 rounded-2xl p-6 text-center">
                      <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">{t('empty_eligible_1')}<br/>{t('empty_eligible_2')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                      {eligiblePosts.map(post => {
                        const isSelected = selectedPostIds.includes(post.id);
                        // 🔥 PARSEO DE MINIATURA SEGURO
                        const thumb = getFirstMedia(post.mediaUrl);

                        return (
                          <div 
                            key={post.id} 
                            onClick={() => togglePostSelection(post.id)}
                            className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all h-28 group nm-inset ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-transparent hover:border-white/20'}`}
                          >
                            <img src={getImageUrl(thumb)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Post" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                                <span className="text-white text-[10px] font-bold truncate">{post.content || t('no_text')}</span>
                                <span className="text-green-400 text-xs font-bold">${post.price}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || selectedPostIds.length === 0 || !title || !price} className="w-full nm-btn-primary py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
                  {isSubmitting ? t('btn_packaging') : `${t('btn_create_with')} ${selectedPostIds.length} ${t('btn_posts')}`}
                </button>
              </form>
            ) : (
              <div className="text-center py-10 opacity-50">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-sm font-medium">{t('msg_click_start')}</p>
              </div>
            )}
          </div>

          {/* COLUMNA 2: LISTA DE PAQUETES ACTIVOS */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 pl-2"><Package className="w-5 h-5 text-gray-400"/> {t('title_active_bundles')}</h2>
            
            {bundles.length === 0 ? (
              <div className="nm-inset border border-white/5 rounded-[2rem] p-10 text-center flex flex-col items-center">
                <Package className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium text-sm">{t('empty_bundles')}</p>
              </div>
            ) : (
              bundles.map(bundle => (
                <div key={bundle.id} className="nm-inset border border-white/5 rounded-[2rem] p-5 flex flex-col sm:flex-row gap-5 relative overflow-hidden group">
                  <div className="flex-1 space-y-3 z-10">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-white">{bundle.title}</h3>
                      <span className="nm-inset border border-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-bold">${bundle.price}</span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 font-medium">{bundle.description}</p>
                    
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex -space-x-3">
                          {bundle.posts?.slice(0, 3).map((p: any, i: number) => {
                              // 🔥 PARSEO DE MINIATURA SEGURO PARA EL LISTADO
                              const thumb = getFirstMedia(p.mediaUrl);
                              return (
                                <div key={i} className="w-10 h-10 rounded-lg nm-inset border border-white/10 overflow-hidden" style={{ zIndex: 3 - i }}>
                                  <img src={getImageUrl(thumb)} className="w-full h-full object-cover" alt="Media" />
                                </div>
                              );
                          })}
                          {bundle.posts?.length > 3 && (
                              <div className="w-10 h-10 rounded-lg nm-inset border border-white/10 bg-black/80 flex items-center justify-center text-[10px] font-bold text-white z-0">
                                  +{bundle.posts.length - 3}
                              </div>
                          )}
                      </div>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">{bundle.posts?.length || 0} {t('lbl_files')}</p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col justify-end gap-2 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-4 z-10 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none text-center bg-white/5 rounded-xl p-2 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('lbl_sales')}</p>
                      <p className="text-lg font-black text-white">{bundle._count?.purchases || 0}</p>
                    </div>
                    <button onClick={() => handleDeleteBundle(bundle.id)} className="flex-1 sm:flex-none nm-btn border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4"/> {t('btn_delete')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>
    </AppLayout>
  );
}