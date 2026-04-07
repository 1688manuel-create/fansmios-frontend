import Link from "next/link";
import { ArrowLeft, AlertOctagon } from "lucide-react";
import { Metadata } from "next";

// 🔥 AQUÍ ESTÁ EL MISIL ANTI "CREATE NEXT APP"
export const metadata: Metadata = {
  title: 'Política de Contenido | FansMio',
  description: 'FansMio VIP opera bajo una política estricta de tolerancia cero hacia el contenido ilegal y no consensuado.',
};

export default function ContentPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <AlertOctagon className="w-10 h-10 text-orange-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Política de Contenido</h1>
          </div>
          
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold mb-8">
            Fansmio VIP opera bajo una política estricta de TOLERANCIA CERO hacia el contenido ilegal y no consensuado.
          </div>

          <div className="space-y-8 text-sm leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-black text-white mb-3">1. Contenido Estrictamente Prohibido</h2>
              <p>La publicación de cualquiera de los siguientes materiales resultará en la eliminación inmediata de la cuenta, congelación de fondos y el reporte a las autoridades competentes (incluyendo NCMEC y autoridades locales):</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400 mt-3">
                <li><strong className="text-red-400">Menores de edad:</strong> Cualquier contenido que represente, sugiera o involucre a personas menores de 18 años (incluyendo dibujos, animaciones o voces).</li>
                <li><strong className="text-red-400">Contenido No Consensuado:</strong> Material distribuido sin el consentimiento explícito de todos los participantes (Revenge Porn, cámaras ocultas, deepfakes/IA no autorizada).</li>
                <li><strong className="text-red-400">Violencia y Daño Físico:</strong> Representaciones de violencia real, automutilación, o abuso físico extremo.</li>
                <li><strong className="text-red-400">Zoofilia y Necrofilia:</strong> Cualquier interacción sexual con animales o cadáveres.</li>
                <li><strong className="text-red-400">Drogas Ilícitas:</strong> Promoción o venta de sustancias ilegales.</li>
                <li><strong className="text-red-400">Servicios de Escoltas/Prostitución:</strong> La plataforma no puede usarse para facilitar encuentros físicos a cambio de dinero.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">2. Moderación y Reportes</h2>
              <p>Fansmio VIP utiliza una combinación de moderación automatizada y revisión humana. Los usuarios (Fans y Creadores) tienen la obligación de reportar cualquier contenido que infrinja estas políticas utilizando el botón de "Reportar" disponible en cada publicación y mensaje.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">3. Consecuencias de la Infracción</h2>
              <p>Cualquier violación a esta política otorga a Fansmio el derecho irrevocable de:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400 mt-2">
                <li>Eliminar el contenido infractor.</li>
                <li>Suspender temporal o permanentemente la cuenta del usuario.</li>
                <li>Retener los fondos de la billetera del creador para compensar reembolsos o cubrir responsabilidades legales.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}