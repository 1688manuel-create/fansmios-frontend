"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../../lib/api'; 
import AppLayout from '../../../../components/AppLayout';

// 🔥 ICONOS PREMIUM
import { 
  TrendingUp, ArrowLeft, DollarSign, Users, Star, 
  Eye, MessageCircle, ImageIcon, Heart, Crown, Award, Target, Flame
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function StatisticsDashboard() {
  const router = useRouter();
  const t = useTranslations('Statistics'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [isLoading, setIsLoading] = useState(true);
  
  // ESTADOS REALES
  const [socialStats, setSocialStats] = useState({
    activeVIPs: 0,
    totalLikes: 0,
    storyViews: 0,
    comments: 0,
    posts: 0
  });

  const [financialStats, setFinancialStats] = useState({
    dailyIncome: 0,
    monthlyIncome: 0,
    conversionRate: "0%",
    churnRate: "N/A"
  });

  const [topFans, setTopFans] = useState<any[]>([]);

  // Gráfica (Conectada al backend)
  const [chartData, setChartData] = useState<any[]>([]);

  // 🧹 FIX: useEffect limpio y sin repeticiones
  useEffect(() => {
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

  if (isLoading) return <AppLayout><div className="min-h-screen bg-nm-base flex items-center justify-center"><Target className="w-12 h-12 text-blue-500 animate-spin drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        {/* Iluminación de Ambiente */}
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>

        {/* ================= NAVBAR SUPERIOR ================= */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-wide">
            <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            {t('nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-6xl mx-auto mt-8 px-4 space-y-10 relative z-10">
          
          {/* ================= SECCIÓN 1: RESUMEN FINANCIERO ================= */}
          <div>
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" /> {t('sec1_title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Ingresos Hoy (Destacado) */}
              <div className="nm-inset p-6 rounded-[2rem] border border-green-500/30 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-green-500/10 group-hover:scale-110 transition-transform duration-500">
                  <DollarSign className="w-32 h-32" strokeWidth={2} />
                </div>
                <h3 className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">
                  {t('lbl_income_today')}
                </h3>
                <p className="text-4xl font-black text-white relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  ${financialStats.dailyIncome.toFixed(2)}
                </p>
              </div>

              {/* Ingresos Mes */}
              <div className="nm-btn border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group cursor-default">
                <div className="absolute -right-4 -top-4 text-blue-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Target className="w-32 h-32" strokeWidth={1} />
                </div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">
                  {t('lbl_income_month')}
                </h3>
                <p className="text-4xl font-black text-white relative z-10">
                  ${financialStats.monthlyIncome.toFixed(2)}
                </p>
              </div>

              {/* Conversión */}
              <div className="nm-btn border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group cursor-default">
                <div className="absolute -right-4 -top-4 text-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Flame className="w-32 h-32" strokeWidth={1} />
                </div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">
                  {t('lbl_conversion')}
                </h3>
                <p className="text-4xl font-black text-white relative z-10">
                  {financialStats.conversionRate}
                </p>
              </div>

              {/* Churn Rate */}
              <div className="nm-btn border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group cursor-default">
                <div className="absolute -right-4 -top-4 text-red-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Users className="w-32 h-32" strokeWidth={1} />
                </div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">
                  {t('lbl_churn')}
                </h3>
                <p className="text-4xl font-black text-white relative z-10">
                  {financialStats.churnRate}
                </p>
              </div>

            </div>
          </div>

          {/* ================= SECCIÓN 2: GRÁFICAS (RECHARTS) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gráfica Ingresos */}
            <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> {t('chart_income')}
              </h3>
              {/* 🔥 EL BISTURÍ DEFINITIVO: Contenedor estricto y el hack del 99% en el ancho */}
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica Suscriptores */}
            <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" /> {t('chart_subs')}
              </h3>
              {/* 🔥 EL BISTURÍ DEFINITIVO: Contenedor estricto y el hack del 99% en el ancho */}
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: '#111' }} 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#a855f7' }}
                    />
                    <Bar dataKey="suscriptores" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ================= SECCIÓN 3: IMPACTO SOCIAL Y TOP FANS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Impacto Social */}
            <div className="lg:col-span-2 nm-btn border border-white/5 p-6 sm:p-8 rounded-[2rem] cursor-default">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" /> {t('sec2_title')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <div className="nm-inset p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group">
                  <Star className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_active_vips')}</p>
                  <h4 className="text-2xl font-black text-white">{socialStats.activeVIPs}</h4>
                </div>
                
                <div className="nm-inset p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group">
                  <Heart className="w-6 h-6 text-red-500 mb-2 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_likes')}</p>
                  <h4 className="text-2xl font-black text-white">{socialStats.totalLikes}</h4>
                </div>
                
                <div className="nm-inset p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group">
                  <Eye className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_story_views')}</p>
                  <h4 className="text-2xl font-black text-white">{socialStats.storyViews}</h4>
                </div>
                
                <div className="nm-inset p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group">
                  <MessageCircle className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_comments')}</p>
                  <h4 className="text-2xl font-black text-white">{socialStats.comments}</h4>
                </div>
                
                <div className="nm-inset p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group">
                  <ImageIcon className="w-6 h-6 text-teal-400 mb-2 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('kpi_posts')}</p>
                  <h4 className="text-2xl font-black text-white">{socialStats.posts}</h4>
                </div>
                
              </div>
            </div>

            {/* TOP FANS (BALLENAS) */}
            <div className="nm-inset border border-yellow-500/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden bg-[#110505]">
              {/* Destello Dorado */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 blur-[50px] rounded-full"></div>
              
              <h2 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4" /> {t('top_fans_title')}
              </h2>
              <p className="text-[10px] text-gray-400 mb-6 font-medium">{t('top_fans_desc')}</p>
              
              {topFans.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <Award className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('no_records')}</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {topFans.map((fan, index) => (
                    <div key={fan.id} className="flex items-center justify-between bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-lg ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : index === 1 ? 'text-gray-300' : 'text-orange-400'}`}>
                          #{index + 1}
                        </span>
                        <div className={`w-10 h-10 rounded-xl nm-inset bg-black flex items-center justify-center font-black border ${index === 0 ? 'border-yellow-500/50 text-yellow-400' : 'border-white/5 text-white'}`}>
                          {fan.avatar}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">@{fan.username}</h4>
                        </div>
                      </div>
                      <span className="font-black text-green-400 text-sm bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                        ${fan.spent.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </AppLayout>
  );
}