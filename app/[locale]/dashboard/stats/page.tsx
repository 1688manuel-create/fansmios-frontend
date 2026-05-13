"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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
  activeVIPs: number;
  totalLikes: number;
  storyViews: number;
  comments: number;
  posts: number;
}

interface FinancialStats {
  dailyIncome: number;
  monthlyIncome: number;
  conversionRate: string;
  churnRate: string;
}

interface Fan {
  id: string | number;
  username: string;
  avatar: string;
  spent: number;
}

interface ChartItem {
  name: string;
  ingresos: number;
  suscriptores: number;
}

export default function StatisticsDashboard() {
  const router = useRouter();
  const t = useTranslations("Statistics");

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [socialStats, setSocialStats] = useState<SocialStats>({
    activeVIPs: 0,
    totalLikes: 0,
    storyViews: 0,
    comments: 0,
    posts: 0,
  });

  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    dailyIncome: 0,
    monthlyIncome: 0,
    conversionRate: "0%",
    churnRate: "0%",
  });

  const [topFans, setTopFans] = useState<Fan[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);

  useEffect(() => {
    setMounted(true);
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
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Sincronizando FansMios...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#050505] text-white pb-28 relative overflow-x-hidden">

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050505]/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-black tracking-tight">{t("nav_title")}</h1>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> <span>{t("btn_back")}</span>
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 mt-8 space-y-12 relative z-10">
          
          {/* SECCIÓN FINANCIERA: Grid adaptable */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 opacity-70">
              <DollarSign className="w-4 h-4 text-green-500" />
              <h2 className="text-xs font-black uppercase tracking-widest">{t("sec1_title")}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-green-500/10 to-black border border-green-500/20 rounded-3xl p-6">
                <p className="text-[10px] uppercase font-black text-green-400 mb-1">{t("lbl_income_today")}</p>
                <h3 className="text-4xl font-black">${financialStats.dailyIncome.toFixed(2)}</h3>
              </div>
              <StatCard title={t("lbl_income_month")} value={`$${financialStats.monthlyIncome.toFixed(2)}`} />
              <StatCard title={t("lbl_conversion")} value={financialStats.conversionRate} />
              <StatCard title={t("lbl_churn")} value={financialStats.churnRate} />
            </div>
          </section>

          {/* SECCIÓN GRÁFICAS: BLINDADAS CON TAMAÑO FIJO PUR0 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRÁFICA DE INGRESOS */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-[2.5rem] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{t("chart_income")}</h3>
              </div>
              
              {/* 🔥 MURO INQUEBRANTABLE: Scroll horizontal nativo, gráfica 100% fija de 600x300 */}
              <div className="w-full overflow-x-auto overflow-y-hidden pb-4 touch-pan-x">
                <div style={{ width: '600px', height: '300px' }}>
                  {mounted && chartData.length > 0 ? (
                    /* ❌ SIN ResponsiveContainer */
                    <LineChart width={600} height={300} data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="name" stroke="#444" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#444" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #222", borderRadius: "12px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : <EmptyChart />}
                </div>
              </div>
            </div>

            {/* GRÁFICA DE SUSCRIPTORES */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-[2.5rem] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-8">
                <Users className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{t("chart_subs")}</h3>
              </div>
              
              {/* 🔥 MURO INQUEBRANTABLE: Scroll horizontal nativo, gráfica 100% fija de 600x300 */}
              <div className="w-full overflow-x-auto overflow-y-hidden pb-4 touch-pan-x">
                <div style={{ width: '600px', height: '300px' }}>
                  {mounted && chartData.length > 0 ? (
                    /* ❌ SIN ResponsiveContainer */
                    <BarChart width={600} height={300} data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="name" stroke="#444" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#444" tick={{fontSize: 10}} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: "#000", border: "1px solid #222", borderRadius: "12px", fontSize: "12px" }} />
                      <Bar dataKey="suscriptores" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : <EmptyChart />}
                </div>
              </div>
            </div>

          </section>

          {/* IMPACTO SOCIAL Y BALLENAS */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0b0b0b] border border-white/5 rounded-[2.5rem] p-8">
              <h2 className="text-lg font-black mb-8 flex items-center gap-2">
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

            <div className="bg-[#0b0b0b] border border-yellow-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
              <h2 className="text-[10px] uppercase font-black text-yellow-500 tracking-widest mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4" /> {t("top_fans_title")}
              </h2>
              <p className="text-xs text-gray-500 mb-8">{t("top_fans_desc")}</p>

              <div className="space-y-4">
                {topFans.length > 0 ? topFans.map((fan, index) => (
                  <div key={fan.id} className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-500">#{index + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-lg">{fan.avatar}</div>
                      <span className="text-xs font-bold truncate max-w-[80px]">@{fan.username}</span>
                    </div>
                    <span className="text-xs font-black text-green-400">${fan.spent.toFixed(2)}</span>
                  </div>
                )) : <div className="text-center py-10 opacity-30"><Award className="w-8 h-8 mx-auto mb-2" /><p className="text-[10px] uppercase font-bold">{t("no_records")}</p></div>}
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
    <div className="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
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
      <p className="text-[10px] uppercase font-bold text-gray-600">Sin datos para graficar</p>
    </div>
  );
}