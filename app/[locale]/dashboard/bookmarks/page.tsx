// frontend/app/dashboard/bookmarks/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  return `${BACKEND_URL}${path}`; 
};

export default function BookmarksPage() {
  const router = useRouter();
  const t = useTranslations('BookmarksPage'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data.bookmarks || []);
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      await api.post(`/bookmarks/${postId}/toggle`);
      // Quitamos el post de la pantalla inmediatamente para que se sienta rápido
      setBookmarks(prev => prev.filter(b => b.postId !== postId));
    } catch (error) {
      alert(t('alert_error_remove'));
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-[#0a0a0a] sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-xl font-bold flex items-center gap-2">🔖 {t('nav_title')}</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-white/10 text-white px-5 py-2 rounded-full hover:bg-white/20 transition-colors font-bold">{t('btn_back')}</button>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-lg">
            <span className="text-6xl mb-4 block">🗂️</span>
            <h3 className="text-xl font-bold text-gray-300">{t('empty_vault_title')}</h3>
            <p className="text-gray-500 mt-2">{t('empty_vault_desc')}</p>
            <button onClick={() => router.push('/explore')} className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full font-bold transition-all">{t('btn_explore')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {bookmarks.map((bookmark) => {
              const post = bookmark.post;
              if (!post) return null;

              return (
                <div key={bookmark.id} className="bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/10 shadow-lg group">
                  {/* Creador Info */}
                  <div className="p-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/${post.user?.username}`)}>
                      <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-white/10">
                        {post.user?.creatorProfile?.profileImage ? (
                          <img src={getImageUrl(post.user.creatorProfile.profileImage)} alt="avatar" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold">{post.user?.username?.[0].toUpperCase()}</div>
                        )}
                      </div>
                      <span className="font-bold text-sm hover:text-blue-400 transition-colors">@{post.user?.username}</span>
                    </div>
                    <button onClick={() => handleRemoveBookmark(post.id)} className="text-xs text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-full transition-all">{t('btn_remove')}</button>
                  </div>

                  {/* 🔥 CONTENIDO DEL POST (CON ESCUDO DE SEGURIDAD) */}
                  <div className="p-4 bg-[#111] cursor-pointer" onClick={() => router.push(`/${post.user?.username}#${post.id}`)}>
                    
                    {!post.hasAccess ? (
                      /* 🔒 VISTA BLOQUEADA (Si no ha pagado) */
                      <div className="w-full h-48 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group bg-black border border-white/5">
                        {post.mediaUrl ? (
                          <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" style={{ backgroundImage: `url(${getImageUrl(post.mediaUrl)})` }}></div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-[#0a0a0a] blur-xl"></div>
                        )}
                        <div className="relative z-10 flex flex-col items-center space-y-2 bg-black/80 px-6 py-4 rounded-3xl border border-white/10 backdrop-blur-md">
                          <span className="text-3xl drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">🔒</span>
                          <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">{t('locked_status')}</span>
                        </div>
                        <p className="absolute bottom-3 text-[10px] text-gray-500 z-10 font-bold">{t('click_to_unlock')}</p>
                      </div>
                    ) : (
                      /* 🔓 VISTA DESBLOQUEADA (Si ya pagó o es gratis) */
                      <>
                        {post.content && <p className="text-sm text-gray-300 mb-3 line-clamp-3">{post.content}</p>}
                        {post.mediaUrl && (
                          <div className="w-full h-48 rounded-xl overflow-hidden bg-black relative border border-white/5">
                            {post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.mov') ? (
                              <video src={getImageUrl(post.mediaUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                            ) : (
                              <img src={getImageUrl(post.mediaUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                            )}
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
