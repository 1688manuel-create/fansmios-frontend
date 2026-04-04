// frontend/app/dashboard/series/page.tsx
"use client";

import { useState } from 'react';
import api from '../../../lib/api';
import { PlaySquare, Plus, Upload, Save } from 'lucide-react';

export default function CreatorSeries() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      await api.post('/series', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ ¡Serie creada con éxito! Ahora puedes agregarle episodios.');
      // Limpiar formulario
      setTitle(''); setDescription(''); setPrice(''); setThumbnail(null);
    } catch (error) {
      alert('🚨 Error al crear la serie.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <PlaySquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Mis Series & Cursos</h1>
            <p className="text-gray-400 text-sm">Crea contenido High-Ticket y véndelo como un paquete.</p>
          </div>
        </div>

        <form onSubmit={handleCreateSeries} className="glass-panel p-8 rounded-[2rem] border border-white/10 bg-[#0a0a0a]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" /> Crear Nueva Serie
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título de la Serie</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all"
                placeholder="Ej: Curso de Trading 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full h-24 bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-all resize-none"
                placeholder="¿Qué aprenderán tus fans en esta serie?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Precio Total (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white focus:border-purple-500 outline-none transition-all"
                    placeholder="49.99"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portada (Thumbnail)</label>
                <label className="w-full bg-[#111] border border-white/10 hover:border-purple-500/50 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 text-sm truncate">
                    {thumbnail ? thumbnail.name : "Subir imagen..."}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isUploading}
            className="mt-8 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            {isUploading ? "Construyendo Serie..." : <><Save className="w-5 h-5" /> Publicar Serie</>}
          </button>
        </form>

      </div>
    </div>
  );
}