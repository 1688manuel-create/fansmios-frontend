import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Scale className="w-10 h-10 text-purple-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Notificación DMCA</h1>
          </div>
          
          <div className="space-y-6 text-sm leading-relaxed font-medium">
            <p>
              Fansmio VIP ("la Plataforma") respeta la propiedad intelectual de terceros y cumple con las disposiciones de la Ley de Derechos de Autor del Milenio Digital (DMCA, por sus siglas en inglés, 17 U.S.C. § 512).
            </p>

            <section>
              <h2 className="text-xl font-black text-white mb-3">1. Cómo presentar una notificación de infracción (Takedown Notice)</h2>
              <p>Si cree que su trabajo con derechos de autor ha sido copiado o alojado en nuestra Plataforma sin autorización, debe enviar una notificación por escrito a nuestro Agente Designado que incluya TODO lo siguiente:</p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-400 mt-3">
                <li>Una firma física o electrónica de una persona autorizada para actuar en nombre del propietario del derecho exclusivo que presuntamente se ha infringido.</li>
                <li>Identificación del trabajo con derechos de autor que se afirma ha sido infringido.</li>
                <li>Identificación del material que se afirma es infractor, e información razonablemente suficiente para permitirnos localizar el material (URLs exactas).</li>
                <li>Información razonablemente suficiente para permitirnos contactar a la parte reclamante (dirección, teléfono y correo electrónico).</li>
                <li>Una declaración de que la parte reclamante cree de buena fe que el uso del material no está autorizado por el propietario de los derechos de autor, su agente o la ley.</li>
                <li>Una declaración de que la información en la notificación es precisa y, bajo pena de perjurio, que la parte reclamante está autorizada para actuar en nombre del propietario.</li>
              </ol>
            </section>

            <section className="mt-8 bg-white/5 p-6 rounded-xl border border-white/10">
              <h2 className="text-lg font-black text-white mb-2">Contacto del Agente Designado DMCA:</h2>
              <p className="text-gray-400">
                Departamento Legal / DMCA Agent<br />
                Fansmio VIP<br />
                Correo electrónico: <a href="mailto:dmca@fansmio.com" className="text-purple-400 hover:underline">dmca@fansmio.com</a>
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-black text-white mb-3">2. Política de Infractores Reincidentes</h2>
              <p>De acuerdo con la DMCA y otras leyes aplicables, Fansmio ha adoptado una política de terminación, en circunstancias apropiadas, de los usuarios o creadores que sean considerados infractores reincidentes de derechos de autor.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}