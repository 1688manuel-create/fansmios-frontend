import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function Compliance2257Page() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">18 U.S.C. § 2257 Compliance</h1>
          </div>
          
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold mb-8">
            Exención de Responsabilidad de Mantenimiento de Registros (Record-Keeping Exemption)
          </div>

          <div className="space-y-6 text-sm leading-relaxed font-medium">
            <p>
              Fansmio VIP (la "Plataforma") opera como un proveedor de servicios interactivos (Interactive Computer Service) y no como un productor primario de contenido. Todo el contenido visual (imágenes y videos) es subido y generado por usuarios independientes ("Creadores").
            </p>
            <p>
              De conformidad con la ley federal de los Estados Unidos <strong>18 U.S.C. § 2257</strong> y <strong>28 C.F.R. Parte 75</strong>, la Plataforma y sus operadores están exentos de los requisitos de mantenimiento de registros aplicables a los productores primarios. 
            </p>
            <p>
              Sin embargo, en estricto cumplimiento de nuestras políticas internas de seguridad y para garantizar que ningún material ilícito o que involucre a menores sea alojado en nuestros servidores, exigimos a todos los Creadores que moneticen contenido someterse a un proceso estricto de Verificación de Identidad (KYC).
            </p>
            <h3 className="text-lg font-black text-white mt-6 mb-2">Declaración de los Creadores</h3>
            <p>
              Al utilizar la Plataforma, cada Creador declara y garantiza bajo pena de perjurio que:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Es mayor de 18 años de edad al momento de la creación del contenido.</li>
              <li>Todas las personas que aparecen en sus publicaciones han otorgado su consentimiento expreso, documentado y verificable.</li>
              <li>Mantiene en su posesión personal todos los registros de identificación requeridos por 18 U.S.C. § 2257 de todas las personas que aparecen en su contenido.</li>
            </ul>
            <p className="mt-6 text-gray-500 text-xs uppercase tracking-widest border-t border-white/10 pt-6">
              Para consultas de autoridades legales (Law Enforcement Inquiries), contacte a nuestro equipo legal de inmediato.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}