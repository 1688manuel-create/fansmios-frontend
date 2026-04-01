// frontend/app/dashboard/referrals/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import api from '../../../lib/api';
// 🔥 ICONOS PREMIUM
import { 
  Gift, ArrowLeft, Link as LinkIcon, Copy, Users, 
  DollarSign, CheckCircle2, TrendingUp, Network
} from 'lucide-react';

export default function ReferralsPage() {
  const router = useRouter();
  const [referralData, setReferralData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 🌉 Ahora SÍ conectamos con el Backend Real
      const res = await api.get('/referrals/stats');
      
      setReferralData({
        referralCode: storedUser.referralCode || 'Sin código',
        totalReferred: res.data.totalReferred || 0,
        totalEarned: res.data.totalEarned || 0,
        commissionRate: res.data.commissionRate || "5%",
        recentReferrals: res.data.recentReferrals || []
      });
    } catch (error) {
      console.error('Error cargando referidos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    // Genera el enlace que apunta a tu página de registro con el código
    const link = `${window.location.origin}/?ref=${referralData?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (isLoading) return <AppLayout><div className="min-h-screen bg-nm-base"></div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 relative">
        
        {/* Luz ambiental */}
        <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2"></div>

        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h1 className="text-xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
              <Gift className="w-5 h-5" />
            </div>
            Programa de Referidos
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        </nav>

        <main className="max-w-5xl mx-auto mt-8 px-4 space-y-8 relative z-10">
          
          {/* LINK DE INVITACIÓN (Hero Section) */}
          <div className="nm-inset border border-yellow-500/20 p-8 md:p-10 rounded-[2rem] text-center relative overflow-hidden bg-[#111]">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            
            <Network className="w-16 h-16 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <h2 className="text-3xl font-black text-white mb-2">Gana Dinero de por Vida</h2>
            <p className="text-gray-400 font-medium mb-8 max-w-xl mx-auto">
              Invita a otros creadores a unirse a la plataforma. Ganarás un <strong className="text-yellow-400">{referralData?.commissionRate}</strong> de TODAS sus ganancias para siempre.
            </p>

            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><LinkIcon className="w-5 h-5" /></span>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/?ref=${referralData?.referralCode}`}
                  className="w-full nm-inset bg-[#050505] rounded-xl pl-12 pr-4 py-4 text-white font-mono text-sm outline-none border border-white/5"
                />
              </div>
              <button 
                onClick={handleCopyLink}
                className="w-full sm:w-auto nm-btn-primary bg-yellow-600 hover:bg-yellow-500 text-black px-8 py-4 flex items-center justify-center gap-2 font-black transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              >
                {copied ? <><CheckCircle2 className="w-5 h-5"/> Copiado</> : <><Copy className="w-5 h-5"/> Copiar Link</>}
              </button>
            </div>
          </div>

          {/* KPIs DE RENDIMIENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center cursor-default group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full nm-inset bg-black flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-gray-500 font-black uppercase tracking-widest text-xs">Creadores Invitados</h3>
              </div>
              <p className="text-5xl font-black text-white">{referralData?.totalReferred}</p>
            </div>

            <div className="nm-btn border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center cursor-default group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full nm-inset bg-black flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-gray-500 font-black uppercase tracking-widest text-xs">Comisiones Ganadas</h3>
              </div>
              <p className="text-5xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                ${referralData?.totalEarned?.toFixed(2)}
              </p>
            </div>
          </div>

          {/* LISTA DE REFERIDOS RECIENTES */}
          <div className="nm-inset border border-white/5 p-6 sm:p-8 rounded-[2rem]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Tu Red de Afiliados
            </h3>
            
            {referralData?.recentReferrals?.length === 0 ? (
              <p className="text-gray-500 text-center py-10 font-medium">Aún no has invitado a nadie. ¡Comparte tu link!</p>
            ) : (
              <div className="space-y-3">
                {referralData?.recentReferrals.map((ref: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center nm-btn border border-white/5 p-4 rounded-2xl cursor-default hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-white font-bold shadow-inner">
                        {ref.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">@{ref.username}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Se unió: {ref.date}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${ref.status === 'Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      {ref.status}
                    </span>
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