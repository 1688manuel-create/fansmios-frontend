import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function Consent18Page() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Declaración de Mayoría de Edad</h1>
          <h2 className="text-xl text-red-500 font-bold mb-8">ADVERTENCIA: CONTENIDO EXPLÍCITO PARA ADULTOS</h2>

          <div className="space-y-6 text-sm leading-relaxed font-medium text-gray-400 max-w-2xl mx-auto text-left">
            <p>
              Esta plataforma ("Fansmios VIP") contiene o puede contener información, imágenes, videos y otros materiales de naturaleza explícitamente sexual ("Material para Adultos").
            </p>
            
            <p className="text-white font-bold">
              Al acceder, navegar o registrarse en esta plataforma, usted declara, garantiza y jura bajo pena de perjurio lo siguiente:
            </p>

            <ol className="list-decimal pl-6 space-y-3 mt-4">
              <li>Tengo al menos dieciocho (18) años de edad, o he alcanzado la mayoría de edad en la jurisdicción desde la cual accedo a esta plataforma.</li>
              <li>Es legal en mi comunidad, estado o país ver y poseer Material para Adultos.</li>
              <li>Acepto la responsabilidad total por mis acciones al navegar por esta plataforma.</li>
              <li>Consiento voluntariamente estar expuesto a Material para Adultos y renuncio a cualquier derecho legal de afirmar que el material me resulta ofensivo o inaceptable.</li>
              <li>Prometo y garantizo que no permitiré que ningún menor de edad vea este sitio ni ningún material obtenido del mismo.</li>
            </ol>

            <div className="mt-10 p-6 bg-red-900/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400 font-bold">
                SI USTED NO TIENE 18 AÑOS O MÁS, O SI NO ESTÁ DE ACUERDO CON ESTAS CONDICIONES, DEBE ABANDONAR ESTE SITIO INMEDIATAMENTE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}