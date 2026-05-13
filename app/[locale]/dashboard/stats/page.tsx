"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../../lib/api'; 
import AppLayout from '../../../../components/AppLayout';

// 🔥 ICONOS PREMIUM
import { 
  TrendingUp, ArrowLeft, DollarSign, Users, Star, 
  Eye, MessageCircle, ImageIcon, Heart, Crown, Award, Target, Flame, Activity
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function StatisticsDashboard() {
  const router = useRouter();
  const t = useTranslations('Statistics');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // 🔥 SEGURO ANTI-COLAPSO MÓVIL (SSR)
  
  // ESTADOS
  const [socialStats, setSocialStats] = useState({
    activeVIPs: 0, totalLikes: 0, storyViews: 0, comments: 0, posts: 0
  });

  const [financialStats, setFinancialStats] = useState({
    dailyIncome: 0, monthlyIncome: 0, conversionRate: "0%", churnRate: "N/A"
  });

  const [topFans, setTopFans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true); // Le decimos al sistema que ya estamos en el navegador (no en el servidor)
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/stats');
        setChartData(res.data.chartData || []);
        setFinancialStats(res.data.financialStats);
        setSocialStats(res.data.socialStats);
        setTopFans(res.data.topFans);
      } catch (error) {
        console.error("Error cargando el panel:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
        <Target className="w-12 h-12 text-blue-500 animate-spin drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"/>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando Bóveda...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] pb-24 sm:pb-10 relative selection:bg-blue-500/30">
        
        {/* 🔥 REDISEÑO: Iluminación de Ambiente Ultra-Suave */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-[#050505] to-transparent pointer-events-none"></div>

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-3 tracking-wide">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {t('nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-xs sm:text-sm bg-white/5 border border-white/10 text-gray-300 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-white/10 hover:text-white transition-all font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-7xl mx-auto mt-6 sm:mt-8 px-4 space-y-8 sm:space-y-12 relative z-10">
          
          {/* ==============================================
              SECCIÓN 1: FINANZAS (DISEÑO MÓVIL-FIRST) 
          ============================================== */}
          <section>
            <h2 className="text-base sm:text-lg font-black text-white mb-4 flex items-center gap-2 px-1">
              <DollarSign className="w-5 h-5 text-green-500" /> {t('sec1_title')}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              
              {/* Tarjeta Principal */}
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-green-500/10 to-black border border-green-500/30 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] relative overflow-hidden">
                <h3 className="text-green-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 sm:mb-2">{t('lbl_income_today')}</h3>
                <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  ${financialStats.dailyIncome.toFixed(2)}
                </p>
                <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-green-500/10" strokeWidth={3} />
              </div>

              {/* Tarjetas Secundarias */}
              <div className="bg-[#0a0a0a] border border-white/5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col justify-center">
                <h3 className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">{t('lbl_income_month')}</h3>
                <p className="text-xl sm:text-3xl font-black text-white">${financialStats.monthlyIncome.toFixed(2)}</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col justify-center">
                <h3 className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">{t('lbl_conversion')}</h3>
                <p className="text-xl sm:text-3xl font-black text-white">{financialStats.conversionRate}</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col justify-center">
                <h3 className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">{t('lbl_churn')}</h3>
                <p className="text-xl sm:text-3xl font-black text-white">{financialStats.churnRate}</p>
              </div>
            </div>
          </section>

          {/* ==============================================
              SECCIÓN 2: GRÁFICAS (CÁPSULA DE VACÍO ABSOLUTO) 
          ============================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* GRÁFICA INGRESOS */}
            <div className="bg-[#0a0a0a] p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 flex flex-col">
              <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> {t('chart_income')}
              </h3>
              
              {/* 🔥 EL BLINDAJE: Contenedor rídigo con posicionamiento absoluto */}
              <div className="relative w-full h-[250px] sm:h-[300px] block">
                {isMounted && chartData.length > 0 ? (
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis dataKey="name" stroke="#555" tick={{fill: '#777', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#555" tick={{fill: '#777', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: '#3b82f6' }} />
                        <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    {isMounted ? 'Sin datos recientes' : 'Dibujando gráficas...'}
                  </div>
                )}
              </div>
            </div>

            {/* GRÁFICA SUSCRIPTORES */}
            <div className="bg-[#0a0a0a] p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 flex flex-col">
              <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" /> {t('chart_subs')}
              </h3>
              
              {/* 🔥 EL BLINDAJE: Contenedor rídigo con posicionamiento absoluto */}
              <div className="relative w-full h-[250px] sm:h-[300px] block">
                {isMounted && chartData.length > 0 ? (
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis dataKey="name" stroke="#555" tick={{fill: '#777', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#555" tick={{fill: '#777', fontSize: 10}} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: '#a855f7' }} />
                        <Bar dataKey="suscriptores" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    {isMounted ? 'Sin datos recientes' : 'Dibujando gráficas...'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ==============================================
              SECCIÓN 3: IMPACTO SOCIAL Y BALLENAS
          ============================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* KPI Sociales */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem]">
              <h2 className="text-base sm:text-lg font-black text-white mb-4 sm:mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" /> {t('sec2_title')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                
                <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mb-2" />
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_active_vips')}</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white">{socialStats.activeVIPs}</h4>
                </div>
                
                <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mb-2" />
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_likes')}</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white">{socialStats.totalLikes}</h4>
                </div>
                
                <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mb-2" />
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_story_views')}</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white">{socialStats.storyViews}</h4>
                </div>
                
                <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mb-2" />
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_comments')}</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white">{socialStats.comments}</h4>
                </div>
                
                <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 mb-2" />
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_posts')}</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white">{socialStats.posts}</h4>
                </div>
                
              </div>
            </div>

            {/* TOP FANS */}
            <div className="bg-[#0a0a0a] border border-yellow-500/20 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] relative overflow-hidden flex flex-col">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none"></div>
              
              <h2 className="text-[10px] sm:text-[11px] font-black text-yellow-500 uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4" /> {t('top_fans_title')}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-gray-500 mb-4 sm:mb-6 font-medium">{t('top_fans_desc')}</p>
              
              <div className="flex-1 overflow-y-auto">
                {topFans.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('no_records')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative z-10">
                    {topFans.map((fan, index) => (
                      <div key={fan.id} className="flex items-center justify-between bg-[#111] p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`font-black text-sm sm:text-base ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-orange-400'}`}>
                            #{index + 1}
                          </span>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black flex items-center justify-center font-black border ${index === 0 ? 'border-yellow-500/30 text-yellow-400' : 'border-white/5 text-white'}`}>
                            {fan.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[80px] sm:max-w-[120px]">@{fan.username}</h4>
                          </div>
                        </div>
                        <span className="font-black text-green-400 text-xs sm:text-sm bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                          ${fan.spent.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>
      </div>
    </AppLayout>
  );
}