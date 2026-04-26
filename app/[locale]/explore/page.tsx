"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api'; 
import { Search, Users, Compass, User, Ghost, Radio, Eye, Clock, Tv, Star, Crown, ChevronRight } from 'lucide-react';
import AppLayout from '../../../components/AppLayout';
import { useTranslations } from 'next-intl';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  return `${BACKEND_URL}${path}`; 
};

const CATEGORIES = ['All', 'Live 🔴', 'Fitness', 'Gaming', 'Música', 'Arte', 'Lifestyle', 'Educación', 'Adulto'];

export default function ExplorePage() {
  const router = useRouter();
  const t = useTranslations('Explore');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Live 🔴'); 
  const [creators, setCreators] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<any[]>([]); 
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth'); return; }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resCreators = await api.get('/discover/creators', {
          params: { search: searchQuery, category: selectedCategory === 'Live 🔴' ? 'All' : selectedCategory }
        });
        setCreators(resCreators.data.creators || []);

        if (selectedCategory === 'Live 🔴' || selectedCategory === 'All') {
           const resStreams = await api.get('/live/active');
           setActiveStreams(resStreams.data.activeStreams || []);
        }
      } catch (error) {
        console.error("Error buscando datos", error);
      } finally {
        setIsSearching(false);
        setIsLoading(false);
      }
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, router]);

  const getUptime = (startDate: string) => {
    const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 1000);
    if(diff < 60) return `${diff}s`;
    if(diff < 3600) return `${Math.floor(diff/60)}m`;
    return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}m`;
  }

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] pb-24 sm:pb-10 relative overflow-hidden">
        
        {/* LUCES DE AMBIENTE PREMIUM */}
        <div className="absolute top-[-100px] left-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        <nav className="sticky top-0 z-50 bg-black/60 border-b border-white/5 px-4 py-4 backdrop-blur-2xl">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                <Compass className="w-5 h-5 text-blue-500" /> {t('nav_title')}
              </h1>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
              <input 
                type="text" 
                placeholder={t('search_placeholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all font-medium placeholder:text-gray-600 shadow-2xl"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(category => {
                const safeCatKey = category.replace(' 🔴', '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all border ${
                      isActive 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t(`cat_${safeCatKey}`) || category}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto mt-6 px-2 sm:px-6 space-y-10 relative z-10">
          
          {/* TRANSMISIONES: SE QUEDAN EN 1 O 2 COLUMNAS PARA QUE SE VEA EL CONTENIDO */}
          {(selectedCategory === 'Live 🔴' || selectedCategory === 'All') && !searchQuery && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div> {t('streams_title')}
              </h2>

              {activeStreams.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-white/5">
                  <Tv className="w-10 h-10 text-gray-700 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{t('streams_empty_title')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeStreams.map((stream) => (
                    <div key={stream.id} onClick={() => router.push(`/live/${stream.id}`)} className="relative aspect-video rounded-[2rem] overflow-hidden cursor-pointer group border border-white/5 shadow-2xl">
                      {stream.creator?.creatorProfile?.coverImage || stream.creator?.creatorProfile?.profileImage ? (
                         <img src={getImageUrl(stream.creator?.creatorProfile?.coverImage || stream.creator?.creatorProfile?.profileImage)} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                         <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900/40 to-black"></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter flex items-center gap-1 shadow-xl">LIVE</span>
                        <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white font-bold text-[9px] flex items-center gap-1"><Eye className="w-3 h-3"/> {stream._count?.messages || 0}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-black text-sm truncate uppercase italic">{stream.title}</h3>
                        <p className="text-blue-400 text-[10px] font-bold">@{stream.creator?.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🔥 EL GRID MAESTRO: 3 COLUMNAS EN MÓVIL (grid-cols-3) */}
          <div className="space-y-6">
            <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> {searchQuery ? t('creators_search') : t('creators_recommended')}
            </h2>
            
            {creators.length === 0 && !isSearching ? (
              <div className="text-center py-20">
                <Ghost className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-600 font-bold text-xs uppercase tracking-[0.3em]">{t('creators_empty_title')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 sm:gap-4">
                {creators.map((creator) => (
                  <div 
                    key={creator.id} 
                    onClick={() => router.push(`/${creator.username}`)}
                    className="relative aspect-[3/4] sm:aspect-square group cursor-pointer overflow-hidden bg-[#111] sm:rounded-[2rem] border border-white/5 hover:border-blue-500/50 transition-all"
                  >
                    {/* 🔥 CORRECCIÓN 1: IMAGEN DE FONDO (PORTADA O AVATAR) SEGURA */}
                    {(creator.creatorProfile?.coverImage || creator.creatorProfile?.profileImage) ? (
                      <img 
                        src={getImageUrl(creator.creatorProfile?.coverImage || creator.creatorProfile?.profileImage)} 
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                        alt="Creator"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50 group-hover:opacity-100 transition-all duration-700"></div>
                    )}
                    
                    {/* OVERLAY GRADIENTE */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>

                    {/* CONTENIDO DE LA TARJETA */}
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 text-center flex flex-col items-center">
                      
                      {/* 🔥 CORRECCIÓN 2: MINI AVATAR FLOTANTE SEGURO (Solo en PC) */}
                      <div className="hidden sm:flex w-12 h-12 rounded-full border-2 border-white/20 mb-2 overflow-hidden shadow-2xl transition-transform group-hover:scale-110 bg-[#1a1a1a]">
                        {creator.creatorProfile?.profileImage ? (
                          <img src={getImageUrl(creator.creatorProfile.profileImage)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-white font-black text-lg bg-gradient-to-tr from-blue-600 to-purple-600">
                            {creator.username ? creator.username.toUpperCase().charAt(0) : 'U'}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-white font-black text-[10px] sm:text-sm truncate w-full uppercase tracking-tighter group-hover:text-blue-400 transition-colors">
                        {creator.username}
                      </h3>
                      
                      {/* PRECIO / FREE BADGE */}
                      <div className="mt-1 flex items-center justify-center">
                        {creator.creatorProfile?.monthlyPrice > 0 ? (
                          <span className="text-[8px] sm:text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shadow-lg">
                            ${creator.creatorProfile.monthlyPrice.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                            FREE
                          </span>
                        )}
                      </div>

                      {/* BADGE DE ADMIN */}
                      {creator.role === 'ADMIN' && (
                        <div className="absolute top-2 right-2">
                          <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </AppLayout>
  );
}