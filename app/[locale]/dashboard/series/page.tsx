// frontend/app/dashboard/series/page.tsx
"use client";

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { PlaySquare, Plus, Upload, Save, Video, ChevronDown } from 'lucide-react';

export default function CreatorSeries() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  
  // Estados para crear Serie
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para agregar Episodio (Video)
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingEp, setIsUploadingEp] = useState(false);

  useEffect(() => {
    fetchMySeries();
  }, []);

  const fetchMySeries = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!storedUser.username) return;
      const res = await api.get(`/series/creator/${storedUser.username}`);
      setSeriesList(res.data.series || []);
    } catch (error) {
      console.error("Error cargando series:", error);
    }
  };

  // 1. FUNCION PARA CREAR LA SERIE (CARPETA)
  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("El título y el precio son obligatorios.");

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    if (thumbnail) formData.append('thumbnail', thumbnail);

    try {
      await api.post('/series', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('✅ ¡Serie creada con éxito!');
      setTitle(''); setDescription(''); setPrice(''); setThumbnail(null);
      fetchMySeries(); // Recargamos la lista
    } catch (error) {
      alert('🚨 Error al crear la serie.');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. FUNCION PARA SUBIR EL VIDEO A LA SERIE
  const handleAddEpisode = async (e: React.FormEvent, seriesId: string) => {
    e.preventDefault();
    if (!epTitle || !videoFile) return alert("El título y el archivo de video son obligatorios.");

    setIsUploadingEp(true);
    const formData = new FormData();
    formData.append('title', epTitle);
    formData.append('description', epDesc);
    formData.append('video', videoFile);
    // Calculamos el orden automáticamente
    const currentSeries = seriesList.find(s => s.id === seriesId);
    formData.append('order', String((currentSeries?.episodes?.length || 0) + 1));

    try {
      await api.post(`/series/${seriesId}/episodes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('🎬 ¡Video subido e inyectado a la serie con éxito!');
      setEpTitle(''); setEpDesc(''); setVideoFile(null); setActiveSeriesId(null);
      fetchMySeries(); // Recargamos para ver el nuevo video
    } catch (error) {
      alert('🚨 Error al subir el video. Asegúrate de que no sea muy pesado.');
    } finally {
      setIsUploadingEp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 pb-20">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* ENCABEZADO */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <PlaySquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Academia VIP</h1>
            <p className="text-gray-400 text-sm">Crea cursos y sube videos exclusivos de alto valor.</p>
          </div>
        </div>

        {/* FORMULARIO: CREAR NUEVA SERIE */}
        <form onSubmit={handleCreateSeries} className="glass-panel p-8 rounded-[2rem] border border-white/10 bg-[#0a0a0a]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" /> Crear Nueva Serie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none" placeholder="Ej: Curso de Trading 2026" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Precio Total (USD)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none" placeholder="49.99" />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Portada (Thumbnail)</label>
            <label className="w-full bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3 cursor-pointer">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 text-sm truncate">{thumbnail ? thumbnail.name : "Subir imagen..."}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
            </label>
          </div>
          <button type="submit" disabled={isUploading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {isUploading ? "Construyendo Serie..." : <><Save className="w-5 h-5" /> Crear Serie Vacía</>}
          </button>
        </form>

        {/* LISTADO DE SERIES Y CARGA DE VIDEOS */}
        <div>
          <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Tus Series Activas</h2>
          {seriesList.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Aún no tienes cursos creados.</p>
          ) : (
            <div className="space-y-6">
              {seriesList.map((series) => (
                <div key={series.id} className="glass-panel border border-white/10 rounded-3xl overflow-hidden bg-black/40 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{series.title} <span className="text-green-400 text-sm ml-2">${series.price}</span></h3>
                      <p className="text-sm text-gray-400">{series.episodes?.length || 0} videos subidos</p>
                    </div>
                    <button 
                      onClick={() => setActiveSeriesId(activeSeriesId === series.id ? null : series.id)}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                    >
                      <Video className="w-4 h-4" /> Agregar Video <ChevronDown className={`w-4 h-4 transition-transform ${activeSeriesId === series.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* FORMULARIO DESPLEGABLE PARA SUBIR VIDEO A ESTA SERIE */}
                  {activeSeriesId === series.id && (
                    <form onSubmit={(e) => handleAddEpisode(e, series.id)} className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-2xl mt-4">
                      <h4 className="text-purple-400 font-bold mb-4 text-sm uppercase tracking-wider">Subir nuevo video a este curso</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} placeholder="Título del Video (Ej: Clase 1)" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none" />
                        <label className="w-full bg-black/50 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-sm truncate">{videoFile ? videoFile.name : "Seleccionar Archivo MP4..."}</span>
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <button type="submit" disabled={isUploadingEp} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                        {isUploadingEp ? "Subiendo video (No cierres la pestaña)..." : "Subir y Guardar Video"}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}