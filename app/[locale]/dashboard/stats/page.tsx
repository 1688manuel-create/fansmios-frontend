"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import AppLayout from "../../../../components/AppLayout";
import {
  TrendingUp,
  ArrowLeft,
  DollarSign,
  Users,
  Star,
  Eye,
  MessageCircle,
  ImageIcon,
  Heart,
  Crown,
  Award,
  Activity,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

// --- INTERFACES ---
interface SocialStats {
  activeVIPs: number; totalLikes: number; storyViews: number; comments: number; posts: number;
}
interface FinancialStats {
  dailyIncome: number; monthlyIncome: number; conversionRate: string; churnRate: string;
}
interface Fan {
  id: string | number; username: string; avatar: string; spent: number;
}
interface ChartItem {
  name: string; ingresos: number; suscriptores: number;
}

export default function StatisticsDashboard() {
  const router = useRouter();
  const t = useTranslations("Statistics");
  const [loading, setLoading] = useState(true);

  const [socialStats, setSocialStats] = useState<SocialStats>({
    activeVIPs: 0, totalLikes: 0, storyViews: 0, comments: 0, posts: 0,
  });
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    dailyIncome: 0, monthlyIncome: 0, conversionRate: "0%", churnRate: "0%",
  });
  const [topFans, setTopFans] = useState<Fan[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/stats");
        setChartData(Array.isArray(res.data?.chartData) ? res.data.chartData : []);
        setFinancialStats({
          dailyIncome: Number(res.data?.financialStats?.dailyIncome || 0),
          monthlyIncome: Number(res.data?.financialStats?.monthlyIncome || 0),
          conversionRate: res.data?.financialStats?.conversionRate || "0%",
          churnRate: res.data?.financialStats?.churnRate || "0%",
        });
        setSocialStats({
          activeVIPs: Number(res.data?.socialStats?.activeVIPs || 0),
          totalLikes: Number(res.data?.socialStats?.totalLikes || 0),
          storyViews: Number(res.data?.socialStats?.storyViews || 0),
          comments: Number(res.data?.socialStats?.comments || 0),
          posts: Number(res.data?.socialStats?.posts || 0),
        });
        setTopFans(Array.isArray(res.data?.topFans) ? res.data.topFans : []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Sincronizando Bóveda...</p>
        </div>
      </AppLayout>
    );
  }

  // --- CÁLCULOS DE GRÁFICA NATIVA ---
  const maxIngresos = chartData.length > 0 ? Math.max(...chartData.map(d => d.ingresos)) : 1;
  const maxSuscriptores = chartData.length > 0 ? Math.max(...chartData.map(d => d.suscriptores)) : 1;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] text-white pb-28 relative overflow-x-hidden">

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#050505]/90 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-lg font-black tracking-tight">{t("nav_title")}</h1>
            </div>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t("btn_back")}</span>
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 mt-8 space-y-10 relative z-10">
          
          {/* SECCIÓN 1: FINANZAS */}
          <section>
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h2 className="text-sm font-black uppercase tracking-widest">{t("sec1_title")}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-green-500/10 to-[#0a0a0a] border border-green-500/20 rounded-3xl p-6 relative overflow-hidden">
                <p className="text-[10px] uppercase font-black text-green-400 mb-1">{t("lbl_income_today")}</p>
                <h3 className="text-4xl font-black">${financialStats.dailyIncome.toFixed(2)}</h3>
              </div>
              <StatCard title={t("lbl_income_month")} value={`$${financialStats.monthlyIncome.toFixed(2)}`} />
              <StatCard title={t("lbl_conversion")} value={financialStats.conversionRate} />
              <StatCard title={t("lbl_churn")} value={financialStats.churnRate} />
            </div>
          </section>

          {/* SECCIÓN 2: GRÁFICAS NATIVAS (CERO COLAPSOS) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRÁFICA DE INGRESOS */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="text-xs uppercase font-black text-gray-400 tracking-widest">{t("chart_income")}</h3>
              </div>
              <div className="w-full h-[220px] overflow-x-auto pb-2 flex items-end justify-between gap-2 px-2 scrollbar-hide">
                {chartData.length > 0 ? chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center justify-end h-full min-w-[45px] flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 bg-white text-black text-[9px] font-black py-1 px-2 rounded mb-2 transition-opacity">${data.ingresos}</div>
                    <div className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 rounded-t-md border-t-2 border-blue-500 transition-all duration-500" style={{ height: `${(data.ingresos / maxIngresos) * 100}%`, minHeight: '4px' }}></div>
                    <span className="text-[9px] text-gray-500 font-bold mt-3 text-center">{data.name}</span>
                  </div>
                )) : <EmptyChart />}
              </div>
            </div>

            {/* GRÁFICA DE SUSCRIPTORES */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-8">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className="text-xs uppercase font-black text-gray-400 tracking-widest">{t("chart_subs")}</h3>
              </div>
              <div className="w-full h-[220px] overflow-x-auto pb-2 flex items-end justify-between gap-2 px-2 scrollbar-hide">
                {chartData.length > 0 ? chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center justify-end h-full min-w-[45px] flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 bg-white text-black text-[9px] font-black py-1 px-2 rounded mb-2 transition-opacity">{data.suscriptores}</div>
                    <div className="w-full bg-purple-500/20 group-hover:bg-purple-500/40 rounded-t-md border-t-2 border-purple-500 transition-all duration-500" style={{ height: `${(data.suscriptores / maxSuscriptores) * 100}%`, minHeight: '4px' }}></div>
                    <span className="text-[9px] text-gray-500 font-bold mt-3 text-center">{data.name}</span>
                  </div>
                )) : <EmptyChart />}
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: IMPACTO SOCIAL Y BALLENAS */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 sm:p-8">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" /> {t("sec2_title")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SocialCard icon={<Star className="w-5 h-5 text-yellow-400" />} title={t("kpi_active_vips")} value={socialStats.activeVIPs} />
                <SocialCard icon={<Heart className="w-5 h-5 text-red-500" />} title={t("kpi_likes")} value={socialStats.totalLikes} />
                <SocialCard icon={<Eye className="w-5 h-5 text-blue-400" />} title={t("kpi_story_views")} value={socialStats.storyViews} />
                <SocialCard icon={<MessageCircle className="w-5 h-5 text-purple-400" />} title={t("kpi_comments")} value={socialStats.comments} />
                <SocialCard icon={<ImageIcon className="w-5 h-5 text-teal-400" />} title={t("kpi_posts")} value={socialStats.posts} className="col-span-2 sm:col-span-1" />
              </div>
            </div>

            <div className="bg-[#0b0b0b] border border-yellow-500/20 rounded-3xl p-6 sm:p-8">
              <h2 className="text-xs uppercase font-black text-yellow-500 tracking-widest mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4" /> {t("top_fans_title")}
              </h2>
              <p className="text-[10px] text-gray-500 mb-6">{t("top_fans_desc")}</p>
              <div className="space-y-3">
                {topFans.length > 0 ? topFans.map((fan, index) => (
                  <div key={fan.id} className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-600">#{index + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-lg">{fan.avatar}</div>
                      <span className="text-xs font-bold truncate max-w-[80px]">@{fan.username}</span>
                    </div>
                    <span className="text-xs font-black text-green-400">${fan.spent.toFixed(2)}</span>
                  </div>
                )) : <div className="text-center py-6 opacity-30 text-[10px] font-bold uppercase">{t("no_records")}</div>}
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppLayout>
  );
}

// --- COMPONENTES AUXILIARES ---
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#0b0b0b] border border-white/5 rounded-3xl p-5 flex flex-col justify-center">
      <p className="text-[10px] uppercase font-black text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black">{value}</h3>
    </div>
  );
}

function SocialCard({ icon, title, value, className = "" }: { icon: React.ReactNode; title: string; value: number; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-[9px] uppercase font-black text-gray-500 mb-1">{title}</p>
      <h4 className="text-xl font-black">{value}</h4>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="w-full h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl">
      <p className="text-[10px] uppercase font-bold text-gray-600">Sin datos aún</p>
    </div>
  );
}