// frontend/app/explore/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api'; 
import { Search, Users, Compass, User, Ghost, Radio, Eye, Clock, Tv, Star, Crown } from 'lucide-react';
import AppLayout from '../../components/AppLayout';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; 
  return `${BACKEND_URL}${path}`; 
};

const CATEGORIES = ['All', 'Live 🔴', 'Fitness', 'Gaming', 'Música', 'Arte', 'Lifestyle', 'Educación', 'Adulto'];

export default function ExplorePage() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Live 🔴'); 
  const [creators, setCreators] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<any[]>([]); 
  
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

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
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        <div className="absolute top-0 left-1/2 w-[800px] h-[300px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-4 sm:px-6 py-4 flex flex-col gap-4 backdrop-blur-xl shadow-md">
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 nm-inset bg-black rounded-lg flex items-center justify-center border border-white/5">
                <Compass className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
              </div>
              Descubrir
            </h1>
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input 
              type="text" 
              placeholder="Busca creadores, categorías o eventos en vivo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white outline-none focus:border-blue-500/50 transition-colors shadow-inner font-medium placeholder:text-gray-600"
            />
            {isSearching && (
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-pulse text-[10px] font-black uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">
                 Buscando
               </span>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar max-w-4xl mx-auto w-full px-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  selectedCategory === category 
                    ? category === 'Live 🔴' 
                      ? 'nm-btn border border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                      : 'nm-btn-active bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'nm-btn text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {category === 'Live 🔴' ? <Radio className="w-4 h-4 animate-pulse"/> : category === 'All' ? <Star className="w-4 h-4"/> : null}
                {category === 'All' ? 'Trending' : category === 'Live 🔴' ? 'En Vivo Ahora' : category}
              </button>
            ))}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto mt-8 px-4 space-y-12 relative z-10">
          
          {(selectedCategory === 'Live 🔴' || selectedCategory === 'All') && !searchQuery && (
            <div className="space-y-6 animate-fade-in border-b border-white/5 pb-10">
              <div className="flex justify-between items-end px-2">
                <div>
                  <h2 className="text-white font-black text-xl flex items-center gap-2 tracking-tight">
                    <Radio className="w-5 h-5 text-red-500" /> Transmisiones Destacadas
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Únete a la conversación en tiempo real</p>
                </div>
              </div>

              {activeStreams.length === 0 ? (
                <div className="text-center py-16 nm-inset rounded-[2rem] border border-white/5">
                  <Tv className="w-12 h-12 text-gray-700 mx-auto mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-black text-gray-400">Todo está muy tranquilo...</h3>
                  <p className="text-gray-600 mt-1 font-medium text-sm">No hay creadores transmitiendo en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeStreams.map((stream) => (
                    <div 
                      key={stream.id}
                      onClick={() => router.push(`/live/${stream.id}`)}
                      className="nm-btn border border-white/5 rounded-[2rem] overflow-hidden cursor-pointer group hover:border-red-500/30 transition-all shadow-xl"
                    >
                      <div className="relative h-48 w-full bg-[#050505] overflow-hidden">
                        <div className="absolute inset-0 bg-black z-0">
                          {stream.creator?.creatorProfile?.coverImage || stream.creator?.creatorProfile?.profileImage ? (
                            <img 
                              src={getImageUrl(stream.creator.creatorProfile.coverImage || stream.creator.creatorProfile.profileImage)} 
                              alt="Stream Thumbnail" 
                              className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-900/40 to-black"></div>
                          )}
                        </div>
                        
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                          <div className="bg-red-600 text-white px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> EN VIVO
                          </div>
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-md font-bold text-[10px] flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-gray-300"/> {stream._count?.messages || 12}
                          </div>
                        </div>

                        <div className="absolute bottom-3 right-3 z-10">
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-md font-bold text-[10px] font-mono">
                            {getUptime(stream.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex gap-4">
                        <div className="w-12 h-12 rounded-xl nm-inset bg-black flex items-center justify-center overflow-hidden shrink-0 border border-white/10 relative">
                           {stream.creator?.creatorProfile?.profileImage ? (
                             <img src={getImageUrl(stream.creator.creatorProfile.profileImage)} alt="Avatar" className="w-full h-full object-cover object-center" />
                           ) : (
                             <span className="text-white font-black text-lg">{stream.creator?.username?.[0].toUpperCase()}</span>
                           )}
                           <div className="absolute inset-0 border-2 border-red-500 rounded-xl rounded-bl-none"></div>
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-white font-bold text-sm truncate group-hover:text-red-400 transition-colors leading-tight">
                            {stream.title}
                          </h3>
                          <p className="text-gray-400 text-xs font-medium mt-1 truncate">@{stream.creator?.username}</p>
                          <div className="flex gap-2 mt-2">
                            {stream.isPPV && <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest border border-purple-500/30">Acceso PPV</span>}
                            {stream.creator?.creatorProfile?.category && <span className="text-[9px] font-bold text-gray-500 px-2 py-0.5 rounded border border-white/10 bg-white/5 truncate">{stream.creator.creatorProfile.category}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-6 animate-fade-in">
            <h2 className="text-gray-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 pl-2">
              <Users className="w-4 h-4" />
              {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory !== 'All' && selectedCategory !== 'Live 🔴' ? `Creadores en ${selectedCategory}` : 'Creadores Recomendados'}
            </h2>
            
            {creators.length === 0 && !isSearching ? (
              <div className="text-center py-20 nm-inset rounded-[2rem] border border-white/5 max-w-2xl mx-auto">
                <Ghost className="w-16 h-16 text-gray-700 mx-auto mb-4" strokeWidth={1} />
                <h3 className="text-xl font-bold text-gray-400">El radar está vacío</h3>
                <p className="text-gray-600 mt-2 font-medium">Intenta con otros filtros de búsqueda o nombres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <div 
                    key={creator.id} 
                    onClick={() => router.push(`/${creator.username}`)}
                    className="nm-btn flex flex-col overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group rounded-[2rem]"
                  >
                    <div className="h-28 w-full bg-[#050505] relative overflow-hidden">
                      {creator.creatorProfile?.coverImage ? (
                        <img src={getImageUrl(creator.creatorProfile.coverImage)} alt="Cover" className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black group-hover:opacity-80 transition-opacity"></div>
                      )}
                    </div>

                    <div className="p-5 relative flex-1 flex flex-col pt-12">
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-[#0a0a0a] bg-black overflow-hidden shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        {creator.creatorProfile?.profileImage ? (
                          <img src={getImageUrl(creator.creatorProfile.profileImage)} alt="Avatar" className="w-full h-full object-cover object-center" />
                        ) : (
                          <span className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-white font-black text-2xl">
                            {creator.username ? creator.username[0].toUpperCase() : 'U'}
                          </span>
                        )}
                        {creator.role === 'ADMIN' && <div className="absolute bottom-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center"><Crown className="w-3 h-3 text-white"/></div>}
                      </div>

                      <div className="text-center flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate">
                          {creator.name || creator.username}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">@{creator.username}</p>
                        
                        <p className="text-[11px] text-gray-400 mt-3 line-clamp-2 leading-relaxed font-medium">
                          {creator.creatorProfile?.bio || "Descubre el contenido exclusivo de este creador."}
                        </p>

                        <div className="mt-auto pt-5">
                          <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-2 px-4">
                            <span className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-widest">
                              <Users className="w-3.5 h-3.5 text-blue-500" /> {creator._count?.followers || 0}
                            </span>
                            <span className="text-[10px] font-black text-white bg-blue-600/20 px-2 py-1 rounded-md uppercase tracking-wider text-blue-400 border border-blue-500/20">
                              {creator.creatorProfile?.monthlyPrice > 0 ? `$${creator.creatorProfile.monthlyPrice.toFixed(0)}/m` : 'Gratis'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}